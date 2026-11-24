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

  function renderVerdict() {
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
    // The ceremony previews the faction colours; "Keep These Colors" makes them stick.
    preview(f.theme);
    keepBtn.disabled = false;
    keepBtn.lastChild.textContent = "Keep These Colors";
    $(".verdict .eyebrow").focus?.();
  }

  const root = document.documentElement;
  const keepBtn = document.querySelector('[data-action="colors"]');
  const preview = (theme) => {
    if (theme && theme !== "void") root.dataset.theme = theme; else delete root.dataset.theme;
    document.dispatchEvent(new CustomEvent("vs:theme"));
  };
  const restore = () => preview(store.get("vs-theme"));

  document.querySelector(".verdict").addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "colors") {
      window.VoidSailors?.setTheme(FACTIONS[result].theme, { earned: true });
      keepBtn.disabled = true;
      keepBtn.lastChild.textContent = "Colors Kept";
    }
    if (action === "again") { restore(); show("intro"); input.focus(); }
    if (action === "share") openShare();
  });

  /* ---------- Share the crest ----------
     The card is drawn in two shapes: a 9:16 story (Instagram, TikTok, Facebook Stories) and a 4:5 post
     (feeds). Every path ends with the picture or the link in the sailor's hands, never a dead end:
       phones and the card app   Share with Friends opens the share sheet (Instagram, TikTok, Facebook...).
                                 Save picture: iPhone uses the sheet's Save Image (to Photos); Android downloads.
       computers                 Save Picture downloads. Facebook, X and Pinterest post the /crest/<faction> link,
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
    try { return !!navigator.canShare?.({ files: [new File([""], "crest.png", { type: "image/png" })] }); }
    catch (e) { return false; }
  })();
  // With a share sheet one button does it all: the sheet already lists every app the sailor uses.
  if (pop && shareable) {
    pop.querySelector('[data-share="picture"]').hidden = false;
    pop.querySelector("[data-save-main]").hidden = true;
    pop.querySelector(".share-pop__quiet").hidden = false;
    pop.querySelector(".share-pop__links").hidden = true;
  } else if (pop && inAppBrowser) {
    // The apps' own browsers can't download: the long press is the way, so it is shown first and nothing pretends.
    pop.querySelector(".share-pop__links").hidden = true;
    pop.querySelector(".share-pop__inapp").hidden = false;
    pop.querySelector("[data-save-main]").hidden = true;
    const quiet = pop.querySelector(".share-pop__quiet");
    quiet.hidden = false;
    quiet.querySelector('[data-share="save"]').hidden = true;
    quiet.querySelector("span").hidden = true;
  }

  const fileName = () => `voidsailors-${result}-${size}.png`;
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
          ? ok({ blob, url: URL.createObjectURL(blob), data: canvas.toDataURL("image/png") })
          : fail(new Error("no image")), "image/png")));
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
      pinterest: `https://www.pinterest.com/pin/create/button/?url=${e(url)}&media=${e(`${SITE}/assets/img/share/${result}-pin.jpg`)}&description=${e(`${text} VoidSailors, a GameLit novel by E. J. Perry.`)}`,
    };
    pop.querySelectorAll("[data-net]").forEach((a) => { a.href = links[a.dataset.net]; });
  }

  // The buttons wait for the picture, so a tap always has something to send.
  function setReady(ready) {
    pop.querySelectorAll('[data-share="picture"], [data-share="save"]').forEach((b) => { b.disabled = !ready; });
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

  const shareFile = (card) => navigator.share({ files: [new File([card.blob], fileName(), { type: "image/png" })] });

  // The code that carries the card to the sailor's phone (Instagram and TikTok post from there).
  let qrLib;
  const loadQr = () => qrLib || (qrLib = new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "assets/js/vendor/qrcode.min.js";
    s.onload = () => (window.qrcode ? ok(window.qrcode) : fail(new Error("no qr")));
    s.onerror = fail;
    document.head.appendChild(s);
  }));
  async function showPhone(app) {
    const box = pop.querySelector(".share-phone");
    box.querySelector("[data-app-name]").textContent = app;
    const code = box.querySelector(".share-phone__code");
    box.hidden = false;
    try {
      const qrcode = await loadQr();
      const qr = qrcode(0, "M");
      qr.addData(phoneLink());
      qr.make();
      code.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (err) {
      code.textContent = "";
    }
    box.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    status(`Prefer this computer? Save Picture, then upload it on ${app}.`, true);
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
      renderVerdict();
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
      if (act === "phone") return showPhone(btn.dataset.app);
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
          status("Choose Save Image to keep it in Photos.", true);
          try { await shareFile(card); } catch (err) { if (err.name !== "AbortError") status("Press and hold the picture to save it.", true); }
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
        if (err.name === "NotAllowedError") { status("Tap Share with Friends once more."); return; }
        if (iOS) status("Press and hold the picture to save it, then post it from Photos.", true);
        else { download(card); status("Picture saved. Post it from your gallery."); }
      }
    });
  }
})();
