/* Simulation 8.1: label the session. Simulation 8.2: Policy Optimizer migration. */
(function () {
  "use strict";
  var PS = window.PS;
  var esc = PS ? PS.esc : function (s) { return s; };
  function shuffle(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

  /* ---------- 8.1 labeling ---------- */
  var lbox = document.getElementById("sim-8-1");
  if (lbox) {
    var LABELS = ["incomplete", "insufficient-data", "not-applicable", "unknown-tcp", "unknown-udp", "unknown-p2p", "an identified application"];
    var CASES = [
      { d: "A client sends SYN to tcp/8443. The server never answers. The session times out.", a: "incomplete", why: "The three-way handshake never completed, so there was no payload to inspect." },
      { d: "TCP handshake completes to tcp/443, then the client closes the session without sending any data.", a: "incomplete", why: "A completed handshake followed by no data is also labeled incomplete." },
      { d: "Handshake completes, the client sends 6 bytes, and the session ends.", a: "insufficient-data", why: "There was payload, but not enough for App-ID to identify anything." },
      { d: "A client sends SYN to tcp/23 (telnet). The very first Security policy check denies it on zone and port before any data flows.", a: "not-applicable", why: "Traffic dropped by policy before App-ID had a chance to identify it is labeled not-applicable." },
      { d: "A UDP packet to udp/161 arrives. Policy drops it on the pre-check, before App-ID runs.", a: "not-applicable", why: "UDP traffic dropped before identification is also not-applicable." },
      { d: "Handshake completes and thousands of bytes flow both ways, but no signature, decoder, or heuristic matches. Two hosts only.", a: "unknown-tcp", why: "Plenty of data, no match: unidentified TCP traffic." },
      { d: "Many UDP packets with payload flow to udp/40001. No signature or heuristic matches, and the pattern is client to one server.", a: "unknown-udp", why: "Unidentified UDP traffic." },
      { d: "A host exchanges unidentifiable traffic with dozens of peers at once, each peer also acting as client and server.", a: "unknown-p2p", why: "Heuristics recognize peer-to-peer behavior even when the specific application is unknown." },
      { d: "Handshake completes to tcp/53. The payload matches the bittorrent signature.", a: "an identified application", why: "App-ID labels it bittorrent no matter which port it uses. That is the point of App-ID." },
      { d: "An HTTP GET for a page arrives on tcp/8080 and matches the web-browsing decoder.", a: "an identified application", why: "web-browsing, identified by its decoder even on a non-standard port. Whether it is allowed depends on the rule's service setting." }
    ];
    var order = shuffle(CASES), i = 0, streak = 0, best = 0, answered = false;
    var q = lbox.querySelector(".lab-q"), opts = lbox.querySelector(".lab-opts"), fb = lbox.querySelector(".lab-fb"), st = lbox.querySelector(".lab-streak");
    var show = function () {
      var c = order[i];
      answered = false;
      q.textContent = c.d;
      fb.className = "lab-fb"; fb.textContent = "";
      opts.innerHTML = LABELS.map(function (l) { return '<button type="button" data-l="' + esc(l) + '">' + esc(l) + "</button>"; }).join("");
      opts.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          if (answered) { return; }
          answered = true;
          var ok = b.getAttribute("data-l") === c.a;
          streak = ok ? streak + 1 : 0; best = Math.max(best, streak);
          fb.className = "lab-fb verdict " + (ok ? "pass" : "fail");
          fb.textContent = (ok ? "Correct: " : "Not quite. It's " + c.a + ". ") + c.why;
          opts.querySelectorAll("button").forEach(function (x) { if (x.getAttribute("data-l") === c.a) { x.classList.add("btn-primary"); } x.disabled = x !== b && x.getAttribute("data-l") !== c.a; });
          st.textContent = "Streak: " + streak + ". Best: " + best + ". Aim for 5.";
        });
      });
    };
    lbox.querySelector("[data-next]").addEventListener("click", function () {
      i = (i + 1) % order.length; if (i === 0) { order = shuffle(CASES); } show();
    });
    st.textContent = "Streak: 0. Aim for 5.";
    show();
  }

  /* ---------- 8.2 Policy Optimizer ---------- */
  var obox = document.getElementById("sim-8-2");
  if (obox) {
    var SEEN = [
      { app: "ssl", sessions: 18420, ok: true },
      { app: "web-browsing", sessions: 9312, ok: true },
      { app: "ms-update", sessions: 2210, ok: true },
      { app: "ms-office365-base", sessions: 4105, ok: true },
      { app: "dropbox-base", sessions: 640, ok: true },
      { app: "bittorrent", sessions: 88, ok: false, note: "peer-to-peer file sharing, not a business application here" },
      { app: "unknown-tcp", sessions: 37, ok: false, note: "unidentified traffic should be investigated, not allowed" },
      { app: "tor", sessions: 5, ok: false, note: "an anonymizer that hides where traffic goes" }
    ];
    var tbody = obox.querySelector("tbody");
    tbody.innerHTML = SEEN.map(function (s, k) {
      return '<tr><td><label style="font-weight:400"><input type="checkbox" data-k="' + k + '"> ' + esc(s.app) + "</label></td><td>" + s.sessions.toLocaleString() + "</td></tr>";
    }).join("");
    var out = obox.querySelector(".po-out");
    var METHODS = {
      clone: "Create Cloned Rule",
      add: "Add to This Rule",
      existing: "Add to Existing Rule",
      match: "Match Usage"
    };
    obox.querySelector("[data-run]").addEventListener("click", function () {
      var pick = Array.prototype.slice.call(obox.querySelectorAll("[data-k]:checked")).map(function (c) { return SEEN[parseInt(c.getAttribute("data-k"), 10)]; });
      var m = obox.querySelector("#po-method").value;
      var lines = [], warn = [], rules = [];
      var apps = (m === "match" ? SEEN : pick);
      if (m !== "match" && !pick.length) { out.className = "po-out verdict warn"; out.textContent = "Select at least one application from Apps Seen first (or choose Match Usage, which takes them all)."; return; }
      var names = apps.map(function (a) { return a.app; }).join(", ");
      if (m === "clone") {
        rules = ["Users-Web-Apps (new, cloned): " + names, "Legacy-Ports-Rule (unchanged, still port-based, below the new rule)"];
        lines.push("The new rule is placed above the port-based rule, so the selected applications now match it first. The original rule keeps catching everything else while you watch its Apps Seen list shrink.");
      } else if (m === "add") {
        rules = ["Legacy-Ports-Rule (replaced): " + names];
        lines.push("The port-based rule itself now lists only the selected applications. Anything you didn't select stops matching it.");
        var missed = SEEN.filter(function (s) { return s.ok && pick.indexOf(s) === -1; });
        if (missed.length) { warn.push("Business applications you did not select now fall to the next rule or interzone-default and break: " + missed.map(function (s) { return s.app; }).join(", ") + ". This is why Add to This Rule is the riskier option."); }
      } else if (m === "existing") {
        rules = ["Approved-SaaS (existing rule, applications added): " + names, "Legacy-Ports-Rule (unchanged)"];
        lines.push("The applications are added to a rule that already exists and is already set to application-default. The port-based rule is not changed.");
      } else {
        rules = ["Legacy-Ports-Rule (replaced): every app seen: " + names];
        lines.push("Match Usage copies every application in Apps Seen into the rule. It suits a rule that matches a small number of legitimate applications.");
      }
      var bad = apps.filter(function (a) { return !a.ok; });
      if (bad.length) { warn.push("You allowed " + bad.map(function (a) { return a.app + " (" + a.note + ")"; }).join("; ") + ". Converting a rule should shrink the attack surface, not write the risky traffic into policy."); }
      if (m !== "existing") { warn.push("Remember to change the new or replaced rule's service from any to application-default. Policy Optimizer does not do it for you."); }
      out.className = "po-out verdict " + (bad.length || warn.length > 1 ? "warn" : "pass");
      out.innerHTML = "<strong>" + esc(METHODS[m]) + "</strong><ul style=\"margin:0.4rem 0\">" + rules.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul><p style=\"margin:0 0 0.3rem\">" + lines.map(esc).join(" ") + "</p>" +
        (warn.length ? "<ul style=\"margin:0\">" + warn.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" : "<p style=\"margin:0\">Clean conversion: only business applications, nothing missed.</p>");
    });
  }
})();
