'use strict';

const sql = require('mssql');

let poolPromise = null;

function booleanFromEnv(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

function integerFromEnv(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function criarConfig() {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1',
    port: integerFromEnv(process.env.DB_PORT, 14330),
    database: process.env.DB_DATABASE,

    connectionTimeout: integerFromEnv(
      process.env.DB_CONNECTION_TIMEOUT_MS,
      30000
    ),

    requestTimeout: integerFromEnv(
      process.env.DB_REQUEST_TIMEOUT_MS,
      60000
    ),

    options: {
      encrypt: booleanFromEnv(
        process.env.DB_ENCRYPT,
        false
      ),
      trustServerCertificate: booleanFromEnv(
        process.env.DB_TRUST_SERVER_CERTIFICATE,
        true
      )
    },

    pool: {
      max: integerFromEnv(process.env.DB_POOL_MAX, 8),
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

async function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(criarConfig());

    pool.on('error', (error) => {
      console.error('[SQL POOL]', error);
      poolPromise = null;
    });

    poolPromise = pool.connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

async function closePool() {
  if (!poolPromise) return;

  const pool = await poolPromise.catch(() => null);
  poolPromise = null;

  if (pool) {
    await pool.close();
  }
}

module.exports = {
  sql,
  getPool,
  closePool
};
