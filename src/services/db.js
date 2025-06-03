const { Pool } = require('pg');

const logger = require('../middleware/logger');

// Create a new pool instance using the connection string
const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: 20, // Maximum number of clients in the pool
});

// Function to test the connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info(
      'Connected to the Postgres DB successfully!'
    );
    client.release(); // Release the client back to the pool
  } catch (err) {
    logger.error(`Couldn't connect to DB, ${err}`);
  }
};

module.exports = testConnection;
