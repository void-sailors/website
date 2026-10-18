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

  /* ---------- Offline: the card opens even with no signal ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("card-sw.js", { scope: "./card" }).catch(() => {});
    });
  }
})();
