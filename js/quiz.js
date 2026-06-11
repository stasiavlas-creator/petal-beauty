'use strict';

/* ═══════════════════════════════════════════════════════════════
   PETAL — "Pinterest Skin Trend Matcher"
   Self-contained, deterministic, client-side.

   The idea: not "what's trending in general" but "which of the
   current Pinterest skin trends actually suit YOUR skin type."
   The user answers 8 questions and gets a personalised TREND STACK
   — a #1 match plus 2 complementary trends — with a shoppable edit.

   Data model (editable):
     TRENDS     — the pool of current skin trends (name, palette,
                  tagline, blurb, bestFor, product slots)
     QUESTIONS  — 8 questions; each answer adds trend points and/or
                  sets a hidden skin axis (skin / sens / concern / sun)
   Scoring:
     1. Sum trend points across all answers (Q8 vibe weighted ×2)
     2. Sort trends → top 3 = the stack, #1 = hero match
     3. Hidden axes personalise the product edit (Table D style)

   To map real SKUs: replace any product string with an object
   { name, link }. Strings fall back to an Amazon affiliate search.
═══════════════════════════════════════════════════════════════ */

/* ── THE TREND POOL (current Pinterest skin trends) ──────────── */
const TRENDS = {
  'glass-skin': {
    id: 'glass-skin', name: 'Glass Skin',
    palette: ['#EAF2F6', '#C8DEE9', '#9CC2D6', '#5E8AA3'],
    tagline: 'Poreless, dewy, lit from within.',
    blurb: 'The K-beauty gold standard — translucent, reflective skin built on deep hydration and the gentlest exfoliation.',
    bestFor: 'normal & combination skin',
    products: ['hydrating toner / essence', 'niacinamide + hyaluronic serum', 'dewy gel-cream moisturizer', 'glow-finish SPF'],
  },
  'glazed-donut': {
    id: 'glazed-donut', name: 'Glazed Donut Skin',
    palette: ['#F7EAD9', '#EACBA0', '#D9A86B', '#A9743C'],
    tagline: 'That dewy, glazed-from-within glow.',
    blurb: 'Layer hydration, then seal it with a luminous oil or balm for a glossy, just-glazed finish.',
    bestFor: 'dry & normal skin',
    products: ['hydrating essence', 'plumping hyaluronic serum', 'facial oil / glow drops', 'dewy moisturizer'],
  },
  'latte-skin': {
    id: 'latte-skin', name: 'Latte Skin',
    palette: ['#F3E2CE', '#E6B98A', '#C77B4A', '#8A4E2B'],
    tagline: 'Warm, bronzed, monochrome glow.',
    blurb: 'Soft golden-hour warmth — sun-kissed skin you build with bronzing drops and a luminous SPF.',
    bestFor: 'medium & tan skin',
    products: ['antioxidant vitamin C serum', 'liquid bronzing drops', 'glow-finish SPF', 'tinted lip oil'],
  },
  'slugging': {
    id: 'slugging', name: 'Slugging',
    palette: ['#F4F2EE', '#DCDAD4', '#B6B2A8', '#807C72'],
    tagline: 'Seal it all in overnight.',
    blurb: 'An occlusive final layer that traps moisture so you wake up plump, soft and barrier-repaired.',
    bestFor: 'dry & dehydrated skin',
    products: ['gentle cream cleanser', 'ceramide repair serum', 'rich night cream', 'occlusive overnight balm'],
  },
  'skin-cycling': {
    id: 'skin-cycling', name: 'Skin Cycling',
    palette: ['#E8ECF2', '#B9C6D8', '#5B7BA6', '#28406B'],
    tagline: 'The 4-night results rotation.',
    blurb: 'Exfoliate, retinol, recover, repeat — the dermatologist cadence that delivers results without the irritation.',
    bestFor: 'resilient, results-driven skin',
    products: ['exfoliating acid toner', 'retinol night treatment', 'barrier recovery cream', 'daily broad-spectrum SPF'],
  },
  'skin-flooding': {
    id: 'skin-flooding', name: 'Skin Flooding',
    palette: ['#E4F0F1', '#BFE0E2', '#84BFC2', '#3E8A8E'],
    tagline: 'Layer hydration till it floods.',
    blurb: 'Damp-skin layering of toner, hyaluronic acid and moisturizer for bouncy, quenched, dewy skin.',
    bestFor: 'dehydrated & sensitive skin',
    products: ['hydrating toner', 'hyaluronic acid serum', 'hydrating facial mist', 'barrier moisturizer'],
  },
  'cloud-skin': {
    id: 'cloud-skin', name: 'Cloud Skin',
    palette: ['#ECE8E4', '#C9BEB4', '#6E6660', '#2E2B28'],
    tagline: 'Soft-matte, blurred, never greasy.',
    blurb: 'The anti-dewy finish — airbrushed and balanced, all glow with none of the shine.',
    bestFor: 'oily & combination skin',
    products: ['refreshing gel cleanser', 'niacinamide + BHA serum', 'oil-free gel moisturizer', 'blurring primer-SPF'],
  },
  'cica-repair': {
    id: 'cica-repair', name: 'Cica Barrier Repair',
    palette: ['#E8F0EB', '#C5DBCF', '#8FB3A2', '#4F6E5E'],
    tagline: 'Calm, soothe, rebuild.',
    blurb: 'Centella- and oat-led care that quiets redness and reactivity for a calm, even, comfortable complexion.',
    bestFor: 'sensitive & reactive skin',
    products: ['gentle non-stripping cleanser', 'centella / cica serum', 'soothing barrier gel-cream', 'mineral SPF'],
  },
  'vitamin-c-glow': {
    id: 'vitamin-c-glow', name: 'Vitamin C Glow',
    palette: ['#FBEFD3', '#F4D58A', '#E0A93C', '#A9701A'],
    tagline: 'Bright, even, fade-the-marks radiance.',
    blurb: 'Antioxidant brightening that fades marks, evens tone and turns the glow up by morning.',
    bestFor: 'dull & uneven skin',
    products: ['vitamin C serum', 'niacinamide serum', 'gentle exfoliant', 'brightening moisturizer', 'daily SPF'],
  },
  'retinol-bounce': {
    id: 'retinol-bounce', name: 'Retinol Bounce',
    palette: ['#F0E2C8', '#C9A24B', '#7A3B2E', '#3E2723'],
    tagline: 'Keep the bounce, build collagen.',
    blurb: 'Retinoids and peptides that firm, smooth and protect that "I woke up like this" bounce for the long game.',
    bestFor: 'mature & firming-focused skin',
    products: ['plumping peptide serum', 'retinol / bakuchiol night treatment', 'ceramide night cream', 'eye cream', 'daily SPF'],
  },
};

