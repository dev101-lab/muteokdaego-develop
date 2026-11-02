/* ============ 무턱대고 관리자 (미리보기) ============
   DB 연결 전 단계: 사이트 데이터(STORES·SUPPORTS·VOICES)를 시작값으로 쓰고
   수정 내용은 localStorage에만 저장한다. DB를 붙이면 load()/persist()만 바꾸면 됨. */

(() => {
  'use strict';

  const STORAGE_KEY = 'mtdg-admin-v1';

  const CAT_OPTIONS = [['food', '식당'], ['cafe', '카페'], ['care', '약국·기관'], ['etc', '판매·기타']];
  const STATUS_OPTIONS = [['open', '접수 중'], ['upcoming', '접수 예정'], ['check', '기관 확인 필요'], ['closed', '접수 종료']];
  const REQUEST_STATUS = [['new', '신규'], ['contact', '상담 중'], ['scheduled', '설치 예정'], ['done', '설치 완료'], ['hold', '보류']];
  const REGIONS = ['서울', '경기', '인천', '충남', '충북', '대전', '세종', '강원', '전북', '전남', '광주', '대구', '경북', '부산', '울산', '경남', '제주', '전국'];

  /* ---------- 데이터 정의 ---------- */
  const ENTITIES = {
    stores: {
      label: '설치 가게', unit: '곳', addLabel: '가게 추가',
      desc: '경사로를 설치한 가게예요. 여기 등록된 가게가 지도와 설치 기록에 표시돼요.',
      title: (s) => s.name,
      fields: [
        { key: 'name', label: '가게 이름', required: true },
        { key: 'slug', label: '주소용 영문 ID', hint: '사진 파일 이름과 상세 페이지 주소에 쓰여요. 예: honggane-kimbap', required: true },
        { key: 'catClass', label: '지도 분류', type: 'select', options: CAT_OPTIONS, half: true },
        { key: 'cat', label: '업종', hint: '예: 식당, 약국', half: true },
        { key: 'address', label: '주소', hint: '도로명 주소를 정확히 넣으면 지도에 핀이 꽂혀요.', required: true },
        { key: 'dong', label: '동네', half: true },
        { key: 'date', label: '설치 시기', hint: '예: 2025.08 설치', half: true },
        { key: 'work', label: '작업', type: 'select', options: [['설치', '설치'], ['수리', '수리'], ['교체', '교체']], half: true },
        { key: 'rampType', label: '경사로 종류', type: 'select', options: [['고정식', '고정식'], ['이동식', '이동식']], half: true },
        { key: 'desc', label: '설명', type: 'textarea' },
        { key: 'before', label: '설치 전 상황', half: true },
        { key: 'after', label: '설치 후 변화', half: true },
        { key: 'beforeImg', label: '설치 전 사진', type: 'image', half: true },
        { key: 'afterImg', label: '설치 후 사진', type: 'image', half: true },
        { key: 'hidden', label: '사이트에서 숨기기', type: 'checkbox' },
      ],
      blank: () => ({ name: '', slug: '', catClass: 'food', cat: '식당', address: '', dong: '', date: '', work: '설치', rampType: '고정식', desc: '', before: '', after: '', beforeImg: '', afterImg: '', hidden: false }),
    },
    supports: {
      label: '지역 공고', unit: '건', addLabel: '공고 작성',
      desc: '지자체 경사로 지원사업 공고예요. 경사로 신청 페이지에 지역별로 표시돼요.',
      title: (s) => s.title,
      fields: [
        { key: 'title', label: '공고 제목', required: true },
        { key: 'r', label: '시·도', type: 'select', options: REGIONS.map((r) => [r, r]), half: true },
        { key: 'region', label: '표시 지역', hint: '예: 서울·성동구', half: true },
        { key: 'status', label: '접수 상태', type: 'select', options: STATUS_OPTIONS, half: true },
        { key: 'when', label: '접수 기간', hint: '예: 2026.07.01 ~ 2026.07.30', half: true },
        { key: 'org', label: '담당 기관' },
        { key: 'tag', label: '지원 내용', hint: '예: 최대 300만원·공급가 90%' },
        { key: 'eligibility', label: '신청 자격', type: 'textarea' },
        { key: 'documents', label: '제출 서류', type: 'textarea' },
        { key: 'sourceUrl', label: '공고 원문 링크', type: 'url' },
        { key: 'sourceOfficial', label: '공식 공고 원문을 확인했어요', type: 'checkbox' },
      ],
      blank: () => ({ title: '', r: '서울', region: '', status: 'open', when: '', org: '', tag: '', eligibility: '', documents: '', sourceUrl: '', sourceOfficial: true }),
    },
    requests: {
      label: '신청 접수', unit: '건', addLabel: '신청 직접 등록',
      desc: '경사로 신청 폼으로 들어온 상담 요청이에요. 설치가 끝나면 바로 지도에 가게로 등록할 수 있어요.',
      title: (s) => s.name,
      fields: [
        { key: 'name', label: '가게·시설 이름', required: true },
        { key: 'address', label: '주소', required: true },
        { key: 'contact', label: '연락처', half: true },
        { key: 'role', label: '신청자', type: 'select', options: [['사장님', '사장님'], ['손님·이웃', '손님·이웃'], ['기관', '기관']], half: true },
        { key: 'rampType', label: '필요한 경사로', type: 'select', options: [['잘 모르겠어요', '잘 모르겠어요'], ['고정식', '고정식'], ['이동식', '이동식']], half: true },
        { key: 'status', label: '진행 상태', type: 'select', options: REQUEST_STATUS, half: true },
        { key: 'note', label: '입구 상황', type: 'textarea' },
        { key: 'memo', label: '내부 메모', type: 'textarea', hint: '사이트에는 보이지 않아요.' },
      ],
      blank: () => ({ name: '', address: '', contact: '', role: '사장님', rampType: '잘 모르겠어요', status: 'new', note: '', memo: '', receivedAt: today() }),
    },
    voices: {
      label: '점주 인터뷰', unit: '개', addLabel: '인터뷰 추가',
      desc: '메인 페이지의 점주 인터뷰 카드예요.',
      title: (s) => `${s.place} · ${s.name}`,
      fields: [
        { key: 'name', label: '인터뷰이', hint: '예: 김영숙 사장님', half: true },
        { key: 'place', label: '가게 이름', half: true },
        { key: 'category', label: '업종', half: true },
        { key: 'district', label: '지역', half: true },
        { key: 'before', label: '설치 전 이야기', type: 'textarea' },
        { key: 'after', label: '설치 후 이야기', type: 'textarea' },
        { key: 'verified', label: '본인 확인을 마쳤어요', type: 'checkbox' },
      ],
      blank: () => ({ name: '', place: '', category: '', district: '', before: '', after: '', verified: false }),
    },
  };

  /* ---------- 저장소 ---------- */
  function today() {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function seed() {
    const stores = (typeof STORES === 'undefined' ? [] : STORES).map((s) => ({
      id: uid(), name: s.name, slug: s.slug, catClass: s.catClass, cat: s.cat, address: s.address, dong: s.dong,
      date: s.date, work: s.work, rampType: s.rampType, desc: s.desc, before: s.before, after: s.after,
      beforeImg: `assets/img/stores/${s.slug}-before.jpg`, afterImg: `assets/img/stores/${s.slug}-after.jpg`,
      hidden: false, needsReview: !s.fromFigma,
    }));
    const supports = (typeof SUPPORTS === 'undefined' ? [] : SUPPORTS).map((s) => ({
      id: uid(), title: s.title, r: s.r, region: s.region, status: s.status, when: s.when, org: s.org, tag: s.tag,
      eligibility: s.eligibility, documents: s.documents, sourceUrl: s.sourceUrl, sourceOfficial: !!s.sourceOfficial,
    }));
    const voices = (typeof VOICES === 'undefined' ? [] : VOICES).map((v) => ({
      id: uid(), name: v.name, place: v.place, category: v.category, district: v.district,
      before: v.before, after: v.after, verified: v.verificationStatus === 'source-checked',
    }));
    // 신청 접수는 아직 저장되는 곳이 없어 화면 확인용 예시만 넣는다.
    const requests = [
      { id: uid(), sample: true, name: '(예시) 동네 꽃집', address: '서울특별시 성북구 보문로 00', contact: '010-0000-0000', role: '사장님', rampType: '이동식', status: 'new', note: '입구에 10cm 정도 턱이 하나 있어요.', memo: '', receivedAt: today() },
      { id: uid(), sample: true, name: '(예시) 골목 세탁소', address: '서울특별시 성북구 동소문로 00', contact: '010-0000-0000', role: '손님·이웃', rampType: '잘 모르겠어요', status: 'contact', note: '휠체어 타는 이웃이 들어가기 어려워해요.', memo: '사장님 통화 완료, 현장 방문 일정 조율 중', receivedAt: '2026.10.28' },
    ];
    return { stores, supports, voices, requests, log: [] };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.stores) return saved;
    } catch { /* 저장소를 못 쓰면 사이트 데이터로 시작 */ }
    return seed();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      return true;
    } catch {
      toast('브라우저 저장 공간이 부족해요. 사진 크기를 줄여 주세요.');
      return false;
    }
  }

  let db = load();
  let view = 'dashboard';
  let editing = null; // { type, id }
  const filters = { stores: { q: '', cat: 'all' }, supports: { q: '', status: 'all' }, requests: { q: '', status: 'all' }, voices: { q: '' } };

  /* ---------- 유틸 ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const viewEl = $('#admView');

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function optLabel(options, value) {
    const found = options.find(([v]) => v === value);
    return found ? found[1] : value;
  }

  let toastTimer;
  function toast(message) {
    const el = $('#admToast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function addLog(text) {
    db.log.unshift({ text, at: new Date().toISOString() });
    db.log = db.log.slice(0, 20);
  }

  function matches(item, q, keys) {
    if (!q) return true;
    const hay = keys.map((k) => item[k] || '').join(' ').toLocaleLowerCase('ko-KR');
    return hay.includes(q.toLocaleLowerCase('ko-KR'));
  }

  /* ---------- 화면 ---------- */
  function updateCounts() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const type = el.dataset.count;
      if (type === 'requests') {
        const n = db.requests.filter((r) => r.status === 'new').length;
        el.textContent = n || '';
        el.classList.toggle('is-alert', n > 0);
      } else {
        el.textContent = db[type].length;
      }
    });
  }

  function pageHead(type, extra = '') {
    const e = ENTITIES[type];
    return `
      <header class="adm-head">
        <div>
          <h1>${e.label} <small>${db[type].length}${e.unit}</small></h1>
          <p>${e.desc}</p>
        </div>
        <div class="adm-head-actions">${extra}<button type="button" class="adm-btn adm-btn-primary" data-add="${type}">＋ ${e.addLabel}</button></div>
      </header>`;
  }

  function searchBar(type, placeholder, chips = '') {
    return `
      <div class="adm-toolbar">
        <label class="adm-search"><span class="sr-only">검색</span>
          <input type="search" data-search="${type}" value="${esc(filters[type].q)}" placeholder="${placeholder}">
        </label>
        <div class="adm-chips">${chips}</div>
      </div>`;
  }

  function chipRow(type, key, options) {
    const current = filters[type][key];
    return [['all', '전체'], ...options].map(([v, l]) =>
      `<button type="button" class="adm-chip ${current === v ? 'is-active' : ''}" data-filter="${type}" data-key="${key}" data-value="${v}">${l}</button>`).join('');
  }

  function renderDashboard() {
    const openSupports = db.supports.filter((s) => s.status === 'open' || s.status === 'upcoming').length;
    const newRequests = db.requests.filter((r) => r.status === 'new').length;
    const reviewStores = db.stores.filter((s) => s.needsReview || !/\d/.test(s.address));
    const visibleStores = db.stores.filter((s) => !s.hidden).length;
    const regions = new Set(db.stores.map((s) => s.dong).filter(Boolean)).size;

    viewEl.innerHTML = `
      <header class="adm-head"><div><h1>대시보드</h1><p>무턱대고 사이트 콘텐츠를 한눈에 확인하고 관리해요.</p></div></header>
      <section class="adm-kpis">
        <button type="button" class="adm-kpi" data-go="stores"><span>지도에 표시 중인 가게</span><b>${visibleStores}<small>곳</small></b><em>${regions}개 동네</em></button>
        <button type="button" class="adm-kpi" data-go="supports"><span>접수 중·예정 공고</span><b>${openSupports}<small>건</small></b><em>전체 ${db.supports.length}건</em></button>
        <button type="button" class="adm-kpi ${newRequests ? 'is-alert' : ''}" data-go="requests"><span>새 신청</span><b>${newRequests}<small>건</small></b><em>확인이 필요해요</em></button>
        <button type="button" class="adm-kpi" data-go="voices"><span>점주 인터뷰</span><b>${db.voices.length}<small>개</small></b><em>미확인 ${db.voices.filter((v) => !v.verified).length}개</em></button>
      </section>
      <div class="adm-grid2">
        <section class="adm-card">
          <h2>정보 보완이 필요한 가게 <small>${reviewStores.length}곳</small></h2>
          <p class="adm-card-sub">상세 주소가 없으면 지도에 정확히 표시되지 않아요.</p>
          <ul class="adm-mini-list">
            ${reviewStores.slice(0, 8).map((s) => `<li><button type="button" data-edit="stores" data-id="${s.id}"><b>${esc(s.name)}</b><span>${esc(s.address || '주소 없음')}</span><i>보완하기 →</i></button></li>`).join('') || '<li class="adm-empty-mini">모두 채워졌어요 🎉</li>'}
          </ul>
        </section>
        <section class="adm-card">
          <h2>최근 변경</h2>
          <p class="adm-card-sub">이 브라우저에서 저장한 내역이에요.</p>
          <ul class="adm-log">
            ${db.log.slice(0, 8).map((l) => `<li><span>${esc(l.text)}</span><time>${new Date(l.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></li>`).join('') || '<li class="adm-empty-mini">아직 변경 내역이 없어요.</li>'}
          </ul>
        </section>
      </div>`;
  }

  function renderStores() {
    const f = filters.stores;
    const list = db.stores.filter((s) => (f.cat === 'all' || s.catClass === f.cat) && matches(s, f.q, ['name', 'address', 'dong', 'cat']));
    viewEl.innerHTML = pageHead('stores') + searchBar('stores', '가게 이름·주소·동네 검색', chipRow('stores', 'cat', CAT_OPTIONS)) + `
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>가게</th><th>분류</th><th>주소</th><th>경사로</th><th>설치</th><th>상태</th></tr></thead>
          <tbody>
            ${list.map((s) => `
              <tr data-edit="stores" data-id="${s.id}" tabindex="0">
                <td><div class="adm-store-cell">
                  <span class="adm-thumbs">${s.beforeImg ? `<img src="${esc(s.beforeImg)}" alt="" loading="lazy">` : '<i></i>'}${s.afterImg ? `<img src="${esc(s.afterImg)}" alt="" loading="lazy">` : '<i></i>'}</span>
                  <span><b>${esc(s.name)}</b><small>${esc(s.slug)}</small></span>
                </div></td>
                <td><span class="adm-tag adm-tag-${esc(s.catClass)}">${esc(optLabel(CAT_OPTIONS, s.catClass))}</span><small class="adm-sub">${esc(s.cat)}</small></td>
                <td class="adm-addr">${esc(s.address)}${/\d/.test(s.address) ? '' : '<em class="adm-warn">상세 주소 필요</em>'}</td>
                <td>${esc(s.rampType)} <small class="adm-sub">${esc(s.work)}</small></td>
                <td>${esc(s.date)}</td>
                <td>${s.hidden ? '<span class="adm-pill is-muted">숨김</span>' : '<span class="adm-pill is-on">지도 표시</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        ${list.length ? '' : '<p class="adm-empty">조건에 맞는 가게가 없어요.</p>'}
      </div>`;
  }

  function renderSupports() {
    const f = filters.supports;
    const list = db.supports.filter((s) => (f.status === 'all' || s.status === f.status) && matches(s, f.q, ['title', 'region', 'org', 'tag']));
    viewEl.innerHTML = pageHead('supports') + searchBar('supports', '공고 제목·지역·기관 검색', chipRow('supports', 'status', STATUS_OPTIONS)) + `
      <ul class="adm-cards">
        ${list.map((s) => `
          <li class="adm-notice">
            <button type="button" class="adm-notice-main" data-edit="supports" data-id="${s.id}">
              <span class="adm-notice-meta"><span class="adm-region">${esc(s.region || s.r)}</span>${s.sourceOfficial ? '<span class="adm-verified">✓ 공식 원문</span>' : '<span class="adm-verified is-press">보도 확인</span>'}</span>
              <b>${esc(s.title)}</b>
              <span class="adm-notice-sub">${esc(s.org)} · ${esc(s.tag)}</span>
              <span class="adm-notice-when">${esc(s.when)}</span>
            </button>
            <label class="adm-status-select adm-status-${esc(s.status)}"><span class="sr-only">접수 상태</span>
              <select data-quick-status="supports" data-id="${s.id}">
                ${STATUS_OPTIONS.map(([v, l]) => `<option value="${v}" ${v === s.status ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </label>
          </li>`).join('')}
      </ul>
      ${list.length ? '' : '<p class="adm-empty">조건에 맞는 공고가 없어요.</p>'}`;
  }

  function renderRequests() {
    const f = filters.requests;
    const list = db.requests.filter((r) => (f.status === 'all' || r.status === f.status) && matches(r, f.q, ['name', 'address', 'contact']));
    viewEl.innerHTML = pageHead('requests') + searchBar('requests', '가게 이름·주소·연락처 검색', chipRow('requests', 'status', REQUEST_STATUS)) + `
      <ul class="adm-cards">
        ${list.map((r) => `
          <li class="adm-request">
            <button type="button" class="adm-request-main" data-edit="requests" data-id="${r.id}">
              <span class="adm-notice-meta"><span class="adm-region">${esc(r.role)}</span><time>${esc(r.receivedAt)} 접수</time></span>
              <b>${esc(r.name)}</b>
              <span class="adm-notice-sub">${esc(r.address)} · ${esc(r.rampType)}</span>
              ${r.note ? `<span class="adm-quote">“${esc(r.note)}”</span>` : ''}
              ${r.memo ? `<span class="adm-memo">메모 · ${esc(r.memo)}</span>` : ''}
            </button>
            <div class="adm-request-side">
              <label class="adm-status-select adm-req-${esc(r.status)}"><span class="sr-only">진행 상태</span>
                <select data-quick-status="requests" data-id="${r.id}">
                  ${REQUEST_STATUS.map(([v, l]) => `<option value="${v}" ${v === r.status ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
              </label>
              <button type="button" class="adm-btn adm-btn-sm" data-promote="${r.id}">지도에 가게로 등록</button>
            </div>
          </li>`).join('')}
      </ul>
      ${list.length ? '' : '<p class="adm-empty">조건에 맞는 신청이 없어요.</p>'}
      <p class="adm-footnote">지금은 신청 폼이 메일로만 전송돼서 위 항목은 화면 확인용 예시예요. DB를 연결하면 신청이 여기로 바로 들어와요.</p>`;
  }

  function renderVoices() {
    const f = filters.voices;
    const list = db.voices.filter((v) => matches(v, f.q, ['name', 'place', 'district']));
    viewEl.innerHTML = pageHead('voices') + searchBar('voices', '이름·가게·지역 검색') + `
      <ul class="adm-voice-grid">
        ${list.map((v) => `
          <li><button type="button" class="adm-voice" data-edit="voices" data-id="${v.id}">
            <span class="adm-notice-meta"><span class="adm-region">${esc(v.category)} · ${esc(v.district)}</span>${v.verified ? '<span class="adm-verified">✓ 확인됨</span>' : '<span class="adm-verified is-warn">확인 필요</span>'}</span>
            <b>${esc(v.place)}</b><small>${esc(v.name)}</small>
            <span class="adm-quote">“${esc(v.after)}”</span>
          </button></li>`).join('')}
      </ul>
      ${list.length ? '' : '<p class="adm-empty">조건에 맞는 인터뷰가 없어요.</p>'}`;
  }

  const RENDER = { dashboard: renderDashboard, stores: renderStores, supports: renderSupports, requests: renderRequests, voices: renderVoices };

  function render() {
    RENDER[view]();
    updateCounts();
    document.querySelectorAll('.adm-nav [data-view]').forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
  }

  function go(next) {
    view = next;
    render();
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', `#${next}`); } catch { /* 미리보기 환경 */ }
  }

  /* ---------- 편집 패널 ---------- */
  const drawer = $('#admDrawer');
  const fieldsEl = $('#admFields');

  function fieldHtml(field, item) {
    const id = `f-${field.key}`;
    const value = item[field.key] ?? '';
    const req = field.required ? ' required' : '';
    const hint = field.hint ? `<small class="adm-hint">${esc(field.hint)}</small>` : '';
    const cls = `adm-field${field.half ? ' is-half' : ''}`;
    if (field.type === 'checkbox') {
      return `<label class="${cls} adm-check"><input type="checkbox" name="${field.key}" ${value ? 'checked' : ''}><span>${field.label}</span></label>`;
    }
    if (field.type === 'select') {
      return `<label class="${cls}" for="${id}"><span>${field.label}</span><select id="${id}" name="${field.key}">${field.options.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${hint}</label>`;
    }
    if (field.type === 'textarea') {
      return `<label class="${cls}" for="${id}"><span>${field.label}</span><textarea id="${id}" name="${field.key}" rows="3"${req}>${esc(value)}</textarea>${hint}</label>`;
    }
    if (field.type === 'image') {
      return `<div class="${cls} adm-image-field"><span>${field.label}</span>
        <label class="adm-dropzone" for="${id}">
          ${value ? `<img src="${esc(value)}" alt="">` : '<i>사진 선택</i>'}
          <input id="${id}" type="file" accept="image/*" data-image="${field.key}">
        </label>
        <input type="hidden" name="${field.key}" value="${esc(value)}">
      </div>`;
    }
    return `<label class="${cls}" for="${id}"><span>${field.label}${field.required ? ' <b>*</b>' : ''}</span><input id="${id}" name="${field.key}" type="${field.type === 'url' ? 'url' : 'text'}" value="${esc(value)}"${req}>${hint}</label>`;
  }

  function openEditor(type, id, preset) {
    const entity = ENTITIES[type];
    const item = id ? db[type].find((x) => x.id === id) : { ...entity.blank(), ...preset };
    if (!item) return;
    editing = { type, id };
    $('#admDrawerTitle').textContent = id ? `${entity.label} 수정` : entity.addLabel;
    fieldsEl.innerHTML = entity.fields.map((f) => fieldHtml(f, item)).join('');
    $('#admDelete').hidden = !id;
    drawer.showModal();
    const first = fieldsEl.querySelector('input:not([type=hidden]):not([type=file]), textarea');
    if (first && !id) first.focus();
  }

  // 사진은 DB 전까지 브라우저에 저장하므로 긴 변 1200px로 줄여서 담는다.
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  fieldsEl.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-image]');
    if (!input || !input.files[0]) return;
    const dataUrl = await resizeImage(input.files[0]);
    const wrap = input.closest('.adm-image-field');
    wrap.querySelector(`input[name="${input.dataset.image}"]`).value = dataUrl;
    wrap.querySelector('.adm-dropzone').querySelector('img, i').outerHTML = `<img src="${dataUrl}" alt="">`;
  });

  $('#admForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const { type, id } = editing;
    const entity = ENTITIES[type];
    const form = event.currentTarget;
    const data = {};
    for (const field of entity.fields) {
      const el = form.elements[field.key];
      data[field.key] = field.type === 'checkbox' ? el.checked : el.value.trim();
    }
    const missing = entity.fields.find((f) => f.required && !data[f.key]);
    if (missing) {
      toast(`${missing.label}을(를) 입력해 주세요.`);
      form.elements[missing.key].focus();
      return;
    }
    if (type === 'stores') data.needsReview = false;
    if (id) {
      const idx = db[type].findIndex((x) => x.id === id);
      db[type][idx] = { ...db[type][idx], ...data };
      addLog(`${entity.label} 수정 · ${entity.title(db[type][idx])}`);
    } else {
      const created = { id: uid(), ...entity.blank(), ...data };
      db[type].unshift(created);
      addLog(`${entity.label} 추가 · ${entity.title(created)}`);
    }
    if (persist()) {
      drawer.close();
      toast('저장했어요');
      render();
    }
  });

  $('#admDelete').addEventListener('click', () => {
    const { type, id } = editing;
    const entity = ENTITIES[type];
    const item = db[type].find((x) => x.id === id);
    if (!item || !confirm(`'${entity.title(item)}'을(를) 삭제할까요?`)) return;
    db[type] = db[type].filter((x) => x.id !== id);
    addLog(`${entity.label} 삭제 · ${entity.title(item)}`);
    persist();
    drawer.close();
    toast('삭제했어요');
    render();
  });

  drawer.addEventListener('click', (event) => {
    if (event.target === drawer || event.target.closest('[data-close]')) drawer.close();
  });

  /* ---------- 이벤트 ---------- */
  document.querySelector('.adm-nav').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-view]');
    if (btn) go(btn.dataset.view);
  });

  viewEl.addEventListener('click', (event) => {
    const t = event.target;
    const goBtn = t.closest('[data-go]');
    if (goBtn) return go(goBtn.dataset.go);
    const add = t.closest('[data-add]');
    if (add) return openEditor(add.dataset.add);
    const promote = t.closest('[data-promote]');
    if (promote) {
      const r = db.requests.find((x) => x.id === promote.dataset.promote);
      const dong = (r.address.match(/(\S+동)\b/) || [])[1] || '';
      return openEditor('stores', null, { name: r.name.replace(/^\(예시\)\s*/, ''), address: r.address, dong, rampType: r.rampType === '이동식' ? '이동식' : '고정식', date: `${today().slice(0, 7)} 설치`, before: r.note });
    }
    const filter = t.closest('[data-filter]');
    if (filter) {
      filters[filter.dataset.filter][filter.dataset.key] = filter.dataset.value;
      return render();
    }
    if (t.closest('select')) return;
    const edit = t.closest('[data-edit]');
    if (edit) openEditor(edit.dataset.edit, edit.dataset.id);
  });

  viewEl.addEventListener('keydown', (event) => {
    const row = event.target.closest('tr[data-edit]');
    if (row && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openEditor(row.dataset.edit, row.dataset.id);
    }
  });

  viewEl.addEventListener('change', (event) => {
    const sel = event.target.closest('[data-quick-status]');
    if (!sel) return;
    const type = sel.dataset.quickStatus;
    const item = db[type].find((x) => x.id === sel.dataset.id);
    item.status = sel.value;
    const options = type === 'supports' ? STATUS_OPTIONS : REQUEST_STATUS;
    addLog(`${ENTITIES[type].label} 상태 변경 · ${ENTITIES[type].title(item)} → ${optLabel(options, sel.value)}`);
    persist();
    toast(`'${optLabel(options, sel.value)}'(으)로 바꿨어요`);
    render();
  });

  let searchTimer;
  viewEl.addEventListener('input', (event) => {
    const input = event.target.closest('[data-search]');
    if (!input) return;
    filters[input.dataset.search].q = input.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const pos = input.selectionStart;
      render();
      const again = viewEl.querySelector(`[data-search="${input.dataset.search}"]`);
      again.focus();
      again.setSelectionRange(pos, pos);
    }, 150);
  });

  $('#admReset').addEventListener('click', () => {
    if (!confirm('이 브라우저에서 수정한 내용을 모두 지우고 현재 사이트 데이터로 되돌릴까요?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* 무시 */ }
    db = seed();
    toast('사이트 데이터로 초기화했어요');
    render();
  });

  $('#admExport').addEventListener('click', () => {
    const { log, ...data } = db;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `muteokdaego-data-${today().replaceAll('.', '')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const initial = location.hash.slice(1);
  if (RENDER[initial]) view = initial;
  window.addEventListener('hashchange', () => {
    const next = location.hash.slice(1);
    if (RENDER[next] && next !== view) go(next);
  });
  render();
})();
