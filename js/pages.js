/**
 * pages.js — Interações das páginas de conteúdo (info, fórum, quiz, personalização)
 */
document.addEventListener('DOMContentLoaded', () => {
  const tt = key => (typeof I18n !== 'undefined' ? I18n.t(key) : key);
  const toast = (msg, type) => {
    if (typeof A11y !== 'undefined') A11y.showToast(msg, type || '');
    else {
      const el = document.getElementById('toast');
      if (el) { el.textContent = msg; el.className = 'toast show' + (type ? ' toast--' + type : ''); }
    }
  };

  // --- info.html: navegação por hash ---
  const infoPage = document.querySelector('.info-page');
  if (infoPage) {
    const panels = infoPage.querySelectorAll('.info-panel');
    const navLinks = infoPage.querySelectorAll('.info-nav__link');

    function showPanel(id) {
      const hash = id || location.hash || '#faq';
      panels.forEach(p => p.hidden = p.id !== hash.slice(1));
      navLinks.forEach(a => {
        const on = a.getAttribute('href') === hash;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const titleEl = document.getElementById('info-page-title');
      const active = infoPage.querySelector(hash);
      if (titleEl && active) {
        const h = active.querySelector('h2');
        if (h) titleEl.textContent = h.textContent;
      }
    }

    navLinks.forEach(a => a.addEventListener('click', () => setTimeout(showPanel, 0)));
    window.addEventListener('hashchange', () => showPanel());
    showPanel();
  }

  // --- forum.html: nova publicação ---
  const forumForm = document.getElementById('forum-form');
  const forumList = document.getElementById('forum-list');
  if (forumForm && forumList) {
    forumForm.addEventListener('submit', e => {
      e.preventDefault();
      const subject = document.getElementById('forum-subject');
      const body = document.getElementById('forum-body');
      if (!subject.value.trim() || !body.value.trim()) {
        toast(tt('forum.error.empty'), 'error');
        return;
      }
      const li = document.createElement('li');
      li.className = 'forum-thread forum-thread--new';
      li.innerHTML = `
        <details open>
          <summary class="forum-thread__summary">
            <span class="forum-thread__subject">${escapeHtml(subject.value.trim())}</span>
            <span class="forum-thread__meta">${tt('forum.you')} · ${tt('forum.justnow')}</span>
          </summary>
          <div class="forum-thread__body">${escapeHtml(body.value.trim()).replace(/\n/g, '<br>')}</div>
        </details>`;
      forumList.insertBefore(li, forumList.firstChild);
      forumForm.reset();
      toast(tt('forum.posted'), 'success');
      li.querySelector('summary').focus();
    });
  }

  // --- quiz.html: envio e pontuação ---
  const quizForm = document.getElementById('quiz-form');
  if (quizForm) {
    const answers = { q1: 'b', q2: 'a', q3: 'c' };
    quizForm.addEventListener('submit', e => {
      e.preventDefault();
      let score = 0;
      Object.keys(answers).forEach(q => {
        const picked = quizForm.querySelector(`input[name="${q}"]:checked`);
        if (picked && picked.value === answers[q]) score++;
      });
      const total = Object.keys(answers).length;
      const result = document.getElementById('quiz-result');
      const pct = Math.round((score / total) * 100);
      if (result) {
        result.hidden = false;
        result.querySelector('.quiz-result__score').textContent =
          tt('quiz.result').replace('{score}', score).replace('{total}', total).replace('{pct}', pct);
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      toast(tt('quiz.submitted'), 'success');
    });
    document.getElementById('quiz-retry')?.addEventListener('click', () => {
      quizForm.reset();
      const result = document.getElementById('quiz-result');
      if (result) result.hidden = true;
    });
  }

  // --- dashboard: personalizar blocos ---
  const customizeModal = document.getElementById('modal-customize');
  const customizeBtn = document.getElementById('btn-customize');
  const STORAGE = 'dashboard-blocks';

  function applyDashboardBlocks() {
    let cfg = { period: true, aside: true };
    try { cfg = { ...cfg, ...JSON.parse(localStorage.getItem(STORAGE) || '{}') }; } catch (_) {}
    document.getElementById('dashboard-period-card')?.toggleAttribute('hidden', !cfg.period);
    document.getElementById('dashboard-aside')?.toggleAttribute('hidden', !cfg.aside);
    const p = document.getElementById('chk-period');
    const a = document.getElementById('chk-aside');
    if (p) p.checked = cfg.period;
    if (a) a.checked = cfg.aside;
  }

  if (customizeBtn && customizeModal) {
    applyDashboardBlocks();
    customizeBtn.addEventListener('click', () => customizeModal.classList.add('open'));
    document.getElementById('customize-save')?.addEventListener('click', () => {
      const cfg = {
        period: document.getElementById('chk-period')?.checked !== false,
        aside:  document.getElementById('chk-aside')?.checked !== false,
      };
      localStorage.setItem(STORAGE, JSON.stringify(cfg));
      applyDashboardBlocks();
      customizeModal.classList.remove('open');
      toast(tt('dashboard.customize.saved'), 'success');
    });
    document.getElementById('customize-cancel')?.addEventListener('click', () => {
      customizeModal.classList.remove('open');
      applyDashboardBlocks();
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
});
