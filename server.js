'use strict';

require('dotenv').config();

const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool, closePool, sql } = require('./src/db');
const { setoresValidos } = require('./src/setores');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '8000', 10);
const QUERY_FILE = path.join(
  __dirname,
  'queries',
  'catalogo.sql'
);

let queryCache = null;

async function carregarQuery() {
  if (!queryCache) {
    queryCache = await fs.readFile(QUERY_FILE, 'utf8');
  }

  return queryCache;
}

function inteiro(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

app.disable('x-powered-by');
app.use(express.static(__dirname));

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        DB_NAME() AS database_name,
        GETDATE() AS server_time;
    `);

    res.json({
      ok: true,
      ...result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: error.code || null,
      detail: error.message
    });
  }
});

app.get('/api/produtos/:setor', async (req, res) => {
  const setor = String(req.params.setor || '')
    .trim()
    .toLowerCase();

  if (!setoresValidos.has(setor)) {
    return res.status(400).json({
      ok: false,
      error: 'Setor inválido.'
    });
  }

  const limit = Math.min(
    30,
    Math.max(8, inteiro(req.query.limit, 18))
  );

  const beforeId = req.query.before_id
    ? inteiro(req.query.before_id, null)
    : null;

  try {
    const pool = await getPool();
    const query = await carregarQuery();

    const request = pool.request();
    request.timeout = inteiro(
      process.env.DB_REQUEST_TIMEOUT_MS,
      30000
    );

    const result = await request
      .input('setor', sql.VarChar(30), setor)
      .input('limit', sql.Int, limit)
      .input('before_id', sql.Int, beforeId)
      .query(query);

    const produtos = result.recordset || [];
    const ultimo = produtos.at(-1);

    res.set('Cache-Control', 'no-store');

    return res.json({
      ok: true,
      setor,
      limit,
      next_cursor: ultimo?.item_id || null,
      has_more: produtos.length === limit,
      produtos
    });
  } catch (error) {
    console.error(`[CATÁLOGO:${setor}]`, {
      code: error.code,
      message: error.message
    });

    return res.status(500).json({
      ok: false,
      error: 'Não foi possível carregar o catálogo.',
      code: error.code || null,
      detail: error.message
    });
  }
});

app.get('/api/imagens/item/:itemId', async (req, res) => {
  const itemId = inteiro(req.params.itemId, 0);

  const artigoId = String(req.query.artigo_id || '')
    .trim()
    .slice(0, 100);

  if (itemId <= 0) {
    return res.status(400).send('Imagem inválida.');
  }

  try {
    const pool = await getPool();

    const request = pool.request();
    request.timeout = 30000;

    const result = await request
      .input('itemId', sql.Int, itemId)
      .input(
        'artigoId',
        sql.VarChar(100),
        artigoId || null
      )
      .query(`
        ;WITH imagens_candidatas AS (
          /* 1. Imagem diretamente ligada ao item. */
          SELECT
            imagem.id,
            CONVERT(nvarchar(max), imagem.ImagemStr) AS imagem,
            1 AS prioridade
          FROM dbo.C_IMAGEMARTIGO AS imagem
          WHERE
            imagem.DistEstoqueItem_Id = @itemId
            AND ISNULL(imagem.inativo, 0) = 0
            AND imagem.ImagemStr IS NOT NULL

          UNION ALL

          /* 2. Imagem diretamente ligada ao ArtigoId. */
          SELECT
            imagem.id,
            CONVERT(nvarchar(max), imagem.ImagemStr) AS imagem,
            2 AS prioridade
          FROM dbo.C_IMAGEMARTIGO AS imagem
          WHERE
            @artigoId IS NOT NULL
            AND LTRIM(
              RTRIM(
                CONVERT(varchar(100), imagem.instancia_id)
              )
            ) = @artigoId
            AND ISNULL(imagem.inativo, 0) = 0
            AND imagem.ImagemStr IS NOT NULL

          UNION ALL

          /* 3. Imagem de outro item com o mesmo ArtigoId. */
          SELECT
            imagem.id,
            CONVERT(nvarchar(max), imagem.ImagemStr) AS imagem,
            3 AS prioridade
          FROM dbo.C_DISTESTOQUEITEM AS item_irmao
          INNER JOIN dbo.C_IMAGEMARTIGO AS imagem
            ON imagem.DistEstoqueItem_Id = item_irmao.Id
          WHERE
            @artigoId IS NOT NULL
            AND LTRIM(
              RTRIM(
                CONVERT(varchar(100), item_irmao.ArtigoId)
              )
            ) = @artigoId
            AND ISNULL(imagem.inativo, 0) = 0
            AND imagem.ImagemStr IS NOT NULL
        )

        SELECT TOP (1)
          imagem
        FROM imagens_candidatas
        WHERE DATALENGTH(imagem) > 1000
        ORDER BY
          prioridade,
          id DESC;
      `);

    const dataUri = result.recordset[0]?.imagem;

    if (!dataUri) {
      const placeholder = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="600"
             height="800"
             viewBox="0 0 600 800">
          <rect width="600" height="800" fill="#eeeae4"/>
          <text x="300" y="400"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="24"
                fill="#8c857d">
            Imagem indisponível
          </text>
        </svg>
      `;

      res.set({
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      });

      return res.send(placeholder);
    }

    const match = String(dataUri).match(
      /^data:([^;]+);base64,(.+)$/s
    );

    if (!match) {
      return res.status(500).send(
        'Formato de imagem inválido.'
      );
    }

    const buffer = Buffer.from(match[2], 'base64');

    res.set({
      'Content-Type': match[1],
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=604800'
    });

    return res.send(buffer);
  } catch (error) {
    console.error(`[IMAGEM:${itemId}]`, {
      code: error.code,
      message: error.message
    });

    return res.status(500).send(
      'Não foi possível carregar a imagem.'
    );
  }
});

app.use((_req, res) => {
  res.status(404).sendFile(
    path.join(__dirname, '404.html')
  );
});

const server = app.listen(PORT, () => {
  console.log(`Site e API: http://localhost:${PORT}`);
});

async function encerrar() {
  server.close(async () => {
    await closePool().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
