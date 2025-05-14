
import AWS from 'aws-sdk';
import util from '../utils/util.mjs';

AWS.config.update({ region: 'eu-north-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function user(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    return util.buildResponse(400, { message: 'Invalid request body' });
  }

  const { action, username, deviceId, attr, value } = userInfo;

  try {
    switch (action) {
      case "deleteuser":
        return await deleteUser(username);
      case "updatedevice":
        return await updateDevice(username, deviceId);
      case "edituser":
        return await editUser(username, attr, value);
      default:
        return util.buildResponse(400, { message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error:", error);
    return util.buildResponse(500, { message: error.message });
  }
}

async function editUser(username, attr, value) {
  return util.buildResponse(200, { message: 'editUser function placeholder' });
}

async function updateDevice(username, deviceId) {
  return util.buildResponse(200, "Here");
}

async function getDevice(username) {
  const devicesParams = {
    TableName: 'devices',
    FilterExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username
    }
  };
  try {
    const devicesResult = await dynamoDB.scan(devicesParams).promise();
    if (devicesResult.Items.length > 0) {
      return devicesResult.Items[0].deviceId.toString();
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function deleteUser(username) {
  if (username) {
    try {
      const duser = await getUser(username);
      if (duser) {
        if (duser.role === 3) {
          const deviceId = await getDevice(username);
          if (deviceId) {
            const params = {
              TableName: 'sensor_data',
              FilterExpression: 'deviceId = :deviceId',
              ExpressionAttributeValues: {
                ':deviceId': deviceId
              }
            };
            const scanResult = await dynamoDB.scan(params).promise();
            if (scanResult.Items.length > 0) {
              const deletePromises = scanResult.Items.map(item => {
                const deleteParams = {
                  TableName: 'sensor_data',
                  Key: {
                    deviceId: item.deviceId,
                    timeStamp: item.timeStamp
                  }
                };
                return dynamoDB.delete(deleteParams).promise();
              });
              await Promise.all(deletePromises);
            }
            const clearUsernameParams = {
              TableName: 'devices',
              Key: {
                deviceId: deviceId
              },
              UpdateExpression: 'SET username = :emptyUsername',
              ExpressionAttributeValues: {
                ':emptyUsername': ''
              }
            };
            await dynamoDB.update(clearUsernameParams).promise();
          }
        } else if (duser.role === 2) {
          const updateUsersParams = {
            TableName: 'users',
            FilterExpression: 'doctor = :doctor',
            ExpressionAttributeValues: {
              ':doctor': username,
              ':emptyString': ''
            },
            UpdateExpression: 'SET doctor = :emptyString'
          };
          await dynamoDB.scan(updateUsersParams).promise();
        }
        const deleteUserParams = {
          TableName: 'users',
          Key: {
            username: username
          }
        };
        await dynamoDB.delete(deleteUserParams).promise();
        return util.buildResponse(200, { message: 'User deleted successfully' });
      } else {
        return util.buildResponse(400, { message: 'user does not exist' });
      }
    } catch (error) {
      return util.buildResponse(500, { message: 'Internal Server Error' });
    }
  } else {
    return util.buildResponse(400, { message: 'Bad Request: invalid attributes' });
  }
}

async function getUser(username) {
  const params = {
    TableName: "users",
    Key: {
      username: username
    }
  };
  return await dynamoDB.get(params).promise().then(
    response => response.Item,
    error => false
  );
}

export default { user };
