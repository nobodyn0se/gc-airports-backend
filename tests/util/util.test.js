const { expect } = require('chai');
const sinon = require('sinon');

const { publicErrorMessage, createTestError } = require('../../src/util/util');

describe('General Utility Tests', () => {
  it('should return appropriate messages according to status codes', () => {
    const m400 = publicErrorMessage(400);
    const m401 = publicErrorMessage(401);
    const m403 = publicErrorMessage(403);
    const m404 = publicErrorMessage(404);
    const m429 = publicErrorMessage(429);
    const m500 = publicErrorMessage(500);
    const m502 = publicErrorMessage(502);

    expect(m400).to.deep.equal(
      'Bad Request. Check the client-side request syntax'
    );
    expect(m401).to.deep.equal('Access Denied. Please verify your credentials');
    expect(m403).to.deep.equal(
      'Forbidden Access. This resource is inaccessible to you'
    );
    expect(m404).to.deep.equal('Not Found. This page or route does not exist');
    expect(m429).to.deep.equal('Too Many Requests. Go easy there');
    expect(m500).to.deep.equal(
      'Internal Server Error. Could not pinpoint the error'
    );
    expect(m502).to.deep.equal(
      'Internal Server Error. Could not pinpoint the error'
    );
  });

  it('should create a custom test error for a given status code', () => {
    const error = createTestError(402);

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.deep.equal(`This is a simulated 402 error`);
    expect(error.status).to.deep.equal(402);
  });
});
