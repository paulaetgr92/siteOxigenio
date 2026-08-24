'use strict';

require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool, closePool, sql } = require('../src/db');

const FILTROS = {
    feminino: `
    (
      nome LIKE '% FEM%'
      OR nome LIKE 'FEM%'
      OR nome LIKE '%FEMININ%'
      OR nome LIKE '%VESTIDO%'
      OR nome LIKE '%SAIA%'
      OR nome LIKE '%CROPPED%'
      OR nome LIKE '%CROPED%'
      OR nome LIKE '%BODY%'
      OR nome LIKE '%MACAQUINHO%'
      OR nome LIKE '%BLUSA%'
      OR nome LIKE '%REGATA FEM%'
      OR nome LIKE '%CAMISETA FEM%'
      OR nome LIKE '%CALCA FEM%'
      OR nome LIKE '%SHORT FEM%'
      OR nome LIKE '%CONJUNTO FEM%'
    )
    AND nome NOT LIKE '%INFANTIL%'
    AND nome NOT LIKE '% INF %'
    AND nome NOT LIKE '%JUVENIL%'
    AND nome NOT LIKE '% JUV %'
    AND nome NOT LIKE '%MASCULIN%'
    AND nome NOT LIKE '% MASC%'
    AND nome NOT LIKE '%TENIS%'
    AND nome NOT LIKE '%SANDALIA%'
    AND nome NOT LIKE '%SAPATILHA%'
    AND nome NOT LIKE '%CHINELO%'
    AND nome NOT LIKE '%BOLSA%'
    AND nome NOT LIKE '%RELOGIO%'
  `,

    masculino: `
    (
      nome LIKE '% MASC%'
      OR nome LIKE 'MASC%'
      OR nome LIKE '%MASCULIN%'
      OR nome LIKE '%CAMISETA MASC%'
      OR nome LIKE '%REGATA MASC%'
      OR nome LIKE '%POLO MASC%'
      OR nome LIKE '%CAMISA MASC%'
      OR nome LIKE '%BERMUDA MASC%'
      OR nome LIKE '%CALCA MASC%'
      OR nome LIKE '%CUECA%'
    )
    AND nome NOT LIKE '%INFANTIL%'
    AND nome NOT LIKE '% INF %'
    AND nome NOT LIKE '%JUVENIL%'
    AND nome NOT LIKE '% JUV %'
    AND nome NOT LIKE '%FEMININ%'
    AND nome NOT LIKE '% FEM%'
    AND nome NOT LIKE '%TENIS%'
    AND nome NOT LIKE '%SANDALIA%'
    AND nome NOT LIKE '%CHINELO%'
  `,

    infantil: `
    (
      nome LIKE '%INFANTIL%'
      OR nome LIKE '% INF %'
      OR nome LIKE '%JUVENIL%'
      OR nome LIKE '% JUV %'
      OR nome LIKE '%KIDS%'
      OR nome LIKE '%BABY%'
      OR nome LIKE '%BEBE%'
      OR nome LIKE '%4A8%'
      OR nome LIKE '%4 A 8%'
      OR nome LIKE '%10A14%'
      OR nome LIKE '%10 A 14%'
      OR nome LIKE '%10A16%'
      OR nome LIKE '%10 A 16%'
      OR nome LIKE '%FROZEN%'
      OR nome LIKE '%BARBIE%'
      OR nome LIKE '%BATMAN%'
      OR nome LIKE '%HOMEM ARANHA%'
      OR nome LIKE '%STITCH%'
    )
    AND (
      nome LIKE '%CAMISETA%'
      OR nome LIKE '%BLUSA%'
      OR nome LIKE '%REGATA%'
      OR nome LIKE '%POLO%'
      OR nome LIKE '%CAMISA%'
      OR nome LIKE '%BERMUDA%'
      OR nome LIKE '%SHORT%'
      OR nome LIKE '%CALCA%'
      OR nome LIKE '%VESTIDO%'
      OR nome LIKE '%SAIA%'
      OR nome LIKE '%CONJUNTO%'
      OR nome LIKE '%MACACAO%'
      OR nome LIKE '%JAQUETA%'
      OR nome LIKE '%CASACO%'
      OR nome LIKE '%MOLETOM%'
      OR nome LIKE '%LEGGING%'
    )
  `,

    'moda-casa': `
    nome LIKE '%TOALHA%'
    OR nome LIKE '%LENCOL%'
    OR nome LIKE '%JOGO DE CAMA%'
    OR nome LIKE '%COLCHA%'
    OR nome LIKE '%EDREDOM%'
    OR nome LIKE '%EDREDON%'
    OR nome LIKE '%TRAVESSEIRO%'
    OR nome LIKE '%FRONHA%'
    OR nome LIKE '%ALMOFADA%'
    OR nome LIKE '%TAPETE%'
    OR nome LIKE '%CORTINA%'
    OR nome LIKE '%VARAO%'
    OR nome LIKE '%CAPA DE SOFA%'
    OR nome LIKE '%CAPA P/ SOFA%'
    OR nome LIKE '%CAPA DE COLCHAO%'
    OR nome LIKE '%PANO DE PRATO%'
    OR nome LIKE '%TOALHA DE MESA%'
    OR nome LIKE '%MANTA%'
    OR nome LIKE '%POTE%'
    OR nome LIKE '%TRAVESSA%'
  `,

    acessorios: `
    (
      nome LIKE '%RELOGIO%'
      OR nome LIKE '%CINTO%'
      OR nome LIKE '%BOLSA%'
      OR nome LIKE '%MOCHILA%'
      OR nome LIKE '%CARTEIRA%'
      OR nome LIKE '%MALA%'
      OR nome LIKE '%POCHETE%'
      OR nome LIKE '%COLAR%'
      OR nome LIKE '%PULSEIRA%'
      OR nome LIKE '%BRINCO%'
      OR nome LIKE '%CORRENTE%'
      OR nome LIKE '%TIARA%'
      OR nome LIKE '%PRESILHA%'
      OR nome LIKE '%CHAPEU%'
      OR nome LIKE '%VISEIRA%'
      OR nome = 'ANEL'
      OR nome LIKE 'ANEL %'
      OR nome LIKE '% ANEL %'
      OR nome LIKE '% ANEL'
      OR nome = 'BONE'
      OR nome LIKE 'BONE %'
      OR nome LIKE '% BONE %'
      OR nome LIKE '% BONE'
    )
    AND nome NOT LIKE '%REGATA%'
    AND nome NOT LIKE '%CAMISETA%'
    AND nome NOT LIKE '%BLUSA%'
    AND nome NOT LIKE '%VESTIDO%'
    AND nome NOT LIKE '%SAIA%'
    AND nome NOT LIKE '%CALCA%'
    AND nome NOT LIKE '%BERMUDA%'
    AND nome NOT LIKE '%SHORT%'
    AND nome NOT LIKE '%BONECA%'
  `,

    calcados: `
    (
      nome LIKE '%TENIS%'
      OR nome LIKE '%SANDALIA%'
      OR nome LIKE '%CHINELO%'
      OR nome LIKE '%HAVAIANA%'
      OR nome LIKE '%IPANEMA%'
      OR nome LIKE '%GRENDHA%'
      OR nome LIKE '%SAPATO%'
      OR nome LIKE '%SAPATENIS%'
      OR nome LIKE '%SAPATILHA%'
      OR nome LIKE '%BOTA%'
      OR nome LIKE '%BOTINA%'
      OR nome LIKE '%COTURNO%'
      OR nome LIKE '%RASTEIRA%'
      OR nome LIKE '%TAMANCO%'
      OR nome LIKE '%PAPETE%'
    )
    AND nome NOT LIKE '%SAIA%'
    AND nome NOT LIKE '%VESTIDO%'
    AND nome NOT LIKE '%BLUSA%'
    AND nome NOT LIKE '%CAMISETA%'
    AND nome NOT LIKE '%CALCA%'
    AND nome NOT LIKE '%BERMUDA%'
  `
};

