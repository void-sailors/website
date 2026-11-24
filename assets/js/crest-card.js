/* VoidSailors — the crest card picture, drawn on canvas in four sizes for social media.
   Used live by the Gate (gate.js) and by tools/make_crest_share.js, which bakes the link-preview
   and Pinterest images, so every copy of the card looks the same.
     story  1080 x 1920  Instagram / Facebook Stories, TikTok, Reels, Snapchat, WhatsApp Status
     post   1080 x 1350  Instagram, Facebook, Threads and X feeds (4:5)
     pin    1000 x 1500  Pinterest (2:3)
     link   1200 x  630  the preview card under a shared link (Open Graph / X)
   Palettes match the earned Gate themes in site.css; keep them in step if those change. */
(() => {
  const FACTIONS = {
    pirates: {
      name: "Pirates", motto: "Independence · Freedom",
      colors: { void: "#0d0b08", deep: "#1c1810", mist: "#e8dfcc", dim: "#a99c80", heading: "#fbf5e6", brass: "#e0b04f", glow: "255, 196, 110", star: "255, 244, 220" },
    },
    cats: {
      name: "C.A.T.s", motto: "Corporate Alliance of Trade",
      colors: { void: "#06120c", deep: "#0d2117", mist: "#dbe9df", dim: "#93ad9c", heading: "#f1fbf4", brass: "#c9b458", glow: "120, 230, 160", star: "236, 250, 240" },
    },
    socialists: {
      name: "Socialists", motto: "Direction · Unity · Efficiency",
      colors: { void: "#1c0204", deep: "#34060b", mist: "#f6e2e0", dim: "#d29a98", heading: "#fff1ee", brass: "#e9b44c", glow: "255, 36, 60", star: "255, 214, 210" },
    },
    nomads: {
      name: "Nomads", motto: "Every man for himself",
      colors: { void: "#0c0d10", deep: "#1a1c22", mist: "#dcdfe6", dim: "#9a9fab", heading: "#f6f7fa", brass: "#c8ccd6", glow: "205, 215, 240", star: "246, 247, 250" },
    },
  };

  const SIZES = { story: [1080, 1920], post: [1080, 1350], pin: [1000, 1500], link: [1200, 630] };
  const CTA = "Which faction claims you?";
  const DISPLAY = "Cinzel, Georgia, serif";
  const TEXT = "'Source Serif 4', Georgia, serif";
  const MARK = "'Bluu Next Titling', Cinzel, Georgia, serif";

  const base = (document.currentScript && document.currentScript.src.replace(/assets\/js\/crest-card\.js.*$/, "")) || "/";
  const images = {};
  const loadImage = (src) => images[src] || (images[src] = new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = base + src;
  }));
  const ready = () => document.fonts ? Promise.all([
    document.fonts.load(`500 40px ${DISPLAY}`), document.fonts.load(`700 40px ${DISPLAY}`),
    document.fonts.load(`40px ${TEXT}`), document.fonts.load(`italic 40px ${TEXT}`), document.fonts.load(`40px ${MARK}`),
  ]).catch(() => {}) : Promise.resolve();

  // Stars are seeded by faction, so the same faction always gets the same sky.
  const seeded = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function backdrop(g, W, H, c, faction, glowAt) {
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, c.void); bg.addColorStop(1, c.deep);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const [gx, gy, gr] = glowAt;
    const glow = g.createRadialGradient(gx, gy, gr * 0.05, gx, gy, gr);
    glow.addColorStop(0, `rgba(${c.glow}, 0.30)`); glow.addColorStop(0.5, `rgba(${c.glow}, 0.08)`); glow.addColorStop(1, `rgba(${c.glow}, 0)`);
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    const rnd = seeded([...faction].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7));
    const count = Math.round((W * H) / 9000);
    g.fillStyle = `rgb(${c.star})`;
    for (let i = 0; i < count; i++) {
      g.globalAlpha = 0.15 + rnd() * 0.65;
      g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 1.8 + 0.5, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  // A thin brass frame with a diamond at the middle of the top and bottom edges.
  function frame(g, W, H, c, inset) {
    g.strokeStyle = c.brass; g.lineWidth = 3;
    g.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
    g.globalAlpha = 0.45; g.lineWidth = 1;
    g.strokeRect(inset + 10, inset + 10, W - inset * 2 - 20, H - inset * 2 - 20);
    g.globalAlpha = 1;
    const d = 11;
    g.fillStyle = c.brass;
    for (const y of [inset, H - inset]) {
      g.beginPath(); g.moveTo(W / 2, y - d); g.lineTo(W / 2 + d, y); g.lineTo(W / 2, y + d); g.lineTo(W / 2 - d, y); g.closePath(); g.fill();
    }
  }

  // Writes one centred line, shrinking the type until it fits the width.
  function line(g, text, x, y, { size, weight = "", style = "", family, color, spacing = 0, max }) {
    let s = size;
    const set = () => {
      g.font = `${style} ${weight} ${s}px ${family}`.trim();
      if ("letterSpacing" in g) g.letterSpacing = `${spacing * s}px`;
    };
    set();
    while (max && g.measureText(text).width > max && s > 12) { s -= 2; set(); }
    g.fillStyle = color;
    g.fillText(text, x, y);
    if ("letterSpacing" in g) g.letterSpacing = "0px";
  }

  function rule(g, x, y, half, c) {
    const grad = g.createLinearGradient(x - half, 0, x + half, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(0.5, c.brass); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(x - half, y, half * 2, 2);
  }

  /* Upright cards (story, post, pin). Every y below is the text baseline, laid out for the
     format so faces, names and the address stay clear of the apps' own buttons. */
  const UPRIGHT = {
    story: { inset: 56, label: 270, who: 356, crest: [380, 820], sails: 1215, name: 1320, motto: 1385, rule: 1425, cta: 1488, logo: 1530, mark: 1616, url: 1662, big: 112 },
    post: { inset: 40, label: 118, who: 184, crest: [196, 690], sails: 890, name: 975, motto: 1030, rule: 1062, cta: 1114, logo: null, mark: 1196, url: 1238, big: 96 },
    pin: { inset: 40, label: 130, who: 196, crest: [200, 780], sails: 985, name: 1075, motto: 1132, rule: 1166, cta: 1222, logo: null, mark: 1316, url: 1360, big: 96 },
  };

  async function render({ faction, format = "story", sailor = "" }) {
    const f = FACTIONS[faction];
    const c = f.colors;
    const [W, H] = SIZES[format];
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext("2d");
    const [crest, logo] = await Promise.all([loadImage(`assets/img/web/crest-${faction}-480.webp`), loadImage("assets/img/web/logo-192.webp").catch(() => null), ready()]);
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    const who = sailor.trim();

    if (format === "link") {
      backdrop(g, W, H, c, faction, [330, H / 2, 420]);
      frame(g, W, H, c, 28);
      const ch = 520, cw = ch / 1.5;
      g.drawImage(crest, 330 - cw / 2, (H - ch) / 2, cw, ch);
      const x = 820, max = 620;
      line(g, "THE GATE HAS SPOKEN", x, 150, { size: 26, weight: 500, family: DISPLAY, color: c.dim, spacing: 0.22, max });
      line(g, "I SAIL WITH THE", x, 250, { size: 34, weight: 500, family: DISPLAY, color: c.mist, spacing: 0.14, max });
      line(g, f.name, x, 345, { size: 92, weight: 700, family: DISPLAY, color: c.heading, max });
      line(g, f.motto.toUpperCase(), x, 400, { size: 24, weight: 500, family: DISPLAY, color: c.brass, spacing: 0.12, max });
      rule(g, x, 432, 200, c);
      line(g, CTA, x, 482, { size: 30, style: "italic", family: TEXT, color: c.heading, max });
      line(g, "VoidSailors  ·  Find yours at voidsailors.com", x, 552, { size: 26, family: TEXT, color: c.dim, max });
      return canvas;
    }

    const L = UPRIGHT[format];
    const [top, ch] = L.crest, cw = ch / 1.5, max = W - L.inset * 2 - 80;
    backdrop(g, W, H, c, faction, [W / 2, top + ch * 0.45, ch * 0.75]);
    frame(g, W, H, c, L.inset);
    line(g, "THE GATE HAS SPOKEN", W / 2, L.label, { size: format === "story" ? 34 : 28, weight: 500, family: DISPLAY, color: c.dim, spacing: 0.22, max });
    if (who) line(g, who, W / 2, L.who, { size: format === "story" ? 64 : 54, style: "italic", family: TEXT, color: c.heading, max });
    g.drawImage(crest, (W - cw) / 2, who ? top : top - 30, cw, ch);
    line(g, who ? "SAILS WITH THE" : "I SAIL WITH THE", W / 2, L.sails, { size: format === "story" ? 40 : 34, weight: 500, family: DISPLAY, color: c.mist, spacing: 0.16, max });
    line(g, f.name, W / 2, L.name, { size: L.big, weight: 700, family: DISPLAY, color: c.heading, max });
    line(g, f.motto.toUpperCase(), W / 2, L.motto, { size: format === "story" ? 34 : 28, weight: 500, family: DISPLAY, color: c.brass, spacing: 0.12, max });
    rule(g, W / 2, L.rule, 220, c);
    line(g, CTA, W / 2, L.cta, { size: format === "story" ? 42 : 36, style: "italic", family: TEXT, color: c.heading, max });
    if (L.logo && logo) g.drawImage(logo, W / 2 - 22, L.logo, 44, 44);
    line(g, "VoidSailors", W / 2, L.mark, { size: format === "story" ? 56 : 46, family: MARK, color: c.heading, max });
    line(g, "Find yours at voidsailors.com", W / 2, L.url, { size: format === "story" ? 32 : 28, family: TEXT, color: c.brass, spacing: 0.04, max });
    return canvas;
  }

  window.VSCrestCard = { FACTIONS, SIZES, render };
})();
