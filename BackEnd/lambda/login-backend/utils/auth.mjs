
import jwt from 'jsonwebtoken';

function generateToken(userInfo) {
  if (!userInfo) {
    return null;
  }
  return jwt.sign(userInfo, 'secret', {
    expiresIn: '1h'
  });
}

function verifyToken(username, token) {
  try {
    const response = jwt.verify(token, 'secret');
    if (response.username !== username) {
      return {
        verified: false,
        message: 'invalid user'
      };
    }
    return {
      verified: true,
      message: 'verified'
    };
  } catch (error) {
    return {
      verified: false,
      message: 'invalid token'
    };
  }
}

export { generateToken, verifyToken };
