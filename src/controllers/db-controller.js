import axios from 'axios';

import logger from '../middleware/logger.mjs';
import { processAirportData } from '../util/process-airport-data.mjs';
import { startTx, endPool, commitTx, rollbackTx } from '../services/tx.mjs';
import { readFileData, writeFileData } from '../util/file-util.mjs';
import { parseCsvData } from '../util/parse-csv-data.mjs';
import { batchUpsertAirports, createAirportsTable } from '../services/db.mjs';
import { errorHandler } from '../middleware/error-handler.mjs';

const fetchAndUpdateAirports = async (LOCAL_CSV_PATH, fileType = 'CSV') => {
  let csvData;
  let dbClient;

  try {
    if (process.env.NODE_ENV === 'dev') {
      csvData = await readFileData(LOCAL_CSV_PATH, fileType);
    }

    if (csvData == null) {
      logger.info('Fetching airport data from remote server...');
      const response = await axios.get(process.env.CSV_URL);
      csvData = response.data;

      if (process.env.NODE_ENV === 'dev') {
        await writeFileData(LOCAL_CSV_PATH, fileType, csvData);
      }
    }

    logger.info(
      `CSV data fetched. First 200 characters: ${csvData.substring(0, 200)}`
    );

    const results = await parseCsvData(csvData);

    const processedAirports = processAirportData(results);
    logger.info(
      `Processed ${processedAirports.length} where IATA, ICAO, lat, long are all present`
    );

    if (processedAirports.length > 0) {
      await createAirportsTable();
      const BATCH_SIZE = parseInt(process.env.BATCH_SIZE);

      dbClient = await startTx();

      for (let i = 0; i < processedAirports.length; i += BATCH_SIZE) {
        const batch = processedAirports.slice(i, i + BATCH_SIZE);
        await batchUpsertAirports(dbClient, batch);
      }

      await commitTx(dbClient);

      logger.info(
        `Upserted ${processedAirports.length} valid airports into Postgres DB`
      );
    } else {
      logger.info('No airports to update/insert today');
    }
  } catch (error) {
    errorHandler(error);

    if (dbClient) {
      await rollbackTx(dbClient);
    }
  } finally {
    if (dbClient) {
      await endPool();
    }
  }
};

export default fetchAndUpdateAirports;
