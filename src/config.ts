import convict from 'convict';

const conf = convict({
    env: {
        format: ['development', 'staging', 'production'],
        default: 'development',
        env: 'NODE_ENV',
    },
    app: {
        name: {
            format: '*',
            default: 'DTech',
            env: 'APP_NAME',
        },
        url: {
            format: '*',
            default: 'http://localhost:4200',
            env: 'APP_URL',
        },
        supportEmail: {
            format: '*',
            default: 'munawarkhan6656@gmail.com',
            env: 'APP_SUPPORT_EMAIL',
        },
    },
    server: {
        port: {
            format: 'port',
            default: 3000,
            env: 'NODE_PORT',
        },
        basePath: {
            format: '*',
            default: '/',
            env: 'BASE_PATH',
        },
    },
    transactionalEmailSource: {
        format: '*',
        default: 'munawarkhan6656@gmail.com',
        env: 'EMAIL_SOURCE',
    },
    token: {
        auth: {
            secret: {
                format: '*',
                default: 'auth-secret',
                env: 'AUTH_TOKEN_SECRET',
            },
            expiry: {
                format: '*',
                default: '1 day',
                env: 'AUTH_TOKEN_EXPIRY',
            },
        },
        invitation: {
            secret: {
                format: '*',
                default: 'invitation-secret',
                env: 'INVITATION_TOKEN_SECRET',
            },
        },
        resetPassword: {
            secret: {
                format: '*',
                default: 'reset-password-secret',
                env: 'RESET_PASSWORD_TOKEN_SECRET',
            },
            expiry: {
                format: '*',
                default: '1 day',
                env: 'RESET_PASSWORD_TOKEN_EXPIRY',
            },
        },
    },
    database: {
        host: {
            format: '*',
            default: 'localhost',
            env: 'DB_HOST',
        },
        port: {
            format: 'port',
            default: 5432,
            env: 'DB_PORT',
        },
        name: {
            format: '*',
            default: 'postgres',
            env: 'DB_NAME',
        },
        username: {
            format: '*',
            default: 'postgres',
            env: 'DB_USERNAME',
        },
        password: {
            format: '*',
            default: 'postgres',
            env: 'DB_PASSWORD',
        },
    },
    targetDataSource: {
        url: {
            format: '*',
            default: 'http://tds:4000',
            env: 'TDS_URL',
        },
    },
    aws: {
        endpoint: {
            format: '*',
            default: '',
            env: 'AWS_ENDPOINT',
        },
        region: {
            format: '*',
            default: 'us-east-1',
            env: 'AWS_DEFAULT_REGION',
        },
    },
    sqs: {
        reportDocumentCompilation: {
            format: '*',
            default: '',
            env: 'SQS_RDC_URL',
        },
        searchQueryAlert: {
            format: '*',
            default: '',
            env: 'SQS_SQA_URL',
        },
        targetReady: {
            format: '*',
            default: '',
            env: 'SQS_TR_URL',
        },
        transactionalEmail: {
            format: '*',
            default: '',
            env: 'SQS_TE_URL',
        },
    },
    s3: {
        Images: {
            format: '*',
            default: 'fileupload-11',
            env: 'S3_RDB_NAME',
        },
    },
    smtp: {
        host: {
            format: '*',
            default: '',
            env: 'SMTP_HOST',
        },
        port: {
            format: 'port',
            default: 587,
            env: 'SMTP_PORT',
        },
        secure: {
            format: Boolean,
            default: false,
            env: 'SMTP_SECURE',
        },
        user: {
            format: '*',
            default: '',
            env: 'SMTP_USER',
        },
        pass: {
            format: '*',
            default: '',
            env: 'SMTP_PASS',
        },
    },
    stripe: {
        apiKey: {
            format: '*',
            default: '',
            env: 'STRIPE_API_KEY',
        },
        webhookSecret: {
            format: '*',
            default: '',
            env: 'STRIPE_WEBHOOK_SECRET',
        },
    },
});

conf.validate({ allowed: 'strict' });

export default conf.getProperties();