function normalizarNome(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(
            /\bTAM(?:ANHO)?\.?\s*(?:PP|P|M|G|GG|XG|XGG|EG|EGG|\d{1,3})\b/gi,
            ''
        )
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function extensaoDoMime(mime) {
    const extensoes = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };

    return extensoes[mime] || 'jpg';
}

async function buscarProdutos(pool, setor, quantidade) {
    const scan = Math.min(
        Math.max(quantidade * 8, 500),
        2000
    );

    const filtro = FILTROS[setor];

    const resultado = await pool.request()
        .input('scan', sql.Int, scan)
        .query(`
      WITH candidatos AS (
        SELECT TOP (@scan)
          item.Id AS item_id,

          LTRIM(
            RTRIM(
              CONVERT(varchar(100), item.ArtigoId)
            )
          ) AS artigo_id,

          LTRIM(RTRIM(item.Descricao)) AS nome_original,

          UPPER(
            LTRIM(RTRIM(item.Descricao))
          ) COLLATE Latin1_General_CI_AI AS nome

        FROM dbo.C_DISTESTOQUEITEM AS item

        WHERE
          ISNULL(item.Inativo, 0) = 0
          AND NULLIF(LTRIM(RTRIM(item.Descricao)), '') IS NOT NULL
          AND (${filtro})

        ORDER BY item.Id DESC
      )

      SELECT
        candidato.item_id,
        candidato.artigo_id,
        candidato.nome_original,
        COALESCE(imagem_item.id, imagem_artigo.id) AS imagem_id

      FROM candidatos AS candidato

      OUTER APPLY (
        SELECT TOP (1)
          imagem.id

        FROM dbo.C_IMAGEMARTIGO AS imagem

        WHERE
          imagem.DistEstoqueItem_Id = candidato.item_id
          AND ISNULL(imagem.inativo, 0) = 0
          AND imagem.ImagemStr IS NOT NULL

        ORDER BY imagem.id DESC
      ) AS imagem_item

      OUTER APPLY (
        SELECT TOP (1)
          imagem.id

        FROM dbo.C_IMAGEMARTIGO AS imagem

        WHERE
          LTRIM(
            RTRIM(
              CONVERT(varchar(100), imagem.instancia_id)
            )
          ) = candidato.artigo_id

          AND ISNULL(imagem.inativo, 0) = 0
          AND imagem.ImagemStr IS NOT NULL

        ORDER BY imagem.id DESC
      ) AS imagem_artigo

      WHERE COALESCE(
        imagem_item.id,
        imagem_artigo.id
      ) IS NOT NULL

      ORDER BY candidato.item_id DESC;
    `);

    const unicos = new Map();

    for (const produto of resultado.recordset) {
        const chave = normalizarNome(produto.nome_original);

        if (!chave || unicos.has(chave)) {
            continue;
        }

        unicos.set(chave, produto);

        if (unicos.size === quantidade) {
            break;
        }
    }

    return [...unicos.values()];
}

