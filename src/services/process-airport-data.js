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

    // Select and rename attributes
    const processedRow = {
      id: row.id,
      ident: row.ident,
      type: row.type,
      name: row.name,
      lat: lat,
      long: long,
      elevation: isNaN(elevation) ? null : elevation,
      icao: icaoCode,
      iata: iataCode,
      country: row.iso_country,
    };

    processedData.push(processedRow);
  }

  return processedData;
};

module.exports = {
  processAirportData,
};
