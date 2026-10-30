/* ============================================================
   VibeLoom UI — slides.js
   Dependency-free deck controller: theme init/toggle, keyboard
   navigation, progress bar, per-slide "n / total" page numbers, and
   the optional control bar (prev / next / notes in PDF / present / print).
   Defensive: every lookup is guarded so it never throws if a
   deck (or element) is absent on the page.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Theme: restore from storage or OS, expose a global toggle ---- */
  var KEY = "vl-theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
  }
  try {
    var saved = localStorage.getItem(KEY);
    applyTheme(saved === "dark" ? "dark" : "light");   /* default light */
  } catch (e) { applyTheme("light"); }

  window.vlToggleTheme = function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  };

  document.addEventListener("DOMContentLoaded", function () {
    var deck = document.querySelector(".vl-deck");
    if (!deck) return;
    var slides = Array.prototype.slice.call(deck.querySelectorAll(".vl-slide"));
    if (!slides.length) return;
    var progress = document.querySelector(".vl-deck__progress");
    var total = slides.length;
    /* Each slide's footer shows its own number, so print/PDF pages are right too. */
    slides.forEach(function (s, idx) {
      var own = s.querySelectorAll(".vl-slide__num");
      for (var n = 0; n < own.length; n++) own[n].textContent = (idx + 1) + " / " + total;
    });
    var current = 0;

    function go(i) {
      i = Math.max(0, Math.min(total - 1, i));
      if (slides[i]) slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
    }
    var counts = document.querySelectorAll("[data-vl-deck-count]");
    function render(i) {
      current = i;
      if (progress) progress.style.width = ((i + 1) / total * 100) + "%";
      for (var c = 0; c < counts.length; c++) counts[c].textContent = (i + 1) + " / " + total;
    }
    render(0);

    /* Track the slide filling the viewport. */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].isIntersecting) render(slides.indexOf(entries[k].target));
        }
      }, { root: deck, threshold: 0.55 });
      slides.forEach(function (s) { io.observe(s); });
    } else {
      deck.addEventListener("scroll", function () {
        render(Math.round(deck.scrollTop / deck.clientHeight));
      }, { passive: true });
    }

    /* Print / PDF: a scrolled deck prints offset pages in Chromium, so print from
       the top and restore the reader's place afterwards. */
    var saved = null;
    function toTop() { if (saved === null) { saved = deck.scrollTop; deck.style.scrollBehavior = "auto"; deck.scrollTop = 0; } }
    function restore() { if (saved !== null) { deck.scrollTop = saved; deck.style.scrollBehavior = ""; saved = null; } }
    window.addEventListener("beforeprint", toTop);
    window.addEventListener("afterprint", restore);
    if (window.matchMedia) {
      var mq = window.matchMedia("print");
      var onChange = function (m) { if (m.matches) toTop(); else restore(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    /* Control bar (slides.css): prev / next / notes-in-PDF / present / print. */
    function present() {
      if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
      else if (deck.requestFullscreen) deck.requestFullscreen();
    }
    function syncNotes() {
      var on = deck.classList.contains("vl-deck--handout");
      var bs = document.querySelectorAll('[data-vl-deck="notes"]');
      for (var b = 0; b < bs.length; b++) {
        bs[b].setAttribute("aria-pressed", on ? "true" : "false");
        bs[b].textContent = on ? "Notes in PDF: on" : "Notes in PDF: off";
        bs[b].title = on ? "PDF pages 1440\u00d71080 with the note under each slide" : "PDF pages 1440\u00d7900, slides only";
      }
    }
    var hasNotes = !!deck.querySelector(".vl-slide__notes");
    var noteBtns = document.querySelectorAll('[data-vl-deck="notes"]');
    for (var nb = 0; nb < noteBtns.length; nb++) if (!hasNotes) noteBtns[nb].hidden = true;
    syncNotes();
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-vl-deck]");
      if (!btn) return;
      var act = btn.getAttribute("data-vl-deck");
      if (act === "prev") go(current - 1);
      else if (act === "next") go(current + 1);
      else if (act === "present") present();
      else if (act === "notes") { deck.classList.toggle("vl-deck--handout"); syncNotes(); }
      else if (act === "print") { toTop(); window.print(); }
      else if (act === "theme") { window.vlToggleTheme(); }
      btn.blur();
    });

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      var t = e.target;
      if ((k === " " || k === "Enter") && t && t.closest && t.closest("button, a, input, textarea, select")) return;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " ") { e.preventDefault(); go(current + 1); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); go(current - 1); }
      else if (k === "Home") { e.preventDefault(); go(0); }
      else if (k === "End") { e.preventDefault(); go(total - 1); }
      else if (k === "f" || k === "F") { present(); }
      else if (k === "d" || k === "D") { window.vlToggleTheme(); }
    });
  });
})();
