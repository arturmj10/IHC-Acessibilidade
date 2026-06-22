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
    const btn = document.getElementById('btn-contrast');
    if (btn) btn.setAttribute('aria-pressed', String(!isOn));
    if (!isOn) showToast(I18n.t('a11y.toast.contrast.on'), 'info');
    else showToast(I18n.t('a11y.toast.contrast.off'), '');
  }

  // ─── Tamanho de fonte ────────────────────────────────────────────────────────

  const fontSizes = ['normal', 'large', 'xlarge'];
  const fontLabels = { normal: 'A', large: 'A+', xlarge: 'A++' };

  function cycleFontSize() {
    const root = document.documentElement;
    const current = root.getAttribute('data-font-size') || 'normal';
    const next = fontSizes[(fontSizes.indexOf(current) + 1) % fontSizes.length];
    root.setAttribute('data-font-size', next);
    localStorage.setItem('a11y-font-size', next);
    const btn = document.getElementById('btn-font-size');
    if (btn) {
      btn.textContent = fontLabels[next];
      btn.setAttribute('aria-pressed', next !== 'normal' ? 'true' : 'false');
      btn.setAttribute('aria-label', I18n.t('a11y.fontsize') + ': ' + next);
    }
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

  // ─── Clique assistido (acessibilidade motora) ───────────────────────────────
  // Em vez de MOVER os alvos (o que atrapalha quem treme), os alvos ficam
  // PARADOS e o sistema facilita o acerto:
  //   • realça o alvo clicável mais próximo quando há um vencedor claro;
  //   • ESTABILIZA o clique: o alvo é fixado quando você APERTA o mouse, então,
  //     se a mão escorregar até soltar, o clique ainda vai para esse alvo;
  //   • redireciona cliques que caem por perto de um alvo (snap);
  //   • ignora o duplo-clique acidental (debounce).
  // Critérios conservadores para NÃO sequestrar cliques deliberados (campos de
  // texto, outros botões) nem chutar o vizinho errado quando há botões colados.

  let clickAssistOn = false;

  const ASSIST_RADIUS    = 50;  // alcance do "puxão" além da borda do alvo (px)
  const AMBIGUITY_MARGIN = 12;  // 2º alvo quase tão perto quanto o 1º → não snapa
  const DOUBLE_MS        = 250; // janela p/ ignorar duplo-clique acidental
  const SLIP_TOLERANCE   = 80;  // escorregão máx. entre apertar e soltar p/ compensar (px)

  // Alvos onde um .click() faz sentido
  const CLICKABLE =
    'a[href], button:not([disabled]), [role="button"], summary,' +
    ' .activity-item, .sidebar__nav-item, .lang-option,' +
    ' input[type="submit"], input[type="button"], input[type="checkbox"],' +
    ' input[type="radio"], label[for]';
  // Qualquer coisa interativa — para detectar acerto direto e NÃO sequestrar
  // cliques deliberados (ex.: campos de texto, selects).
  const INTERACTIVE = CLICKABLE +
    ', input, select, textarea, label, [tabindex]:not([tabindex="-1"])';

  let assistRaf    = null;
  let assistTarget = null;  // alvo realçado no momento
  const aMouse     = { x: -9999, y: -9999, valid: false };
  let redirecting  = false; // evita reprocessar cliques sintéticos
  let lastClickEl  = null;
  let lastClickAt  = 0;
  let pressTarget  = null;  // alvo pretendido capturado no mousedown
  let pressX       = 0;
  let pressY       = 0;

  // Distância do ponto até o retângulo (0 se estiver dentro)
  function distToRect(x, y, r) {
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  }

  // Alvo clicável mais próximo do ponto, DESDE QUE haja um vencedor claro.
  // Devolve null se nada está dentro do raio ou se dois alvos disputam o ponto
  // (evita chutar o vizinho errado quando os botões estão colados).
  function nearestClickable(x, y) {
    let best = null, d1 = Infinity, d2 = Infinity, bestArea = Infinity;
    document.querySelectorAll(CLICKABLE).forEach(el => {
      if (el.disabled) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const d = distToRect(x, y, r);
      if (d > ASSIST_RADIUS) return;
      const area = r.width * r.height;
      if (d < d1 || (d === d1 && area < bestArea)) {
        d2 = d1; best = el; d1 = d; bestArea = area;
      } else if (d < d2) {
        d2 = d;
      }
    });
    if (!best) return null;
    // Fora de qualquer alvo e com um vizinho quase tão perto → ambíguo, não snapa
    if (d1 > 0 && (d2 - d1) < AMBIGUITY_MARGIN) return null;
    return best;
  }

  function setAssistTarget(el) {
    if (el === assistTarget) return;
    if (assistTarget) assistTarget.classList.remove('a11y-target-focus');
    assistTarget = el;
    if (el) el.classList.add('a11y-target-focus');
  }

  // ── Rastreio do ponteiro (para o realce do alvo) ──

  function onAssistMove(e) {
    aMouse.x = e.clientX; aMouse.y = e.clientY; aMouse.valid = true;
    scheduleAssist();
  }
  function onAssistLeave() {
    aMouse.valid = false;
    scheduleAssist();
  }
  function scheduleAssist() {
    if (assistRaf || !clickAssistOn) return;
    assistRaf = requestAnimationFrame(runAssist);
  }
  function runAssist() {
    assistRaf = null;
    if (!clickAssistOn) { setAssistTarget(null); return; }
    setAssistTarget(aMouse.valid ? nearestClickable(aMouse.x, aMouse.y) : null);
  }

  // ── Snap do clique + debounce ──

  function performClick(el) {
    redirecting = true;
    try { el.click(); } finally { redirecting = false; }
  }

  // Fixa o alvo pretendido no instante em que o botão é pressionado.
  function onAssistDown(e) {
    if (!clickAssistOn || e.button !== 0) { pressTarget = null; return; }
    const direct = e.target.closest ? e.target.closest(CLICKABLE) : null;
    pressTarget = direct || nearestClickable(e.clientX, e.clientY);
    pressX = e.clientX; pressY = e.clientY;
  }

  function debounceAndClick(el, e) {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (el === lastClickEl && now - lastClickAt < DOUBLE_MS) return;
    lastClickEl = el; lastClickAt = now;
    performClick(el);
  }

  function onAssistClick(e) {
    if (!clickAssistOn || redirecting) return;

    const landed      = e.target.closest ? e.target.closest(CLICKABLE)   : null;
    const interactive = e.target.closest ? e.target.closest(INTERACTIVE) : null;

    // 1) Estabilização: apertou sobre/perto de um alvo e a mão escorregou ao
    //    soltar → o clique vai para o alvo do mousedown. Só compensa escorregões
    //    pequenos que "caem" fora de qualquer controle (não rouba cliques
    //    deliberados em campos de texto ou em outro botão).
    const intended = pressTarget;
    pressTarget = null;
    if (intended && landed !== intended) {
      const slip = Math.hypot(e.clientX - pressX, e.clientY - pressY);
      const fellThrough = !interactive || (interactive.contains && interactive.contains(intended));
      if (slip <= SLIP_TOLERANCE && fellThrough) {
        debounceAndClick(intended, e);
        return;
      }
    }

    // 2) Acerto direto num alvo clicável: deixa seguir, mas barra duplo-clique
    if (landed) {
      const now = Date.now();
      if (landed === lastClickEl && now - lastClickAt < DOUBLE_MS) {
        e.preventDefault(); e.stopPropagation();
        return;
      }
      lastClickEl = landed; lastClickAt = now;
      return;
    }

    // 3) Clique deliberado em outro interativo (campo de texto, select): não mexe
    if (interactive) return;

    // 4) Caiu fora de tudo, mas perto de um alvo claro → snap por proximidade
    const el = nearestClickable(e.clientX, e.clientY);
    if (!el) return; // longe de tudo ou ambíguo → não interfere
    debounceAndClick(el, e);
  }

  function setClickAssist(on, announce) {
    clickAssistOn = on;
    updateBtn('btn-click-assist', on);
    const btn = document.getElementById('btn-click-assist');
    if (btn) btn.setAttribute('aria-pressed', String(on));
    if (on) {
      document.addEventListener('mousedown', onAssistDown, true);
      document.addEventListener('click', onAssistClick, true);
      document.addEventListener('mousemove', onAssistMove);
      document.addEventListener('mouseleave', onAssistLeave);
      window.addEventListener('scroll', scheduleAssist, { passive: true });
      localStorage.setItem('a11y-click-assist', '1');
      if (announce) showToast(I18n.t('a11y.toast.clickassist.on'), 'info');
    } else {
      document.removeEventListener('mousedown', onAssistDown, true);
      document.removeEventListener('click', onAssistClick, true);
      document.removeEventListener('mousemove', onAssistMove);
      document.removeEventListener('mouseleave', onAssistLeave);
      window.removeEventListener('scroll', scheduleAssist);
      aMouse.valid = false;
      pressTarget = null;
      setAssistTarget(null);
      localStorage.removeItem('a11y-click-assist');
      if (announce) showToast(I18n.t('a11y.toast.clickassist.off'), '');
    }
  }
  function toggleClickAssist() { setClickAssist(!clickAssistOn, true); }

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

  // ─── Injeção e agrupamento da barra de acessibilidade ───────────────────────

  function makeGroup(labelKey) {
    const group = document.createElement('div');
    group.className = 'a11y-bar__group';
    group.setAttribute('role', 'group');
    if (labelKey) {
      const lbl = document.createElement('span');
      lbl.className = 'a11y-bar__label';
      lbl.setAttribute('data-i18n', labelKey);
      lbl.textContent = I18n.t(labelKey);
      group.appendChild(lbl);
    }
    return group;
  }

  function organizeA11yBar() {
    const bar = document.querySelector('.a11y-bar');
    if (!bar || bar.dataset.organized) return;

    const contrast  = document.getElementById('btn-contrast');
    const fontSize  = document.getElementById('btn-font-size');
    const libras      = document.getElementById('btn-libras');
    const mode        = document.getElementById('btn-a11y-mode');
    const readAloud   = document.getElementById('btn-read-aloud');
    const clickAssist = document.getElementById('btn-click-assist');
    const langBtns    = bar.querySelectorAll('.lang-option');

    const toolsGroup = makeGroup('a11y.label');
    [mode, readAloud, clickAssist, contrast, fontSize, libras].forEach(btn => {
      if (btn) toolsGroup.appendChild(btn);
    });

    const langGroup = makeGroup('a11y.language');
    langBtns.forEach(btn => langGroup.appendChild(btn));

    bar.innerHTML = '';
    bar.appendChild(toolsGroup);
    bar.appendChild(langGroup);
    bar.dataset.organized = '1';
  }

  function injectA11yButtons() {
    const bar = document.querySelector('.a11y-bar');
    if (!bar || document.getElementById('btn-a11y-mode')) {
      organizeA11yBar();
      return;
    }

    const mode = document.createElement('button');
    mode.className = 'a11y-btn a11y-btn--mode';
    mode.id = 'btn-a11y-mode';
    mode.setAttribute('aria-pressed', 'false');
    mode.innerHTML = '♿ <span data-i18n="a11y.mode"></span>';
    mode.querySelector('span').textContent = I18n.t('a11y.mode');
    mode.title = I18n.t('a11y.mode');
    mode.addEventListener('click', toggleA11yMode);
    bar.insertBefore(mode, bar.firstChild);

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

    const clickAssist = document.createElement('button');
    clickAssist.className = 'a11y-btn';
    clickAssist.id = 'btn-click-assist';
    clickAssist.setAttribute('aria-pressed', 'false');
    clickAssist.innerHTML = '🎯 <span data-i18n="a11y.clickassist"></span>';
    clickAssist.querySelector('span').textContent = I18n.t('a11y.clickassist');
    clickAssist.title = I18n.t('a11y.clickassist');
    clickAssist.addEventListener('click', toggleClickAssist);
    bar.appendChild(clickAssist);

    organizeA11yBar();
  }

  function setupA11yButtonStates() {
    const contrast = document.getElementById('btn-contrast');
    if (contrast) {
      contrast.setAttribute('aria-pressed',
        document.documentElement.getAttribute('data-theme') === 'high-contrast' ? 'true' : 'false');
    }
    const fontBtn = document.getElementById('btn-font-size');
    if (fontBtn) {
      const size = document.documentElement.getAttribute('data-font-size') || 'normal';
      fontBtn.setAttribute('aria-pressed', size !== 'normal' ? 'true' : 'false');
      fontBtn.setAttribute('aria-label', I18n.t('a11y.fontsize'));
      fontBtn.title = I18n.t('a11y.fontsize');
    }
    const libras = document.getElementById('btn-libras');
    if (libras) libras.setAttribute('aria-pressed', 'false');
  }

  function restoreA11yExtras() {
    if (localStorage.getItem('a11y-mode') === 'on') {
      setA11yMode(true, true);
    } else if (localStorage.getItem('a11y-read') === '1') {
      setReadAloud(true, false);
    }
    if (localStorage.getItem('a11y-click-assist') === '1') {
      setClickAssist(true, false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function updateBtn(id, active) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', active);
    if (btn.hasAttribute('aria-pressed') || btn.classList.contains('a11y-btn')) {
      btn.setAttribute('aria-pressed', String(active));
    }
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
    setupA11yButtonStates();
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
