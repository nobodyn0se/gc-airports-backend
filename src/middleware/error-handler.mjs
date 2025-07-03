import logger from './logger.mjs';
import { logLevel, publicErrorMessage } from '../util/util.mjs';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  if (logLevel(statusCode) === 'warn') {
    logger.warn(err.message, {
      url: req?.originalUrl,
      statusCode: statusCode,
    });
  } else {
    logger.error(err.message, {
      url: req?.originalUrl,
      statusCode: statusCode,
    });
  }

  if (req && res) {
    res.status(statusCode);
    res.json({
      url: req.originalUrl,
      status: statusCode,
      message: publicErrorMessage(statusCode),
    });
  }
};

const notFoundHandler = (req, res, next) => {
  const error = new Error('Resource Not Found');
  error.status = 404;
  next(error);
};

export { errorHandler, notFoundHandler };
