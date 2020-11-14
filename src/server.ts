import 'reflect-metadata';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import bunyanMiddleware from 'express-bunyan-logger';
import fg from 'fast-glob';
import helmet from 'helmet';
import { createConnection } from 'typeorm';

import config from './config';
import ErrorHandler from './middlewares/errorHandler';
import logger from './utils/logger';

async function start(): Promise<void> {
    logger.info('Starting server...');

    await createConnection();

    const consumers = await fg('./queues/*.(ts|js)', { cwd: __dirname });
    for (const consumerPath of consumers) {
        const { default: consumer } = await import(consumerPath);
        if (consumer && typeof (consumer.consume) === 'function') {
            logger.info(`Starting ${consumer.name} consumer at ${consumer.queueURL}...`);
            consumer.consume();
        }
    }

    const app = express();

    // Register middlewares
    const appUrl = new URL(config.app.url);

    app.use(cors({
        origin: config.env === 'production' ? appUrl.origin : '*',
    }));
    app.use(helmet());

    app.use(bodyParser.json());
    app.use(bunyanMiddleware({
        logger,
        parseUA: false,
        excludes: ['response-hrtime', 'req-headers', 'res-headers'],
        format: ':incoming :method :url :status-code',
    }));

    // Register routes
    const routes = await fg('./routes/*.(ts|js)', { cwd: __dirname });
    for (const routePath of routes) {
        const { default: router } = await import(routePath);
        if (typeof (router) === 'function') app.use(config.server.basePath, router);
    }

    // Error handler must come last...
    app.use(ErrorHandler);

    // Kick it off!
    app.listen(config.server.port, async () => {
        logger.info({ port: config.server.port }, 'Hey! I\'m listening...');
    });
}

start();
