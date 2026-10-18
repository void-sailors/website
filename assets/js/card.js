/* VoidSailors — the pocket card: the share window, and the offline copy for the home-screen app. */
(() => {
  const SITE = "https://voidsailors.com/";

  /* ---------- Share: show the code, or send the link ---------- */
  const share = document.getElementById("share");
  const status = share && share.querySelector(".vcard-share__status");
  document.querySelectorAll("[data-share-open]").forEach((b) => b.addEventListener("click", () => {
    if (!share || typeof share.showModal !== "function") { location.href = SITE; return; }
    status.textContent = "";
    share.showModal();
  }));
  if (share) {
    share.querySelector("[data-close]").addEventListener("click", () => share.close());
    share.addEventListener("click", (e) => { if (e.target === share) share.close(); });
    share.querySelector("[data-share-link]").addEventListener("click", async () => {
      const data = {
        title: "VoidSailors: Where Truth Lies",
        text: "Five days. Four factions. No second runs. A GameLit novel by E. J. Perry.",
        url: SITE,
      };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(SITE);
        status.textContent = "Link copied. Paste it anywhere.";
      } catch (err) {
        if (err && err.name === "AbortError") return; // closed the share sheet
        status.textContent = "voidsailors.com";
      }
    });
  }

  /* ---------- Pop-up window: the app never hands over to the browser ----------
     Only in the home-screen app (site.js marks it .is-app). Links to the site's pages open in a
     full-screen window over the card; the page inside drops its nav bar and footer (?embed).
     In a browser these links simply go to the page as usual. */
  const PAGES = {
    "/": "VoidSailors", "/index.html": "VoidSailors", "/book.html": "The Book", "/sample.html": "Chapter One",
    "/gate.html": "The Gate", "/lore.html": "Lore", "/privacy.html": "Privacy Policy",
  };
  const panel = document.getElementById("panel");
  if (panel && document.documentElement.classList.contains("is-app") && typeof panel.showModal === "function") {
    const frame = panel.querySelector("iframe");
    const title = panel.querySelector(".vpanel__title");
    const show = (href) => {
      const url = new URL(href, location.href);
      if (url.pathname === "/card.html" || url.pathname === "/card") { panel.close(); return; }
      const name = PAGES[url.pathname];
      if (!name) { location.href = url.href; return; }
      title.textContent = name;
      frame.title = name;
      panel.classList.remove("is-ready");
      frame.src = `${url.pathname}?embed${url.hash}`;
      if (!panel.open) panel.showModal();
    };
    frame.addEventListener("load", () => { if (frame.src && !frame.src.startsWith("about:")) panel.classList.add("is-ready"); });
    // Card links: the Book, Chapter 1, the Gate, the home and privacy pages.
    document.addEventListener("click", (e) => {
      const link = e.target.closest && e.target.closest("a[href]");
      if (!link || panel.contains(link) || link.target === "_blank" || link.hasAttribute("data-crew-open")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !PAGES[url.pathname]) return;
      e.preventDefault();
      show(url.href);
    });
    // Links inside the window ask for the next page here instead of leaving it.
    window.addEventListener("message", (e) => {
      if (e.origin === location.origin && e.source === frame.contentWindow && e.data && typeof e.data.vsOpen === "string") show(e.data.vsOpen);
    });
    panel.querySelector("[data-close]").addEventListener("click", () => panel.close());
    panel.addEventListener("close", () => { frame.src = "about:blank"; panel.classList.remove("is-ready"); });
  }

  /* ---------- Offline: the card opens even with no signal ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("card-sw.js", { scope: "./card" }).catch(() => {});
    });
  }
})();
