const logger = require('../middleware/logger');
const { pool } = require('./db');

const startTx = async () => {
  const client = await pool.connect();
  await client.query('BEGIN');
  logger.info('Starting a Postgres transaction');
  return client;
};

const commitTx = async (client) => {
  await client.query('COMMIT');
  logger.info('Committed a Postgres transaction');
  client.release();
};

const rollbackTx = async (client) => {
  await client.query('ROLLBACK');
  logger.info('Rolled back the latest Postgres transaction');
  client.release();
};

const endPool = async () => {
  await pool.end();
  logger.info('Postgres DB Pool ended');
};

module.exports = { startTx, commitTx, rollbackTx, endPool };
