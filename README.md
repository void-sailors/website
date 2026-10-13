# VoidSailors.com

The official site for *VoidSailors: Where Truth Lies*, a GameLit novel by E. J. Perry. Static HTML, CSS and JavaScript served by GitHub Pages; no build step.

- `index.html` home, `book.html` the book, `gate.html` Triage by the Gate, `404.html`
- `assets/css/site.css` all styles and the themes: default Void Night; the colours earned at the Gate (`pirates`, `cats`, `nomads`, `socialists-earned`); and the manual picks from the faction button (`socialists`, `nomads-pick`, `pirates-pick`, `cats-pick`), each a softer cousin of its earned palette. The button cycles ☭ → boot → skull → cat → back, and its icon turns yellow only while earned colours are on
- `assets/js/site.js` theme toggle, menu, star field, trailer; `assets/js/gate.js` the faction ceremony; `assets/js/hold.js` the four inventory trials (cannonballs, twigs, shards, scroll), each unlocking the next
- Browser storage: `vs-theme` is the theme on screen, `vs-earned` the colours won at the Gate (☭ borrows the screen and hands it back), `vs-hold` how many trials are won
- `assets/fonts/pinyon-script.woff2` (SIL OFL, licence beside it) writes the Gatekeeper's lines
- `assets/img/web/` web-sized images. Regenerate them from the originals with `python3 tools/optimize_images.py`

## Turning on the mailing list

The **Join the Crew** form on the home page (`#crew` in `index.html`) is ready for any email provider (Buttondown, Mailchimp, ConvertKit/Kit, MailerLite). Until it is connected, it only shows a "coming soon" note and sends nothing.

1. In your provider, create an embedded signup form and copy its form **action URL**.
2. In `index.html`, set `data-endpoint="<that URL>"` on the `<form class="crew-form">`.
3. If the provider expects a field name other than `email` (Mailchimp uses `EMAIL`), set `data-field` to match.

Buttons follow one rule everywhere: the main action of a block is brass (`btn--primary`), and the second is bordered (`btn--ghost`). Links to the Gate from other pages are always bordered, so they never look like Join the Crew.

When you change `site.css` or any script, bump the `?v=` value on its `<link>`/`<script>` tags in every page so returning visitors get the new file instead of a cached copy.
