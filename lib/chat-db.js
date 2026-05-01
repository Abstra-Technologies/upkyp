// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");

const chat_pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 30_000,
    queueLimit: 20,
    connectTimeout: 5_000,
});

module.exports = chat_pool;
