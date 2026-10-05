/* ============ 가게 상세 페이지 ============ */

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof STORES === 'undefined') return;
    const slug = new URLSearchParams(location.search).get('id');
    const store = STORES.find((item) => item.slug === slug) || STORES[0];
    document.title = `${store.name} — 무턱대고 설치 기록`;

    const category = document.getElementById('storeCat');
    category.textContent = store.cat;
    category.classList.add(`badge-${store.catClass}`);
    document.getElementById('storeDong').textContent = `📍 ${store.dong}`;
    document.getElementById('storeDate').textContent = `📅 ${store.date}`;
    document.getElementById('storeName').textContent = store.name;
    document.getElementById('storeAddress').textContent = store.address;
    document.getElementById('storeDesc').textContent = store.desc;
    document.getElementById('storeBefore').textContent = store.before;
    document.getElementById('storeAfter').textContent = store.after;

    const sticker = document.getElementById('storeRampSticker');
    sticker.src = store.rampType === '이동식'
      ? 'assets/img/sticker-portable-ramp.png'
      : 'assets/img/sticker-all-wheels.png';
    sticker.alt = `${store.name} ${store.rampType} 경사로 스티커`;
    document.getElementById('storeRampType').textContent = `${store.rampType} 경사로`;
    document.getElementById('storeStory').textContent = store.story || store.desc;
    document.getElementById('storeStoryName').textContent = store.name;
    document.getElementById('storeStoryMeta').textContent = ` · ${store.dong} · ${store.date}`;
    document.getElementById('baTitle').textContent = `${store.work} 전후 비교`;

    const comparison = document.getElementById('storeBA');
    comparison.innerHTML = baMarkup(
      `assets/img/stores/${store.slug}-before.jpg`,
      `assets/img/stores/${store.slug}-after.jpg`,
      `${store.name} 입구`,
      store.work,
    );
    initBA(comparison);
  });
})();
