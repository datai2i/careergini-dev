const { Pool } = require('pg');

const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            user: process.env.DB_USER || 'careergini',
            host: process.env.DB_HOST || 'postgres',
            database: process.env.DB_NAME || 'careergini',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        }
);

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
