import { ValidationError } from '@hapi/joi';
import Bunyan from 'bunyan';
import { Consumer } from 'sqs-consumer';

import config from '../config';
import { SQS } from '../utils/aws';
import logger from '../utils/logger';

export class DuplicateMessageError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'DuplicateMessageError';
    }
}

export class UnprocessableMessageError extends Error {
    constructor(message: string) {
        super(message);

        this.name = 'UnprocessableMessageError';
    }
}

export class Queue<T> {
    private consumer: Consumer | null = null;
    name: string
    queueURL: string;
    log: Bunyan;

    constructor(name: string, queueURL: string) {
        this.name = name;
        this.queueURL = queueURL;
        this.log = logger.child({
            action: this.name,
        });
    }

    protected setConsumer(fn: (msg: T, log: Bunyan) => Promise<void>): void {
        this.consumer = Consumer.create({
            queueUrl: this.queueURL,
            region: config.aws.region,
            handleMessage: async (message: AWS.SQS.Message) => {
                const log = logger.child({
                    type: 'queue',
                    queue: this.name,
                    message: message.Body,
                    messageId: message.MessageId,
                });

                log.info('Message received');

                try {
                    if (!message.Body) {
                        throw new UnprocessableMessageError('Empty message');
                    }

                    let parsedMessage;

                    try {
                        parsedMessage = JSON.parse(message.Body) as T;
                    } catch (err) {
                        throw new UnprocessableMessageError(err.message);
                    }

                    await fn(parsedMessage, log);
                } catch (err) {
                    const joiErr = err as ValidationError;
                    if (joiErr.isJoi) {
                        log.error({ err });

                        return;
                    }

                    switch (err.name) {
                    case 'DuplicateMessageError':
                        log.error({ err });
                        break;

                    case 'UnprocessableMessageError':
                        log.error({ err });
                        break;

                    default:
                        log.error({ err });
                        throw err;
                    }
                }
            },
        });
    }

    consume(): void {
        if (this.consumer === null) {
            throw new Error('Consumer not set');
        }

        this.consumer.start();

        this.consumer.on('error', (err) => {
            this.log.error({ err });

            process.exit(1);
        });
    }

    async publish(message: T): Promise<void> {
        await SQS.sendMessage({
            QueueUrl: this.queueURL,
            MessageBody: JSON.stringify(message),
        }).promise();
    }
}
