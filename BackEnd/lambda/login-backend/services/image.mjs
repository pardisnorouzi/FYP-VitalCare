
import AWS from 'aws-sdk';
import util from '../utils/util.mjs';

AWS.config.update({ region: 'eu-north-1' });
const s3 = new AWS.S3();
const bucketName = 'vitalcontentp';
const subfolder = 'temp';

function generateFileId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let fileId = '';
  for (let i = 0; i < 9; i++) {
    fileId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return fileId;
}

const filename = generateFileId();

async function uploadImage(requestBody) {
  try {
    const lines = requestBody.split('\r\n');
    const ofilename = lines[1].split('filename="')[1].split('"')[0];
    const fileExtension = ofilename.split('.').pop().trim();
    const filetype = lines[2].split(':')[1].trim();
    const filecontent = lines[4].trim();

    const params = {
      Bucket: bucketName,
      Key: `${subfolder}/${filename}.${fileExtension}`,
      Body: filecontent,
      ContentEncoding: 'utf8',
      ContentType: filetype
    };

    await s3.upload(params).promise();

    return util.buildResponse(200, { key: `${filename}.${fileExtension}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return util.buildResponse(500, { message: 'Error uploading file' });
  }
}

export default { uploadImage };
