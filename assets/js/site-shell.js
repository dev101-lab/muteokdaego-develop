/* ============ 무턱대고 공통 헤더·푸터 ============ */

(() => {
  'use strict';

  const page = location.pathname.split('/').pop() || 'index.html';
  const onApplyPage = page === 'apply.html';
  const applyHref = onApplyPage ? '#request' : 'apply.html';

  const headerSlot = document.querySelector('[data-site-header]');
  if (headerSlot) {
    const header = document.createElement('header');
    header.className = 'nav';
    if (document.body.classList.contains('home')) header.id = 'top';
    header.innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="index.html" aria-label="무턱대고 홈으로">
          <svg class="brand-mark" viewBox="0 0 28 20" aria-hidden="true"><path d="M1 19 L27 3 L27 19 Z"/></svg>
          <span class="brand-name">무턱대고</span>
          <span class="brand-sub">Moo.Bump</span>
        </a>
        <nav class="nav-links" aria-label="주요 메뉴">
          <a href="story.html">이야기</a>
          <a href="map.html">지도</a>
          <a href="media.html">미디어</a>
          <a class="nav-cta" href="${applyHref}">경사로 신청</a>
        </nav>
      </div>`;
    headerSlot.replaceWith(header);
  }

  const footerSlot = document.querySelector('[data-site-footer]');
  if (footerSlot) {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-brand">
          <a class="brand" href="index.html">
            <svg class="brand-mark" viewBox="0 0 28 20" aria-hidden="true"><path d="M1 19 L27 3 L27 19 Z"/></svg>
            <span class="brand-name">무턱대고</span><span class="brand-sub">Moo.Bump</span>
          </a>
          <p class="footer-slogan">무턱대고 턱을 없앱니다</p>
          <p>작은 경사로 하나가 누군가의 하루를 바꿉니다.<br>청년 사회혁신 팀 무턱대고입니다.</p>
        </div>
        <nav class="footer-links" aria-label="푸터 메뉴">
          <h3>바로가기</h3>
          <a href="story.html">무턱대고 이야기</a>
          <a href="map.html">경사로 지도</a>
          <a href="media.html">미디어</a>
          <a href="apply.html">경사로 신청</a>
        </nav>
        <div class="footer-join">
          <h3>함께해요</h3>
          <p>경사로가 필요한 공간을 알고 계신가요?</p>
          <a class="footer-cta" href="${applyHref}">경사로 신청하기 →</a>
        </div>
      </div>
      <p class="footer-copy">© 2026 무턱대고. All rights reserved.</p>`;
    footerSlot.replaceWith(footer);
  }
})();
