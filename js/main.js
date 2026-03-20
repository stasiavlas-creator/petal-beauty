/* ═══════════════════════════════════════════════════════
   PETAL — UI Interactions
   - Sticky nav + mobile menu
   - Card builder (HTML template)
   - Carousel init
   - Filter + search (category pages)
   - Scroll reveal
═══════════════════════════════════════════════════════ */

/* ── NAV ─────────────────────────────────────────────── */
(function initNav() {
  const nav    = document.querySelector('.site-nav');
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileMenu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      const spans = burger.querySelectorAll('span');
      if (open) {
        spans[0].style.cssText = 'transform:translateY(6.5px) rotate(45deg)';
        spans[1].style.cssText = 'opacity:0';
        spans[2].style.cssText = 'transform:translateY(-6.5px) rotate(-45deg)';
      } else {
        spans.forEach(s => s.removeAttribute('style'));
      }
    });
    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        mobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.querySelectorAll('span').forEach(s => s.removeAttribute('style'));
      }
    });
  }
})();


/* ── STAR RENDERER ───────────────────────────────────── */
function renderStars(rating) {
  return `<span class="stars-visual" style="--rating:${rating}" aria-label="${rating} out of 5 stars"></span>`;
}


/* ── AMAZON URL ──────────────────────────────────────── */
function amazonUrl(name) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(name)}&tag=petal-affiliate-20`;
}


/* ── CARD BUILDER ────────────────────────────────────── */
function buildCard(p) {
  const primaryTag = p.tags[0] || '';
  const tagClass   = { 'Trending': 'tag-trending', 'Best Seller': 'tag-bestseller', 'Under $25': 'tag-under25' }[primaryTag] || '';
  const tagHTML    = primaryTag ? `<span class="card-tag ${tagClass}">${primaryTag}</span>` : '';

  return `
<article class="product-card reveal"
  data-id="${p.id}"
  data-category="${p.category}"
  data-price="${p.price}"
  data-rating="${p.rating}"
  data-tags='${JSON.stringify(p.tags)}'>

  <div class="card-img-wrap">
    ${tagHTML}
    <img src="${p.img}" alt="${p.name}" loading="lazy"${p.imgPosition ? ` style="object-position:${p.imgPosition}"` : ''}/>

  </div>

  <div class="card-body">
    <div class="card-brand">${p.brand}</div>
    <div class="card-name">${p.name}</div>
    <div class="card-desc">${p.description}</div>

    <div class="card-stars">
      ${renderStars(p.rating)}
      <span class="card-reviews">${p.reviews.toLocaleString()} reviews</span>
    </div>

    <div class="card-footer-row">
      <span class="card-price">$${p.price}</span>
    </div>

    <a href="${p.link}"
       target="_blank"
       rel="noopener sponsored"
       class="btn-amazon"
       aria-label="Shop ${p.name} on Amazon">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Shop on Amazon
    </a>
  </div>
