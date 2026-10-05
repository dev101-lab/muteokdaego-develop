/* ============ 무턱대고 카카오맵 경사로 지도 ============ */

(() => {
  'use strict';

  const K = window.KakaoMapKit;
  const LOOKUP_CONCURRENCY = 3;

  const els = {
    map: document.getElementById('googleMap'),
    loading: document.getElementById('mapLoading'),
    error: document.getElementById('mapError'),
    errorTitle: document.getElementById('mapErrorTitle'),
    errorMessage: document.getElementById('mapErrorMessage'),
    retry: document.getElementById('mapRetry'),
    sync: document.getElementById('mapSyncStatus'),
    search: document.getElementById('mapSearch'),
    clearSearch: document.getElementById('mapSearchClear'),
    locate: document.getElementById('mapLocate'),
    resultCount: document.getElementById('mapResultCount'),
    list: document.getElementById('storeList'),
    empty: document.getElementById('mapEmpty'),
    reset: document.getElementById('mapReset'),
    placeCard: document.getElementById('mapPlaceCard'),
    totalCount: document.getElementById('mapTotalCount'),
  };

  if (!els.map || typeof STORES === 'undefined' || !K) return;

  const state = {
    map: null,
    markers: new Map(),
    places: new Map(),
    filter: 'all',
    search: '',
    selectedSlug: null,
    mapReady: false,
    lookupComplete: false,
    resolvedCount: 0,
    userMarker: null,
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  const normalize = K.normalize;





  const kakaoSearchUrl = K.kakaoSearchUrl;
  const kakaoDirectionsUrl = K.kakaoRouteUrl;
  const safeKakaoUrl = K.safeKakaoUrl;





  function businessStatus(status) {
    const labels = {
      OPERATIONAL: { label: '운영 중', className: '' },
      CLOSED_TEMPORARILY: { label: '임시 휴업', className: ' is-closed' },
      CLOSED_PERMANENTLY: { label: '폐업 정보', className: ' is-closed' },
      FUTURE_OPENING: { label: '개점 예정', className: ' is-muted' },
    };
    return labels[status] || null;
  }

  function currentVisibleStores() {
    const query = normalize(state.search);
    return STORES.filter((store) => {
      const categoryMatch = state.filter === 'all' || store.catClass === state.filter;
      const searchText = normalize([
        store.name,
        store.cat,
        store.dong,
        store.address,
        store.desc,
        state.places.get(store.slug)?.formattedAddress,
      ].join(' '));
      return categoryMatch && (!query || searchText.includes(query));
    });
  }

  function renderStoreCard(store) {
    const place = state.places.get(store.slug);
    const status = businessStatus(place?.businessStatus);
    const address = place?.formattedAddress || store.address || `서울특별시 성북구 ${store.dong}`;
    const mapsUrl = safeKakaoUrl(place?.placeUrl, kakaoSearchUrl(store));
    const selected = state.selectedSlug === store.slug;

    return `
      <article class="store-row${selected ? ' is-selected' : ''}" data-store-slug="${escapeHtml(store.slug)}">
        <button class="store-row-select" type="button" data-select-store="${escapeHtml(store.slug)}"
          aria-label="${escapeHtml(store.name)} 지도에서 보기" aria-pressed="${selected}">
          <span class="store-row-thumb">
            <img src="assets/img/stores/${escapeHtml(store.slug)}-after.jpg" alt="" loading="lazy">
          </span>
          <span class="store-row-copy">
            <span class="store-row-top">
              <span class="map-badge">${escapeHtml(store.cat)}</span>
              <span class="map-badge is-muted">${escapeHtml(store.rampType)} 경사로</span>
              ${status ? `<span class="map-badge${status.className}">${escapeHtml(status.label)}</span>` : ''}
            </span>
            <h4>${escapeHtml(store.name)}</h4>
            <address class="store-row-address">${escapeHtml(address)}</address>
            <span class="store-row-story">${escapeHtml(store.story || store.desc)}</span>
          </span>
        </button>
        <div class="store-row-actions">
          <a href="store.html?id=${encodeURIComponent(store.slug)}">설치 기록 보기 →</a>
          <a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">카카오맵 ↗</a>
        </div>
      </article>
    `;
  }

  function renderResults({ fitMap = false } = {}) {
    const visibleStores = currentVisibleStores();
    els.list.innerHTML = visibleStores.map(renderStoreCard).join('');
    els.list.hidden = visibleStores.length === 0;
    els.empty.hidden = visibleStores.length !== 0;
    els.resultCount.textContent = `${visibleStores.length}곳 표시`;

    if (state.selectedSlug && !visibleStores.some((store) => store.slug === state.selectedSlug)) {
      clearSelection();
    }

    updateMarkerVisibility(visibleStores);
    if (fitMap && state.mapReady) fitVisibleMarkers(visibleStores);
  }

  function updateFilterCounts() {
    const counts = STORES.reduce((acc, store) => {
      acc.all += 1;
      acc[store.catClass] = (acc[store.catClass] || 0) + 1;
      return acc;
    }, { all: 0 });

    document.querySelectorAll('[data-filter-count]').forEach((el) => {
      el.textContent = counts[el.dataset.filterCount] || 0;
    });
    if (els.totalCount) els.totalCount.textContent = counts.all;
  }

  function markerContent(store) {
    const marker = document.createElement('div');
    marker.className = 'ramp-map-marker';
    marker.dataset.markerSlug = store.slug;
    marker.innerHTML = `
      <span class="ramp-map-marker__tail" aria-hidden="true"></span>
      <span class="ramp-map-marker__bubble" aria-hidden="true">
        <span class="ramp-map-marker__eye eye-left"></span>
        <span class="ramp-map-marker__eye eye-right"></span>
      </span>
    `;
    return marker;
  }

  function addPlaceMarker(store, place) {
    if (!state.mapReady || state.markers.has(store.slug) || !place?.location) return;
    const content = markerContent(store);
    content.setAttribute('role', 'button');
    content.setAttribute('aria-label', `${store.name} 경사로 설치 장소`);
    content.addEventListener('click', () => selectStore(store.slug, { pan: true, scrollList: true }));
    const marker = K.createOverlay(state.map, content, place.location);
    state.markers.set(store.slug, { marker, content });
    updateMarkerVisibility(currentVisibleStores());
  }

  function updateMarkerVisibility(visibleStores) {
    if (!state.mapReady) return;
    const visibleSlugs = new Set(visibleStores.map((store) => store.slug));
    state.markers.forEach(({ marker, content }, slug) => {
      marker.setMap(visibleSlugs.has(slug) ? state.map : null);
      content.classList.toggle('is-active', state.selectedSlug === slug);
    });
  }

  function fitVisibleMarkers(visibleStores = currentVisibleStores()) {
    if (!state.mapReady) return;
    K.fitTo(state.map, visibleStores.map((store) => state.places.get(store.slug)?.location).filter(Boolean), 72);
  }

  function renderSelectedPlace(store) {
    const place = state.places.get(store.slug);
    const address = place?.formattedAddress || store.address || `서울특별시 성북구 ${store.dong}`;
    const mapsUrl = safeKakaoUrl(place?.placeUrl, kakaoSearchUrl(store));
    const directionsUrl = kakaoDirectionsUrl(store, place);
    const visible = currentVisibleStores();
    const idx = visible.findIndex((item) => item.slug === store.slug);
    const stickerImg = store.rampType === '이동식' ? 'sticker-portable-ramp.png' : 'sticker-all-wheels.png';
    const work = store.work || '설치';
    const total = visible.length;

    els.placeCard.innerHTML = `
      <div class="rec-scroll">
        <header class="rec-top">
          <span class="rec-kicker"><i aria-hidden="true"></i>설치 기록 <b>${String(idx + 1).padStart(2, '0')}</b><em>/ ${String(total).padStart(2, '0')}</em></span>
          <div class="rec-top-actions">
            <button type="button" class="rec-icon" data-nav-store="prev" aria-label="이전 기록">←</button>
            <button type="button" class="rec-icon" data-nav-store="next" aria-label="다음 기록">→</button>
            <button type="button" class="rec-icon rec-close" data-close-place aria-label="설치 기록 닫기">✕</button>
          </div>
        </header>

        <div class="rec-media">
          <div class="ba rec-ba" data-ba>${baMarkup(
            `assets/img/stores/${store.slug}-before.jpg`,
            `assets/img/stores/${store.slug}-after.jpg`,
            `${store.name} 입구`, work)}</div>
          <img class="rec-sticker" src="assets/img/${stickerImg}" alt="${escapeHtml(store.rampType)} 경사로 스티커" width="120" height="95">
        </div>
        <p class="rec-hint" aria-hidden="true">← 드래그해서 ${escapeHtml(work)} 전후를 비교해 보세요 →</p>

        <div class="rec-body">
          <p class="rec-tags"><span>${escapeHtml(store.cat)}</span><span>${escapeHtml(store.rampType)} 경사로</span><span>${escapeHtml(store.date)}</span></p>
          <h3 class="rec-title">${escapeHtml(store.name)}</h3>
          <address class="rec-address"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>${escapeHtml(address)}</address>

          <div class="rec-ba-cards">
            <div class="rec-card is-before"><p><i aria-hidden="true">✕</i>BEFORE</p><span>${escapeHtml(store.before)}</span></div>
            <div class="rec-arrow" aria-hidden="true">→</div>
            <div class="rec-card is-after"><p><i aria-hidden="true">✓</i>AFTER</p><span>${escapeHtml(store.after)}</span></div>
          </div>

          <blockquote class="rec-story"><span aria-hidden="true">“</span>${escapeHtml(store.story || store.desc)}</blockquote>
        </div>
      </div>

      <footer class="rec-foot">
        <a class="rec-cta" href="store.html?id=${encodeURIComponent(store.slug)}">전체 설치 기록 보기 <b aria-hidden="true">→</b></a>
        <a class="rec-ghost" href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener noreferrer">길찾기 ↗</a>
        <a class="rec-ghost" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">카카오맵 ↗</a>
      </footer>
    `;
    els.placeCard.hidden = false;
    els.placeCard.classList.remove('is-open'); void els.placeCard.offsetWidth; els.placeCard.classList.add('is-open');
    initBA(els.placeCard.querySelector('[data-ba]'));
  }

  function selectStore(slug, { pan = false, scrollList = false } = {}) {
    const store = STORES.find((item) => item.slug === slug);
    if (!store) return;

    state.selectedSlug = slug;
    renderSelectedPlace(store);
    renderResults();

    state.markers.forEach(({ marker, content }, markerSlug) => {
      const selected = markerSlug === slug;
      content.classList.toggle('is-active', selected);
      marker.setZIndex(selected ? 100 : 1);
    });

    const place = state.places.get(slug);
    if (pan && state.mapReady && place?.location) {
      state.map.panTo(K.latLng(place.location));
      if (state.map.getLevel() > 4) state.map.setLevel(4);
    }

    if (scrollList) {
      requestAnimationFrame(() => {
        const row = els.list.querySelector(`[data-store-slug="${CSS.escape(slug)}"]`);
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }

  function clearSelection() {
    state.selectedSlug = null;
    els.placeCard.hidden = true;
    els.placeCard.innerHTML = '';
    state.markers.forEach(({ marker, content }) => {
      content.classList.remove('is-active');
      marker.setZIndex(1);
    });
    els.list.querySelectorAll('.store-row.is-selected').forEach((row) => row.classList.remove('is-selected'));
    els.list.querySelectorAll('[data-select-store][aria-pressed="true"]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  }











  function setMapSync(text, kind = 'ok') {
    els.sync.hidden = false;
    els.sync.classList.toggle('is-working', kind === 'working');
    els.sync.classList.toggle('is-warning', kind === 'warning');
    const label = els.sync.querySelector('b');
    if (label) label.textContent = text;
  }

  async function resolvePlaces() {
    const cachedPlaces = K.loadCache();
    const queue = [...STORES];
    let completed = 0;

    const workers = Array.from({ length: LOOKUP_CONCURRENCY }, async () => {
      while (queue.length) {
        const store = queue.shift();
        let place = cachedPlaces[store.slug] || null;

        if (!place) {
          try {
            place = await K.lookupPlace(store, state.map);
          } catch (error) {
            console.warn(`카카오 장소 검색 실패: ${store.name}`, error);
          }
        }

        if (place?.location) {
          state.places.set(store.slug, place);
          state.resolvedCount += 1;
          addPlaceMarker(store, place);
        }

        completed += 1;
        setMapSync(`위치 확인 중 ${completed}/${STORES.length}`, 'working');
        renderResults();
      }
    });

    await Promise.all(workers);
    state.lookupComplete = true;
    K.saveCache(state.places);
    renderResults();
    fitVisibleMarkers();

    if (state.resolvedCount === STORES.length) {
      setMapSync(`${state.resolvedCount}곳 위치 확인 완료`);
    } else if (state.resolvedCount > 0) {
      setMapSync(`${state.resolvedCount}/${STORES.length}곳 위치 확인`, 'warning');
    } else {
      setMapSync('위치를 확인하지 못했어요', 'warning');
    }
  }

  function showMapError(title, message) {
    els.loading.hidden = true;
    els.sync.hidden = true;
    els.errorTitle.textContent = title;
    els.errorMessage.textContent = message;
    els.error.hidden = false;
    els.locate.disabled = true;
  }

  function showMapLoading() {
    els.error.hidden = true;
    els.loading.hidden = false;
    els.sync.hidden = true;
  }





  async function startMap() {
    if (state.mapReady) return;
    showMapLoading();
    try {
      await K.loadSdk();
      state.map = K.createMap(els.map, { level: 7 });
      state.mapReady = true;
      els.loading.hidden = true;
      els.error.hidden = true;
      els.locate.disabled = false;
      setMapSync('카카오맵 연결됨');
      await resolvePlaces();
    } catch (error) {
      console.warn('카카오 지도 초기화 실패', error);
      showMapError(
        error.code === 'NO_KEY' ? '카카오 지도 키 설정이 필요해요' : '지도를 준비하고 있어요',
        error.code === 'NO_KEY'
          ? 'assets/js/kakao-config.js 에 카카오 JavaScript 키를 넣으면 지도가 표시됩니다. 설치 장소 목록은 계속 이용할 수 있어요.'
          : '카카오맵 연결 전에도 설치 장소 목록과 개별 지도 링크는 이용할 수 있습니다.',
      );
    }
  }

  function locateUser() {
    if (!state.mapReady || !navigator.geolocation) {
      setMapSync('현재 위치를 사용할 수 없어요', 'warning');
      return;
    }

    els.locate.disabled = true;
    els.locate.classList.add('is-loading');
    const label = els.locate.querySelector('span');
    if (label) label.textContent = '확인 중';

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        if (!state.userMarker) {
          const content = document.createElement('div');
          content.className = 'user-location-marker';
          state.userMarker = K.createOverlay(state.map, content, position);
        } else {
          state.userMarker.setPosition(K.latLng(position));
          state.userMarker.setMap(state.map);
        }

        state.map.panTo(K.latLng(position));
        state.map.setLevel(4);
        setMapSync('내 위치를 표시했어요');
        els.locate.disabled = false;
        els.locate.classList.remove('is-loading');
        if (label) label.textContent = '내 위치';
      },
      () => {
        setMapSync('위치 권한을 확인해 주세요', 'warning');
        els.locate.disabled = false;
        els.locate.classList.remove('is-loading');
        if (label) label.textContent = '내 위치';
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function resetFilters() {
    state.filter = 'all';
    state.search = '';
    els.search.value = '';
    els.clearSearch.hidden = true;
    document.querySelectorAll('[data-map-filter]').forEach((chip) => {
      const active = chip.dataset.mapFilter === 'all';
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    renderResults({ fitMap: true });
  }

  function bindEvents() {
    document.querySelectorAll('[data-map-filter]').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.classList.contains('is-active')));
      chip.addEventListener('click', () => {
        state.filter = chip.dataset.mapFilter;
        document.querySelectorAll('[data-map-filter]').forEach((other) => {
          const active = other === chip;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', String(active));
        });
        renderResults({ fitMap: true });
      });
    });

    els.search.addEventListener('input', () => {
      state.search = els.search.value.trim();
      els.clearSearch.hidden = !state.search;
      renderResults({ fitMap: true });
    });

    els.clearSearch.addEventListener('click', () => {
      state.search = '';
      els.search.value = '';
      els.clearSearch.hidden = true;
      els.search.focus();
      renderResults({ fitMap: true });
    });

    els.list.addEventListener('click', (event) => {
      const selectButton = event.target.closest('[data-select-store]');
      if (selectButton) selectStore(selectButton.dataset.selectStore, { pan: true });
    });

    els.placeCard.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-place]')) { clearSelection(); return; }
      const nav = event.target.closest('[data-nav-store]');
      if (nav) {
        const list = currentVisibleStores();
        const i = list.findIndex((item) => item.slug === state.selectedSlug);
        if (!list.length) return;
        const target = list[(i + (nav.dataset.navStore === 'next' ? 1 : -1) + list.length) % list.length];
        selectStore(target.slug, { pan: true, scrollList: true });
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.selectedSlug) clearSelection();
    });

    els.retry.addEventListener('click', startMap);
    els.reset.addEventListener('click', resetFilters);
    els.locate.addEventListener('click', locateUser);
  }

  updateFilterCounts();
  bindEvents();
  renderResults();
  startMap();
})();
