/* VoidSailors — shared behaviour: theme, navigation, the living sky, reveals, trailer. */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme (☭ = Socialist crimson) ----------
     vs-theme is what the page wears now. vs-earned is the faction colour won at the Gate,
     kept apart so the ☭ toggle can borrow the screen and hand it back untouched. */
  const THEME_KEY = "vs-theme";
  const EARNED_KEY = "vs-earned";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };
  // Sailors who earned colours before vs-earned existed keep them.
  const FACTION_THEMES = ["pirates", "cats", "nomads", "socialists-earned"];
  if (!store.get(EARNED_KEY) && FACTION_THEMES.includes(store.get(THEME_KEY))) store.set(EARNED_KEY, store.get(THEME_KEY));
  const toggles = document.querySelectorAll("[data-theme-toggle]");
  const syncToggles = () => {
    const on = root.dataset.theme === "socialists";
    toggles.forEach((b) => b.setAttribute("aria-pressed", String(on)));
  };
  const setTheme = (name, opts = {}) => {
    if (name && name !== "void") root.dataset.theme = name;
    else delete root.dataset.theme;
    store.set(THEME_KEY, name && name !== "void" ? name : null);
    if (opts.earned) store.set(EARNED_KEY, name);
    syncToggles();
    document.dispatchEvent(new CustomEvent("vs:theme"));
  };
  const earnedTheme = () => store.get(EARNED_KEY);
  window.VoidSailors = { setTheme, earnedTheme };
  toggles.forEach((b) => b.addEventListener("click", () => {
    setTheme(root.dataset.theme === "socialists" ? earnedTheme() : "socialists");
  }));
  syncToggles();

  /* ---------- Header + mobile menu ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 21);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const navToggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");
  if (navToggle && menu) {
    const close = () => { menu.classList.remove("is-open"); navToggle.setAttribute("aria-expanded", "false"); };
    navToggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Trailer: load the file only on click ---------- */
  document.querySelectorAll("[data-trailer]").forEach((box) => {
    const btn = box.querySelector(".trailer__play");
    btn.addEventListener("click", () => {
      const v = document.createElement("video");
      v.src = box.dataset.trailer;
      v.controls = true;
      v.playsInline = true;
      v.setAttribute("aria-label", btn.getAttribute("aria-label") || "Trailer");
      box.replaceChildren(v);
      v.play().catch(() => {});
      v.focus();
    });
  });

  /* ---------- Join the Crew mailing list ----------
     Set data-endpoint on the form to a provider's form URL to switch it on.
     Until then nothing leaves the browser. */
  document.querySelectorAll(".crew-form").forEach((form) => {
    const status = form.querySelector(".crew-form__status");
    const email = form.querySelector('input[type="email"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // bot trap
      if (!email.checkValidity()) {
        status.textContent = "Please enter a valid email address.";
        email.focus();
        return;
      }
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        status.textContent = "Mailing in a Bottle opens soon. Until then, catch the news on the socials.";
        return;
      }
      const body = new FormData();
      body.append(form.dataset.field || "email", email.value.trim());
      status.textContent = "Sending…";
      try {
        await fetch(endpoint, { method: "POST", body, mode: "no-cors" });
        status.textContent = "Welcome aboard. Your first bottle is on its way, so check your inbox to confirm.";
        form.reset();
      } catch (err) {
        status.textContent = "That didn’t go through. Please try again.";
      }
    });
  });

  /* ---------- Stars that blink ---------- */
  const canvas = document.querySelector(".sky canvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  let stars = [], w = 0, h = 0, dpr = 1, raf = 0, last = 0, color = "238, 242, 248";

  const readColor = () => { color = getComputedStyle(root).getPropertyValue("--star").trim() || color; };
  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(160, Math.max(60, (w * h) / 9000)));
    stars = Array.from({ length: count }, () => {
      const blinker = Math.random() < 0.05;
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.82,
        r: Math.random() < 0.08 ? 1.6 : Math.random() < 0.4 ? 1.05 : 0.7,
        base: 0.3 + Math.random() * 0.35,
        period: blinker ? 12000 + Math.random() * 8000 : 4000 + Math.random() * 5000,
        phase: Math.random() * Math.PI * 2,
        blinker,
      };
    });
  };
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      let a;
      if (s.blinker) {
        // Mostly steady, then one sharp blink per cycle.
        const p = ((t / s.period) + s.phase) % 1;
        a = p < 0.04 ? 1 - Math.sin((p / 0.04) * Math.PI) * 0.9 : 0.85;
      } else {
        a = s.base + (1 - s.base) * (0.5 + 0.5 * Math.sin((t / s.period) * Math.PI * 2 + s.phase));
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${color})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.5) {
        ctx.globalAlpha = a * 0.18;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return; // ~30 fps is plenty for a slow twinkle
    last = t;
    draw(t);
  };
  const start = () => { cancelAnimationFrame(raf); if (reduceMotion.matches) draw(0); else raf = requestAnimationFrame(loop); };

  readColor(); build(); start();
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { build(); start(); }, 200); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
  document.addEventListener("vs:theme", () => { readColor(); if (reduceMotion.matches) draw(0); });
  reduceMotion.addEventListener && reduceMotion.addEventListener("change", start);
})();
