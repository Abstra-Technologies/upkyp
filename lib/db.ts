import mysql from "mysql2/promise";

/**
 * Global pool cache (prevents multiple pools in dev/serverless)
 */
const globalForDB = global as unknown as {
    db?: mysql.Pool;
    archivedb?: mysql.Pool;
};

/**
 * Optimal pool config for db.t3.micro (beta stage)
 */
const basePoolConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    /**
     * IMPORTANT:
     * db.t3.micro usually has ~60–100 max_connections
     * We safely use only ~15% of it.
     */
    connectionLimit: 15,

    waitForConnections: true,
    queueLimit: 0,

    // Timeouts
    connectTimeout: 10_000,

    // Keep alive improves stability
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

    namedPlaceholders: true,
};

/**
 * Main DB Pool
 */
export const db =
    globalForDB.db ??
    mysql.createPool({
        ...basePoolConfig,
        database: process.env.DB_NAME,
        timezone: "Z",
    });


/**
 * Cache pools globally (prevents pool duplication)
 */
if (process.env.NODE_ENV !== "production") {
    globalForDB.db = db;
}