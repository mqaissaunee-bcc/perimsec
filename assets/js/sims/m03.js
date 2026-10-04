/* Simulation 3.1: candidate and running configuration with two administrators. */
(function () {
  "use strict";
  var box = document.getElementById("sim-3-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  var FIELDS = [
    ["hostname", "Hostname"], ["dns", "Primary DNS"], ["ntp", "NTP server"], ["banner", "Login banner"], ["timezone", "Time zone"]
  ];
  var CHANGES = {
    "admin": [
      { key: "hostname", value: "FW-A", label: "Set hostname to FW-A" },
      { key: "dns", value: "4.2.2.2", label: "Set DNS to 4.2.2.2" },
      { key: "banner", value: "Authorized use only", label: "Add a login banner" }
    ],
    "admin-bob": [
      { key: "ntp", value: "pool.ntp.org", label: "Set NTP to pool.ntp.org" },
      { key: "timezone", value: "US/Eastern", label: "Set time zone to US/Eastern" },
      { key: "hostname", value: "EDGE-01", label: "Set hostname to EDGE-01" }
    ]
  };
  var BASE = { hostname: "PA-VM", dns: "(none)", ntp: "(none)", banner: "(none)", timezone: "UTC" };

  var st;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function reset() {
    st = {
      who: "admin",
      running: clone(BASE),
      candidate: {},
      saved: clone(BASE),
      named: null,
      versions: [{ v: 1, cfg: clone(BASE) }],
      configLock: null,
      commitLock: null,
      log: []
    };
    Object.keys(BASE).forEach(function (k) { st.candidate[k] = { value: BASE[k], by: null }; });
    say("system", "Firewall booted. Running configuration version 1 loaded.");
  }
  function time() {
    var d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
  }
  function say(type, msg) { st.log.unshift({ t: time(), type: type, msg: msg }); if (st.log.length > 40) { st.log.pop(); } }
  function candValues() { var o = {}; Object.keys(st.candidate).forEach(function (k) { o[k] = st.candidate[k].value; }); return o; }
  function pending() { return Object.keys(st.candidate).filter(function (k) { return st.candidate[k].value !== st.running[k]; }); }
  function setCandidate(values, by) {
    Object.keys(values).forEach(function (k) {
      st.candidate[k] = { value: values[k], by: values[k] !== st.running[k] ? by : null };
    });
  }

  var status = box.querySelector(".sim-status");
  function tell(msg) { status.textContent = msg; }

  function act(a, arg) {
    var me = st.who;
    var lockedOut = st.configLock && st.configLock !== me;
    var commitBlocked = st.commitLock && st.commitLock !== me;
    if (a === "change") {
      if (lockedOut) { tell("Change refused: " + st.configLock + " holds the configuration lock."); say("system", "Config change by " + me + " rejected: config locked by " + st.configLock); return; }
      st.candidate[arg.key] = { value: arg.value, by: arg.value !== st.running[arg.key] ? me : null };
      say("config", me + " edited deviceconfig " + arg.key + " = " + arg.value);
      tell(arg.label + " (candidate only). Nothing is active until a commit.");
    }
    if (a === "commit-all" || a === "commit-mine") {
      if (commitBlocked) { tell("Commit refused: " + st.commitLock + " holds the commit lock."); say("system", "Commit by " + me + " rejected: commit locked by " + st.commitLock); return; }
      var keys = pending();
      if (a === "commit-mine") { keys = keys.filter(function (k) { return st.candidate[k].by === me; }); }
      if (!keys.length) { tell("Nothing to commit" + (a === "commit-mine" ? " for " + me : "") + "."); return; }
      keys.forEach(function (k) { st.running[k] = st.candidate[k].value; st.candidate[k].by = null; });
      var v = st.versions.length + 1;
      st.versions.push({ v: v, cfg: clone(st.running) });
      say("system", "Commit job succeeded by " + me + " (" + keys.length + " change" + (keys.length > 1 ? "s" : "") + "). Running config version " + v + " saved.");
      tell("Committed " + keys.join(", ") + ". " + (pending().length ? "Other administrators' changes are still pending in the candidate." : "Candidate and running now match."));
    }
    if (a === "save") {
      st.saved = candValues();
      say("system", me + " saved candidate configuration to snapshot.xml");
      tell("Candidate saved to snapshot.xml. Saving protects work in progress; it does not make anything active.");
    }
    if (a === "save-named") {
      st.named = candValues();
      say("system", me + " saved named configuration snapshot lab-baseline.xml");
      tell("Named snapshot lab-baseline.xml saved from the candidate.");
    }
    if (a === "revert-running") {
      if (lockedOut) { tell("Refused: configuration is locked by " + st.configLock + "."); return; }
      setCandidate(st.running, null);
      say("system", me + " reverted candidate to running configuration");
      tell("Candidate reset to match the running configuration. Uncommitted changes from every administrator are gone.");
    }
    if (a === "revert-saved") {
      if (lockedOut) { tell("Refused: configuration is locked by " + st.configLock + "."); return; }
      setCandidate(st.saved, "(loaded)");
      say("system", me + " reverted candidate to last saved configuration (snapshot.xml)");
      tell("Candidate replaced with snapshot.xml. Commit to make it active.");
    }
    if (a === "load-named") {
      if (!st.named) { tell("No named snapshot exists yet. Save one first."); return; }
      if (lockedOut) { tell("Refused: configuration is locked by " + st.configLock + "."); return; }
      setCandidate(st.named, "(loaded)");
      say("system", me + " loaded named configuration snapshot lab-baseline.xml");
      tell("lab-baseline.xml loaded into the candidate. Loading never changes the running configuration until you commit.");
    }
    if (a === "load-version") {
      var ver = st.versions[st.versions.length - 2];
      if (!ver) { tell("Only one running version exists. Commit at least once first."); return; }
      if (lockedOut) { tell("Refused: configuration is locked by " + st.configLock + "."); return; }
      setCandidate(ver.cfg, "(loaded)");
      say("system", me + " loaded configuration version " + ver.v);
      tell("Version " + ver.v + " (the previous running config) loaded into the candidate. Commit to roll back.");
    }
    if (a === "lock-config") {
      if (st.configLock === me) { st.configLock = null; say("system", me + " removed config lock"); tell("Configuration lock released."); }
      else if (st.configLock) { tell(st.configLock + " already holds the configuration lock."); }
      else { st.configLock = me; say("system", me + " took config lock"); tell("Configuration lock set. Other administrators can no longer change the candidate."); }
    }
    if (a === "lock-commit") {
      if (st.commitLock === me) { st.commitLock = null; say("system", me + " removed commit lock"); tell("Commit lock released."); }
      else if (st.commitLock) { tell(st.commitLock + " already holds the commit lock."); }
      else { st.commitLock = me; say("system", me + " took commit lock"); tell("Commit lock set. Other administrators can still edit but cannot commit."); }
    }
    if (a === "reboot") {
      Object.keys(st.candidate).forEach(function (k) { st.candidate[k] = { value: st.running[k], by: null }; });
      st.configLock = null; st.commitLock = null;
      say("system", "Firewall rebooted. Running configuration loaded. Unsaved candidate changes discarded.");
      tell("Rebooted. Uncommitted changes are gone; anything you saved is still in snapshot.xml and can be reverted to.");
    }
    render();
  }

  function dl(cfg, mark) {
    return "<dl>" + FIELDS.map(function (f) {
      var v = cfg[f[0]];
      var val = typeof v === "object" ? v.value : v;
      var by = typeof v === "object" ? v.by : null;
      var isPending = mark && val !== st.running[f[0]];
      return "<dt>" + f[1] + "</dt><dd" + (isPending ? ' class="pending"' : "") + ">" + esc(val) + (isPending ? " ✱ " + esc(by || "") : "") + "</dd>";
    }).join("") + "</dl>";
  }
  function render() {
    var me = st.who;
    box.querySelector(".who-label").textContent = "Signed in as " + me;
    box.querySelector('[data-a="lock-config"]').textContent = st.configLock === me ? "Remove config lock" : "Take config lock";
    box.querySelector('[data-a="lock-commit"]').textContent = st.commitLock === me ? "Remove commit lock" : "Take commit lock";
    box.querySelector(".changes").innerHTML = CHANGES[me].map(function (c, i) {
      return '<button type="button" data-c="' + i + '">' + esc(c.label) + "</button>";
    }).join("");
    box.querySelectorAll("[data-c]").forEach(function (b) {
      b.addEventListener("click", function () { act("change", CHANGES[me][parseInt(b.getAttribute("data-c"), 10)]); });
    });
    var p = pending();
    box.querySelector(".state-cols").innerHTML =
      '<div class="state-col"><h4>Running (active)</h4>' + dl(st.running, false) + '<p style="margin:0.4rem 0 0">Version ' + st.versions.length + "</p></div>" +
      '<div class="state-col"><h4>Candidate (working copy)</h4>' + dl(st.candidate, true) + '<p style="margin:0.4rem 0 0">' + (p.length ? p.length + " uncommitted change" + (p.length > 1 ? "s" : "") + " (✱)" : "Matches running") + "</p></div>" +
      '<div class="state-col"><h4>Saved (snapshot.xml)</h4>' + dl(st.saved, false) + '<p style="margin:0.4rem 0 0">Locks: ' +
        (st.configLock ? "config by " + esc(st.configLock) : "no config lock") + "; " + (st.commitLock ? "commit by " + esc(st.commitLock) : "no commit lock") + "</p></div>";
    box.querySelector(".event-log").innerHTML = st.log.map(function (e) {
      return "<li><span class=\"" + (e.type === "config" ? "lt" : "ls") + "\">" + e.t + " " + (e.type === "config" ? "CONFIG" : "SYSTEM") + "</span> " + esc(e.msg) + "</li>";
    }).join("");
  }

  box.querySelectorAll("[data-a]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-a");
      if (a === "switch") { st.who = st.who === "admin" ? "admin-bob" : "admin"; tell("Now signed in as " + st.who + "."); render(); return; }
      if (a === "reset") { reset(); tell("Simulation reset."); render(); return; }
      act(a);
    });
  });
  reset();
  render();
})();
