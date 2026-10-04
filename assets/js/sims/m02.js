/* Simulation 2.1: bring the management interface online. Simulation 2.2: admin password checker. */
(function () {
  "use strict";

  /* ---------- IPv4 helpers ---------- */
  function ip2n(s) {
    var m = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(s || "");
    if (!m) { return null; }
    var p = m.slice(1).map(Number);
    if (p.some(function (x) { return x > 255; })) { return null; }
    return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
  }
  function maskOf(bits) { return bits === 0 ? 0 : ((0xffffffff << (32 - bits)) >>> 0); }
  function sameNet(a, b, bits) { var m = maskOf(bits); return ((a & m) >>> 0) === ((b & m) >>> 0); }
  function inEntry(ipn, entry) {
    var parts = entry.split("/");
    var base = ip2n(parts[0]);
    if (base === null) { return null; }
    var bits = parts[1] === undefined ? 32 : parseInt(parts[1], 10);
    if (isNaN(bits) || bits < 0 || bits > 32) { return null; }
    return sameNet(ipn, base, bits);
  }

  var box = document.getElementById("sim-2-1");
  if (box) {
    var ADMIN = "192.168.1.20";
    var f = function (id) { return box.querySelector("#" + id); };
    var inputs = box.querySelectorAll("input, select, textarea");
    var list = box.querySelector(".checks");
    var verdict = box.querySelector(".verdict");

    function row(tag, text) { return '<li><span class="tag ' + tag + '">' + tag.toUpperCase() + "</span><span>" + text + "</span></li>"; }

    var render = function () {
      var out = [];
      var fails = 0, warns = 0;
      var ip = ip2n(f("mgt-ip").value);
      var bits = parseInt(f("mgt-mask").value, 10);
      var gw = ip2n(f("mgt-gw").value);
      var admin = ip2n(ADMIN);
      if (ip === null) { out.push(row("fail", "The IP address is not a valid IPv4 address.")); fails++; }
      if (gw === null) { out.push(row("fail", "The default gateway is not a valid IPv4 address.")); fails++; }
      if (ip !== null && gw !== null) {
        var m = maskOf(bits);
        var net = (ip & m) >>> 0, bcast = (net | (~m >>> 0)) >>> 0;
        if (ip === net || ip === bcast) { out.push(row("fail", "That address is the network or broadcast address of the subnet. Pick a host address.")); fails++; }
        else if (ip === gw) { out.push(row("fail", "The interface and the gateway have the same address. They must differ.")); fails++; }
        else if (!sameNet(ip, gw, bits)) { out.push(row("fail", "The gateway is not in the same subnet as the MGT address, so the firewall cannot reach it. Check the address and the netmask.")); fails++; }
        else { out.push(row("pass", "Address, netmask, and gateway are consistent. The firewall can reach its default gateway.")); }
        if (!sameNet(ip, admin, bits)) { out.push(row("warn", "Your workstation (" + ADMIN + ") is on a different subnet, so management traffic will go through the gateway. That works only if the routing in between allows it.")); warns++; }
      }
      // Permitted IPs
      var entries = f("mgt-permit").value.split(/[\s,]+/).filter(Boolean);
      if (!entries.length) {
        out.push(row("warn", "No permitted IP addresses: any host that can reach the MGT port can try to log in. Restrict access to your admin hosts or management subnet."));
        warns++;
      } else {
        var bad = entries.filter(function (e) { return inEntry(0, e) === null; });
        if (bad.length) { out.push(row("fail", "These permitted entries are not valid addresses or CIDR ranges: " + bad.join(", "))); fails++; }
        var ok = entries.some(function (e) { return inEntry(admin, e) === true; });
        if (!ok) { out.push(row("fail", "Your workstation " + ADMIN + " is not in the permitted list. After you commit, the firewall will refuse your connection and you will lock yourself out of the web interface.")); fails++; }
        else { out.push(row("pass", "Your workstation is in the permitted list, so you keep access after the commit.")); }
      }
      // Services
      var https = f("svc-https").checked, ssh = f("svc-ssh").checked, http = f("svc-http").checked, telnet = f("svc-telnet").checked, ping = f("svc-ping").checked;
      if (!https && !http) { out.push(row("fail", "Neither HTTPS nor HTTP is enabled, so the web interface is unreachable on this port.")); fails++; }
      if (http || telnet) { out.push(row("warn", (http && telnet ? "HTTP and Telnet send" : http ? "HTTP sends" : "Telnet sends") + " credentials in cleartext. Use HTTPS and SSH instead.")); warns++; }
      if (https && !http) { out.push(row("pass", "Web interface uses HTTPS only.")); }
      if (!ssh) { out.push(row("info", "SSH is off, so the CLI is reachable only from the serial console.")); }
      if (!ping) { out.push(row("info", "Ping is off. That is fine for security, but you lose an easy reachability test.")); }
      // DNS
      if (!ip2n(f("mgt-dns").value)) { out.push(row("warn", "No valid primary DNS server. The firewall will not be able to resolve update or license server names, so licensing and dynamic updates will fail.")); warns++; }
      else { out.push(row("pass", "DNS server set, so the firewall can resolve update and license servers.")); }

      list.innerHTML = out.join("");
      verdict.className = "verdict " + (fails ? "fail" : warns ? "warn" : "pass");
      verdict.textContent = fails ? "Do not commit yet: " + fails + " problem" + (fails > 1 ? "s" : "") + " would break management access."
        : warns ? "This would work, with " + warns + " thing" + (warns > 1 ? "s" : "") + " to improve before production."
        : "Ready to commit. This is a sound management configuration.";
    };
    inputs.forEach(function (i) { i.addEventListener("input", render); i.addEventListener("change", render); });
    render();
  }

  /* ---------- password checker ---------- */
  var pw = document.getElementById("sim-2-2");
  if (pw) {
    var input = pw.querySelector("#pw-input");
    var show = pw.querySelector("#pw-show");
    var rules = pw.querySelector(".checks");
    var v2 = pw.querySelector(".verdict");
    var RULES = [
      ["At least 8 characters", function (s) { return s.length >= 8; }],
      ["At least one uppercase letter", function (s) { return /[A-Z]/.test(s); }],
      ["At least one lowercase letter", function (s) { return /[a-z]/.test(s); }],
      ["At least one number or special character", function (s) { return /[^A-Za-z]/.test(s); }],
      ["Not the default password", function (s) { return s.toLowerCase() !== "admin"; }]
    ];
    var r2 = function () {
      var s = input.value;
      var passed = 0;
      rules.innerHTML = RULES.map(function (r) {
        var ok = r[1](s);
        if (ok) { passed++; }
        return '<li><span class="tag ' + (ok ? "pass" : "fail") + '">' + (ok ? "PASS" : "FAIL") + "</span><span>" + r[0] + "</span></li>";
      }).join("");
      if (!s) { v2.className = "verdict warn"; v2.textContent = "Type a candidate password to test it. Nothing you type is saved."; return; }
      var all = passed === RULES.length;
      v2.className = "verdict " + (all ? "pass" : "fail");
      v2.textContent = all ? "PAN-OS would accept this for the predefined admin account." + (s.length < 14 ? " Longer is stronger: aim for 14 or more characters or a passphrase." : "")
        : "PAN-OS would reject this. Fix the failing rules above.";
    };
    input.addEventListener("input", r2);
    show.addEventListener("change", function () { input.type = show.checked ? "text" : "password"; });
    r2();
  }
})();
