/* ──────────────────────────────────────────────────────────────
   PETAL — Soft DE-language suggestion
   Non-forced. Shows a banner if browser language starts with 'de'
   and user is on an EN page that has a DE counterpart.
   Dismissible. Respects user preference via localStorage.
   Bots are unaffected (no UA sniffing — bots simply ignore JS).
─────────────────────────────────────────────────────────────── */
(function () {
  try {
    if (typeof document === 'undefined') return;

    var STORAGE_KEY = 'petal_lang_pref';
    var DISMISS_KEY = 'petal_lang_dismissed';

    // Bail if user already chose a language preference or dismissed the banner
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Find the DE counterpart of this page via existing hreflang link
    var deLink = document.querySelector('link[rel="alternate"][hreflang="de"]');
    var enLink = document.querySelector('link[rel="alternate"][hreflang="en"]');
    if (!deLink || !enLink) return;

    var deHref = deLink.getAttribute('href');
    var enHref = enLink.getAttribute('href');
    if (!deHref || !enHref) return;

    // Current page language (from <html lang>)
    var pageLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();

    // Browser preference — primary language only
    var browserLangs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || 'en'];
    var prefersDE = browserLangs.some(function (l) {
      return l && l.toLowerCase().indexOf('de') === 0;
    });

    if (pageLang === 'en' && prefersDE && deHref !== enHref) {
      showBanner({
        text: 'Diese Seite ist auch auf Deutsch verfügbar.',
        cta: 'Zur deutschen Version',
        href: deHref
      });
    }

    function showBanner(opts) {
      var bar = document.createElement('div');
      bar.className = 'lang-banner';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Language suggestion');

      var msg = document.createElement('span');
      msg.textContent = opts.text;

      var link = document.createElement('a');
      link.href = opts.href;
      link.textContent = opts.cta;
      link.addEventListener('click', function () {
        try { localStorage.setItem(STORAGE_KEY, 'de'); } catch (e) {}
      });

      var close = document.createElement('button');
      close.setAttribute('aria-label', 'Dismiss');
      close.textContent = '×';
      close.addEventListener('click', function () {
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
        bar.remove();
      });

      bar.appendChild(msg);
      bar.appendChild(link);
      bar.appendChild(close);
      document.body.appendChild(bar);
    }
  } catch (e) {
    /* fail silently — banner is non-essential */
  }
})();
