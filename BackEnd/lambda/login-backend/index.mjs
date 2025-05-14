
import registerService from './services/register.mjs';
import loginService from './services/login.mjs';
import verifyService from './services/verify.mjs';
import userService from './services/user.mjs';
import util from './utils/util.mjs';
import imageService from './services/image.mjs';

const healthPath = '/health';
const registerPath = '/register';
const loginPath = '/login';
const verifyPath = '/verify';
const userPath = '/user';
const imagePath = '/image';

export async function handler(event) {
  console.log("Request Event: ", event);
  let response;
  switch(true){
    case event.httpMethod === 'GET' && event.path === healthPath:
      response = util.buildResponse(200, { message: "OK" });
      break;
    case event.httpMethod === 'POST' && event.path === registerPath:
      const registerBody = JSON.parse(event.body);
      response = await registerService.register(registerBody);
      break;
    case event.httpMethod === 'POST' && event.path === loginPath:
      const loginBody = JSON.parse(event.body);
      response = await loginService.login(loginBody);
      break;
    case event.httpMethod === 'POST' && event.path === verifyPath:
      const verifyBody = JSON.parse(event.body);
      response = await verifyService.verify(verifyBody);
      break;
    case event.httpMethod === 'POST' && event.path === userPath:
      const userBody = JSON.parse(event.body);
      response = await userService.user(userBody);
      break;
    case event.httpMethod === 'POST' && event.path === imagePath: 
      response = await imageService.uploadImage(event.body); 
      break;
    default:
      response = util.buildResponse(404, { error: 'Route not found' });
  }

  return response;
}
