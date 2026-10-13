/* VoidSailors: the free chapter reader. Lays the chapter out as book pages and turns them. */
(() => {
  "use strict";

  const reader = document.getElementById("reader");
  const chapter = document.getElementById("chapter");
  if (!reader || !chapter || !Element.prototype.animate) return; // the chapter stays a plain page

  const book = reader.querySelector(".book");
  const slotL = book.querySelector(".book__slot--l");
  const slotR = book.querySelector(".book__slot--r");
  const fill = reader.querySelector(".reader__fill");
  const count = reader.querySelector(".reader__count");
  const nudge = reader.querySelector(".reader__nudge");
  const prevBtn = reader.querySelector('[data-turn="-1"]');
  const nextBtn = reader.querySelector('[data-turn="1"]');
  const paperBtn = reader.querySelector("[data-paper]");
  const sizeBtns = reader.querySelectorAll("[data-size]");
  const resumeBtn = document.querySelector("[data-sample-resume]");
  const TITLE = chapter.querySelector(".chapter__title").textContent.trim();
  const END = chapter.querySelector(".chapter__end").innerHTML;
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  const blocks = [...chapter.querySelectorAll(".chapter__text > p")].map((p) => ({
    cls: p.className,
    text: p.textContent.trim(),
    words: p.textContent.trim().split(/\s+/),
    sys: p.classList.contains("sys"),
  }));

  const SIZES = [16, 17, 18, 19, 20, 22, 24];
  let sizeIx = parseInt(store.get("vs-sample-size"), 10);
  if (!(sizeIx >= 0 && sizeIx < SIZES.length)) sizeIx = innerWidth >= 960 ? 3 : 2;
  let paper = store.get("vs-sample-paper") === "1";
  let pages = [];
  let cur = 0;
  let spread = false;
  let busy = false;
  let size = { w: 0, h: 0 };

  /* ---------- Building pages ---------- */
  const cmp = (a, b) => (a.b - b.b) || (a.w - b.w);

  function blankPage(side) {
    const el = document.createElement("div");
    el.className = "page" + (side ? " page--" + side : "");
    el.innerHTML = '<div class="page__head"></div><div class="page__text"></div><div class="page__folio"></div>';
    return el;
  }

  function opener() {
    const o = document.createElement("div");
    o.className = "page__opener";
    o.innerHTML = '<p class="eyebrow">VoidSailors &middot; A Free Chapter</p><h2></h2>';
    o.querySelector("h2").textContent = TITLE;
    return o;
  }

  function para(item) {
    const blk = blocks[item.b];
    const p = document.createElement("p");
    if (blk.cls) p.className = blk.cls;
    const text = blk.words.slice(item.from, item.to).join(" ");
    if (blk.cls.includes("sys--plate")) {
      const s = document.createElement("span");
      s.textContent = text;
      p.append(s);
    } else {
      p.textContent = text;
    }
    if (item.from > 0) p.classList.add("is-cont");
    if (item.b === 0 && item.from === 0) p.classList.add("is-first");
    return p;
  }

  function paginate() {
    const probe = blankPage("r");
    probe.style.visibility = "hidden";
    slotL.append(probe);
    const text = probe.querySelector(".page__text");
    const fits = () => text.scrollHeight <= text.clientHeight + 1;

    pages = [];
    let b = 0;
    let w = 0;
    while (b < blocks.length) {
      const page = { start: { b, w }, items: [], opener: pages.length === 0 };
      text.replaceChildren();
      if (page.opener) text.append(opener());
      while (b < blocks.length) {
        const blk = blocks[b];
        const item = { b, from: w, to: blk.words.length };
        const p = para(item);
        text.append(p);
        if (fits()) { page.items.push(item); b++; w = 0; continue; }

        // Too long: keep as many words as fit, at least a line's worth, and carry the rest over.
        let best = w;
        if (!blk.sys) {
          let lo = w + 1;
          let hi = blk.words.length - 1;
          while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            p.textContent = blk.words.slice(w, mid).join(" ");
            if (fits()) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
          }
        }
        if (best - w >= 4) {
          page.items.push({ b, from: w, to: best });
          w = best;
        } else {
          p.remove();
          if (!page.items.length) { page.items.push(item); b++; w = 0; } // never loop on an oversize line
        }
        break;
      }
      pages.push(page);
    }
    pages.push({ end: true, start: { b: blocks.length, w: 0 } });
    probe.remove();
  }

  function render(i, side) {
    const el = blankPage(side);
    const pg = pages[i];
    const text = el.querySelector(".page__text");
    if (!pg) { text.remove(); return el; }
    if (pg.end) {
      el.classList.add("page--end");
      text.innerHTML = '<div class="page__endbox"><img class="launch__cover" src="assets/img/web/cover-320.webp" width="320" height="476" alt="" decoding="async">' + END + "</div>";
      return el;
    }
    if (!pg.opener) el.querySelector(".page__head").textContent = i % 2 ? TITLE : "VoidSailors";
    el.querySelector(".page__folio").textContent = i + 1;
    if (pg.opener) text.append(opener());
    pg.items.forEach((it) => text.append(para(it)));
    return el;
  }

  /* ---------- Showing and turning ---------- */
  const step = () => (spread ? 2 : 1);
  const last = () => (spread ? (pages.length - 1) - ((pages.length - 1) % 2) : pages.length - 1);

  function show(i) {
    slotL.replaceChildren(render(i, spread ? "l" : ""));
    slotR.replaceChildren(spread ? render(i + 1, "r") : "");
  }

  function update() {
    const textPages = pages.length - 1;
    const seen = Math.min(cur + step(), pages.length);
    const atEnd = seen >= pages.length;
    fill.style.width = (Math.min(seen, textPages) / textPages) * 100 + "%";
    if (pages[cur].end) count.textContent = "End of the free chapter";
    else if (spread && cur + 1 < textPages) count.textContent = `Pages ${cur + 1}–${cur + 2} of ${textPages}`;
    else count.textContent = `Page ${cur + 1} of ${textPages}`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur >= last();
    nudge.hidden = atEnd || seen / textPages < 0.6;
    store.set("vs-sample-pos", JSON.stringify(pages[Math.min(cur, textPages - 1)].start));
  }

  function leaf(front, back, side) {
    const el = document.createElement("div");
    el.className = "leaf";
    el.style[side === "l" ? "left" : "right"] = "0";
    const faces = [front, back].map((page, k) => {
      const face = document.createElement("div");
      face.className = "leaf__face" + (k ? " leaf__face--back" : "");
      const shade = document.createElement("div");
      shade.className = "leaf__shade";
      shade.style.background = `linear-gradient(${k ? "to right" : "to left"}, rgba(0,0,0,.34), rgba(0,0,0,.06) 70%)`;
      if (page) face.append(page, shade);
      el.append(face);
      return shade;
    });
    book.append(el);
    return { el, faces };
  }

  const play = (el, frames, ms, origin) => {
    if (origin) el.style.transformOrigin = origin;
    return el.animate(frames, { duration: ms, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" }).finished;
  };

  async function turn(dir) {
    const t = cur + dir * step();
    if (busy || t < 0 || t > last()) return;
    busy = true;
    if (calm.matches) {
      show(t);
      await Promise.all([slotL, slotR].map((s) => s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 }).finished));
    } else if (spread) {
      const fwd = dir > 0;
      const l = fwd
        ? leaf(render(cur + 1, "r"), render(t, "l"), "r")
        : leaf(render(cur, "l"), render(t + 1, "r"), "l");
      if (fwd) slotR.replaceChildren(render(t + 1, "r"));
      else slotL.replaceChildren(render(t, "l"));
      const ms = 760;
      await Promise.all([
        play(l.el, [{ transform: "rotateY(0deg)" }, { transform: `rotateY(${fwd ? -180 : 180}deg)` }], ms, fwd ? "left center" : "right center"),
        play(l.faces[0], [{ opacity: 0 }, { opacity: 1 }], ms / 2),
        play(l.faces[1], [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], ms),
      ]);
      show(t);
      l.el.remove();
    } else {
      const fwd = dir > 0;
      const l = leaf(render(fwd ? cur : t, ""), null, "l");
      if (fwd) slotL.replaceChildren(render(t, ""));
      const away = [{ transform: "rotateY(0deg)", opacity: 1 }, { transform: "rotateY(-62deg)", opacity: 1, offset: 0.6 }, { transform: "rotateY(-96deg)", opacity: 0 }];
      const ms = 520;
      await Promise.all([
        play(l.el, fwd ? away : away.slice().reverse(), ms, "left center"),
        play(l.faces[0], fwd ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], ms),
      ]);
      show(t);
      l.el.remove();
    }
    cur = t;
    update();
    busy = false;
  }

  function goTo(pos) {
    let i = 0;
    pages.forEach((pg, k) => { if (!pg.end && cmp(pg.start, pos) <= 0) i = k; });
    if (pos.b >= blocks.length) i = pages.length - 1;
    cur = Math.min(i - (spread ? i % 2 : 0), last());
    show(cur);
    update();
  }

  /* ---------- Sizing ---------- */
  function layout() {
    const keep = pages.length ? pages[Math.min(cur, pages.length - 2)].start : { b: 0, w: 0 };
    const vw = document.documentElement.clientWidth;
    const vh = innerHeight;
    size = { w: vw, h: vh };
    spread = vw >= 960 && vh >= 620;
    // Phones give every spare pixel to the page; the nudge line can sit below the fold there.
    const phone = !spread && vw < 600;
    // Header room (the page's scroll padding), the bar, the page controls, the reader's gaps and padding, and room for the nudge line.
    const rs = getComputedStyle(reader);
    const top = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 76) + (parseFloat(rs.scrollMarginTop) || 0);
    const chrome = top + parseFloat(rs.paddingTop) + reader.querySelector(".reader__bar").offsetHeight + reader.querySelector(".reader__nav").offsetHeight
      + 2 * (parseFloat(rs.rowGap) || 13) + parseFloat(rs.paddingBottom) + (phone ? 0 : 37);
    const bh = Math.round(Math.max(phone ? 340 : 420, Math.min(vh - chrome, spread ? 860 : 900)));
    const bw = Math.round(spread ? Math.min(vw - 64, 1180, bh * 1.5) : Math.min(vw - 32, 600));
    const pw = spread ? bw / 2 : bw;
    reader.style.setProperty("--bw", bw + "px");
    reader.style.setProperty("--bh", bh + "px");
    reader.style.setProperty("--pw", pw + "px");
    reader.style.setProperty("--pad", Math.round(Math.max(18, Math.min(56, pw * (phone ? 0.06 : 0.09)))) + "px");
    reader.style.setProperty("--fs", SIZES[sizeIx] + "px");
    book.classList.toggle("is-spread", spread);
    book.classList.toggle("is-short", bh < 560);
    sizeBtns[0].disabled = sizeIx === 0;
    sizeBtns[1].disabled = sizeIx === SIZES.length - 1;
    paginate();
    goTo(keep);
  }

  function savedPos() {
    try { const p = JSON.parse(store.get("vs-sample-pos")); return p && p.b >= 0 ? p : null; } catch (e) { return null; }
  }

  /* ---------- Controls ---------- */
  prevBtn.addEventListener("click", () => turn(-1));
  nextBtn.addEventListener("click", () => turn(1));

  sizeBtns.forEach((btn) => btn.addEventListener("click", () => {
    const n = sizeIx + Number(btn.dataset.size);
    if (n < 0 || n >= SIZES.length) return;
    sizeIx = n;
    store.set("vs-sample-size", String(n));
    layout();
  }));

  function setPaper(on) {
    paper = on;
    reader.classList.toggle("is-paper", on);
    paperBtn.setAttribute("aria-pressed", String(on));
    store.set("vs-sample-paper", on ? "1" : "0");
  }
  // The fade runs only on a tap (not on page load), and taps wait for it to finish, so quick repeats can't flicker.
  let fading = 0;
  paperBtn.addEventListener("click", () => {
    if (fading) return;
    reader.classList.add("is-fading");
    setPaper(!paper);
    fading = setTimeout(() => { reader.classList.remove("is-fading"); fading = 0; }, 750);
  });

  // Swipe, or tap the right or left half of the book.
  let x0 = null;
  let y0 = 0;
  let swiped = false;
  book.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; });
  book.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; turn(dx < 0 ? 1 : -1); }
  });
  book.addEventListener("click", (e) => {
    if (swiped) { swiped = false; return; }
    if (e.target.closest("a, button")) return;
    const r = book.getBoundingClientRect();
    turn(e.clientX - r.left > r.width / 2 ? 1 : -1);
  });

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, textarea, select, dialog")) return;
    const r = reader.getBoundingClientRect();
    if (r.top > innerHeight / 2 || r.bottom < innerHeight / 2) return; // only while the book is on screen
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); turn(1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); turn(-1); }
  });

  const open = (pos) => (e) => {
    e.preventDefault();
    goTo(pos());
    reader.scrollIntoView({ behavior: calm.matches ? "auto" : "smooth" });
    nextBtn.focus({ preventScroll: true });
  };
  document.querySelectorAll("[data-sample-start]").forEach((a) => a.addEventListener("click", open(() => ({ b: 0, w: 0 }))));
  if (resumeBtn) resumeBtn.addEventListener("click", open(() => savedPos() || { b: 0, w: 0 }));

  let timer = 0;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // Phones resize the height as the address bar slides; only a real change re-lays the pages.
      if (document.documentElement.clientWidth !== size.w || Math.abs(innerHeight - size.h) > 60) layout();
    }, 180);
  });

  /* ---------- Start ---------- */
  reader.hidden = false;
  setPaper(paper);
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const saved = savedPos(); // read before layout() records page one
  fonts.then(() => {
    layout();
    if (saved && resumeBtn && (saved.b > 0 || saved.w > 0)) {
      let i = 0;
      pages.forEach((pg, k) => { if (!pg.end && cmp(pg.start, saved) <= 0) i = k; });
      resumeBtn.querySelector("span").textContent = i + 1;
      resumeBtn.hidden = false;
      store.set("vs-sample-pos", JSON.stringify(saved)); // layout() above recorded page one; keep the real place
    }
  });
})();
