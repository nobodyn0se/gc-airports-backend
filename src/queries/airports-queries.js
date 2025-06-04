// prettier-ignore

// queries.js

const createAirportsTableQuery = `
  CREATE TABLE IF NOT EXISTS airports
  (
    id INTEGER PRIMARY KEY,
    ident VARCHAR(4),
    type TEXT,
    name TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    long NUMERIC NOT NULL,
    elevation INTEGER,
    icao VARCHAR(4) NOT NULL,
    iata VARCHAR(3) NOT NULL,
    country VARCHAR(4)
  );
`;

const selectAllAirportsQuery = `
  SELECT * FROM airports;
`;

const batchUpsertAirportsQuery = (columns, values) => `
  INSERT INTO airports (${columns})
  VALUES ${values}
  ON CONFLICT (id) DO UPDATE SET
    ident = EXCLUDED.ident,
    type = EXCLUDED.type,
    name = EXCLUDED.name,
    lat = EXCLUDED.lat,
    long = EXCLUDED.long,
    elevation = EXCLUDED.elevation,
    icao = EXCLUDED.icao,
    iata = EXCLUDED.iata,
    country = EXCLUDED.country;
`;


const insertAirportQuery = (columns, values) => `
  INSERT INTO airports (${columns})
  VALUES (${values}) ON CONFLICT (id) DO NOTHING;
`;

const updateAirportQuery = (updateConditions, id) => `
  UPDATE airports
  SET ${updateConditions}
  WHERE id = $${id};
`;

const batch_InsertAirportsQuery = (columns, values) => `
  INSERT INTO airports (${columns})
  VALUES ${values} ON CONFLICT (id) DO NOTHING;
`;

module.exports = {
  createAirportsTableQuery,
  selectAllAirportsQuery,
  insertAirportQuery,
  updateAirportQuery,
  batch_InsertAirportsQuery,
  batchUpsertAirportsQuery
};
