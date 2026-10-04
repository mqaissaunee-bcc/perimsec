/* Simulation 12.1: follow a file through WildFire. */
(function () {
  "use strict";
  var box = document.getElementById("sim-12-1");
  if (!box) { return; }
  var esc = window.PS ? window.PS.esc : function (s) { return s; };
  var FILES = [
    { id: "known", label: "invoice.exe: known malware already covered by an antivirus signature", type: "pe", seen: "malware", signed: false, big: false },
    { id: "benign", label: "setup.exe: a popular installer WildFire has already judged benign", type: "pe", seen: "benign", signed: false, big: false },
    { id: "newpe", label: "update.exe: a never-seen Windows executable", type: "pe", seen: null, verdict: "malware", signed: false, big: false },
    { id: "signed", label: "driver.exe: never seen, signed by a trusted software publisher", type: "pe", seen: null, signed: true, big: false },
    { id: "doc", label: "contract.docx: a never-seen Office document with a malicious macro", type: "office", seen: null, verdict: "malware", signed: false, big: false },
    { id: "adware", label: "toolbar.exe: never seen, installs a browser toolbar and ads", type: "pe", seen: null, verdict: "grayware", signed: false, big: false },
    { id: "huge", label: "dataset.zip: never seen, larger than the configured size limit", type: "archive", seen: null, signed: false, big: true }
  ];
  var sel = box.querySelector("#wf-file"), lic = box.querySelector("#wf-lic"), trace = box.querySelector(".trace"), v = box.querySelector(".verdict");
  sel.innerHTML = FILES.map(function (f) { return '<option value="' + f.id + '">' + esc(f.label) + "</option>"; }).join("");
  function run() {
    var f = FILES.filter(function (x) { return x.id === sel.value; })[0];
    var L = lic.value; // none | wf | adv
    var s = [], cls = "pass", msg;
    s.push("A user downloads the file through a rule with a WildFire Analysis profile attached. The firewall hashes the file.");
    if (f.id === "known") {
      s.push("The Antivirus profile on the same rule recognizes the file from an existing signature and blocks it before WildFire is even needed.");
      v.className = "verdict fail"; v.textContent = "Blocked immediately by an existing signature (Module 10). WildFire exists for the files signatures don't know yet.";
      trace.innerHTML = s.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); return;
    }
    if (f.signed) { s.push("The file is signed by a trusted signer, so the firewall does not forward it."); msg = "Allowed and not forwarded."; cls = "pass"; }
    else if (f.big) { s.push("The file is larger than the size limit for its type under Device > Setup > WildFire, so it is not forwarded."); msg = "Allowed and not analyzed. Size limits are a trade-off: raise them for more coverage at the cost of bandwidth."; cls = "warn"; }
    else if (f.seen) {
      s.push("WildFire has seen this hash before. The firewall asks for the verdict instead of uploading the file again.");
      s.push("Verdict: " + f.seen + ".");
      msg = f.seen === "benign" ? "Allowed. Benign verdicts are logged in WildFire Submissions only if Report Benign Files is enabled." : "Blocked.";
      cls = f.seen === "benign" ? "pass" : "fail";
    } else if (f.type !== "pe" && L === "none") {
      s.push("Without a WildFire subscription, only Windows PE files (EXE, DLL, SCR, and similar) are forwarded. This " + f.type + " file is not.");
      msg = "Allowed and never analyzed. A WildFire subscription adds Office, PDF, archives, scripts, Linux, Android, and macOS files."; cls = "warn";
    } else {
      s.push("Unknown hash: the firewall forwards the file to the WildFire cloud (or a private WF-500/WF-600 appliance, if the profile says so).");
      s.push("WildFire runs static analysis, machine learning, and dynamic analysis in a sandbox" + (L === "adv" ? ", plus Advanced WildFire's memory analysis, automated unpacking, and hypervisor-level observation for evasive malware" : "") + ".");
      s.push("Verdict: " + f.verdict + ". This first download was already delivered while the file was being analyzed.");
      if (f.verdict === "malware") {
        s.push("WildFire generates a signature and shares it with every subscribed firewall worldwide, and updates PAN-DB for related URLs.");
        s.push(L === "none"
          ? "Without a subscription, the signature reaches your firewall in the daily Antivirus content update (requires Threat Prevention), roughly 24 to 48 hours later."
          : "With a subscription, your firewall receives the WildFire signature in near real time, per the update schedule under Device > Dynamic Updates.");
        msg = "First copy got through; every later copy is blocked once the signature arrives. Check WildFire Submissions to find who received the first one. (WildFire inline ML in the Antivirus profile, Module 10, is what can stop a first copy.)"; cls = "fail";
      } else {
        msg = "Grayware: not malicious, but unwanted. How it is handled afterward depends on your profiles' actions, and it appears in the WildFire Submissions log only if Report Grayware Files is enabled."; cls = "warn";
      }
    }
    trace.innerHTML = s.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    v.className = "verdict " + cls; v.textContent = msg;
  }
  sel.addEventListener("change", run); lic.addEventListener("change", run); run();
})();
