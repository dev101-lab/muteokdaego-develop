/* ============ 미디어 페이지 ============ */

document.addEventListener('DOMContentLoaded', () => {
  const pressSection = document.getElementById('pressSection');
  const snsSection = document.getElementById('snsSection');
  if (!pressSection || !snsSection) return;

  document.querySelectorAll('[data-media]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-media]').forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-selected', 'true');
      const filter = chip.dataset.media;
      pressSection.hidden = filter === 'sns';
      snsSection.hidden = filter === 'press';
    });
  });
});
