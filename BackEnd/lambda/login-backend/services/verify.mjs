
import util from '../utils/util.mjs';
import { verifyToken } from '../utils/auth.mjs';

function verify(requestBody) {
  if (!requestBody || !requestBody.user?.username || !requestBody.token) {
    return util.buildResponse(401, {
      verified: false,
      message: 'incorrect request body'
    });
  }

  const { user, token } = requestBody;
  const verification = verifyToken(user.username, token);

  if (!verification.verified) {
    return util.buildResponse(401, verification);
  }

  return util.buildResponse(200, {
    verified: true,
    message: 'success',
    user,
    token
  });
}

export default { verify };
