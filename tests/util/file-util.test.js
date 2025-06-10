const { expect } = require('chai');
const fs = require('fs').promises;
const path = require('path');
const sinon = require('sinon');
const logger = require('../../src/middleware/logger');
const { readFileData, writeFileData } = require('../../src/util/file-util');

describe('File Util Tests', () => {
  let accessStub, readFileStub, writeFileStub, loggerInfo, loggerError;
  let pathStub, mkDirStub;

  beforeEach(() => {
    accessStub = sinon.stub(fs, 'access');
    readFileStub = sinon.stub(fs, 'readFile');
    writeFileStub = sinon.stub(fs, 'writeFile');
    mkDirStub = sinon.stub(fs, 'mkdir');

    pathStub = sinon.stub(path, 'dirname');

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
      expect(err.message).to.deep.equal('File access error');
    });
  });

  it('should write data to file successfully', async () => {
    pathStub.returns('path/test');
    mkDirStub.resolves();
    writeFileStub.resolves();

    await writeFileData('path/test', 'CSV', 'dummyData');

    expect(mkDirStub.calledOnce).to.be.true;
    expect(writeFileStub.calledOnce).to.be.true;
    expect(loggerInfo.callCount).to.be.equal(2);
    expect(loggerError.notCalled).to.be.true;
  });

  it('should log a write failure', async () => {
    pathStub.returns('path/test');
    mkDirStub.resolves();
    writeFileStub.rejects(new Error('Write error'));

    await writeFileData('path/test', 'CSV', 'dummyData').catch((err) => {
      expect(mkDirStub.calledOnce).to.be.true;
      expect(loggerInfo.calledOnce).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
      expect(err.message).to.deep.equal('Write error');
    });
  });

  it('should log a mkdir error', async () => {
    pathStub.returns('path/test');
    mkDirStub.rejects(new Error('Directory error'));
    await writeFileData('path/test', 'CSV', 'dummyData').catch((err) => {
      expect(mkDirStub.calledOnce).to.be.true;
      expect(loggerInfo.notCalled).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
      expect(err.message).to.deep.equal('Directory error');
    });
  });
});
