/* ============ 무턱대고 카카오맵 공통 모듈 (홈 미리보기 + 지도 페이지) ============ */

(() => {
  'use strict';

  const CACHE_KEY = 'muteokdaego-kakao-places-v1';
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const DEFAULT_CENTER = { lat: 37.5895, lng: 127.0167 };

  let sdkPromise = null;

  function normalize(value) {
    return String(value ?? '').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]/gu, '');
  }

  function hasPreciseAddress(store) {
    return Boolean(store.address && normalize(store.address) !== normalize('서울특별시 성북구'));
  }

  function placeQuery(store) {
    const area = hasPreciseAddress(store) ? store.address : `서울특별시 성북구 ${store.dong}`;
    return `${store.name} ${area}`;
  }

  /** SDK 로드. 키가 없으면 사유가 담긴 에러로 reject. */
  function loadSdk() {
    if (window.kakao?.maps?.services) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    const key = (window.KAKAO_MAP_APP_KEY || '').trim();
    if (!key) {
      return Promise.reject(Object.assign(new Error('카카오 지도 JavaScript 키가 설정되지 않았어요.'), { code: 'NO_KEY' }));
    }
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => window.kakao.maps.load(() => resolve());
      script.onerror = () => {
        sdkPromise = null;
        reject(Object.assign(new Error('카카오 지도 SDK를 불러오지 못했어요. 키와 등록된 도메인을 확인해 주세요.'), { code: 'SDK_FAIL' }));
      };
      document.head.append(script);
    });
    return sdkPromise;
  }

  const latLng = (loc) => new kakao.maps.LatLng(loc.lat, loc.lng);

  function createMap(el, { level = 6, zoomable = true } = {}) {
    const map = new kakao.maps.Map(el, { center: latLng(DEFAULT_CENTER), level });
    map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
    map.setZoomable(zoomable);
    return map;
  }

  /** 경사로 캐릭터 마커를 CustomOverlay로 올린다. */
  function createOverlay(map, element, location, { zIndex = 1 } = {}) {
    const overlay = new kakao.maps.CustomOverlay({
      position: latLng(location), content: element, xAnchor: 0.5, yAnchor: 1, zIndex, clickable: true,
    });
    overlay.setMap(map);
    return overlay;
  }

  function fitTo(map, positions, pad = 70) {
    if (!positions.length) return;
    if (positions.length === 1) { map.setCenter(latLng(positions[0])); map.setLevel(3); return; }
    const bounds = new kakao.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend(latLng(p)));
    map.setBounds(bounds, pad, pad, pad, pad);
  }

  function loadCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (!cached || Date.now() - cached.savedAt > CACHE_TTL) return {};
      return cached.places || {};
    } catch { return {}; }
  }
  function saveCache(placesMap) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), places: Object.fromEntries(placesMap.entries()) })); } catch { /* 저장 불가 환경 */ }
  }

  function matchScore(store, item) {
    const storeName = normalize(store.name);
    const placeName = normalize(item.place_name);
    const address = normalize(`${item.address_name} ${item.road_address_name}`);
    let score = 0;
    if (storeName && placeName && (placeName.includes(storeName) || storeName.includes(placeName))) score += 10;
    if (address.includes(normalize('성북구'))) score += 4;
    if (store.dong && address.includes(normalize(store.dong))) score += 2;
    if (hasPreciseAddress(store)) {
      const tokens = store.address.split(/\s+/).map(normalize).filter((t) => t.length >= 2);
      score += Math.min(6, tokens.filter((t) => address.includes(t)).length * 2);
    }
    return score;
  }

  const toPlace = (item) => ({
    id: item.id || '',
    displayName: item.place_name || '',
    formattedAddress: item.road_address_name || item.address_name || '',
    placeUrl: item.place_url || '',
    location: { lat: Number(item.y), lng: Number(item.x) },
  });

  /** 가게 → 실제 좌표. 긴 질의가 0건이면 질의를 줄여가며 재시도하고, 마지막엔 주소 검색으로 보완. */
  function lookupPlace(store, map) {
    const places = new kakao.maps.services.Places();
    const geocoder = new kakao.maps.services.Geocoder();
    const search = (query) => new Promise((resolve) => {
      places.keywordSearch(query, (data, status) => resolve(status === kakao.maps.services.Status.OK ? data : []),
        { location: map.getCenter(), radius: 10000, size: 10 });
    });
    const attempts = [
      { q: placeQuery(store), min: 8 },
      { q: `${store.name} ${store.dong || '성북구'}`, min: 14 },
      { q: `${store.name} 성북구`, min: 14 },
      { q: store.name, min: 14 },
    ];
    return (async () => {
      for (const { q, min } of attempts) {
        const data = await search(q);
        const best = data.map((item) => ({ item, score: matchScore(store, item) })).sort((a, b) => b.score - a.score)[0];
        if (best && best.score >= min) return toPlace(best.item);
      }
      if (!hasPreciseAddress(store)) return null;
      return new Promise((resolve) => geocoder.addressSearch(store.address, (res, st) => {
        if (st !== kakao.maps.services.Status.OK || !res[0]) { resolve(null); return; }
        resolve({ id: '', displayName: store.name, formattedAddress: store.address, placeUrl: '', location: { lat: Number(res[0].y), lng: Number(res[0].x) } });
      }));
    })();
  }

  function kakaoSearchUrl(store) { return `https://map.kakao.com/link/search/${encodeURIComponent(placeQuery(store))}`; }
  function kakaoRouteUrl(store, place) {
    if (place?.location) return `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${place.location.lat},${place.location.lng}`;
    return kakaoSearchUrl(store);
  }
  function safeKakaoUrl(candidate, fallback) {
    if (!candidate) return fallback;
    try {
      const url = new URL(candidate, location.href);
      const h = url.hostname.toLowerCase();
      const ok = h === 'kakao.com' || h.endsWith('.kakao.com') || h === 'daum.net' || h.endsWith('.daum.net');
      return ok && /^https?:$/.test(url.protocol) ? url.href.replace(/^http:/, 'https:') : fallback;
    } catch { return fallback; }
  }

  window.KakaoMapKit = {
    DEFAULT_CENTER, normalize, placeQuery, loadSdk, createMap, createOverlay, fitTo, latLng,
    loadCache, saveCache, lookupPlace, kakaoSearchUrl, kakaoRouteUrl, safeKakaoUrl,
  };
})();
