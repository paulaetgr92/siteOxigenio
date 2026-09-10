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

/*
 * Subcategorias fixas por setor.
 * Setor sem lista aqui monta os filtros
 * a partir das subcategorias dos produtos.
 */
// Setores que se dividem por público antes das subcategorias.
const GENEROS = {
  infantil: ['feminino', 'masculino']
};

const SUBCATEGORIAS = {
  feminino: [
    'novis',
    'biquínis e maiôs',
    'vestidos',
    'croppeds e tops',
    'blusas',
    'body',
    'calças',
    'saias',
    't-shirts',
    'tricôs',
    'shorts e bermudas',
    'casacos e jaquetas',
    'jeans',
    'all black',
    'conjuntos'
  ],
  masculino: [
    'novis',
    'camisetas',
    'polos',
    'camisas',
    'calças',
    'jeans',
    'shorts e bermudas',
    'blusas e moletons',
    'jaquetas e casacos',
    'conjuntos'
  ],
  'moda-casa': [
    'novis',
    'colchas e cobertores',
    'jogos de cama',
    'lençóis',
    'travesseiros',
    'toalhas',
    'banheiro',
    'almofadas',
    'cortinas',
    'tapetes',
    'protetores',
    'aromatizantes'
  ],
  acessorios: [
    'novis',
    'brincos',
    'colares',
    'pulseiras e anéis',
    'relógios',
    'meias',
    'bolsas e necessaires',
    'chaveiros',
    'cases'
  ],
  calcados: [
    'novis',
    'tênis',
    'sandálias',
    'chinelos',
    'sapatos',
    'botas'
  ],
  infantil: [
    'novis',
    'camisetas',
    'regatas',
    'polos',
    'camisas',
    'croppeds e blusas',
    'vestidos',
    'conjuntos',
    'shorts e bermudas',
    'calças',
    'jeans',
    'moda praia'
  ]
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
const filtros = document.querySelector('#catalogo-filtros');
const generos = document.querySelector('#catalogo-generos');

titulo.textContent = config.titulo;
descricao.textContent = config.descricao;
document.title = `${config.titulo} | Lojas Oxigênio`;

const estado = {
  produtos: [],
  genero: 'todos',
  filtro: 'todos',
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

function normalizar(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase();
}

/*
 * Peças do público escolhido.
 * Unissex aparece em ambos.
 */
function produtosDoGenero() {
  if (estado.genero === 'todos') {
    return estado.produtos;
  }

  return estado.produtos.filter(
    (produto) =>
      produto.genero === estado.genero ||
      produto.genero === 'unissex'
  );
}

function produtosDoFiltro() {
  const base = produtosDoGenero();

  if (estado.filtro === 'todos') {
    return base;
  }

  if (estado.filtro === 'novis') {
    return base.filter(
      (produto) => produto.novo === true
    );
  }

  return base.filter(
    (produto) =>
      normalizar(produto.subcategoria) === estado.filtro
  );
}

function contarPorFiltro(chave) {
  const base = produtosDoGenero();

  if (chave === 'todos') {
    return base.length;
  }

  if (chave === 'novis') {
    return base.filter(
      (produto) => produto.novo === true
    ).length;
  }

  return base.filter(
    (produto) => normalizar(produto.subcategoria) === chave
  ).length;
}

function montarGeneros() {
  const lista = GENEROS[setor];

  if (!lista) {
    generos.hidden = true;
    return;
  }

  generos.hidden = false;
  generos.innerHTML = '';

  ['todos', ...lista].forEach((chave) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'catalogo-genero';
    botao.dataset.genero = chave;
    botao.textContent = chave;

    if (chave === estado.genero) {
      botao.classList.add('is-ativo');
      botao.setAttribute('aria-current', 'true');
    }

    botao.addEventListener('click', () => {
      estado.genero = chave;
      estado.filtro = 'todos';
      estado.pagina = 1;
      montarGeneros();
      montarFiltros();
      renderizar();
    });

    generos.appendChild(botao);
  });
}

function montarFiltros() {
  const lista = SUBCATEGORIAS[setor]
    ? SUBCATEGORIAS[setor].map(normalizar)
    : [
        ...new Set(
          estado.produtos
            .map((produto) => normalizar(produto.subcategoria))
            .filter(Boolean)
        )
      ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const chaves = ['todos', ...lista];

  filtros.innerHTML = '';
  filtros.hidden = chaves.length <= 1;

  chaves.forEach((chave) => {
    const total = contarPorFiltro(chave);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'catalogo-filtro';
    botao.dataset.filtro = chave;
    botao.textContent = chave;

    if (total === 0) {
      botao.disabled = true;
      botao.title = 'Nenhuma peça nesta subcategoria';
    }

    if (chave === estado.filtro) {
      botao.classList.add('is-ativo');
      botao.setAttribute('aria-current', 'true');
    }

    botao.addEventListener('click', () => {
      estado.filtro = chave;
      estado.pagina = 1;
      montarFiltros();
      renderizar();
    });

    filtros.appendChild(botao);
  });
}

function renderizar() {
  const limite = estado.pagina * estado.porPagina;
  const filtrados = produtosDoFiltro();
  const produtos = filtrados.slice(0, limite);

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
    produtos.length >= filtrados.length;

  if (!produtos.length) {
    status.hidden = false;
    status.textContent =
      'Nenhuma peça nesta subcategoria por enquanto.';
    return;
  }

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
    montarGeneros();
    montarFiltros();
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
