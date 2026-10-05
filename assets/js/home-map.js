/* ============ 홈 카카오맵 경사로 지도 ============ */

(() => {
  'use strict';

  const mapElement = document.getElementById('homeGoogleMap');
  const loadingElement = document.getElementById('homeMapLoading');
  const errorElement = document.getElementById('homeMapError');
  const resolvedElement = document.getElementById('homeMapResolved');
  if (!mapElement || typeof STORES === 'undefined' || !window.KakaoMapKit) return;

  const K = window.KakaoMapKit;
  const state = { map: null, places: new Map(), markers: new Map(), started: false, filter: 'all' };

  function markerContent(store) {
    const el = document.createElement('div');
    el.className = 'ramp-map-marker';
    el.setAttribute('role', 'link');
    el.setAttribute('aria-label', `${store.name} 경사로 설치 장소`);
    el.innerHTML = `
      <span class="ramp-map-marker__tail" aria-hidden="true"></span>
      <span class="ramp-map-marker__bubble" aria-hidden="true">
        <span class="ramp-map-marker__eye eye-left"></span><span class="ramp-map-marker__eye eye-right"></span>
      </span>`;
    el.addEventListener('click', () => document.dispatchEvent(new CustomEvent('muteok:select-store', { detail: { slug: store.slug, from: 'map' } })));
    return el;
  }

  function addMarker(store, place) {
    if (state.markers.has(store.slug) || !place?.location) return;
    state.markers.set(store.slug, K.createOverlay(state.map, markerContent(store), place.location));
  }

  function applyFilter(f) {
    state.filter = f;
    const shown = [];
    state.markers.forEach((overlay, slug) => {
      const store = STORES.find((s) => s.slug === slug);
      const on = f === 'all' || store.catClass === f;
      overlay.setMap(on ? state.map : null);
      if (on && state.places.get(slug)) shown.push(state.places.get(slug).location);
    });
    K.fitTo(state.map, shown, 68);
  }
  document.querySelectorAll('[data-home-filter]').forEach((chip) => chip.addEventListener('click', () => {
    document.querySelectorAll('[data-home-filter]').forEach((c) => c.classList.toggle('is-active', c === chip));
    if (state.map) applyFilter(chip.dataset.homeFilter);
  }));
  document.addEventListener('muteok:select-store', (e) => {
    const overlay = state.markers.get(e.detail.slug);
    state.markers.forEach((o, slug) => o.getContent().classList.toggle('is-active', slug === e.detail.slug));
    const place = state.places.get(e.detail.slug);
    if (place && state.map && e.detail.from !== 'map') state.map.panTo(K.latLng(place.location));
  });

  function updateStatus(working) {
    const n = state.places.size;
    resolvedElement.textContent = working ? `${n}/${STORES.length}곳 위치 확인 중`
      : n > 0 ? `${n}/${STORES.length}곳 실제 위치 확인` : '확인된 위치 없음';
  }

  const fit = () => K.fitTo(state.map, [...state.places.values()].map((p) => p.location), 68);

  async function resolvePlaces() {
    const cache = K.loadCache();
    const queue = [];
    STORES.forEach((s) => {
      if (cache[s.slug]?.location) { state.places.set(s.slug, cache[s.slug]); addMarker(s, cache[s.slug]); } else queue.push(s);
    });
    updateStatus(true); fit();
    const workers = Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const store = queue.shift();
        const place = await K.lookupPlace(store, state.map).catch(() => null);
        if (place) { state.places.set(store.slug, place); addMarker(store, place); }
        updateStatus(true);
      }
    });
    await Promise.all(workers);
    K.saveCache(state.places); fit(); updateStatus(false);
  }

  async function startMap() {
    if (state.started) return;
    state.started = true;
    try {
      await K.loadSdk();
      state.map = K.createMap(mapElement, { level: 7, zoomable: false });
      // 페이지 스크롤을 가로채지 않도록, 지도를 클릭했을 때만 휠 줌 허용
      mapElement.addEventListener('pointerdown', () => state.map.setZoomable(true), { once: true });
      loadingElement.hidden = true; errorElement.hidden = true;
      await resolvePlaces();
    } catch (error) {
      console.warn('홈 카카오 지도 초기화 실패', error);
      loadingElement.hidden = true;
      const msg = errorElement.querySelector('span');
      if (msg && error.code === 'NO_KEY') msg.textContent = '카카오 지도 키 설정이 필요합니다. 설치 기록은 전체 지도 페이지에서 확인할 수 있어요.';
      errorElement.hidden = false;
      resolvedElement.textContent = '지도 연결 실패';
    }
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect(); startMap();
    }, { rootMargin: '320px 0px' });
    io.observe(mapElement);
  } else startMap();
})();
