import AWS from 'aws-sdk';
import { buildResponse, getUserData, sendEmail } from '../utils/util.mjs';

AWS.config.update({ region: 'eu-north-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export async function handleChat(chatInfo) {
  const { action, username, touser, session, value } = chatInfo;
  try {
    switch (action) {
      case "createchat":
        return await createchat(username, touser);
      case "addchat":
        return await addchat(username, session, value);
      case "getchat":
        return await getchats(username, session);
      case "getchats":
        return await getallchats(username);
      case "getchatinfo":
        return await getchatinfo(session);
      case "getunread":
          return await getUnreadCount(username);
      default:
        return buildResponse(400, { message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error:", error);
    return buildResponse(500, { message: error.message });
  }
}

function generateId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let chatId = '';
  for (let i = 0; i < 9; i++) {
    chatId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return chatId;
}

async function createchat(username, touser) {
  const sessionId = generateId();
  const params = {
    TableName: 'chatsessions',
    Item: {
      sessionId,
      datecreated: new Date().toISOString(),
      fromuser: username,
      touser
    }
  };

  await dynamoDB.put(params).promise();
  return buildResponse(200, { sessionId });
}

async function addchat(username, session, value) {
  const chatId = generateId();
  const datesent = new Date().toISOString();

  const sessionInfo = await getchatinfoRaw(session);
  if (!sessionInfo) {
    return buildResponse(404, { message: "Chat session not found" });
  }

  const fromuser = sessionInfo.fromuser === username ? sessionInfo.touser : sessionInfo.fromuser;

  const params = {
    TableName: 'chats',
    Item: {
      chatId,
      sessionId: session,
      datesent,
      username,
      msg: value,
      read: false  
    }
  };

  await dynamoDB.put(params).promise();

  const user = await getUserData(username);
  if (user?.email) {
    const link = `https://pardisno.com/Chat/${session}`;
    await sendEmail(
      user.email,
      'New Chat Message',
      `<p>You have a new message from ${fromuser}. <a href="${link}">View Chat</a></p>`
    );
  }

  return buildResponse(200, { message: "Chat message added and email sent" });
}

async function getchats(username, session) {
  const params = {
    TableName: 'chats',
    FilterExpression: 'sessionId = :sessionId',
    ExpressionAttributeValues: { ':sessionId': session },
    ScanIndexForward: false
  };

  const result = await dynamoDB.scan(params).promise();
  const sortedChats = result.Items.sort((a, b) => new Date(b.datesent) - new Date(a.datesent));


  const unread = result.Items.filter(
    msg => msg.read === false && msg.username !== username
  );


  const updatePromises = unread.map(item => {
    return dynamoDB.update({
      TableName: 'chats',
      Key: { chatId: item.chatId },
      UpdateExpression: 'set #r = :true',
      ExpressionAttributeNames: { '#r': 'read' },
      ExpressionAttributeValues: { ':true': true }
    }).promise();
  });

  await Promise.all(updatePromises);

  return buildResponse(200, { chats: sortedChats });
}

async function getUnreadCount(username) {
  const user = await getUserData(username);
  const isDoctor = user?.role === 2;


  const chatParams = {
    TableName: 'chats',
    FilterExpression: 'username <> :user AND #r = :false',
    ExpressionAttributeNames: { '#r': 'read' },
    ExpressionAttributeValues: {
      ':user': username,
      ':false': false
    }
  };

  const result = await dynamoDB.scan(chatParams).promise();

  const sessionParams = {
    TableName: 'chatsessions',
    FilterExpression: 'fromuser = :u OR touser = :u',
    ExpressionAttributeValues: { ':u': username }
  };
  const sessionData = await dynamoDB.scan(sessionParams).promise();
  const sessionIds = sessionData.Items.map(item => item.sessionId);

  const unreadChats = result.Items.filter(msg => sessionIds.includes(msg.sessionId));

  let notifications = [];
  if (isDoctor) {
    const notifParams = {
      TableName: 'notifications',
      FilterExpression: 'username = :doctor AND #r = :false',
      ExpressionAttributeNames: { '#r': 'read' },
      ExpressionAttributeValues: {
        ':doctor': username,
        ':false': false
      }
    };

    const notifResult = await dynamoDB.scan(notifParams).promise();
    notifications = notifResult.Items || [];
  }

  return buildResponse(200, {
    unreadCount: unreadChats.length,
    unreadNotifications: notifications.length,
    notifications: notifications
  });
}


async function getallchats(username) {
  const params = {
    TableName: 'chatsessions',
    FilterExpression: 'fromuser = :username or touser = :username',
    ExpressionAttributeValues: { ':username': username }
  };

  const result = await dynamoDB.scan(params).promise();
  return result.Items.length > 0
    ? buildResponse(200, { chatSessions: result.Items })
    : buildResponse(404, { message: "No chat sessions found for this user" });
}

async function getchatinfo(session) {
  const chatInfo = await getchatinfoRaw(session);
  return chatInfo
    ? buildResponse(200, { chatInfo })
    : buildResponse(404, { message: "Chat info not found" });
}


async function getchatinfoRaw(session) {
  const params = {
    TableName: 'chatsessions',
    Key: { sessionId: session }
  };

  const result = await dynamoDB.get(params).promise();
  return result.Item;
}
