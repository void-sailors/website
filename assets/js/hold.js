/* Trials of the Hold: four small games on the inventory items. Winning one unlocks the next. */
(() => {
  const hold = document.querySelector("[data-hold]");
  const dialog = document.getElementById("trial");
  if (!hold || !dialog || typeof dialog.showModal !== "function") return;

  const ORDER = ["cannonballs", "twigs", "shards", "scroll"];
  const NAMES = { cannonballs: "Magic Cannonballs", twigs: "Bundle of Twigs", shards: "Shards", scroll: "The Scroll" };
  const KEY = "vs-hold";
  const store = {
    get() { try { return Math.min(ORDER.length, Number(localStorage.getItem(KEY)) || 0); } catch (e) { return 0; } },
    set(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) { /* private mode */ } },
  };
  let won = store.get(); // how many trials are complete

  const items = hold.querySelectorAll("[data-game]");
  // Hero cards that stay grey until their trial is won. The real name and title are kept to restore later.
  const heroes = [...document.querySelectorAll("[data-reward]")].map((card) => {
    const img = card.querySelector("img"), h = card.querySelector("h3"), p = card.querySelector("figcaption p");
    return { card, img, h, p, game: card.dataset.reward, alt: img.alt, name: h.textContent, title: p.textContent };
  });
  const paintHeroes = () => {
    heroes.forEach((x) => {
      const hidden = ORDER.indexOf(x.game) >= won;
      if (!hidden && x.card.dataset.state === "hidden") x.card.classList.add("is-met");
      x.card.dataset.state = hidden ? "hidden" : "met";
      x.h.textContent = hidden ? "?" : x.name;
      x.p.textContent = hidden ? `Win the ${NAMES[x.game]} to meet this sailor` : x.title;
      x.img.alt = hidden ? "A sailor not yet met" : x.alt;
    });
  };
  const loreLink = document.querySelector("[data-lore-link]");
  const paint = () => {
    paintHeroes();
    if (loreLink) loreLink.hidden = won < ORDER.length;
    items.forEach((btn) => {
      const i = ORDER.indexOf(btn.dataset.game);
      const state = i < won ? "won" : i === won ? "open" : "locked";
      btn.dataset.state = state;
      btn.setAttribute("aria-disabled", String(state === "locked"));
      if (state === "locked") {
        btn.dataset.hint = `Unlocks after ${NAMES[ORDER[i - 1]]}`;
        btn.setAttribute("aria-label", `${NAMES[btn.dataset.game]}. ${btn.dataset.hint}`);
      } else {
        delete btn.dataset.hint;
        btn.removeAttribute("aria-label");
      }
    });
  };

  const $ = (sel) => dialog.querySelector(sel);
  const ui = { step: $(".trial__step"), title: $(".trial__title"), rule: $(".trial__rule"), board: $(".trial__board"), count: $(".trial__count"), status: $(".trial__status"), actions: $(".trial__actions") };
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const button = (label, cls, onClick) => { const b = el("button", `btn ${cls}`, label); b.type = "button"; b.addEventListener("click", onClick); return b; };

  let current = null;
  const open = (game) => {
    current = game;
    dialog.dataset.game = game;
    ui.step.textContent = `Trial ${ORDER.indexOf(game) + 1} of ${ORDER.length}`;
    ui.title.textContent = NAMES[game];
    GAMES[game]();
    if (!dialog.open) dialog.showModal();
  };

  const win = (message) => {
    const i = ORDER.indexOf(current);
    if (i === won) { won += 1; store.set(won); paint(); }
    const met = heroes.find((x) => x.game === current);
    ui.status.textContent = met ? `${message} ${met.name} now sails among The Heroes.` : message;
    ui.status.dataset.tone = "win";
    const next = ORDER[i + 1];
    if (next) return ui.actions.replaceChildren(button(`Open ${NAMES[next]}`, "btn--primary", () => open(next)));
    const lore = el("a", "btn btn--primary", "Read the Lore");
    lore.href = "lore.html";
    ui.actions.replaceChildren(lore, button("Close the Hold", "btn--ghost", () => dialog.close()));
  };
  const lose = (message, retryLabel) => {
    ui.status.textContent = message;
    ui.status.dataset.tone = "lose";
    ui.actions.replaceChildren(button(retryLabel, "btn--ghost", () => GAMES[current]()));
  };
  const reset = (rule) => {
    ui.rule.textContent = rule;
    ui.board.replaceChildren();
    ui.board.className = "trial__board";
    ui.count.textContent = "";
    ui.status.textContent = "";
    delete ui.status.dataset.tone;
    ui.actions.replaceChildren();
  };

  const GAMES = {
    /* I. Like Mines: sixteen spheres, three cursed, a new layout every round. */
    cannonballs() {
      const SIZE = 16, CURSED = 3, NEED = 5;
      const HUES = [205, 230, 265, 290, 320, 175, 45, 140]; // blue, indigo, violet, purple, magenta, teal, amber, green
      reset(`Sixteen cannonballs sit in the crate and ${CURSED} of them are cursed. Lift ${NEED} sound ones to pass. Touch a cursed ball and it blows.`);
      const cursed = new Set(shuffle([...Array(SIZE).keys()]).slice(0, CURSED));
      let found = 0, over = false;
      ui.board.classList.add("orbs");
      const count = ui.count;
      count.textContent = `Sound: 0 of ${NEED}`;
      for (let i = 0; i < SIZE; i++) {
        const orb = el("button", "orb");
        orb.style.setProperty("--h", HUES[rand(HUES.length)]);
        orb.type = "button";
        orb.setAttribute("aria-label", `Cannonball ${i + 1}`);
        orb.addEventListener("click", () => {
          if (over || orb.dataset.state) return;
          if (cursed.has(i)) {
            over = true;
            orb.dataset.state = "boom";
            ui.board.classList.add("is-shaking");
            ui.board.querySelectorAll(".orb").forEach((o, j) => { if (cursed.has(j) && j !== i) o.dataset.state = "cursed"; });
            return lose("Boom! That one was cursed. The crate reshuffles every time.", "Load a Fresh Crate");
          }
          orb.dataset.state = "sound";
          orb.setAttribute("aria-label", `Cannonball ${i + 1}, sound`);
          found += 1;
          count.textContent = `Sound: ${found} of ${NEED}`;
          if (found === NEED) { over = true; win("Five sound cannonballs. The twigs are yours to draw."); }
        });
        ui.board.appendChild(orb);
      }
    },

    /* II. Draw straws: four twigs, one long, two pulls. */
    twigs() {
      reset("Four twigs are bound in cord and only one runs long. You get two pulls.");
      const LONG = rand(4);
      let pulls = 2, over = false;
      ui.board.classList.add("bundle");
      for (let i = 0; i < 4; i++) {
        const twig = el("button", "twig");
        twig.type = "button";
        twig.setAttribute("aria-label", `Twig ${i + 1}`);
        twig.addEventListener("click", () => {
          if (over || twig.dataset.state) return;
          const long = i === LONG;
          twig.dataset.state = long ? "long" : "short";
          twig.setAttribute("aria-label", `Twig ${i + 1}, ${long ? "long" : "short"}`);
          pulls -= 1;
          if (long) { over = true; return win("The long twig! The shards answer to you now."); }
          if (pulls === 0) { over = true; return lose("Two short twigs. The bundle keeps its secret this time.", "Retie the Bundle"); }
          ui.status.textContent = "Short. One pull left.";
        });
        ui.board.appendChild(twig);
      }
      ui.board.appendChild(el("span", "bundle__cord"));
    },

    /* III. Make 173: pick shards, then add a number of your own. */
    shards() {
      const TARGET = 173, MAX_OWN = 20;
      reset(`Five shards hum with round numbers. Choose some of them, then add your own number from 1 to ${MAX_OWN}. Make exactly ${TARGET} to pass.`);
      // Roll until some choice of shards leaves a gap your own number can fill.
      let values;
      const reachable = (vals) => {
        for (let mask = 1; mask < 32; mask++) {
          const sum = vals.reduce((t, v, k) => t + (mask & (1 << k) ? v : 0), 0);
          const gap = TARGET - sum;
          if (gap >= 1 && gap <= MAX_OWN) return true;
        }
        return false;
      };
      // Shards carry tens (10 to 90), so the sums stay easy to do in your head.
      do { values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5).map((n) => n * 10); } while (!reachable(values));

      ui.board.classList.add("shards");
      const picked = new Set();
      const field = el("label", "shard shard--own");
      const own = el("input");
      Object.assign(own, { type: "number", min: 1, max: MAX_OWN, inputMode: "numeric", placeholder: "?" });
      own.setAttribute("aria-label", `Your number, 1 to ${MAX_OWN}`);
      field.append(own);
      const total = ui.count;
      let over = false;
      const check = () => {
        const mine = Number(own.value);
        const valid = Number.isInteger(mine) && mine >= 1 && mine <= MAX_OWN;
        const sum = [...picked].reduce((t, k) => t + values[k], 0) + (valid ? mine : 0);
        total.textContent = `Total: ${sum} of ${TARGET}`;
        if (!over && valid && picked.size > 0 && sum === TARGET) {
          over = true;
          ui.board.classList.add("is-whole");
          own.disabled = true;
          win(`${TARGET} exactly. The shards fuse and the scroll comes loose.`);
        }
      };
      values.forEach((v, k) => {
        const shard = el("button", "shard", String(v));
        shard.type = "button";
        shard.setAttribute("aria-pressed", "false");
        shard.addEventListener("click", () => {
          if (over) return;
          picked.has(k) ? picked.delete(k) : picked.add(k);
          shard.setAttribute("aria-pressed", String(picked.has(k)));
          check();
        });
        ui.board.appendChild(shard);
      });
      ui.board.appendChild(field);
      own.addEventListener("input", check);
      ui.actions.replaceChildren(button("Draw New Shards", "btn--ghost", () => GAMES.shards()));
      check();
    },

    /* IV. The riddle. Twig = 11, shard = twice the cannonball, so 3c = 162. */
    scroll() {
      reset("");
      ui.rule.replaceChildren(
        el("span", "riddle", "A cannonball, a twig and a shard together weigh 173."),
        el("span", "riddle", "The twig weighs 11."),
        el("span", "riddle", "The shard weighs twice the cannonball."),
        el("span", "riddle", "Name each weight, and the scroll sets them in order."),
      );
      const form = el("form", "riddle-form");
      form.noValidate = true;
      const field = (label, name, value) => {
        const wrap = el("label", "riddle-field");
        wrap.append(el("span", null, label));
        const input = el("input");
        Object.assign(input, { type: "number", name, inputMode: "numeric", min: 1, max: 173 });
        if (value) { input.value = value; input.readOnly = true; }
        wrap.append(input);
        return wrap;
      };
      form.append(field("Cannonball", "c"), field("Twig", "t", "11"), field("Shard", "s"));
      ui.board.appendChild(form);
      const unseal = button("Unseal the Scroll", "btn--primary", () => form.requestSubmit());
      const hint = button("Ask Moss for a Hint", "btn--ghost", () => {
        ui.status.textContent = "Moss: “Set the twig aside first. Then count the shard as two cannonballs.”";
        delete ui.status.dataset.tone;
      });
      ui.actions.replaceChildren(unseal, hint);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const c = Number(form.elements.c.value), s = Number(form.elements.s.value);
        if (c === 54 && s === 108) {
          form.querySelectorAll("input").forEach((i) => { i.readOnly = true; });
          const order = el("ol", "riddle-order");
          [["Twig", 11], ["Cannonball", 54], ["Shard", 108]].forEach(([n, v]) => order.append(el("li", null, `${n} · ${v}`)));
          ui.board.appendChild(order);
          win("The scroll unrolls. Every trial is won, Sailor, and the lore it kept is yours to read.");
        } else {
          ui.status.textContent = c + 11 + s === 173
            ? "Those add to 173, but the shard must weigh twice the cannonball."
            : "The wax holds. Those weights do not make 173.";
          ui.status.dataset.tone = "lose";
        }
      });
    },
  };

  items.forEach((btn) => btn.addEventListener("click", () => {
    if (btn.dataset.state === "locked") {
      btn.classList.remove("is-denied"); void btn.offsetWidth; btn.classList.add("is-denied");
      clearTimeout(btn.hintTimer);
      btn.hintTimer = setTimeout(() => btn.classList.remove("is-denied"), 2600);
      return;
    }
    open(btn.dataset.game);
  }));
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  paint();
})();
