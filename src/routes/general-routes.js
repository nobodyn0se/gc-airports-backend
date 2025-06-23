const express = require('express');
const router = express.Router();
const logger = require('../middleware/logger');
const { createTestError } = require('../util/util');
const db = require('../services/db');

router.get('/get/search', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  if (!searchTerm) {
    const error = new Error('Search term is missing');
    error.status = 400;
    return next(error);
  }

  db.searchAirportByUser(searchTerm)
    .then((result) => {
      logger.info('/search route returned results successfully');
      res.status(200).json(result);
    })
    .catch(next);
});

module.exports = router;
