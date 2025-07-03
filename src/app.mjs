import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'prod') {
  dotenv.config();
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
}
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { notFoundHandler, errorHandler } from './middleware/error-handler.mjs';
import generalRoutes from './routes/general-routes.mjs';
import logger from './middleware/logger.mjs';

const app = express();

app.use(cors());
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
});
