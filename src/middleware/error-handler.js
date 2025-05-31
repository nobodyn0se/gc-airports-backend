const logger = require('./logger');
const {
  logLevel,
  publicErrorMessage,
} = require('../util/util');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  if (logLevel(statusCode) === 'warn') {
    logger.warn(err.message, {
      url: req.originalUrl,
      statusCode: statusCode,
    });
  } else {
    logger.error(err.message, {
      url: req.originalUrl,
      statusCode: statusCode,
    });
  }

  res.status(statusCode);
  res.json({
    url: req.originalUrl,
    status: statusCode,
    message: publicErrorMessage(statusCode),
  });
};

const notFoundHandler = (req, res, next) => {
  const error = new Error('Resource Not Found');
  error.status = 404;
  next(error);
};

module.exports = { errorHandler, notFoundHandler };
