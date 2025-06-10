const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger');
const {
  testConnection,
  pool,
  batchUpsertAirports,
  createAirportsTable,
  searchAirportByUser,
  setPool,
  getPool,
} = require('../../src/services/db');

describe('DB Service Tests', () => {
  let client;
  let loggerInfo;
  let loggerError;

  let poolStub;

  beforeEach(() => {
    client = {
      release: sinon.stub(),
      query: sinon.stub(),
    };

    poolStub = {
      connect: sinon.stub().resolves(client), // Stub connect to resolve to the client
      on: sinon.stub(), // Stub the on method for event listeners
      ended: false, // Simulate that the pool is not ended
      query: sinon.stub(),
    };

    setPool(poolStub);

    // Stub the getPool function to return the mock pool
    sinon.stub(require('../../src/services/db'), 'getPool').returns(poolStub);

    loggerInfo = sinon.stub(logger, 'info');
    loggerError = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
    setPool(null);
  });

  describe('DB Connection', () => {
    it('should connect to the DB successfully', async () => {
      // pool.connect.resolves(client);

      await testConnection();

      expect(loggerInfo.calledOnce).to.be.true;
      expect(
        loggerInfo.calledWith('Connected to the Postgres DB successfully!')
      ).to.be.true;
      expect(client.release.calledOnce).to.be.true;
      expect(loggerError.calledOnce).to.be.false;
    });

    it('should fail to connect to the DB', async () => {
      const mockPool = getPool();
      mockPool.connect.rejects(new Error('Invalid URL'));

      await testConnection();

      expect(loggerError.calledOnce).to.be.true;
      expect(
        loggerError.calledWith("Couldn't connect to DB, Error: Invalid URL")
      ).to.be.true;
      expect(loggerInfo.notCalled).to.be.true;
    });
  });

  describe('DB Upsert', () => {
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
      expect(loggerInfo.calledOnce).to.be.true;
      expect(loggerInfo.calledWith('Upserted a batch of 2 airports')).to.be
        .true;
    });

    it('should log error if upsert fails', async () => {
      client.query.rejects(new Error('Upsert failed due to connection issue'));

      const airportsBatch = [
        {
          id: 1,
          ident: 'DUMMY1',
          type: 'airport',
          name: 'Dummy Airport 1',
          lat: 0,
          long: 0,
          elevation: 100,
          icao: 'DUM1',
          iata: 'D1',
          country: 'Country1',
        },
        {
          id: 2,
          ident: 'DUMMY2',
          type: 'airport',
          name: 'Dummy Airport 2',
          lat: 1,
          long: 1,
          elevation: 200,
          icao: 'DUM2',
          iata: 'D2',
          country: 'Country2',
        },
      ];

      batchUpsertAirports(client, airportsBatch).catch((_) => {
        expect(loggerError.calledOnce).to.be.true;
        expect(loggerInfo.notCalled).to.be.true;
      });
    });
  });

  describe('DB Create Table', () => {
    it('should create a DB airports table successfully', async () => {
      const mockPool = getPool();
      expect(mockPool).to.deep.equal(poolStub);

      mockPool.query.resolves();

      await createAirportsTable();
      expect(loggerInfo.calledOnce).to.be.true;
      expect(loggerInfo.calledWith('Airports table created/exists in Postgres'))
        .to.be.true;
      expect(loggerError.notCalled).to.be.true;
    });

    it('should log an error while creating airports table', async () => {
      const mockPool = getPool();
      mockPool.query.rejects(new Error('Table creation failed'));

      createAirportsTable().catch((error) => {
        expect(loggerInfo.notCalled).to.be.true;

        expect(
          loggerError.calledWithMatch(
            sinon.match
              .instanceOf(Error)
              .and(sinon.match.has('message', 'Error creating airports table'))
          )
        );

        expect(loggerError.calledOnce).to.be.true;
      });
    });
  });

  describe('Airport Search Tests', () => {
    let searchAirportsByUser;
    let mockPool;

    beforeEach(() => {
      searchAirportsByUser = require('../../src/services/db');
      mockPool = getPool();
    });

    it('should successfully return a few records upon search', async () => {
      mockPool.query.resolves({
        rows: [
          {
            name: 'Newark Liberty International Airport',
            icao: 'KEWR',
            iata: 'EWR',
          },
          {
            name: 'New Orleans Louis Armstrong International Airport',
            icao: 'KMSY',
            iata: 'MSY',
          },
        ],
        rowCount: 2,
      });

      const mockSearchTerm = 'NEW';
      const { searchAirportByUser } = require('../../src/services/db');

      const results = await searchAirportByUser(mockSearchTerm);

      expect(results.length).to.equal(2);
      expect(loggerInfo.calledOnce).to.be.true;
      expect(loggerInfo.calledWith('Found 2 airports for search term: NEW'));
    });

    it('should return nothing if the searchTerm is empty', async () => {
      const mockSearchTerm = '';
      const { searchAirportByUser } = require('../../src/services/db');

      const results = await searchAirportByUser(mockSearchTerm);

      expect(results).to.be.undefined;
      expect(mockPool.query.notCalled).to.be.true;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.notCalled).to.be.true;
    });

    it('should log an error if the query does not work', async () => {
      const mockSearchTerm = 'XYZ';
      mockPool.query.rejects(new Error('Error during search ops'));

      const { searchAirportByUser } = require('../../src/services/db');
      const results = await searchAirportByUser(mockSearchTerm);

      expect(results).to.be.undefined;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
    });
  });
});
