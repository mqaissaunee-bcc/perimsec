/* Simulation 7.1: write the Security and NAT rule fields for a NAT scenario. Simulation 7.2: DIPP capacity. */
(function () {
  "use strict";
  var PS = window.PS;
  var esc = PS ? PS.esc : function (s) { return s; };

  var nbox = document.getElementById("sim-7-1");
  if (nbox) {
    var ZONES = ["Users_Net", "Extranet", "Internet"];
    var SC = [
      { title: "Outbound browsing with DIPP",
        story: "Client 192.168.1.20 in Users_Net browses 93.184.216.34 on the internet. Source NAT (DIPP) translates the source to the ethernet1/1 address 203.0.113.20.",
        before: ["192.168.1.20", "93.184.216.34"], after: ["203.0.113.20", "93.184.216.34"],
        addrs: ["93.184.216.34", "203.0.113.20", "192.168.1.20"],
        ans: { natdst: "Internet", src: "Users_Net", dst: "Internet", daddr: "93.184.216.34" },
        exp: "Source NAT does not change the destination, so nothing is tricky here: the route to 93.184.216.34 leaves ethernet1/1 in Internet, and the destination address is the server's real address." },
      { title: "Inbound to a published web server",
        story: "An internet client 198.51.100.77 connects to 203.0.113.50, a public address on the ethernet1/1 subnet. Destination NAT translates it to the web server 192.168.50.80 in Extranet.",
        before: ["198.51.100.77", "203.0.113.50"], after: ["198.51.100.77", "192.168.50.80"],
        addrs: ["203.0.113.50", "192.168.50.80", "198.51.100.77"],
        ans: { natdst: "Internet", src: "Internet", dst: "Extranet", daddr: "203.0.113.50" },
        exp: "The NAT rule sees the packet as it arrives: 203.0.113.50 routes to ethernet1/1, so its destination zone is Internet. The Security rule uses the pre-NAT address (203.0.113.50) but the post-NAT zone (Extranet), because the firewall already knows where the translated packet will go." },
      { title: "Internal users reach a server through a NAT address",
        story: "Users browse to 192.168.1.80, an unused address on their own subnet. Destination NAT translates it to the extranet web server 192.168.50.80. (This is exactly the destination NAT rule you build in Lab 6.)",
        before: ["192.168.1.20", "192.168.1.80"], after: ["192.168.1.20", "192.168.50.80"],
        addrs: ["192.168.1.80", "192.168.50.80", "192.168.1.20"],
        ans: { natdst: "Users_Net", src: "Users_Net", dst: "Extranet", daddr: "192.168.1.80" },
        exp: "192.168.1.80 is on the Users_Net subnet, so before translation the packet's destination zone is Users_Net: that goes in the NAT rule. After translation it leaves ethernet1/3, so the Security rule's destination zone is Extranet, with the pre-NAT address 192.168.1.80. In Lab 6 the existing Users_to_Extranet rule (destination address any) already matches, which is why no new Security rule is needed." },
      { title: "A server's outbound traffic with static NAT",
        story: "The extranet web server 192.168.50.80 queries DNS at 8.8.8.8. A static source NAT rule translates it to 203.0.113.50.",
        before: ["192.168.50.80", "8.8.8.8"], after: ["203.0.113.50", "8.8.8.8"],
        addrs: ["8.8.8.8", "203.0.113.50", "192.168.50.80"],
        ans: { natdst: "Internet", src: "Extranet", dst: "Internet", daddr: "8.8.8.8" },
        exp: "Another source NAT case: zones come straight from the interfaces, and the destination address is unchanged." }
    ];
    var idx = 0, score = 0, tried = 0;
    var sc = nbox.querySelector(".nat-story");
    var fields = ["natdst", "src", "dst", "daddr"];
    function opts(list) { return '<option value="">Choose…</option>' + list.map(function (z) { return "<option>" + z + "</option>"; }).join(""); }
    function load() {
      var s = SC[idx];
      sc.innerHTML = "<h4 style=\"margin-top:0\">Scenario " + (idx + 1) + " of " + SC.length + ": " + esc(s.title) + "</h4><p>" + esc(s.story) + "</p>" +
        '<div class="table-wrap"><table><thead><tr><th scope="col">Packet</th><th scope="col">Source</th><th scope="col">Destination</th></tr></thead><tbody>' +
        "<tr><td>Arriving (pre-NAT)</td><td><code>" + s.before[0] + "</code></td><td><code>" + s.before[1] + "</code></td></tr>" +
        "<tr><td>Leaving (post-NAT)</td><td><code>" + s.after[0] + "</code></td><td><code>" + s.after[1] + "</code></td></tr></tbody></table></div>";
      nbox.querySelector("#nat-natdst").innerHTML = opts(ZONES);
      nbox.querySelector("#nat-src").innerHTML = opts(ZONES);
      nbox.querySelector("#nat-dst").innerHTML = opts(ZONES);
      nbox.querySelector("#nat-daddr").innerHTML = opts(s.addrs);
      fields.forEach(function (f) { var w = nbox.querySelector("#nat-" + f + "-why"); w.textContent = ""; w.className = "box-note"; });
      nbox.querySelector(".nat-result").textContent = "";
      nbox.querySelector(".nat-result").className = "nat-result";
    }
    nbox.querySelector("[data-nat=check]").addEventListener("click", function () {
      var s = SC[idx], right = 0, blank = 0;
      fields.forEach(function (f) {
        var v = nbox.querySelector("#nat-" + f).value;
        var w = nbox.querySelector("#nat-" + f + "-why");
        if (!v) { blank++; w.textContent = ""; return; }
        var ok = v === s.ans[f];
        if (ok) { right++; }
        w.className = "box-note"; w.style.color = ok ? "var(--ok)" : "var(--deny)";
        w.textContent = ok ? "Correct." : "Not quite. Answer: " + s.ans[f] + ".";
      });
      var r = nbox.querySelector(".nat-result");
      if (blank) { r.className = "nat-result verdict warn"; r.textContent = "Fill in all four fields."; return; }
      tried++; if (right === 4) { score++; }
      r.className = "nat-result verdict " + (right === 4 ? "pass" : "fail");
      r.textContent = right + " of 4. " + s.exp + " Scenarios fully correct: " + score + " of " + tried + ".";
    });
    nbox.querySelector("[data-nat=next]").addEventListener("click", function () { idx = (idx + 1) % SC.length; load(); });
    load();
  }

  var dbox = document.getElementById("sim-7-2");
  if (dbox) {
    var PORTS = 64000;
    var ips = dbox.querySelector("#dipp-ips"), os = dbox.querySelector("#dipp-os"), users = dbox.querySelector("#dipp-users"), per = dbox.querySelector("#dipp-per");
    var out = dbox.querySelector(".readout"), v = dbox.querySelector(".verdict");
    var calc = function () {
      var n = Math.max(1, parseInt(ips.value, 10) || 1), o = parseInt(os.value, 10), u = Math.max(0, parseInt(users.value, 10) || 0), p = Math.max(0, parseInt(per.value, 10) || 0);
      var cap = n * PORTS * o, need = u * p;
      out.innerHTML = "<div><dt>Ports per address (approx.)</dt><dd>" + PORTS.toLocaleString() + "</dd></div>" +
        "<div><dt>Without oversubscription</dt><dd>" + (n * PORTS).toLocaleString() + "</dd></div>" +
        "<div><dt>With " + o + "× oversubscription</dt><dd>" + cap.toLocaleString() + "</dd></div>" +
        "<div><dt>Sessions needed</dt><dd>" + need.toLocaleString() + "</dd></div>";
      var pct = cap ? Math.round(need / cap * 100) : 0;
      v.className = "verdict " + (pct > 100 ? "fail" : pct > 70 ? "warn" : "pass");
      v.textContent = pct > 100 ? "Not enough: new sessions would fail when the pool runs out. Add addresses to the pool or raise oversubscription."
        : pct > 70 ? "Fits, but at " + pct + "% of capacity there is little headroom for peaks."
        : "Fits comfortably at " + pct + "% of capacity.";
    };
    [ips, os, users, per].forEach(function (i) { i.addEventListener("input", calc); i.addEventListener("change", calc); });
    calc();
  }
})();
