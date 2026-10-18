# VoidSailors.com

The official site for *VoidSailors: Where Truth Lies*, a GameLit novel by E. J. Perry. Static HTML, CSS and JavaScript served by GitHub Pages; no build step.

- `index.html` home, `book.html` the book, `gate.html` Triage by the Gate, `404.html`
- `assets/css/site.css` all styles and the themes: default Void Night; the colours earned at the Gate (`pirates`, `cats`, `nomads`, `socialists-earned`); and the manual picks from the faction button (`socialists`, `nomads-pick`, `pirates-pick`, `cats-pick`), each a softer cousin of its earned palette. The button cycles ☭ → boot → skull → cat → back, and its icon turns yellow only while earned colours are on
- `assets/js/site.js` theme toggle, menu, star field, trailer; `assets/js/gate.js` the faction ceremony; `assets/js/hold.js` the four inventory trials (cannonballs, twigs, shards, scroll), each unlocking the next
- Browser storage: `vs-theme` is the theme on screen, `vs-earned` the colours won at the Gate (☭ borrows the screen and hands it back), `vs-hold` how many trials are won
- `assets/fonts/pinyon-script.woff2` (SIL OFL, licence beside it) writes the Gatekeeper's lines
- `assets/img/web/` web-sized images. Regenerate them from the originals with `python3 tools/optimize_images.py`

## The pocket card (home-screen app)

`card.html` (shared as voidsailors.com/card) is a one-screen business card for the book that opens like an app once it is added to an iPhone home screen (Safari: Share, then Add to Home Screen).

- `card.webmanifest` names it VoidSailors and opens it full screen. Its scope is the whole site, so every page opens inside the app; `site.js` marks the app with `.is-app` and adds a round back-to-card button to the nav bar, and pages fade into each other (app only). `--safe-top` in `site.css` keeps the header clear of the clock
- In the app, the card's links (the Book, Chapter 1, the Gate and the rest) open as a full-screen pop-up window over the card instead of leaving it. The window loads the real page with `?embed`, which hides its nav bar and footer (`.is-embed`); links inside it ask the card for the next page, and the faction colour stays in sync. Browsers on phone, tablet and desktop never see this
- `assets/css/card.css` and `assets/js/card.js` hold its layout and the Share window (QR code for voidsailors.com, drawn inline, plus the phone share sheet)
- `card-sw.js` keeps an offline copy of the card only. Bump its `VERSION` when you change the file list or the `?v=` values the card loads
- Icons and launch screens live in `assets/img/app/`; `tools/optimize_images.py` rebuilds the icons. The card is `noindex` and left out of the sitemap because it repeats the home page

## Turning on the mailing list

Every signup form (the Join the Crew section, the Join the Crew window, and the Amazon "coming soon" window) reads one setting. Until it is set, the forms only show a "coming soon" note and send nothing.

1. In your provider (Buttondown, Mailchimp, Kit, MailerLite), create an embedded signup form and copy its form **action URL**.
2. In `assets/js/site.js`, paste it into `MAIL_ENDPOINT`.
3. If the provider expects a field name other than `email` (Mailchimp uses `EMAIL`), set `data-field` on the forms to match.

## Search engines and AI

- `robots.txt` welcomes every crawler, AI crawlers by name, and points to `sitemap.xml`. Update `<lastmod>` in the sitemap when a page changes.
- `llms.txt` is a plain-text summary of the book and the site for AI assistants. Keep it in step with the release date, store links and pages.
- `index.html`, `book.html` and `sample.html` carry schema.org data (Book, Person, WebSite, Chapter). When the book launches, add `datePublished` and an `offers` link to the Book.

Buttons follow one rule everywhere: the main action of a block is brass (`btn--primary`), and the second is bordered (`btn--ghost`). Links to the Gate from other pages are always bordered, so they never look like Join the Crew.

When you change `site.css` or any script, bump the `?v=` value on its `<link>`/`<script>` tags in every page so returning visitors get the new file instead of a cached copy.
