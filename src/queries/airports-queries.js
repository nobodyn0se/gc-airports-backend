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
    country VARCHAR(4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

const selectAllAirportsQuery = `
  SELECT * FROM airports;
`;

const getSearchedAirportQuery = (columns) => `
  SELECT ${columns} 
  FROM airports 
  WHERE name ILIKE '%' || $1 || '%' OR 
        icao ILIKE $1 OR 
        iata ILIKE $1 
  LIMIT 10;
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
    country = EXCLUDED.country,
    updated_at = NOW()
  WHERE
    airports.ident IS DISTINCT FROM EXCLUDED.ident OR
    airports.type IS DISTINCT FROM EXCLUDED.type OR
    airports.name IS DISTINCT FROM EXCLUDED.name OR
    airports.lat IS DISTINCT FROM EXCLUDED.lat OR
    airports.long IS DISTINCT FROM EXCLUDED.long OR
    airports.elevation IS DISTINCT FROM EXCLUDED.elevation OR
    airports.icao IS DISTINCT FROM EXCLUDED.icao OR
    airports.iata IS DISTINCT FROM EXCLUDED.iata OR
    airports.country IS DISTINCT FROM EXCLUDED.country;
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
  batchUpsertAirportsQuery,
  getSearchedAirportQuery
};
