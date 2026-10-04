/* Simulation 16.1: triage discovered SaaS apps. Apps and data are invented. */
(function () {
  "use strict";
  var box = document.getElementById("sim-16-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };
  var APPS = [
    { n: "CorpDrive (the company's licensed file storage)", users: 1840, up: "212 GB", risk: 2, facts: "Company contract, SSO enforced, SOC 2 report, data stays in the US.", best: "Sanctioned", why: "It's the approved tool. Sanction it, then protect it with API scanning and posture checks." },
    { n: "QuickShare Pro (free file sharing)", users: 96, up: "38 GB", risk: 5, facts: "No business account, links public by default, breach disclosed last year, unknown data location.", best: "Unsanctioned", why: "High risk, and it duplicates CorpDrive. Block it and point users to the sanctioned tool." },
    { n: "TeamBoard (project boards)", users: 410, up: "3 GB", risk: 3, facts: "Popular with marketing and IT; personal accounts only; supports SSO on paid tiers.", best: "Tolerated", why: "Real business use but no contract yet. Tolerate it with limits, such as blocking uploads, while procurement decides." },
    { n: "PDF2Anything (online converter)", users: 233, up: "9 GB", risk: 4, facts: "Users upload contracts and HR forms to convert them; terms let the vendor keep files.", best: "Unsanctioned", why: "Sensitive documents leaving for a service that keeps them. Block it, and offer a local converter." },
    { n: "WeatherWidget (news and weather)", users: 1300, up: "0 GB", risk: 1, facts: "Read-only content, no accounts, no uploads.", best: "Tolerated", why: "Harmless and not business-critical. Tolerate it; no reason to spend effort sanctioning it." },
    { n: "AI Notetaker (meeting transcription)", users: 57, up: "4 GB", risk: 4, facts: "Joins meetings and stores transcripts; individual sign-ups; OAuth access to calendars.", best: "Unsanctioned", why: "It captures meeting content and reaches into calendars without review. Block it until it passes a security review, then reconsider." }
  ];
  var ACT = {
    Sanctioned: "Allowed. Data Security (API) scans its stored files for sensitive data and risky sharing; SSPM checks its settings.",
    Tolerated: "Allowed with limits, such as viewing but not uploading, and logged.",
    Unsanctioned: "Blocked by a Security rule using an application filter on the unsanctioned tag; users see the block page."
  };
  var tb = box.querySelector("tbody");
  tb.innerHTML = APPS.map(function (a, i) {
    return "<tr><td><strong>" + esc(a.n) + "</strong><br><small>" + esc(a.facts) + "</small></td><td>" + a.users + "</td><td>" + a.up + "</td><td>" + a.risk + " / 5</td>" +
      '<td><label class="visually-hidden" for="tg-' + i + '">Tag for ' + esc(a.n) + '</label><select id="tg-' + i + '" data-i="' + i + '"><option value="">Choose…</option><option>Sanctioned</option><option>Tolerated</option><option>Unsanctioned</option></select></td></tr>';
  }).join("");
  var out = box.querySelector(".tri-out");
  box.querySelector("[data-tri]").addEventListener("click", function () {
    var rows = [], right = 0, blank = 0;
    APPS.forEach(function (a, i) {
      var v = box.querySelector("#tg-" + i).value;
      if (!v) { blank++; return; }
      var ok = v === a.best; if (ok) { right++; }
      rows.push("<li><span class=\"tag " + (ok ? "pass" : "warn") + "\">" + (ok ? "AGREE" : "RETHINK") + "</span><span><strong>" + esc(a.n.split(" (")[0]) + ": " + v + ".</strong> " + esc(ACT[v]) + (ok ? " " : " Suggested: " + a.best + ". ") + esc(a.why) + "</span></li>");
    });
    out.innerHTML = (blank ? "<p class=\"verdict warn\">Tag all six apps (" + blank + " left).</p>" : "") + "<ul class=\"checks\">" + rows.join("") + "</ul>" +
      (blank ? "" : "<p class=\"box-note\">" + right + " of 6 match the suggested tags. These are judgment calls: a different organization could reasonably decide some of them differently. What matters is the reasoning.</p>");
  });
})();
