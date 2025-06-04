const express = require('express');
const router = express.Router();

const { createTestError } = require('../util/util');

router.get('/error/:statusCode', (req, res, next) => {
  if (req.ip === '::ffff:127.0.0.1') {
    next(createTestError(req.params.statusCode));
  } else {
    const error = new Error(
      'Denied error route access to an outsider'
    );
    error.statusCode = 403;
    next(error);
  }
});

module.exports = router;
