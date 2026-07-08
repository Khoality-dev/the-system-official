/* ============================================================
   THE SYSTEM — site behavior: tweaks, reveals, typed text.
   Multi-page: tweak values persist via localStorage so they
   carry across pages, and via the host edit-mode protocol so
   the toolbar Tweaks toggle drives an on-brand panel.
   ============================================================ */
(function () {
  'use strict';

  var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "colorway": "cyan",
    "motion": "full",
    "glow": 1,
    "font": "Exo 2"
  }/*EDITMODE-END*/;

  var COLORWAYS = {
    cyan:    { sys: '#46c5ff', rgb: '70,197,255' },
    magenta: { sys: '#ff5ad6', rgb: '255,90,214' },
    gold:    { sys: '#ffc24d', rgb: '255,194,77' },
    green:   { sys: '#46e3a0', rgb: '70,227,160' }
  };

  var LS_KEY = 'system_site_tweaks';

  function load() {
    var v = {};
    for (var k in TWEAK_DEFAULTS) v[k] = TWEAK_DEFAULTS[k];
    try {
      var saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      for (var j in saved) if (j in v) v[j] = saved[j];
    } catch (e) {}
    return v;
  }

  var values = load();

  // Display fonts beyond the default Exo 2 are opt-in (Tweaks panel), so they are
  // fetched on demand instead of bloating the render-blocking font request.
  var FONT_URLS = {
    'Orbitron': 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&display=swap',
    'Chakra Petch': 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap'
  };
  var loadedFonts = {};
  function ensureFont(f) {
    if (!f || f === 'Exo 2' || loadedFonts[f] || !FONT_URLS[f]) return;
    loadedFonts[f] = 1;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = FONT_URLS[f];
    document.head.appendChild(l);
  }

  function apply(v) {
    var root = document.documentElement;
    var cw = COLORWAYS[v.colorway] || COLORWAYS.cyan;
    root.style.setProperty('--sys', cw.sys);
    root.style.setProperty('--sys-rgb', cw.rgb);
    root.style.setProperty('--bright', v.colorway === 'cyan' ? '#cdeeff' : '#ffffff');
    root.style.setProperty('--glow-k', String(v.glow));
    root.style.setProperty('--disp', "'" + v.font + "'");
    ensureFont(v.font); // load opt-in display fonts (incl. persisted/host-set) on demand
    document.body.setAttribute('data-motion', v.motion);
  }

  function persist(edits) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(values)); } catch (e) {}
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: edits }, '*'); } catch (e) {}
  }

  function setTweak(key, val) {
    values[key] = val;
    var edits = {}; edits[key] = val;
    apply(values);
    persist(edits);
    syncPanel();
  }

  /* ---------- on-brand tweaks panel ---------- */
  var panelEl = null;

  var PANEL_CSS =
    '.tk{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:264px;' +
    'font-family:var(--disp),system-ui,sans-serif;color:var(--text);' +
    'background:linear-gradient(180deg,rgba(8,18,30,.96),rgba(4,10,18,.96));' +
    'border:1px solid var(--line);box-shadow:0 0 28px rgba(var(--sys-rgb),.28),0 18px 50px rgba(0,0,0,.5);' +
    'backdrop-filter:blur(8px);}' +
    '.tk-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;' +
    'border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(var(--sys-rgb),.16),transparent);cursor:move;}' +
    '.tk-hd b{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--bright);text-shadow:0 0 10px rgba(var(--sys-rgb),.5);}' +
    '.tk-x{cursor:pointer;color:var(--danger);font-size:18px;line-height:1;background:none;border:0;text-shadow:0 0 8px var(--danger);}' +
    '.tk-bd{padding:14px;display:flex;flex-direction:column;gap:16px;}' +
    '.tk-row{display:flex;flex-direction:column;gap:8px;}' +
    '.tk-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);}' +
    '.tk-seg{display:flex;gap:6px;flex-wrap:wrap;}' +
    '.tk-seg button{flex:1;min-width:48px;font-family:var(--disp);font-size:11px;font-weight:600;letter-spacing:1px;' +
    'text-transform:uppercase;padding:8px 6px;cursor:pointer;color:var(--dim);background:rgba(var(--sys-rgb),.05);' +
    'border:1px solid rgba(var(--sys-rgb),.25);transition:.14s;}' +
    '.tk-seg button:hover{color:var(--bright);}' +
    '.tk-seg button[data-on="1"]{color:#fff;border-color:var(--sys);background:rgba(var(--sys-rgb),.2);box-shadow:inset 0 0 14px rgba(var(--sys-rgb),.2),0 0 12px rgba(var(--sys-rgb),.25);}' +
    '.tk-sw{display:flex;gap:8px;}' +
    '.tk-sw button{flex:1;height:30px;cursor:pointer;border:1px solid rgba(255,255,255,.12);position:relative;}' +
    '.tk-sw button[data-on="1"]{border-color:#fff;box-shadow:0 0 12px rgba(255,255,255,.35);}' +
    '.tk-sw button[data-on="1"]::after{content:"";position:absolute;inset:0;border:2px solid #fff;}' +
    '.tk-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:999px;background:rgba(var(--sys-rgb),.2);outline:none;}' +
    '.tk-range::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:var(--sys);box-shadow:0 0 10px var(--sys);cursor:pointer;}' +
    '.tk-range::-moz-range-thumb{width:15px;height:15px;border:0;border-radius:50%;background:var(--sys);box-shadow:0 0 10px var(--sys);cursor:pointer;}';

  function seg(key, opts) {
    return '<div class="tk-seg" data-key="' + key + '">' + opts.map(function (o) {
      return '<button data-val="' + o.v + '" data-on="' + (values[key] === o.v ? '1' : '0') + '">' + o.l + '</button>';
    }).join('') + '</div>';
  }

  function buildPanel() {
    if (panelEl) return;
    var st = document.createElement('style'); st.textContent = PANEL_CSS; document.head.appendChild(st);
    panelEl = document.createElement('div');
    panelEl.className = 'tk';
    panelEl.setAttribute('data-omelette-chrome', '');
    panelEl.innerHTML =
      '<div class="tk-hd"><b>Tweaks</b><button class="tk-x" aria-label="Close">✕</button></div>' +
      '<div class="tk-bd">' +
        '<div class="tk-row"><div class="tk-lbl">Colorway</div>' +
          '<div class="tk-sw" data-key="colorway">' +
            Object.keys(COLORWAYS).map(function (c) {
              return '<button data-val="' + c + '" data-on="' + (values.colorway === c ? '1' : '0') +
                '" style="background:' + COLORWAYS[c].sys + '" aria-label="' + c + '"></button>';
            }).join('') +
          '</div></div>' +
        '<div class="tk-row"><div class="tk-lbl">Display font</div>' +
          seg('font', [{ v: 'Exo 2', l: 'Exo 2' }, { v: 'Orbitron', l: 'Orbitron' }, { v: 'Chakra Petch', l: 'Chakra' }]) +
        '</div>' +
        '<div class="tk-row"><div class="tk-lbl">Motion</div>' +
          seg('motion', [{ v: 'full', l: 'Full' }, { v: 'low', l: 'Reduced' }]) +
        '</div>' +
        '<div class="tk-row"><div class="tk-lbl">Glow intensity</div>' +
          '<input class="tk-range" type="range" min="0.3" max="1.6" step="0.1" value="' + values.glow + '" data-key="glow"></div>' +
      '</div>';
    document.body.appendChild(panelEl);

    panelEl.querySelector('.tk-x').addEventListener('click', dismiss);
    panelEl.querySelectorAll('[data-key]').forEach(function (grp) {
      var key = grp.getAttribute('data-key');
      if (grp.classList.contains('tk-range') || grp.tagName === 'INPUT') {
        grp.addEventListener('input', function () { setTweak(key, Number(grp.value)); });
      } else {
        grp.querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () {
            var v = b.getAttribute('data-val');
            setTweak(key, v);
          });
        });
      }
    });
    makeDraggable(panelEl, panelEl.querySelector('.tk-hd'));
  }

  function syncPanel() {
    if (!panelEl) return;
    panelEl.querySelectorAll('.tk-seg, .tk-sw').forEach(function (grp) {
      var key = grp.getAttribute('data-key');
      grp.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('data-on', b.getAttribute('data-val') === String(values[key]) ? '1' : '0');
      });
    });
  }

  function makeDraggable(el, handle) {
    var sx, sy, sr, sb;
    handle.addEventListener('mousedown', function (e) {
      if (e.target.classList.contains('tk-x')) return;
      var r = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY;
      sr = window.innerWidth - r.right; sb = window.innerHeight - r.bottom;
      function mv(ev) {
        el.style.right = Math.max(8, sr - (ev.clientX - sx)) + 'px';
        el.style.bottom = Math.max(8, sb - (ev.clientY - sy)) + 'px';
      }
      function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    });
  }

  function showPanel() { buildPanel(); panelEl.style.display = ''; }
  function dismiss() {
    if (panelEl) panelEl.style.display = 'none';
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  }

  window.addEventListener('message', function (e) {
    var t = e && e.data && e.data.type;
    if (t === '__activate_edit_mode') showPanel();
    else if (t === '__deactivate_edit_mode') { if (panelEl) panelEl.style.display = 'none'; }
  });

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window) || values.motion === 'low') {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    function show(el) {
      if (el.classList.contains('in')) return;
      var d = el.getAttribute('data-delay');
      if (d) el.style.transitionDelay = d + 'ms';
      el.classList.add('in');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // Immediate pass: reveal anything already on screen (IO can be slow/flaky
    // for above-the-fold nodes in embedded/iframed contexts).
    function checkNow() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var t = el.getBoundingClientRect().top;
        if (t < vh * 0.94) { show(el); io.unobserve(el); }
      });
    }
    requestAnimationFrame(checkNow);
    setTimeout(checkNow, 300);
    // Safety net: never leave a reveal stuck invisible.
    setTimeout(function () { els.forEach(show); }, 2500);
  }

  /* ---------- typed System text ---------- */
  function initTyped() {
    var els = document.querySelectorAll('[data-type]');
    els.forEach(function (el) {
      var full = el.getAttribute('data-type');
      if (values.motion === 'low') { el.textContent = full; return; }
      el.textContent = '';
      el.classList.add('caret');
      var i = 0;
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(el);
          (function tick() {
            if (i <= full.length) { el.textContent = full.slice(0, i); i++; setTimeout(tick, 28); }
            else { setTimeout(function () { el.classList.remove('caret'); }, 1200); }
          })();
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ---------- atmospheric background layers ---------- */
  function buildBackground() {
    var field = document.querySelector('.bg-field');
    if (!field || document.querySelector('.bg-motes')) return;
    var aurora = document.createElement('div'); aurora.className = 'bg-aurora';
    var light = document.createElement('div'); light.className = 'bg-light';
    // ── Lightning: distant thunder flashes (.bg-flash) plus a couple of pre-drawn
    //    SVG bolts that strike on staggered CSS timers. No per-frame simulation —
    //    all motion is GPU-composited keyframes; CSS gates it off at motion=low. ──
    var flash = document.createElement('div'); flash.className = 'bg-flash';
    var flash2 = document.createElement('div'); flash2.className = 'bg-flash b2';
    var bolts = document.createElement('div'); bolts.className = 'bg-bolts';
    // Bolt geometry is pre-generated offline (fractal + recursive forking tree —
    // see scratchpad/genbolts.js) and baked as static SVG here. No runtime sim:
    // each bolt just draws in / flickers / fades on its own CSS timer.
    var BOLTS = [{"x":"14%","h":"66vh","dur":"8s","delay":"0s","segs":[{"d":"M80 7 L80 15 L78 22 L76 29 L75 37 L75 44 L74 51 L74 59 L74 66 L74 74 L74 81 L73 88 L72 96 L72 103 L70 110 L69 118 L69 125 L67 132 L67 140 L66 147 L65 154 L65 162 L64 169 L64 176 L63 184 L61 191 L60 198 L60 206 L60 213 L59 220 L58 228 L59 235 L59 243 L60 250 L61 257 L62 265 L64 272 L65 279 L65 287 L65 294 L65 302 L66 309 L66 316 L68 324 L69 331 L69 338 L70 346 L69 353 L69 361 L70 368 L71 375 L70 383 L69 390 L68 398 L67 405 L67 412 L66 420 L65 427 L64 434 L65 442 L65 449 L65 457 L65 464 L64 471 L63 479","w":2.6},{"d":"M59 235 L58 242 L55 248 L53 255 L53 262 L50 269 L47 275 L45 281 L42 288 L41 295 L39 301 L38 308 L36 315 L33 321 L30 328 L29 334 L28 341 L25 347 L22 354 L20 360 L16 366 L13 372 L10 379 L6 385 L3 391 L-1 397 L-3 403 L-8 408 L-11 415 L-13 421 L-15 428 L-17 435 L-19 441","w":1.61},{"d":"M22 354 L22 363 L21 372 L19 381 L18 391 L20 400 L21 409 L21 419 L22 428 L21 437 L21 447 L22 456 L22 465 L22 474 L22 484 L23 493 L25 502","w":1},{"d":"M22 456 L28 468 L32 480 L36 492 L39 505 L41 518 L45 531 L47 543 L52 556","w":0.62},{"d":"M22 465 L26 475 L30 485 L36 494 L40 505 L45 514 L50 523 L57 532 L63 541","w":0.62},{"d":"M36 315 L33 320 L28 323 L25 329 L21 333 L18 338 L15 344 L14 350 L12 356 L7 359 L2 362 L-2 367 L-5 372 L-9 376 L-15 379 L-17 385 L-21 389","w":1},{"d":"M14 350 L10 357 L6 364 L0 370 L-4 378 L-8 385 L-13 391 L-18 399 L-22 405","w":0.62},{"d":"M14 350 L9 354 L4 358 L0 363 L-5 366 L-10 371 L-13 377 L-17 381 L-23 384","w":0.62},{"d":"M71 375 L73 385 L77 394 L79 404 L80 414 L81 423 L83 433 L84 443 L84 453 L88 462 L92 471 L95 481 L96 490 L97 500 L98 510 L102 519 L103 529 L105 539 L107 548 L108 558 L111 568 L113 577 L116 587 L120 596 L123 605 L126 615 L130 624 L135 632 L138 642 L140 651 L143 661 L146 670 L150 679","w":1.61},{"d":"M138 642 L147 654 L154 667 L163 680 L169 693 L179 704 L188 717 L196 729 L206 741 L214 754 L222 767 L229 780 L237 793 L247 804 L257 816 L264 829 L274 841","w":1},{"d":"M247 804 L257 812 L266 821 L276 829 L285 839 L294 848 L305 855 L313 865 L322 874","w":0.62},{"d":"M214 754 L216 770 L218 787 L218 803 L222 819 L225 835 L227 852 L229 868 L231 884","w":0.62},{"d":"M105 539 L110 547 L116 555 L123 562 L130 569 L135 578 L140 586 L144 595 L148 604 L155 611 L162 618 L167 626 L174 634 L178 643 L184 651 L190 659 L194 667","w":1},{"d":"M135 578 L144 585 L155 591 L165 598 L173 607 L182 615 L193 622 L204 628 L214 634","w":0.62}]},{"x":"31%","h":"58vh","dur":"11s","delay":"2.4s","segs":[{"d":"M71 9 L73 16 L76 23 L76 31 L77 38 L77 46 L77 53 L77 61 L78 68 L78 76 L78 83 L78 91 L78 98 L78 106 L78 113 L78 121 L79 128 L78 136 L79 143 L80 151 L82 158 L83 166 L83 173 L83 181 L81 188 L83 195 L83 203 L84 210 L85 218 L84 225 L85 233 L85 240 L84 248 L84 255 L85 263 L86 270 L85 278 L87 285 L88 293 L90 300 L91 308 L91 315 L89 323 L89 330 L88 338 L89 345 L89 353 L89 360 L88 368 L88 375 L90 383 L91 390 L94 397 L95 404 L95 412 L96 420 L96 427 L96 435 L98 442 L100 449 L102 456 L101 464 L101 472 L103 479 L104 486","w":2.6},{"d":"M80 151 L82 158 L83 166 L85 174 L88 181 L89 189 L90 197 L92 205 L94 213 L94 221 L94 228 L94 236 L96 244 L94 252 L93 260 L94 268 L94 276 L94 284 L96 292 L95 300 L95 308 L98 315 L101 323 L101 331 L103 338 L104 346 L105 354 L107 362 L107 370 L109 377 L113 385 L116 392 L117 400","w":1.61},{"d":"M101 323 L104 335 L109 346 L113 358 L119 369 L125 380 L130 392 L134 404 L138 415 L142 427 L146 439 L149 451 L152 464 L156 475 L159 488 L162 500 L163 512","w":1},{"d":"M134 404 L145 414 L154 426 L164 437 L174 448 L185 458 L194 470 L202 483 L211 495","w":0.62},{"d":"M156 475 L159 490 L162 504 L165 518 L167 532 L170 546 L175 560 L179 574 L180 589","w":0.62},{"d":"M94 268 L93 280 L90 292 L87 304 L84 315 L80 327 L79 339 L78 351 L76 363 L73 375 L73 387 L72 400 L70 412 L67 424 L63 435 L62 447 L59 459","w":1},{"d":"M78 351 L80 370 L83 388 L83 407 L84 425 L82 443 L82 462 L83 480 L81 499","w":0.62},{"d":"M78 351 L77 364 L76 377 L76 389 L77 402 L78 415 L80 427 L81 440 L79 453","w":0.62},{"d":"M84 255 L85 265 L85 275 L88 284 L90 293 L92 303 L95 312 L96 321 L97 331 L99 340 L103 349 L105 358 L107 368 L108 377 L110 387 L111 396 L113 406 L115 415 L116 425 L118 434 L122 443 L123 453 L124 462 L125 472 L126 481 L127 491 L129 500 L132 510 L135 519 L137 528 L141 537 L145 546 L149 555","w":1.61},{"d":"M103 349 L106 361 L107 373 L109 385 L110 397 L113 409 L115 421 L119 433 L121 444 L123 457 L123 469 L126 481 L128 493 L131 504 L134 516 L135 528 L137 540","w":1},{"d":"M123 457 L124 476 L126 496 L125 516 L124 536 L124 556 L121 575 L123 595 L122 615","w":0.62}]},{"x":"52%","h":"70vh","dur":"9.5s","delay":"5s","segs":[{"d":"M85 11 L85 18 L86 26 L87 33 L88 40 L89 48 L92 55 L92 62 L94 70 L95 77 L97 84 L97 92 L97 99 L97 107 L98 114 L100 121 L102 128 L104 135 L106 143 L106 150 L108 158 L108 165 L108 173 L108 180 L108 188 L110 195 L113 202 L114 209 L115 216 L118 223 L119 231 L120 238 L122 245 L122 253 L122 260 L124 268 L125 275 L125 282 L126 290 L126 297 L125 305 L125 312 L124 320 L122 327 L121 334 L121 342 L120 349 L120 357 L122 364 L123 371 L123 379 L124 386 L124 394 L123 401 L123 409 L123 416 L123 424 L122 431 L122 438 L124 446 L125 453 L127 460 L128 468 L129 475 L130 483","w":2.6},{"d":"M115 216 L111 221 L108 227 L106 233 L103 239 L101 244 L97 249 L95 255 L92 261 L89 267 L88 273 L85 279 L83 285 L83 291 L83 297 L82 304 L79 310 L78 316 L76 322 L73 327 L72 334 L72 340 L70 346 L69 352 L69 359 L67 365 L66 371 L64 377 L61 382 L59 388 L58 394 L55 400 L54 406","w":1.61},{"d":"M85 279 L86 286 L85 293 L85 300 L84 307 L82 314 L81 321 L82 328 L81 336 L79 342 L77 350 L74 356 L70 362 L68 369 L66 376 L65 383 L65 390","w":1},{"d":"M74 356 L73 363 L73 371 L73 378 L72 385 L73 392 L75 399 L76 407 L78 414","w":0.62},{"d":"M84 307 L85 315 L86 322 L87 330 L90 337 L89 345 L90 353 L92 360 L93 368","w":0.62},{"d":"M88 273 L87 278 L89 283 L87 288 L87 294 L86 299 L88 304 L90 309 L91 314 L91 320 L90 325 L89 330 L90 335 L90 341 L90 346 L89 351 L88 356","w":1},{"d":"M87 294 L86 300 L87 307 L86 313 L85 320 L83 326 L81 332 L79 339 L79 345","w":0.62},{"d":"M122 260 L124 267 L126 274 L127 281 L129 288 L130 296 L129 303 L130 310 L130 317 L130 324 L131 332 L132 339 L131 346 L133 353 L134 360 L133 367 L134 375 L135 382 L134 389 L133 396 L133 403 L133 410 L132 418 L133 425 L131 432 L131 439 L130 446 L129 453 L130 461 L130 468 L130 475 L130 482 L129 489","w":1.61},{"d":"M132 418 L130 426 L128 435 L129 444 L128 453 L127 462 L124 470 L122 479 L120 487 L117 496 L115 505 L112 513 L108 521 L106 530 L103 538 L103 547 L101 556","w":1},{"d":"M124 470 L118 481 L114 493 L108 504 L100 514 L93 524 L88 536 L82 547 L76 558","w":0.62},{"d":"M133 403 L133 411 L133 419 L132 426 L132 434 L133 442 L136 449 L136 457 L136 464 L138 472 L140 479 L142 487 L141 495 L142 502 L141 510 L142 518 L143 525","w":1},{"d":"M140 479 L141 488 L141 497 L143 506 L142 515 L140 523 L137 532 L136 541 L137 550","w":0.62},{"d":"M141 510 L138 519 L137 528 L136 537 L135 546 L133 555 L129 563 L125 572 L121 580","w":0.62}]},{"x":"71%","h":"60vh","dur":"12s","delay":"3.5s","segs":[{"d":"M83 0 L81 8 L81 16 L81 23 L81 31 L80 39 L80 47 L80 55 L78 62 L80 70 L80 78 L80 86 L80 94 L81 101 L81 109 L80 117 L78 125 L77 133 L77 140 L76 148 L75 156 L75 164 L73 171 L73 179 L72 187 L72 195 L70 202 L69 210 L69 218 L68 226 L67 234 L66 241 L64 249 L64 257 L65 265 L65 272 L65 280 L64 288 L62 296 L62 304 L61 311 L62 319 L63 327 L63 335 L65 342 L65 350 L66 358 L67 366 L69 374 L70 381 L73 389 L73 397 L74 404 L73 412 L74 420 L75 428 L74 436 L76 443 L76 451 L76 459 L77 467 L77 475 L77 482 L77 490 L79 498","w":2.6},{"d":"M74 420 L71 427 L68 434 L65 440 L61 447 L60 454 L58 461 L56 468 L54 476 L54 483 L53 490 L53 498 L53 505 L51 512 L49 519 L48 527 L46 534 L46 541 L45 548 L45 556 L44 563 L45 570 L44 578 L43 585 L41 592 L39 600 L37 607 L36 614 L36 621 L33 628 L30 635 L29 642 L26 649","w":1.61},{"d":"M45 556 L44 567 L44 577 L46 588 L46 599 L49 609 L53 620 L53 630 L55 641 L56 652 L55 663 L54 673 L53 684 L54 695 L57 705 L56 716 L57 727","w":1},{"d":"M53 630 L56 640 L62 648 L67 657 L71 666 L75 675 L80 683 L83 693 L88 702","w":0.62},{"d":"M45 570 L44 578 L42 585 L40 592 L37 598 L34 605 L29 611 L27 618 L26 626 L23 632 L19 639 L18 646 L16 653 L15 660 L11 667 L7 673 L3 679","w":1},{"d":"M15 660 L11 668 L8 676 L4 683 L0 691 L-3 699 L-4 708 L-7 716 L-11 723","w":0.62},{"d":"M29 611 L25 620 L23 630 L18 639 L15 648 L9 656 L4 664 L-2 673 L-7 680","w":0.62},{"d":"M62 319 L68 330 L73 341 L79 352 L85 363 L91 373 L95 385 L99 396 L104 408 L110 419 L115 430 L121 440 L128 451 L133 462 L138 473 L143 484 L147 496 L151 508 L156 519 L160 530 L166 541 L172 552 L176 564 L182 575 L189 585 L196 595 L202 605 L208 616 L213 627 L219 638 L225 649 L229 661 L233 672","w":1.61},{"d":"M182 575 L191 583 L200 593 L207 603 L215 613 L224 622 L234 631 L243 640 L250 650 L260 658 L269 667 L280 675 L289 684 L299 691 L309 699 L318 708 L328 717","w":1},{"d":"M289 684 L299 698 L310 711 L320 725 L328 741 L339 755 L350 768 L362 781 L374 793","w":0.62},{"d":"M166 541 L172 550 L180 558 L185 568 L191 577 L197 586 L204 594 L212 602 L218 612 L223 621 L229 631 L234 640 L240 649 L245 659 L249 669 L254 679 L260 688","w":1},{"d":"M197 586 L209 595 L221 605 L233 615 L246 622 L256 634 L266 645 L278 655 L290 664","w":0.62}]},{"x":"87%","h":"64vh","dur":"10s","delay":"6.5s","segs":[{"d":"M75 1 L75 9 L75 17 L75 24 L74 32 L76 40 L77 48 L79 55 L79 63 L79 71 L80 79 L83 86 L84 94 L86 101 L86 109 L86 117 L87 125 L87 133 L86 140 L86 148 L85 156 L86 164 L85 171 L84 179 L83 187 L83 195 L83 202 L82 210 L80 218 L81 226 L81 233 L81 241 L80 249 L79 257 L79 264 L78 272 L75 279 L74 287 L74 295 L73 303 L71 310 L71 318 L71 326 L70 334 L69 341 L69 349 L68 357 L67 364 L67 372 L68 380 L68 388 L68 396 L66 403 L67 411 L67 419 L68 427 L69 434 L67 442 L65 450 L64 457 L62 465 L63 473 L62 481 L63 488 L61 496","w":2.6},{"d":"M71 310 L67 321 L63 331 L59 341 L53 351 L47 360 L42 370 L38 381 L33 391 L28 400 L24 411 L19 420 L13 430 L9 440 L6 451 L1 461 L-2 472 L-7 482 L-14 491 L-18 501 L-23 511 L-28 521 L-34 530 L-40 540 L-47 549 L-53 558 L-58 568 L-63 578 L-68 587 L-71 598 L-76 608 L-81 619 L-85 629","w":1.61},{"d":"M-53 558 L-56 568 L-59 579 L-63 589 L-68 599 L-73 609 L-78 618 L-84 628 L-89 637 L-95 647 L-100 656 L-107 665 L-112 674 L-116 685 L-121 695 L-125 704 L-131 714","w":1},{"d":"M-73 609 L-77 623 L-83 637 L-87 651 L-93 664 L-101 676 L-109 689 L-116 702 L-120 716","w":0.62},{"d":"M-95 647 L-100 654 L-106 661 L-112 668 L-119 673 L-126 679 L-133 686 L-141 690 L-148 695","w":0.62},{"d":"M-47 549 L-50 558 L-54 566 L-57 575 L-62 584 L-66 593 L-69 602 L-71 611 L-74 620 L-77 629 L-82 637 L-88 645 L-93 653 L-98 662 L-102 670 L-108 678 L-114 685","w":1},{"d":"M-88 645 L-95 656 L-101 667 L-106 679 L-111 691 L-118 702 L-126 712 L-132 724 L-140 734","w":0.62},{"d":"M80 249 L82 257 L83 266 L85 274 L88 282 L90 290 L92 299 L95 307 L99 314 L102 322 L105 330 L107 339 L109 347 L113 354 L119 361 L122 369 L125 377 L128 385 L131 393 L134 401 L136 409 L138 418 L139 426 L141 434 L145 442 L147 450 L150 458 L152 466 L155 474 L159 482 L161 491 L163 499 L164 507","w":1.61},{"d":"M113 354 L113 363 L110 372 L110 381 L111 389 L112 398 L112 407 L114 416 L115 424 L115 433 L114 442 L113 450 L112 459 L109 467 L108 476 L107 485 L107 494","w":1},{"d":"M112 407 L115 414 L120 420 L123 426 L127 433 L129 440 L133 446 L134 453 L134 461","w":0.62},{"d":"M114 442 L113 449 L110 455 L108 462 L107 469 L106 476 L106 483 L104 490 L104 497","w":0.62},{"d":"M125 377 L125 388 L125 398 L124 409 L125 420 L126 430 L126 441 L125 452 L127 462 L127 473 L129 484 L130 494 L130 505 L129 516 L131 526 L131 537 L131 548","w":1},{"d":"M129 516 L129 532 L128 549 L127 565 L126 582 L127 599 L128 615 L129 632 L132 648","w":0.62},{"d":"M126 441 L132 454 L138 467 L143 479 L151 491 L157 504 L161 517 L168 530 L172 543","w":0.62}]}];
    bolts.innerHTML = BOLTS.map(function (b) {
      var paths = '';
      for (var i = 0; i < b.segs.length; i++)          // soft cyan halo (behind)
        paths += '<path class="glow" style="stroke-width:' + (b.segs[i].w * 3.2).toFixed(1) + '" d="' + b.segs[i].d + '"/>';
      for (var j = 0; j < b.segs.length; j++)          // bright white core (front)
        paths += '<path class="core" style="stroke-width:' + Math.max(1, b.segs[j].w * 0.95).toFixed(1) + '" d="' + b.segs[j].d + '"/>';
      return '<svg viewBox="-40 -12 240 504" style="left:' + b.x + ';height:' + b.h +
             ';animation-duration:' + b.dur + ';animation-delay:' + b.delay + '">' + paths + '</svg>';
    }).join('');
    var grid = document.createElement('div'); grid.className = 'bg-grid';
    var motes = document.createElement('div'); motes.className = 'bg-motes';
    var n = (values.motion === 'low') ? 0 : 24;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var m = document.createElement('i');
      var size = (Math.random() * 1.8 + 1).toFixed(1);
      var dur = (Math.random() * 16 + 12).toFixed(1);
      m.style.left = (Math.random() * 100).toFixed(2) + '%';
      m.style.width = size + 'px'; m.style.height = size + 'px';
      m.style.animationDuration = dur + 's';
      m.style.animationDelay = (-Math.random() * dur).toFixed(1) + 's';
      m.style.opacity = '';
      frag.appendChild(m);
    }
    motes.appendChild(frag);
    field.insertAdjacentElement('afterend', aurora);
    aurora.insertAdjacentElement('afterend', light);
    light.insertAdjacentElement('afterend', flash);
    flash.insertAdjacentElement('afterend', flash2);
    flash2.insertAdjacentElement('afterend', bolts);
    bolts.insertAdjacentElement('afterend', grid);
    grid.insertAdjacentElement('afterend', motes);
  }

  /* ---------- download: served from GitHub Releases ----------
     While pending (no release yet), a click pulses the note instead of navigating. On load we ask the
     GitHub API for the latest release; if it carries an .apk asset we point the button straight at it,
     drop the pending state, and fill in the real version + size. Each new release updates the page
     automatically — no HTML edit per build. */
  var RELEASE_REPO = 'Khoality-dev/the-system-official';
  function hydrateDownload() {
    var apk = document.getElementById('apk-btn');
    if (!apk) return;
    var note = document.getElementById('apk-note');
    apk.addEventListener('click', function (e) {
      if (!apk.getAttribute('data-apk-pending')) return; // released → let the link download
      e.preventDefault();
      if (note) {
        note.style.transition = 'none'; note.style.opacity = '0.3';
        setTimeout(function () { note.style.transition = 'opacity .4s'; note.style.opacity = '1'; }, 30);
      }
    });
    if (!window.fetch) return;
    fetch('https://api.github.com/repos/' + RELEASE_REPO + '/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rel) {
        if (!rel || !rel.assets) return;
        var asset = rel.assets.filter(function (a) { return /\.apk$/i.test(a.name); })[0];
        if (!asset) return;
        apk.href = asset.browser_download_url;
        apk.removeAttribute('data-apk-pending');
        var v = document.getElementById('apk-version');
        if (v && rel.tag_name) v.textContent = rel.tag_name.replace(/^v/i, '');
        var s = document.getElementById('apk-size');
        if (s && asset.size) s.textContent = '~' + Math.round(asset.size / 1048576) + ' MB';
        if (note) {
          note.textContent = 'Latest release: ' + (rel.name || rel.tag_name) + ' · verified by Android on install.';
          note.style.color = 'var(--dim)';
        }
      })
      .catch(function () { /* offline / rate-limited → stay in the pending state */ });
  }

  /* ---------- init ---------- */
  function init() {
    apply(values);
    buildBackground();
    initReveal();
    initTyped();
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
    hydrateDownload();
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