/* Stable order — breaks score ties deterministically */
const TREND_ORDER = [
  'glass-skin', 'glazed-donut', 'skin-flooding', 'slugging', 'cica-repair',
  'cloud-skin', 'vitamin-c-glow', 'skin-cycling', 'retinol-bounce', 'latte-skin',
];

/* Readable label for the matched skin type (from the skin axis) */
const SKIN_LABEL = {
  balanced: 'balanced', combination: 'combination', dry: 'dry', oily: 'oily',
};

/* ── THE 8 QUESTIONS ─────────────────────────────────────────── */
// option fields:  trends:{ id:pts }  ·  set:{ axis:value }
// kind 'mood' tiles carry a `pal` (3 hex) for the gradient tile.
const QUESTIONS = [
  {
    id: 'q1', kind: 'text', prompt: "It's 3pm. Your skin is…",
    options: [
      { id: 'q1a', label: "Still fresh, didn't think about it once", set: { skin: 'balanced' }, trends: { 'glass-skin': 1, 'glazed-donut': 1 } },
      { id: 'q1b', label: 'A little shine in the T-zone, classic',    set: { skin: 'combination' }, trends: { 'cloud-skin': 1, 'skin-flooding': 1, 'glass-skin': 1 } },
      { id: 'q1c', label: 'Tight and asking for water',              set: { skin: 'dry' }, trends: { 'slugging': 1, 'glazed-donut': 1, 'skin-flooding': 1 } },
      { id: 'q1d', label: 'Glowing — possibly too much',             set: { skin: 'oily' }, trends: { 'cloud-skin': 1, 'vitamin-c-glow': 1 } },
    ],
  },
  {
    id: 'q2', kind: 'text', prompt: 'You try a new product. Your skin usually…',
    options: [
      { id: 'q2a', label: 'Takes it like a champ',                   set: { sens: 'low' }, trends: { 'skin-cycling': 1, 'retinol-bounce': 1 } },
      { id: 'q2b', label: 'Needs a slow introduction',               set: { sens: 'mid' }, trends: { 'glass-skin': 1 } },
      { id: 'q2c', label: 'Throws a tantrum first, then calms down',  set: { sens: 'mid-high' }, trends: { 'cica-repair': 1, 'skin-flooding': 1 } },
      { id: 'q2d', label: 'Reacts instantly — I live on alert',      set: { sens: 'high' }, trends: { 'cica-repair': 1, 'slugging': 1 } },
    ],
  },
  {
    id: 'q3', kind: 'text', prompt: 'If you could rewrite one thing about your skin…',
    options: [
      { id: 'q3a', label: 'Fewer breakouts',                         set: { concern: 'acne' }, trends: { 'cloud-skin': 1, 'cica-repair': 1 } },
      { id: 'q3b', label: 'More even tone / fade the marks',         set: { concern: 'tone' }, trends: { 'vitamin-c-glow': 1, 'skin-cycling': 1 } },
      { id: 'q3c', label: 'A bottomless glass of hydration',         set: { concern: 'hydration' }, trends: { 'skin-flooding': 1, 'slugging': 1, 'glazed-donut': 1 } },
      { id: 'q3d', label: 'Keep that "I woke up like this" bounce',  set: { concern: 'aging' }, trends: { 'retinol-bounce': 1, 'skin-cycling': 1 } },
    ],
  },
  {
    id: 'q4', kind: 'text', prompt: 'You + the sun =',
    options: [
      { id: 'q4a', label: 'I burn if I think about a beach',         set: { sun: 'burn' }, trends: { 'cica-repair': 1, 'glass-skin': 1 } },
      { id: 'q4b', label: 'Golden in minutes, never burn',           set: { sun: 'tan' }, trends: { 'latte-skin': 1, 'glazed-donut': 1 } },
      { id: 'q4c', label: 'Somewhere in between, I tan slowly',      set: { sun: 'mid' }, trends: { 'vitamin-c-glow': 1 } },
      { id: 'q4d', label: 'SPF is my entire personality already',    set: { sun: 'devotee' }, trends: { 'skin-cycling': 1, 'glass-skin': 1 } },
    ],
  },
  {
    id: 'q5', kind: 'text', prompt: 'Your dream skin finish is…',
    options: [
      { id: 'q5a', label: 'Glass — wet, glossy, reflective',         trends: { 'glass-skin': 2, 'glazed-donut': 1 } },
      { id: 'q5b', label: 'Glazed donut — dewy, lit-from-within',    trends: { 'glazed-donut': 2, 'latte-skin': 1 } },
      { id: 'q5c', label: 'Cloud — soft-matte, blurred, clean',      trends: { 'cloud-skin': 2 } },
      { id: 'q5d', label: 'Latte — warm, bronzed, sun-kissed',       trends: { 'latte-skin': 2 } },
    ],
  },
  {
    id: 'q6', kind: 'text', prompt: 'Your shelf right now is…',
    options: [
      { id: 'q6a', label: "Three holy-grails, that's it",            set: { effort: 'minimal' }, trends: { 'slugging': 1, 'glazed-donut': 1 } },
      { id: 'q6b', label: "A curated edit I'm low-key proud of",     set: { effort: 'moderate' }, trends: { 'glass-skin': 1, 'cloud-skin': 1 } },
      { id: 'q6c', label: 'A beautiful chaos of half-used jars',     set: { effort: 'moderate' }, trends: { 'latte-skin': 1, 'vitamin-c-glow': 1 } },
      { id: 'q6d', label: 'A full lab — I test everything',          set: { effort: 'high' }, trends: { 'skin-cycling': 1, 'retinol-bounce': 1, 'vitamin-c-glow': 1 } },
    ],
  },
  {
    id: 'q7', kind: 'text', prompt: 'Right now your skin goal is…',
    options: [
      { id: 'q7a', label: 'Lit-from-within glow',                    trends: { 'glass-skin': 1, 'glazed-donut': 1, 'latte-skin': 1 } },
      { id: 'q7b', label: 'Calm & comfortable',                      trends: { 'cica-repair': 1, 'slugging': 1 } },
      { id: 'q7c', label: 'Smooth & blurred',                        trends: { 'cloud-skin': 1, 'skin-cycling': 1 } },
      { id: 'q7d', label: 'Firm & bouncy',                           trends: { 'retinol-bounce': 1, 'skin-cycling': 1 } },
    ],
  },
  {
    id: 'q8', kind: 'mood', prompt: 'Pick your vibe',
    note: 'Trust your gut — this one counts double.',
    options: [
      { id: 'q8a', label: 'Chrome, gloss, mirror, ice',             img: 'images/quiz/chromeskin.png', pal: ['#EAF2F6', '#C8DEE9', '#5E8AA3'], trends: { 'glass-skin': 2, 'cloud-skin': 1 } },
      { id: 'q8b', label: 'Honey, glazed donut, golden hour',       img: 'images/quiz/honeyskin.png', pal: ['#F7EAD9', '#EACBA0', '#A9743C'], trends: { 'glazed-donut': 2, 'latte-skin': 1 } },
      { id: 'q8c', label: 'Linen, oat, calm minimal',               img: 'images/quiz/linenskin.png', pal: ['#F4F2EE', '#DCDAD4', '#8FB3A2'], trends: { 'slugging': 2, 'cica-repair': 1 } },
      { id: 'q8d', label: 'Lab coats, actives, before-and-afters',  img: 'images/quiz/labskin.png', pal: ['#E8ECF2', '#B9C6D8', '#28406B'], trends: { 'skin-cycling': 2, 'vitamin-c-glow': 1, 'retinol-bounce': 1 } },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   SCORING ENGINE  (deterministic — always returns a 3-trend stack)
───────────────────────────────────────────────────────────────*/
function resolve(answers) {
  // answers: { questionId: optionId }
  const scores = {};
  TREND_ORDER.forEach((id) => { scores[id] = 0; });
  const axes = {};

  QUESTIONS.forEach((q) => {
    const optId = answers[q.id];
    if (!optId) return;
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) return;
    if (opt.trends) for (const t in opt.trends) scores[t] += opt.trends[t];
    if (opt.set) for (const a in opt.set) axes[a] = opt.set[a];
  });

  // rank trends: score desc, ties broken by stable TREND_ORDER
  const ranked = TREND_ORDER.slice().sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    return TREND_ORDER.indexOf(a) - TREND_ORDER.indexOf(b);
  });

  const stack = ranked.slice(0, 3).map((id) => TRENDS[id]);
  const hero = stack[0];
  const products = personalize(hero, stack, axes);

  return { hero, stack, axes, scores, products, skinLabel: SKIN_LABEL[axes.skin] || null };
}

