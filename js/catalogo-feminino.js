'use strict';

const state = {
  produtos: [],
  filtro: 'todos',
  busca: ''
};

const grid = document.querySelector('#product-grid');
const statusElement = document.querySelector('#catalog-status');
const filtersElement = document.querySelector('#catalog-filters');
const searchInput = document.querySelector('#catalog-search input');
const searchTrigger = document.querySelector('.catalog-search-trigger');
const template = document.querySelector('#product-card-template');

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function renderFilters() {
  const categories = [...new Set(
    state.produtos.map((produto) => produto.subcategoria).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  filtersElement.innerHTML = '';
  for (const category of ['Todos', ...categories]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.dataset.filter = slug(category);
    button.classList.toggle('is-active', button.dataset.filter === state.filtro);
    filtersElement.append(button);
  }
}

function filteredProducts() {
  return state.produtos.filter((produto) => {
    const matchesFilter =
      state.filtro === 'todos' || slug(produto.subcategoria) === state.filtro;

    const haystack = slug(`${produto.nome} ${produto.subcategoria}`);
    const matchesSearch = !state.busca || haystack.includes(slug(state.busca));

    return matchesFilter && matchesSearch;
  });
}

function createProductCard(produto) {
  const node = template.content.cloneNode(true);
  const image = node.querySelector('img');
  const imageLink = node.querySelector('.product-card__image');
  const badge = node.querySelector('.product-card__badge');
  const category = node.querySelector('.product-card__category');
  const name = node.querySelector('.product-card__name');
  const oldPrice = node.querySelector('.product-card__old-price');
  const price = node.querySelector('.product-card__price');
  const sizes = node.querySelector('.product-card__sizes');

  image.src = produto.imagem;
  image.alt = produto.nome;
  image.onerror = () => {
    image.src = 'assets/images/catalogo-placeholder.svg';
  };

  imageLink.href = produto.id ? `produto.html?id=${encodeURIComponent(produto.id)}` : '#';
  category.textContent = produto.subcategoria || 'Feminino';
  name.textContent = produto.nome;

  const finalPrice = produto.precoPromocional ?? produto.preco;
  price.textContent = finalPrice === null ? 'Consulte' : money.format(finalPrice);

  if (
    produto.precoPromocional !== null &&
    produto.preco !== null &&
    produto.precoPromocional < produto.preco
  ) {
    oldPrice.hidden = false;
    oldPrice.textContent = money.format(produto.preco);
  }

  if (produto.destaque) badge.hidden = false;
  sizes.textContent = produto.tamanhos?.length
    ? `Tamanhos: ${produto.tamanhos.join(' · ')}`
    : '';

  return node;
}

function renderProducts() {
  const produtos = filteredProducts();
  grid.innerHTML = '';

  if (!produtos.length) {
    grid.innerHTML = '<p class="catalog-empty">Nenhuma peça encontrada.</p>';
  } else {
    const fragment = document.createDocumentFragment();
    produtos.forEach((produto) => fragment.append(createProductCard(produto)));
    grid.append(fragment);
  }

  statusElement.textContent = `${produtos.length} ${
    produtos.length === 1 ? 'produto' : 'produtos'
  }`;
}

async function loadCatalog() {
  try {
    const response = await fetch('/api/produtos/feminino?limit=120', {
      headers: { Accept: 'application/json' }
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.instruction || data.error || 'Falha ao carregar catálogo.');
    }

    state.produtos = data.produtos;
    renderFilters();
    renderProducts();
  } catch (error) {
    statusElement.innerHTML = `
      <div class="catalog-error">
        <strong>O catálogo ainda não conseguiu acessar o banco.</strong><br>
        ${error.message}
      </div>
    `;
  }
}

filtersElement.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;

  state.filtro = button.dataset.filter;
  filtersElement
    .querySelectorAll('button')
    .forEach((item) => item.classList.toggle('is-active', item === button));
  renderProducts();
});

searchInput.addEventListener('input', () => {
  state.busca = searchInput.value;
  renderProducts();
});

searchTrigger.addEventListener('click', () => {
  searchInput.focus();
  searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

loadCatalog();
