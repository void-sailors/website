# VoidSailors.com

The official site for *VoidSailors: Where Truth Lies*, a GameLit novel by E. J. Perry. Static HTML, CSS and JavaScript served by GitHub Pages; no build step.

- `index.html` home, `book.html` the book, `gate.html` Triage by the Gate, `404.html`
- `assets/css/site.css` all styles and the five themes (default Void Night, plus Socialists, Pirates, C.A.T.s and Nomads)
- `assets/js/site.js` theme toggle, menu, star field, trailer; `assets/js/gate.js` the faction ceremony
- `assets/img/web/` web-sized images. Regenerate them from the originals with `python3 tools/optimize_images.py`

## Turning on the mailing list

The **Join the Crew** form on the home page (`#crew` in `index.html`) is ready for any email provider (Buttondown, Mailchimp, ConvertKit/Kit, MailerLite). Until it is connected, it only shows a "coming soon" note and sends nothing.

1. In your provider, create an embedded signup form and copy its form **action URL**.
2. In `index.html`, set `data-endpoint="<that URL>"` on the `<form class="crew-form">`.
3. If the provider expects a field name other than `email` (Mailchimp uses `EMAIL`), set `data-field` to match.

Button styles have fixed jobs: brass (`btn--primary`) is only for Join the Crew, and the glowing portal style (`btn--gate`) is only for the Gate.
