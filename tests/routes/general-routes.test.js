const { expect } = require('chai');
import express from 'express';
const request = require('supertest');
const sinon = require('sinon');
const { setPool } = require('../../src/services/db.mjs');
const logger = require('../../src/middleware/logger.mjs'); // Adjust the path as necessary
const { errorHandler } = require('../../src/middleware/error-handler.mjs');
const db = require('../../src/services/db.mjs');

describe('Airport Route Tests', () => {
  let app, searchAirportByUserStub, poolStub;

  beforeEach(() => {
    poolStub = {
      query: sinon.stub(),
    };

    sinon.stub(logger, 'info');
    sinon.stub(logger, 'error');
    setPool(poolStub);

    searchAirportByUserStub = sinon.stub();
    sinon.replace(db, 'searchAirportByUser', searchAirportByUserStub);

    app = express();
    const router = require('../../src/routes/general-routes.mjs'); // No proxyquire here
    app.use(router);
    app.use(errorHandler);
  });

  afterEach(() => {
    sinon.restore();
    setPool(null);
  });

  it('should return a list of airports from /search', async () => {
    const expected = [
      {
        name: 'Generic airport name',
        icao: 'ronl',
        iata: 'ron',
        lat: 42.42,
        long: 45.45,
      },
    ];
    searchAirportByUserStub.returns(Promise.resolve(expected));
    const searchTerm = 'ron';
    const response = await request(app)
      .get('/get/search')
      .query({ searchTerm });
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal(expected);
    expect(response.body[0]).to.have.property('name', 'Generic airport name');
    expect(response.body[0]).to.have.property('icao', 'ronl');
    expect(response.body[0]).to.have.property('iata', 'ron');
    expect(response.body[0]).to.have.property('lat', 42.42);
    expect(response.body[0]).to.have.property('long', 45.45);
  });

  it('should throw an error and call next in case of error', async () => {
    const searchTerm = 'aeroporto';
    searchAirportByUserStub.callsFake(async () => {
      throw new Error('Search error');
    });
    const response = await request(app)
      .get('/get/search')
      .query({ searchTerm });

    expect(response.status).to.equal(500);
    expect(response.body).to.have.property('message');
    expect(response.body.message).to.deep.equal(
      'Internal Server Error. Could not pinpoint the error'
    );
  });

  it('should not call the service if searchTerm is empty or undefined', async () => {
    const response = await request(app).get('/get/search');

    expect(searchAirportByUserStub.notCalled).to.be.true;
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('status', 400);
    expect(response.body).to.have.property(
      'message',
      'Bad Request. Check the client-side request syntax'
    );
    expect(logger.error.calledOnce).to.be.true;
  });
});
