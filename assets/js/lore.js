/* LORE: type size and Paper, sharing the chapter reader's saved choices. */
(() => {
  const root = document.documentElement;
  const sizeBtns = document.querySelectorAll(".volume-bar [data-size]");
  const paperBtn = document.querySelector(".volume-bar [data-paper]");
  if (!paperBtn) return;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const SIZES = [16, 17, 18, 19, 20, 22, 24];
  let ix = parseInt(store.get("vs-sample-size"), 10);
  if (!(ix >= 0 && ix < SIZES.length)) ix = innerWidth >= 960 ? 3 : 2;

  const paintSize = () => {
    root.style.setProperty("--lore-size", SIZES[ix] + "px");
    sizeBtns.forEach((b) => { const n = ix + Number(b.dataset.size); b.disabled = n < 0 || n >= SIZES.length; });
  };
  sizeBtns.forEach((b) => b.addEventListener("click", () => {
    const n = ix + Number(b.dataset.size);
    if (n < 0 || n >= SIZES.length) return;
    ix = n;
    store.set("vs-sample-size", String(n));
    paintSize();
  }));

  const paintPaper = () => paperBtn.setAttribute("aria-pressed", String(root.classList.contains("lore-paper")));
  // Same fade as the chapter reader: it runs only on a tap, and taps wait for it to finish so quick repeats can't flicker.
  const volume = document.querySelector(".volume");
  let fading = 0;
  paperBtn.addEventListener("click", () => {
    if (fading) return;
    if (volume) volume.classList.add("is-fading");
    const on = root.classList.toggle("lore-paper");
    store.set("vs-sample-paper", on ? "1" : "0");
    paintPaper();
    fading = setTimeout(() => { if (volume) volume.classList.remove("is-fading"); fading = 0; }, 750);
  });

  paintSize();
  paintPaper();
})();
