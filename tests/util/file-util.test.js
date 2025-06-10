const { expect } = require('chai');
const fs = require('fs').promises;
const sinon = require('sinon');
const logger = require('../../src/middleware/logger');
const { readFileData } = require('../../src/util/file-util');

describe('File Util Tests', () => {
  let accessStub, readFileStub, loggerInfo, loggerError;

  beforeEach(() => {
    accessStub = sinon.stub(fs, 'access');
    readFileStub = sinon.stub(fs, 'readFile');
    sinon.stub(fs, 'writeFile');
    sinon.stub(fs, 'mkdir');

    loggerInfo = sinon.stub(logger, 'info');
    loggerError = sinon.stub(logger, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should read file data successfully', async () => {
    accessStub.resolves();
    readFileStub.resolves();

    await readFileData('path/test', 'CSV');

    expect(readFileStub.calledOnce).to.equal(true);
    expect(accessStub.calledOnce).to.equal(true);
    expect(loggerInfo.calledOnce).to.equal(true);
  });

  it('should log an error while reading file', async () => {
    accessStub.resolves();
    readFileStub.rejects(new Error('Read error'));

    await readFileData('path/test', 'CSV').catch((err) => {
      expect(readFileStub.calledOnce).to.be.true;
      expect(accessStub.calledOnce).to.equal(true);
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
    });
  });

  it('should log an error while accessing the file', async () => {
    accessStub.rejects(new Error('File access error'));

    await readFileData('path/test', 'CSV').catch((err) => {
      expect(accessStub.calledOnce).to.be.true;
      expect(readFileStub.notCalled).to.be.true;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
    });
  });
});
