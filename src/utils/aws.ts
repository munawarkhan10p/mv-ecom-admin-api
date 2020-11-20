import * as AWS from 'aws-sdk';

import config from '../config';

AWS.config.update({
    region: config.aws.region,
});

export const SQS = new AWS.SQS({
    endpoint: config.aws.endpoint ? config.aws.endpoint : undefined,
});

export const SES = new AWS.SES({
    endpoint: config.aws.endpoint ? config.aws.endpoint : undefined,
});

export const S3 = new AWS.S3({
    endpoint: config.aws.endpoint ? config.aws.endpoint : undefined,
});
