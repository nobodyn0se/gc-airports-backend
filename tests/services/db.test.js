const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger');
const {
  testConnection,
  pool,
  batchUpsertAirports,
} = require('../../src/services/db');

describe('DB Service Tests', () => {
  let client;
  let loggerInfo;
  let loggerError;

  beforeEach(() => {
    client = {
      release: sinon.stub(),
      query: sinon.stub(),
    };
    sinon.stub(pool, 'connect');
    loggerInfo = sinon.stub(logger, 'info');
    loggerError = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should connect to the DB successfully', async () => {
    pool.connect.resolves(client);

    await testConnection();

    expect(loggerInfo.calledOnce).to.be.true;
    expect(loggerInfo.calledWith('Connected to the Postgres DB successfully!'))
      .to.be.true;
    expect(client.release.calledOnce).to.be.true;
    expect(loggerError.calledOnce).to.be.false;
  });

  it('should fail to connect to the DB', async () => {
    pool.connect.rejects(new Error('Invalid URL'));

    await testConnection();

    expect(loggerError.calledOnce).to.be.true;
    expect(loggerError.calledWith("Couldn't connect to DB, Error: Invalid URL"))
      .to.be.true;
    expect(loggerInfo.notCalled).to.be.true;
  });

  it('should not execute upsert query if batch is empty', async () => {
    await batchUpsertAirports(client, []);
    expect(client.query.notCalled).to.be.true;
  });

  it('should upsert airports for a valid batch', async () => {
    const airportsBatch = [
      {
        id: 1,
        ident: 'ABC',
        type: 'airport',
        name: 'Test Airport',
        lat: 34.567,
        long: -123.456,
        elevation: 304,
        icao: 'ABCD',
        iata: 'XYZ',
        country: 'US',
      },
      {
        id: 2,
        ident: 'DEF',
        type: 'airport',
        name: 'Another Airport',
        lat: 45.678,
        long: -98.765,
        elevation: 609.6,
        icao: 'PWOG',
        iata: 'PWO',
        country: 'DE',
      },
    ];

    await batchUpsertAirports(client, airportsBatch);
    expect(client.query.calledOnce).to.be.true;
    expect(logger.info.calledOnce).to.be.true;
    expect(logger.info.calledWith('Upserted a batch of 2 airports')).to.be.true;
  });

  it('should log error if upsert fails', async () => {
    client.query.rejects(new Error('Upsert failed due to connection issue'));
    await batchUpsertAirports(client, ['dummy1', 'dummy2']);

    expect(loggerError.calledOnce).to.be.true;
    expect(loggerInfo.notCalled).to.be.true;
  });
});
