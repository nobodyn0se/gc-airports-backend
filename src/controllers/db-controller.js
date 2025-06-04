const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');

const logger = require('../middleware/logger');
const {
  processAirportData,
} = require('../services/process-airport-data');

const LOCAL_CSV_PATH = path.join(
  __dirname,
  '..',
  'uploads',
  'airports.csv'
);

const fetchFirstThreeRows = async () => {
  let csvData;

  console.log(LOCAL_CSV_PATH);

  try {
    if (process.env.NODE_ENV === 'dev') {
      try {
        await fs.access(LOCAL_CSV_PATH);
        logger.info(
          'Trying to read from existing local CSV file...'
        );

        csvData = await fs.readFile(LOCAL_CSV_PATH, 'utf8');
      } catch (readError) {
        logger.error(readError);
      }
    }

    if (csvData == null) {
      logger.info(
        'Fetching airport data from remote server...'
      );
      const response = await axios.get(process.env.CSV_URL);
      csvData = response.data;

      if (process.env.NODE_ENV === 'dev') {
        const uploadsDir = path.dirname(LOCAL_CSV_PATH);
        try {
          await fs.mkdir(uploadsDir, { recursive: true });
          logger.info(
            'Local uploads directory detected. Saving data...'
          );

          await fs.writeFile(
            LOCAL_CSV_PATH,
            csvData,
            'utf8'
          );
          logger.info('CSV data saved to local file');
        } catch (dirError) {
          logger.error(dirError);
        }
      }
    }

    logger.info(
      `CSV data fetched. First 200 characters: ${csvData.substring(0, 200)}`
    );

    const results = [];

    const stream = Readable.from(csvData);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          logger.info(
            `Parsed ${results.length} rows from the original dataset`
          );

          resolve();
        })
        .on('error', (err) => {
          logger.error(err);
          reject(err);
        });
    });

    const processedAirports = processAirportData(results);
    logger.info(
      `Processed ${processedAirports.length} where IATA, ICAO, lat, long are all present`
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = fetchFirstThreeRows;
