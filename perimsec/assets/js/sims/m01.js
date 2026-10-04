/* Simulation 1.1: single-pass versus stacked inspection (illustrative units). */
(function () {
  "use strict";
  var box = document.getElementById("sim-1-1");
  if (!box) { return; }
  var SERVICES = [
    { id: "fw", name: "Firewall policy (ports, addresses)", fixed: true },
    { id: "app", name: "Application control" },
    { id: "ips", name: "Intrusion prevention" },
    { id: "av", name: "Antivirus" },
    { id: "url", name: "URL filtering" },
    { id: "dlp", name: "Data filtering" }
  ];
  var form = box.querySelector(".sim-controls");
  var out = box.querySelector(".sim-output");
  form.innerHTML = '<fieldset style="border:0;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:0 1.4rem"><legend style="font-weight:600;margin-bottom:0.4rem;width:100%">Security services turned on</legend>' +
    SERVICES.map(function (s) {
      return '<div class="field-inline"><label><input type="checkbox" data-s="' + s.id + '"' + (s.fixed ? " checked disabled" : (s.id === "app" || s.id === "ips" ? " checked" : "")) + "> " + s.name + "</label></div>";
    }).join("") + "</fieldset>";

  function seg(cls, w, label) {
    return '<span class="bar-seg ' + cls + '" style="width:' + w + '%" title="' + label + '"></span>';
  }
  function render() {
    var on = SERVICES.filter(function (s) {
      var cb = form.querySelector('[data-s="' + s.id + '"]');
      return cb && cb.checked;
    });
    var n = on.length;
    // Stacked: every device reassembles and parses (2 units), scans (1 unit), and adds a hop (0.5 unit).
    var stacked = n * 3.5;
    // Single-pass: parse once (2 units), scans run in parallel on one stream (1 unit + 0.25 per extra service).
    var single = 2 + 1 + (n - 1) * 0.25;
    var max = Math.max(stacked, 6);
    var stackedSegs = "", i;
    for (i = 0; i < n; i++) {
      stackedSegs += seg("hop", 0.5 / max * 100, "hop") + seg("parse", 2 / max * 100, "parse") + seg("scan", 1 / max * 100, "scan");
    }
    var singleSegs = seg("parse", 2 / max * 100, "parse once") + seg("scan", (1 + (n - 1) * 0.25) / max * 100, n > 1 ? "parallel scans" : "scan");
    out.innerHTML =
      '<div class="bars" role="img" aria-label="Stacked inspection takes ' + stacked.toFixed(1) + " units; single-pass takes " + single.toFixed(1) + ' units.">' +
        '<div class="bar-row"><span>Stacked devices</span><span class="bar-track">' + stackedSegs + "</span></div>" +
        '<div class="bar-row"><span>Single-pass</span><span class="bar-track">' + singleSegs + "</span></div>" +
      "</div>" +
      '<dl class="readout">' +
        "<div><dt>Times traffic is parsed (stacked)</dt><dd>" + n + "</dd></div>" +
        "<div><dt>Times traffic is parsed (single-pass)</dt><dd>1</dd></div>" +
        "<div><dt>Policies to manage (stacked)</dt><dd>" + n + "</dd></div>" +
        "<div><dt>Policies to manage (single-pass)</dt><dd>1</dd></div>" +
        "<div><dt>Relative processing time</dt><dd>" + (stacked / single).toFixed(1) + "×</dd></div>" +
      "</dl>" +
      '<p class="box-note" style="margin:0">Illustrative units, not measured throughput. <span class="swatch parse"></span> reassemble and parse <span class="swatch scan"></span> scan <span class="swatch hop"></span> hop between devices</p>';
  }
  form.addEventListener("change", render);
  render();
})();
