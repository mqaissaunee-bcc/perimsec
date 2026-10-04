/* Simulation 14.1: where would you look? Simulation 14.2: log filter builder. */
(function () {
  "use strict";
  var esc = window.PS ? window.PS.esc : function (s) { return s; };
  function shuffle(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

  var wbox = document.getElementById("sim-14-1");
  if (wbox) {
    var TOOLS = ["Dashboard", "ACC", "Traffic log", "Threat log", "URL Filtering log", "WildFire Submissions log", "Data Filtering log", "App Scope", "Predefined report", "Custom report", "Correlated events"];
    var Q = [
      { q: "Your manager walks in and asks, \"Anything bad in the last hour?\" You want a glance, not an investigation.", a: "Dashboard", why: "The Threat Logs widget shows the last 10 threats in the last hour at a glance." },
      { q: "Which applications used the most bandwidth this week, and which users drove them? You want to click into it interactively.", a: "ACC", why: "ACC's Network Activity widgets with global filters are built for exactly this." },
      { q: "A user says a website was blocked at 2:14 p.m. Which rule ended their session, and why?", a: "Traffic log", why: "Each session's rule, action, and session end reason are in the Traffic log." },
      { q: "Which hosts triggered critical-severity exploit attempts, and were they blocked or only alerted?", a: "Threat log", why: "Filter with ( severity geq high ) and read the Action column." },
      { q: "Which category was the site a user visited, and did they click Continue on the warning page?", a: "URL Filtering log", why: "URL entries record category and action, including continue." },
      { q: "WildFire just returned a malware verdict. Who received the first copy, and what was the file name?", a: "WildFire Submissions log", why: "It records sender, receiver, file name, and verdict." },
      { q: "Did anyone try to upload a spreadsheet of Social Security numbers this morning?", a: "Data Filtering log", why: "Data Filtering and File Blocking events are recorded there." },
      { q: "Which applications showed the biggest jump in sessions over the last hour compared with before?", a: "App Scope", why: "Change Monitor and the Top 5 Gainers in the Summary report show changes over time." },
      { q: "Every Monday the CIO wants a PDF of the top applications by zone, with no clicking.", a: "Custom report", why: "Build it once, schedule it, and export or email it." },
      { q: "You want yesterday's top sources of traffic, with no setup at all.", a: "Predefined report", why: "More than 40 predefined reports are generated daily under Monitor > Reports." },
      { q: "Is any host showing a pattern of behavior across several logs that suggests it's compromised?", a: "Correlated events", why: "The correlation engine matches patterns across logs and raises correlated events." }
    ];
    var order = shuffle(Q), i = 0, streak = 0, best = 0, done = false;
    var qe = wbox.querySelector(".wl-q"), opts = wbox.querySelector(".wl-opts"), fb = wbox.querySelector(".wl-fb"), st = wbox.querySelector(".wl-streak");
    var show = function () {
      var c = order[i]; done = false;
      qe.textContent = c.q; fb.className = "wl-fb"; fb.textContent = "";
      opts.innerHTML = TOOLS.map(function (t) { return '<button type="button" data-t="' + esc(t) + '">' + esc(t) + "</button>"; }).join("");
      opts.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          if (done) { return; } done = true;
          var ok = b.getAttribute("data-t") === c.a;
          streak = ok ? streak + 1 : 0; best = Math.max(best, streak);
          fb.className = "wl-fb verdict " + (ok ? "pass" : "fail");
          fb.textContent = (ok ? "Yes. " : "Best answer: " + c.a + ". ") + c.why;
          opts.querySelectorAll("button").forEach(function (x) { if (x.getAttribute("data-t") === c.a) { x.classList.add("btn-primary"); } x.disabled = x !== b && x.getAttribute("data-t") !== c.a; });
          st.textContent = "Streak: " + streak + ". Best: " + best + ".";
        });
      });
    };
    wbox.querySelector("[data-next]").addEventListener("click", function () { i = (i + 1) % order.length; if (!i) { order = shuffle(Q); } show(); });
    st.textContent = "Streak: 0.";
    show();
  }

  var fbox = document.getElementById("sim-14-2");
  if (fbox) {
    var FIELDS = {
      traffic: [["zone.src", "Source zone"], ["zone.dst", "Destination zone"], ["app", "Application"], ["action", "Action"], ["rule", "Rule"], ["addr.src", "Source address"], ["addr.dst", "Destination address"], ["user.src", "Source user"], ["session_end_reason", "Session end reason"], ["flags", "Flags"]],
      threat: [["severity", "Severity"], ["user.src", "Source user"], ["action", "Action"], ["addr.src", "Source address"], ["app", "Application"], ["zone.src", "Source zone"]],
      url: [["category", "URL category"], ["action", "Action"], ["user.src", "Source user"], ["addr.src", "Source address"]]
    };
    var OPS = [["eq", "equal"], ["neq", "not equal"], ["geq", "greater than or equal"], ["leq", "less than or equal"], ["in", "in (addresses)"], ["has", "has (flags)"]];
    var TASKS = [
      { log: "threat", t: "Show only critical and high severity threats (Lab 13).", want: [["severity", "geq", "high"]] },
      { log: "threat", t: "Show threats from the user chicago\\escrooge (Lab 13).", want: [["user.src", "eq", "chicago\\escrooge"]] },
      { log: "traffic", t: "Show web-browsing traffic from the Users_Net zone (Lab 13).", want: [["zone.src", "eq", "Users_Net"], ["app", "eq", "web-browsing"]] },
      { log: "traffic", t: "Show decrypted sessions ended because of a threat (Lab 12).", want: [["flags", "has", "proxy"], ["session_end_reason", "eq", "threat"]] },
      { log: "traffic", t: "Show sessions to 192.168.1.80 (Lab 6).", want: [["addr.dst", "in", "192.168.1.80"]] },
      { log: "url", t: "Show URL entries in the hacking category (Lab 9).", want: [["category", "eq", "hacking"]] }
    ];
    var clauses = [];
    var q = function (s) { return fbox.querySelector(s); };
    var logSel = q("#lf-log"), fSel = q("#lf-field"), oSel = q("#lf-op"), vIn = q("#lf-val"), cSel = q("#lf-conn"), tSel = q("#lf-task");
    var outF = q(".lf-filter"), res = q(".lf-res");
    tSel.innerHTML = '<option value="">Free practice (no task)</option>' + TASKS.map(function (t, k) { return '<option value="' + k + '">' + esc(t.t) + "</option>"; }).join("");
    oSel.innerHTML = OPS.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
    function fillFields() { fSel.innerHTML = FIELDS[logSel.value].map(function (f) { return '<option value="' + f[0] + '">' + f[1] + " (" + f[0] + ")</option>"; }).join(""); }
    function quote(v) { return /[\s\\]/.test(v) ? "'" + v + "'" : v; }
    function text() {
      if (!clauses.length) { return "(no filter: every entry is shown)"; }
      return clauses.map(function (c, k) { return (k ? " " + c.conn + " " : "") + "( " + c.f + " " + c.o + " " + quote(c.v) + " )"; }).join("");
    }
    function render() { outF.textContent = text(); res.className = "lf-res"; res.textContent = ""; }
    logSel.addEventListener("change", function () { fillFields(); clauses = []; render(); });
    tSel.addEventListener("change", function () {
      if (tSel.value !== "") { logSel.value = TASKS[parseInt(tSel.value, 10)].log; fillFields(); }
      clauses = []; render();
    });
    q("[data-lf=add]").addEventListener("click", function () {
      var v = vIn.value.trim();
      if (!v) { res.className = "lf-res verdict warn"; res.textContent = "Enter a value first."; return; }
      clauses.push({ conn: cSel.value, f: fSel.value, o: oSel.value, v: v }); vIn.value = ""; render(); vIn.focus();
    });
    q("[data-lf=clear]").addEventListener("click", function () { clauses = []; render(); });
    q("[data-lf=check]").addEventListener("click", function () {
      if (tSel.value === "") { res.className = "lf-res verdict pass"; res.textContent = "Free practice: this is the filter the firewall would apply. Pick a task to check your work."; return; }
      var t = TASKS[parseInt(tSel.value, 10)];
      var norm = function (a) { return a.map(function (c) { return (c[0] + " " + c[1] + " " + c[2]).toLowerCase(); }).sort().join("|"); };
      var mine = clauses.map(function (c) { return [c.f, c.o, c.v]; });
      var orUsed = clauses.some(function (c, k) { return k && c.conn === "or"; });
      var ok = norm(mine) === norm(t.want) && !orUsed;
      var target = t.want.map(function (c) { return "( " + c[0] + " " + c[1] + " " + quote(c[2]) + " )"; }).join(" and ");
      res.className = "lf-res verdict " + (ok ? "pass" : "fail");
      res.textContent = ok ? "Correct. The firewall would show exactly what the task asks for." : (orUsed ? "This task needs every condition to be true, so use and, not or. " : "") + "One answer: " + target;
    });
    fillFields(); render();
  }
})();
