import mysql from "mysql2/promise";

const globalForDB = global as unknown as {
    db?: mysql.Pool;
};

const basePoolConfig: mysql.PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Optimize pool size: too high = resource waste, too low = bottlenecks
    // Formula: (core_count * 2) + effective_spindles, but for cloud DBs 10-20 is typical
    connectionLimit: Math.min(20, Math.max(10, Number(process.env.DB_POOL_SIZE) || 15)),

    // Reuse connections efficiently
    maxIdle: 10,
    idleTimeout: 60_000,

    waitForConnections: true,
    queueLimit: 0,

    // Timeouts
    connectTimeout: 10_000,
    acquireTimeout: 10_000,
    timeout: 60_000,

    // Keep alive improves stability
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    namedPlaceholders: true,

    // Performance optimizations
    multipleStatements: false,
    typeCast: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: false,
    trace: false,
};

/**
 * Main DB Pool - Singleton pattern for connection reuse across all users
 */
export const db =
    globalForDB.db ??
    mysql.createPool({
        ...basePoolConfig,
        database: process.env.DB_NAME,
        timezone: "Z",
    });

// Cache global reference in dev to prevent pool creation on hot-reload
if (process.env.NODE_ENV !== "production") {
    globalForDB.db = db;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
    await db.end();
});

process.on("SIGINT", async () => {
    await db.end();
});

/**
 * Helper to safely execute queries with automatic connection release
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await db.execute(sql, params);
    return rows as T;
}

/**
 * Helper for transactions - ensures connections are properly released
 */
export async function transaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
