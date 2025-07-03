import logger from '../middleware/logger.mjs';

const logLevel = (statusCode) => {
  let level;

  switch (statusCode) {
    case 429:
      level = 'warn';
      break;
    default:
      level = 'error';
  }

  return level;
};

const publicErrorMessage = (statusCode) => {
  let message;
  switch (statusCode) {
    case 400:
      message = 'Bad Request. Check the client-side request syntax';
      break;
    case 401:
      message = 'Access Denied. Please verify your credentials';
      break;
    case 403:
      message = 'Forbidden Access. This resource is inaccessible to you';
      break;
    case 404:
      message = 'Not Found. This page or route does not exist';
      break;
    case 429:
      message = 'Too Many Requests. Go easy there';
      break;
    case 500:
    default:
      message = `Internal Server Error. Could not pinpoint the error`;
      break;
  }

  return message;
};

const createTestError = (statusCode) => {
  let error = new Error(`This is a simulated ${statusCode} error`);
  error.status = parseInt(statusCode);
  return error;
};

const setPoolTypeParsers = (types) => {
  types.setTypeParser(20, parseInt); // bigint
  types.setTypeParser(21, parseInt); // smallint
  types.setTypeParser(23, parseInt); // integer
  types.setTypeParser(1700, parseFloat); // numeric

  logger.info('Type parsers set for int and float types');
};

export { logLevel, publicErrorMessage, createTestError, setPoolTypeParsers };
