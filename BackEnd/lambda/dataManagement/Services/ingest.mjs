import AWS from 'aws-sdk';
import { buildResponse, getUserData, sendEmail } from '../utils/util.mjs';

AWS.config.update({ region: 'eu-north-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkDevice(deviceId) {
  const params = {
    TableName: 'devices',
    Key: { deviceId }
  };

  const data = await dynamodb.get(params).promise();
  return (data?.Item?.username) || null;
}

export async function handleIngest(body) {
  try {
    const { deviceId, sensorType, sensorValue, sessionId } = body;
    const timeStamp = new Date().toISOString();
    const username = await checkDevice(deviceId);

    if (!username) {
      return buildResponse(404, 'Device not found or not associated with a user');
    }

    const params = {
      TableName: 'sensor_data',
      Item: {
        deviceId,
        timeStamp,
        sensorType,
        sensorValue,
        sessionId
      }
    };

    await dynamodb.put(params).promise();

    const abnormal =
      (sensorType === 'HR' && (sensorValue < 50 || sensorValue > 110)) ||
      (sensorType === 'Temp' && (sensorValue < 34 || sensorValue > 37.9)) ||
      (sensorType === 'SPO2' && sensorValue < 94);

    if (abnormal) {
      const patient = await getUserData(username);
      const doctor = await getUserData(patient?.doctor);
    
      const notificationItem = {
        TableName: 'notifications',
        Item: {
          notificationId: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          username: doctor?.username, 
          fromuser: username,         
          deviceId,
          sensorType,
          sensorValue,
          sessionId,
          timeStamp,
          notiftext: `Abnormal ${sensorType} detected from patient ${username}: ${sensorValue}`,
          read: false
        }
      };
    
      await dynamodb.put(notificationItem).promise();
    
      if (doctor?.email) {
        const link = `https://pardisno.com/SensorData/${username}/`;
        await sendEmail(
          doctor.email,
          `Abnormal ${sensorType} Detected`,
          `<p>Patient ${username} has abnormal ${sensorType} value: ${sensorValue}. <a href="${link}">View Details</a></p>`
        );
      }
    }
      

    return buildResponse(200, 'Sensor data inserted successfully');
  } catch (error) {
    console.error('Error ingesting sensor data:', error);
    return buildResponse(500, 'Internal Server Error');
  }
}
