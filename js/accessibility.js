/**
 * accessibility.js
 * Features de acessibilidade: contraste, fonte, língua de sinais, tradução.
 */

const A11y = (() => {

  // ─── Alto contraste ─────────────────────────────────────────────────────────

  function toggleHighContrast() {
    const root = document.documentElement;
    const isOn = root.getAttribute('data-theme') === 'high-contrast';
    root.setAttribute('data-theme', isOn ? '' : 'high-contrast');
    localStorage.setItem('a11y-contrast', isOn ? '' : 'high-contrast');
    updateBtn('btn-contrast', !isOn);
  }

  // ─── Tamanho de fonte ────────────────────────────────────────────────────────

  const fontSizes = ['normal', 'large', 'xlarge'];
  function cycleFontSize() {
    const root = document.documentElement;
    const current = root.getAttribute('data-font-size') || 'normal';
    const next = fontSizes[(fontSizes.indexOf(current) + 1) % fontSizes.length];
    root.setAttribute('data-font-size', next);
    localStorage.setItem('a11y-font-size', next);
    const btn = document.getElementById('btn-font-size');
    if (btn) btn.textContent = { normal: 'A', large: 'A+', xlarge: 'A++' }[next];
  }

  // ─── Língua de Sinais ────────────────────────────────────────────────────────

  let vLibrasState  = 'idle'; // idle | loading | ready | error
  let signPanel     = null;   // painel para EN / ES

  // Carrega VLibras uma única vez, em background
  function loadVLibras() {
    if (vLibrasState !== 'idle') return;
    vLibrasState = 'loading';

    if (!document.getElementById('vlibras-root')) {
      const vw = document.createElement('div');
      vw.id = 'vlibras-root';
      vw.setAttribute('vw', '');
      vw.className = 'enabled';
      vw.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(vw);
    }

    const script  = document.createElement('script');
    script.src    = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.onload = () => {
      try {
        // O argumento DEVE ser a URL base do app — NÃO o arquivo .js,
        // senão os assets (fontes, Unity) ficam com caminho quebrado.
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        vLibrasState = 'ready';
      } catch (e) {
        vLibrasState = 'error';
      }
    };
    script.onerror = () => { vLibrasState = 'error'; };
    document.head.appendChild(script);
  }

  // Aciona o botão nativo do VLibras (abre o painel Unity)
  function triggerVLibras() {
    const tryClick = (attempts) => {
      const btn = document.querySelector('[vw-access-button]');
      if (btn) {
        btn.click();
        updateBtn('btn-libras', true);
        return;
      }
      if (attempts > 0) setTimeout(() => tryClick(attempts - 1), 400);
      else showToast('VLibras ainda carregando, aguarde um instante.', 'info');
    };

    if (vLibrasState === 'idle') {
      loadVLibras();
      showToast('Carregando intérprete de Libras…', 'info');
      setTimeout(() => triggerVLibras(), 2500);
    } else if (vLibrasState === 'loading') {
      showToast('Aguarde, VLibras ainda está carregando…', 'info');
      tryClick(5);
    } else if (vLibrasState === 'error') {
      showToast('VLibras indisponível. Verifique sua conexão com a internet.', 'error');
    } else {
      tryClick(3);
    }
  }

  // ─── Painel simples para EN / ES ─────────────────────────────────────────────

  const SIGN_INFO = {
    'en-US': {
      flag: '🇺🇸', name: 'American Sign Language (ASL)', color: '#1b4f72', bg: '#eafaf1',
      links: [
        { href: 'https://www.handspeak.com',  text: 'HandSpeak — ASL video dictionary' },
        { href: 'https://www.nad.org',         text: 'National Association of the Deaf' },
        { href: 'https://asldeafined.com',     text: 'ASL Deafined — video lessons' },
      ],
      note: 'No free real-time ASL interpreter exists for web embedding. Use the resources below:',
    },
    'es': {
      flag: '🇪🇸', name: 'Lengua de Signos Española (LSE)', color: '#78281f', bg: '#fdf2f0',
      links: [
        { href: 'https://www.sematos.eu/lse.html',  text: 'Sematos — diccionario LSE en vídeo' },
        { href: 'https://fundacioncnse.org',          text: 'Fundación CNSE' },
      ],
      note: 'No existe un intérprete LSE gratuito para web. Recursos disponibles:',
    },
  };

  function injectPanelStyles() {
    if (document.getElementById('sign-panel-styles')) return;
    const s = document.createElement('style');
    s.id = 'sign-panel-styles';
    s.textContent = `
      #sign-panel {
        position: fixed;
        bottom: 72px;
        right: 20px;
        width: 270px;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 10px 36px rgba(0,0,0,0.16);
        z-index: 9999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 2px solid var(--sp-color, #1b4f72);
        font-family: var(--font-family, sans-serif);
      }
      #sign-panel.open { display: flex; animation: sp-in 0.18s ease; }
      @keyframes sp-in {
        from { opacity:0; transform:translateY(8px); }
        to   { opacity:1; transform:translateY(0); }
      }
      #sp-bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 14px;
        background: var(--sp-color, #1b4f72);
        color: #fff;
      }
      #sp-title { font-size: 13px; font-weight: 700; }
      #sp-close {
        background: none; border: none; color: #fff;
        font-size: 15px; cursor: pointer; opacity: 0.8;
        padding: 2px 4px; border-radius: 4px;
      }
      #sp-close:hover { opacity: 1; background: rgba(255,255,255,0.15); }
      #sp-body {
        padding: 16px;
        background: var(--sp-bg, #eafaf1);
        display: flex; flex-direction: column; gap: 10px;
      }
      #sp-note {
        font-size: 11px; color: #444; margin: 0; line-height: 1.5;
      }
      #sp-links { display: flex; flex-direction: column; gap: 6px; }
      #sp-links a {
        font-size: 12px;
        color: var(--sp-color, #1b4f72);
        text-decoration: underline;
      }
    `;
    document.head.appendChild(s);
  }

  function createSignPanel() {
    const el = document.createElement('div');
    el.id = 'sign-panel';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Sign Language Resources');
    el.innerHTML = `
      <div id="sp-bar">
        <span id="sp-title"></span>
        <button id="sp-close" aria-label="Close">✕</button>
      </div>
      <div id="sp-body">
        <p id="sp-note"></p>
        <div id="sp-links"></div>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#sp-close').addEventListener('click', closeSignPanel);
    return el;
  }

  function openSignPanel() {
    if (!signPanel) signPanel = createSignPanel();
    const lang = (typeof I18n !== 'undefined') ? I18n.getCurrent() : 'en-US';
    const cfg  = SIGN_INFO[lang] || SIGN_INFO['en-US'];

    signPanel.style.setProperty('--sp-color', cfg.color);
    signPanel.style.setProperty('--sp-bg', cfg.bg);
    signPanel.querySelector('#sp-title').textContent  = cfg.flag + ' ' + cfg.name.split('(')[1]?.replace(')', '') || cfg.name;
    signPanel.querySelector('#sp-note').textContent   = cfg.note;

    const linksEl = signPanel.querySelector('#sp-links');
    linksEl.innerHTML = '';
    cfg.links.forEach(({ href, text }) => {
      const a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = '🔗 ' + text;
      linksEl.appendChild(a);
    });

    signPanel.classList.add('open');
    updateBtn('btn-libras', true);
    localStorage.setItem('a11y-sign', 'open');
  }

  function closeSignPanel() {
    if (signPanel) signPanel.classList.remove('open');
    updateBtn('btn-libras', false);
    localStorage.removeItem('a11y-sign');
    const btn = document.getElementById('btn-libras');
    if (btn) btn.focus();
  }

  // ─── Dispatcher principal ────────────────────────────────────────────────────

  function handleSignBtn() {
    const lang = (typeof I18n !== 'undefined') ? I18n.getCurrent() : 'pt-BR';

    if (lang === 'pt-BR') {
      // Fecha o painel EN/ES se estiver aberto
      if (signPanel) signPanel.classList.remove('open');
      triggerVLibras();
    } else {
      // Fecha VLibras se estiver aberto
      const vBtn = document.querySelector('[vw-access-button]');
      if (vBtn && document.querySelector('[vw-plugin-wrapper]')?.classList.contains('active')) {
        vBtn.click();
      }
      if (signPanel && signPanel.classList.contains('open')) {
        closeSignPanel();
      } else {
        openSignPanel();
      }
    }
  }

  function onLangChange() {
    // Se trocou para PT-BR com o painel EN/ES aberto, fecha o painel
    const lang = (typeof I18n !== 'undefined') ? I18n.getCurrent() : 'pt-BR';
    if (lang === 'pt-BR' && signPanel && signPanel.classList.contains('open')) {
      closeSignPanel();
      updateBtn('btn-libras', false);
    }
    // Se trocou de PT-BR para outro, fecha VLibras se aberto
    if (lang !== 'pt-BR') {
      updateBtn('btn-libras', false);
    }
  }

  // ─── Tradução (placeholder) ──────────────────────────────────────────────────

  function openTranslation() {
    showToast(typeof I18n !== 'undefined' ? I18n.t('a11y.toast.translate') : 'Função de tradução: em desenvolvimento.', 'info');
  }

  // ─── Leitura em voz (TTS via Web Speech API) ─────────────────────────────────

  const TTS_OK = ('speechSynthesis' in window);
  let readAloudOn = false;
  let lastSpoken  = null;
  const warnedNoVoice = new Set();

  if (TTS_OK) {
    // Algumas engines carregam as vozes de forma assíncrona
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
  }

  // Elementos "lê­veis" — evita ler contêineres gigantes
  const READABLE = 'a, button, h1, h2, h3, h4, h5, li, p, label, th, td, summary,' +
    ' .activity-item, .sidebar__nav-item, .badge, .card__header, .field-error';

  function ttsLang() {
    const l = (typeof I18n !== 'undefined') ? I18n.getCurrent() : 'pt-BR';
    return l === 'es' ? 'es-ES' : l; // pt-BR | en-US | es-ES
  }

  function pickVoice(lang) {
    if (!TTS_OK) return null;
    const vs = speechSynthesis.getVoices();
    const want = lang.toLowerCase().replace('_', '-');
    const base = want.split('-')[0];
    return vs.find(v => v.lang.toLowerCase().replace('_', '-') === want)
        || vs.find(v => v.lang.toLowerCase().replace('_', '-').split('-')[0] === base)
        || null;
  }

  function notifyNoVoice(lang) {
    const base = lang.split('-')[0];
    if (warnedNoVoice.has(base)) return;
    warnedNoVoice.add(base);
    highlight(null);
    showToast(I18n.t('a11y.toast.novoice'), 'info');
  }

  function speak(text) {
    if (!TTS_OK || !text) return;
    const lang  = ttsLang();
    const vs    = speechSynthesis.getVoices();
    const voice = pickVoice(lang);
    // Vozes já carregadas e nenhuma corresponde ao idioma:
    // não ler com voz de outro idioma (pronúncia incorreta)
    if (vs.length && !voice) { notifyNoVoice(lang); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : lang;
    if (voice) u.voice = voice;
    u.rate = 1;
    speechSynthesis.speak(u);
  }

  function highlight(el) {
    if (lastSpoken) lastSpoken.classList.remove('a11y-reading');
    if (el) el.classList.add('a11y-reading');
    lastSpoken = el;
  }

  function readFromEvent(e) {
    if (!readAloudOn || !e.target || !e.target.closest) return;
    const el = e.target.closest(READABLE);
    if (!el || el === lastSpoken) return;
    const txt = (el.getAttribute('aria-label') || el.innerText || '').trim();
    if (!txt) return;
    highlight(el);
    speak(txt);
  }

  function setReadAloud(on, announce) {
    if (!TTS_OK) return;
    readAloudOn = on;
    document.documentElement.setAttribute('data-read-aloud', on ? 'on' : '');
    updateBtn('btn-read-aloud', on);
    const btn = document.getElementById('btn-read-aloud');
    if (btn) btn.setAttribute('aria-pressed', String(on));
    if (on) {
      document.addEventListener('mouseover', readFromEvent);
      document.addEventListener('focusin', readFromEvent);
      if (announce) speak(I18n.t('a11y.toast.readaloud.on'));
    } else {
      document.removeEventListener('mouseover', readFromEvent);
      document.removeEventListener('focusin', readFromEvent);
      highlight(null);
      speechSynthesis.cancel();
      if (announce) showToast(I18n.t('a11y.toast.readaloud.off'), '');
    }
    localStorage.setItem('a11y-read', on ? '1' : '');
  }

  function toggleReadAloud() {
    setReadAloud(!readAloudOn, true);
  }

  // ─── Modo acessibilidade (pacote) ────────────────────────────────────────────

  let a11yModeOn = false;

  function setA11yMode(on, silent) {
    const root = document.documentElement;
    a11yModeOn = on;
    updateBtn('btn-a11y-mode', on);
    const btn = document.getElementById('btn-a11y-mode');
    if (btn) btn.setAttribute('aria-pressed', String(on));

    if (on) {
      root.setAttribute('data-a11y-mode', 'on');
      root.setAttribute('data-theme', 'high-contrast');
      updateBtn('btn-contrast', true);
      root.setAttribute('data-font-size', 'xlarge');
      const fb = document.getElementById('btn-font-size');
      if (fb) fb.textContent = 'A++';
      setReadAloud(true, false);
      localStorage.setItem('a11y-mode', 'on');
      localStorage.setItem('a11y-contrast', 'high-contrast');
      localStorage.setItem('a11y-font-size', 'xlarge');
      if (!silent) { showToast(I18n.t('a11y.toast.mode.on'), 'success'); speak(I18n.t('a11y.toast.mode.on')); }
    } else {
      root.removeAttribute('data-a11y-mode');
      root.setAttribute('data-theme', '');
      updateBtn('btn-contrast', false);
      root.setAttribute('data-font-size', 'normal');
      const fb = document.getElementById('btn-font-size');
      if (fb) fb.textContent = 'A';
      setReadAloud(false, false);
      localStorage.removeItem('a11y-mode');
      localStorage.setItem('a11y-contrast', '');
      localStorage.setItem('a11y-font-size', 'normal');
      if (!silent) showToast(I18n.t('a11y.toast.mode.off'), '');
    }
  }

  function toggleA11yMode() {
    setA11yMode(!a11yModeOn, false);
  }

  // ─── Injeção dos botões na barra de acessibilidade ───────────────────────────

  function injectA11yButtons() {
    const bar = document.querySelector('.a11y-bar');
    if (!bar || document.getElementById('btn-a11y-mode')) return;
    const label = bar.querySelector('.a11y-bar__label');

    const mode = document.createElement('button');
    mode.className = 'a11y-btn a11y-btn--mode';
    mode.id = 'btn-a11y-mode';
    mode.setAttribute('aria-pressed', 'false');
    mode.innerHTML = '♿ <span data-i18n="a11y.mode"></span>';
    mode.querySelector('span').textContent = I18n.t('a11y.mode');
    mode.title = I18n.t('a11y.mode');
    mode.addEventListener('click', toggleA11yMode);

    const anchor = label ? label.nextSibling : bar.firstChild;
    bar.insertBefore(mode, anchor);

    if (TTS_OK) {
      const read = document.createElement('button');
      read.className = 'a11y-btn';
      read.id = 'btn-read-aloud';
      read.setAttribute('aria-pressed', 'false');
      read.innerHTML = '🔊 <span data-i18n="a11y.readaloud"></span>';
      read.querySelector('span').textContent = I18n.t('a11y.readaloud');
      read.title = I18n.t('a11y.readaloud');
      read.addEventListener('click', toggleReadAloud);
      bar.insertBefore(read, mode.nextSibling);
    }
  }

  function restoreA11yExtras() {
    if (localStorage.getItem('a11y-mode') === 'on') {
      setA11yMode(true, true);
    } else if (localStorage.getItem('a11y-read') === '1') {
      setReadAloud(true, false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function updateBtn(id, active) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', active);
  }

  function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast show' + (type ? ' toast--' + type : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  // ─── Restaurar preferências ──────────────────────────────────────────────────

  function restore() {
    const contrast = localStorage.getItem('a11y-contrast');
    if (contrast === 'high-contrast') {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
      updateBtn('btn-contrast', true);
    }

    const fontSize = localStorage.getItem('a11y-font-size');
    if (fontSize && fontSize !== 'normal') {
      document.documentElement.setAttribute('data-font-size', fontSize);
      const btn = document.getElementById('btn-font-size');
      if (btn) btn.textContent = fontSize === 'large' ? 'A+' : 'A++';
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  function init() {
    injectPanelStyles();
    injectA11yButtons();
    restore();
    restoreA11yExtras();

    // Pré-carrega VLibras se o idioma for PT-BR
    const lang = (typeof I18n !== 'undefined') ? I18n.getCurrent() : 'pt-BR';
    if (lang === 'pt-BR') loadVLibras();

    const btnContrast  = document.getElementById('btn-contrast');
    const btnFontSize  = document.getElementById('btn-font-size');
    const btnLibras    = document.getElementById('btn-libras');
    const btnTranslate = document.getElementById('btn-translate');

    if (btnContrast)  btnContrast.addEventListener('click', toggleHighContrast);
    if (btnFontSize)  btnFontSize.addEventListener('click', cycleFontSize);
    if (btnLibras)    btnLibras.addEventListener('click', handleSignBtn);
    if (btnTranslate) btnTranslate.addEventListener('click', openTranslation);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && signPanel && signPanel.classList.contains('open')) {
        closeSignPanel();
      }
    });

    document.addEventListener('langchange', e => {
      onLangChange();
      // Pré-carrega VLibras se trocou para PT-BR
      if (e.detail?.lang === 'pt-BR') loadVLibras();
    });
  }

  return { init, showToast };
})();

document.addEventListener('DOMContentLoaded', A11y.init);
