/* Simulation 5.1: zone mapper. Simulation 5.2: route lookup. */
(function () {
  "use strict";
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  /* ---------- 5.1 zone mapper ---------- */
  var zbox = document.getElementById("sim-5-1");
  if (zbox) {
    var IFACES = [
      { id: "e11", name: "ethernet1/1", net: "203.0.113.20/24", desc: "to the ISP router", def: "Internet" },
      { id: "e12", name: "ethernet1/2", net: "192.168.1.1/24", desc: "user network", def: "Users_Net" },
      { id: "e13", name: "ethernet1/3", net: "192.168.50.1/24", desc: "extranet servers", def: "Extranet" }
    ];
    var ZONES = ["(none)", "Internet", "Users_Net", "Extranet", "Trust"];
    var FLOWS = [
      { from: "e12", to: "e11", text: "A user at 192.168.1.20 browses a website on the internet" },
      { from: "e12", to: "e13", text: "A user at 192.168.1.20 opens the extranet web server 192.168.50.80" },
      { from: "e13", to: "e11", text: "The extranet server downloads OS updates from the internet" },
      { from: "e11", to: "e13", text: "A host on the internet connects to the extranet web server" }
    ];
    var ctl = zbox.querySelector(".sim-controls");
    ctl.innerHTML = IFACES.map(function (i) {
      return '<div class="field"><label for="z-' + i.id + '">' + i.name + " <small>(" + i.net + ", " + i.desc + ")</small></label>" +
        '<select id="z-' + i.id + '">' + ZONES.map(function (z) { return '<option' + (z === i.def ? " selected" : "") + ">" + z + "</option>"; }).join("") + "</select></div>";
    }).join("") + '<div class="btn-row"><button type="button" data-z="lab">Use the lab zones</button><button type="button" data-z="flat">Put both inside interfaces in Trust</button></div>';
    var out = zbox.querySelector(".sim-output");
    var zrender = function () {
      var zoneOf = {};
      IFACES.forEach(function (i) { zoneOf[i.id] = zbox.querySelector("#z-" + i.id).value; });
      var rows = FLOWS.map(function (f) {
        var s = zoneOf[f.from], d = zoneOf[f.to];
        var tag, msg;
        if (s === "(none)" || d === "(none)") {
          tag = "fail"; msg = "Dropped. " + (s === "(none)" ? "The ingress" : "The egress") + " interface is not in a zone, and an interface without a zone does not process traffic.";
        } else if (s === d) {
          tag = "warn"; msg = "Intrazone (" + esc(s) + " to " + esc(d) + "). Allowed by the intrazone-default rule unless you write a rule to block it.";
        } else {
          tag = "pass"; msg = "Interzone (" + esc(s) + " to " + esc(d) + "). Denied by the interzone-default rule until a Security policy rule allows it.";
        }
        return "<li><span class=\"tag " + tag + "\">" + (tag === "fail" ? "DROP" : tag === "warn" ? "INTRA" : "INTER") + "</span><span><strong>" + esc(f.text) + ".</strong> " + msg + "</span></li>";
      }).join("");
      out.innerHTML = "<h4 style=\"margin-top:0\">What happens to each flow</h4><ul class=\"checks\">" + rows + "</ul>" +
        '<p class="box-note" style="margin:0.6rem 0 0">INTER means policy controls the flow. INTRA means it is allowed by default with no inspection rule of its own. DROP means it never gets that far.</p>';
    };
    zbox.querySelectorAll("select").forEach(function (s) { s.addEventListener("change", zrender); });
    zbox.querySelectorAll("[data-z]").forEach(function (b) {
      b.addEventListener("click", function () {
        var flat = b.getAttribute("data-z") === "flat";
        zbox.querySelector("#z-e11").value = "Internet";
        zbox.querySelector("#z-e12").value = flat ? "Trust" : "Users_Net";
        zbox.querySelector("#z-e13").value = flat ? "Trust" : "Extranet";
        zrender();
      });
    });
    zrender();
  }

  /* ---------- 5.2 route lookup ---------- */
  var rbox = document.getElementById("sim-5-2");
  if (rbox) {
    function ip2n(s) {
      var m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(s || "");
      if (!m) { return null; }
      var p = m.slice(1).map(Number);
      if (p.some(function (x) { return x > 255; })) { return null; }
      return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
    }
    function maskOf(b) { return b === 0 ? 0 : ((0xffffffff << (32 - b)) >>> 0); }
    var ZONE = { "ethernet1/1": "Internet", "ethernet1/2": "Users_Net", "ethernet1/3": "Extranet", "ethernet1/4": "Internet" };
    var ROUTES = [
      { id: "r1", dest: "0.0.0.0/0", nh: "203.0.113.1", iface: "ethernet1/1", metric: 10, type: "static", note: "primary ISP, path monitored" },
      { id: "r2", dest: "0.0.0.0/0", nh: "198.51.100.1", iface: "ethernet1/4", metric: 20, type: "static", note: "backup ISP" },
      { id: "r3", dest: "192.168.1.0/24", nh: "(connected)", iface: "ethernet1/2", metric: 0, type: "connected" },
      { id: "r4", dest: "192.168.50.0/24", nh: "(connected)", iface: "ethernet1/3", metric: 0, type: "connected" },
      { id: "r5", dest: "10.10.0.0/16", nh: "192.168.50.254", iface: "ethernet1/3", metric: 10, type: "static", note: "partner network" },
      { id: "r6", dest: "10.10.20.0/24", nh: "192.168.1.250", iface: "ethernet1/2", metric: 10, type: "static", note: "lab subnet behind a user-side router" }
    ];
    var tbody = rbox.querySelector("tbody");
    var input = rbox.querySelector("#rt-dst");
    var down = rbox.querySelector("#rt-down");
    var res = rbox.querySelector(".rt-result");
    var rrender = function () {
      var d = ip2n(input.value);
      var primaryDown = down.checked;
      var cands = [];
      ROUTES.forEach(function (r) {
        var p = r.dest.split("/");
        var bits = parseInt(p[1], 10);
        r.active = !(r.id === "r1" && primaryDown);
        r.match = d !== null && r.active && (((d & maskOf(bits)) >>> 0) === ip2n(p[0]));
        r.bits = bits;
        if (r.match) { cands.push(r); }
      });
      cands.sort(function (a, b) { return b.bits - a.bits || a.metric - b.metric; });
      var win = cands[0];
      tbody.innerHTML = ROUTES.map(function (r) {
        var st = !r.active ? "removed (path down)" : r === win ? "SELECTED" : r.match ? "matches, not chosen" : "";
        return "<tr" + (r === win ? ' style="background:var(--ok-soft)"' : !r.active ? ' style="opacity:0.55"' : "") + "><td><code>" + r.dest + "</code></td><td>" + r.nh + "</td><td>" + r.iface + "</td><td>" + r.metric + "</td><td>" + esc(r.note || r.type) + "</td><td>" + st + "</td></tr>";
      }).join("");
      if (d === null) { res.className = "rt-result verdict warn"; res.textContent = "Enter a valid IPv4 destination address."; return; }
      if (!win) { res.className = "rt-result verdict fail"; res.textContent = "No route matches, so the firewall drops the packet."; return; }
      var why = cands.length > 1
        ? (cands[1].bits < win.bits ? "It is the longest (most specific) prefix of the " + cands.length + " matching routes: /" + win.bits + "."
          : "Several routes have the same prefix length, so the lowest metric (" + win.metric + ") wins.")
        : "It is the only matching route.";
      res.className = "rt-result verdict pass";
      res.textContent = "Route " + win.dest + " via " + win.nh + " out " + win.iface + ". " + why + " Egress interface " + win.iface + " is in zone " + ZONE[win.iface] + ", so that is the destination zone for policy.";
    };
    input.addEventListener("input", rrender);
    down.addEventListener("change", rrender);
    rbox.querySelectorAll("[data-ip]").forEach(function (b) {
      b.addEventListener("click", function () { input.value = b.getAttribute("data-ip"); rrender(); });
    });
    rrender();
  }
})();
