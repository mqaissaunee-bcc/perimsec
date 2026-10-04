/* Reusable activity widgets. Each widget reads its data from a
   <script type="application/json"> child, so module pages hold content, not code. */
(function () {
  "use strict";
  var PS = window.PS;
  if (!PS) { return; }
  var store = PS.store, esc = PS.esc, el = PS.el;

  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }
  function readData(box) {
    var s = box.querySelector('script[type="application/json"]');
    if (!s) { return null; }
    try { return JSON.parse(s.textContent); } catch (e) { return null; }
  }
  function live(box) {
    var r = box.querySelector(".act-result");
    if (!r) {
      var row = el("div", { "class": "act-actions" });
      r = el("p", { "class": "act-result", "aria-live": "polite" });
      row.appendChild(r);
      box.appendChild(row);
    }
    return r;
  }
  function actionsRow(box) {
    var row = el("div", { "class": "act-actions" });
    box.appendChild(row);
    return row;
  }

  /* ---- sort / classify: each item gets a select of buckets ---- */
  function sortActivity(box, d) {
    var id = box.getAttribute("data-id");
    var wrap = el("div");
    var items = d.shuffle === false ? d.items : shuffle(d.items);
    items.forEach(function (it, i) {
      var row = el("div", { "class": "act-row" });
      var selId = id + "-s" + i;
      row.innerHTML = '<label for="' + selId + '" style="font-weight:400;font-size:inherit">' + esc(it.text) + "</label>" +
        '<select id="' + selId + '"><option value="">Choose…</option>' +
        d.buckets.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("") +
        "</select>" + '<p class="why" hidden></p>';
      row._item = it;
      wrap.appendChild(row);
    });
    box.appendChild(wrap);
    var row = actionsRow(box);
    var check = el("button", { type: "button", "class": "btn-primary" }, "Check answers");
    var reset = el("button", { type: "button" }, "Try again");
    var result = el("p", { "class": "act-result", "aria-live": "polite" });
    row.appendChild(check); row.appendChild(reset); row.appendChild(result);
    check.addEventListener("click", function () {
      var right = 0, answered = 0;
      wrap.querySelectorAll(".act-row").forEach(function (r) {
        var v = r.querySelector("select").value;
        var why = r.querySelector(".why");
        r.classList.remove("right", "wrong");
        if (!v) { why.hidden = true; return; }
        answered++;
        var ok = v === r._item.answer;
        if (ok) { right++; }
        r.classList.add(ok ? "right" : "wrong");
        why.hidden = false;
        why.textContent = (ok ? "Correct. " : "Not quite: " + r._item.answer + ". ") + (r._item.why || "");
      });
      result.textContent = answered < d.items.length
        ? right + " of " + answered + " answered correctly. Answer every item to finish."
        : right + " of " + d.items.length + " correct.";
      if (answered === d.items.length) { store.set("act-" + id, { score: right, total: d.items.length }); }
    });
    reset.addEventListener("click", function () {
      wrap.querySelectorAll(".act-row").forEach(function (r) {
        r.classList.remove("right", "wrong");
        r.querySelector("select").value = "";
        r.querySelector(".why").hidden = true;
      });
      result.textContent = "";
    });
  }

  /* ---- fact or myth: immediate feedback per statement ---- */
  function tfActivity(box, d) {
    var id = box.getAttribute("data-id");
    var labels = d.labels || ["Fact", "Myth"];
    var score = 0, done = 0;
    var result = el("p", { "class": "act-result", "aria-live": "polite" });
    d.items.forEach(function (it) {
      var row = el("div", { "class": "act-row" });
      row.innerHTML = "<p style=\"margin:0\">" + esc(it.text) + '</p><div class="tf-buttons" role="group" aria-label="' + esc(labels[0]) + " or " + esc(labels[1]) + '">' +
        '<button type="button" data-v="true" aria-pressed="false">' + esc(labels[0]) + "</button>" +
        '<button type="button" data-v="false" aria-pressed="false">' + esc(labels[1]) + "</button></div>" +
        '<p class="why" hidden></p>';
      var answered = false;
      row.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.getAttribute("data-v") === "true";
          row.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          var ok = v === it.answer;
          row.classList.remove("right", "wrong");
          row.classList.add(ok ? "right" : "wrong");
          var why = row.querySelector(".why");
          why.hidden = false;
          why.textContent = (ok ? "Right. " : "Not quite. It's a " + (it.answer ? labels[0] : labels[1]).toLowerCase() + ". ") + it.why;
          if (!answered) {
            answered = true; done++; if (ok) { score++; }
            if (done === d.items.length) {
              result.textContent = "First-try score: " + score + " of " + d.items.length + ".";
              store.set("act-" + id, { score: score, total: d.items.length });
            }
          }
        });
      });
      box.appendChild(row);
    });
    var row = actionsRow(box);
    row.appendChild(result);
  }

  /* ---- order: move items into the right sequence ---- */
  function orderActivity(box, d) {
    var id = box.getAttribute("data-id");
    var list = el("ol", { "class": "order-list" });
    var order = shuffle(d.items.map(function (_, i) { return i; }));
    if (order.every(function (v, i) { return v === i; })) { order.reverse(); }
    function render() {
      list.innerHTML = "";
      order.forEach(function (idx, pos) {
        var li = el("li");
        li.innerHTML = '<span class="txt">' + esc(d.items[idx]) + "</span>" +
          '<button type="button" data-m="-1" aria-label="Move up: ' + esc(d.items[idx]) + '"' + (pos === 0 ? " disabled" : "") + ">▲</button>" +
          '<button type="button" data-m="1" aria-label="Move down: ' + esc(d.items[idx]) + '"' + (pos === order.length - 1 ? " disabled" : "") + ">▼</button>";
        li.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () {
            var m = parseInt(b.getAttribute("data-m"), 10);
            var t = order[pos]; order[pos] = order[pos + m]; order[pos + m] = t;
            render();
            var again = list.children[pos + m].querySelector('button[data-m="' + m + '"]');
            (again && !again.disabled ? again : list.children[pos + m].querySelector("button:not([disabled])")).focus();
          });
        });
        list.appendChild(li);
      });
    }
    render();
    box.appendChild(list);
    var row = actionsRow(box);
    var check = el("button", { type: "button", "class": "btn-primary" }, "Check order");
    var result = el("p", { "class": "act-result", "aria-live": "polite" });
    row.appendChild(check); row.appendChild(result);
    check.addEventListener("click", function () {
      var right = 0;
      Array.prototype.forEach.call(list.children, function (li, pos) {
        var ok = order[pos] === pos;
        if (ok) { right++; }
        li.classList.toggle("right", ok);
        li.classList.toggle("wrong", !ok);
      });
      result.textContent = right === order.length ? "All " + right + " in the right order. " + (d.why || "")
        : right + " of " + order.length + " are in the right position. Items outlined in red are out of place.";
      store.set("act-" + id, { score: right, total: order.length });
    });
  }

  /* ---- write: short written answer, then compare with a model answer ---- */
  function writeActivity(box, d) {
    var id = box.getAttribute("data-id");
    var tid = id + "-text";
    var min = d.minWords || 40;
    var lab = el("label", { "for": tid }, esc(d.prompt));
    var ta = el("textarea", { id: tid });
    ta.value = store.get("write-" + id, "");
    var row = actionsRow(box);
    var count = el("span", { "class": "act-result", "aria-live": "polite" });
    var reveal = el("button", { type: "button", "class": "btn-primary" }, "Compare with a model answer");
    var model = el("div", { "class": "model-answer", hidden: "" }, "<p><strong>One strong answer</strong></p><p>" + esc(d.model) + "</p>");
    box.insertBefore(lab, row); box.insertBefore(ta, row);
    row.appendChild(reveal); row.appendChild(count);
    box.appendChild(model);
    function words() { return (ta.value.trim().match(/\S+/g) || []).length; }
    function upd() {
      var w = words();
      count.textContent = w + " words" + (w < min ? " (write at least " + min + " to unlock the model answer)" : "");
      reveal.disabled = w < min;
    }
    var t;
    ta.addEventListener("input", function () { upd(); clearTimeout(t); t = setTimeout(function () { store.set("write-" + id, ta.value); }, 400); });
    reveal.addEventListener("click", function () { model.hidden = false; store.set("act-" + id, { done: true }); });
    upd();
  }

  /* ---- guided problems: reveal one step at a time ---- */
  function guided(box) {
    var steps = Array.prototype.slice.call(box.querySelectorAll("ol.steps > li"));
    if (!steps.length) { return; }
    steps.forEach(function (s) { s.hidden = true; });
    var row = actionsRow(box);
    var next = el("button", { type: "button", "class": "btn-primary" }, "Show next step");
    var all = el("button", { type: "button" }, "Show all steps");
    var status = el("span", { "class": "act-result", "aria-live": "polite" });
    row.appendChild(next); row.appendChild(all); row.appendChild(status);
    var shown = 0;
    function upd() {
      status.textContent = shown + " of " + steps.length + " steps shown";
      next.disabled = shown >= steps.length;
      all.disabled = shown >= steps.length;
    }
    next.addEventListener("click", function () { if (shown < steps.length) { steps[shown].hidden = false; shown++; upd(); } });
    all.addEventListener("click", function () { steps.forEach(function (s) { s.hidden = false; }); shown = steps.length; upd(); });
    upd();
  }

  /* ---- saved checklists and reflections (lab companion) ---- */
  function checklists() {
    document.querySelectorAll("ul.checklist[data-save]").forEach(function (ul) {
      var key = "check-" + ul.getAttribute("data-save");
      var state = store.get(key, {});
      ul.querySelectorAll('input[type="checkbox"]').forEach(function (cb, i) {
        cb.checked = !!state[i];
        cb.addEventListener("change", function () { state[i] = cb.checked; store.set(key, state); });
      });
    });
    document.querySelectorAll("textarea[data-save]").forEach(function (ta) {
      var key = "write-" + ta.getAttribute("data-save");
      ta.value = store.get(key, "");
      var t;
      ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { store.set(key, ta.value); }, 400); });
    });
  }

  /* ---- self-check quiz ---- */
  function quiz(box, d) {
    var n = parseInt(document.body.getAttribute("data-module"), 10);
    var form = el("form", { novalidate: "" });
    var result = el("div", { "aria-live": "polite" });
    function build() {
      form.innerHTML = "";
      result.innerHTML = "";
      var qs = d.shuffle === false ? d.questions : shuffle(d.questions);
      qs.forEach(function (q, qi) {
        var fs = el("fieldset");
        var choices = q.choices.map(function (c, ci) { return { text: c, ok: ci === q.answer }; });
        if (q.keepOrder !== true) { choices = shuffle(choices); }
        fs.innerHTML = '<legend><span class="qn">' + (qi + 1) + ".</span>" + esc(q.q) + "</legend>" +
          choices.map(function (c, ci) {
            var cid = "q" + n + "-" + qi + "-" + ci;
            return '<label class="choice" for="' + cid + '"><input type="radio" id="' + cid + '" name="q' + qi + '" value="' + (c.ok ? "1" : "0") + '"><span>' + esc(c.text) + "</span></label>";
          }).join("") + '<p class="q-why" hidden>' + esc(q.why) + "</p>";
        form.appendChild(fs);
      });
      var row = el("div", { "class": "act-actions" });
      var submit = el("button", { type: "submit", "class": "btn-primary" }, "Check my answers");
      var retake = el("button", { type: "button" }, "Retake with new order");
      row.appendChild(submit); row.appendChild(retake);
      form.appendChild(row);
      retake.addEventListener("click", function () { build(); form.querySelector("input").focus(); });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var sets = form.querySelectorAll("fieldset");
      var right = 0, unanswered = 0;
      sets.forEach(function (fs) {
        var picked = fs.querySelector("input:checked");
        fs.querySelectorAll("label.choice").forEach(function (l) { l.classList.remove("correct", "incorrect"); });
        if (!picked) { unanswered++; return; }
        var correct = fs.querySelector('input[value="1"]');
        correct.parentNode.classList.add("correct");
        if (picked.value === "1") { right++; } else { picked.parentNode.classList.add("incorrect"); }
        fs.querySelector(".q-why").hidden = false;
      });
      if (unanswered) {
        result.innerHTML = "<p>Answer all " + sets.length + " questions to see your score (" + unanswered + " left).</p>";
        return;
      }
      var pct = Math.round(right / sets.length * 100);
      var prog = PS.modProgress(n);
      var best = Math.max(pct, (prog.quiz && prog.quiz.best) || 0);
      prog.quiz = { best: best, last: pct, attempts: ((prog.quiz && prog.quiz.attempts) || 0) + 1 };
      PS.saveModProgress(n, prog);
      result.innerHTML = '<p class="quiz-score">' + right + " of " + sets.length + " (" + pct + "%)</p><p>" +
        (pct >= 80 ? "Ready for the graded quiz in Canvas." : "Review the explanations above and the sections they point to, then retake.") +
        " Best score so far: " + best + "%.</p>";
      var unit = box.closest(".unit[data-section]");
      if (unit && pct >= 80) {
        document.dispatchEvent(new CustomEvent("ps:section-complete", { detail: unit.getAttribute("data-section") }));
      }
      result.focus();
    });
    result.setAttribute("tabindex", "-1");
    build();
    box.appendChild(form);
    box.appendChild(result);
  }

  document.querySelectorAll("[data-activity]").forEach(function (box) {
    var d = readData(box);
    if (!d) { return; }
    var t = box.getAttribute("data-activity");
    if (t === "sort") { sortActivity(box, d); }
    else if (t === "tf") { tfActivity(box, d); }
    else if (t === "order") { orderActivity(box, d); }
    else if (t === "write") { writeActivity(box, d); }
  });
  document.querySelectorAll(".guided").forEach(guided);
  document.querySelectorAll(".quiz[data-quiz]").forEach(function (box) {
    var d = readData(box);
    if (d) { quiz(box, d); }
  });
  checklists();
  void live;
})();
