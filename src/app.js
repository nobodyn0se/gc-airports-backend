const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const express = require('express');

const logger = require('./middleware/logger');

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(
    `Express server up and running on port ${PORT}`
  );
});
