'use strict';

const SETORES = {
  feminino: {
    titulo: 'Feminino',
    descricao: 'Peças para vestir todos os seus momentos.'
  },
  masculino: {
    titulo: 'Masculino',
    descricao: 'Estilo, conforto e praticidade para todos os dias.'
  },
  'moda-casa': {
    titulo: 'Moda Casa',
    descricao: 'Conforto e beleza para transformar cada ambiente.'
  },
  acessorios: {
    titulo: 'Acessórios',
    descricao: 'Detalhes que completam o look.'
  },
  calcados: {
    titulo: 'Calçados',
    descricao: 'Modelos para acompanhar todos os seus passos.'
  },
  infantil: {
    titulo: 'Infantil & Juvenil',
    descricao: 'Looks alegres, confortáveis e cheios de personalidade.'
  }
};

const params = new URLSearchParams(window.location.search);
const setor = (params.get('setor') || 'feminino').trim().toLowerCase();
const config = SETORES[setor];

if (!config) {
  window.location.href = '404.html';
  throw new Error('Setor inválido.');
}

const titulo = document.querySelector('#catalogo-titulo');
const descricao = document.querySelector('#catalogo-descricao');
const contador = document.querySelector('#catalogo-contador');
const status = document.querySelector('#catalogo-status');
const grid = document.querySelector('#catalogo-grid');
const carregarMais = document.querySelector('#carregar-mais');

titulo.textContent = config.titulo;
descricao.textContent = config.descricao;
document.title = `${config.titulo} | Lojas Oxigênio`;

const estado = {
  produtos: [],
  pagina: 1,
  porPagina: 24
};

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function caminhoImagem(produto) {
  const imagem = String(produto.imagem || '').trim();

  if (!imagem) {
    return 'assets/images/catalogo-placeholder.svg';
  }

  if (
    imagem.startsWith('assets/') ||
    imagem.startsWith('http://') ||
    imagem.startsWith('https://') ||
    imagem.startsWith('data:')
  ) {
    return imagem;
  }

  return `assets/produtos/${setor}/${imagem}`;
}

function criarCard(produto) {
  const card = document.createElement('article');
  card.className = 'produto-card';

  const media = document.createElement('div');
  media.className = 'produto-media';

  const imagem = document.createElement('img');
  imagem.className = 'produto-imagem';
  imagem.src = caminhoImagem(produto);
  imagem.alt = produto.nome || 'Produto';
  imagem.loading = 'lazy';

  imagem.onerror = () => {
    imagem.src = 'assets/images/catalogo-placeholder.svg';
  };

  media.appendChild(imagem);

  const conteudo = document.createElement('div');
  conteudo.className = 'produto-conteudo';

  const categoria = document.createElement('p');
  categoria.className = 'produto-categoria';
  categoria.textContent = produto.subcategoria || config.titulo;

  const nome = document.createElement('h2');
  nome.className = 'produto-nome';
  nome.textContent = produto.nome || 'Produto';

  const preco = document.createElement('strong');
  preco.className = 'produto-preco';

  const valor =
    produto.precoPromocional ??
    produto.preco_promocional ??
    produto.preco;

  preco.textContent = Number.isFinite(Number(valor))
    ? moeda.format(Number(valor))
    : 'Consulte';

  const tamanhos = document.createElement('p');
  tamanhos.className = 'produto-tamanhos';

  tamanhos.textContent =
    Array.isArray(produto.tamanhos) && produto.tamanhos.length
      ? `Tamanhos: ${produto.tamanhos.join(' · ')}`
      : '';

  conteudo.append(categoria, nome, preco, tamanhos);
  card.append(media, conteudo);

  return card;
}

function renderizar() {
  const limite = estado.pagina * estado.porPagina;
  const produtos = estado.produtos.slice(0, limite);

  grid.innerHTML = '';

  const fragmento = document.createDocumentFragment();

  produtos.forEach((produto) => {
    fragmento.appendChild(criarCard(produto));
  });

  grid.appendChild(fragmento);

  contador.textContent =
    `${produtos.length} ${
      produtos.length === 1
        ? 'produto carregado'
        : 'produtos carregados'
    }`;

  carregarMais.hidden =
    produtos.length >= estado.produtos.length;

  status.hidden = true;
}

async function carregarCatalogo() {
  try {
    status.hidden = false;
    status.textContent = 'Carregando catálogo...';

    const resposta = await fetch(
      `assets/data/${setor}.json`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      }
    );

    if (!resposta.ok) {
      throw new Error(
        `Arquivo assets/data/${setor}.json não encontrado.`
      );
    }

    const dados = await resposta.json();

    estado.produtos = Array.isArray(dados)
      ? dados
      : dados.produtos || [];

    estado.pagina = 1;
    renderizar();
  } catch (erro) {
    console.error('[CATÁLOGO ESTÁTICO]', erro);

    status.hidden = false;
    status.textContent = erro.message;
    contador.textContent = '0 produtos carregados';
    carregarMais.hidden = true;
  }
}

carregarMais.addEventListener('click', () => {
  estado.pagina += 1;
  renderizar();
});

carregarCatalogo();
