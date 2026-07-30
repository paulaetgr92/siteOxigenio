(() => {
  const body = document.body;
  const menu = document.querySelector('#menu-overlay');
  const search = document.querySelector('#search-overlay');
  const menuTrigger = document.querySelector('.menu-trigger');
  const searchTrigger = document.querySelector('.search-trigger');
  const searchInput = document.querySelector('#site-search');
  const searchForm = document.querySelector('.search-form');
  const searchStatus = document.querySelector('.search-status');
  const categoryCards = [...document.querySelectorAll('[data-category]')];

  const setOverlay = (overlay, trigger, open) => {
    overlay.classList.toggle('is-open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    trigger?.setAttribute('aria-expanded', String(open));
    body.classList.toggle('overlay-open', open);
    if (open) {
      const focusTarget = overlay.querySelector('input, a, button');
      window.setTimeout(() => focusTarget?.focus(), 120);
    }
  };

  menuTrigger.addEventListener('click', () => setOverlay(menu, menuTrigger, true));
  searchTrigger.addEventListener('click', () => setOverlay(search, searchTrigger, true));

  document.querySelectorAll('.overlay__close').forEach((button) => {
    button.addEventListener('click', () => {
      setOverlay(menu, menuTrigger, false);
      setOverlay(search, searchTrigger, false);
    });
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOverlay(menu, menuTrigger, false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOverlay(menu, menuTrigger, false);
      setOverlay(search, searchTrigger, false);
    }
  });

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const term = searchInput.value.trim().toLocaleLowerCase('pt-BR');
    if (!term) {
      searchStatus.textContent = 'Digite uma categoria para buscar.';
      return;
    }

    const match = categoryCards.find((card) => card.dataset.category.includes(term));
    if (!match) {
      searchStatus.textContent = 'Nenhuma categoria encontrada. Tente “feminino”, “masculino” ou “moda casa”.';
      return;
    }

    searchStatus.textContent = `Encontramos: ${match.querySelector('h3').textContent}.`;
    window.setTimeout(() => {
      setOverlay(search, searchTrigger, false);
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      match.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }],
        { duration: 700, easing: 'ease-out' }
      );
    }, 450);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const video = document.querySelector('.hero__video');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY * 0.08, 55);
      video.style.transform = `scale(1.03) translateY(${y}px)`;
      ticking = false;
    });
  }, { passive: true });
})();
