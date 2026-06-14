/* ============================================================
   VibeLoom UI — Layout behaviours (vanilla, no deps)
   Theme init/toggle · scroll progress · scroll-to-top ·
   mobile drawer · scrollspy.  All guards are defensive:
   missing elements never throw.
   ============================================================ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  /* ---- Theme: localStorage only; defaults to light (dark only when toggled) ---- */
  try {
    var saved = localStorage.getItem("vl-theme");
    root.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
  } catch (e) {
    root.setAttribute("data-theme", "light");
  }

  window.vlToggleTheme = function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("vl-theme", next); } catch (e) {}
  };

  function onReady(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  onReady(function () {
    var progress = doc.querySelector(".vl-progress");
    var scrolltop = doc.querySelector(".vl-scrolltop");
    var menuBtn = doc.querySelector(".vl-menu-btn");
    var sidebar = doc.querySelector(".vl-sidebar");
    var scrim = doc.querySelector(".vl-scrim");
    var toc = doc.querySelector(".vl-toc");
    var links = toc ? toc.querySelectorAll('a[href^="#"]') : [];

    /* ---- Scroll progress + scroll-to-top toggle ---- */
    function onScroll() {
      var st = window.pageYOffset || root.scrollTop || 0;
      var h = root.scrollHeight - root.clientHeight;
      if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
      if (scrolltop) scrolltop.classList.toggle("is-show", st > 600);
      spy(st);
    }

    if (scrolltop) {
      scrolltop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* ---- Mobile drawer ---- */
    function setDrawer(open) {
      if (sidebar) sidebar.classList.toggle("is-open", open);
      if (scrim) scrim.classList.toggle("is-show", open);
    }
    if (menuBtn) menuBtn.addEventListener("click", function () {
      setDrawer(!(sidebar && sidebar.classList.contains("is-open")));
    });
    if (scrim) scrim.addEventListener("click", function () { setDrawer(false); });

    /* ---- Scrollspy ---- */
    function spy(st) {
      if (!links.length) return;
      var pos = st + 120, current = null;
      for (var i = 0; i < links.length; i++) {
        var sec = doc.getElementById(links[i].getAttribute("href").slice(1));
        if (sec && sec.offsetTop <= pos) current = links[i];
      }
      for (var j = 0; j < links.length; j++) {
        links[j].classList.toggle("is-active", links[j] === current);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });
})();