/* Real PETAL Face-catalogue routine per trend — ids reference products in
   js/data.js, so the name, photo and Amazon link always match the catalogue
   "Get on Amazon" button exactly. */
const TREND_FACE = {
  'glass-skin':     [15, 4, 13, 29],   // Glass Skin serum · B-Hydra · Dewy Cream · UV Clear SPF
  'glazed-donut':   [21, 4, 24, 13],   // Water Bank HA · B-Hydra · Snail 92 · Dewy Cream
  'latte-skin':     [9, 13, 29, 69],   // Halo Glow · Dewy Cream · UV Clear SPF · Warm Wishes Bronzer
  'slugging':       [31, 14, 24, 34],  // CeraVe Cream · Lala Retro · Snail 92 · The Rich Cream
  'skin-cycling':   [3, 33, 30, 29],   // BHA Exfoliant · Retinol Serum · Toleriane · UV Clear SPF
  'skin-flooding':  [26, 21, 4, 28],   // SOS Spray · Water Bank HA · B-Hydra · Byoma Rich Cream
  'cloud-skin':     [5, 17, 3, 74],    // Water Cream · Niacinamide+Zinc · BHA Exfoliant · Byoma Gel-Cream
  'cica-repair':    [66, 26, 30, 24],  // 345 Relief Cream · SOS Spray · Toleriane · Snail 92
  'vitamin-c-glow': [18, 17, 32, 29],  // Good Genes · Niacinamide+Zinc · Microfoliant · UV Clear SPF
  'retinol-bounce': [33, 68, 6, 19],   // Retinol Serum · Retinol Eye Cream · Bio-Collagen Mask · Magic Cream
};