async function salvarImagem(pool, produto, pasta, indice) {
    const resultado = await pool.request()
        .input('imagemId', sql.Int, produto.imagem_id)
        .query(`
      SELECT TOP (1)
        CONVERT(nvarchar(max), ImagemStr) AS imagem

      FROM dbo.C_IMAGEMARTIGO

      WHERE id = @imagemId;
    `);

    const dataUri = resultado.recordset[0]?.imagem;

    if (!dataUri) {
        return null;
    }

    const match = String(dataUri).match(
        /^data:([^;]+);base64,(.+)$/s
    );

    if (!match) {
        return null;
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const extensao = extensaoDoMime(mime);

    const numero = String(indice + 1).padStart(3, '0');
    const nome = normalizarNome(produto.nome_original);

    const arquivo = `${numero}-${nome}.${extensao}`;
    const destino = path.join(pasta, arquivo);

    await fs.writeFile(destino, buffer);

    return arquivo;
}

async function executar() {
    const setor = String(
        process.argv[2] || 'feminino'
    ).toLowerCase();

    const quantidade = Math.min(
        Math.max(
            Number.parseInt(process.argv[3] || '100', 10),
            1
        ),
        300
    );

    if (!FILTROS[setor]) {
        throw new Error(
            `Setor inválido: ${setor}`
        );
    }

    const pasta = path.resolve(
        process.cwd(),
        'exports',
        'imagens',
        setor
    );

    await fs.mkdir(pasta, {
        recursive: true
    });

    const pool = await getPool();

    console.log(
        `Buscando ${quantidade} imagens recentes de ${setor}...`
    );

    const produtos = await buscarProdutos(
        pool,
        setor,
        quantidade
    );

    const manifest = [];

    for (let index = 0; index < produtos.length; index += 1) {
        const produto = produtos[index];

        const arquivo = await salvarImagem(
            pool,
            produto,
            pasta,
            index
        );

        if (!arquivo) {
            continue;
        }

        manifest.push({
            arquivo,
            item_id: produto.item_id,
            artigo_id: produto.artigo_id,
            nome: produto.nome_original,
            imagem_id: produto.imagem_id
        });

        console.log(
            `${index + 1}/${produtos.length} — ${arquivo}`
        );
    }

    await fs.writeFile(
        path.join(pasta, 'manifesto.json'),
        JSON.stringify(manifest, null, 2),
        'utf8'
    );

    console.log('');
    console.log(`Exportação concluída: ${pasta}`);
    console.log(`${manifest.length} imagens salvas.`);
}

executar()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closePool().catch(() => {});
    });