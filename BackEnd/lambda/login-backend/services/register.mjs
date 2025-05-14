
import AWS from 'aws-sdk';
import util from '../utils/util.mjs';
import bcrypt from 'bcryptjs';

AWS.config.update({ region: 'eu-north-1' });
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "users";

async function register(userInfo) {

    if (!userInfo || typeof userInfo !== 'object') {
        return util.buildResponse(400, { message: 'Invalid request body' });
    }

  const { name, email, username, password, address, birth, city, doctorName, role, imagekey } = userInfo;

  if (!name || !email || !username || !password || !address || !birth || !city || !role) {
    return util.buildResponse(401, { message: 'All fields are required!' });
  }

  if (role == 1) {
    return util.buildResponse(401, { message: 'Not Authorized!' });
  }

  if (role == 3 && !doctorName) {
    return util.buildResponse(401, { message: 'No doctor selected!' });
  }

  const dynamoUser = await getUser(username);
  if (dynamoUser && dynamoUser.username) {
    return util.buildResponse(401, { message: 'Username already exists' });
  }

  const image = await moveprofileimage(imagekey, username);
  const encryptedPW = bcrypt.hashSync(password.trim(), 10);
  const user = {
    name,
    email,
    username: username.toLowerCase().trim(),
    password: encryptedPW,
    address,
    birth,
    city,
    doctor: doctorName,
    role: parseInt(role),
    image
  };

  const saveUserResponse = await saveUser(user);
  if (!saveUserResponse) {
    return util.buildResponse(503, { message: 'Error Try Later' });
  }

  return util.buildResponse(200, { username });
}

async function moveprofileimage(imageKey, username) {
  const sourceBucket = 'vitalcontentp';
  const sourceKey = `temp/${imageKey}`;
  const fileExtension = imageKey.split('.').pop().trim();
  const destinationKey = `profile/${username}.${fileExtension}`;

  try {
    await s3.copyObject({
      Bucket: sourceBucket,
      CopySource: `/${sourceBucket}/${sourceKey}`,
      Key: destinationKey
    }).promise();

    await s3.deleteObject({
      Bucket: sourceBucket,
      Key: sourceKey
    }).promise();

    return `https://${sourceBucket}.s3.amazonaws.com/${destinationKey}`;
  } catch (error) {
    throw error;
  }
}

async function getUser(username) {
  const params = {
    TableName: userTable,
    Key: { username }
  };
  return await dynamodb.get(params).promise().then(response => response.Item, error => undefined);
}

async function saveUser(user) {
  const params = {
    TableName: userTable,
    Item: user
  };

  try {
    await dynamodb.put(params).promise();
    return true;
  } catch (error) {
    return false;
  }
}

export default { register };
