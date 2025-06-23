const logger = require('../middleware/logger');

const processAirportData = (csvData) => {
  const processedData = [];

  for (const row of csvData) {
    if (!row || !row.id) {
      continue;
    }

    const lat = parseFloat(row.latitude_deg);
    const long = parseFloat(row.longitude_deg);
    const elevation = parseInt(row.elevation_ft, 10);

    if (isNaN(lat) || isNaN(long)) {
      continue;
    }

    // Prepare ICAO and IATA codes, ensuring empty strings become null for consistency
    const icaoCode = row.icao_code || null;
    const iataCode = row.iata_code || null;

    if (!icaoCode || !iataCode) {
      continue;
    }

    const ident = row.ident;
    const country = row.iso_country;

    // Skip records that violate length constraints
    if (
      icaoCode?.length > 4 ||
      iataCode?.length > 3 ||
      ident?.length > 10 ||
      country?.length > 2
    ) {
      logger.warn(
        `Anomaly skipped: icao = ${icaoCode}, iata = ${iataCode}, ident = ${ident}, country = ${country}`
      );
      continue;
    }

    // Select and rename attributes
    const processedRow = {
      id: parseInt(row.id, 10),
      ident: row.ident,
      type: row.type,
      name: row.name,
      lat: lat,
      long: long,
      elevation: isNaN(elevation) ? null : elevation,
      icao: icaoCode,
      iata: iataCode,
      municipality: row.municipality,
      country: row.iso_country,
    };

    processedData.push(processedRow);
  }

  return processedData;
};

module.exports = {
  processAirportData,
};
