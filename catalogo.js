'use strict';

console.log(
    'CATÁLOGO ESTÁTICO V70 — SEM BANCO DE DADOS'
);

const SETORES = {
  feminino: {
    titulo: 'Feminino',
    descricao:
        'Peças para vestir todos os seus momentos.'
  },

  masculino: {
    titulo: 'Masculino',
    descricao:
        'Estilo, conforto e praticidade para todos os dias.'
  },

  'moda-casa': {
    titulo: 'Moda Casa',
    descricao:
        'Conforto e beleza para transformar cada ambiente.'
  },

  acessorios: {
    titulo: 'Acessórios',
    descricao:
        'Detalhes que completam o look.'
  },

  calcados: {
    titulo: 'Calçados',
    descricao:
        'Modelos para acompanhar todos os seus passos.'
  },

  infantil: {
    titulo: 'Infantil & Juvenil',
    descricao:
        'Looks alegres, confortáveis e cheios de personalidade.'
  }
};

const parametros = new URLSearchParams(
    window.location.search
);

const setor = String(
    parametros.get('setor') || 'feminino'
)
    .trim()
    .toLowerCase();

const setorConfig = SETORES[setor];

if (!setorConfig) {
  window.location.replace('404.html');

  throw new Error(
      `Setor inválido: ${setor}`
  );
}

const elementos = {
  titulo: document.querySelector(
      '#catalogo-titulo'
  ),

  descricao: document.querySelector(
      '#catalogo-descricao'
  ),

  contador: document.querySelector(
      '#catalogo-contador'
  ),

  status: document.querySelector(
      '#catalogo-status'
  ),

  grid: document.querySelector(
      '#catalogo-grid'
  ),

  carregarMais: document.querySelector(
      '#carregar-mais'
  )
};

for (
    const [nome, elemento]
    of Object.entries(elementos)
    ) {
  if (!elemento) {
    throw new Error(
        `Elemento não encontrado no HTML: ${nome}`
    );
  }
}

document.title =
    `${setorConfig.titulo} | Lojas Oxigênio`;

elementos.titulo.textContent =
    setorConfig.titulo;

elementos.descricao.textContent =
    setorConfig.descricao;

const estado = {
  produtos: [],
  pagina: 1,
  porPagina: 24,
  carregando: false
};

const formatadorMoeda =
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

function texto(valor) {
  return String(valor ?? '').trim();
}

function moeda(valor) {
  const numero = Number(valor);

  if (
      !Number.isFinite(numero) ||
      numero <= 0
  ) {
    return 'Consulte';
  }

  return formatadorMoeda.format(numero);
}

function chaveProduto(produto) {
  const nome = texto(produto.nome)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()

      // Remove TAM 46, TAMANHO G etc.
      .replace(
          /\bTAM(?:ANHO)?\.?\s*(?:PP|P|M|G|GG|XG|XGG|EG|EGG|\d{1,3})\b/gi,
          ''
      )

      .replace(/[^A-Z0-9]/g, '');

  return nome || texto(produto.id);
}

function removerDuplicados(produtos) {
  const unicos = new Map();

  for (const produto of produtos) {
    const chave = chaveProduto(produto);

    if (!chave) {
      continue;
    }

    if (!unicos.has(chave)) {
      unicos.set(chave, produto);
    }
  }

  return [...unicos.values()];
}

function caminhoImagem(produto) {
  const imagem = texto(produto.imagem);

  if (!imagem) {
    return 'assets/images/catalogo-placeholder.svg';
  }

  // Caminho completo informado no JSON.
  if (
      imagem.startsWith('assets/') ||
      imagem.startsWith('/') ||
      imagem.startsWith('http://') ||
      imagem.startsWith('https://') ||
      imagem.startsWith('data:')
  ) {
    return imagem;
  }

  // Exemplo:
  // imagem: "vestido-floral.png"
  //
  // Resultado:
  // assets/produtos/feminino/vestido-floral.png
  return `assets/produtos/${setor}/${imagem}`;
}

function criarPlaceholder() {
  const placeholder =
      document.createElement('div');

  placeholder.className =
      'produto-imagem-placeholder';

  placeholder.textContent =
      'Imagem indisponível';

  return placeholder;
}

function numeroPositivo(valor) {
  if (
      valor === null ||
      valor === undefined ||
      valor === ''
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
      !Number.isFinite(numero) ||
      numero <= 0
  ) {
    return null;
  }

  return numero;
}

