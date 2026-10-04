/* Simulation 10.1: which profile catches it. Simulation 10.2: DNS sinkhole walkthrough. */
(function () {
  "use strict";
  var esc = window.PS ? window.PS.esc : function (s) { return s; };

  var cbox = document.getElementById("sim-10-1");
  if (cbox) {
    var PROFILES = [
      ["av", "Antivirus"], ["as", "Anti-Spyware"], ["vp", "Vulnerability Protection"], ["url", "URL Filtering"],
      ["fb", "File Blocking"], ["df", "Data Filtering"], ["wf", "WildFire Analysis"]
    ];
    var EVENTS = [
      { t: "An attacker sends an exploit for a known web server vulnerability to the extranet server", by: "vp", log: "Threat", act: "blocked" },
      { t: "A user downloads a known malware sample from a website", by: "av", log: "Threat", act: "blocked" },
      { t: "An infected laptop beacons to a known command-and-control server", by: "as", log: "Threat", act: "blocked" },
      { t: "An infected laptop looks up a known malicious domain in DNS", by: "as", log: "Threat", act: "sinkholed (with DNS sinkhole enabled)" },
      { t: "A user clicks a link to a known phishing site", by: "url", log: "URL Filtering", act: "blocked with a response page" },
      { t: "A user downloads a Windows .exe from a website", by: "fb", log: "Data Filtering", act: "blocked by file type" },
      { t: "An employee uploads a spreadsheet full of Social Security numbers", by: "df", log: "Data Filtering", act: "blocked at the threshold" },
      { t: "A user downloads a never-before-seen file", by: "wf", log: "WildFire Submissions", act: "forwarded for analysis (Module 12)" },
      { t: "A user downloads known malware over HTTPS, and the traffic is not decrypted", by: null, log: "", act: "" }
    ];
    var ctl = cbox.querySelector(".cov-ctl");
    ctl.innerHTML = '<fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:600">Profiles attached to the allow rule</legend>' +
      PROFILES.map(function (p) { return '<div class="field-inline"><label><input type="checkbox" data-p="' + p[0] + '"> ' + p[1] + "</label></div>"; }).join("") +
      '</fieldset><div class="btn-row"><button type="button" data-all>Attach all</button><button type="button" data-none>None</button></div>';
    var out = cbox.querySelector(".cov-out");
    var render = function () {
      var on = {};
      PROFILES.forEach(function (p) { on[p[0]] = cbox.querySelector('[data-p="' + p[0] + '"]').checked; });
      var caught = 0;
      out.innerHTML = "<ul class=\"checks\">" + EVENTS.map(function (e) {
        if (!e.by) {
          return "<li><span class=\"tag fail\">MISS</span><span><strong>" + esc(e.t) + ".</strong> No profile can see inside encrypted traffic. Decryption (Module 13) is what closes this gap.</span></li>";
        }
        var name = PROFILES.filter(function (p) { return p[0] === e.by; })[0][1];
        if (on[e.by]) { caught++; return "<li><span class=\"tag pass\">STOP</span><span><strong>" + esc(e.t) + ".</strong> " + name + ": " + esc(e.act) + ". Logged in the " + e.log + " log.</span></li>"; }
        return "<li><span class=\"tag warn\">PASS</span><span><strong>" + esc(e.t) + ".</strong> Allowed through: the rule allows it and no " + name + " profile is attached.</span></li>";
      }).join("") + "</ul><p class=\"box-note\" style=\"margin:0.5rem 0 0\">" + caught + " of " + (EVENTS.length - 1) + " inspectable events stopped or handled.</p>";
    };
    cbox.addEventListener("change", render);
    cbox.querySelector("[data-all]").addEventListener("click", function () { cbox.querySelectorAll("[data-p]").forEach(function (c) { c.checked = true; }); render(); });
    cbox.querySelector("[data-none]").addEventListener("click", function () { cbox.querySelectorAll("[data-p]").forEach(function (c) { c.checked = false; }); render(); });
    render();
  }

  var sbox = document.getElementById("sim-10-2");
  if (sbox) {
    var STEPS = [
      { hi: ["h", "d"], t: "HostA, an infected laptop, asks the internal DNS server for dfb.7rz.ru, a command-and-control domain." },
      { hi: ["d", "f"], t: "The internal DNS server doesn't know the name, so it forwards the query to an internet resolver. The query crosses the firewall." },
      { hi: ["f"], t: "The Anti-Spyware profile's DNS signatures recognize dfb.7rz.ru as malicious. Its action is sinkhole." },
      { hi: ["f", "d"], t: "Instead of letting the query out, the firewall answers it with the sinkhole address (sinkhole.paloaltonetworks.com, or an internal address you choose)." },
      { hi: ["f"], t: "The Threat log records the event. Its source is the internal DNS server, because that is who sent the query the firewall saw." },
      { hi: ["d", "h"], t: "The DNS server passes the sinkhole answer back to HostA." },
      { hi: ["h", "s"], t: "HostA tries to connect to its command-and-control server, which it now believes is at the sinkhole address. The connection goes nowhere." },
      { hi: ["s"], t: "That attempt appears in the Traffic log with HostA's real address as the source. Filter the Traffic log for the sinkhole address to find every infected host." }
    ];
    var pos = 0;
    var txt = sbox.querySelector(".sk-text");
    function draw() {
      var s = STEPS[pos];
      sbox.querySelectorAll("[data-n]").forEach(function (g) {
        var on = s.hi.indexOf(g.getAttribute("data-n")) !== -1;
        g.querySelector("rect").setAttribute("class", on ? "svg-accent" : "svg-box");
      });
      txt.innerHTML = "<strong>Step " + (pos + 1) + " of " + STEPS.length + ".</strong> " + esc(s.t);
      sbox.querySelector("[data-sk=prev]").disabled = pos === 0;
      sbox.querySelector("[data-sk=next]").disabled = pos === STEPS.length - 1;
    }
    sbox.querySelectorAll("[data-sk]").forEach(function (b) {
      b.addEventListener("click", function () { pos += b.getAttribute("data-sk") === "next" ? 1 : -1; draw(); });
    });
    draw();
  }
})();
