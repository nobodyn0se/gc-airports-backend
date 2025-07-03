import { Readable } from 'stream';
import csv from 'csv-parser';
import logger from '../middleware/logger.mjs';

const parseCsvData = async (csvData) => {
  const results = [];
  const stream = Readable.from(csvData);

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        logger.info(`Parsed ${results.length} rows from the original dataset`);
        resolve(results);
      })
      .on('error', (err) => {
        logger.error(err);
        reject(err);
      });
  });

  return results;
};

export { parseCsvData };
