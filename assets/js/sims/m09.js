/* Simulation 9.1: choose user mapping methods. Simulation 9.2: user-based policy tester. */
(function () {
  "use strict";
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  var pbox = document.getElementById("sim-9-1");
  if (pbox) {
    var ENV = [
      { id: "ad", label: "Windows users log in to an Active Directory domain", rec: ["Server monitoring (integrated or Windows-based User-ID agent) reads login events from the domain controllers' Security logs. This is the backbone of most deployments."] },
      { id: "exch", label: "Users read mail on an on-premises Exchange server", rec: ["Server monitoring of the Exchange servers adds mappings when users connect to mail, even if their domain logon was long ago. Exchange servers must be added manually."] },
      { id: "files", label: "Users connect to Windows file and print servers", rec: ["Session monitoring keeps mappings fresh from SMB sessions to file and print servers."] },
      { id: "vpn", label: "Remote users connect through GlobalProtect", rec: ["GlobalProtect: users authenticate to connect, so the username comes straight from the login. The most reliable method, and the best fit for high-security environments."] },
      { id: "wifi", label: "Wireless users authenticate with 802.1X through a WLAN controller or NAC", rec: ["Syslog listening: the controller or NAC sends login events by syslog, and a Syslog Parse Profile extracts username and IP address."] },
      { id: "linux", label: "Linux and macOS users who do not log in to AD", rec: ["Syslog listening from their authentication servers, or Authentication Portal if no system can report their logins."] },
      { id: "citrix", label: "Many users share one IP address on Citrix or Remote Desktop servers", rec: ["Terminal Services agent: it maps each user's source port range, because the IP address alone cannot tell users apart."] },
      { id: "byod", label: "Guests and personal devices with no other source of identity", rec: ["Authentication Portal (Captive Portal): the firewall prompts for credentials when it sees web traffic from an unmapped address."] },
      { id: "custom", label: "A custom application or NAC system knows who is logged in", rec: ["XML API: the system pushes mappings (and tags for dynamic user groups) directly to the firewall."] },
      { id: "proxy", label: "Users reach the internet through an upstream proxy", rec: ["XFF headers: the firewall reads the X-Forwarded-For header the proxy adds, so it can see the real client address instead of the proxy's."] }
    ];
    var box = pbox.querySelector(".pick-env");
    box.innerHTML = ENV.map(function (e) { return '<div class="field-inline"><label><input type="checkbox" data-e="' + e.id + '"> ' + esc(e.label) + "</label></div>"; }).join("");
    var out = pbox.querySelector(".pick-out");
    var render = function () {
      var on = ENV.filter(function (e) { return pbox.querySelector('[data-e="' + e.id + '"]').checked; });
      if (!on.length) { out.innerHTML = '<p class="box-note">Check every statement that describes the organization. The recommended mapping methods appear here.</p>'; return; }
      var html = "<ul class=\"checks\">" + on.map(function (e) { return "<li><span class=\"tag pass\">USE</span><span>" + esc(e.rec[0]) + "</span></li>"; }).join("") + "</ul>";
      var notes = [];
      if (on.length > 1) { notes.push("Real networks combine several methods. The firewall merges mappings from all of them."); }
      if (on.some(function (e) { return e.id === "ad"; }) && !on.some(function (e) { return e.id === "vpn" || e.id === "byod"; })) { notes.push("Domain logon events can be hours old. Session monitoring and short mapping timeouts help keep mappings accurate."); }
      notes.push("Enable User-ID only on internal zones where users originate. Never enable it, or client probing, on a zone facing the internet.");
      out.innerHTML = html + "<p class=\"box-note\" style=\"margin-top:0.6rem\">" + notes.map(esc).join(" ") + "</p>";
    };
    pbox.addEventListener("change", render);
    render();
  }

  var ubox = document.getElementById("sim-9-2");
  if (ubox) {
    /* Users and groups for an invented company (not the lab's users). */
    var MAP = {
      "10.20.1.11": { user: "acme\\alee", groups: ["marketing"] },
      "10.20.1.12": { user: "acme\\bchen", groups: ["sales"] },
      "10.20.1.13": { user: "acme\\cdiaz", groups: ["marketing", "sales"] },
      "10.20.1.99": null
    };
    var RULES = [
      { name: "Allow-Corp-Apps", user: "any", apps: ["dns", "web-browsing", "ssl"] },
      { name: "Allow-Mktg-Apps", user: "marketing", apps: ["facebook-base", "instagram-base", "linkedin-base"] },
      { name: "Allow-Sales-CRM", user: "sales", apps: ["salesforce-base"] },
      { name: "Allow-Known-Updates", user: "known-user", apps: ["ms-update"] },
      { name: "Deny-All-Others", user: "any", apps: ["any"], deny: true }
    ];
    var ip = ubox.querySelector("#u-ip"), app = ubox.querySelector("#u-app"), uid = ubox.querySelector("#u-zone");
    var trace = ubox.querySelector(".trace"), v = ubox.querySelector(".verdict");
    var run = function () {
      var steps = [];
      var m = uid.checked ? MAP[ip.value] : null;
      if (!uid.checked) { steps.push("User-ID is not enabled on the source zone, so the firewall does not look up a user for " + ip.value + ". The source user is unknown."); }
      else if (m) { steps.push("User mapping: " + ip.value + " is " + m.user + ". Group mapping: member of " + m.groups.join(" and ") + "."); }
      else { steps.push("User-ID is enabled, but no mapping exists for " + ip.value + ". The source user is unknown."); }
      var hit = null;
      for (var k = 0; k < RULES.length; k++) {
        var r = RULES[k], why = "";
        var userOk = r.user === "any" || (r.user === "known-user" && m) || (m && m.groups.indexOf(r.user) !== -1);
        var appOk = r.apps[0] === "any" || r.apps.indexOf(app.value) !== -1;
        if (!userOk) { why = "source user must be " + r.user; }
        else if (!appOk) { why = app.value + " is not in " + r.apps.join(", "); }
        if (why) { steps.push(r.name + ": no match (" + why + ")."); continue; }
        steps.push(r.name + ": MATCH."); hit = r; break;
      }
      trace.innerHTML = steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
      v.className = "verdict " + (hit.deny ? "fail" : "pass");
      v.textContent = (hit.deny ? "Denied" : "Allowed") + " by " + hit.name + (m && uid.checked ? " for " + m.user : " for an unknown user") + ".";
    };
    [ip, app, uid].forEach(function (x) { x.addEventListener("change", run); });
    run();
  }
})();
