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
     The card is drawn in two shapes: a 9:16 story (Instagram, TikTok, Facebook, Snapchat) and a 4:5 post
     (feeds on Instagram, Facebook, Threads and X). Phones hand the picture to the share sheet; every device
     can save it. Links go to /crest/<faction>, whose preview is that faction's card, so a link dropped on
     X, Facebook, Threads, WhatsApp or Reddit shows the crest too. Nothing is uploaded: the picture is made here. */
  const pop = document.getElementById("share-pop");
  const SITE = "https://voidsailors.com";
  const FIT = {
    story: "For Instagram, TikTok and Facebook Stories",
    post: "For Instagram, Facebook, Threads and X feeds",
  };
  let size = "story";
  let cards = {}; // format -> Promise<{ blob, url }>
  let statusTimer;

  const shareable = (() => {
    try { return !!navigator.canShare?.({ files: [new File([""], "crest.png", { type: "image/png" })] }); }
    catch (e) { return false; }
  })();
  const pictureBtn = pop?.querySelector('[data-share="picture"]');
  const saveBtn = pop?.querySelector('[data-share="save"]');
  // Where the share sheet exists it leads; elsewhere saving is the main action.
  if (pictureBtn && shareable) {
    pictureBtn.hidden = false;
    const tip = pop.querySelector(".share-pop__tip");
    if (tip) tip.textContent = "Instagram and TikTok take pictures rather than links. Tap Share with Friends and pick the app.";
  } else if (saveBtn) saveBtn.className = "btn btn--primary";

  const fileName = () => `voidsailors-${result}-${size}.png`;
  const crestLink = () => `${SITE}/crest/${result}`;
  const caption = () => `I sail with the ${FACTIONS[result].name}. Which faction claims you?`;

  // Start drawing both shapes as soon as the verdict is in, so the share sheet opens on the first tap.
  function prepareCards() {
    Object.values(cards).forEach((p) => p.then((c) => URL.revokeObjectURL(c.url)).catch(() => {}));
    cards = {};
    if (!window.VSCrestCard) return;
    for (const format of ["story", "post"]) {
      cards[format] = window.VSCrestCard.render({ faction: result, format, sailor })
        .then((canvas) => new Promise((ok, fail) => canvas.toBlob((blob) => blob ? ok({ blob, url: URL.createObjectURL(blob) }) : fail(new Error("no image")), "image/png")));
      cards[format].catch(() => {});
    }
  }

  const status = (text) => {
    const el = pop.querySelector(".share-pop__status");
    el.textContent = text;
    clearTimeout(statusTimer);
    if (text) statusTimer = setTimeout(() => { el.textContent = ""; }, 4200);
  };

  function setLinks() {
    const url = crestLink();
    const text = caption();
    const tagged = `${text} #VoidSailors`;
    const e = encodeURIComponent;
    const links = {
      x: `https://x.com/intent/tweet?text=${e(tagged)}&url=${e(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
      threads: `https://www.threads.net/intent/post?text=${e(`${tagged} ${url}`)}`,
      bluesky: `https://bsky.app/intent/compose?text=${e(`${tagged} ${url}`)}`,
      pinterest: `https://www.pinterest.com/pin/create/button/?url=${e(url)}&media=${e(`${SITE}/assets/img/share/${result}-pin.jpg`)}&description=${e(`${text} VoidSailors, a GameLit novel by E. J. Perry.`)}`,
      reddit: `https://www.reddit.com/submit?url=${e(url)}&title=${e(text)}`,
      whatsapp: `https://wa.me/?text=${e(`${text} ${url}`)}`,
    };
    pop.querySelectorAll("[data-net]").forEach((a) => { a.href = links[a.dataset.net]; });
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
    cards[size]?.then((c) => { if (size === next) { img.src = c.url; frame.classList.remove("is-loading"); } })
      .catch(() => frame.classList.remove("is-loading"));
  }

  function openShare() {
    if (!pop || typeof pop.showModal !== "function") return saveFallback();
    if (!cards.story) prepareCards();
    setLinks();
    pop.querySelector(".share-pop__who").textContent = `You sail with the ${FACTIONS[result].name}`;
    showSize(size);
    status("");
    pop.showModal();
  }

  // Browsers without the dialog still get the picture.
  function saveFallback() {
    if (!cards.story) prepareCards();
    cards.story?.then((c) => save(c));
  }

  function save(card) {
    const a = document.createElement("a");
    a.href = card.url;
    a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
  }

  if (pop) {
    pop.querySelector("[data-close]").addEventListener("click", () => pop.close());
    pop.addEventListener("click", async (e) => {
      if (e.target === pop) return pop.close();
      const sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) return showSize(sizeBtn.dataset.size);
      const act = e.target.closest("[data-share]")?.dataset.share;
      if (!act) return;
      if (act === "copy") {
        try {
          await navigator.clipboard.writeText(`${caption()} ${crestLink()} #VoidSailors`);
          status("Caption and link copied. Paste them anywhere.");
        } catch (err) { status(crestLink()); }
        return;
      }
      const card = await cards[size];
      if (!card) return;
      if (act === "save") { save(card); status("Picture saved."); return; }
      // Only the picture goes to the share sheet: Instagram and others drop the image when text rides along.
      const file = new File([card.blob], fileName(), { type: "image/png" });
      try {
        await navigator.share({ files: [file] });
      } catch (err) {
        if (err.name !== "AbortError") { save(card); status("Picture saved. Add it from your photos."); }
      }
    });
  }
})();