/* axis → extra Face-catalogue ids ("Personalised for your skin") */
const AXIS_FACE = {
  'concern:acne':      [2, 16],   // Mighty Patch · Starface
  'concern:tone':      [18, 32],  // Good Genes · Microfoliant
  'concern:hydration': [21, 31],  // Water Bank HA · CeraVe Cream
  'concern:aging':     [33, 68],  // Retinol Serum · Retinol Eye Cream
  'sun:burn':          [29],      // UV Clear SPF 46
  'sun:tan':           [9, 29],   // Halo Glow · UV Clear SPF
  'sun:devotee':       [9, 29],
  'sens:high':         [66, 26],  // 345 Relief Cream · SOS Spray
};

function faceProduct(id) {
  if (typeof products === 'undefined') return null;
  const p = products.find((x) => x.id === id);
  return p ? { id: p.id, name: p.name, img: p.img, link: p.link } : null;
}

/* Build the shoppable edit from REAL Face products: hero routine +
   axis-driven personalisation + a pick from the #2 trend. */
function personalize(hero, stack, axes) {
  const seen = new Set();
  const pushList = (ids, target, max) => {
    for (const id of (ids || [])) {
      if (target.length >= max) break;
      if (seen.has(id)) continue;
      const fp = faceProduct(id);
      if (!fp) continue;
      seen.add(id);
      target.push(fp);
    }
  };

  // primary = the hero trend's real Face routine
  const primary = [];
  pushList(TREND_FACE[hero.id], primary, 4);

  // extras = axis-driven additions + one from the #2 trend (all real Face products)
  const extras = [];
  if (axes.concern) pushList(AXIS_FACE['concern:' + axes.concern], extras, 3);
  if (axes.sun)     pushList(AXIS_FACE['sun:' + axes.sun], extras, 3);
  if (axes.sens === 'high') pushList(AXIS_FACE['sens:high'], extras, 3);
  if (stack[1])     pushList(TREND_FACE[stack[1].id], extras, 3);

  return { primary, extras: extras.slice(0, 3) };
}

