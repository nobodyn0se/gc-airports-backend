const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger');

const {
  startTx,
  commitTx,
  rollbackTx,
  endPool,
} = require('../../src/services/tx');
const { pool } = require('../../src/services/db');

describe('DB Transaction Tests', () => {
  let poolConnectStub;
  let clientQueryStub;
  let clientReleaseStub;
  let poolEndStub;

  let mockDBClient;

  beforeEach(() => {
    mockDBClient = { query: sinon.stub(), release: sinon.stub() };
    poolConnectStub = sinon.stub(pool, 'connect').resolves(mockDBClient);

    poolEndStub = sinon.stub(pool, 'end');

    clientQueryStub = mockDBClient.query;
    clientQueryStub.reset();
    clientReleaseStub = mockDBClient.release;

    sinon.stub(logger, 'info');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should start a transaction and return a client', async () => {
    const client = await startTx();

    expect(poolConnectStub.calledOnce).to.be.true;
    expect(clientQueryStub.calledWith('BEGIN')).to.be.true;
    expect(client).to.deep.equal(mockDBClient);
    expect(logger.info.calledWith('Starting a Postgres transaction')).to.be
      .true;
  });

  it('should commit DB transaction and release the client', async () => {
    await commitTx(mockDBClient);

    expect(clientQueryStub.calledWith('COMMIT')).to.be.true;
    expect(clientReleaseStub.calledOnce).to.be.true;
    expect(logger.info.calledWith('Committed a Postgres transaction')).to.be
      .true;
  });

  it('should rollback DB transaction and release the client', async () => {
    await rollbackTx(mockDBClient);

    expect(clientQueryStub.calledWith('ROLLBACK')).to.be.true;
    expect(clientReleaseStub.calledOnce).to.be.true;
    expect(
      logger.info.calledWith('Rolled back the latest Postgres transaction')
    ).to.be.true;
  });

  it('should end the pool', async () => {
    await endPool();

    expect(poolEndStub.calledOnce).to.be.true;
    expect(logger.info.calledWith('Postgres DB Pool ended')).to.be.true;
  });
});
