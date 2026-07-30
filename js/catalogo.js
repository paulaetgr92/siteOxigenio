'use strict';

const params = new URLSearchParams(window.location.search);
const setor = String(params.get('setor') || 'feminino')
  .trim()
  .toLowerCase();

const estado = {
  limite: 18,
  cursor: null,
  carregando: false,
  terminou: false,
  ids: new Set()
};

const grid = document.querySelector('#catalogo-grid');
const status = document.querySelector('#catalogo-status');
const botao = document.querySelector('#carregar-mais');
const contador = document.querySelector('#catalogo-contador');

function moeda(value) {
  const numero = Number(value);

  if (!Number.isFinite(numero)) {
    return '';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numero);
}

function card(produto) {
  const artigo = document.createElement('article');
  artigo.className = 'produto-card';

  const media = document.createElement('div');
  media.className = 'produto-media';

  const imagem = document.createElement('img');
  imagem.className = 'produto-imagem';
  imagem.src =
    `/api/imagens/item/${produto.item_id}` +
    `?artigo_id=${encodeURIComponent(produto.id || '')}`;
  imagem.alt = produto.nome || 'Produto';
  imagem.loading = 'lazy';
  imagem.decoding = 'async';

  imagem.addEventListener('error', () => {
    media.innerHTML =
      '<div class="produto-imagem-placeholder">' +
      'Imagem indisponível' +
      '</div>';
  });

  media.appendChild(imagem);

  const conteudo = document.createElement('div');
  conteudo.className = 'produto-conteudo';

  const categoria = document.createElement('p');
  categoria.className = 'produto-categoria';
  categoria.textContent =
    produto.subcategoria || 'Novidades';

  const nome = document.createElement('h2');
  nome.className = 'produto-nome';
  nome.textContent = produto.nome || 'Produto';

  const preco = document.createElement('strong');
  preco.className = 'produto-preco';
  preco.textContent = moeda(
    Number(produto.preco_promocional) > 0
      ? produto.preco_promocional
      : produto.preco
  );

  conteudo.append(categoria, nome, preco);
  artigo.append(media, conteudo);

  return artigo;
}

function atualizar() {
  botao.disabled = estado.carregando;
  botao.hidden = estado.terminou;
  botao.textContent = estado.carregando
    ? 'Carregando...'
    : 'Carregar mais produtos';

  contador.textContent =
    `${estado.ids.size} produtos carregados`;
}

async function carregar() {
  if (estado.carregando || estado.terminou) {
    return;
  }

  estado.carregando = true;
  status.hidden = false;
  status.textContent = 'Carregando produtos...';
  atualizar();

  try {
    const url = new URL(
      `/api/produtos/${setor}`,
      window.location.origin
    );

    url.searchParams.set(
      'limit',
      String(estado.limite)
    );

    if (estado.cursor) {
      url.searchParams.set(
        'before_id',
        String(estado.cursor)
      );
    }

    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!resposta.ok || !dados.ok) {
      throw new Error(
        dados.detail ||
        dados.error ||
        'Não foi possível carregar o catálogo.'
      );
    }

    const fragmento = document.createDocumentFragment();
    let adicionados = 0;

    for (const produto of dados.produtos || []) {
      const chave =
        `${produto.id}-${produto.item_id}`;

      if (estado.ids.has(chave)) {
        continue;
      }

      estado.ids.add(chave);
      fragmento.appendChild(card(produto));
      adicionados += 1;
    }

    grid.appendChild(fragmento);
    estado.cursor = dados.next_cursor;
    estado.terminou =
      !dados.has_more ||
      !dados.next_cursor ||
      adicionados === 0;

    status.hidden = estado.ids.size > 0;

    if (estado.terminou && estado.ids.size > 0) {
      status.hidden = false;
      status.textContent =
        'Você chegou ao fim do catálogo.';
    }
  } catch (error) {
    console.error(error);
    status.hidden = false;
    status.textContent =
      error.message ||
      'Não foi possível carregar o catálogo.';
  } finally {
    estado.carregando = false;
    atualizar();
  }
}

botao.addEventListener('click', carregar);
carregar();