/* ── ANALYTICS (gtag + Umami, both no-op if absent) ──────────── */
function quizTrack(event, data) {
  try { if (typeof gtag === 'function') gtag('event', event, data || {}); } catch (e) {}
  try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(event, data || {}); } catch (e) {}
}

/* ─────────────────────────────────────────────────────────────
   FLOW CONTROLLER
───────────────────────────────────────────────────────────────*/
(function initQuiz() {
  const app = document.getElementById('quizApp');
  if (!app) return;

  const state = { step: 'landing', index: 0, answers: {}, result: null };

  /* Deep link: ?trend=<id> (or legacy ?archetype=) → result preview */
  const params = new URLSearchParams(location.search);
  const deepId = params.get('trend') || params.get('archetype');

  function render() {
    if (state.step === 'landing')       renderLanding();
    else if (state.step === 'question') renderQuestion();
    else if (state.step === 'loading')  renderLoading();
    else if (state.step === 'result')   renderResult();
  }

  /* ── LANDING ─────────────────────────────────────────────── */
  function renderLanding() {
    app.innerHTML = `
      <section class="quiz-landing">
        <span class="quiz-eyebrow">A PETAL Matcher</span>
        <h1 class="quiz-title">Skin Trend<br><em>Matcher</em></h1>
        <p class="quiz-lead">Not what's trending in general — which of the viral Pinterest skin trends actually suit <em>your</em> skin. Answer 8 questions, get your personalised trend stack.</p>
        <button class="quiz-begin" id="quizBegin">Match my skin</button>
        <p class="quiz-meta">Takes 60 seconds · 8 questions · 10 trends</p>
      </section>`;
    document.getElementById('quizBegin').addEventListener('click', () => {
      quizTrack('quiz_start');
      state.step = 'question';
      state.index = 0;
      render();
    });
  }

  /* ── QUESTION ────────────────────────────────────────────── */
  function renderQuestion() {
    const q = QUESTIONS[state.index];
    const total = QUESTIONS.length;
    const pct = Math.round((state.index / total) * 100);
    const selected = state.answers[q.id];

    let optsHTML;
    if (q.kind === 'mood') {
      optsHTML = `<div class="quiz-mood">` + q.options.map((o) => {
        const pal = o.pal || ['#EDE6DA', '#D9C7B0', '#A8957E'];
        const grad = `linear-gradient(135deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[2]} 100%)`;
        const swatch = o.img
          ? `<span class="quiz-tile-swatch" style="background:${grad}"><img src="${o.img}" alt="" loading="lazy"/></span>`
          : `<span class="quiz-tile-swatch" style="background:${grad}"></span>`;
        return `<button class="quiz-tile${selected === o.id ? ' selected' : ''}" data-opt="${o.id}" style="--tile:${grad}">
            ${swatch}
            <span class="quiz-tile-label">${o.label}</span>
          </button>`;
      }).join('') + `</div>`;
    } else {
      optsHTML = `<div class="quiz-opts">` + q.options.map((o) =>
        `<button class="quiz-opt${selected === o.id ? ' selected' : ''}" data-opt="${o.id}">
          <span class="quiz-opt-dot"></span><span>${o.label}</span>
        </button>`).join('') + `</div>`;
    }

    app.innerHTML = `
      <section class="quiz-stage" key="${q.id}">
        <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-step-row">
          <button class="quiz-back" id="quizBack" ${state.index === 0 ? 'disabled' : ''} aria-label="Previous">←</button>
          <span class="quiz-step-count">${state.index + 1} / ${total}</span>
        </div>
        <h2 class="quiz-question">${q.prompt}</h2>
        ${q.note ? `<p class="quiz-note">${q.note}</p>` : ''}
        ${optsHTML}
      </section>`;

    app.querySelectorAll('[data-opt]').forEach((btn) => {
      btn.addEventListener('click', () => choose(q, btn.dataset.opt));
    });
    const back = document.getElementById('quizBack');
    back && back.addEventListener('click', () => {
      if (state.index > 0) { state.index--; render(); }
    });
  }

  function choose(q, optId) {
    state.answers[q.id] = optId;
    quizTrack('quiz_question_answered', { question_id: q.id, answer_id: optId });
    // brief selected-state flash, then advance
    const el = app.querySelector(`[data-opt="${optId}"]`);
    if (el) el.classList.add('selected');
    setTimeout(() => {
      if (state.index < QUESTIONS.length - 1) {
        state.index++;
        render();
      } else {
        state.step = 'loading';
        render();
      }
    }, 240);
  }

  /* ── LOADING ─────────────────────────────────────────────── */
  function renderLoading() {
    app.innerHTML = `
      <section class="quiz-loading">
        <div class="quiz-loader"><span></span><span></span><span></span></div>
        <p class="quiz-loading-text">Matching your trends…</p>
      </section>`;
    setTimeout(() => {
      state.result = resolve(state.answers);
      quizTrack('quiz_result', { trend: state.result.hero.id });
      state.step = 'result';
      render();
    }, 2400);
  }

  /* ── RESULT ──────────────────────────────────────────────── */
  function renderResult() {
    const r = state.result;
    if (!r) return;
    const h = r.hero;
    const [c1, c2, c3, c4] = h.palette;

    const productRow = (p) =>
      `<a class="quiz-product" href="${p.link}" target="_blank" rel="noopener sponsored" data-umami-event="affiliate_click">
        ${p.img ? `<span class="quiz-product-thumb"><img src="${p.img}" alt="" loading="lazy"/></span>` : ''}
        <span class="quiz-product-name">${p.name}</span>
        <span class="quiz-product-cta">Shop ↗</span>
      </a>`;

    const stackHTML = r.stack.map((t, i) => {
      const grad = `linear-gradient(135deg, ${t.palette[0]} 0%, ${t.palette[1]} 55%, ${t.palette[2]} 100%)`;
      return `<div class="quiz-stack-item${i === 0 ? ' is-top' : ''}">
          <span class="quiz-stack-rank">${String(i + 1).padStart(2, '0')}</span>
          <span class="quiz-stack-swatch" style="background:${grad}"><img src="images/quiz/${t.id}.png" alt="" loading="lazy"/></span>
          <span class="quiz-stack-text">
            <span class="quiz-stack-name">${t.name}${i === 0 ? '<span class="quiz-stack-flag">Top match</span>' : ''}</span>
            <span class="quiz-stack-tag">${t.tagline}</span>
          </span>
        </div>`;
    }).join('');

    const extrasHTML = r.products.extras.length
      ? `<div class="quiz-extras">
           <span class="quiz-extras-head">Personalised for your skin</span>
           ${r.products.extras.map(productRow).join('')}
         </div>` : '';

    const bestForHTML = r.skinLabel
      ? `<span class="quiz-bestfor">Matched to your <strong>${r.skinLabel}</strong> skin</span>`
      : `<span class="quiz-bestfor">Best for <strong>${h.bestFor}</strong></span>`;

    app.innerHTML = `
      <section class="quiz-result"
        style="--a1:${c1};--a2:${c2};--a3:${c3};--a4:${c4}">
        <div class="quiz-result-inner">
          <span class="quiz-result-eyebrow">Your #1 trend match</span>
          <h1 class="quiz-result-name">${h.name}</h1>
          <div class="quiz-swatches">${h.palette.map((c) => `<span style="background:${c}"></span>`).join('')}</div>
          ${bestForHTML}
          <p class="quiz-result-character">${h.blurb}</p>

          <div class="quiz-stack">
            <span class="quiz-stack-head">Your personalised trend stack</span>
            ${stackHTML}
          </div>

          <div class="quiz-products">
            <span class="quiz-products-head">Shop your stack edit</span>
            ${r.products.primary.map(productRow).join('')}
            ${extrasHTML}
          </div>

          <div class="quiz-cta-row">
            <button class="quiz-share-btn" id="shareBtn">Save / Share my stack</button>
            <button class="quiz-copy-btn" id="copyBtn">Copy link</button>
          </div>

          <button class="quiz-retake" id="retakeBtn">Rematch my skin</button>
        </div>
      </section>`;

    // apply per-trend page theming
    document.body.style.setProperty('--quiz-bg1', c1);
    document.body.style.setProperty('--quiz-bg2', c2);

    buildShareCard(r);

    document.getElementById('shareBtn').addEventListener('click', () => shareCard(r));
    document.getElementById('copyBtn').addEventListener('click', () => copyLink(h, document.getElementById('copyBtn')));
    document.getElementById('retakeBtn').addEventListener('click', () => {
      document.body.style.removeProperty('--quiz-bg1');
      document.body.style.removeProperty('--quiz-bg2');
      state.answers = {}; state.result = null; state.index = 0; state.step = 'landing';
      history.replaceState(null, '', location.pathname);
      render();
    });
  }

  /* Build a result for deep-link preview (no answers → hero + neighbours) */
  function previewResult(trendId) {
    const h = TRENDS[trendId];
    if (!h) return null;
    // pad the stack with the next trends in stable order
    const rest = TREND_ORDER.filter((id) => id !== trendId).slice(0, 2).map((id) => TRENDS[id]);
    const stack = [h, ...rest];
    return { hero: h, stack, axes: {}, scores: {}, products: personalize(h, stack, {}), skinLabel: null };
  }

  /* ── SHARE CARD (1080×1920, html-to-image) ───────────────── */
  function buildShareCard(r) {
    const h = r.hero;
    let card = document.getElementById('shareCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'shareCard';
      card.className = 'share-card';
      document.body.appendChild(card);
    }
    const [c1, c2, c3, c4] = h.palette;
    card.style.setProperty('--a1', c1);
    card.style.setProperty('--a2', c2);
    card.style.setProperty('--a3', c3);
    card.style.setProperty('--a4', c4);

    const stackRows = r.stack.map((t, i) => {
      const grad = `linear-gradient(135deg, ${t.palette[0]} 0%, ${t.palette[1]} 55%, ${t.palette[2]} 100%)`;
      return `<div class="share-card-stack-row">
          <span class="share-card-stack-sw" style="background:${grad}"><img src="images/quiz/${t.id}.png" alt="" crossorigin="anonymous"/></span>
          <span class="share-card-stack-nm">${String(i + 1).padStart(2, '0')} · ${t.name}</span>
        </div>`;
    }).join('');

    card.innerHTML = `
      <div class="share-card-bg"></div>
      <div class="share-card-inner">
        <div class="share-card-top">
          <span class="share-card-brand">PE<span>/</span>TAL</span>
          <span class="share-card-kicker">Skin Trend Stack</span>
        </div>
        <div class="share-card-mid">
          <span class="share-card-family">My #1 trend match</span>
          <h2 class="share-card-name">${h.name}</h2>
          <div class="share-card-swatches">${h.palette.map((c) => `<span style="background:${c}"></span>`).join('')}</div>
          <p class="share-card-character">${h.tagline}</p>
        </div>
        <div class="share-card-stack">${stackRows}</div>
        <div class="share-card-products">
          ${r.products.primary.slice(0, 3).map((p) => `<span class="share-card-product">${p.name}</span>`).join('')}
        </div>
        <div class="share-card-foot">Find your stack → petalfinds.beauty/skin-quiz.html</div>
      </div>`;
  }

  async function exportCard() {
    const node = document.getElementById('shareCard');
    if (!node || !window.htmlToImage) return null;
    // html-to-image only captures the card reliably when it's in normal
    // document flow. A fixed, off-screen node (left:-99999px) exports as just
    // the background. Temporarily drop it into flow (off the bottom of the
    // page), capture, then restore — body overflow:hidden hides the reflow.
    const prevCss = node.style.cssText;
    const prevOverflow = document.body.style.overflow;
    node.style.position = 'relative';
    node.style.left = 'auto';
    node.style.top = 'auto';
    document.body.style.overflow = 'hidden';
    try {
      return await window.htmlToImage.toPng(node, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true });
    } finally {
      node.style.cssText = prevCss;
      document.body.style.overflow = prevOverflow;
    }
  }

  async function shareCard(r) {
    const h = r.hero;
    const btn = document.getElementById('shareBtn');
    const orig = btn.textContent;
    btn.textContent = 'Rendering…'; btn.disabled = true;
    try {
      const dataUrl = await exportCard();
      if (!dataUrl) throw new Error('no-export');
      const fileName = `petal-skin-trend-${h.id}.png`;
      // Try native share with the image file (mobile)
      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Skin Trend Stack', text: `My #1 skin trend match is ${h.name} ✦ What's yours?` });
          quizTrack('card_shared', { trend: h.id });
          btn.textContent = orig; btn.disabled = false;
          return;
        }
      }
      // Fallback: download
      downloadDataUrl(dataUrl, fileName);
      quizTrack('card_downloaded', { trend: h.id });
    } catch (err) {
      try {
        const dataUrl = await exportCard();
        if (dataUrl) { downloadDataUrl(dataUrl, `petal-skin-trend-${h.id}.png`); quizTrack('card_downloaded', { trend: h.id }); }
      } catch (e2) {}
    }
    btn.textContent = orig; btn.disabled = false;
  }

  function downloadDataUrl(dataUrl, name) {
    const link = document.createElement('a');
    link.download = name; link.href = dataUrl;
    document.body.appendChild(link); link.click(); link.remove();
  }

  function copyLink(h, btn) {
    const url = location.origin + location.pathname + '?trend=' + h.id;
    const done = () => { const o = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => (btn.textContent = o), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy your link:', url));
    } else { prompt('Copy your link:', url); }
  }

  /* ── BOOT ─────────────────────────────────────────────────── */
  if (deepId && TRENDS[deepId]) {
    state.result = previewResult(deepId);
    state.step = 'result';
  }
  render();
})();
