const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { Readable } = require('stream');
const csv = require('csv-parser');

const fileUtil = require('../../src/util/file-util');
const db = require('../../src/services/db');
const tx = require('../../src/services/tx');
const logger = require('../../src/middleware/logger');
const parseCSVData = require('../../src/util/parse-csv-data'); // Adjust the path accordingly

describe('DB Controller Tests', () => {
  let readFileDataStub;
  let writeFileDataStub;
  let axiosGetStub;
  let dbClientStub;
  let startTxStub;
  let commitTxStub;
  let rollbackTxStub;
  let endPoolStub;
  let fetchAndUpdateAirports;

  let dummyCSVPath;
  let parseCSVStub;

  beforeEach(() => {
    process.env.NODE_ENV = 'dev';
    require('dotenv').config({
      path: `.env.${process.env.NODE_ENV}`,
      debug: false,
    });

    dummyCSVPath = `path/test_${Date.now()}`; // Ensure unique path per test

    readFileDataStub = sinon.stub(fileUtil, 'readFileData');
    writeFileDataStub = sinon.stub(fileUtil, 'writeFileData');

    axiosGetStub = sinon.stub(axios, 'get');
    dbClientStub = {
      query: sinon.stub(),
      release: sinon.stub(),
    };

    startTxStub = sinon.stub(tx, 'startTx').returns(dbClientStub);
    commitTxStub = sinon.stub(tx, 'commitTx');
    rollbackTxStub = sinon.stub(tx, 'rollbackTx');
    endPoolStub = sinon.stub(tx, 'endPool');

    parseCSVStub = sinon.stub(parseCSVData, 'parseCSVData');

    delete require.cache[
      require.resolve('../../src/controllers/db-controller')
    ];

    sinon.stub(db, 'createAirportsTable');

    // require after all stubbing OR the test fails due to implementation override
    fetchAndUpdateAirports = require('../../src/controllers/db-controller');

    // Mock logger
    sinon.stub(logger, 'info');
    sinon.stub(logger, 'error');
  });

  afterEach(async () => {
    await sinon.restore();
  });

  it('should fetch and process airport data from remote server', async () => {
    const mockCsvData =
      'iata_code,icao_code,latitude_deg,longitude_deg\nABC,XYZ,12.34,56.78\n';
    readFileDataStub.resolves(null);
    axiosGetStub.resolves({ data: mockCsvData });
    writeFileDataStub.resolves();

    const processAirportDataStub = sinon
      .stub()
      .returns([{ iata: 'ABC', icao: 'XYZ', lat: 12.34, long: 56.78 }]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    parseCSVStub.resolves([
      {
        iata_code: 'ABC',
        icao_code: 'XYZ',
        latitude_deg: 12.34,
        longitude_deg: 56.78,
      },
    ]);

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(axiosGetStub.calledOnce).to.be.true;
    expect(writeFileDataStub.calledOnce).to.be.true;
    expect(startTxStub.notCalled).to.be.true;
    expect(commitTxStub.notCalled).to.be.true;
    expect(rollbackTxStub.notCalled).to.be.true;
    expect(logger.info.called).to.be.true;
  });

  it('should handle errors during data fetching', async () => {
    axiosGetStub.rejects(new Error('Network Error'));
    readFileDataStub.resolves(null);

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.notCalled).to.be.true;
    expect(rollbackTxStub.notCalled).to.be.true;
    expect(logger.error.calledOnce).to.be.true;
  });

  it('should read from local CSV if in dev mode', async () => {
    const mockCsvData =
      'id,iata_code,icao_code,latitude_deg,longitude_deg\n1337,ABC,XYZ,12.34,56.78\n';
    readFileDataStub.resolves(mockCsvData);

    const processAirportDataStub = sinon
      .stub()
      .returns([
        { id: 1337, iata: 'ABC', icao: 'XYZ', lat: 12.34, long: 56.78 },
      ]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    parseCSVStub.resolves([
      {
        id: 1337,
        iata_code: 'ABC',
        icao_code: 'XYZ',
        latitude_deg: 12.34,
        longitude_deg: 56.78,
      },
    ]);

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(readFileDataStub.calledOnce).to.be.true;
    expect(axiosGetStub.notCalled).to.be.true;
    expect(startTxStub.calledOnce).to.be.true;
    expect(commitTxStub.calledOnce).to.be.true;
  });

  it('should handle empty airport data', async () => {
    const mockCsvData = 'IATA,ICAO,lat,long\n';
    axiosGetStub.resolves({ data: mockCsvData });
    readFileDataStub.resolves(null);
    writeFileDataStub.resolves();

    const processAirportDataStub = sinon.stub().returns([]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    parseCSVStub.resolves([]);

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.notCalled).to.be.true;
    expect(commitTxStub.notCalled).to.be.true;
    expect(logger.info.calledWith('No airports to update/insert today')).to.be
      .true;
  });

  it('should handle errors during CSV parsing', async () => {
    const mockCsvData = 'IATA,ICAO,lat,long\nABC,XYZ,12.34,56.78\n';
    axiosGetStub.resolves({ data: mockCsvData });
    readFileDataStub.resolves(null);
    writeFileDataStub.resolves();

    // Simulate an error during CSV parsing
    parseCSVStub.throws(new Error('Stream Error'));

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.notCalled).to.be.true;
    expect(commitTxStub.notCalled).to.be.true;
    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.getCall(0).args[0]).to.deep.equal('Stream Error');
  });

  it('should batch upsert airports into the database', async () => {
    const mockCsvData =
      'id,iata_code,icao_code,latitude_deg,longitude_deg\n3011,ABC,XYZ,12.34,56.78\n80085,DEF,GHI,23.45,67.89\n';
    axiosGetStub.resolves({ data: mockCsvData });
    readFileDataStub.resolves(null);
    writeFileDataStub.resolves();

    const processAirportDataStub = sinon.stub().returns([
      { id: 3011, iata: 'ABC', icao: 'XYZ', lat: 12.34, long: 56.78 },
      { id: 80085, iata: 'DEF', icao: 'GHI', lat: 23.45, long: 67.89 },
    ]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    parseCSVStub.resolves([
      {
        id: 3011,
        iata_code: 'ABC',
        icao_code: 'XYZ',
        latitude_deg: 12.34,
        longitude_deg: 56.78,
      },
      {
        id: 80085,
        iata_code: 'DEF',
        icao_code: 'GHI',
        latitude_deg: 23.45,
        longitude_deg: 67.89,
      },
    ]);

    db.batchUpsertAirports = sinon.stub().resolves([]);

    process.env.BATCH_SIZE = 1; // Set batch size to 1 for testing

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.calledOnce).to.be.true;
    expect(db.batchUpsertAirports.callCount).to.equal(2); // Should call upsert twice for two airports
    expect(commitTxStub.calledOnce).to.be.true;
  });

  it('should not call upsert if no valid airports are processed', async () => {
    const mockCsvData = 'iata,icao,lat,long\n';
    axiosGetStub.resolves({ data: mockCsvData });
    readFileDataStub.resolves(null);
    writeFileDataStub.resolves();

    parseCSVStub.resolves([]);

    const processAirportDataStub = sinon.stub().returns([]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    db.batchUpsertAirports = sinon.stub().resolves([]);

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.notCalled).to.be.true;
    expect(db.batchUpsertAirports.notCalled).to.be.true; // No upsert calls should be made
    expect(rollbackTxStub.notCalled).to.be.true;
    expect(logger.info.calledWith('No airports to update/insert today')).to.be
      .true;
  });

  it('should roll back transaction if an upsert error occurs', async () => {
    const mockCsvData =
      'id,iata_code,icao_code,latitude_deg,longitude_deg\n80085,ABCD,ABC,67.54,90.11';
    axiosGetStub.resolves({ data: mockCsvData });
    readFileDataStub.resolves(null);
    writeFileDataStub.resolves();

    parseCSVStub.resolves([
      {
        id: 80085,
        iata_code: 'ABCD',
        icao_code: 'ABC',
        latitude_deg: 67.54,
        longitude_deg: 90.11,
      },
    ]);

    const processAirportDataStub = sinon.stub().returns([
      {
        id: 80085,
        iata_code: 'ABCD',
        icao_code: 'ABC',
        latitude_deg: 67.54,
        longitude_deg: 90.11,
      },
    ]);
    sinon.replace(
      require('../../src/services/process-airport-data'),
      'processAirportData',
      processAirportDataStub
    );

    db.batchUpsertAirports = sinon.stub().throws(new Error('Upsert Error'));

    await fetchAndUpdateAirports(dummyCSVPath);

    expect(startTxStub.calledOnce).to.be.true;
    expect(db.batchUpsertAirports.calledOnce).to.be.true;
    expect(rollbackTxStub.calledOnce).to.be.true;

    expect(logger.error.getCall(0).args[0]).to.deep.equal('Upsert Error');
  });
});
