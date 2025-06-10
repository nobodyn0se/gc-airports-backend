const { Readable } = require('stream');
// const csv = require('csv-parser');
const logger = require('../middleware/logger');

const parseCSVData = async (csvData, csv = require('csv-parser')) => {
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

module.exports = { parseCSVData };
