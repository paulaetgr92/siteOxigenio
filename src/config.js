'use strict';

require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`);
  }
  return value;
}

function asBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function asInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const dbConfig = {
  server: required('DB_SERVER'),
  port: asInteger(process.env.DB_PORT, 1433),
  database: required('DB_DATABASE'),
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  connectionTimeout: asInteger(process.env.DB_CONNECTION_TIMEOUT_MS, 20000),
  requestTimeout: asInteger(process.env.DB_REQUEST_TIMEOUT_MS, 30000),
  pool: {
    max: asInteger(process.env.DB_POOL_MAX, 8),
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: asBoolean(process.env.DB_ENCRYPT, false),
    trustServerCertificate: asBoolean(
      process.env.DB_TRUST_SERVER_CERTIFICATE,
      true
    ),
    enableArithAbort: true,
    appName: 'site-lojas-oxigenio'
  }
};

module.exports = {
  port: asInteger(process.env.PORT, 8000),
  dbConfig,
  catalogQueryFile: process.env.CATALOG_QUERY_FILE || 'queries/catalogo.sql'
};
