const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger.mjs');

const {
  startTx,
  commitTx,
  rollbackTx,
  endPool,
} = require('../../src/services/tx.mjs');
const { pool, setPool } = require('../../src/services/db.mjs');

describe('DB Transaction Tests', () => {
  let mockDBClient;
  let mockPool;

  beforeEach(() => {
    mockPool = {
      query: sinon.stub(),
      release: sinon.stub(),
      on: sinon.stub(),
      connect: sinon.stub(),
      end: sinon.stub(),
    };

    setPool(mockPool);
    mockDBClient = { query: sinon.stub(), release: sinon.stub() };

    sinon.stub(logger, 'info');
  });

  afterEach(() => {
    sinon.restore();
    setPool(null);
  });

  it('should start a transaction and return a client', async () => {
    mockPool.connect.resolves(mockDBClient);
    mockDBClient.query.resolves();
    const client = await startTx();

    expect(mockPool.connect.calledOnce).to.be.true;
    expect(client.query.calledWith('BEGIN')).to.be.true;
    expect(client).to.deep.equal(mockDBClient);
    expect(logger.info.calledWith('Starting a Postgres transaction')).to.be
      .true;
  });

  it('should commit DB transaction and release the client', async () => {
    mockDBClient.query.resolves();
    await commitTx(mockDBClient);

    expect(mockDBClient.query.calledWith('COMMIT')).to.be.true;
    expect(mockDBClient.release.calledOnce).to.be.true;
    expect(logger.info.calledWith('Committed a Postgres transaction')).to.be
      .true;
  });

  it('should rollback DB transaction and release the client', async () => {
    mockDBClient.query.resolves();
    await rollbackTx(mockDBClient);

    expect(mockDBClient.query.calledWith('ROLLBACK')).to.be.true;
    expect(mockDBClient.release.calledOnce).to.be.true;
    expect(
      logger.info.calledWith('Rolled back the latest Postgres transaction')
    ).to.be.true;
  });

  it('should end the pool', async () => {
    mockPool.end.resolves();
    await endPool();

    expect(mockPool.end.calledOnce).to.be.true;
    expect(logger.info.calledWith('Postgres DB Pool ended')).to.be.true;
  });
});
