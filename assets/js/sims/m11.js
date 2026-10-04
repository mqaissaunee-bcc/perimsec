/* Simulation 11.1: how the firewall decides what happens to a URL. */
(function () {
  "use strict";
  var box = document.getElementById("sim-11-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  var CATS = ["news", "shopping", "hacking", "high-risk", "phishing", "streaming-media", "social-networking", "newly-registered-domain", "unknown"];
  var DEFAULT_ACT = { news: "alert", shopping: "alert", hacking: "block", "high-risk": "continue", phishing: "block", "streaming-media": "alert", "social-networking": "alert", "newly-registered-domain": "continue", unknown: "block" };
  var URLS = [
    { u: "www.example-news.com", src: "cloud", cats: ["news"] },
    { u: "shop.example-store.com", src: "cache", cats: ["shopping"] },
    { u: "tools.example-hackers.net", src: "cloud", cats: ["hacking", "high-risk"] },
    { u: "login-verify.example.info", src: "cloud", cats: ["phishing", "newly-registered-domain"] },
    { u: "brand-new-site.example", src: "none", cats: ["unknown"] },
    { u: "www.example-video.tv", src: "cache", cats: ["streaming-media", "high-risk"] },
    { u: "partner.example-pentest.org", src: "custom", cats: ["hacking"], custom: "Allowed-Pentest-Sites" },
    { u: "www.popurls.com", src: "edl", cats: ["news"], edl: "malicious-urls-edl" }
  ];
  var RANK = { block: 5, override: 4, "continue": 3, alert: 2, allow: 1 };

  var tb = box.querySelector(".url-acts tbody");
  tb.innerHTML = CATS.map(function (c) {
    return "<tr><td>" + c + '</td><td><label class="visually-hidden" for="ua-' + c + '">Action for ' + c + "</label><select id=\"ua-" + c + '" data-c="' + c + '">' +
      ["allow", "alert", "continue", "override", "block"].map(function (a) { return "<option" + (a === DEFAULT_ACT[c] ? " selected" : "") + ">" + a + "</option>"; }).join("") + "</select></td></tr>";
  }).join("") +
    '<tr><td>Allowed-Pentest-Sites <small>(custom)</small></td><td><select id="ua-custom" aria-label="Action for custom category Allowed-Pentest-Sites"><option selected>allow</option><option>alert</option><option>block</option></select></td></tr>' +
    '<tr><td>malicious-urls-edl <small>(EDL)</small></td><td><select id="ua-edl" aria-label="Action for malicious-urls-edl"><option>alert</option><option selected>block</option></select></td></tr>';
  var sel = box.querySelector("#url-pick");
  sel.innerHTML = URLS.map(function (x, i) { return '<option value="' + i + '">' + esc(x.u) + "</option>"; }).join("");
  var trace = box.querySelector(".trace"), v = box.querySelector(".verdict");

  function act(c) { return box.querySelector('[data-c="' + c + '"]').value; }
  function run() {
    var x = URLS[parseInt(sel.value, 10)];
    var steps = [], final, why;
    steps.push("The Security rule allowing this traffic has a URL Filtering Profile attached, so the firewall looks up the URL.");
    steps.push("Custom URL categories: " + (x.custom ? "match in " + x.custom + "." : "no match."));
    if (!x.custom) { steps.push("External dynamic lists: " + (x.edl ? "match in " + x.edl + "." : "no match.")); }
    if (!x.custom && !x.edl) {
      steps.push("PAN-DB cache on the firewall: " + (x.src === "cache" ? "hit." : "miss."));
      if (x.src !== "cache") { steps.push("PAN-DB cloud: " + (x.src === "cloud" ? "categorized." : "not found, so the category is unknown.")); }
    }
    if (x.custom) {
      final = box.querySelector("#ua-custom").value;
      why = "A custom URL category match takes precedence over the predefined categories (" + x.cats.join(", ") + "), so its action decides.";
    } else if (x.edl) {
      final = box.querySelector("#ua-edl").value;
      why = "The EDL match decides, before PAN-DB is consulted.";
    } else {
      var acts = x.cats.map(function (c) { return { c: c, a: act(c) }; });
      steps.push("Categories: " + acts.map(function (a) { return a.c + " (" + a.a + ")"; }).join(", ") + ".");
      acts.sort(function (p, q) { return RANK[q.a] - RANK[p.a]; });
      final = acts[0].a;
      why = acts.length > 1 ? "The URL is in more than one category, so the most severe action wins: block, then override, then continue, then alert, then allow." : "One category, one action.";
    }
    var effect = { block: "The user sees the URL Filtering block page. Logged as block-url.", override: "The user must enter the override password to continue. Logged.", "continue": "The user sees a warning page and can click Continue. Logged.", alert: "Allowed and logged in the URL Filtering log.", allow: "Allowed and not logged." }[final];
    trace.innerHTML = steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    v.className = "verdict " + (final === "block" ? "fail" : final === "allow" || final === "alert" ? "pass" : "warn");
    v.textContent = "Action: " + final + ". " + why + " " + effect;
  }
  box.addEventListener("change", run);
  run();
})();
