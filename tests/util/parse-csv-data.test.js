const { expect } = require('chai');
const { EventEmitter } = require('events');
const sinon = require('sinon');
const { parseCSVData } = require('../../src/util/parse-csv-data');
const logger = require('../../src/middleware/logger');

describe('CSV Parser Tests', () => {
  let logInfoSpy, logErrorSpy;

  beforeEach(() => {
    logInfoSpy = sinon.stub(logger, 'info');
    logErrorSpy = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    logInfoSpy.restore();
    logErrorSpy.restore();
    sinon.restore();
  });

  it('should successfully parse csv data', async () => {
    const csvData = 'id,iata\n301,SXM\n4011,LFK';
    const expectedResults = [
      { id: '301', iata: 'SXM' },
      { id: '4011', iata: 'LFK' },
    ];

    const results = await parseCSVData(csvData);
    expect(results).to.deep.equal(expectedResults);
    expect(logInfoSpy.calledOnce).to.be.true;
    expect(logInfoSpy.calledWith(`Parsed 2 rows from the original dataset`)).to
      .be.true;
  });

  it('should log an error while parsing csv data', async () => {
    const invalidCSV = 'name,age\n"Charlie,30\nDana,40';
    let results;

    let fakeParser = new EventEmitter();
    fakeParser.pipe = () => fakeParser;
    let fakeCsv = sinon.stub().returns(fakeParser);

    process.nextTick(() => {
      fakeParser.emit('error', new Error('Invalid CSV'));
    });

    try {
      await parseCSVData(invalidCSV, fakeCsv);
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include('Invalid CSV');

      expect(logErrorSpy.calledOnce).to.be.true;
    }
  });
});
