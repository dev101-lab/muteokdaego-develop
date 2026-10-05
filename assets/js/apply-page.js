/* ============ 지원사업·경사로 신청 페이지 ============ */

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

  function statusLabel(status) {
    if (status === 'open') return '접수 중';
    if (status === 'upcoming') return '접수 예정';
    if (status === 'check') return '기관 확인 필요';
    return '접수 종료';
  }

  function sourceState(support) {
    if (support.verificationStatus === 'fallback') {
      return { label: '최근 검증 데이터', className: 'is-fallback' };
    }
    if (support.sourceOfficial) {
      const aggregate = support.verificationStatus === 'official-aggregate' ? 'is-aggregate' : '';
      return { label: support.sourceLabel || '공식 원문 확인', className: aggregate };
    }
    return { label: support.sourceLabel || '보도 교차 확인', className: 'is-press' };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fallbackSupports = typeof SUPPORTS === 'undefined' ? [] : SUPPORTS;
    let supports = fallbackSupports;
    let activeRegion = 'all';

    const currentList = document.getElementById('supportCurrentList');
    const checkList = document.getElementById('supportCheckList');
    const pastList = document.getElementById('supportPastList');
    const currentEmpty = document.getElementById('supportCurrentEmpty');
    const currentCount = document.getElementById('supportCurrentCount');
    const checkCount = document.getElementById('supportCheckCount');
    const pastCount = document.getElementById('supportPastCount');
    const regionFilters = document.getElementById('supportRegionFilters');
    const dataStatus = document.getElementById('supportDataStatus');
    const disclaimer = document.getElementById('supportDisclaimer');
    const dialog = document.getElementById('supportDialog');
    const searchInput = document.getElementById('supportSearch');

    function applySupportFilter() {
      const query = searchInput.value.trim().toLocaleLowerCase('ko-KR');
      let openCount = 0;
      let verifyCount = 0;
      let closedCount = 0;

      document.querySelectorAll('.support-card').forEach((card) => {
        const regionMatches = activeRegion === 'all' || card.dataset.region === activeRegion;
        const textMatches = !query || card.dataset.text.includes(query);
        const visible = regionMatches && textMatches;
        card.classList.toggle('is-hidden', !visible);
        if (visible && ['open', 'upcoming'].includes(card.dataset.status)) openCount += 1;
        if (visible && card.dataset.status === 'check') verifyCount += 1;
        if (visible && card.dataset.status === 'closed') closedCount += 1;
      });

      currentCount.textContent = openCount;
      checkCount.textContent = verifyCount;
      pastCount.textContent = closedCount;
      currentEmpty.hidden = openCount !== 0;
    }

    function renderRegionFilters() {
      const preferredOrder = ['서울', '경기', '인천', '충남', '충북', '대전', '세종', '강원', '전북', '전남', '전남광주', '광주', '대구', '경북', '부산', '울산', '경남', '제주', '전국'];
      const regions = [...new Set(supports.map((support) => support.r).filter(Boolean))]
        .sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));
      if (activeRegion !== 'all' && !regions.includes(activeRegion)) activeRegion = 'all';
      regionFilters.innerHTML = [
        `<button class="chip ${activeRegion === 'all' ? 'is-active' : ''}" data-region="all" type="button" aria-pressed="${activeRegion === 'all'}">전국</button>`,
        ...regions.map((region) => `<button class="chip ${activeRegion === region ? 'is-active' : ''}" data-region="${escapeHtml(region)}" type="button" aria-pressed="${activeRegion === region}">${escapeHtml(region)}</button>`),
      ].join('');
    }

    function renderSupportCards(nextSupports) {
      supports = nextSupports;
      currentList.replaceChildren();
      checkList.replaceChildren();
      pastList.replaceChildren();
      renderRegionFilters();

      supports.forEach((support, index) => {
        const source = sourceState(support);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'support-card reveal';
        button.dataset.region = support.r;
        button.dataset.status = support.status;
        button.dataset.text = `${support.region} ${support.title} ${support.org} ${support.tag} ${support.eligibility}`.toLocaleLowerCase('ko-KR');
        button.dataset.supportIndex = index;
        button.setAttribute('aria-label', `${support.title} 상세 보기`);
        button.innerHTML = `
          <div class="support-card-main">
            <div class="support-card-meta">
              <span class="support-region"><i aria-hidden="true"></i>${escapeHtml(support.region)}</span>
              <span class="support-status is-${escapeHtml(support.status)}"><i aria-hidden="true"></i>${statusLabel(support.status)}</span>
            </div>
            <h3>${escapeHtml(support.title)}</h3>
            <p class="support-benefit"><span>지원 내용</span><strong>${escapeHtml(support.tag)}</strong></p>
            <div class="support-source-row">
              <span class="support-source-state ${source.className}"><i aria-hidden="true">✓</i>${escapeHtml(source.label)}</span>
              <span class="support-org">${escapeHtml(support.org)}</span>
            </div>
          </div>
          <div class="support-when">
            <p class="label">접수 일정</p>
            <p class="value">${escapeHtml(support.when)}</p>
            <span class="support-open"><span>상세 보기</span><b aria-hidden="true">→</b></span>
          </div>`;
        const destination = support.status === 'closed' ? pastList : support.status === 'check' ? checkList : currentList;
        destination.appendChild(button);
      });

      applySupportFilter();
      requestAnimationFrame(() => {
        if (typeof assignRevealDelays === 'function') assignRevealDelays();
        if (typeof initReveal === 'function') initReveal();
      });
    }

    function openSupport(index) {
      const support = supports[index];
      if (!support) return;
      document.getElementById('supportDialogStatus').textContent = statusLabel(support.status);
      document.getElementById('supportDialogStatus').className = `support-status is-${support.status}`;
      document.getElementById('supportDialogRegion').textContent = support.region;
      document.getElementById('supportDialogTitle').textContent = support.title;
      document.getElementById('supportDialogOrg').textContent = support.org;
      document.getElementById('supportDialogAmount').textContent = support.tag;
      document.getElementById('supportDialogWhen').textContent = support.when;
      document.getElementById('supportDialogEligibility').textContent = support.eligibility;
      document.getElementById('supportDialogDocuments').textContent = support.documents;
      const sourceLink = document.getElementById('supportDialogSource');
      sourceLink.href = support.sourceUrl;
      sourceLink.textContent = `${sourceState(support).label} 원문 보기 ↗`;
      dialog.showModal();
    }

    [currentList, checkList, pastList].forEach((list) => {
      list.addEventListener('click', (event) => {
        const card = event.target.closest('[data-support-index]');
        if (card) openSupport(Number(card.dataset.supportIndex));
      });
    });

    document.querySelector('[data-close-support]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    regionFilters.addEventListener('click', (event) => {
      const chip = event.target.closest('.chip[data-region]');
      if (!chip) return;
      regionFilters.querySelectorAll('.chip[data-region]').forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      activeRegion = chip.dataset.region;
      applySupportFilter();
    });
    searchInput.addEventListener('input', applySupportFilter);

    renderSupportCards(fallbackSupports);

    async function refreshFromSources() {
      try {
        const response = await fetch('/api/notices?v=20260914-8', { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!Array.isArray(result.notices) || !result.notices.length) throw new Error('공고 데이터가 비어 있습니다.');

        renderSupportCards(result.notices);
        const allLive = result.liveSourceCount === result.sourceCount;
        dataStatus.classList.toggle('is-partial', !allLive);
        const coverageCount = Array.isArray(result.coverageRegions) ? result.coverageRegions.length : 17;
        dataStatus.textContent = `${result.verifiedDate} 전국 ${coverageCount}개 시·도 수집 · ${result.notices.length}건 · ${result.liveSourceCount}/${result.sourceCount}개 수집원 정상`;
        disclaimer.textContent = `${result.scope}에서 확인된 결과입니다. 지난 공고는 다음 모집의 참고용이며, 신청 전 연결된 최신 원문을 다시 확인해 주세요.`;
      } catch {
        dataStatus.classList.add('is-partial');
        dataStatus.textContent = '실시간 원문 확인에 실패해 최근 검증 데이터를 표시합니다.';
      }
    }
    refreshFromSources();

    document.getElementById('rampRequestForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const subject = `[경사로 설치 상담 요청] ${data.get('name')}`;
      const body = [
        `가게·시설 이름: ${data.get('name')}`,
        `주소: ${data.get('address')}`,
        `연락처: ${data.get('contact')}`,
        `신청자: ${data.get('role')}`,
        `필요한 경사로: ${data.get('rampType')}`,
        '',
        '입구 상황:',
        data.get('note') || '별도 기재 없음',
        '',
        '※ 입구 사진은 이 메일에 첨부해 주세요.',
      ].join('\n');
      document.getElementById('requestStatus').textContent = '메일 앱에 상담 내용을 준비했습니다. 입구 사진을 첨부한 뒤 보내기를 완료해 주세요.';
      location.href = `mailto:contact@muteokdaego.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();
