
import AWS from 'aws-sdk';
import util from '../utils/util.mjs';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/auth.mjs';

AWS.config.update({ region: 'eu-north-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "users";

async function login(user) {
    if (!user || !user.username || !user.password) {
      return util.buildResponse(401, { message: 'username and password required' });
    }
  
    const { username, password } = user;
  
    const dynamoUser = await getUser(username);
    if (!dynamoUser || !dynamoUser.username) {
      return util.buildResponse(403, { message: 'userr/pass wrong!' });
    }
  
    if (!bcrypt.compareSync(password, dynamoUser.password)) {
      return util.buildResponse(403, { message: 'user/pass wrong!' });
    }
  
    const userInfo = {
      username: dynamoUser.username,
      name: dynamoUser.name,
      role: dynamoUser.role
    };
  
    const token = generateToken(userInfo);
    return util.buildResponse(200, { user: userInfo, token });
  }

async function getUser(username) {
  const params = {
    TableName: userTable,
    Key: { username }
  };
  return await dynamodb.get(params).promise().then(response => response.Item, error => undefined);
}

export default { login };
