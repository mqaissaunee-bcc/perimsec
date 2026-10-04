/* Renderers for the schedule, glossary, simulations index, and My work pages. */
(function () {
  "use strict";
  var PS = window.PS;
  if (!PS) { return; }
  var esc = PS.esc, store = PS.store;
  var MODS = window.PS_MODULES || [];
  var LABS = window.PS_LABS || {};
  var GLOSS = window.PS_GLOSSARY || {};
  var page = document.body.getAttribute("data-page");
  function mod(n) { return MODS.filter(function (m) { return m.n === n; })[0]; }
  function modLink(m) {
    var t = "Module " + m.n + ": " + esc(m.title);
    return m.available ? '<a href="' + PS.url("modules/" + m.file) + '">' + t + "</a>" : t + " <small>(opens soon)</small>";
  }

  /* ---------- schedule ---------- */
  if (page === "schedule.html") {
    var tb = document.getElementById("schedule-body");
    tb.innerHTML = (window.PS_WEEKS || []).map(function (w) {
      var mods = w.modules.map(function (n) { return modLink(mod(n)); }).join("<br>");
      if (w.checkpoint) { mods = mods ? mods + "<br>" : ""; mods += "<strong>" + esc(w.checkpoint) + "</strong>"; }
      var labs = w.labs.length ? w.labs.map(function (l) { return "Lab " + l + ": " + esc(LABS[l]); }).join("<br>") : "None";
      var quizzes = w.quizzes.length ? w.quizzes.map(function (q) { return "Quiz " + q; }).join(", ") : (w.week === 11 ? "Final exam" : "None");
      return "<tr><th scope=\"row\">Week " + w.week + "</th><td>" + mods + (w.note ? "<br><small>" + esc(w.note) + "</small>" : "") +
        "</td><td>" + labs + "</td><td>" + quizzes + "</td><td>" + esc(w.due) + "</td></tr>";
    }).join("");
  }

  /* ---------- glossary ---------- */
  if (page === "glossary.html") {
    var keys = Object.keys(GLOSS).sort(function (a, b) { return GLOSS[a].t.toLowerCase().localeCompare(GLOSS[b].t.toLowerCase()); });
    var list = document.getElementById("gloss-list");
    var nav = document.getElementById("alpha-nav");
    var search = document.getElementById("gloss-search");
    var count = document.getElementById("gloss-count");
    function render(q) {
      q = (q || "").toLowerCase();
      var letters = {};
      var html = "";
      var shown = 0;
      keys.forEach(function (k) {
        var g = GLOSS[k];
        if (q && (g.t + " " + g.d).toLowerCase().indexOf(q) === -1) { return; }
        shown++;
        var L = g.t.charAt(0).toUpperCase();
        var anchor = "";
        if (!letters[L]) { letters[L] = true; anchor = ' data-letter="' + L + '"'; }
        var mods = (g.m || []).map(function (n) {
          var m = mod(n);
          return m && m.available ? '<a href="' + PS.url("modules/" + m.file) + '">Module ' + n + "</a>" : "Module " + n;
        }).join(", ");
        html += '<dt id="g-' + esc(k) + '"' + anchor + ">" + esc(g.t) + "</dt><dd>" + esc(g.d) + (mods ? '<span class="mods">See ' + mods + "</span>" : "") + "</dd>";
      });
      list.innerHTML = html;
      list.querySelectorAll("dt[data-letter]").forEach(function (dt) { dt.setAttribute("data-anchor", "letter-" + dt.getAttribute("data-letter")); });
      nav.innerHTML = Object.keys(letters).map(function (L) { return '<a href="#g-first-' + L + '">' + L + "</a>"; }).join("");
      list.querySelectorAll("dt[data-letter]").forEach(function (dt) {
        var span = document.createElement("span");
        span.id = "g-first-" + dt.getAttribute("data-letter");
        dt.prepend(span);
      });
      count.textContent = shown + " terms" + (q ? " match" : "");
    }
    search.addEventListener("input", function () { render(search.value); });
    render("");
  }

  /* ---------- simulations index ---------- */
  if (page === "simulations.html") {
    var box = document.getElementById("sim-list");
    box.innerHTML = (window.PS_SIMS || []).slice().sort(function (a, b) { return a.module - b.module; }).map(function (s) {
      var m = mod(s.module);
      var label = "Module " + s.module + ": " + esc(m.title);
      if (m.available) {
        return '<a href="' + PS.url("modules/" + m.file + "#" + s.anchor) + '"><span class="t">' + esc(s.title) + '</span><span class="d">' + label + ". " + esc(s.desc) + "</span></a>";
      }
      return '<div class="locked"><span class="t">' + esc(s.title) + '</span><span class="d">' + label + " (opens soon). " + esc(s.desc) + "</span></div>";
    }).join("");
  }

  /* ---------- my work ---------- */
  if (page === "my-work.html") {
    var stats = PS.courseStats();
    document.getElementById("mw-stats").innerHTML =
      "<div><dt>Course progress</dt><dd>" + stats.percent + "%</dd></div>" +
      "<div><dt>Modules complete</dt><dd>" + stats.done + " / " + stats.total + "</dd></div>" +
      "<div><dt>In progress</dt><dd>" + stats.started + "</dd></div>";
    var rows = MODS.filter(function (m) { return m.available; }).map(function (m) {
      var p = PS.modProgress(m.n);
      var q = p.quiz ? p.quiz.best + "% best (" + p.quiz.attempts + " attempt" + (p.quiz.attempts === 1 ? "" : "s") + ")" : "Not taken";
      return "<tr><th scope=\"row\">" + modLink(m) + "</th><td>" + PS.modPercent(m.n) + "%</td><td>" + q + "</td></tr>";
    }).join("");
    document.getElementById("mw-table").innerHTML = rows;

    var status = document.getElementById("mw-status");
    document.getElementById("mw-export").addEventListener("click", function () {
      var data = { site: "perimeter-security", exported: new Date().toISOString(), items: {} };
      store.keys().forEach(function (k) { try { data.items[k] = localStorage.getItem(k); } catch (e) { /* skip */ } });
      var d = new Date();
      var stamp = d.getFullYear() + "-" + PS.pad(d.getMonth() + 1) + "-" + PS.pad(d.getDate());
      PS.download("perimeter-security-backup-" + stamp + ".json", "application/json", JSON.stringify(data, null, 2));
      status.textContent = "Backup downloaded with " + Object.keys(data.items).length + " saved items.";
    });
    document.getElementById("mw-notes").addEventListener("click", function () {
      var out = "# My notes: Perimeter Security\n\n";
      var found = 0;
      MODS.forEach(function (m) {
        var block = "";
        store.keys().forEach(function (k) {
          var pre = "ps-notes-" + m.n + "-";
          if (k.indexOf(pre) === 0) {
            var v = store.get(k.replace("ps-", ""), "");
            if (v) { block += "### " + k.replace(pre, "") + "\n\n" + v + "\n\n"; found++; }
          }
        });
        if (block) { out += "## Module " + m.n + ": " + m.title + "\n\n" + block; }
      });
      if (!found) { status.textContent = "No notes saved yet. Open Notes on any module page to start."; return; }
      PS.download("perimeter-security-notes.md", "text/markdown", out);
      status.textContent = "Notes downloaded (" + found + " notes).";
    });
    var file = document.getElementById("mw-file");
    document.getElementById("mw-import").addEventListener("click", function () {
      if (!file.files.length) { status.textContent = "Choose a backup file first."; return; }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!data || data.site !== "perimeter-security" || !data.items) { throw new Error("bad"); }
          var n = 0;
          Object.keys(data.items).forEach(function (k) {
            if (k.indexOf("ps-") === 0) { localStorage.setItem(k, data.items[k]); n++; }
          });
          status.textContent = "Restored " + n + " items. Reload any open module pages to see them.";
        } catch (e) {
          status.textContent = "That file is not a Perimeter Security backup. Choose the .json file downloaded from this page.";
        }
      };
      reader.readAsText(file.files[0]);
    });
    document.getElementById("mw-reset").addEventListener("click", function () {
      var ok = window.confirm("Erase all progress, answers, and notes saved by this site in this browser? Download a backup first if you want to keep them.");
      if (!ok) { return; }
      store.keys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
      status.textContent = "All saved work for this site was erased from this browser.";
    });
  }
})();
