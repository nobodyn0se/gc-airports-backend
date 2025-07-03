import logger from '../middleware/logger.mjs';
import { getPool } from './db.mjs';

const startTx = async () => {
  const pool = getPool();
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
  const pool = getPool();
  await pool.end();
  logger.info('Postgres DB Pool ended');
};

export { startTx, commitTx, rollbackTx, endPool };
