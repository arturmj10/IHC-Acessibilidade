/**
 * slides.js — Visualizador de slides reutilizável
 */
function initSlides(totalSlides) {
  let current = 1;

  function goTo(n) {
    const prev = document.getElementById('slide-' + current);
    const prevDot = document.querySelector('.slide-dot[data-slide="' + current + '"]');
    if (prev) prev.hidden = true;
    if (prevDot) { prevDot.classList.remove('active'); prevDot.removeAttribute('aria-current'); }

    current = Math.max(1, Math.min(n, totalSlides));

    const next = document.getElementById('slide-' + current);
    const nextDot = document.querySelector('.slide-dot[data-slide="' + current + '"]');
    if (next) next.hidden = false;
    if (nextDot) { nextDot.classList.add('active'); nextDot.setAttribute('aria-current', 'true'); }

    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = current + ' / ' + totalSlides;

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.disabled = current === 1;
    if (nextBtn) nextBtn.disabled = current === totalSlides;
  }

  document.getElementById('btn-prev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => goTo(current + 1));
  document.querySelectorAll('.slide-dot').forEach(dot => {
    dot.addEventListener('click', () => goTo(Number(dot.getAttribute('data-slide'))));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });
  goTo(1);
}
