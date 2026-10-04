/* Simulation 15.1: where does the traffic go? Traditional hub-and-spoke versus SASE. Latency figures are illustrative. */
(function () {
  "use strict";
  var box = document.getElementById("sim-15-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };
  var q = function (s) { return box.querySelector(s); };

  var USERS = {
    hq: { label: "An employee at headquarters (New Jersey)", hop: 0 },
    branch: { label: "An employee at a branch office (Philadelphia)", hop: 18 },
    home: { label: "An employee working from home (Denver)", hop: 45 },
    travel: { label: "An employee traveling (London)", hop: 85 }
  };
  var DEST = {
    saas: { label: "Microsoft 365 (SaaS)" },
    web: { label: "A news website (internet)" },
    dc: { label: "The HR application in the headquarters data center (private app)" }
  };
  q("#sa-user").innerHTML = Object.keys(USERS).map(function (k) { return '<option value="' + k + '">' + esc(USERS[k].label) + "</option>"; }).join("");
  q("#sa-dest").innerHTML = Object.keys(DEST).map(function (k) { return '<option value="' + k + '">' + esc(DEST[k].label) + "</option>"; }).join("");

  function run() {
    var u = q("#sa-user").value, d = q("#sa-dest").value, arch = q("#sa-arch").value;
    var hops = [], ms = 0, insp = "", notes = [];
    var hopToHQ = USERS[u].hop;
    if (arch === "trad") {
      if (u === "hq") { hops.push("User on the headquarters LAN"); hops.push("Headquarters NGFW (full inspection)"); insp = "Headquarters NGFW"; }
      else if (u === "branch") { hops.push("Branch router"); hops.push("MPLS or IPsec tunnel back to headquarters (+" + hopToHQ + " ms)"); hops.push("Headquarters NGFW (full inspection)"); insp = "Headquarters NGFW"; ms += hopToHQ; notes.push("Branch traffic is backhauled to headquarters so it can be inspected: the hairpin."); }
      else { hops.push("VPN client on the laptop"); hops.push("VPN tunnel to the headquarters concentrator (+" + hopToHQ + " ms)"); hops.push("Headquarters NGFW (full inspection)"); insp = "Headquarters NGFW"; ms += hopToHQ;
        notes.push("Once the VPN connects, the user is on the corporate network: broad access, not just to one app."); }
      if (d === "dc") { hops.push("Headquarters data center: HR app (+2 ms)"); ms += 2; }
      else { hops.push("Headquarters internet link out to " + (d === "saas" ? "Microsoft 365" : "the news site") + " (+20 ms)"); ms += 20;
        if (u !== "hq") { notes.push("Internet and SaaS traffic travel to headquarters and back out again, then the replies make the same trip in reverse. The farther the user, the worse it gets."); } }
    } else {
      if (u === "hq") { hops.push("User on the headquarters LAN"); hops.push("Headquarters NGFW or a remote network connection to the nearest cloud location (+3 ms)"); ms += 3; }
      else if (u === "branch") { hops.push("Branch SD-WAN device"); hops.push("IPsec tunnel to the nearest cloud location: a remote network security processing node (+5 ms)"); ms += 5; }
      else { hops.push("Agent on the laptop (or explicit proxy)"); hops.push("Connection to the nearest cloud location: a mobile user security processing node (+" + (u === "travel" ? 8 : 6) + " ms)"); ms += (u === "travel" ? 8 : 6); }
      insp = "Cloud security processing node: the same App-ID, User-ID, and Content-ID inspection as an NGFW";
      if (d === "dc") {
        hops.push("Cloud backbone to a service connection or ZTNA connector at headquarters (+" + Math.max(3, Math.round(hopToHQ * 0.8)) + " ms)"); ms += Math.max(3, Math.round(hopToHQ * 0.8));
        hops.push("HR app only: ZTNA grants access to this one application, not the network"); ms += 2;
        notes.push("Private-app traffic still has to reach the data center, but the user reaches only the HR app.");
      } else { hops.push("Straight out to " + (d === "saas" ? "Microsoft 365" : "the news site") + " from the cloud location (+8 ms)"); ms += 8;
        notes.push("Inspection happens close to the user, and traffic goes directly to its destination. No hairpin."); }
    }
    q(".sa-path").innerHTML = hops.map(function (h, i) { return "<li>" + esc(h) + "</li>"; }).join("");
    q(".readout").innerHTML = "<div><dt>One-way delay (illustrative)</dt><dd>" + ms + " ms</dd></div><div><dt>Inspected at</dt><dd style=\"font-family:var(--font-body);font-size:var(--step--1)\">" + esc(insp) + "</dd></div>";
    q(".sa-notes").textContent = notes.join(" ");
  }
  box.addEventListener("change", run);
  run();
})();
