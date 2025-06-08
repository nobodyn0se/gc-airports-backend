const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger');
const {
  testConnection,
  pool,
  batchUpsertAirports,
  createAirportsTable,
  searchAirportByUser,
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
    sinon.stub(pool, 'query');

    loggerInfo = sinon.stub(logger, 'info');
    loggerError = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('DB Connection', () => {
    it('should connect to the DB successfully', async () => {
      pool.connect.resolves(client);

      await testConnection();

      expect(loggerInfo.calledOnce).to.be.true;
      expect(
        loggerInfo.calledWith('Connected to the Postgres DB successfully!')
      ).to.be.true;
      expect(client.release.calledOnce).to.be.true;
      expect(loggerError.calledOnce).to.be.false;
    });

    it('should fail to connect to the DB', async () => {
      pool.connect.rejects(new Error('Invalid URL'));

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
      pool.query.resolves();

      await createAirportsTable();
      expect(loggerInfo.calledOnce).to.be.true;
      expect(loggerInfo.calledWith('Airports table created/exists in Postgres'))
        .to.be.true;
      expect(loggerError.notCalled).to.be.true;
    });

    it('should log an error while creating airports table', async () => {
      pool.query.rejects(new Error('Table creation failed'));

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

    beforeEach(() => {
      delete require.cache[
        require.resolve('../../src/controllers/db-controller')
      ];

      searchAirportsByUser = require('../../src/services/db');
    });

    it('should successfully return a few records upon search', async () => {
      pool.query.resolves([
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
      ]);

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
      expect(pool.query.notCalled).to.be.true;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.notCalled).to.be.true;
    });

    it('should log an error if the query does not work', async () => {
      const mockSearchTerm = 'XYZ';
      pool.query.rejects(new Error('Error during search ops'));

      const { searchAirportByUser } = require('../../src/services/db');
      const results = await searchAirportByUser(mockSearchTerm);

      expect(results).to.be.undefined;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
    });
  });
});
