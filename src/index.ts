import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { productRouter, labelRouter } from './routes/product.route';
import { logger, morganLogger } from './utils/logger';
import authRouter from './routes/auth.route';
import geoRouter from './routes/geo.route';
import config from './config';
import db from './db';

const app = express();

const start = async () => {
  app.use(cors());
  app.use(helmet());
  app.use(morganLogger);
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));

  await db.connect();

  app.use('/auth/v1', authRouter);
  app.use('/api/v1', geoRouter);
  app.use('/api/v1', productRouter);
  app.use('/api/v1/labels', labelRouter);

  app.listen(config.Port, () => {
    logger.info(`Application started in mode: ${config.NodeEnv}`);
    logger.info(`Application listening on port: ${config.Port}`);
    logger.info(`Sending logs to: ${config.AppRoot}/logs`);
  });
};

start();
