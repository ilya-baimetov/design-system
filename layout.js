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

/* ============================================================
   Decisions (components.css §21): for every [data-vl-form] container
   save/restore answers per page, auto-select the --own option when
   its note gets text and nothing else is chosen, count decided issues, mirror notes for print,
   and wire [data-vl-action="copy|download|print|reset"] buttons.
   Storage and clipboard are best-effort: every call is guarded.
   ============================================================ */
(function () {
  "use strict";
  var doc = document;

  function onReady(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }
  function txt(el) {
    if (!el) return "";
    var c = el.cloneNode(true);
    var drop = c.querySelectorAll(".vl-choice__badge, .vl-choice__key");
    for (var i = 0; i < drop.length; i++) drop[i].parentNode.removeChild(drop[i]);
    return c.textContent.replace(/\s+/g, " ").trim();
  }

  function initForm(form) {
    var id = form.getAttribute("data-vl-form") || "form";
    var key = "vl-form:" + location.pathname + ":" + id;
    var fields = form.querySelectorAll("input[name], textarea[name]");
    var statusEl = form.querySelector("[data-vl-status]");
    var out = form.querySelector("textarea[data-vl-export-out]");
    var statusTimer = null;

    function mirror(t) {
      var p = t.parentNode && t.parentNode.querySelector(".vl-field__print");
      if (p) p.textContent = t.value;
    }
    function mirrorAll() {
      var ts = form.querySelectorAll("textarea.vl-field__input");
      for (var i = 0; i < ts.length; i++) mirror(ts[i]);
    }
    function say(msg) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(count, 4000);
    }
    function count() {
      var ds = form.querySelectorAll(".vl-decision"), n = 0;
      for (var i = 0; i < ds.length; i++) if (ds[i].querySelector(".vl-choice > input:checked")) n++;
      var msg = n + " of " + ds.length + " decided";
      var cs = doc.querySelectorAll("[data-vl-count]");
      for (var j = 0; j < cs.length; j++) cs[j].textContent = msg;
      if (statusEl && !statusEl.hasAttribute("data-vl-count")) statusEl.textContent = msg;
    }
    function save() {
      var data = {};
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.hasAttribute("data-vl-export-out")) continue;
        if (f.type === "radio") { if (f.checked) data[f.name] = f.value; }
        else if (f.type === "checkbox") data[f.name] = f.checked;
        else data[f.name] = f.value;
      }
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    }
    function restore() {
      var data = null;
      try { data = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) {}
      if (!data) return;
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (!(f.name in data)) continue;
        if (f.type === "radio") f.checked = data[f.name] === f.value;
        else if (f.type === "checkbox") f.checked = !!data[f.name];
        else f.value = data[f.name];
      }
    }
    function exportText() {
      var title = form.getAttribute("data-vl-title") || doc.title;
      var lines = ["# " + title, "", "Exported " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC"];
      var ds = form.querySelectorAll(".vl-decision"), done = 0;
      for (var i = 0; i < ds.length; i++) if (ds[i].querySelector(".vl-choice > input:checked")) done++;
      lines.push(done + " of " + ds.length + " decided", "");
      for (var k = 0; k < ds.length; k++) {
        var d = ds[k];
        var num = txt(d.querySelector(".vl-decision__num"));
        lines.push("## " + (num ? num + ". " : "") + txt(d.querySelector(".vl-decision__title")));
        var c = d.querySelector(".vl-choice > input:checked");
        if (c) {
          var lab = c.parentNode;
          var keyEl = lab.querySelector(".vl-choice__key");
          var keyTxt = keyEl ? keyEl.textContent.trim() + " " : "";
          lines.push("Choice: " + keyTxt + txt(lab.querySelector(".vl-choice__title")) +
            (lab.classList.contains("vl-choice--rec") ? " (recommended)" : ""));
        } else {
          lines.push("Choice: (open)");
        }
        var note = d.querySelector("textarea.vl-field__input");
        if (note && note.value.trim()) lines.push("Note: " + note.value.trim().replace(/\n+/g, " / "));
        lines.push("");
      }
      var groups = form.querySelectorAll("fieldset.vl-choices");
      for (var g = 0; g < groups.length; g++) {
        var fs = groups[g];
        if (fs.closest(".vl-decision")) continue;
        var boxes = fs.querySelectorAll(".vl-choice > input[type=checkbox]");
        if (!boxes.length) continue;
        lines.push("## " + (txt(fs.querySelector("legend")) || "Checklist"));
        for (var b = 0; b < boxes.length; b++) {
          lines.push("- [" + (boxes[b].checked ? "x" : " ") + "] " + txt(boxes[b].parentNode.querySelector(".vl-choice__title")));
        }
        lines.push("");
      }
      return lines.join("\n");
    }
    function showOut(text) {
      if (!out) return;
      out.value = text;
      var wrap = out.closest("[hidden]");
      if (wrap) wrap.hidden = false;
    }
    function copy() {
      var text = exportText();
      showOut(text);
      function fallback() {
        if (!out) { say("Copy blocked here"); return; }
        try {
          out.focus(); out.select();
          var ok = doc.execCommand && doc.execCommand("copy");
          say(ok ? "Copied to clipboard" : "Copy blocked here: select the text below");
        } catch (e) { say("Copy blocked here: select the text below"); }
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { say("Copied to clipboard"); }, fallback);
        } else fallback();
      } catch (e) { fallback(); }
    }
    function download() {
      var text = exportText();
      showOut(text);
      try {
        var blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = doc.createElement("a");
        a.href = url; a.download = (form.getAttribute("data-vl-file") || id) + ".md";
        doc.body.appendChild(a); a.click(); doc.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        say("Downloaded " + a.download);
      } catch (e) { say("Download blocked here: copy the text below"); }
    }
    function reset(btn) {
      if (btn.getAttribute("data-vl-armed") !== "1") {
        btn.setAttribute("data-vl-armed", "1");
        btn.setAttribute("data-vl-label", btn.textContent);
        btn.textContent = "Click again to clear";
        setTimeout(function () {
          if (btn.getAttribute("data-vl-armed") === "1") {
            btn.removeAttribute("data-vl-armed");
            btn.textContent = btn.getAttribute("data-vl-label");
          }
        }, 3500);
        return;
      }
      btn.removeAttribute("data-vl-armed");
      btn.textContent = btn.getAttribute("data-vl-label");
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.type === "radio" || f.type === "checkbox") f.checked = false;
        else f.value = "";
      }
      try { localStorage.removeItem(key); } catch (e) {}
      mirrorAll(); count(); say("Cleared");
    }

    form.addEventListener("input", function (e) {
      var t = e.target;
      if (t.tagName === "TEXTAREA" && !t.hasAttribute("data-vl-export-out")) {
        mirror(t);
        var d = t.closest(".vl-decision");
        var own = d && d.querySelector(".vl-choice--own > input");
        if (own && t.value.trim() && !d.querySelector(".vl-choice > input:checked")) own.checked = true;
      }
      save(); count();
    });
    form.addEventListener("change", function () { save(); count(); });
    form.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-vl-action]");
      if (!btn || !form.contains(btn)) return;
      var act = btn.getAttribute("data-vl-action");
      if (act === "copy") copy();
      else if (act === "download") download();
      else if (act === "print") { mirrorAll(); window.print(); }
      else if (act === "reset") reset(btn);
    });
    window.addEventListener("beforeprint", mirrorAll);

    restore(); mirrorAll(); count();
  }

  onReady(function () {
    var forms = doc.querySelectorAll("[data-vl-form]");
    for (var i = 0; i < forms.length; i++) initForm(forms[i]);
  });
})();
