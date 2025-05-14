import { buildResponse } from './utils/util.mjs';
import { handleRetrieve } from './Services/retrive.mjs';
import { handleIngest } from './Services/ingest.mjs';
import { handleChat } from './Services/chats.mjs';

const healthPath = '/health';
const ingestPath = '/ingest';
const retrivePath = '/retrive';
const chatsPath = '/chats';

export const handler = async (event) => {
  console.log('Request Event: ', event);
  let response;
  let body;
  switch (true) {
    case event.httpMethod === 'GET' && event.path === healthPath:
      response = buildResponse(200);
      break;
    case event.httpMethod === 'POST' && event.path === ingestPath:
      body = JSON.parse(event.body);
      response = await handleIngest(body);
      break;
    case event.httpMethod === 'POST' && event.path === retrivePath:
      body = JSON.parse(event.body);
      response = await handleRetrieve(body);
      break;
    case event.httpMethod === 'POST' && event.path === chatsPath:
      body = JSON.parse(event.body);
      response = await handleChat(body);
      break;
    default:
      response = buildResponse(404, '404 Not Found!');
  }
  return response;
};
