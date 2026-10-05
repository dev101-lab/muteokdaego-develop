/* ============ 무턱대고 공통 스크립트 ============ */

// ---------- before/after 슬라이더 ----------
function initBA(root) {
  if (root.dataset.baInit) return;
  root.dataset.baInit = '1';
  const range = root.querySelector('.ba-range');
  if (!range) return;
  const set = (v) => root.style.setProperty('--ba-pos', `${v}%`);
  set(range.value);
  range.addEventListener('input', () => set(range.value));

  // 포인터 드래그를 range 값과 동기화 (모바일 터치 포함)
  const fromEvent = (e) => {
    const rect = root.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const v = Math.max(0, Math.min(100, (x / rect.width) * 100));
    range.value = v;
    set(v);
  };
  let dragging = false;
  root.addEventListener('pointerdown', (e) => { dragging = true; fromEvent(e); });
  window.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  window.addEventListener('pointerup', () => { dragging = false; });
}

function baMarkup(before, after, altBase, work = '설치') {
  return `
    <img class="ba-img" src="${before}" alt="${altBase}, 경사로 ${work} 전">
    <div class="ba-after-wrap"><img class="ba-img" src="${after}" alt="${altBase}, 경사로 ${work} 후"></div>
    <div class="ba-handle" aria-hidden="true"><span class="ba-grip"></span></div>
    <span class="ba-tag ba-tag-before" aria-hidden="true">${work} 전</span>
    <span class="ba-tag ba-tag-after" aria-hidden="true">${work} 후</span>
    <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="경사로 ${work} 전후 비교 슬라이더 — ${altBase}">`;
}

// ---------- 홈: 아카이브 그리드 ----------
function renderArchive() {
  const grid = document.getElementById('storeGrid');
  if (!grid || typeof STORES === 'undefined') return;
  grid.innerHTML = STORES.map((s) => `
    <li class="store-card reveal" data-cat="${s.catClass}" data-verification-status="${s.verificationStatus || 'unknown'}">
      <div class="ba" data-ba>${baMarkup(
        `assets/img/stores/${s.slug}-before.jpg`,
        `assets/img/stores/${s.slug}-after.jpg`,
        `${s.name} 입구`, s.work)}</div>
      <div class="store-meta">
        <div class="store-meta-copy">
          <span class="store-name"><a href="store.html?id=${s.slug}">${s.name}</a></span>
          <span class="store-tag">${s.cat}</span>
          <span class="store-badge">${s.rampType}</span>
          <p>${s.story || s.desc}</p>
        </div>
        <img class="store-ramp-sticker" src="assets/img/${s.rampType === '이동식' ? 'sticker-portable-ramp.png' : 'sticker-all-wheels.png'}" alt="${s.rampType} 경사로 스티커">
      </div>
      <a class="store-detail-button" href="store.html?id=${s.slug}" aria-label="${s.name} 설치 기록 자세히 보기">가게 자세히 보기 <span aria-hidden="true">→</span></a>
    </li>
  `).join('');
}

// ---------- 카테고리 필터 (data-filter 칩 + .store-card/.store-row) ----------
function initFilters() {
  const chips = document.querySelectorAll('[data-filter]');
  if (!chips.length) return;
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const f = chip.dataset.filter;
      document.querySelectorAll('.store-card, .store-row').forEach((el) => {
        el.classList.toggle('is-hidden', f !== 'all' && el.dataset.cat !== f);
      });
      document.querySelectorAll('.map-pin').forEach((p) => {
        p.style.display = (f !== 'all' && p.dataset.cat !== f) ? 'none' : '';
      });
    });
  });
}

// ---------- 스크롤 리빌 ----------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  }
}

// 카드·타임라인·지도 패널이 한꺼번에 나타나지 않도록 같은 묶음 안에서 순차 지연한다.
function assignRevealDelays() {
  const groups = [
    '.why-grid', '.store-grid', '.voice-grid', '.timeline', '.steps',
    '.support-list', '.press-grid', '.record-scroller', '.map-layout',
  ];
  groups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      [...group.children].forEach((child, index) => {
        if (child.classList.contains('reveal')) {
          child.style.setProperty('--reveal-delay', `${Math.min(index, 7) * 70}ms`);
        }
      });
    });
  });
}

// ---------- 카운터 ----------
function initCounters() {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      const el = en.target;
      const target = Number(el.dataset.count);
      if (reduceMotion) { el.textContent = target; return; }
      const t0 = performance.now();
      const dur = 1200;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => cio.observe(el));
}

// ---------- 현재 페이지 내비 표시 ----------
function markCurrentNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href').split('#')[0];
    if (href === here && href !== 'index.html') a.classList.add('is-current');
  });
}

// ---------- 홈: 포스터를 지나면 내비를 불투명하게 ----------
function initStickyNav() {
  const nav = document.querySelector('.nav');
  const poster = document.querySelector('.poster');
  if (!nav || !poster) return;

  // 다음 섹션이 화면에 들어오기 시작하면 브랜드를 드러낸다.
  const update = () => {
    const hashPast = location.hash && location.hash !== '#top';
    const past = Boolean(hashPast) || window.scrollY >= poster.offsetHeight * 0.8;
    nav.classList.toggle('is-stuck', past);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('hashchange', update);
}

document.addEventListener('DOMContentLoaded', () => {
  initStickyNav();
  renderArchive();
  document.querySelectorAll('[data-ba]').forEach(initBA);
  initFilters();
  assignRevealDelays();
  initReveal();
  initCounters();
  markCurrentNav();
});
