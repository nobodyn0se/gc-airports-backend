const { expect } = require('chai');
const sinon = require('sinon');

const { processAirportData } = require('../../src/util/process-airport-data');
const logger = require('../../src/middleware/logger');

describe('Airport Data Processor Tests', () => {
  beforeEach(() => {
    sinon.stub(logger, 'warn');
    sinon.stub(logger, 'info');
  });

  const input = [
    {
      id: 2134,
      ident: 'LFPG',
      name: 'Charles De Gualle Intl',
      latitude_deg: 49.012798,
      longitude_deg: 2.55,
      elevation_ft: '392',
      icao_code: 'LFPG',
      iata_code: 'CDG',
    },
    {
      id: 2011,
      ident: 'LPMA',
      name: 'Madeira International',
      latitude_deg: '32.697899',
      longitude_deg: '-16.7745',
      elevation_ft: 192,
      icao_code: 'LPMA',
      iata_code: 'FNC',
    },
    {
      id: 3131,
      ident: 'EGLL',
      name: 'London Heathrow',
      latitude_deg: '',
      longitude_deg: '-16.7745',
      elevation_ft: 192,
      icao_code: 'EGLL',
      iata_code: 'LHR',
    },
    {
      id: 400,
      ident: 'OMDB',
      name: 'Dubai Intl',
      latitude_deg: '45.6798',
      longitude_deg: '-16.7745',
      elevation_ft: 22,
      icao_code: '',
      iata_code: 'DXB',
    },
    {
      id: undefined,
      ident: 'KEYW',
      name: 'Key West Intl',
      latitude_deg: '45.6798',
      longitude_deg: '-16.7745',
      elevation_ft: 22,
      icao_code: 'KEYW',
      iata_code: 'EYW',
    },
  ];

  const expected = [
    {
      id: 2134,
      ident: 'LFPG',
      name: 'Charles De Gualle Intl',
      type: undefined,
      country: undefined,
      lat: 49.012798,
      long: 2.55,
      elevation: 392,
      icao: 'LFPG',
      iata: 'CDG',
    },
    {
      id: 2011,
      ident: 'LPMA',
      name: 'Madeira International',
      type: undefined,
      country: undefined,
      lat: 32.697899,
      long: -16.7745,
      elevation: 192,
      icao: 'LPMA',
      iata: 'FNC',
    },
  ];
  it('should process airports with non-null IATA, ICAO, lat, long', () => {
    const processedOutput = processAirportData(input);
    expect(processedOutput).to.deep.equal(expected);
  });

  it('should skip EGLL for missing lat or long attributes', () => {
    const processedOutput = processAirportData(input);
    expect(processedOutput).to.deep.equal(expected);
  });

  it('should skip OMDB for missing ICAO or IATA attributes', () => {
    const processedOutput = processAirportData(input);
    expect(processedOutput).to.deep.equal(expected);
  });

  it('should skip KEYW for undefined id', () => {
    const processedOutput = processAirportData(input);
    expect(processedOutput).to.deep.equal(expected);
  });

  it('should skip and warn of an anomaly that violates DB constraints', () => {
    const customInput = [
      {
        id: 3131,
        ident: 'EGLL',
        name: 'London Heathrow',
        latitude_deg: '2.546',
        longitude_deg: '-16.7745',
        elevation_ft: 192,
        icao_code: 'EGLL',
        iata_code: 'LHRL',
      },
      {
        id: 400,
        ident: 'OMDB',
        name: 'Dubai Intl',
        latitude_deg: '45.6798',
        longitude_deg: '-16.7745',
        elevation_ft: 22,
        icao_code: 'OMDB',
        iata_code: 'DXB',
      },
    ];
    const processedOutput = processAirportData(customInput);
    expect(processedOutput.length).to.equal(1);
    expect(logger.warn.calledOnce).to.be.true;
  });
});
