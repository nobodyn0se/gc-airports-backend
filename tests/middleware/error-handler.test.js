const { expect } = require('chai');
const sinon = require('sinon');

const logger = require('../../src/middleware/logger.mjs');
const util = require('../../src/util/util.mjs');
const {
  errorHandler,
  notFoundHandler,
} = require('../../src/middleware/error-handler.mjs');

describe('Error Handling Middleware Tests', () => {
  let res, req, next;

  beforeEach(() => {
    sinon.stub(util, 'logLevel');
    sinon.stub(util, 'publicErrorMessage');

    sinon.stub(logger, 'warn');
    sinon.stub(logger, 'error');

    req = { originalUrl: '/test/dummy' };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log a warning for status code 429', () => {
    const warning = new Error('Rate limit hit');
    warning.status = 429;

    errorHandler(warning);

    expect(logger.warn.calledOnce).to.be.true;
    expect(logger.warn.getCall(0).args[0]).to.deep.equal('Rate limit hit');
    expect(logger.warn.getCall(0).args[1]).to.have.property('statusCode', 429);
    expect(logger.error.notCalled).to.be.true;
  });

  it('should log an error for status code 400', () => {
    const error = new Error('Bad Syntax');
    error.status = 400;

    errorHandler(error);

    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.getCall(0).args[0]).to.deep.equal('Bad Syntax');
    expect(logger.error.getCall(0).args[1]).to.have.property('statusCode', 400);
    expect(logger.warn.notCalled).to.be.true;
  });

  it('should contain req and res object attributes if they were passed to the handler', () => {
    const error = new Error('Internal Server Error');
    error.status = 500;

    errorHandler(error, req, res);

    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.getCall(0).args[0]).to.deep.equal(
      'Internal Server Error'
    );
    expect(logger.error.getCall(0).args[1]).to.have.property('statusCode', 500);
    expect(logger.error.getCall(0).args[1]).to.have.property(
      'url',
      '/test/dummy'
    );

    expect(logger.warn.notCalled).to.be.true;
  });

  it('should handle a 404 error', () => {
    notFoundHandler(req, res, next);

    expect(next.calledOnce).to.be.true;

    const error = new Error('Not Found Error');
    error.status = 404;
    errorHandler(error, req, res);

    expect(logger.error.calledOnce).to.be.true;
    expect(logger.error.getCall(0).args[1]).to.have.property('statusCode', 404);
    expect(logger.warn.notCalled).to.be.true;
  });
});
