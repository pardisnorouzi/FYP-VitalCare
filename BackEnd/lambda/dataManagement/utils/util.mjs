import AWS from 'aws-sdk';
AWS.config.update({ region: 'eu-north-1' });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();

export function buildResponse(statusCode, body = {}) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

export async function getUserData(username) {
  const params = {
    TableName: 'users',
    Key: { username }
  };
  const data = await dynamodb.get(params).promise();
  return data.Item;
}

export async function sendEmail(to, subject, bodyHtml) {
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: { Charset: 'UTF-8', Data: bodyHtml }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: 'VitalCare <vc@pardisno.com>'
  };

  await ses.sendEmail(params).promise();
}