</article>`.trim();
}


/* ── FILL ANY ELEMENT WITH CARDS ─────────────────────── */
function fillGrid(elOrId, products) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.innerHTML = products.map(buildCard).join('');
  observeReveal(el);
}


/* ── CAROUSEL ────────────────────────────────────────── */
function initCarousel(rowId, prevId, nextId) {
  const row  = document.getElementById(rowId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!row) return;

  function step() {
    const card = row.querySelector('.product-card');
    if (!card) return row.clientWidth * 0.85;
    const gap = parseFloat(getComputedStyle(row).gap) || 18;
    return card.offsetWidth + gap;
  }

  prev?.addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => row.scrollBy({ left:  step(), behavior: 'smooth' }));
}


/* ── SCROLL REVEAL ───────────────────────────────────── */
function observeReveal(root) {
  const els = (root || document).querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 55);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
}


/* ── FILTER + SEARCH (category pages) ───────────────── */
function initFilters(products, renderFn) {
  const searchInput = document.getElementById('searchInput');
  const sortSelect  = document.getElementById('sortSelect');
  const countEl     = document.getElementById('productsCount');
  const clearBtn    = document.getElementById('clearFilters');
  const priceRange  = document.getElementById('priceRange');
  const priceLabel  = document.getElementById('priceLabel');

  function applyFilters() {
    let result = [...products];

    // Text search
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Brand checkboxes
    const brands = [...document.querySelectorAll('.filter-brand:checked')].map(el => el.value);
    if (brands.length) result = result.filter(p => brands.includes(p.brand));

    // Tag checkboxes
    const tags = [...document.querySelectorAll('.filter-tag:checked')].map(el => el.value);
    if (tags.length) result = result.filter(p => tags.some(t => p.tags.includes(t)));

    // Rating
    const minRating = document.querySelector('.filter-rating:checked')?.value;
    if (minRating) result = result.filter(p => p.rating >= parseFloat(minRating));

    // Price range
    if (priceRange?.value) result = result.filter(p => p.price <= parseInt(priceRange.value));

    // Sort
    const sort = sortSelect?.value || 'trending';
    if (sort === 'price-asc')  result.sort((a,b) => a.price   - b.price);
    if (sort === 'price-desc') result.sort((a,b) => b.price   - a.price);
    if (sort === 'rating')     result.sort((a,b) => b.rating  - a.rating);
    if (sort === 'reviews')    result.sort((a,b) => b.reviews - a.reviews);
    if (sort === 'trending')   result.sort((a,b) => (b.tags.includes('Trending')?1:0) - (a.tags.includes('Trending')?1:0));

    renderFn(result);
    if (countEl) countEl.textContent = `${result.length} product${result.length !== 1 ? 's' : ''}`;
  }

  // Event listeners
  document.querySelectorAll('.filter-input').forEach(el => el.addEventListener('change', applyFilters));
  searchInput?.addEventListener('input',  applyFilters);
  sortSelect?.addEventListener('change',  applyFilters);

  // Price range live update
  priceRange?.addEventListener('input', () => {
    if (priceLabel) priceLabel.textContent = `$0 – $${priceRange.value}`;
    applyFilters();
  });

  // Clear all filters
  clearBtn?.addEventListener('click', () => {
    document.querySelectorAll('.filter-input').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      if (el.type === 'range') el.value = el.max;
    });
    if (searchInput)  searchInput.value  = '';
    if (sortSelect)   sortSelect.value   = 'trending';
    if (priceLabel)   priceLabel.textContent = `$0 – $${priceRange?.max || 100}`;
    applyFilters();
  });

  // Filter group collapse toggle
  document.querySelectorAll('.filter-group-head').forEach(head => {
    head.addEventListener('click', () => head.closest('.filter-group').classList.toggle('collapsed'));
  });

  // Mobile filter toggle
  const filterToggle = document.getElementById('filterToggle');
  const filtersSidebar = document.querySelector('.filters-sidebar');
  filterToggle?.addEventListener('click', () => {
    filtersSidebar?.classList.toggle('open');
    filterToggle.textContent = filtersSidebar?.classList.contains('open') ? 'Hide Filters' : 'Filters';
  });

  // Initial render
  applyFilters();
}


/* ── RENDER PRODUCT GRID ─────────────────────────────── */
function renderGrid(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<div class="no-results">
      No products found for your filters.
      <button onclick="document.getElementById('clearFilters').click()">Clear all filters</button>
    </div>`;
    return;
  }
  grid.innerHTML = products.map(buildCard).join('');
  observeReveal(grid);
}


/* ── POPULATE BRAND FILTER DYNAMICALLY ───────────────── */
function buildBrandFilters(category) {
  const container = document.getElementById('brandFilters');
  if (!container) return;
  const brands = getBrandsForCategory(category);
  container.innerHTML = brands.map(b => `
    <label class="filter-opt">
      <input type="checkbox" class="filter-input filter-brand" value="${b}"/>
      <label>${b}</label>
    </label>`).join('');
}


/* ── DOM READY ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Mark active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Start scroll reveal for any static .reveal elements
  observeReveal();
});
