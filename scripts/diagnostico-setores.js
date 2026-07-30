'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool, closePool } = require('../src/db');

function safeIdentifier(value) {
  return `[${String(value).replaceAll(']', ']]')}]`;
}

async function query(pool, sqlText) {
  const request = pool.request();
  request.timeout = 120000;
  return request.query(sqlText);
}

async function getColumns(pool, tableName) {
  const request = pool.request();
  request.timeout = 120000;
  request.input('tableName', tableName);

  const result = await request.query(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name,
      c.column_id,
      c.name AS column_name,
      ty.name AS data_type,
      c.max_length,
      c.is_nullable
    FROM sys.tables AS t
    INNER JOIN sys.schemas AS s
      ON s.schema_id = t.schema_id
    INNER JOIN sys.columns AS c
      ON c.object_id = t.object_id
    INNER JOIN sys.types AS ty
      ON ty.user_type_id = c.user_type_id
    WHERE t.name = @tableName
    ORDER BY c.column_id;
  `);

  return result.recordset;
}

async function getSample(pool, tableName, columns) {
  const relevant = columns
    .filter((column) =>
      /(id|nome|descr|titulo|categoria|depart|setor|secao|sexo|genero|grupo|subgrupo|publico|idade|faixa|artigo|refer|produto|codigo|ecommerce)/i
        .test(column.column_name)
    )
    .slice(0, 30);

  if (!relevant.length) return [];

  const fields = relevant
    .map((column) => safeIdentifier(column.column_name))
    .join(',\n      ');

  const result = await query(pool, `
    SELECT TOP (30)
      ${fields}
    FROM dbo.${safeIdentifier(tableName)};
  `);

  return result.recordset;
}

(async () => {
  try {
    const pool = await getPool();

    const report = {
      generated_at: new Date().toISOString(),
      database: process.env.DB_DATABASE,
      findings: {}
    };

    console.log('1/5 — analisando C_ARTIGOECOMMERCE...');

    const ecommerceColumns = await getColumns(
      pool,
      'C_ARTIGOECOMMERCE'
    );

    report.findings.C_ARTIGOECOMMERCE = {
      columns: ecommerceColumns,
      sample: await getSample(
        pool,
        'C_ARTIGOECOMMERCE',
        ecommerceColumns
      )
    };

    console.log('2/5 — analisando relacionamentos...');

    const foreignKeys = await query(pool, `
      SELECT
        fk.name AS foreign_key,

        OBJECT_SCHEMA_NAME(
          fkc.parent_object_id
        ) AS schema_origem,

        OBJECT_NAME(
          fkc.parent_object_id
        ) AS tabela_origem,

        coluna_origem.name AS coluna_origem,

        OBJECT_SCHEMA_NAME(
          fkc.referenced_object_id
        ) AS schema_destino,

        OBJECT_NAME(
          fkc.referenced_object_id
        ) AS tabela_destino,

        coluna_destino.name AS coluna_destino

      FROM sys.foreign_key_columns AS fkc

      INNER JOIN sys.foreign_keys AS fk
        ON fk.object_id = fkc.constraint_object_id

      INNER JOIN sys.columns AS coluna_origem
        ON coluna_origem.object_id = fkc.parent_object_id
       AND coluna_origem.column_id = fkc.parent_column_id

      INNER JOIN sys.columns AS coluna_destino
        ON coluna_destino.object_id = fkc.referenced_object_id
       AND coluna_destino.column_id = fkc.referenced_column_id

      WHERE
        OBJECT_NAME(
          fkc.parent_object_id
        ) IN (
          'C_ARTIGOECOMMERCE',
          'C_ARTIGO_COMP',
          'CADPRO'
        )

        OR OBJECT_NAME(
          fkc.referenced_object_id
        ) IN (
          'C_ARTIGOECOMMERCE',
          'C_ARTIGO_COMP',
          'CADPRO'
        )

      ORDER BY
        tabela_origem,
        foreign_key;
    `);

    report.findings.foreign_keys = foreignKeys.recordset;

    console.log('3/5 — analisando C_ARTIGO_COMP.GRUPO...');

    const articleGroups = await query(pool, `
      WITH ranked AS (
        SELECT
          NULLIF(
            LTRIM(RTRIM(GRUPO)),
            ''
          ) AS grupo_artigo,

          LTRIM(RTRIM(REFER)) AS referencia,
          LTRIM(RTRIM(DESCR)) AS descricao,
          ECommerce_Id,

          COUNT(*) OVER (
            PARTITION BY NULLIF(
              LTRIM(RTRIM(GRUPO)),
              ''
            )
          ) AS total_grupo,

          ROW_NUMBER() OVER (
            PARTITION BY NULLIF(
              LTRIM(RTRIM(GRUPO)),
              ''
            )
            ORDER BY __ID DESC
          ) AS numero

        FROM dbo.C_ARTIGO_COMP

        WHERE NULLIF(
          LTRIM(RTRIM(GRUPO)),
          ''
        ) IS NOT NULL
      )

      SELECT
        grupo_artigo,
        total_grupo,
        referencia,
        descricao,
        ECommerce_Id

      FROM ranked

      WHERE numero <= 20

      ORDER BY
        grupo_artigo,
        numero;
    `);

    report.findings.article_groups =
      articleGroups.recordset;

    console.log('4/5 — analisando CADPRO.GENERO...');

    const genders = await query(pool, `
      WITH ranked AS (
        SELECT
          GENERO,

          LTRIM(RTRIM(REFER)) AS referencia,
          LTRIM(RTRIM(DESCR)) AS descricao,

          COUNT(*) OVER (
            PARTITION BY GENERO
          ) AS total_genero,

          ROW_NUMBER() OVER (
            PARTITION BY GENERO
            ORDER BY __ID DESC
          ) AS numero

        FROM dbo.CADPRO
      )

      SELECT
        GENERO,
        total_genero,
        referencia,
        descricao

      FROM ranked

      WHERE numero <= 30

      ORDER BY
        GENERO,
        numero;
    `);

    report.findings.genero = genders.recordset;

    console.log('5/5 — procurando tabelas de classificação...');

    const candidates = await query(pool, `
      SELECT DISTINCT
        schema_tabela.name AS schema_name,
        tabela.name AS table_name,
        coluna.name AS matching_column

      FROM sys.tables AS tabela

      INNER JOIN sys.schemas AS schema_tabela
        ON schema_tabela.schema_id = tabela.schema_id

      INNER JOIN sys.columns AS coluna
        ON coluna.object_id = tabela.object_id

      WHERE
        tabela.is_ms_shipped = 0

        AND (
          coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%categoria%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%depart%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%setor%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%secao%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%sexo%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%genero%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%grupo%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%subgrupo%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%publico%'

          OR coluna.name COLLATE Latin1_General_CI_AI
            LIKE '%idade%'

          OR tabela.name COLLATE Latin1_General_CI_AI
            LIKE '%categoria%'

          OR tabela.name COLLATE Latin1_General_CI_AI
            LIKE '%depart%'

          OR tabela.name COLLATE Latin1_General_CI_AI
            LIKE '%setor%'

          OR tabela.name COLLATE Latin1_General_CI_AI
            LIKE '%grupo%'

          OR tabela.name COLLATE Latin1_General_CI_AI
            LIKE '%ecommerce%'
        )

      ORDER BY
        schema_name,
        table_name,
        matching_column;
    `);

    report.findings.classification_candidates =
      candidates.recordset;

    const output = path.resolve(
      process.cwd(),
      'mapeamento-setores.json'
    );

    await fs.writeFile(
      output,
      JSON.stringify(report, null, 2)
    );

    console.log('');
    console.log('Diagnóstico concluído.');
    console.log(`Arquivo criado em: ${output}`);
  } catch (error) {
    console.error('');
    console.error('Falha no diagnóstico:');
    console.error({
      code: error.code,
      number: error.number,
      lineNumber: error.lineNumber,
      message: error.message
    });

    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
