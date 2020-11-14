module.exports = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV === 'development',
    logging: true,
    entities: [
        'src/models/**/*',
    ],
    migrations: [
        'src/migrations/**/*',
    ],
    subscribers: [
        'src/subscribers/**/*',
    ],
    cli: {
        migrationsDir: 'src/migrations',
    },
};
