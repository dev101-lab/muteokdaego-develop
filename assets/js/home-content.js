/* ============ 홈 인터뷰 콘텐츠 ============ */

(() => {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('voiceGrid');
    if (!grid || typeof VOICES === 'undefined') return;
    grid.innerHTML = VOICES.map((voice) => `
      <li class="voice-card reveal" data-verification-status="${escapeHtml(voice.verificationStatus)}">
        <p class="voice-tag">${escapeHtml(voice.category)}</p>
        <h3>${escapeHtml(voice.name)} <span>${escapeHtml(voice.place)} · ${escapeHtml(voice.district)}</span></h3>
        <p class="voice-before"><strong>BEFORE</strong>“${escapeHtml(voice.before)}”</p>
        <p class="voice-after"><strong>AFTER</strong>“${escapeHtml(voice.after)}”</p>
      </li>`).join('');
  });
})();
