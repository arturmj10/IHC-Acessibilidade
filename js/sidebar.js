/**
 * sidebar.js — Menu lateral unificado (Painel + Curso)
 * Garante a mesma estrutura de submenus em todas as páginas.
 */
const Sidebars = (() => {

  const tt = key => (typeof I18n !== 'undefined' ? I18n.t(key) : key);

  const COURSE_PAGES = {
    'curso.html':         'home',
    'conteudo.html':      'lesson1',
    'aula2.html':         'lesson2',
    'aula3.html':         'lesson3',
    'atividade.html':     'work1',
    'quiz.html':          'quiz',
    'avisos.html':        'notices',
    'forum.html':         'forum',
    'participantes.html': 'participants',
    'notas.html':         'grades',
  };

  function detectCoursePage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return COURSE_PAGES[path] || 'home';
  }

  function linkItem({ id, href, i18n, icon, indent }) {
    const pad = indent ? ' style="padding-left:var(--space-lg);"' : '';
    const ic = icon ? icon + ' ' : '';
    return `<a href="${href}" class="sidebar__nav-item" data-nav-id="${id}"${pad}>${ic}<span data-i18n="${i18n}">${tt(i18n)}</span></a>`;
  }

  function sectionTitle(i18n, indent) {
    const pad = indent ? ' style="padding-left:var(--space-md);"' : '';
    return `<div class="sidebar__section-title"${pad} data-i18n="${i18n}">${tt(i18n)}</div>`;
  }

  function renderCourseSidebar(activeId) {
    const aside = document.querySelector('[data-sidebar="course"]');
    if (!aside) return;
    const nav = aside.querySelector('.sidebar__nav');
    if (!nav) return;

    nav.innerHTML = `
      ${linkItem({ id: 'panel', href: 'dashboard.html', i18n: 'nav.panel', icon: '🏠' })}
      ${linkItem({ id: 'courses-index', href: 'index.html', i18n: 'index.courses.title', icon: '📋' })}
      ${sectionTitle('course.sidebar.current')}
      <button type="button" class="sidebar__tree-toggle open" data-target="tree-course" aria-expanded="true">
        <span>📘 <span data-i18n="course.welcome.name">${tt('course.welcome.name')}</span></span>
        <span class="arrow" aria-hidden="true">▶</span>
      </button>
      <div class="sidebar__subtree open" id="tree-course">
        ${linkItem({ id: 'home', href: 'curso.html', i18n: 'course.sidebar.home', indent: true })}
        ${sectionTitle('nav.content', true)}
        ${linkItem({ id: 'lesson1', href: 'conteudo.html', i18n: 'course.section.lesson1', indent: true })}
        ${linkItem({ id: 'lesson2', href: 'aula2.html', i18n: 'course.section.lesson2', indent: true })}
        ${linkItem({ id: 'lesson3', href: 'aula3.html', i18n: 'course.section.lesson3', indent: true })}
        ${sectionTitle('nav.activities', true)}
        ${linkItem({ id: 'work1', href: 'atividade.html', i18n: 'course.item.work1', indent: true })}
        ${linkItem({ id: 'quiz', href: 'quiz.html', i18n: 'course.item.quiz3', indent: true })}
        ${sectionTitle('course.section.comms', true)}
        ${linkItem({ id: 'notices', href: 'avisos.html', i18n: 'course.section.notices', indent: true })}
        ${linkItem({ id: 'forum', href: 'forum.html', i18n: 'nav.forum', indent: true })}
        ${sectionTitle('nav.admin', true)}
        ${linkItem({ id: 'participants', href: 'participantes.html', i18n: 'nav.participants', indent: true })}
        ${linkItem({ id: 'grades', href: 'notas.html', i18n: 'nav.grades', indent: true })}
      </div>
    `;

    const active = nav.querySelector(`[data-nav-id="${activeId}"]`);
    if (active) active.classList.add('sidebar__nav-item--active');
  }

  function renderDashboardSidebar() {
    const aside = document.querySelector('[data-sidebar="dashboard"]');
    if (!aside) return;
    const nav = aside.querySelector('.sidebar__nav');
    if (!nav) return;

    nav.innerHTML = `
      <a href="dashboard.html" class="sidebar__nav-item sidebar__nav-item--active" data-nav-id="dashboard-home">
        🏠 <span data-i18n="nav.panel">${tt('nav.panel')}</span>
      </a>
      ${linkItem({ id: 'courses-index', href: 'index.html', i18n: 'index.courses.title', icon: '📋' })}
      <button type="button" class="sidebar__tree-toggle open" data-target="tree-moodle" aria-expanded="true">
        <span>📚 <span data-i18n="site.name">${tt('site.name')}</span></span>
        <span class="arrow" aria-hidden="true">▶</span>
      </button>
      <div class="sidebar__subtree open" id="tree-moodle">
        <button type="button" class="sidebar__tree-toggle open" data-target="tree-mycourses" aria-expanded="true" style="padding-left:var(--space-lg);">
          <span data-i18n="nav.mycourses">${tt('nav.mycourses')}</span>
          <span class="arrow" aria-hidden="true">▶</span>
        </button>
        <div class="sidebar__subtree open" id="tree-mycourses" style="padding-left:var(--space-lg);">
          <a href="curso.html" class="sidebar__nav-item" data-nav-id="course-link" style="padding-left:var(--space-lg);">
            <span data-i18n="course.code">CIT7213-05652 (20261)</span>
          </a>
        </div>
      </div>
    `;
  }

  function init() {
    const courseAside = document.querySelector('[data-sidebar="course"]');
    if (courseAside) {
      const page = courseAside.getAttribute('data-page') || detectCoursePage();
      renderCourseSidebar(page);
    }

    const dashAside = document.querySelector('[data-sidebar="dashboard"]');
    if (dashAside) {
      renderDashboardSidebar();
    }

    if (typeof initSidebarTrees === 'function') initSidebarTrees();
  }

  return { init, renderCourseSidebar, renderDashboardSidebar };
})();

document.addEventListener('DOMContentLoaded', () => {
  Sidebars.init();
  document.addEventListener('langchange', () => Sidebars.init());
});
