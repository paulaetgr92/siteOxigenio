'use strict';

function firstDefined(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
  }
  return null;
}

function normalizeImage(value) {
  if (!value) return 'assets/images/catalogo-placeholder.svg';

  if (Buffer.isBuffer(value)) {
    return `data:image/jpeg;base64,${value.toString('base64')}`;
  }

  const text = String(value).trim();
  if (!text) return 'assets/images/catalogo-placeholder.svg';

  if (/^(https?:|data:|\/|\.\/|assets\/)/i.test(text)) return text;

  // Caso o banco guarde apenas o nome do arquivo.
  return `assets/produtos/${encodeURIComponent(text)}`;
}

function normalizeSizes(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch (_) {
    // Continua para o formato separado por vírgula/barra.
  }

  return text
    .split(/[,/;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeProduct(row) {
  const id = firstDefined(row, ['id', 'produto_id', 'codigo', 'codproduto']);
  const nome = firstDefined(row, ['nome', 'descricao', 'produto', 'nome_produto']);
  const imagem = firstDefined(row, [
    'imagem',
    'imagem_url',
    'foto',
    'foto_url',
    'imagem_binaria'
  ]);

  return {
    id: id === null ? '' : String(id),
    nome: nome ? String(nome).trim() : 'Produto feminino',
    preco: asNumber(firstDefined(row, ['preco', 'valor', 'preco_venda'])),
    precoPromocional: asNumber(
      firstDefined(row, ['preco_promocional', 'promocao', 'valor_promocional'])
    ),
    imagem: normalizeImage(imagem),
    subcategoria: String(
      firstDefined(row, ['subcategoria', 'grupo', 'linha']) || 'Feminino'
    ).trim(),
    tamanhos: normalizeSizes(firstDefined(row, ['tamanhos', 'grades', 'grade'])),
    disponivel: Boolean(firstDefined(row, ['disponivel', 'ativo', 'em_estoque']) ?? true),
    destaque: Boolean(firstDefined(row, ['destaque', 'lancamento']) ?? false)
  };
}

module.exports = { normalizeProduct };
