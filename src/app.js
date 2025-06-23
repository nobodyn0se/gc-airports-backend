const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const express = require('express');
const morgan = require('morgan');

const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const generalRoutes = require('./routes/general-routes');
const logger = require('./middleware/logger');
const fetchAndUpdateAirports = require('./controllers/db-controller');
const { testConnection } = require('./services/db');

const app = express();

app.use(
  morgan('combined', {
    immediate: true,
    skip: (req) => req.url === '/favicon.ico',
    stream: {
      write: (message) => logger.info(`REQ ${message.trim()}`),
    },
  })
);

app.use(express.json());

app.use('/airports', generalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  logger.info(`Express server up and running on port ${PORT}`);
  await testConnection();
  await fetchAndUpdateAirports(process.env.LOCAL_CSV_PATH);
});
