import express from 'express';
const router = express.Router();
import logger from '../middleware/logger.mjs';
import { searchAirportByUser } from '../services/db.mjs';

router.get('/get/search', (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  if (!searchTerm) {
    const error = new Error('Search term is missing');
    error.status = 400;
    return next(error);
  }

  searchAirportByUser(searchTerm)
    .then((result) => {
      logger.info('/search route returned results successfully');
      res.status(200).json(result);
    })
    .catch(next);
});

export default router;
