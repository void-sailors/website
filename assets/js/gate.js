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
    // The ceremony previews the faction colours; "Keep These Colors" makes them stick.
    preview(f.theme);
    keepBtn.disabled = false;
    keepBtn.lastChild.textContent = "Keep These Colors";
    $(".verdict .eyebrow").focus?.();
  }

  const root = document.documentElement;
  const keepBtn = document.querySelector('[data-action="colors"]');
  try {
    const probe = new File([""], "crest.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [probe] })) document.querySelector('[data-action="download"]').textContent = "Share Crest Card";
  } catch (e) { /* older browsers keep "Save Crest Card" */ }
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
    if (action === "download") downloadCard();
  });

  // Draw a 1080 x 1920 story card on canvas and hand it to the visitor.
  function downloadCard() {
    const f = FACTIONS[result];
    const css = getComputedStyle(document.documentElement);
    const v = (n) => css.getPropertyValue(n).trim();
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, v("--void")); bg.addColorStop(1, v("--deep"));
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, 760, 40, W / 2, 760, 620);
    glow.addColorStop(0, "rgba(255,255,255,0.10)"); glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) {
      g.globalAlpha = 0.2 + Math.random() * 0.7;
      g.fillStyle = `rgb(${v("--star")})`;
      g.beginPath(); g.arc(Math.random() * W, Math.random() * H * 0.8, Math.random() * 2 + 0.6, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    g.strokeStyle = v("--brass"); g.lineWidth = 3;
    g.strokeRect(55, 55, W - 110, H - 110);
    g.textAlign = "center";
    g.fillStyle = v("--mist");
    g.font = "500 40px Cinzel, Georgia, serif";
    g.fillText("TRIAGE BY THE GATE", W / 2, 200);
    g.font = "64px 'Source Serif 4', Georgia, serif";
    g.fillStyle = v("--heading");
    g.fillText(sailor, W / 2, 300);
    const img = new Image();
    img.onload = () => {
      const iw = 620, ih = iw * 1.5;
      g.drawImage(img, (W - iw) / 2, 380, iw, ih);
      g.fillStyle = v("--mist");
      g.font = "500 40px Cinzel, Georgia, serif";
      g.fillText("SAILS WITH THE", W / 2, 1375);
      g.fillStyle = v("--heading");
      g.font = "700 96px Cinzel, Georgia, serif";
      g.fillText(f.name, W / 2, 1475);
      g.fillStyle = v("--brass");
      g.font = "500 40px Cinzel, Georgia, serif";
      g.fillText(f.motto.toUpperCase(), W / 2, 1550);
      g.fillStyle = v("--mist");
      g.font = "48px 'Bluu Next Titling', Cinzel, Georgia, serif";
      g.fillText("VoidSailors", W / 2, 1740);
      g.font = "32px 'Source Serif 4', Georgia, serif";
      g.fillText("voidsailors.com", W / 2, 1795);
      c.toBlob((blob) => {
        if (!blob) return;
        const fileName = `voidsailors-${result}-crest.png`;
        const save = () => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        };
        // Phones open the share sheet; everything else saves the image.
        const file = new File([blob], fileName, { type: "image/png" });
        if (!navigator.canShare?.({ files: [file] })) return save();
        navigator.share({
          files: [file],
          title: "VoidSailors",
          text: `${sailor} sails with the ${f.name}. Find your faction at https://voidsailors.com/gate.html`,
        }).catch((e) => { if (e.name !== "AbortError") save(); });
      }, "image/png");
    };
    img.src = f.crest;
  }
})();
