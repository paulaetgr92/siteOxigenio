'use strict';

const { getPool, closePool } = require('../src/db');

(async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        @@SERVERNAME AS servidor,
        DB_NAME() AS base_atual,
        SUSER_SNAME() AS usuario,
        CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(50)) AS versao
    `);

    console.log('Conexão realizada com sucesso:');
    console.table(result.recordset);
  } catch (error) {
    console.error('Falha na conexão:');
    console.error({ code: error.code, message: error.message });
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
