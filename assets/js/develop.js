/* ============ 무턱대고 — Develop layer (motion & interaction) ============ */
(() => {
  'use strict';

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- 로더 → 준비 완료 ---------- */
  function initLoader() {
    const loader = $('.loader');
    const ready = () => document.body.classList.add('is-ready');
    let seen = false;
    try { seen = sessionStorage.getItem('mtd-loaded') === '1'; } catch (e) {}
    if (!loader || RM || seen) { loader && loader.remove(); ready(); return; }
    const t0 = performance.now();
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      loader.classList.add('is-done');
      setTimeout(ready, 380);
      setTimeout(() => loader.classList.add('is-gone'), 1100);
      try { sessionStorage.setItem('mtd-loaded', '1'); } catch (e) {}
    };
    const go = () => setTimeout(finish, Math.max(0, 1500 - (performance.now() - t0)));
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    setTimeout(finish, 3500);
  }

  /* ---------- 포스터 제목: 글자 단위 분해 ---------- */
  function splitPoster() {
    const title = $('.poster-title, .st-title, .fx-title');
    if (!title) return;
    const label = title.textContent.replace(/\s+/g, ' ').trim();
    title.setAttribute('aria-label', label);
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) { n.remove(); return; }
          const frag = document.createDocumentFragment();
          [...n.textContent.replace(/\s+/g, ' ').trim()].forEach((c) => {
            const s = document.createElement('span');
            s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
            s.style.setProperty('--i', i++); s.textContent = c;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'IMG') walk(n);
      });
    };
    walk(title);
    // 두 "턱" 글자에 통통 튀는 루프
    $$('.ch', title).filter((c) => c.textContent === '턱').forEach((c) => c.classList.add('bump'));
  }

  /* ---------- 마키 채우기 ---------- */
  function initMarquees() {
    const poster = ['무턱대고', '턱을 없앱니다', 'ALL WHEELS WELCOME', '모든 바퀴를 환영합니다', 'MOO.BUMP', '경사로 설치 중'];
    const stores = (typeof STORES !== 'undefined' ? STORES.map((s) => s.name) : []);
    $$('[data-marquee]').forEach((el) => {
      const list = el.dataset.marquee === 'poster' ? poster : stores;
      if (!list.length) return;
      const half = list.map((t) => `<span>${t}</span>`).join('');
      el.innerHTML = half + half;
    });
  }

  /* ---------- 제목 단어 단위 마스크 리빌 ---------- */
  function initSplitHeadings() {
    const targets = $$('.section-title, .intro-title, .apply-cta h3, .why-title, .hm-voices-head h2, .sx-title');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.3 });
    targets.forEach((h) => {
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      let wi = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((tok) => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
              const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
              const inner = document.createElement('span'); inner.className = 'wi';
              inner.style.setProperty('--wi', wi++); inner.textContent = tok;
              w.appendChild(inner); frag.appendChild(w);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
        });
      };
      walk(h);
      h.classList.add('split');
      if (RM) h.classList.add('is-in'); else io.observe(h);
    });
  }

  /* ---------- 스크롤 진행바 + 내비 숨김 + 스토리 ---------- */
  function initScroll() {
    const nav = $('.nav');
    const poster = $('.poster');
    const story = $('.rstory');
    let last = window.scrollY, ticking = false;

    // 바퀴 스토리 요소
    const wheel = $('.rs-wheel'), ramp = $('.rs-ramp'), tag = $('.rs-tag'), tagText = tag && $('text', tag);
    const burst = $('.rs-burst'), spokes = $('.rs-spokes');
    const barP = $('.rstory-bar');

    const placeWheel = (p) => {
      if (!wheel) return;
      const a = clamp(p / 0.36);
      let x = 90 + easeOut(a) * (446 - 90);
      let shake = 0, rampS = 0;
      if (p >= 0.36 && p < 0.5) {
        const b = (p - 0.36) / 0.14;
        x = 446 - 30 * Math.sin(Math.PI * b) * (1 - b * 0.3);
        shake = Math.sin(b * Math.PI * 6) * (1 - b) * 4;
      }
      if (p >= 0.5) rampS = easeInOut(clamp((p - 0.5) / 0.14));
      const m = clamp((p - 0.64) / 0.36);
      if (m > 0) x = 446 + easeInOut(m) * (940 - 446);
      const t = clamp((x - 296) / 184);
      const yRamp = 260 - 64 * t;
      const y = lerp(262, yRamp, rampS) + (p >= 0.36 && p < 0.5 ? -Math.abs(shake) : 0);
      const rot = (x / 38) * (180 / Math.PI);
      wheel.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`);
      if (ramp) ramp.style.transform = `scaleX(${rampS})`;
      if (burst) burst.style.opacity = p >= 0.36 && p < 0.5 ? String(Math.sin(((p - 0.36) / 0.14) * Math.PI)) : '0';
      if (tag) {
        const ok = p >= 0.56;
        tag.classList.toggle('is-ok', ok);
        if (tagText) tagText.textContent = ok ? '경사로 ✓' : '턱 1칸';
        tag.setAttribute('transform', `translate(${shake.toFixed(1)} 0)`);
      }
      story.classList.toggle('is-open', p >= 0.52);
      if (barP) barP.style.setProperty('--rp', p.toFixed(3));
    };

    const frame = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      document.documentElement.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : 0);

      if (nav) {
        const goingDown = y > last + 4, goingUp = y < last - 4;
        if (y > 240 && goingDown) nav.classList.add('is-hidden');
        else if (goingUp || y <= 240) nav.classList.remove('is-hidden');
      }
      last = y;

      if (story && !RM) {
        const r = story.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - innerHeight));
        placeWheel(p);
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (story && RM) { placeWheel(1); }
    frame();
  }

  /* ---------- 마우스 패럴랙스(포스터) ---------- */
  function initParallax() {
    const poster = $('.poster');
    if (!poster || !FINE || RM) return;
    const items = $$('[data-depth]', poster);
    const sticker = $('.poster-sticker', poster);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      items.forEach((el) => { const d = Number(el.dataset.depth); el.style.translate = `${cx * d}px ${cy * d}px`; });
      if (sticker) { sticker.style.setProperty('--px', `${cx * 22}px`); sticker.style.setProperty('--py', `${cy * 18}px`); }
      raf = Math.abs(cx - tx) + Math.abs(cy - ty) > 0.001 ? requestAnimationFrame(loop) : null;
    };
    poster.addEventListener('pointermove', (e) => {
      const r = poster.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---------- 3D 틸트 + 스포트라이트 ---------- */
  function initTilt() {
    const els = $$('.why-card, .voice-card, .hero-media, .tl-card, .apply-hero-proof, .step-card, .poster-band');
    els.forEach((el) => {
      el.classList.add('tilt');
      setTimeout(() => el.classList.add('settled'), 2200);
      if (!FINE || RM) return;
      el.addEventListener('pointermove', (e) => {
        if (e.target.closest('.ba')) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); return; }
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const k = el.classList.contains('hero-media') ? 5 : 9;
        el.style.setProperty('--ry', `${((px - 0.5) * k).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - py) * k).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    // 인터뷰 카드는 렌더가 늦을 수 있어 한 번 더
  }

  /* ---------- 마그네틱 버튼 ---------- */
  function initMagnetic() {
    if (!FINE || RM) return;
    $$('.btn, .nav-cta, .footer-cta').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.25, y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- 커스텀 커서 ---------- */
  function initCursor() {
    const c = $('.cursor');
    if (!c || !FINE || RM) return;
    document.body.classList.add('has-cursor');
    const label = $('.cursor-label', c);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY; c.classList.add('is-on');
      const t = e.target;
      const drag = t.closest && t.closest('.ba');
      const link = !drag && t.closest && t.closest('a, button, .chip, input, select, textarea, [role="button"]');
      c.classList.toggle('is-drag', !!drag); c.classList.toggle('is-link', !!link);
      label.textContent = drag ? 'DRAG' : '';
    }, { passive: true });
    document.addEventListener('pointerdown', () => c.classList.add('is-down'));
    document.addEventListener('pointerup', () => c.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    const loop = () => {
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      c.style.left = `${cx}px`; c.style.top = `${cy}px`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- 전후 슬라이더: 처음 보일 때 스스로 한 번 훑어준다 ---------- */
  function initBADemo() {
    $$('.ba').forEach((ba) => {
      ba.addEventListener('pointerdown', () => ba.classList.add('is-touched'), { once: true });
    });
    if (RM) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const ba = e.target, range = $('.ba-range', ba);
      if (!range || ba.classList.contains('is-touched')) return;
      const t0 = performance.now(), dur = 1800;
      const step = (t) => {
        if (ba.classList.contains('is-touched')) return;
        const p = clamp((t - t0) / dur);
        const v = 50 + Math.sin(p * Math.PI * 2) * 32 * (1 - p * 0.4);
        range.value = v; range.dispatchEvent(new Event('input', { bubbles: true }));
        if (p < 1) requestAnimationFrame(step); else { range.value = 50; range.dispatchEvent(new Event('input', { bubbles: true })); }
      };
      setTimeout(() => requestAnimationFrame(step), 500);
    }), { threshold: 0.6 });
    $$('.ba').forEach((ba) => io.observe(ba));
  }

  /* ---------- 필터 전환 팝 ---------- */
  function initFilterPop() {
    $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
      requestAnimationFrame(() => {
        let n = 0;
        $$('.store-card:not(.is-hidden)').forEach((card) => {
          card.classList.remove('pop'); void card.offsetWidth;
          card.style.setProperty('--pi', n++); card.classList.add('pop');
          card.addEventListener('animationend', () => card.classList.remove('pop'), { once: true });
        });
      });
    }));
  }

  /* ---------- 카운터 보강: 숫자 렌더 후에도 + 기호 유지 ---------- */

  /* ---------- 이야기 페이지 ---------- */
  function initStory() {
    const ring = $('.st-ring');
    const goalTitle = $('.st-goal-title');
    const scene = $('.st-scene');
    if (!ring && !scene && !$('.jr')) return;

    if (ring) new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { ring.classList.add('is-in'); o.disconnect(); } }), { threshold: 0.4 }).observe(ring);

    if (scene && FINE && !RM) {
      const hero = $('.st-hero'), st = $('.st-stage', scene);
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        st.style.setProperty('--sry', `${(x * 26).toFixed(1)}deg`); st.style.setProperty('--srx', `${(-y * 14).toFixed(1)}deg`);
      });
    }

    /* --- 가로 스크롤 여정: 바퀴가 경사로를 타고 올라가며 이야기를 깨운다 --- */
    const jr = $('.jr');
    const J = {};
    const R = 38;
    if (jr && !RM) {
      J.sticky = $('.jr-sticky', jr); J.track = $('.jr-track', jr); J.road = $('.jr-road', jr);
      J.sts = $$('.jr-st', jr); J.wheel = $('.jr-wheel', jr); J.rot = $('.jr-wheel-rot', jr);
      J.clip = $('.jr-clip', jr); J.cur = $('.jr-cur', jr);
      const layout = () => {
        const vw = innerWidth, vh = Math.max(innerHeight, 560);
        const W = vw < 700 ? vw * 0.74 : Math.min(vw * 0.42, 460);
        const gap = W + Math.max(90, Math.min(vw * 0.1, 170));
        J.wheelX = vw < 700 ? vw * 0.2 : vw * 0.24;
        J.vw = vw; J.vh = vh;
        J.xs = J.wheelX + 20;                       // 경사 시작점
        const x0 = J.wheelX + 90;
        J.trackW = x0 + gap * (J.sts.length - 1) + (vw - J.wheelX) + 60;
        J.y0 = vh * 0.82; J.rise = vh * 0.34;
        J.slope = J.rise / (J.trackW - J.xs);
        J.yAt = (x) => (x <= J.xs ? J.y0 : J.y0 - (x - J.xs) * J.slope);
        J.sts.forEach((st, i) => {
          const x = x0 + gap * i;
          st.style.setProperty('--x', `${x}px`); st.style.setProperty('--y', `${J.yAt(x) - 10}px`); st.style.setProperty('--w', `${W}px`);
          st.dataset.x = x;
        });
        J.track.style.width = `${J.trackW}px`;
        J.road.setAttribute('width', J.trackW); J.road.setAttribute('height', vh);
        const pts = `0,${J.y0} ${J.xs},${J.y0} ${J.trackW},${J.yAt(J.trackW)}`;
        $$('polyline', J.road).forEach((p) => p.setAttribute('points', pts));
        $('.jr-ground', J.road).setAttribute('points', `${pts} ${J.trackW},${vh} 0,${vh}`);
        jr.style.height = `${J.trackW - vw + vh + 160}px`;
      };
      layout();
      window.addEventListener('resize', () => { layout(); on(); });
    }

    let tick = false;
    const frame = () => {
      tick = false;
      const vh = innerHeight;
      if (jr && !RM && J.trackW) {
        const r = jr.getBoundingClientRect();
        const dist = J.trackW - J.vw;
        const p = clamp(-r.top / (jr.offsetHeight - vh));
        const cam = p * dist;
        J.track.style.transform = `translate3d(${(-cam).toFixed(1)}px,0,0)`;
        const wx = cam + J.wheelX;
        const wy = J.yAt(wx) - R;
        J.wheel.style.transform = `translate3d(${J.wheelX.toFixed(1)}px,${wy.toFixed(1)}px,0)`;
        J.rot.setAttribute('transform', `rotate(${((wx / R) * 57.3).toFixed(1)})`);
        J.clip.setAttribute('width', Math.max(0, wx).toFixed(1));
        let n = 0;
        J.sts.forEach((st) => { const on = wx >= Number(st.dataset.x) - 30; st.classList.toggle('is-on', on); if (on) n++; });
        J.cur.textContent = String(Math.max(1, n)).padStart(2, '0');
        jr.style.setProperty('--jp', p.toFixed(3));
        jr.classList.toggle('is-moved', p > 0.04);
        $('.jr-meter em', jr).style.setProperty('--jp', p.toFixed(3));
      }
      if (goalTitle && !RM) {
        const g = goalTitle.getBoundingClientRect();
        const t = clamp((vh * 0.95 - g.top) / (vh * 0.5));
        goalTitle.style.setProperty('--grx', `${((1 - easeOut(t)) * 70).toFixed(1)}deg`);
      }
    };
    const on = () => { if (!tick) { tick = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on); frame();
  }

  /* ---------- 홈: 스크롤 연동 전후 비교 + 점주 인터뷰 ---------- */
  function initHomeStories() {
    const sec = $('#homeStory');
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    if (sec && typeof STORES !== 'undefined') {
      const order = ['honggane-kimbap', 'borim-pharmacy', 'lotto-1014'];
      const list = order.map((sl) => STORES.find((x) => x.slug === sl)).filter(Boolean);
      const N = list.length;
      const frame = $('#sxFrame'), frs = $('#sxFrs'), range = $('#sxRange'), info = $('#sxInfo'), ghost = $('#sxGhost'), dots = $('#sxDots'), handle = $('#sxHandle');
      const tagB = $('.sx-tag-b', frame), tagA = $('.sx-tag-a', frame);

      // 모든 가게를 미리 그려 두고(이미지 선로딩) 전환은 클래스만 바꾼다 → 끊김 없음
      frs.innerHTML = list.map((st) => {
        const stk = st.rampType === '이동식' ? 'sticker-portable-ramp.png' : 'sticker-all-wheels.png';
        return `<div class="sx-fr"><div class="sx-img sx-before"><img src="assets/img/stores/${st.slug}-before.jpg" alt="${esc(st.name)} 입구, ${esc(st.work)} 전" decoding="async"></div>
          <div class="sx-aw"><div class="sx-ai"><img src="assets/img/stores/${st.slug}-after.jpg" alt="${esc(st.name)} 입구, ${esc(st.work)} 후" decoding="async"></div></div>
          <img class="sx-sticker" src="assets/img/${stk}" alt="" width="120" height="95"></div>`;
      }).join('');
      info.innerHTML = list.map((st) => `
        <article class="sx-slide">
          <p class="sx-tags"><span>${esc(st.cat)}</span><span>${esc(st.rampType)} 경사로</span><span>${esc(st.date)}</span></p>
          <h3>${esc(st.name)}</h3>
          <p class="sx-story">${esc(st.story || st.desc)}</p>
          <div class="sx-ba">
            <div class="sx-card is-before"><p><i aria-hidden="true">✕</i>BEFORE</p><span>${esc(st.before)}</span></div>
            <div class="sx-card is-after"><p><i aria-hidden="true">✓</i>AFTER</p><span>${esc(st.after)}</span></div>
          </div>
          <a class="sx-more" href="store.html?id=${encodeURIComponent(st.slug)}" tabindex="-1">설치 기록 자세히 보기 <b aria-hidden="true">→</b></a>
        </article>`).join('');
      dots.innerHTML = list.map((st, i) => `<li><button type="button" data-i="${i}" aria-label="${esc(st.name)}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(st.name)}</span></button></li>`).join('');
      const FR = $$('.sx-fr', frs), SL = $$('.sx-slide', info), DB = $$('button', dots);
      const AW = FR.map((f) => $('.sx-aw', f)), AI = FR.map((f) => $('.sx-ai', f));

      let idx = -1, W = 1, pos = 50, manual = false, dragging = false;
      const measure = () => { W = frame.clientWidth || 1; };
      const apply = (v) => {
        pos = clamp(v, 0, 100);
        const px = (W * pos) / 100;
        if (idx >= 0) { AW[idx].style.transform = `translate3d(${px.toFixed(1)}px,0,0)`; AI[idx].style.transform = `translate3d(${(-px).toFixed(1)}px,0,0)`; }
        handle.style.transform = `translate3d(${px.toFixed(1)}px,0,0)`;
        const after = pos < 50;
        if (frame.classList.contains('is-after') !== after) { frame.classList.toggle('is-after', after); sec.classList.toggle('is-after', after); }
      };
      const show = (i) => {
        if (i === idx) return;
        const prev = idx; idx = i; manual = false;
        FR.forEach((f, k) => f.classList.toggle('is-cur', k === i));
        SL.forEach((s, k) => { s.classList.toggle('is-cur', k === i); s.classList.toggle('is-past', k < i); $('.sx-more', s).tabIndex = k === i ? 0 : -1; s.setAttribute('aria-hidden', String(k !== i)); });
        DB.forEach((b, k) => b.classList.toggle('is-on', k === i));
        const work = list[i].work || '설치'; tagB.textContent = `${work} 전`; tagA.textContent = `${work} 후`;
        ghost.textContent = String(i + 1).padStart(2, '0');
        if (prev >= 0) { AW[prev].style.transform = ''; AI[prev].style.transform = ''; }
        apply(pos);
      };

      // 직접 드래그 → 그 가게에서는 자동 스크럽 중단
      const fromEvent = (e) => { const r = frame.getBoundingClientRect(); const v = ((e.clientX - r.left) / r.width) * 100; range.value = v; apply(v); };
      frame.addEventListener('pointerdown', (e) => { dragging = manual = true; frame.classList.add('is-touched'); fromEvent(e); });
      window.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
      window.addEventListener('pointerup', () => { dragging = false; });
      range.addEventListener('input', () => { manual = true; apply(Number(range.value)); });

      const segment = () => Math.max(innerHeight * 0.66, 460);
      let top = 0, span = 1;
      const layout = () => {
        measure();
        if (!RM) sec.style.height = `${segment() * N + innerHeight}px`;
        top = sec.getBoundingClientRect().top + scrollY; span = Math.max(1, sec.offsetHeight - innerHeight);
        apply(pos);
      };
      dots.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const i = Number(b.dataset.i);
        if (RM) { show(i); apply(50); return; }
        window.scrollTo({ top: top + segment() * i + 6, behavior: 'smooth' });
      });

      // 부드러운 스크럽: 스크롤 값을 직접 쓰지 않고 rAF에서 보간
      let target = 0, cur = 0, live = false, raf = 0, frames = 0;
      const step = () => {
        raf = 0;
        if (++frames % 40 === 0) top = sec.getBoundingClientRect().top + scrollY;
        target = clamp((scrollY - top) / span) * N;
        cur += (target - cur) * 0.16; if (Math.abs(target - cur) < 0.0004) cur = target;
        const i = Math.min(N - 1, Math.max(0, Math.floor(cur + 1e-6))), t = Math.min(1, cur - i);
        show(i);
        if (!manual) {
          const sweep = easeInOut(clamp((t - 0.08) / 0.5)), settle = easeInOut(clamp((t - 0.62) / 0.24));
          apply(lerp(lerp(95, 5, sweep), 50, settle));
        }
        const enter = easeOut(clamp(t / 0.16)), leave = clamp((t - 0.9) / 0.1);
        frame.style.transform = `perspective(1400px) rotateY(${((1 - enter) * -14 + leave * 8).toFixed(2)}deg) translate3d(${((1 - enter) * 50 - leave * 30).toFixed(1)}px,0,0)`;
        if (live || Math.abs(target - cur) > 0.0004) raf = requestAnimationFrame(step);
      };
      const kick = () => { if (!raf && !RM) raf = requestAnimationFrame(step); };
      new IntersectionObserver((es) => { live = es[0].isIntersecting; if (live) kick(); }, { rootMargin: '10% 0px' }).observe(sec);
      window.addEventListener('scroll', kick, { passive: true });
      window.addEventListener('resize', () => { layout(); kick(); });
      window.addEventListener('load', () => { layout(); kick(); });
      if (RM) sec.classList.add('is-static');
      layout(); show(0); apply(50); kick();
    }

    // 점주 인터뷰
    const list = $('#hmVoices');
    if (list && typeof VOICES !== 'undefined') {
      list.innerHTML = VOICES.map((v, i) => `
        <li class="hm-voice tilt" style="--vi:${i}">
          <span class="hm-voice-mark" aria-hidden="true">“</span>
          <p class="hm-voice-before"><b>BEFORE</b>${esc(v.before)}</p>
          <blockquote>${esc(v.after)}</blockquote>
          <footer><strong>${esc(v.name)}</strong><span>${esc(v.place)} · ${esc(v.district)}</span></footer>
        </li>`).join('');
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.25 });
      $$('.hm-voice', list).forEach((el) => {
        if (RM) el.classList.add('is-in'); else io.observe(el);
        setTimeout(() => el.classList.add('settled'), 2600);
        if (!FINE || RM) return;
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ry', `${((px - 0.5) * 8).toFixed(2)}deg`); el.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
          el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        });
        el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
      });
    }
  }

  /* ---------- 신청 폼: 단계형 위저드 + 실시간 요청서 ---------- */
  function initRequestWizard() {
    const form = $('#rampRequestForm');
    if (!form || !$('.rq-step', form)) return;
    const steps = $$('.rq-step', form), dots = $$('.rq-steps li', form);
    const title = $('#rqTitle'), err = $('#rqError');
    const prev = $('.rq-prev', form), next = $('.rq-next', form), send = $('.rq-send', form);
    const consent = $('#requestConsent');
    let cur = 0;

    const show = (n, back) => {
      cur = n;
      steps.forEach((st, i) => { st.classList.toggle('is-active', i === n); st.classList.toggle('from-left', !!back && i === n); });
      dots.forEach((d, i) => { d.classList.toggle('is-active', i === n); d.classList.toggle('is-done', i < n); });
      form.style.setProperty('--rqp', String(n / (steps.length - 1)));
      title.textContent = steps[n].dataset.title;
      prev.hidden = n === 0; next.hidden = n === steps.length - 1; send.hidden = n !== steps.length - 1;
      err.hidden = true; sync();
      const f = $('input:not([type=radio]):not([type=checkbox]), textarea', steps[n]);
      if (f && FINE) setTimeout(() => f.focus({ preventScroll: true }), 350);
    };
    const sync = () => { send.disabled = !consent.checked; };
    const validate = (n) => {
      const bad = $$('input[required]:not([type=checkbox])', steps[n]).find((i) => !i.value.trim());
      $$('.rq-field', steps[n]).forEach((f) => f.classList.remove('is-bad'));
      if (bad) {
        bad.closest('.rq-field').classList.add('is-bad'); bad.focus();
        err.textContent = `${bad.labels?.[0]?.textContent.replace('*', '').trim() || '필수 항목'}을(를) 입력해 주세요.`; err.hidden = false;
        return false;
      }
      return true;
    };
    next.addEventListener('click', () => { if (validate(cur)) show(cur + 1); });
    prev.addEventListener('click', () => show(cur - 1, true));
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < steps.length - 1) { e.preventDefault(); next.click(); }
    });
    consent.addEventListener('change', sync);
    form.addEventListener('submit', (e) => { if (!consent.checked || !validate(0) || !validate(1)) e.stopImmediatePropagation(), e.preventDefault(); }, true);

    // 실시간 요청서
    const live = {};
    $$('[data-live]').forEach((el) => { live[el.dataset.live] = el; });
    const put = (key, val, fallback) => {
      const el = live[key]; if (!el) return;
      const text = (val || '').trim() || fallback; if (el.textContent === text) return;
      el.textContent = text; el.classList.toggle('is-empty', !(val || '').trim());
      el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
    };
    const refresh = (e) => {
      const t = e.target;
      if (['name', 'address', 'contact'].includes(t.name)) put(t.name, t.value, '입력 대기 중');
      if (['role', 'rampType'].includes(t.name) && t.checked) put(t.name, t.value, '');
    };
    form.addEventListener('input', refresh); form.addEventListener('change', refresh);
    $$('[data-live]').forEach((el) => { if (['name', 'address', 'contact'].includes(el.dataset.live)) el.classList.add('is-empty'); });
    show(0);
  }

  /* ---------- 지도 목록 행 순차 등장 ---------- */
  function initMapRows() {
    const list = $('#storeList');
    if (!list) return;
    new MutationObserver(() => $$('.store-row', list).forEach((r, i) => { if (!r.dataset.ri) { r.dataset.ri = '1'; r.style.setProperty('--ri', Math.min(i, 12)); } })).observe(list, { childList: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRequestWizard();
    initHomeStories();
    initMapRows();
    initStory();
    initLoader();
    splitPoster();
    initMarquees();
    initSplitHeadings();
    initScroll();
    initParallax();
    initTilt();
    initMagnetic();
    initCursor();
    initBADemo();
    initFilterPop();
  });
})();
