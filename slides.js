/* ============================================================
   VibeLoom UI — slides.js
   Dependency-free deck controller: theme init/toggle, keyboard
   navigation, progress bar, and live "n / total" page numbers.
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
    var nums = Array.prototype.slice.call(deck.querySelectorAll(".vl-slide__num"));
    var total = slides.length;
    var current = 0;

    function go(i) {
      i = Math.max(0, Math.min(total - 1, i));
      if (slides[i]) slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function render(i) {
      current = i;
      if (progress) progress.style.width = ((i + 1) / total * 100) + "%";
      for (var n = 0; n < nums.length; n++) nums[n].textContent = (i + 1) + " / " + total;
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

    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " ") { e.preventDefault(); go(current + 1); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); go(current - 1); }
      else if (k === "Home") { e.preventDefault(); go(0); }
      else if (k === "End") { e.preventDefault(); go(total - 1); }
      else if (k === "f" || k === "F") {
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
        else if (deck.requestFullscreen) deck.requestFullscreen();
      }
      else if (k === "d" || k === "D") { window.vlToggleTheme(); }
    });
  });
})();
