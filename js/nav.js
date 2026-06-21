/**
 * nav.js
 * Navegação, sidebar toggle e comportamentos comuns de UI.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Sidebar: expandir/recolher subárvores ---
  document.querySelectorAll('.sidebar__tree-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const subtree = document.getElementById(targetId);
      if (!subtree) return;
      const isOpen = subtree.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
    });

    // restaurar estado aberto ao carregar
    const targetId = btn.getAttribute('data-target');
    const subtree = document.getElementById(targetId);
    if (subtree && subtree.classList.contains('open')) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  // --- Acessibilidade de modais: foco, focus-trap, Esc e restauração de foco ---
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    const modal = overlay.querySelector('.modal');
    if (modal && !modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    let lastFocused = null;
    let isOpen = false;

    function focusable() {
      return Array.from(overlay.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { overlay.classList.remove('open'); return; }
      if (e.key !== 'Tab') return;
      const f = focusable();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    function onOpen() {
      lastFocused = document.activeElement;
      document.addEventListener('keydown', onKeydown);
      const f = focusable();
      (f[0] || modal).focus();
    }

    function onClose() {
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && lastFocused.offsetParent !== null) lastFocused.focus();
    }

    // Fechar clicando no fundo (overlay)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    // Reage a qualquer alteração da classe .open (botões, Esc, clique fora)
    new MutationObserver(() => {
      const nowOpen = overlay.classList.contains('open');
      if (nowOpen && !isOpen) { isOpen = true; onOpen(); }
      else if (!nowOpen && isOpen) { isOpen = false; onClose(); }
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  });

  // --- Menu lateral colapsável (mobile) ---
  const sidebar = document.querySelector('.sidebar');
  const pageBody = document.querySelector('.page-body');
  if (sidebar && pageBody) {
    if (!sidebar.id) sidebar.id = 'main-sidebar';
    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', sidebar.id);
    const label = (typeof I18n !== 'undefined') ? I18n.t('nav.menu') : 'Menu';
    toggle.innerHTML = '☰ <span data-i18n="nav.menu"></span>';
    toggle.querySelector('span').textContent = label;
    pageBody.insertBefore(toggle, pageBody.firstChild);
    toggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // --- Topbar: dropdowns de notificações, mensagens e perfil ---
  const tt = key => (typeof I18n !== 'undefined' ? I18n.t(key) : key);

  function makeDropdown({ headerKey, headerText, items }) {
    const dd = document.createElement('div');
    dd.className = 'topbar__dropdown';
    dd.setAttribute('role', 'menu');

    const header = document.createElement('div');
    header.className = 'topbar__dropdown-header';
    if (headerKey) {
      header.setAttribute('data-i18n', headerKey);
      header.textContent = tt(headerKey);
    } else {
      header.textContent = headerText || '';
    }
    dd.appendChild(header);

    items.forEach(it => {
      const a = document.createElement('a');
      a.className = 'topbar__dropdown-item';
      a.href = it.href;
      a.setAttribute('role', 'menuitem');

      const title = document.createElement('span');
      title.className = 'topbar__dropdown-item__title';
      title.setAttribute('data-i18n', it.titleKey);
      title.textContent = tt(it.titleKey);
      a.appendChild(title);

      if (it.metaKey) {
        const meta = document.createElement('span');
        meta.className = 'topbar__dropdown-item__meta';
        meta.setAttribute('data-i18n', it.metaKey);
        meta.textContent = tt(it.metaKey);
        a.appendChild(meta);
      }
      dd.appendChild(a);
    });
    return dd;
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.topbar__dropdown.open').forEach(d => {
      d.classList.remove('open');
      const wrap = d.closest('.topbar__menu');
      const b = wrap && wrap.querySelector('[aria-haspopup]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  function attachDropdown(btn, dd) {
    if (!btn) return;
    const wrap = document.createElement('div');
    wrap.className = 'topbar__menu';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    wrap.appendChild(dd);

    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const willOpen = !dd.classList.contains('open');
      closeAllDropdowns();
      if (willOpen) {
        dd.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    dd.addEventListener('click', e => e.stopPropagation());
  }

  attachDropdown(document.getElementById('btn-notifications'), makeDropdown({
    headerKey: 'nav.notifications',
    items: [
      { href: 'atividade.html', titleKey: 'notif.assignment', metaKey: 'notif.assignment.meta' },
      { href: 'curso.html',     titleKey: 'notif.quiz',       metaKey: 'notif.quiz.meta' },
    ],
  }));

  attachDropdown(document.getElementById('btn-messages'), makeDropdown({
    headerKey: 'nav.messages',
    items: [
      { href: 'curso.html', titleKey: 'msg.professor', metaKey: 'msg.professor.preview' },
    ],
  }));

  const profileBtn = document.getElementById('btn-profile');
  if (profileBtn) {
    const nameEl = profileBtn.querySelector('span');
    attachDropdown(profileBtn, makeDropdown({
      headerText: nameEl ? nameEl.textContent : 'Perfil',
      items: [
        { href: 'dashboard.html', titleKey: 'profile.view' },
        { href: 'index.html',     titleKey: 'profile.logout' },
      ],
    }));
  }

  document.addEventListener('click', closeAllDropdowns);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.topbar__dropdown.open');
    if (!open) return;
    const wrap = open.closest('.topbar__menu');
    closeAllDropdowns();
    const b = wrap && wrap.querySelector('[aria-haspopup]');
    if (b) b.focus();
  });

  // --- Links de demonstração (FAQ, suporte, etc.) ---
  document.querySelectorAll('.demo-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const key = el.getAttribute('data-i18n-key');
      const label = key ? tt(key) : el.textContent.trim();
      const msg = label + ' — ' + tt('link.demo');
      if (typeof A11y !== 'undefined') A11y.showToast(msg, 'info');
    });
  });

  // --- Sub-navegação do curso: destaque da seção ativa ---
  const subnav = document.querySelector('.course-subnav');
  if (subnav) {
    const links = subnav.querySelectorAll('.course-subnav__link');
    const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

    function setActiveSubnav(id) {
      links.forEach(a => {
        const on = a.getAttribute('href') === id;
        a.classList.toggle('is-active', on);
      });
    }

    links.forEach(a => {
      a.addEventListener('click', () => setActiveSubnav(a.getAttribute('href')));
    });

    if (sections.length && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSubnav('#' + visible[0].target.id);
      }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] });

      sections.forEach(s => obs.observe(s));
    }
  }

  // --- Botão "Personalizar esta página" (demonstração) ---
  const customizeBtn = document.getElementById('btn-customize');
  if (customizeBtn) {
    customizeBtn.addEventListener('click', () => {
      if (typeof A11y !== 'undefined') A11y.showToast(tt('dashboard.customize.toast'), 'success');
    });
  }

  // --- Drag-and-drop na área de upload ---
  const fileDrop = document.querySelector('.file-drop');
  const fileInput = document.getElementById('file-input');

  if (fileDrop && fileInput) {
    fileDrop.addEventListener('click', () => fileInput.click());

    // Acionar por teclado (Enter / Espaço), já que é role="button"
    fileDrop.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileDrop.addEventListener('dragover', e => {
      e.preventDefault();
      fileDrop.classList.add('dragover');
    });

    fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));

    fileDrop.addEventListener('drop', e => {
      e.preventDefault();
      fileDrop.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
  }

  function handleFiles(files) {
    const list = document.getElementById('file-list');
    if (!list) return;
    Array.from(files).forEach(file => {
      const item = document.createElement('div');
      item.className = 'file-list-item';
      const removeLabel = (typeof I18n !== 'undefined' ? I18n.t('file.remove') : 'Remover') + ' ' + escapeHtml(file.name);
      item.innerHTML = `
        <span>📄</span>
        <span class="file-name">${escapeHtml(file.name)}</span>
        <span class="file-size">${formatSize(file.size)}</span>
        <button class="file-list-item__remove" aria-label="${removeLabel}">✕</button>
      `;
      item.querySelector('.file-list-item__remove').addEventListener('click', () => item.remove());
      list.appendChild(item);
    });
    list.closest('.file-list')?.removeAttribute('hidden');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
});
