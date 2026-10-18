/* VoidSailors — shared behaviour: theme, navigation, the living sky, reveals, trailer. */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme ----------
     vs-theme is what the page wears now. vs-earned is the faction colour won at the Gate,
     kept apart so the faction button can borrow the screen and hand it back untouched. */
  const THEME_KEY = "vs-theme";
  const EARNED_KEY = "vs-earned";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };
  // Sailors who earned colours before vs-earned existed keep them.
  const FACTION_THEMES = ["pirates", "cats", "nomads", "socialists-earned"];
  if (!store.get(EARNED_KEY) && FACTION_THEMES.includes(store.get(THEME_KEY))) store.set(EARNED_KEY, store.get(THEME_KEY));
  /* The faction button cycles through manual picks: ☭ Socialists, boot Nomads, skull Pirates, cat C.A.T.s,
     then back to the earned colours (or the default Void). Manual picks are softer cousins of the
     earned palettes; the icon turns yellow only while earned colours are on screen. */
  const CYCLE = ["socialists", "nomads-pick", "pirates-pick", "cats-pick"];
  // The default Void flies a plain flag: a ship's "colours" are both its faction and its palette.
  const ICONS = {
    void: "\u2691",
    socialists: "\u262D", "socialists-earned": "\u262D",
    "nomads-pick": "\u{1F462}", nomads: "\u{1F462}",
    "pirates-pick": "\u2620\uFE0E", pirates: "\u2620\uFE0E",
    "cats-pick": "\u{1F408}", cats: "\u{1F408}",
  };
  const LABELS = { socialists: "Socialists", "nomads-pick": "Nomads", "pirates-pick": "Pirates", "cats-pick": "C.A.T.s" };
  const toggles = document.querySelectorAll("[data-theme-toggle]");
  const earnedTheme = () => store.get(EARNED_KEY);
  const nextTheme = () => {
    const i = CYCLE.indexOf(root.dataset.theme);
    return i === -1 ? CYCLE[0] : CYCLE[i + 1] || earnedTheme() || null;
  };
  // Glyphs come from different fonts (☭ and ☠ from text fonts, the boot and cat from the emoji font),
  // so measure each one's drawn size and scale it to the same 18px box.
  const measure = document.createElement("canvas").getContext("2d");
  const fitIcon = (icon) => {
    if (!measure || !measure.measureText) return;
    const cs = getComputedStyle(icon);
    measure.font = `${cs.fontSize} ${cs.fontFamily}`;
    const m = measure.measureText(icon.textContent);
    const w = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
    const h = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
    const size = Math.max(w, h);
    icon.style.setProperty("--fit", size > 0 ? Math.min(2, 18 / size).toFixed(3) : 1);
  };
  const syncToggles = () => {
    const current = root.dataset.theme || "";
    const earned = !!current && current === earnedTheme();
    const manual = CYCLE.includes(current);
    const next = nextTheme();
    const label = `Faction colors: ${manual ? LABELS[current] : earned ? "earned" : "default"}. Next: ${LABELS[next] || (earnedTheme() ? "your earned colors" : "default")}`;
    toggles.forEach((b) => {
      const icon = b.querySelector(".theme-toggle__icon");
      icon.textContent = ICONS[current] || ICONS.void;
      fitIcon(icon);
      b.dataset.mode = earned ? "earned" : manual ? "manual" : "";
      b.setAttribute("aria-label", label);
      b.title = label;
    });
  };
  const setTheme = (name, opts = {}) => {
    if (name && name !== "void") root.dataset.theme = name;
    else delete root.dataset.theme;
    store.set(THEME_KEY, name && name !== "void" ? name : null);
    if (opts.earned) store.set(EARNED_KEY, name);
    syncToggles();
    document.dispatchEvent(new CustomEvent("vs:theme"));
  };
  window.VoidSailors = { setTheme, earnedTheme };
  toggles.forEach((b) => b.addEventListener("click", () => setTheme(nextTheme())));
  document.addEventListener("vs:theme", syncToggles); // the Gate previews colours without saving them
  syncToggles();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncToggles);

  /* ---------- Home-screen app ----------
     Opened from the VoidSailors icon, every page runs inside the app with no browser bar,
     so the nav bar gets a round button back to the card (the app's home). */
  const inApp = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const brandLink = document.querySelector(".nav .brand");
  if (inApp) root.classList.add("is-app");
  if (inApp && brandLink && !document.body.classList.contains("card-page")) {
    const lead = document.createElement("span");
    lead.className = "app-lead";
    const back = document.createElement("a");
    back.className = "icon-btn app-back";
    back.href = "/card.html";
    back.setAttribute("aria-label", "Back to the VoidSailors card");
    back.title = "Back to the card";
    back.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    brandLink.replaceWith(lead);
    lead.append(back, brandLink);
  }

  /* ---------- Header + mobile menu ---------- */
  // Up button: shown once the visitor is a screen and a half down.
  const up = document.createElement("button");
  up.type = "button";
  up.className = "icon-btn to-top";
  up.setAttribute("aria-label", "Back to top");
  up.title = "Back to top";
  up.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  up.addEventListener("click", () => { window.scrollTo({ top: 0 }); document.querySelector(".brand")?.focus({ preventScroll: true }); });
  document.body.appendChild(up);
  const header = document.querySelector(".header");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 21);
    up.classList.toggle("is-shown", window.scrollY > window.innerHeight * 1.5);
  };
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

  /* ---------- Amazon links (book page button, home page cover, sample's last page) ----------
     Launch day: paste the Amazon URL here. Until then the links open the "coming soon" window.
     Clicks are delegated so links drawn later (the sample reader's pages) behave the same. */
  const STORE_URL = "";
  const launch = document.getElementById("launch");
  const toStore = (link) => { link.href = STORE_URL; link.target = "_blank"; link.rel = "noopener"; };
  if (STORE_URL) document.querySelectorAll("[data-launch-open]").forEach(toStore);
  document.addEventListener("click", (e) => {
    const link = e.target.closest && e.target.closest("[data-launch-open]");
    if (!link) return;
    if (STORE_URL) { toStore(link); return; }
    if (!launch || typeof launch.showModal !== "function") return; // falls back to the newsletter section
    e.preventDefault();
    launch.showModal();
  });
  if (launch) {
    launch.querySelector("[data-close]").addEventListener("click", () => launch.close());
    launch.addEventListener("click", (e) => { if (e.target === launch) launch.close(); });
  }

  /* ---------- Join the Crew window ----------
     The header's Join the Crew button and mail icon open this signup window instead of scrolling
     down the page. It is built here once so every page has it; without JavaScript the links still go to #crew. */
  const crewPop = document.createElement("dialog");
  crewPop.className = "trial launch";
  crewPop.id = "crew-pop";
  crewPop.setAttribute("aria-labelledby", "crew-pop-title");
  crewPop.innerHTML = `
    <button class="icon-btn trial__close" type="button" data-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <p class="eyebrow">Join the Crew</p>
    <h2 class="trial__title" id="crew-pop-title">Mailing in a Bottle</h2>
    <p class="trial__rule">One email when launch day is set, plus cover reveals and news from the Void. No spam, and you can unsubscribe anytime.</p>
    <form class="crew-form" data-endpoint="" data-field="email" method="post" novalidate>
      <label class="sr-only" for="crew-pop-email">Email address</label>
      <input id="crew-pop-email" type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
      <input class="sr-only" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn--primary" type="submit">Sign On</button>
      <p class="crew-form__note">You must be 13 or older to subscribe. See our <a href="/privacy.html">Privacy Policy</a>.</p>
      <p class="crew-form__status" role="status" aria-live="polite"></p>
    </form>
    <p class="crew-pop__or">Or follow the voyage</p>
    <ul class="round-socials">
      <li><a href="https://www.instagram.com/ejperry_author/" target="_blank" rel="noopener" aria-label="E. J. Perry on Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3"/></svg></a></li>
      <li><a href="https://www.tiktok.com/@ejperry_author" target="_blank" rel="noopener" aria-label="E. J. Perry on TikTok" title="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3c.4 2.3 1.9 3.8 4 4v3c-1.5 0-2.9-.5-4-1.3V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z"/></svg></a></li>
      <li><a href="https://www.youtube.com/@voidsailors" target="_blank" rel="noopener" aria-label="VoidSailors on YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"/><path class="round-socials__play" d="M10 9l5 3-5 3z"/></svg></a></li>
    </ul>`;
  if (typeof crewPop.showModal === "function") {
    document.body.append(crewPop);
    crewPop.querySelector("[data-close]").addEventListener("click", () => crewPop.close());
    crewPop.addEventListener("click", (e) => { if (e.target === crewPop) crewPop.close(); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest || !e.target.closest("[data-crew-open]")) return;
      e.preventDefault();
      crewPop.showModal();
    });
  }

  /* ---------- Join the Crew mailing list ----------
     Every signup form sends the address straight to the Sender.net form "Join the Crew" (bo2xAA), the
     same address Sender's own embed posts to, so the site keeps its design and loads no Sender script.
     Sender then emails the double opt-in confirmation; the welcome email follows once the reader confirms.
     A form's own data-endpoint wins if set; with MAIL_ENDPOINT empty, nothing leaves the browser. */
  const MAIL_ENDPOINT = "https://stats.sender.net/forms/bo2xAA/subscribe";
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
      const endpoint = form.dataset.endpoint || MAIL_ENDPOINT;
      if (!endpoint) {
        status.textContent = "Mailing in a Bottle opens soon. Until then, catch the news on the socials.";
        return;
      }
      const body = JSON.stringify({ [form.dataset.field || "email"]: email.value.trim(), url: location.href, site_visit: true });
      const button = form.querySelector('button[type="submit"]');
      status.textContent = "Sending…";
      button.disabled = true;
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (!res.ok) throw new Error(`Sender answered ${res.status}`);
        status.textContent = "Welcome aboard. Look for our confirmation email in your inbox (or junk folder, just in case), then tap Set Sail to receive the first bottle.";
        form.reset();
      } catch (err) {
        status.textContent = "That didn’t go through. Please try again.";
      } finally {
        button.disabled = false;
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
