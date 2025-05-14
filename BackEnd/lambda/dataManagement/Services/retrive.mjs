import AWS from 'aws-sdk';

AWS.config.update({ region: 'eu-north-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function handleRetrieve(event) {
  const { action, currentuser, user: requestedUser } = event;

  try {
    switch (action) {
      case "userlist":
        return await getUserList(currentuser);
      case "sensordata":
        return await getSensorData(currentuser, requestedUser);
      case "doctorlist":
        return await getDoctorList();
      case "mydoctor":
        return await getmyDoctor(currentuser);
      default:
        return buildResponse(400, { message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error:", error);
    return buildResponse(500, { message: error.message });
  }
}

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

async function getUserData(username) {
  const params = {
    TableName: 'users',
    Key: { username }
  };

  const data = await dynamodb.get(params).promise();
  return data.Item;
}

async function getmyDoctor(currentUser) {
  const params = {
    TableName: 'users',
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: { ':username': currentUser }
  };

  const data = await dynamodb.scan(params).promise();
  if (data.Count === 0) return buildResponse(404, { message: 'User not found' });

  const doctorField = data.Items[0].doctor;
  const doctorParams = {
    TableName: 'users',
    FilterExpression: 'username = :doctor',
    ExpressionAttributeValues: { ':doctor': doctorField }
  };

  const doctorData = await dynamodb.scan(doctorParams).promise();
  if (doctorData.Count === 0) return buildResponse(404, { message: 'No users found for the provided doctor' });

  const users = doctorData.Items.map(item => ({
    username: item.username,
    name: item.name
  }));

  return buildResponse(200, users);
}

async function getDoctorList() {
  const params = {
    TableName: 'users',
    ProjectionExpression: 'username, #n, doctor, address, email, city',
    FilterExpression: '#r = :roleString OR #r = :roleNumber',
    ExpressionAttributeValues: {
      ':roleString': '2',
      ':roleNumber': 2
    },
    ExpressionAttributeNames: {
      '#n': 'name',
      '#r': 'role'
    }
  };

  const data = await dynamodb.scan(params).promise();
  return buildResponse(200, data.Items);
}

async function getUserList(currentUser) {
  const currentUserData = await getUserData(currentUser);

  if (currentUserData.role === 1) {
    const users = await getAllUsers();
    return buildResponse(200, users);
  } else if (currentUserData.role === 2) {
    const doctorPatients = await getUsersByDoctor(currentUser);
    return buildResponse(200, doctorPatients);
  } else {
    return buildResponse(403, { message: "Patients cannot access user list" });
  }
}

async function getSensorData(currentUser, requestedUser) {
  const currentUserData = await getUserData(currentUser);

  if (currentUserData.role === 3 && currentUser !== requestedUser) {
    return buildResponse(403, { message: "Patients cannot access other patients' data" });
  }


  if (currentUserData.role === 2) {
    const requestedUserData = await getUserData(requestedUser);
    if (requestedUserData.doctor !== currentUser) {
      return buildResponse(403, { message: "Doctor can only access own patients' data" });
    }

    await markNotificationsAsRead(currentUser, requestedUser);
  }

  const deviceId = await getDeviceIdByUsername(requestedUser);
  const sensorData = await getSensorDataByDevice(deviceId);
  return buildResponse(200, sensorData);
}

async function getAllUsers() {
  const params = {
    TableName: 'users',
    ProjectionExpression: 'username, #n, #r, doctor, birth, address, email, city',
    ExpressionAttributeNames: {
      '#n': 'name',
      '#r': 'role'
    }
  };

  const data = await dynamodb.scan(params).promise();
  for (let item of data.Items) {
    if (item.role === 3 && item.doctor) {
      const doctorData = await dynamodb.get({
        TableName: 'users',
        Key: { username: item.doctor },
        ProjectionExpression: '#n',
        ExpressionAttributeNames: { '#n': 'name' }
      }).promise();

      item.doctorname = doctorData.Item?.name;
    }

    if (item.role === 3) {
      const deviceData = await dynamodb.scan({
        TableName: 'devices',
        FilterExpression: 'username = :u',
        ExpressionAttributeValues: { ':u': item.username }
      }).promise();

      if (deviceData.Items.length > 0) {
        item.deviceId = deviceData.Items[0].deviceId;
      }
    }
  }

  return data.Items;
}

async function getUsersByDoctor(doctorUsername) {
  const params = {
    TableName: 'users',
    FilterExpression: 'doctor = :doctor',
    ExpressionAttributeValues: { ':doctor': doctorUsername },
    ProjectionExpression: 'username, #n, #r, doctor, birth, address, email, city',
    ExpressionAttributeNames: {
      '#n': 'name',
      '#r': 'role'
    }
  };

  const data = await dynamodb.scan(params).promise();
  return data.Items;
}

async function getDeviceIdByUsername(username) {
  const params = {
    TableName: 'devices',
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: { ':username': username }
  };

  const data = await dynamodb.scan(params).promise();
  if (data.Items.length > 0) {
    return data.Items[0].deviceId;
  } else {
    throw new Error("Device not found for the user");
  }
}

async function getSensorDataByDevice(deviceId) {
  const params = {
    TableName: 'sensor_data',
    KeyConditionExpression: 'deviceId = :id',
    ExpressionAttributeValues: { ':id': deviceId },
    ScanIndexForward: false
  };

  const data = await dynamodb.query(params).promise();
  return data.Items;
}


async function markNotificationsAsRead(doctorUsername, patientUsername) {
  const scanParams = {
    TableName: 'notifications',
    FilterExpression: 'username = :doc AND fromuser = :pat AND #r = :false',
    ExpressionAttributeNames: { '#r': 'read' },
    ExpressionAttributeValues: {
      ':doc': doctorUsername,
      ':pat': patientUsername,
      ':false': false
    }
  };

  const result = await dynamodb.scan(scanParams).promise();
  if (!result.Items.length) return;

  const updatePromises = result.Items.map(item => {
    return dynamodb.update({
      TableName: 'notifications',
      Key: {
        notificationId: item.notificationId
      },
      UpdateExpression: 'SET #r = :true',
      ExpressionAttributeNames: { '#r': 'read' },
      ExpressionAttributeValues: { ':true': true }
    }).promise();
  });

  await Promise.all(updatePromises);
}
