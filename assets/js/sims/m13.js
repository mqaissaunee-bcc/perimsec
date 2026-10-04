/* Simulation 13.1: what certificate does the browser see? */
(function () {
  "use strict";
  var box = document.getElementById("sim-13-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };
  var SITES = [
    { id: "good", label: "https://www.bing.com (valid certificate from a public CA)", trusted: true, cat: "search-engines" },
    { id: "bank", label: "https://www.example-bank.com (valid certificate, financial-services)", trusted: true, cat: "financial-services" },
    { id: "self", label: "https://192.168.50.80 (self-signed certificate)", trusted: false, cat: "private-ip-addresses" },
    { id: "exp", label: "https://old.example.org (certificate expired last month)", trusted: false, cat: "computer-and-internet-info", expired: true },
    { id: "pin", label: "An app that pins its server certificate (on the SSL Decryption Exclusion list)", trusted: true, cat: "computer-and-internet-info", excluded: true }
  ];
  var q = function (s) { return box.querySelector(s); };
  q("#dc-site").innerHTML = SITES.map(function (s) { return '<option value="' + s.id + '">' + esc(s.label) + "</option>"; }).join("");
  var trace = q(".trace"), v = q(".verdict");
  function run() {
    var s = SITES.filter(function (x) { return x.id === q("#dc-site").value; })[0];
    var rule = q("#dc-rule").checked, nodec = q("#dc-nodec").checked, ca = q("#dc-ca").checked, blk = q("#dc-block").checked, untrust = q("#dc-untrust").checked;
    var st = [], cls, msg;
    st.push("The client starts a TLS session. The firewall checks the Decryption policy, top to bottom, using the server name and URL category (" + s.cat + ").");
    if (s.excluded) {
      st.push("The destination is on the SSL Decryption Exclusion list, which overrides Decryption policy.");
      cls = "pass"; msg = "Not decrypted. The browser sees the server's real certificate. App-ID still uses the SNI and certificate to identify the app, but Content-ID can't see inside.";
    } else if (!rule) {
      st.push("No Decryption rule matches.");
      cls = "warn"; msg = "Not decrypted. Security policy and App-ID still apply, but antivirus, vulnerability, file blocking, and data filtering can't inspect the encrypted content.";
    } else if (nodec && s.cat === "financial-services") {
      st.push("The No-Decryption rule at the top matches financial-services, action no-decrypt.");
      if (blk && !s.trusted) { st.push("Its Decryption Profile blocks sessions with untrusted or expired certificates."); }
      cls = "pass"; msg = "Not decrypted, by design. The browser sees the bank's own certificate. This is how you respect privacy for health, finance, and similar categories.";
    } else {
      st.push("The Decrypt rule matches: action decrypt, type SSL Forward Proxy. The firewall connects to the server itself and checks the server's certificate.");
      if (!s.trusted && blk) {
        st.push("The server certificate is " + (s.expired ? "expired" : "not signed by a trusted CA") + ", and the Decryption Profile blocks sessions with " + (s.expired ? "expired" : "untrusted issuer") + " certificates.");
        cls = "fail"; msg = "Session blocked by the Decryption Profile. The Decryption log records why.";
      } else if (!s.trusted) {
        st.push("The server certificate is " + (s.expired ? "expired" : "not trusted") + ", so the firewall signs its copy with the Forward Untrust certificate" + (untrust ? " (DO NOT TRUST)." : ", but none is configured."));
        if (!untrust) { cls = "fail"; msg = "Configuration gap: with no Forward Untrust certificate, the firewall has no safe way to pass on the warning. Always configure one."; }
        else { cls = "warn"; msg = "The browser shows a certificate warning, as it should: the original site was untrustworthy, and the firewall preserves that warning. Clients must never trust the Forward Untrust CA."; }
      } else {
        st.push("The server certificate is valid, so the firewall generates a copy signed by its Forward Trust certificate and presents that to the client.");
        if (ca) {
          st.push("The client trusts the firewall's Forward Trust CA, so the browser accepts the copy.");
          cls = "pass"; msg = "Decrypted and inspected with no warning. The certificate's issuer shows the firewall's CA. Content-ID, App-ID, and WildFire now see everything.";
        } else {
          st.push("The client does not have the firewall's CA in its trusted store, so it rejects the copy.");
          cls = "warn"; msg = "Decrypted, but every site shows a certificate warning. Distribute the Forward Trust CA certificate to clients (GPO, MDM, or by hand, as Lab 12 does in Firefox).";
        }
      }
    }
    trace.innerHTML = st.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    v.className = "verdict " + cls; v.textContent = msg;
  }
  box.addEventListener("change", run); run();
})();
