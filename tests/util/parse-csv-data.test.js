const { expect, spy } = require('chai');
const sinon = require('sinon');
const { parseCSVData } = require('../../src/util/parse-csv-data');
const logger = require('../../src/middleware/logger');

describe('CSV Parser Tests', () => {
  let logInfoSpy, logErrorSpy;

  beforeEach(() => {
    logInfoSpy = sinon.spy(logger, 'info');
    logErrorSpy = sinon.spy(logger, 'error');
  });

  afterEach(() => {
    logInfoSpy.restore();
    logErrorSpy.restore();
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
});
