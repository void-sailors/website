/* Triage by the Gate: seven questions, four factions, scored in the browser. */
(() => {
  const FACTIONS = {
    pirates: {
      name: "Pirates", theme: "pirates", crest: "assets/img/web/crest-pirates-480.webp",
      motto: "Independence · Freedom",
      creed: "You sail for the crew beside you and answer to no flag but your own.",
    },
    cats: {
      name: "C.A.T.s", theme: "cats", crest: "assets/img/web/crest-cats-480.webp",
      motto: "Corporate Alliance of Trade",
      creed: "To you, every contract is an opportunity, not an obligation.",
    },
    socialists: {
      name: "Socialists", theme: "socialists-earned", crest: "assets/img/web/crest-socialists-480.webp",
      motto: "Direction · Unity · Efficiency",
      creed: "One fleet, one heading. No ship gets left behind while you hold a station.",
    },
    nomads: {
      name: "Nomads", theme: "nomads", crest: "assets/img/web/crest-nomads-480.webp",
      motto: "Every man for himself",
      creed: "No banner, no debt, no master. You drift wherever the wind pays best.",
    },
  };

  // Each answer is weighted toward exactly one faction. Order is shuffled per question.
  const QUESTIONS = [
    { q: "The portal opens on a broken shore. What do you reach for first?", a: [
      ["pirates", "A crew who will follow me anywhere"],
      ["cats", "A ledger, and whoever owns the dock"],
      ["socialists", "The nearest group, and a plan for all of us"],
      ["nomads", "The way out, alone"],
    ] },
    { q: "Your hold can carry one more crate. Which do you load?", a: [
      ["pirates", "Cannonballs. Freedom needs ammunition"],
      ["cats", "Trade goods I can sell at double"],
      ["socialists", "Timber for the shared dock"],
      ["nomads", "Nothing. A light ship runs faster"],
    ] },
    { q: "A rival crew is sinking off your bow.", a: [
      ["pirates", "Throw them a rope, then recruit them"],
      ["cats", "Offer a rescue at a fair price"],
      ["socialists", "Bring them aboard. Their hands belong to the fleet now"],
      ["nomads", "Sail on before their trouble becomes mine"],
    ] },
    { q: "Someone breaks a promise to your crew.", a: [
      ["pirates", "Maroon them on the nearest rock"],
      ["cats", "Collect what they owe, with interest"],
      ["socialists", "Put it before the fleet and let everyone decide"],
      ["nomads", "Never trust them again, and keep moving"],
    ] },
    { q: "Which flag flies from your mast?", a: [
      ["pirates", "Black, with nobody’s name on it"],
      ["cats", "Green, with a balance sheet behind it"],
      ["socialists", "Crimson, the same color on every ship"],
      ["nomads", "None. A flag is a target"],
    ] },
    { q: "You have the night watch. What keeps you awake?", a: [
      ["pirates", "The horizon, and whatever is worth taking past it"],
      ["cats", "Tomorrow’s prices"],
      ["socialists", "Whether every ship made it back"],
      ["nomads", "Footsteps on deck that aren’t mine"],
    ] },
    { q: "When the five days end, how do you want to be remembered?", a: [
      ["pirates", "As the captain nobody could cage"],
      ["cats", "As the richest sailor in the Void"],
      ["socialists", "As part of the fleet that held"],
      ["nomads", "I don’t. I want to be remembered as still alive"],
    ] },
  ];

  const $ = (sel) => document.querySelector(sel);
  const steps = document.querySelectorAll(".gate__step");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NAME_KEY = "vs-sailor";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  let sailor = store.get(NAME_KEY) || "";
  let index = 0;
  let tally = {};
  let lastPick = null;
  let result = null;

  const show = (name) => {
    steps.forEach((s) => { s.hidden = s.dataset.step !== name; if (!s.hidden) s.classList.add("fade-in"); });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

  // Lines from the Gatekeeper are written in ink, one unhurried letter at a time, like a diary answering back.
  const inkWrite = (el, start = 0) => {
    if (!el) return;
    const text = el.dataset.ink || el.textContent;
    el.dataset.ink = text;
    el.setAttribute("aria-label", text);
    if (reduceMotion) { el.textContent = text; return; }
    let t = start;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "ink";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch;
      span.style.setProperty("--d", `${t}ms`);
      frag.appendChild(span);
      // Linger between words and over the trailing ellipsis, as a hand would.
      t += ch === " " ? 260 : ch === "…" ? 520 : 110;
    }
    el.replaceChildren(frag);
  };
  inkWrite($("#gate-line"), 700);

  const input = $("#sailor-name");
  if (sailor) input.value = sailor;

  $("#gate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    sailor = input.value.trim().slice(0, 24) || "Unnamed Sailor";
    store.set(NAME_KEY, sailor);
    index = 0; tally = {}; lastPick = null;
    renderQuestion();
  });

  function renderQuestion() {
    const item = QUESTIONS[index];
    show("question");
    $(".progress span").style.width = `${(index / QUESTIONS.length) * 100}%`;
    $(".q__count").textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    const title = $(".q__text");
    title.textContent = item.q;
    const box = $(".answers");
    box.replaceChildren(...shuffle(item.a).map(([faction, label]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "answer"; b.textContent = label;
      b.addEventListener("click", () => choose(faction));
      return b;
    }));
    title.focus({ preventScroll: true });
  }

  function choose(faction) {
    tally[faction] = (tally[faction] || 0) + 1;
    lastPick = faction;
    index += 1;
    if (index < QUESTIONS.length) renderQuestion();
    else weigh();
  }

  function weigh() {
    const top = Math.max(...Object.values(tally));
    const leaders = Object.keys(tally).filter((k) => tally[k] === top);
    // A tie goes to the faction of the final answer if it is among the leaders, so every verdict feels decided.
    result = leaders.includes(lastPick) ? lastPick : leaders[0];
    $(".progress span").style.width = "100%";
    if (reduceMotion) return renderVerdict();
    show("weighing");
    inkWrite($(".weighing .gate__line"), 200);
    setTimeout(renderVerdict, 3400);
  }

  /* The moment of earning: a burst of the faction's own colour flares behind the crest, a few sparks
     of glitter catch the light, and both settle into the card's resting glow. Once per verdict. */
  function celebrate() {
    const card = $(".verdict__card");
    card.querySelector(".burst")?.remove();
    if (reduceMotion) return;
    const burst = document.createElement("span");
    burst.className = "burst";
    burst.setAttribute("aria-hidden", "true");
    burst.innerHTML = '<span class="burst__glow"></span><span class="burst__ring"></span>';
    for (let i = 0; i < 14; i++) {
      const spark = document.createElement("span");
      spark.className = "burst__spark";
      const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 34; // % from the crest's centre
      spark.style.cssText = `left:${50 + Math.cos(a) * r * 0.9}%;top:${40 + Math.sin(a) * r * 0.75}%;--s:${5 + Math.random() * 6}px;--d:${(0.6 + Math.random() * 1.4).toFixed(2)}s`;
      burst.append(spark);
    }
    card.prepend(burst);
    card.classList.remove("is-earned");
    void card.offsetWidth; // restart the flare on a second walk through the Gate
    card.classList.add("is-earned");
    setTimeout(() => burst.remove(), 4400);
  }

  function renderVerdict(opts = {}) {
    const f = FACTIONS[result];
    show("verdict");
    $(".verdict__card .who").textContent = sailor;
    const crest = $(".verdict__card .crest");
    crest.src = f.crest; crest.alt = `${f.name} crest`;
    $(".verdict__card .name").textContent = f.name;
    $(".verdict__card .motto").textContent = f.motto;
    $(".verdict__creed").textContent = f.creed;
    store.set("vs-faction", result);
    prepareCards();
    if (opts.reopen) {
      preview(f.theme); // reopening a verdict to share it shows its colours without changing the sailor's choice
    } else {
      // Earned colours are the sailor's at once: no button to press. The tag names them once the burst settles.
      window.VoidSailors?.setTheme(f.theme, { earned: true });
      celebrate();
      setTimeout(() => window.VoidSailors?.showTag?.(f.theme), 2400);
    }
    $(".verdict .eyebrow").focus?.();
  }

  const root = document.documentElement;
  const preview = (theme) => {
    if (theme && theme !== "void") root.dataset.theme = theme; else delete root.dataset.theme;
    document.dispatchEvent(new CustomEvent("vs:theme"));
  };
  const restore = () => preview(store.get("vs-theme"));

  document.querySelector(".verdict").addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "again") { restore(); show("intro"); input.focus(); }
    if (action === "share") openShare();
  });

  /* ---------- Share the crest ----------
     The card is drawn in two shapes: a 9:16 story (Instagram, TikTok, Facebook Stories) and a 4:5 post
     (feeds). Every path ends with the picture or the link in the sailor's hands, never a dead end:
       phones and the card app   The More circle opens the whole share sheet with the picture.
                                 Save picture: iPhone uses the sheet's Save Image (to Photos); Android downloads.
       circles (every device)    Instagram and TikTok: the share sheet with the picture on phones, a code to the
                                 phone on computers. Facebook, X and WhatsApp post the /crest/<faction> link.
       computers                 The Download circle saves the picture. Facebook, X and WhatsApp post the /crest/<faction> link,
                                 whose preview is the faction's card. Instagram and TikTok post from a phone, so
                                 their buttons show a code that opens this card on the phone, ready to share.
       in-app browsers           (a link opened inside Instagram, TikTok or Facebook) can't save files, so the
                                 sailor is shown how to long-press the picture or open the page in their browser.
     Nothing is uploaded: the picture is made in the browser. */
  const pop = document.getElementById("share-pop");
  const SITE = "https://voidsailors.com";
  const FIT = {
    story: "For Instagram, TikTok and Facebook Stories",
    post: "For Instagram, Facebook and X feeds",
  };
  let size = "story";
  let cards = {}; // format -> Promise<{ blob, url, data }>
  let statusTimer;

  const ua = navigator.userAgent || "";
  const inAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|Bytedance|Snapchat|Pinterest\//i.test(ua);
  const iOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const shareable = (() => {
    try { return !!navigator.canShare?.({ files: [new File([""], "crest.jpg", { type: "image/jpeg" })] }); }
    catch (e) { return false; }
  })();
  // With a share sheet one button does it all: the sheet already lists every app the sailor uses.
  // The circles stay on every device; only what each one does changes (see the click handler).
  // The last circle: More (the whole share sheet) where there is one, Download on computers.
  if (pop && shareable) {
    pop.querySelector('[data-when="sheet"]').hidden = false;
    pop.querySelector(".share-pop__quiet").hidden = false;
  } else if (pop && !inAppBrowser) {
    pop.querySelector('[data-when="computer"]').hidden = false;
  }
  if (pop && !shareable && inAppBrowser) {
    // The apps' own browsers can't download: the long press is the way, so it is shown first and nothing pretends.
    pop.querySelector(".share-pop__inapp").hidden = false;
  }

  // JPEG: phones file it as a photo, Instagram and TikTok take it as one, and it is a third the size of a PNG.
  const fileName = () => `voidsailors-${result}-${size}.jpg`;
  const JPEG = ["image/jpeg", 0.92];
  const crestLink = () => `${SITE}/crest/${result}`;
  const caption = () => `I sail with the ${FACTIONS[result].name}. Which faction claims you?`;
  // The hash never reaches a server, so the sailor's name stays between their own devices.
  const phoneLink = () => `${SITE}/gate.html#share/${result}/${encodeURIComponent(sailor)}`;

  // Start drawing both shapes as soon as the verdict is in, so the share sheet opens on the first tap.
  function prepareCards() {
    Object.values(cards).forEach((p) => p.then((c) => URL.revokeObjectURL(c.url)).catch(() => {}));
    cards = {};
    if (!window.VSCrestCard) return;
    for (const format of ["story", "post"]) {
      cards[format] = window.VSCrestCard.render({ faction: result, format, sailor })
        .then((canvas) => new Promise((ok, fail) => canvas.toBlob((blob) => blob
          ? ok({ blob, url: URL.createObjectURL(blob), data: canvas.toDataURL(...JPEG) })
          : fail(new Error("no image")), ...JPEG)));
      cards[format].catch(() => {});
    }
  }

  const status = (text, keep) => {
    const el = pop.querySelector(".share-pop__status");
    el.textContent = text;
    clearTimeout(statusTimer);
    if (text && !keep) statusTimer = setTimeout(() => { el.textContent = ""; }, 6000);
  };

  function setLinks() {
    const url = crestLink();
    const text = caption();
    const e = encodeURIComponent;
    const links = {
      x: `https://x.com/intent/tweet?text=${e(`${text} #VoidSailors`)}&url=${e(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
      whatsapp: `https://wa.me/?text=${e(`${text} ${url}`)}`,
    };
    pop.querySelectorAll("[data-net]").forEach((a) => { a.href = links[a.dataset.net]; });
  }

  // The buttons wait for the picture, so a tap always has something to send.
  function setReady(ready) {
    pop.querySelectorAll('[data-share="picture"], [data-share="save"], [data-share="app"]').forEach((b) => { b.disabled = !ready; });
  }

  function showSize(next) {
    size = next;
    pop.querySelectorAll("[data-size]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.size === size)));
    pop.querySelector(".share-pop__fit").textContent = FIT[size];
    const frame = pop.querySelector(".share-preview");
    const img = frame.querySelector("img");
    frame.dataset.size = size;
    img.alt = `${sailor}'s crest card: sails with the ${FACTIONS[result].name}`;
    frame.classList.add("is-loading");
    setReady(false);
    cards[size]?.then((c) => {
      if (size !== next) return;
      // A data: address, so a long press can save it even inside the apps' own browsers.
      img.src = c.data;
      frame.classList.remove("is-loading");
      setReady(true);
    }).catch(() => frame.classList.remove("is-loading"));
  }

  function openShare() {
    if (!pop || typeof pop.showModal !== "function") return saveFallback();
    if (!cards.story) prepareCards();
    setLinks();
    pop.querySelector(".share-pop__who").textContent = `You sail with the ${FACTIONS[result].name}`;
    pop.querySelector(".share-phone").hidden = true;
    pop.querySelector('[data-share="qr"]')?.setAttribute("aria-pressed", "false");
    hideHelp();
    guide(null);
    showSize(size);
    status("");
    pop.showModal();
  }

  // Browsers without the dialog still get the picture.
  function saveFallback() {
    if (!cards.story) prepareCards();
    cards.story?.then((c) => download(c));
  }

  function download(card) {
    const a = document.createElement("a");
    a.href = card.url;
    a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
  }

  const shareFile = (card) => navigator.share({ files: [new File([card.blob], fileName(), { type: JPEG[0] })] });

  /* The phone's share sheet covers the lower half of the window, so while it is open the guide sits at the top,
     where the sailor can still read it. On iPhone the row of apps lists the most used first: Instagram and
     TikTok are often a swipe away. */
  const guideEl = pop?.querySelector(".share-guide");
  function guide(title, hint) {
    if (!guideEl) return;
    if (!title) { guideEl.hidden = true; return; }
    guideEl.querySelector(".share-guide__title").textContent = title;
    guideEl.querySelector(".share-guide__hint").textContent = hint;
    guideEl.style.minHeight = `${pop.querySelector(".share-size").offsetTop}px`;
    pop.scrollTop = 0;
    guideEl.hidden = false;
  }

  /* After the sheet closes, the way on is always in reach: if the app wasn't in the list, or the sailor
     saved the picture instead, the help box saves it to Photos and opens the app itself. */
  const APP_HOME = { Instagram: "https://www.instagram.com/", TikTok: "https://www.tiktok.com/" };
  const help = pop?.querySelector(".share-help") || {};
  const quietSave = shareable ? pop?.querySelector(".share-pop__quiet") : null;
  const hideHelp = () => { help.hidden = true; if (quietSave) quietSave.hidden = false; };
  function showHelp(app, shared) {
    help.querySelector(".share-help__title").textContent = shared ? "Saved it instead?" : `${app} not in the list?`;
    help.querySelector(".share-help__hint").textContent = shared
      ? "The card waits in your photos, ready to post."
      : "Keep the card in your photos first, then post it from the app.";
    help.querySelector('[data-share="save"]').hidden = shared;
    help.querySelector(".share-help__dot").hidden = shared;
    const open = help.querySelector(".share-help__open");
    open.href = APP_HOME[app];
    open.textContent = `Open ${app}`;
    help.hidden = false;
    if (quietSave) quietSave.hidden = true; // the box carries its own Save picture
    help.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  // The code that carries the card to the sailor's phone (Instagram and TikTok post from there).
  let qrLib;
  const loadQr = () => qrLib || (qrLib = new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "assets/js/vendor/qrcode.min.js";
    s.onload = () => (window.qrcode ? ok(window.qrcode) : fail(new Error("no qr")));
    s.onerror = fail;
    document.head.appendChild(s);
  }));
  /* The QR circle. On a computer the code carries the sailor's own card to their phone. On a phone it is
     for the friend standing beside them: the code opens the faction's page, and from there the Gate. */
  const onPhone = shareable || inAppBrowser;
  async function showPhone(app) {
    const box = pop.querySelector(".share-phone");
    const forFriend = !app && onPhone;
    box.querySelector(".share-phone__title").textContent = app ? `Post it on ${app} from your phone`
      : forFriend ? "Let a friend scan this" : "Open your card on your phone";
    box.querySelector(".share-phone__hint").textContent = forFriend
      ? "Their phone opens your faction, then the Gate is theirs to face."
      : "Scan with your phone camera. Your crest opens there, ready to share.";
    pop.querySelector('[data-share="qr"]')?.setAttribute("aria-pressed", "true");
    const code = box.querySelector(".share-phone__code");
    box.hidden = false;
    try {
      const qrcode = await loadQr();
      const qr = qrcode(0, "M");
      qr.addData(forFriend ? crestLink() : phoneLink());
      qr.make();
      code.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (err) {
      code.textContent = "";
    }
    box.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    status(app ? `Prefer this computer? Download the picture, then upload it on ${app}.` : "", !!app);
  }

  /* gate.html#share (from the card app's Share window) reopens a sailor's own verdict and the share window.
     gate.html#share/<faction>/<name> (the code above) does the same on the phone that scanned it. */
  const shareHash = location.hash.match(/^#share(?:\/(\w+)\/(.+))?$/);
  if (shareHash) {
    let name = null;
    try { name = shareHash[2] ? decodeURIComponent(shareHash[2]).slice(0, 24) : null; } catch (e) { /* bad link */ }
    const faction = FACTIONS[shareHash[1]] ? shareHash[1] : store.get("vs-faction");
    name = name || store.get(NAME_KEY);
    if (FACTIONS[faction] && name) {
      sailor = name;
      result = faction;
      renderVerdict({ reopen: true });
      openShare();
    }
  }

  if (pop) {
    pop.querySelector("[data-close]").addEventListener("click", () => pop.close());
    pop.addEventListener("click", async (e) => {
      if (e.target === pop) return pop.close();
      const sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) return showSize(sizeBtn.dataset.size);
      const btn = e.target.closest("[data-share]");
      const act = btn?.dataset.share;
      if (!act) return;
      if (act === "qr") {
        const box = pop.querySelector(".share-phone");
        if (!box.hidden && btn.getAttribute("aria-pressed") === "true") { box.hidden = true; btn.setAttribute("aria-pressed", "false"); return; }
        return showPhone(null);
      }
      if (act === "app") {
        const app = btn.dataset.app;
        // Computers: Instagram and TikTok post from a phone, so the code carries the card there.
        if (!shareable && !inAppBrowser) return showPhone(app);
        if (inAppBrowser) { status(`Press and hold the picture to save it, then post it on ${app}.`, true); return; }
        // Phones: a website can't open Instagram or TikTok with a picture directly; the share sheet can.
        const card = await cards[size];
        if (!card) return;
        hideHelp();
        status("");
        guide(`Choose ${app}`, iOS
          ? `Swipe the row of apps to find it. Or tap Save Image and post it from ${app}.`
          : `Scroll the apps to find it. Or save the picture and post it from ${app}.`);
        try { await shareFile(card); guide(null); showHelp(app, true); }
        catch (err) {
          guide(null);
          if (err.name === "NotAllowedError") { status(`Tap ${app} once more.`, true); return; }
          showHelp(app, false);
        }
        return;
      }
      if (act === "copy") {
        try {
          await navigator.clipboard.writeText(`${caption()} ${crestLink()} #VoidSailors`);
          status("Link copied, with a caption. Paste it anywhere.");
        } catch (err) { status(crestLink(), true); }
        return;
      }
      const card = await cards[size];
      if (!card) return;
      if (act === "save") {
        if (inAppBrowser) { status("Press and hold the picture to save it.", true); return; }
        // iPhone downloads land in Files, not Photos; the share sheet's Save Image puts it in Photos.
        if (iOS && shareable) {
          guide("Tap Save Image", "Your card goes to Photos, ready for any app.");
          try { await shareFile(card); guide(null); status("Saved to Photos."); }
          catch (err) { guide(null); if (err.name !== "AbortError") status("Press and hold the picture to save it.", true); }
          return;
        }
        download(card);
        status(shareable ? "Picture saved to your downloads." : "Picture saved. Post it anywhere you like.");
        return;
      }
      // Only the picture goes to the share sheet: Instagram and others drop the image when text rides along.
      try {
        await shareFile(card);
      } catch (err) {
        if (err.name === "AbortError") return;
        // The tap expired before the sheet could open: one more tap fixes it.
        if (err.name === "NotAllowedError") { status("Tap once more."); return; }
        if (iOS) status("Press and hold the picture to save it, then post it from Photos.", true);
        else { download(card); status("Picture saved. Post it from your gallery."); }
      }
    });
  }
})();
