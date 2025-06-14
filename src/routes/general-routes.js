const express = require('express');
const router = express.Router();
const logger = require('../middleware/logger');
const { createTestError } = require('../util/util');
const db = require('../services/db');

router.get('/get/search', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  if (searchTerm) {
    db.searchAirportByUser(searchTerm)
      .then((result) => {
        logger.info('/search route returned results successfully');
        res.status(200).json(result);
      })
      .catch(next);
  }
});

router.get('/error/:statusCode', (req, res, next) => {
  if (req.ip === '::ffff:127.0.0.1') {
    next(createTestError(req.params.statusCode));
  } else {
    const error = new Error('Denied error route access to an outsider');
    error.statusCode = 403;
    next(error);
  }
});

module.exports = router;
