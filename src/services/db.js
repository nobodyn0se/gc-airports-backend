const { Pool } = require('pg');

const logger = require('../middleware/logger');
const queries = require('../queries/airports-queries');

// Create a new pool instance using the connection string
const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: 20, // Maximum number of clients in the pool
});

// Function to test the connection
const testConnection = async () => {
  let client;

  try {
    client = await pool.connect();
    logger.info('Connected to the Postgres DB successfully!');
  } catch (err) {
    logger.error(`Couldn't connect to DB, ${err}`);
  } finally {
    if (client) {
      client.release();
    }
  }
};

const createAirportsTable = async () => {
  try {
    await pool.query(queries.createAirportsTableQuery);
    logger.info('Airports table created/exists in Postgres');
  } catch (err) {
    logger.error(`Error creating airports table ${err}`);
    // process.exit(1);
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
    airport.country,
  ]);

  const queryText = queries.batchUpsertAirportsQuery(
    columns.join(', '),
    valuePlaceholders
  );

  try {
    await client.query(queryText, values);
    logger.info(`Upserted a batch of ${airportsBatch.length} airports`);
  } catch (err) {
    logger.error(`Upsert Error, ${err}`);
  }
};

const batch_InsertAirports = async (dbClient, airports) => {
  if (airports.length === 0) return;

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
    'country',
  ];

  const valuePlaceholders = airports
    .map((airport, airportIndex) => {
      return `(${columns.map((col, colIndex) => `$${airportIndex * columns.length + colIndex + 1}`).join(', ')})`;
    })
    .join(', ');

  const values = airports.flatMap((airport) => [
    airport.id,
    airport.ident,
    airport.type,
    airport.name,
    airport.lat,
    airport.long,
    airport.elevation,
    airport.icao,
    airport.iata,
    airport.country,
  ]);

  const queryText = queries.insertAirportsBatchQuery(
    columns.join(', '),
    valuePlaceholders
  );

  await dbClient.query(queryText, values);
};

module.exports = {
  testConnection,
  createAirportsTable,
  batch_InsertAirports,
  batchUpsertAirports,
  pool,
};
