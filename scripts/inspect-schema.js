'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool, closePool } = require('../src/db');

const keywords = [
  'produto', 'prod', 'item', 'mercadoria', 'estoque', 'preco', 'valor',
  'imagem', 'foto', 'arquivo', 'categoria', 'grupo', 'departamento',
  'feminino', 'sexo', 'genero', 'grade', 'tamanho', 'cor'
];

function scoreTable(table) {
  const text = `${table.schema_name}.${table.table_name} ${table.columns
    .map((column) => column.column_name)
    .join(' ')}`.toLowerCase();

  return keywords.reduce(
    (score, keyword) => score + (text.includes(keyword) ? 1 : 0),
    0
  );
}

(async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        s.name AS schema_name,
        t.name AS table_name,
        c.column_id,
        c.name AS column_name,
        ty.name AS data_type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable
      FROM sys.tables AS t
      INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
      INNER JOIN sys.columns AS c ON c.object_id = t.object_id
      INNER JOIN sys.types AS ty ON ty.user_type_id = c.user_type_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name, c.column_id;
    `);

    const map = new Map();
    for (const row of result.recordset) {
      const key = `${row.schema_name}.${row.table_name}`;
      if (!map.has(key)) {
        map.set(key, {
          schema_name: row.schema_name,
          table_name: row.table_name,
          columns: []
        });
      }
      map.get(key).columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
        max_length: row.max_length,
        precision: row.precision,
        scale: row.scale,
        is_nullable: row.is_nullable
      });
    }

    const tables = [...map.values()]
      .map((table) => ({ ...table, relevance_score: scoreTable(table) }))
      .sort(
        (a, b) =>
          b.relevance_score - a.relevance_score ||
          a.table_name.localeCompare(b.table_name)
      );

    const report = {
      generated_at: new Date().toISOString(),
      database: process.env.DB_DATABASE,
      total_tables: tables.length,
      likely_catalog_tables: tables.filter((table) => table.relevance_score >= 3),
      all_tables: tables
    };

    const output = path.resolve(process.cwd(), 'schema-report.json');
    await fs.writeFile(output, JSON.stringify(report, null, 2));

    console.log(`Relatório salvo em: ${output}`);
    console.log('\nTabelas mais prováveis para o catálogo:');
    console.table(
      report.likely_catalog_tables.slice(0, 25).map((table) => ({
        tabela: `${table.schema_name}.${table.table_name}`,
        relevancia: table.relevance_score,
        colunas: table.columns.length
      }))
    );
  } catch (error) {
    console.error('Não foi possível inspecionar o esquema:');
    console.error({ code: error.code, message: error.message });
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
