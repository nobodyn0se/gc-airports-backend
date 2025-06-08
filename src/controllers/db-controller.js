const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');

const db = require('../services/db');
const logger = require('../middleware/logger');
const { processAirportData } = require('../services/process-airport-data');
const tx = require('../services/tx');
const { readFileData, writeFileData } = require('../util/file-util');
const { parseCSVData } = require('../util/parse-csv-data');
const { createAirportsTable } = require('../services/db');
const { errorHandler } = require('../middleware/error-handler');

const LOCAL_CSV_PATH = path.join(__dirname, '..', 'uploads', 'airports.csv');

const fetchAndUpdateAirports = async (LOCAL_CSV_PATH, fileType = 'CSV') => {
  let csvData;
  let dbClient;

  try {
    if (process.env.NODE_ENV === 'dev') {
      csvData = await readFileData(LOCAL_CSV_PATH, 'CSV');
    }

    if (csvData == null) {
      logger.info('Fetching airport data from remote server...');
      const response = await axios.get(process.env.CSV_URL);
      csvData = response.data;

      if (process.env.NODE_ENV === 'dev') {
        await writeFileData(LOCAL_CSV_PATH, 'CSV', csvData);
      }
    }

    logger.info(
      `CSV data fetched. First 200 characters: ${csvData.substring(0, 200)}`
    );

    const results = await parseCSVData(csvData);

    const processedAirports = processAirportData(results);
    logger.info(
      `Processed ${processedAirports.length} where IATA, ICAO, lat, long are all present`
    );

    if (processedAirports.length > 0) {
      await createAirportsTable();
      const BATCH_SIZE = process.env.BATCH_SIZE;

      dbClient = await tx.startTx();

      for (let i = 0; i < processedAirports.length; i += BATCH_SIZE) {
        const batch = processedAirports.slice(i, i + BATCH_SIZE);
        await db.batchUpsertAirports(dbClient, batch);
      }

      await tx.commitTx(dbClient);

      logger.info(
        `Upserted ${processedAirports.length} valid airports into Postgres DB`
      );
    } else {
      logger.info('No airports to update/insert today');
    }
  } catch (error) {
    errorHandler(error);

    if (dbClient) {
      await tx.rollbackTx(dbClient);
    }
  } finally {
    if (dbClient) {
      await tx.endPool();
    }
  }
};

module.exports = fetchAndUpdateAirports;