function criarCard(produto) {
  const card =
      document.createElement('article');

  card.className = 'produto-card';

  const media =
      document.createElement('div');

  media.className = 'produto-media';

  const imagem =
      document.createElement('img');

  imagem.className = 'produto-imagem';
  imagem.src = caminhoImagem(produto);
  imagem.alt = texto(produto.nome) || 'Produto';
  imagem.loading = 'lazy';
  imagem.decoding = 'async';

  imagem.addEventListener(
      'error',
      () => {
        imagem.remove();

        if (
            !media.querySelector(
                '.produto-imagem-placeholder'
            )
        ) {
          media.appendChild(
              criarPlaceholder()
          );
        }
      },
      {
        once: true
      }
  );

  media.appendChild(imagem);

  const conteudo =
      document.createElement('div');

  conteudo.className =
      'produto-conteudo';

  const categoria =
      document.createElement('p');

  categoria.className =
      'produto-categoria';

  categoria.textContent =
      texto(produto.subcategoria) ||
      setorConfig.titulo;

  const nome =
      document.createElement('h2');

  nome.className = 'produto-nome';

  nome.textContent =
      texto(produto.nome) ||
      'Produto';

  const precos =
      document.createElement('div');

  precos.className =
      'produto-precos';

  const precoNormal =
      numeroPositivo(produto.preco);

  const precoPromocional =
      numeroPositivo(
          produto.precoPromocional ??
          produto.preco_promocional
      );

  if (
      precoNormal !== null &&
      precoPromocional !== null &&
      precoPromocional < precoNormal
  ) {
    const antigo =
        document.createElement('span');

    antigo.className =
        'produto-preco-antigo';

    antigo.textContent =
        moeda(precoNormal);

    const atual =
        document.createElement('strong');

    atual.className =
        'produto-preco';

    atual.textContent =
        moeda(precoPromocional);

    precos.append(
        antigo,
        atual
    );
  } else {
    const atual =
        document.createElement('strong');

    atual.className =
        'produto-preco';

    atual.textContent = moeda(
        precoPromocional ??
        precoNormal
    );

    precos.appendChild(atual);
  }

  const tamanhos =
      document.createElement('p');

  tamanhos.className =
      'produto-tamanhos';

  if (
      Array.isArray(produto.tamanhos) &&
      produto.tamanhos.length > 0
  ) {
    const lista = produto.tamanhos
        .map(texto)
        .filter(Boolean);

    tamanhos.textContent =
        lista.length > 0
            ? `Tamanhos: ${lista.join(' · ')}`
            : '';
  } else {
    tamanhos.textContent = '';
  }

  conteudo.append(
      categoria,
      nome,
      precos,
      tamanhos
  );

  card.append(
      media,
      conteudo
  );

  return card;
}

function mostrarStatus(
    mensagem,
    tipo = ''
) {
  elementos.status.textContent =
      mensagem;

  elementos.status.dataset.tipo =
      tipo;

  elementos.status.hidden =
      mensagem.length === 0;
}

function obterProdutosVisiveis() {
  const quantidade =
      estado.pagina *
      estado.porPagina;

  return estado.produtos.slice(
      0,
      quantidade
  );
}

function atualizarContador(
    quantidade
) {
  elementos.contador.textContent =
      `${quantidade} ${
          quantidade === 1
              ? 'produto carregado'
              : 'produtos carregados'
      }`;
}

function atualizarBotao(
    quantidadeVisivel = 0
) {
  const terminou =
      quantidadeVisivel >=
      estado.produtos.length;

  elementos.carregarMais.hidden =
      terminou ||
      estado.produtos.length === 0;

  elementos.carregarMais.disabled =
      estado.carregando;

  elementos.carregarMais.textContent =
      estado.carregando
          ? 'Carregando...'
          : 'Carregar mais produtos';
}

function renderizarProdutos() {
  const produtos =
      obterProdutosVisiveis();

  elementos.grid.replaceChildren();

  if (produtos.length === 0) {
    atualizarContador(0);
    atualizarBotao(0);

    mostrarStatus(
        'Nenhum produto encontrado neste setor.',
        'vazio'
    );

    return;
  }

  const fragmento =
      document.createDocumentFragment();

  for (const produto of produtos) {
    fragmento.appendChild(
        criarCard(produto)
    );
  }

  elementos.grid.appendChild(
      fragmento
  );

  atualizarContador(
      produtos.length
  );

  atualizarBotao(
      produtos.length
  );

  mostrarStatus('');
}

async function carregarCatalogo() {
  if (estado.carregando) {
    return;
  }

  estado.carregando = true;

  atualizarBotao(0);

  mostrarStatus(
      'Carregando catálogo...'
  );

  try {
    /*
     * O catálogo não chama mais:
     *
     * /api/produtos/feminino
     *
     * Agora lê somente:
     *
     * assets/data/feminino.json
     */
    const urlJson =
        `assets/data/${setor}.json`;

    console.log(
        `Carregando arquivo estático: ${urlJson}`
    );

    const resposta = await fetch(
        urlJson,
        {
          headers: {
            Accept: 'application/json'
          },

          cache: 'no-store'
        }
    );

    if (!resposta.ok) {
      throw new Error(
          `Não encontrei o arquivo ${urlJson}.`
      );
    }

    const contentType =
        resposta.headers.get(
            'content-type'
        ) || '';

    if (
        !contentType.includes(
            'application/json'
        )
    ) {
      throw new Error(
          `${urlJson} não retornou um JSON válido.`
      );
    }

    const dados =
        await resposta.json();

    const produtos =
        Array.isArray(dados)
            ? dados
            : dados.produtos;

    if (!Array.isArray(produtos)) {
      throw new Error(
          'O arquivo JSON precisa conter uma lista de produtos.'
      );
    }

    estado.produtos =
        removerDuplicados(produtos);

    estado.pagina = 1;

    renderizarProdutos();
  } catch (erro) {
    console.error(
        '[CATÁLOGO ESTÁTICO]',
        erro
    );

    elementos.grid.replaceChildren();

    atualizarContador(0);

    mostrarStatus(
        erro.message ||
        'Não foi possível carregar o catálogo.',
        'erro'
    );
  } finally {
    estado.carregando = false;

    atualizarBotao(
        obterProdutosVisiveis().length
    );
  }
}

elementos.carregarMais.addEventListener(
    'click',
    () => {
      if (estado.carregando) {
        return;
      }

      estado.pagina += 1;

      renderizarProdutos();
    }
);

carregarCatalogo();