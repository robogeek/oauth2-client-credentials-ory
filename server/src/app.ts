
import 'source-map-support/register.js';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';

import winston from 'winston';

import * as path from 'path';
import * as url from 'url';
import util from 'node:util';
import setupAPI from './api.js';

export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const logger = winston.createLogger();

logger.level = 'info';

logger.exitOnError = false;

logger.add(new winston.transports.Console({
    format: winston.format.simple(),
}));

export type appConfiguration = {
    port: number
};

export async function startServer(config: appConfiguration) {

    const app = express();
    app.use(compression())

    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: true })); // support encoded bodies
    app.use(express.json());
    
    app.use(morgan('combined'));
    app.use(cors());

    await setupAPI('/api', app);

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(`ESX SERVER ERROR`, err)
        res.status(500).send('Something broke!')
    });

    return app.listen(config.port, () => console.info(`api listening at http://localhost:${config.port}`));;
}


process.on('uncaughtException', (err, origin) => {
    logger.error(`uncaughtException ${util.inspect(err.stack)} ${util.inspect(origin)}`);
});


process.on('unhandledRejection', (reason, promise) => {
    logger.error(`unhandledRejection ${util.inspect(reason)} ${util.inspect(promise)}`);
});

process.on('warning', (warning) => {
    logger.warn(`NODE PROCESS WARNING ${util.inspect(warning)}`);
});

