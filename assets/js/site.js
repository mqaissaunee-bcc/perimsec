/* Perimeter Security — core site behavior.
   No inline handlers; everything binds here. Storage is localStorage under the "ps-" prefix. */
(function () {
  "use strict";

  var C = window.PS_COURSE || {};
  var MODS = window.PS_MODULES || [];
  var GLOSS = window.PS_GLOSSARY || {};
  var PREFIX = C.storagePrefix || "ps-";
  var root = document.documentElement;
  var base = (document.body.getAttribute("data-root") || ".").replace(/\/$/, "");

  /* ---------- storage ---------- */
  var store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(PREFIX + k); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; }
      catch (e) { return false; }
    },
    remove: function (k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { /* ignore */ } },
    keys: function () {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) { out.push(k); }
        }
      } catch (e) { /* ignore */ }
      return out;
    }
  };

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) { Object.keys(attrs).forEach(function (a) { n.setAttribute(a, attrs[a]); }); }
    if (html !== undefined) { n.innerHTML = html; }
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function url(p) { return base + "/" + p; }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* ---------- progress model ---------- */
  function modProgress(n) { return store.get("mod-" + n, { sections: {}, quiz: null }); }
  function saveModProgress(n, p) { store.set("mod-" + n, p); }
  function modPercent(n) {
    var m = MODS.filter(function (x) { return x.n === n; })[0];
    var p = modProgress(n);
    var total = (m && m.sections) || 0;
    if (!total) { return 0; }
    var done = Object.keys(p.sections).filter(function (k) { return p.sections[k]; }).length;
    return Math.min(100, Math.round((done / total) * 100));
  }
  var LABS = window.PS_LABS || {};
  var LABPAGES = window.PS_LAB_PAGES || {};
  function labProgress(n) { return store.get("lab-" + n, { sections: {} }); }
  function saveLabProgress(n, p) { store.set("lab-" + n, p); }
  function labPercent(n) {
    var info = LABPAGES[n];
    var p = labProgress(n);
    var total = (info && info.sections) || 0;
    if (!total) { return 0; }
    var done = Object.keys(p.sections).filter(function (k) { return p.sections[k]; }).length;
    return Math.min(100, Math.round((done / total) * 100));
  }
  function labNumbersInOrder() {
    return Object.keys(LABPAGES).map(Number).sort(function (a, b) { return LABPAGES[a].order - LABPAGES[b].order; });
  }
  function courseStats() {
    var avail = MODS.filter(function (m) { return m.available; });
    var done = 0, started = 0, sum = 0;
    avail.forEach(function (m) {
      var pc = modPercent(m.n);
      sum += pc;
      if (pc >= 100) { done++; } else if (pc > 0) { started++; }
    });
    return { available: avail.length, total: MODS.length, done: done, started: started,
      percent: avail.length ? Math.round(sum / MODS.length) : 0 };
  }

  /* ---------- preferences ---------- */
  var prefs = store.get("prefs", {});
  function applyPrefs() {
    root.setAttribute("data-theme", prefs.theme || "auto");
    root.style.setProperty("--text-scale", String(prefs.scale || 1));
  }
  function themeLabel() {
    var t = prefs.theme || "auto";
    return "Theme: " + t;
  }

  /* ---------- header & footer ---------- */
  var NAV = [
    ["index.html", "Modules"], ["schedule.html", "Schedule"], ["syllabus.html", "Syllabus"],
    ["glossary.html", "Glossary"], ["simulations.html", "Simulations"],
    ["labs/index.html", "Labs"], ["my-work.html", "My work"]
  ];
  function buildHeader() {
    var h = document.getElementById("site-header");
    if (!h) { return; }
    h.className = "site-header";
    var page = document.body.getAttribute("data-page") || "";
    var links = NAV.map(function (n) {
      var cur = (page === n[0]) ? ' aria-current="page"' : "";
      return '<li><a href="' + url(n[0]) + '"' + cur + ">" + n[1] + "</a></li>";
    }).join("");
    h.innerHTML =
      '<div class="bar">' +
        '<a class="brand" href="' + url("index.html") + '">' +
          '<svg class="brand-mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false">' +
            '<rect x="1" y="5" width="24" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
            '<rect x="5" y="10" width="5" height="6" fill="currentColor"/><rect x="16" y="10" width="5" height="6" fill="currentColor"/>' +
            '<circle cx="13" cy="9" r="1.6" fill="#48d46c"/></svg>' +
          "<span>" + esc(C.title || "Perimeter Security") + "</span></a>" +
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
        '<nav class="site-nav" id="site-nav" aria-label="Site"><ul>' + links + "</ul></nav>" +
        '<div class="prefs" role="group" aria-label="Display settings">' +
          '<button type="button" data-pref="smaller" aria-label="Decrease text size">A−</button>' +
          '<button type="button" data-pref="larger" aria-label="Increase text size">A+</button>' +
          '<button type="button" data-pref="theme" aria-label="Change color theme">' + themeLabel() + "</button>" +
        "</div>" +
      "</div>";

    var toggle = h.querySelector(".nav-toggle");
    var nav = h.querySelector(".site-nav");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    h.querySelectorAll("[data-pref]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-pref");
        var s = prefs.scale || 1;
        if (a === "smaller") { prefs.scale = Math.max(0.85, Math.round((s - 0.1) * 100) / 100); }
        if (a === "larger") { prefs.scale = Math.min(1.5, Math.round((s + 0.1) * 100) / 100); }
        if (a === "theme") {
          var order = ["auto", "light", "dark"];
          prefs.theme = order[(order.indexOf(prefs.theme || "auto") + 1) % order.length];
          b.textContent = themeLabel();
        }
        store.set("prefs", prefs);
        applyPrefs();
      });
    });
  }

  function buildFooter() {
    var f = document.getElementById("site-footer");
    if (!f) { return; }
    f.className = "site-footer";
    f.innerHTML = '<div class="inner">' +
      "<p>" + esc(C.title) + " · " + esc(C.institution) + " · " + esc(C.year) + "</p>" +
      "<p>" + esc(C.alignment) + " " + esc(C.disclaimer) + "</p>" +
      "<p>Your progress, answers, and notes are saved only in this browser. Back them up from <a href=\"" + url("my-work.html") + "\">My work</a>.</p>" +
      "</div>";
  }

  /* ---------- home page ---------- */
  function buildFaceplate() {
    var fp = document.getElementById("faceplate");
    if (!fp) { return; }
    var stats = courseStats();
    var ports = MODS.map(function (m) {
      var pc = modPercent(m.n);
      var state = !m.available ? "locked" : (pc >= 100 ? "done" : (pc > 0 ? "progress" : "idle"));
      var stateText = { locked: "coming soon", done: "complete", progress: pc + "% complete", idle: "not started" }[state];
      var label = "Module " + m.n + ", " + m.title + ", " + stateText;
      var inner = '<span class="jack" aria-hidden="true"><span class="led l"></span><span class="led r"></span></span>' +
        '<span class="num" aria-hidden="true">1/' + m.n + "</span>";
      if (!m.available) {
        return '<span class="port" data-state="locked" role="img" aria-label="' + esc(label) + '" title="' + esc(m.title) + ' (coming soon)">' + inner + "</span>";
      }
      return '<a class="port" data-state="' + state + '" href="' + url("modules/" + m.file) + '" aria-label="' + esc(label) + '" title="' + esc(m.title) + '">' + inner + "</a>";
    }).join("");
    fp.innerHTML =
      '<div class="faceplate-head"><span class="model">Course progress</span>' +
      '<span class="status">' + stats.done + " of " + stats.total + " modules complete, " + stats.available + " open</span></div>" +
      '<div class="ports">' + ports + "</div>" +
      '<div class="faceplate-legend" aria-hidden="true"><span><i></i>Not started</span><span><i class="amber"></i>In progress</span><span><i class="green"></i>Complete</span></div>';
    var seen = store.get("booted", false);
    if (!seen) { fp.classList.add("boot"); store.set("booted", true); }
  }

  function weekModuleLink(m) {
    var pc = modPercent(m.n);
    var status = !m.available ? "Coming soon" : (pc >= 100 ? "Complete" : (pc > 0 ? pc + "% done" : "Not started"));
    var inner = '<span class="n">' + pad(m.n) + '</span><span><span class="t">' + esc(m.title) + '</span><span class="d">' + esc(m.short) + "</span></span>" +
      '<span class="s">' + status + "</span>";
    if (!m.available) { return '<div class="mod-link locked">' + inner + "</div>"; }
    return '<a class="mod-link" href="' + url("modules/" + m.file) + '">' + inner + "</a>";
  }

  function weekLabLink(n) {
    var info = LABPAGES[n];
    if (!info) { return ""; }
    var pc = labPercent(n);
    var status = pc >= 100 ? "Reviewed" : (pc > 0 ? pc + "% reviewed" : "Lab companion");
    return '<a class="mod-link lab-link" href="' + url("labs/" + info.file) + '"><span class="n">L' + n + '</span><span><span class="t">Lab ' + n + ": " + esc(LABS[n] || "") +
      '</span><span class="d">Walkthrough, screenshots to capture, and cheat sheet for the NDG Online lab.</span></span><span class="s">' + status + "</span></a>";
  }

  function buildWeeks() {
    var box = document.getElementById("week-list");
    if (!box) { return; }
    var html = (window.PS_WEEKS || []).map(function (w) {
      var items = w.modules.map(function (n) {
        return weekModuleLink(MODS.filter(function (m) { return m.n === n; })[0]);
      }).join("");
      if (!w.checkpoint) { items += w.labs.map(weekLabLink).join(""); }
      if (w.checkpoint) {
        items += '<a class="mod-link checkpoint" href="' + url("capstone.html") + '"><span class="n">✓</span><span><span class="t">' + esc(w.checkpoint) +
          '</span><span class="d">Lab ' + (w.labs[0] || "") + " in NDG Online, then the final exam in Canvas. Open the capstone companion.</span></span><span class=\"s\">Checkpoint</span></a>";
        items += w.labs.map(weekLabLink).join("");
      }
      return '<div class="week-block"><div class="week-label">Week ' + w.week + "<small>Due " + esc(w.due) + "</small></div>" +
        '<div class="week-items">' + items + "</div></div>";
    }).join("");
    box.innerHTML = html;
  }

  /* ---------- module page ---------- */
  var currentSection = null;
  function initModule() {
    var n = parseInt(document.body.getAttribute("data-module"), 10);
    var labN = parseInt(document.body.getAttribute("data-lab"), 10);
    if (!n && !labN) { return; }
    var load = n ? function () { return modProgress(n); } : function () { return labProgress(labN); };
    var save = n ? function (p) { saveModProgress(n, p); } : function (p) { saveLabProgress(labN, p); };
    var units = Array.prototype.slice.call(document.querySelectorAll(".unit[data-section]"));
    var prog = load();
    var rail = document.getElementById("rail-list");
    var meter = document.getElementById("rail-meter");
    var meterLabel = document.getElementById("rail-meter-label");

    function refresh() {
      var done = units.filter(function (u) { return prog.sections[u.getAttribute("data-section")]; }).length;
      var pc = units.length ? Math.round(done / units.length * 100) : 0;
      if (meter) {
        meter.style.width = pc + "%";
        meter.parentNode.setAttribute("aria-valuenow", String(pc));
      }
      if (meterLabel) { meterLabel.textContent = done + " of " + units.length + " sections complete"; }
      units.forEach(function (u) {
        var id = u.getAttribute("data-section");
        var li = rail && rail.querySelector('[data-for="' + id + '"]');
        var isDone = !!prog.sections[id];
        if (li) {
          li.classList.toggle("done", isDone);
          li.querySelector(".tick").textContent = isDone ? "✓" : "○";
          li.querySelector(".vh").textContent = isDone ? " (complete)" : "";
        }
        var b = u.querySelector(".mark-complete");
        if (b) {
          b.setAttribute("aria-pressed", isDone ? "true" : "false");
          b.textContent = isDone ? "Completed" : "Mark section complete";
        }
      });
    }

    // Build rail
    if (rail) {
      var html = "";
      var lastPart = null;
      units.forEach(function (u) {
        var part = u.getAttribute("data-part");
        if (part && part !== lastPart) { html += '<li class="part">' + esc(part) + "</li>"; lastPart = part; }
        var id = u.id;
        var label = u.getAttribute("data-label") || (u.querySelector("h2") || {}).textContent || id;
        html += '<li data-for="' + esc(u.getAttribute("data-section")) + '"><a href="#' + esc(id) + '"><span class="tick" aria-hidden="true">○</span><span>' +
          esc(label) + '<span class="visually-hidden vh"></span></span></a></li>';
      });
      rail.innerHTML = html;
    }

    // Mark-complete buttons
    units.forEach(function (u) {
      if (u.hasAttribute("data-no-mark")) { return; }
      var row = el("div", { "class": "mark-row" });
      var b = el("button", { type: "button", "class": "mark-complete", "aria-pressed": "false" }, "Mark section complete");
      b.addEventListener("click", function () {
        var id = u.getAttribute("data-section");
        prog.sections[id] = !prog.sections[id];
        save(prog);
        refresh();
      });
      row.appendChild(b);
      u.appendChild(row);
    });

    // Let other scripts (quiz) mark sections
    document.addEventListener("ps:section-complete", function (e) {
      prog = load();
      prog.sections[e.detail] = true;
      save(prog);
      refresh();
    });

    // Scroll spy
    if ("IntersectionObserver" in window && rail) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            currentSection = en.target;
            rail.querySelectorAll("a.active").forEach(function (a) { a.classList.remove("active"); });
            var a = rail.querySelector('a[href="#' + en.target.id + '"]');
            if (a) { a.classList.add("active"); }
            updateNotesContext();
          }
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      units.forEach(function (u) { io.observe(u); });
    }
    if (units.length) { currentSection = units[0]; }
    refresh();
    if (n) { buildPager(n); } else { buildLabPager(labN); }
    buildVideo();
  }

  function buildPager(n) {
    var p = document.getElementById("pager");
    if (!p) { return; }
    var prev = MODS.filter(function (m) { return m.n === n - 1; })[0];
    var next = MODS.filter(function (m) { return m.n === n + 1; })[0];
    var html = "";
    if (prev && prev.available) { html += '<a class="prev" href="' + prev.file + '"><small>Previous</small>Module ' + prev.n + ": " + esc(prev.title) + "</a>"; }
    if (next && next.available) { html += '<a class="next" href="' + next.file + '"><small>Next</small>Module ' + next.n + ": " + esc(next.title) + "</a>"; }
    else if (next) { html += '<a class="next" href="' + url("index.html") + '"><small>Next up</small>Module ' + next.n + " opens soon. Back to modules</a>"; }
    p.innerHTML = html;
  }

  /* Lab pages: previous and next lab in the order the course teaches them */
  function buildLabPager(n) {
    var p = document.getElementById("pager");
    if (!p) { return; }
    var order = labNumbersInOrder();
    var i = order.indexOf(n);
    var html = "";
    var prev = order[i - 1], next = order[i + 1];
    if (prev) { html += '<a class="prev" href="' + LABPAGES[prev].file + '"><small>Previous lab</small>Lab ' + prev + ": " + esc(LABS[prev]) + "</a>"; }
    if (next) { html += '<a class="next" href="' + LABPAGES[next].file + '"><small>Next lab</small>Lab ' + next + ": " + esc(LABS[next]) + "</a>"; }
    else { html += '<a class="next" href="index.html"><small>All labs</small>Back to the lab companions</a>'; }
    p.innerHTML = html;
  }

  /* Lab pages: copy buttons on command and filter blocks, and a cheat-sheet-only print */
  function initLabTools() {
    if (!document.body.hasAttribute("data-lab")) { return; }
    document.querySelectorAll("pre.cli").forEach(function (pre) {
      var wrap = el("div", { "class": "cli-wrap" });
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var b = el("button", { type: "button", "class": "copy-btn" }, "Copy");
      b.setAttribute("aria-label", "Copy " + (pre.getAttribute("data-kind") || "command"));
      b.addEventListener("click", function () {
        var text = Array.prototype.map.call(pre.querySelectorAll(".cmd"), function (c) { return c.textContent; }).join("\n") || pre.textContent;
        function done(ok) { b.textContent = ok ? "Copied" : "Select and copy"; setTimeout(function () { b.textContent = "Copy"; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
          var ta = el("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
          ta.remove(); done(ok);
        }
      });
      wrap.appendChild(b);
    });
    document.querySelectorAll("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () {
        var only = b.getAttribute("data-print");
        if (only) { document.body.classList.add("print-only-" + only); }
        window.print();
      });
    });
    window.addEventListener("afterprint", function () {
      document.body.className = document.body.className.replace(/\bprint-only-\S+/g, "").trim();
    });
  }

  /* Overview video: set data-embed (iframe URL) or data-link (external page) on .video-slot */
  function buildVideo() {
    document.querySelectorAll(".video-slot").forEach(function (v) {
      var embed = v.getAttribute("data-embed");
      var link = v.getAttribute("data-link");
      var title = v.getAttribute("data-title") || "Module overview video";
      if (embed) {
        var wrap = el("div", { "class": "video-frame" });
        wrap.appendChild(el("iframe", { src: embed, title: title, allow: "fullscreen; picture-in-picture", allowfullscreen: "", loading: "lazy" }));
        v.replaceWith(wrap);
      } else if (link) {
        v.querySelector("p").innerHTML = '<strong>' + esc(title) + '.</strong> <a href="' + esc(link) + '" target="_blank" rel="noopener">Watch the overview video (opens in a new tab)</a>';
      }
    });
  }

  /* ---------- glossary tooltips ---------- */
  var tip = null;
  function showTip(target) {
    var key = target.getAttribute("data-term");
    var g = GLOSS[key];
    if (!g) { return; }
    hideTip();
    tip = el("div", { "class": "gloss-tip", role: "tooltip", id: "gloss-tip" }, "<strong>" + esc(g.t) + "</strong>" + esc(g.d));
    document.body.appendChild(tip);
    var r = target.getBoundingClientRect();
    var top = window.scrollY + r.bottom + 8;
    var left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 8));
    tip.style.top = top + "px";
    tip.style.left = left + "px";
    target.setAttribute("aria-describedby", "gloss-tip");
  }
  function hideTip() {
    if (tip) { tip.remove(); tip = null; }
    document.querySelectorAll('dfn[aria-describedby="gloss-tip"]').forEach(function (d) { d.removeAttribute("aria-describedby"); });
  }
  function initTips() {
    document.querySelectorAll("dfn[data-term]").forEach(function (d) {
      if (!GLOSS[d.getAttribute("data-term")]) { return; }
      d.setAttribute("tabindex", "0");
      d.addEventListener("mouseenter", function () { showTip(d); });
      d.addEventListener("mouseleave", hideTip);
      d.addEventListener("focus", function () { showTip(d); });
      d.addEventListener("blur", hideTip);
      d.addEventListener("click", function (e) { e.preventDefault(); if (tip) { hideTip(); } else { showTip(d); } });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { hideTip(); } });
  }

  /* ---------- notes panel ---------- */
  var notesPanel, notesArea, notesCtx, notesSaved, notesTab = "section";
  function notesPageKey() {
    var lab = document.body.getAttribute("data-lab");
    return document.body.getAttribute("data-module") || (lab ? "lab" + lab : "page");
  }
  function notesKey() {
    var n = notesPageKey();
    if (notesTab === "scratch") { return "notes-" + n + "-scratch"; }
    var s = currentSection ? currentSection.getAttribute("data-section") : "general";
    return "notes-" + n + "-" + s;
  }
  function updateNotesContext() {
    if (!notesPanel || notesPanel.hidden) { return; }
    loadNote();
  }
  function loadNote() {
    var label = notesTab === "scratch" ? (document.body.hasAttribute("data-lab") ? "Scratchpad for this lab" : "Scratchpad for this module")
      : "Notes for: " + (currentSection ? (currentSection.getAttribute("data-label") || "this section") : "this page");
    notesCtx.textContent = label;
    notesArea.value = store.get(notesKey(), "");
    notesSaved.textContent = "";
  }
  function collectNotes() {
    var n = notesPageKey();
    var title = document.title;
    var parts = [];
    document.querySelectorAll(".unit[data-section]").forEach(function (u) {
      var v = store.get("notes-" + n + "-" + u.getAttribute("data-section"), "");
      if (v) { parts.push({ h: u.getAttribute("data-label") || u.id, t: v }); }
    });
    var scratch = store.get("notes-" + n + "-scratch", "");
    if (scratch) { parts.push({ h: "Scratchpad", t: scratch }); }
    return { title: title, parts: parts };
  }
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = el("a", { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportNotes(kind) {
    var d = collectNotes();
    var lab = document.body.getAttribute("data-lab");
    var slug = lab ? "notes-lab-" + lab : "notes-module-" + (document.body.getAttribute("data-module") || "page");
    if (!d.parts.length) { notesSaved.textContent = "No notes to export yet."; return; }
    if (kind === "md") {
      var md = "# " + d.title + "\n\n" + d.parts.map(function (p) { return "## " + p.h + "\n\n" + p.t + "\n"; }).join("\n");
      download(slug + ".md", "text/markdown", md);
    } else {
      var body = d.parts.map(function (p) { return "<h2>" + esc(p.h) + "</h2><p>" + esc(p.t).replace(/\n/g, "<br>") + "</p>"; }).join("");
      var doc = '<html><head><meta charset="utf-8"><title>' + esc(d.title) + "</title></head><body><h1>" + esc(d.title) + "</h1>" + body + "</body></html>";
      download(slug + ".doc", "application/msword", doc);
    }
    notesSaved.textContent = "Exported.";
  }
  function initNotes() {
    if (!document.body.hasAttribute("data-module") && !document.body.hasAttribute("data-lab")) { return; }
    var fab = el("button", { type: "button", "class": "notes-fab", "aria-expanded": "false", "aria-controls": "notes-panel" }, "Notes");
    notesPanel = el("aside", { "class": "notes-panel", id: "notes-panel", "aria-label": "Notes" });
    notesPanel.hidden = true;
    notesPanel.innerHTML =
      '<header><h2>Notes</h2><button type="button" class="btn-quiet" data-n="close" aria-label="Close notes">Close</button></header>' +
      '<div class="notes-tabs" role="tablist" aria-label="Notes view">' +
        '<button type="button" role="tab" aria-selected="true" data-n="section">This section</button>' +
        '<button type="button" role="tab" aria-selected="false" data-n="scratch">Scratchpad</button></div>' +
      '<p class="ctx" id="notes-ctx"></p>' +
      '<label for="notes-area" class="visually-hidden">Your notes</label>' +
      '<textarea id="notes-area" placeholder="Type your notes. They save automatically in this browser."></textarea>' +
      '<p class="saved" aria-live="polite"></p>' +
      '<div class="btn-row"><button type="button" data-n="md">Export Markdown</button><button type="button" data-n="doc">Export Word</button><button type="button" data-n="clear">Clear this note</button></div>';
    document.body.appendChild(fab);
    document.body.appendChild(notesPanel);
    notesArea = notesPanel.querySelector("textarea");
    notesCtx = notesPanel.querySelector(".ctx");
    notesSaved = notesPanel.querySelector(".saved");
    var timer;
    notesArea.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        store.set(notesKey(), notesArea.value);
        notesSaved.textContent = "Saved";
      }, 400);
    });
    function open(state) {
      notesPanel.hidden = !state;
      fab.setAttribute("aria-expanded", state ? "true" : "false");
      if (state) { loadNote(); notesArea.focus(); } else { fab.focus(); }
    }
    fab.addEventListener("click", function () { open(notesPanel.hidden); });
    notesPanel.addEventListener("keydown", function (e) { if (e.key === "Escape") { open(false); } });
    notesPanel.querySelectorAll("[data-n]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-n");
        if (a === "close") { open(false); }
        if (a === "section" || a === "scratch") {
          notesTab = a;
          notesPanel.querySelectorAll('[role="tab"]').forEach(function (t) { t.setAttribute("aria-selected", t === b ? "true" : "false"); });
          loadNote();
        }
        if (a === "md" || a === "doc") { exportNotes(a); }
        if (a === "clear") { notesArea.value = ""; store.remove(notesKey()); notesSaved.textContent = "Cleared"; }
      });
    });
  }

  /* ---------- UI path helper: <span class="path" data-path="Device > Setup"> ---------- */
  function initPaths() {
    document.querySelectorAll(".path[data-path]").forEach(function (p) {
      var parts = p.getAttribute("data-path").split(">").map(function (s) { return s.trim(); });
      p.innerHTML = parts.map(function (s) { return "<span>" + esc(s) + "</span>"; }).join('<span class="sep" aria-hidden="true">›</span>');
      p.setAttribute("aria-label", "Web interface path: " + parts.join(", then "));
    });
  }

  /* ---------- expose for other scripts ---------- */
  window.PS = {
    store: store, esc: esc, el: el, url: url, pad: pad,
    modProgress: modProgress, saveModProgress: saveModProgress, modPercent: modPercent, courseStats: courseStats,
    labProgress: labProgress, labPercent: labPercent, labNumbersInOrder: labNumbersInOrder,
    download: download
  };

  applyPrefs();
  buildHeader();
  buildFooter();
  initPaths();
  buildFaceplate();
  buildWeeks();
  initModule();
  initLabTools();
  initTips();
  initNotes();
})();
/* Course assistant: add the chat button to every page that loads site.js */
(function () {
  var s = document.createElement("script");
  s.src = new URL("../../assistant.js", document.currentScript.src).href;
  s.defer = true;
  document.body.appendChild(s);
})();