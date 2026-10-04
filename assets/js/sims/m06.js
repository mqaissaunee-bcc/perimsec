/* Simulation 6.1: packet flow stepper. Simulation 6.2: Security policy rule tester. */
(function () {
  "use strict";
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  /* ---------- 6.1 packet flow ---------- */
  var fbox = document.getElementById("sim-6-1");
  if (fbox) {
    var STAGES = [
      "Session lookup",
      "Zone and DoS protection",
      "Forwarding lookup",
      "NAT policy lookup",
      "Security policy pre-check",
      "Session created",
      "App-ID",
      "Security policy (with application)",
      "Decryption policy",
      "Content-ID and Security Profiles",
      "Forward"
    ];
    /* For each scenario: one entry per stage: [state, text]. state: pass | skip | stop */
    var SCEN = {
      web: { label: "First packet of a new web session from a user to the internet", steps: [
        ["pass", "No existing session matches this 5-tuple, so this is session setup (the slow path)."],
        ["pass", "Ingress interface ethernet1/2 is in zone Users_Net. No Zone Protection or DoS policy drops it."],
        ["pass", "No Policy-Based Forwarding rule matches. The route lookup for 93.184.216.34 selects the default route out ethernet1/1, so the destination zone is Internet."],
        ["pass", "Source NAT rule Inside_Nets_to_Internet matches. The translation is recorded for this session but applied at egress; policy still sees the original addresses."],
        ["pass", "A first check on zones, addresses, user, and service (port). The application is not known yet, so App-ID is ignored here. At least one rule could allow tcp/443 from Users_Net to Internet."],
        ["pass", "The firewall creates the session with both flows (client-to-server and server-to-client)."],
        ["pass", "As data arrives, App-ID identifies ssl, then a more specific application if it can."],
        ["pass", "Policy is checked again, now with the application. Rule Allow-Web (ssl, application-default) allows it."],
        ["skip", "The traffic is encrypted. No Decryption policy rule matches this destination, so it is not decrypted and Content-ID will see only what is visible outside the encryption."],
        ["pass", "Security Profiles attached to Allow-Web scan whatever content is visible."],
        ["pass", "Source NAT is applied (192.168.1.20 becomes 203.0.113.20) and the packet leaves ethernet1/1."]
      ] },
      ret: { label: "A return packet from the web server for that same session", steps: [
        ["pass", "The packet matches the existing session's server-to-client flow. The firewall skips session setup entirely."],
        ["skip", "Already handled when the session was created."],
        ["skip", "The session already records the egress interface."],
        ["skip", "The session already records the NAT translation; it is reversed for return traffic."],
        ["skip", "Return traffic of an allowed session needs no rule of its own."],
        ["skip", "The session exists."],
        ["pass", "App-ID keeps watching the session and can still detect an application shift."],
        ["pass", "If App-ID changes the application, policy is re-checked against the new application."],
        ["skip", "No Decryption rule matched this session."],
        ["pass", "Security Profiles keep scanning the server-to-client direction, which is where downloads arrive."],
        ["pass", "Destination is translated back from 203.0.113.20 to 192.168.1.20 and forwarded out ethernet1/2."]
      ] },
      dnat: { label: "An internet client connects to the public address of the extranet web server", steps: [
        ["pass", "No existing session. Slow path."],
        ["pass", "Ingress ethernet1/1 is in zone Internet."],
        ["pass", "Route lookup for the original destination 203.0.113.50 points to ethernet1/1, so the pre-NAT destination zone is Internet."],
        ["pass", "Destination NAT rule matches (original destination zone Internet, address 203.0.113.50). The translated address 192.168.50.80 is looked up again: egress ethernet1/3, post-NAT zone Extranet."],
        ["pass", "Policy uses the pre-NAT destination address (203.0.113.50) and the post-NAT destination zone (Extranet). A rule from Internet to Extranet for 203.0.113.50 is needed."],
        ["pass", "Session created."],
        ["pass", "App-ID identifies web-browsing."],
        ["pass", "Rule Allow-Internet-to-Web allows web-browsing on application-default."],
        ["skip", "Plain HTTP; nothing to decrypt."],
        ["pass", "Vulnerability Protection on the rule inspects requests aimed at the web server."],
        ["pass", "Destination is rewritten to 192.168.50.80 and the packet leaves ethernet1/3."]
      ] },
      deny: { label: "A user tries BitTorrent to the internet, and no rule allows it", steps: [
        ["pass", "No existing session. Slow path."],
        ["pass", "Ingress zone Users_Net."],
        ["pass", "Default route; destination zone Internet."],
        ["pass", "Source NAT rule matches; translation recorded."],
        ["pass", "The service port alone does not rule the session out yet, so a session is set up to identify the application."],
        ["pass", "Session created."],
        ["pass", "App-ID identifies bittorrent."],
        ["stop", "No rule from Users_Net to Internet allows bittorrent. The interzone-default rule denies it. The session ends, and the Traffic log shows the deny only if logging is enabled on interzone-default."],
        ["skip", "Never reached."],
        ["skip", "Never reached."],
        ["skip", "Never reached."]
      ] }
    };
    var sel = fbox.querySelector("#pf-scen");
    sel.innerHTML = Object.keys(SCEN).map(function (k) { return '<option value="' + k + '">' + esc(SCEN[k].label) + "</option>"; }).join("");
    var list = fbox.querySelector(".pf-stages");
    var detail = fbox.querySelector(".pf-detail");
    var pos = 0;
    var frender = function () {
      var sc = SCEN[sel.value];
      list.innerHTML = STAGES.map(function (s, i) {
        var st = sc.steps[i][0];
        var cls = i > pos ? "" : (st === "stop" ? "fail" : st === "skip" ? "info" : "pass");
        var tag = i > pos ? "" : (st === "stop" ? "STOP" : st === "skip" ? "SKIP" : "OK");
        return "<li" + (i === pos ? ' aria-current="step" style="font-weight:600"' : "") + '><span class="tag ' + cls + '">' + tag + "</span><span>" + (i + 1) + ". " + esc(s) + "</span></li>";
      }).join("");
      detail.innerHTML = "<strong>" + (pos + 1) + ". " + esc(STAGES[pos]) + ":</strong> " + esc(sc.steps[pos][1]);
      detail.className = "pf-detail verdict " + (sc.steps[pos][0] === "stop" ? "fail" : sc.steps[pos][0] === "skip" ? "warn" : "pass");
      fbox.querySelector('[data-pf="prev"]').disabled = pos === 0;
      var stopAt = sc.steps.findIndex(function (s) { return s[0] === "stop"; });
      fbox.querySelector('[data-pf="next"]').disabled = pos === STAGES.length - 1 || (stopAt !== -1 && pos >= stopAt);
    };
    fbox.querySelectorAll("[data-pf]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-pf");
        if (a === "next") { pos++; } else if (a === "prev") { pos--; } else { pos = 0; }
        frender();
      });
    });
    sel.addEventListener("change", function () { pos = 0; frender(); });
    frender();
  }

  /* ---------- 6.2 rule tester ---------- */
  var tbox = document.getElementById("sim-6-2");
  if (!tbox) { return; }
  var APP_PORTS = { "web-browsing": ["tcp/80"], "ssl": ["tcp/443"], "dns": ["udp/53", "tcp/53"], "ssh": ["tcp/22"], "bittorrent": ["tcp/6881"] };
  var rules = [
    { name: "Block-Known-Bad", src: "any", dst: "Internet", daddr: ["203.0.113.66"], apps: ["any"], svc: "any", action: "deny", on: true },
    { name: "Allow-Web", src: "Users_Net", dst: "Internet", daddr: ["any"], apps: ["web-browsing", "ssl"], svc: "application-default", action: "allow", on: true },
    { name: "Allow-DNS", src: "Users_Net", dst: "Internet", daddr: ["any"], apps: ["dns"], svc: "application-default", action: "allow", on: true },
    { name: "Allow-Users-to-Extranet", src: "Users_Net", dst: "Extranet", daddr: ["any"], apps: ["any"], svc: "any", action: "allow", on: true },
    { name: "Block-SSH-to-Extranet", src: "Users_Net", dst: "Extranet", daddr: ["any"], apps: ["ssh"], svc: "any", action: "deny", on: true },
    { name: "Allow-Internet-to-Web", src: "Internet", dst: "Extranet", daddr: ["203.0.113.50"], apps: ["web-browsing"], svc: "application-default", action: "allow", on: true }
  ];
  var TESTS = [
    { t: "User browses a website over HTTP", src: "Users_Net", dst: "Internet", daddr: "93.184.216.34", app: "web-browsing", port: "tcp/80" },
    { t: "User opens an HTTPS site", src: "Users_Net", dst: "Internet", daddr: "93.184.216.34", app: "ssl", port: "tcp/443" },
    { t: "User browses a website on port 8080", src: "Users_Net", dst: "Internet", daddr: "93.184.216.34", app: "web-browsing", port: "tcp/8080" },
    { t: "User's PC connects to a known-bad address over SSL", src: "Users_Net", dst: "Internet", daddr: "203.0.113.66", app: "ssl", port: "tcp/443" },
    { t: "User opens SSH to an extranet server", src: "Users_Net", dst: "Extranet", daddr: "192.168.50.80", app: "ssh", port: "tcp/22" },
    { t: "User runs BitTorrent to the internet", src: "Users_Net", dst: "Internet", daddr: "198.51.100.9", app: "bittorrent", port: "tcp/6881" },
    { t: "Internet client reaches the public web server address", src: "Internet", dst: "Extranet", daddr: "203.0.113.50", app: "web-browsing", port: "tcp/80" },
    { t: "Two extranet servers on different interfaces talk", src: "Extranet", dst: "Extranet", daddr: "192.168.50.81", app: "ssh", port: "tcp/22" }
  ];
  function inSet(set, v) { return set.indexOf("any") !== -1 || set.indexOf(v) !== -1; }
  function svcOk(r, app, port) {
    if (r.svc === "any") { return true; }
    if (r.svc === "application-default") { return (APP_PORTS[app] || []).indexOf(port) !== -1; }
    return r.svc === port;
  }
  function why(r, t) {
    if (r.src !== "any" && r.src !== t.src) { return "source zone is " + t.src + ", rule needs " + r.src; }
    if (r.dst !== "any" && r.dst !== t.dst) { return "destination zone is " + t.dst + ", rule needs " + r.dst; }
    if (!inSet(r.daddr, t.daddr)) { return "destination address " + t.daddr + " is not " + r.daddr.join(", "); }
    if (!inSet(r.apps, t.app)) { return "application " + t.app + " is not in " + r.apps.join(", "); }
    if (!svcOk(r, t.app, t.port)) { return t.port + " is not the default port for " + t.app + " (application-default)"; }
    return "";
  }
  function covers(a, b) {
    var svc = a.svc === "any" || a.svc === b.svc;
    var apps = a.apps.indexOf("any") !== -1 || b.apps.every(function (x) { return a.apps.indexOf(x) !== -1; });
    var dad = a.daddr.indexOf("any") !== -1 || b.daddr.every(function (x) { return a.daddr.indexOf(x) !== -1; });
    return (a.src === "any" || a.src === b.src) && (a.dst === "any" || a.dst === b.dst) && apps && svc && dad;
  }
  var tsel = tbox.querySelector("#rt-test");
  tsel.innerHTML = TESTS.map(function (t, i) { return '<option value="' + i + '">' + esc(t.t) + "</option>"; }).join("");
  var tb = tbox.querySelector("tbody");
  var trace = tbox.querySelector(".trace");
  var verdict = tbox.querySelector(".verdict");
  var shadow = tbox.querySelector(".rt-shadow");

  function render() {
    tb.innerHTML = rules.map(function (r, i) {
      return "<tr" + (r.on ? "" : ' style="opacity:0.55;font-style:italic"') + "><td>" + (i + 1) + "</td><td><strong>" + esc(r.name) + "</strong></td><td>" + r.src + "</td><td>" + r.dst + "</td><td>" + r.daddr.join(", ") +
        "</td><td>" + r.apps.join(", ") + "</td><td>" + r.svc + "</td><td>" + r.action + "</td><td style=\"white-space:nowrap\">" +
        '<button type="button" data-mv="-1" data-i="' + i + '" aria-label="Move ' + esc(r.name) + ' up"' + (i === 0 ? " disabled" : "") + ">▲</button> " +
        '<button type="button" data-mv="1" data-i="' + i + '" aria-label="Move ' + esc(r.name) + ' down"' + (i === rules.length - 1 ? " disabled" : "") + ">▼</button> " +
        '<label style="font-weight:400" title="Rule enabled"><input type="checkbox" data-on="' + i + '"' + (r.on ? " checked" : "") + '><span class="visually-hidden">Enable ' + esc(r.name) + "</span></label></td></tr>";
    }).join("") +
      '<tr><td>—</td><td>intrazone-default</td><td colspan="2">same zone</td><td>any</td><td>any</td><td>any</td><td>allow</td><td></td></tr>' +
      '<tr><td>—</td><td>interzone-default</td><td colspan="2">different zones</td><td>any</td><td>any</td><td>any</td><td>deny</td><td></td></tr>';
    tb.querySelectorAll("[data-mv]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-i"), 10), m = parseInt(b.getAttribute("data-mv"), 10);
        var t = rules[i]; rules[i] = rules[i + m]; rules[i + m] = t;
        render();
        var again = tb.querySelector('[data-i="' + (i + m) + '"][data-mv="' + m + '"]');
        (again && !again.disabled ? again : tb.querySelector('[data-i="' + (i + m) + '"]')).focus();
      });
    });
    tb.querySelectorAll("[data-on]").forEach(function (c) {
      c.addEventListener("change", function () { rules[parseInt(c.getAttribute("data-on"), 10)].on = c.checked; render(); });
    });
    evaluate();
  }
  function evaluate() {
    var t = TESTS[parseInt(tsel.value, 10)];
    var steps = [], hit = null;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (!r.on) { steps.push((i + 1) + ". " + r.name + ": disabled, skipped."); continue; }
      var w = why(r, t);
      if (w) { steps.push((i + 1) + ". " + r.name + ": no match (" + w + ")."); continue; }
      steps.push((i + 1) + ". " + r.name + ": MATCH. Evaluation stops here.");
      hit = r; break;
    }
    if (!hit) {
      var intra = t.src === t.dst;
      steps.push("No custom rule matched. Default rule " + (intra ? "intrazone-default allows" : "interzone-default denies") + " the traffic.");
      hit = { name: intra ? "intrazone-default" : "interzone-default", action: intra ? "allow" : "deny" };
    }
    trace.innerHTML = steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    verdict.className = "verdict " + (hit.action === "allow" ? "pass" : "fail");
    verdict.textContent = (hit.action === "allow" ? "Allowed" : "Denied") + " by " + hit.name + ".";
    // shadow report
    var sh = [];
    rules.forEach(function (r, i) {
      if (!r.on) { return; }
      for (var j = 0; j < i; j++) {
        if (rules[j].on && covers(rules[j], r)) { sh.push(r.name + " is shadowed by " + rules[j].name + " (rule " + (j + 1) + " matches everything rule " + (i + 1) + " would)."); break; }
      }
    });
    shadow.innerHTML = sh.length ? "<strong>Commit warning (shadowed rules):</strong> " + sh.map(esc).join(" ") : "No shadowed rules. The commit would show no shadow warnings.";
    shadow.className = "rt-shadow verdict " + (sh.length ? "warn" : "pass");
  }
  tsel.addEventListener("change", evaluate);
  tbox.querySelector("[data-reset]").addEventListener("click", function () {
    var order = ["Block-Known-Bad", "Allow-Web", "Allow-DNS", "Allow-Users-to-Extranet", "Block-SSH-to-Extranet", "Allow-Internet-to-Web"];
    rules.sort(function (a, b) { return order.indexOf(a.name) - order.indexOf(b.name); });
    rules.forEach(function (r) { r.on = true; });
    render();
  });
  render();
})();
