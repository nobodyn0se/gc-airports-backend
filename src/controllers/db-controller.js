const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const logger = require('../middleware/logger');

const fetchFirstThreeRows = async () => {
  try {
    logger.info('Attempting to fetch CSV data...');
    const response = await axios.get(process.env.CSV_URL);

    // Log the beginning of the response data to confirm it's being received
    logger.info(
      `CSV data fetched. First 200 characters: ${response.data.substring(0, 200)}`
    );

    const results = [];

    const stream = Readable.from(response.data); // Use response.data directly, csv-parser can handle it

    // Return a new Promise to handle the asynchronous stream parsing
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv()) // Pipe the stream to the csv-parser
        .on('data', (data) => {
          // This event fires for each parsed row
          if (results.length < 3) {
            results.push(data);
            logger.info(
              `Row ${results.length} collected: ${JSON.stringify(data)}`
            ); // Log each row as it's collected
          }
          // If we have enough rows, we can optionally destroy the stream to stop processing
          if (results.length === 3) {
            stream.destroy(); // Stop the stream once 3 rows are found
          }
        })
        .on('end', () => {
          // This event fires when the entire stream has been processed
          logger.info(
            `CSV parsing complete. First three rows: ${JSON.stringify(results)}`
          );
          resolve(results); // Resolve the promise with the collected results
        })
        .on('error', (err) => {
          // This event fires if any error occurs during stream processing
          logger.error(err.message);
          reject(err); // Reject the promise if an error occurs
        });
    });
  } catch (error) {
    // Catch errors from axios.get or initial stream creation
    console.error(
      'Error fetching or initializing CSV stream:',
      error.message
    );
    throw error; // Re-throw the error so the caller can handle it
  }
};

module.exports = fetchFirstThreeRows;
