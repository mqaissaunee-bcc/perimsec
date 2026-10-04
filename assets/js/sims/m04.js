/* Simulation 4.1: authentication sequence tracer. */
(function () {
  "use strict";
  var box = document.getElementById("sim-4-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  var PROFILES = {
    ldap: { name: "LDAP-Profile", kind: "LDAP", server: true },
    radius: { name: "RADIUS-Profile", kind: "RADIUS", server: true },
    local: { name: "Local-DB-Profile", kind: "Local database", server: false }
  };
  /* Where each account exists */
  var USERS = {
    "mlee": { label: "mlee (directory account in LDAP)", in: ["ldap"] },
    "radmin": { label: "radmin (exists only on the RADIUS server)", in: ["radius"] },
    "fwadmin": { label: "fwadmin (local user database on the firewall)", in: ["local"] },
    "jdoe": { label: "jdoe (exists in LDAP and in the local database)", in: ["ldap", "local"] },
    "intruder": { label: "intruder (no account anywhere)", in: [] }
  };
  var order = ["ldap", "radius", "local"];

  var seqList = box.querySelector(".seq-list");
  var trace = box.querySelector(".trace");
  var verdict = box.querySelector(".verdict");
  function q(sel) { return box.querySelector(sel); }

  function renderSeq() {
    seqList.innerHTML = order.map(function (k, i) {
      var p = PROFILES[k];
      var up = p.server ? '<label style="font-weight:400"><input type="checkbox" data-up="' + k + '" ' + (p.up === false ? "" : "checked") + "> server reachable</label>" : '<span class="box-note" style="margin:0">on the firewall</span>';
      return '<li><span class="mono">' + (i + 1) + '</span><span class="pname">' + p.name + " <small>(" + p.kind + ")</small></span>" + up +
        '<button type="button" data-mv="-1" data-k="' + k + '" aria-label="Move ' + p.name + ' earlier"' + (i === 0 ? " disabled" : "") + ">▲</button>" +
        '<button type="button" data-mv="1" data-k="' + k + '" aria-label="Move ' + p.name + ' later"' + (i === order.length - 1 ? " disabled" : "") + ">▼</button></li>";
    }).join("");
    seqList.querySelectorAll("[data-mv]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k"), m = parseInt(b.getAttribute("data-mv"), 10);
        var i = order.indexOf(k), t = order[i]; order[i] = order[i + m]; order[i + m] = t;
        renderSeq(); run();
        var again = seqList.querySelector('[data-k="' + k + '"][data-mv="' + m + '"]');
        (again && !again.disabled ? again : seqList.querySelector('[data-k="' + k + '"]:not([disabled])')).focus();
      });
    });
    seqList.querySelectorAll("[data-up]").forEach(function (c) {
      c.addEventListener("change", function () { PROFILES[c.getAttribute("data-up")].up = c.checked; run(); });
    });
  }

  function run() {
    var user = q("#auth-user").value;
    var pwOk = q("#auth-pw").value === "right";
    var adminDefined = q("#auth-admin").checked;
    var vsa = q("#auth-vsa").checked;
    var u = USERS[user];
    var steps = [];
    var winner = null;
    steps.push("Administrator " + user + " submits credentials to the web interface. The firewall reads the authentication sequence.");
    for (var i = 0; i < order.length; i++) {
      var k = order[i], p = PROFILES[k];
      var line = "Try " + p.name + ": ";
      if (p.server && p.up === false) {
        steps.push(line + "the " + p.kind + " server does not respond. Move to the next profile.");
        continue;
      }
      if (u.in.indexOf(k) === -1) {
        steps.push(line + "no account named " + user + " here. Move to the next profile.");
        continue;
      }
      if (!pwOk) {
        steps.push(line + "account found, but the password is wrong. This profile fails; move to the next profile.");
        continue;
      }
      steps.push(line + "account found and the password matches. Authentication succeeds; the firewall stops checking.");
      winner = k;
      break;
    }
    var cls, msg;
    if (!winner) {
      steps.push("Every profile in the sequence failed, so the firewall denies the login and records it in the System log.");
      cls = "fail"; msg = "Login denied: authentication failed in every profile.";
    } else {
      // Authorization
      if (adminDefined) {
        steps.push("Authorization: an entry for " + user + " exists under Device > Administrators, so the firewall applies the role assigned there.");
        cls = "pass"; msg = "Logged in. Authenticated by " + PROFILES[winner].name + ", role from the local administrator entry.";
      } else if (winner === "radius" && vsa) {
        steps.push("Authorization: no local administrator entry, but the RADIUS server returned the admin role in a vendor-specific attribute. This works because RADIUS is the authentication profile set under Device > Setup > Management > Authentication Settings.");
        cls = "pass"; msg = "Logged in. Authenticated and authorized by RADIUS, with no account defined on the firewall.";
      } else {
        steps.push("Authorization: the credentials were good, but there is no entry for " + user + " under Device > Administrators" +
          (winner === "radius" ? " and the RADIUS server did not return a role" : "") + ". The firewall has no role to assign.");
        cls = "warn"; msg = "Login denied: authenticated, but not authorized. Add an administrator account with a role" +
          (winner === "radius" ? ", or have RADIUS return the role." : ".");
      }
    }
    trace.innerHTML = steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    verdict.className = "verdict " + cls;
    verdict.textContent = msg;
  }

  q("#auth-user").innerHTML = Object.keys(USERS).map(function (k) { return '<option value="' + k + '">' + esc(USERS[k].label) + "</option>"; }).join("");
  ["#auth-user", "#auth-pw", "#auth-admin", "#auth-vsa"].forEach(function (s) { q(s).addEventListener("change", run); });
  renderSeq();
  run();
})();
