import * as pg from 'pg';
const types = pg.types;
const { Pool } = pg;

import logger from '../middleware/logger.mjs';
import {
  alterTableColumnQuery,
  addColumnQuery,
  createAirportsTableQuery,
  batchUpsertAirportsQuery,
  getSearchedAirportQuery,
} from '../queries/airports-queries.mjs';
import { setPoolTypeParsers } from '../util/util.mjs';

let pool;

const getPool = () => {
  if (!pool || pool.ended) {
    // Create a new pool instance using the connection string
    setPoolTypeParsers(types);

    pool = new Pool({
      connectionString: process.env.DB_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 120000,
    });

    pool.on('remove', () => {
      logger.warn('Pool connection ended, caught by listener');
    });

    logger.warn('Started a new pool at start or the previous one closed');
  }

  return pool;
};

const setPool = (newPool) => {
  pool = newPool;
};

// Function to test the connection
const testConnection = async () => {
  let client;

  try {
    const pool = getPool();
    client = await pool.connect();
    logger.info('Connected to the Postgres DB successfully!');
  } catch (err) {
    logger.error(`Couldn't connect to DB, ${err}`);
  } finally {
    if (client) {
      client.release();
      logger.warn('Pool connection released after connection check');
    }
  }
};

const createAirportsTable = async () => {
  try {
    const pool = getPool();
    await pool.query(createAirportsTableQuery);
    logger.info('Airports table created/exists in Postgres');
  } catch (err) {
    logger.error(`Error creating airports table`);
    throw err;
  }
};

const batchUpsertAirports = async (client, airportsBatch) => {
  if (airportsBatch.length === 0) {
    return;
  }

  const columns = [
    'id',
    'ident',
    'type',
    'name',
    'lat',
    'long',
    'elevation',
    'icao',
    'iata',
    'municipality',
    'country',
  ];

  const valuePlaceholders = airportsBatch
    .map((airport, airportIndex) => {
      return `(${columns.map((col, colIndex) => `$${airportIndex * columns.length + colIndex + 1}`).join(', ')})`;
    })
    .join(', ');

  const values = airportsBatch.flatMap((airport) => [
    airport.id,
    airport.ident,
    airport.type,
    airport.name,
    airport.lat,
    airport.long,
    airport.elevation,
    airport.icao,
    airport.iata,
    airport.municipality,
    airport.country,
  ]);

  const queryText = batchUpsertAirportsQuery(
    columns.join(', '),
    valuePlaceholders
  );

  try {
    await client.query(queryText, values);
    logger.info(`Upserted a batch of ${airportsBatch.length} airports`);
  } catch (err) {
    logger.error(`Upsert Error occurred`);
    throw err;
  }
};

const searchAirportByUser = async (searchTerm) => {
  if (searchTerm == null || searchTerm === '') {
    return;
  }

  const columnsToGet = [
    'name',
    'icao',
    'iata',
    'lat',
    'long',
    'municipality',
    'country',
  ];
  const queryText = getSearchedAirportQuery(columnsToGet);

  try {
    const pool = getPool();

    const results = await pool.query(queryText, [searchTerm]);
    logger.info(
      `Found ${results.rowCount} airports for search term: ${searchTerm}`
    );
    return results.rows;
  } catch (err) {
    logger.error(`Search error: ${err}`);
  }
};

const alterTableColumn = async (columnName, dataType) => {
  if (columnName && dataType) {
    const queryText = alterTableColumnQuery(columnName, dataType);

    try {
      const pool = getPool();
      await pool.query(queryText);
      logger.info(`Altered table column ${columnName} to type ${dataType}`);
    } catch (err) {
      logger.error(`Alter error, ${err}`);
    }
  }
};

const addTableColumn = async (columnName, dataType) => {
  if (columnName && dataType) {
    const queryText = addColumnQuery(columnName, dataType);

    try {
      const pool = getPool();
      await pool.query(queryText);
      logger.info(`Added column ${columnName} of type ${dataType}`);
    } catch (err) {
      logger.error(`Error adding column, ${columnName}`);
    }
  }
};

export {
  testConnection,
  createAirportsTable,
  batchUpsertAirports,
  searchAirportByUser,
  alterTableColumn,
  getPool,
  setPool,
  addTableColumn,
};
