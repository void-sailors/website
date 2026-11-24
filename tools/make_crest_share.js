/* Bake the crest card images that social networks fetch from the server:
     assets/img/share/<faction>-link.jpg  1200 x 630   preview under a shared crest link (Open Graph / X)
     assets/img/share/<faction>-pin.jpg   1000 x 1500  the picture Pinterest pins
   They are drawn by assets/js/crest-card.js, the same code the Gate uses live, so they always match.
   Run from the repo root after changing the card or a crest:  node tools/make_crest_share.js
   Needs Node with Playwright and its Chromium installed. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets/img/share");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2" };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // gate.html loads the site fonts, which the card is drawn with.
  await page.goto(`${base}/gate.html`);
  await page.addScriptTag({ url: "/assets/js/crest-card.js" });
  for (const faction of ["pirates", "cats", "socialists", "nomads"]) {
    for (const format of ["link", "pin"]) {
      const data = await page.evaluate(async ([faction, format]) =>
        (await window.VSCrestCard.render({ faction, format })).toDataURL("image/jpeg", 0.86), [faction, format]);
      const file = path.join(OUT, `${faction}-${format}.jpg`);
      fs.writeFileSync(file, Buffer.from(data.split(",")[1], "base64"));
      console.log(path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + " KB");
    }
  }
  await browser.close();
  server.close();
})();
