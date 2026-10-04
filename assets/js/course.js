/* Course data for the Perimeter Security site.
   Edit this file to change dates, mark modules available, or add simulations.
   Every page reads it, so the home page, schedule, simulations index and
   My work page stay in sync. */
(function () {
  "use strict";

  window.PS_COURSE = {
    title: "Perimeter Security",
    subtitle: "Next-generation firewall essentials",
    institution: "Brookdale Community College",
    courseCode: "NETW 237",
    term: "Fall 2026",
    year: "2026",
    storagePrefix: "ps-",
    alignment: "Aligned to the Palo Alto Networks Firewall Essentials: Configuration and Management (EDU-210) curriculum, PAN-OS 11.",
    disclaimer: "Independent study companion. Not affiliated with or endorsed by Palo Alto Networks. Product names are trademarks of their owners."
  };

  /* Weeks follow the NETW 237 11-week outline. Due dates are the end of each week.
     Lab numbers are NDG Online's own numbers (PAN-OS 11.0 Firewall Essentials), so students see the same number here and in NDG. */
  window.PS_WEEKS = [
    { week: 1, due: "Wed 10/7", modules: [1, 2], labs: [1], quizzes: [1, 2] },
    { week: 2, due: "Wed 10/14", modules: [3, 4], labs: [2, 3], quizzes: [3, 4] },
    { week: 3, due: "Wed 10/21", modules: [5, 6], labs: [4, 5], quizzes: [5, 6] },
    { week: 4, due: "Wed 10/28", modules: [7], labs: [6], quizzes: [7] },
    { week: 5, due: "Wed 11/4", modules: [8, 9], labs: [7, 11], quizzes: [8, 9], note: "Lab 11 (User-ID) is done this week, ahead of Labs 8–10, to match the module order." },
    { week: 6, due: "Wed 11/11", modules: [10, 11], labs: [8, 9], quizzes: [10, 11] },
    { week: 7, due: "Wed 11/18", modules: [12], labs: [10], quizzes: [12] },
    { week: 8, due: "Wed 11/25", modules: [13], labs: [12], quizzes: [13], note: "Thanksgiving week: plan ahead." },
    { week: 9, due: "Wed 12/2", modules: [14], labs: [13], quizzes: [14] },
    { week: 10, due: "Wed 12/9", modules: [15, 16], labs: [], quizzes: [15, 16] },
    { week: 11, due: "Wed 12/16", modules: [], labs: [14], quizzes: [], checkpoint: "Capstone lab and final exam" }
  ];

  window.PS_LABS = {
    1: "Configuring Initial Firewall Settings",
    2: "Managing Firewall Configurations",
    3: "Managing Firewall Administrator Accounts",
    4: "Connecting the Firewall to Production Networks with Security Zones",
    5: "Creating and Managing Security Policy Rules",
    6: "Creating and Managing NAT Policy Rules",
    7: "Controlling Application Usage with App-ID",
    8: "Blocking Known Threats Using Security Profiles",
    9: "Blocking Inappropriate Web Traffic with Advanced URL Filtering",
    10: "Blocking Unknown Threats with WildFire",
    11: "Controlling Access to Network Resources with User-ID",
    12: "Using Decryption to Block Threats in Encrypted Traffic",
    13: "Locating Valuable Information Using Logs and Reports",
    14: "Capstone"
  };

  /* available: true once the module page exists in /modules/. */
  window.PS_MODULES = [
    { n: 1, file: "module-01.html", available: true, edu: "EDU-210 Module 1", lab: null,
      title: "Platform and Architecture",
      short: "Palo Alto Networks portfolio, single-pass architecture, control and data planes, Zero Trust, and firewall form factors.",
      sections: 7 },
    { n: 2, file: "module-02.html", available: true, edu: "EDU-210 Module 2", lab: 1,
      title: "Initial Firewall Configuration",
      short: "First access, the management interface, DNS and NTP, service routes, licensing, dynamic updates, and PAN-OS upgrades.",
      sections: 8 },
    { n: 3, file: "module-03.html", available: true, edu: "EDU-210 Module 3", lab: 2,
      title: "Managing Firewall Configurations",
      short: "Candidate and running configurations, commit, save, revert, load, export, locks, and the System and Configuration logs.",
      sections: 7 },
    { n: 4, file: "module-04.html", available: true, edu: "EDU-210 Module 4", lab: 3,
      title: "Firewall Administrator Accounts",
      short: "Authentication versus authorization, admin roles, local and external accounts, authentication sequences, and certificate login.",
      sections: 7 },
    { n: 5, file: "module-05.html", available: true, edu: "EDU-210 Module 5", lab: 4,
      title: "Connecting Security Zones",
      short: "Segmentation and zones, tap, virtual wire, and Layer 3 interfaces, subinterfaces, virtual routers, and static routes.",
      sections: 7 },
    { n: 6, file: "module-06.html", available: true, edu: "EDU-210 Module 6", lab: 5,
      title: "Security Policies",
      short: "Packet flow, rule types, rule matching and shadowing, address objects and groups, tags, schedules, and policy testing.",
      sections: 8 },
    { n: 7, file: "module-07.html", available: true, edu: "EDU-210 Module 7", lab: 6,
      title: "NAT Policies",
      short: "Source NAT types, DIPP oversubscription, destination NAT and port translation, and the pre-NAT/post-NAT rule logic.",
      sections: 6 },
    { n: 8, file: "module-08.html", available: true, edu: "EDU-210 Module 8", lab: 7,
      title: "Application Identity (App-ID)",
      short: "How App-ID classifies traffic, shifts and dependencies, groups and filters, unknown traffic, and Policy Optimizer migration.",
      sections: 8 },
    { n: 9, file: "module-09.html", available: true, edu: "EDU-210 Module 12", lab: 11,
      title: "User-ID",
      short: "User and group mapping, the integrated and Windows agents, mapping methods, LDAP group filters, and dynamic user groups.",
      sections: 7 },
    { n: 10, file: "module-10.html", available: true, edu: "EDU-210 Module 9", lab: 8,
      title: "Security Profiles",
      short: "Content-ID, vulnerability, antivirus, and anti-spyware profiles, DNS sinkholing, file blocking, data filtering, and profile groups.",
      sections: 8 },
    { n: 11, file: "module-11.html", available: true, edu: "EDU-210 Module 10", lab: 9,
      title: "Advanced URL Filtering",
      short: "PAN-DB categories, URL profiles versus policy matching, custom categories, action precedence, and response pages.",
      sections: 7 },
    { n: 12, file: "module-12.html", available: true, edu: "EDU-210 Module 11", lab: 10,
      title: "WildFire",
      short: "Verdicts, the WildFire analysis flow, licensing and deployments, analysis profiles, and reading WildFire reports.",
      sections: 6 },
    { n: 13, file: "module-13.html", available: true, edu: "EDU-210 Module 13", lab: 12,
      title: "Encrypted Traffic and Decryption",
      short: "PKI and certificates, SSL forward proxy, inbound inspection, exclusions, SSH proxy, and decryption troubleshooting.",
      sections: 8 },
    { n: 14, file: "module-14.html", available: true, edu: "EDU-210 Module 14", lab: 13,
      title: "Logs and Reports",
      short: "Dashboard, ACC, log types, App Scope, predefined and custom reports, correlation, and log forwarding.",
      sections: 8 },
    { n: 15, file: "module-15.html", available: true, edu: "Supplemental", lab: null,
      title: "SASE Overview and Architecture",
      short: "Why the perimeter moved, SASE building blocks (SWG, ZTNA, FWaaS, SD-WAN), and how Prisma Access implements them.",
      sections: 7 },
    { n: 16, file: "module-16.html", available: true, edu: "Supplemental", lab: null,
      title: "Cloud Access Security Broker (CASB)",
      short: "Shadow IT, inline and API-based CASB, SaaS posture and data protection, and Palo Alto Networks SaaS Security.",
      sections: 7 }
  ];

  /* Simulations listed on simulations.html. anchor = element id on the module page. */
  window.PS_SIMS = [
    { module: 1, anchor: "sim-1-1", title: "Single-pass versus stacked inspection", desc: "Turn on security services and compare how many times traffic is parsed by a single-pass engine and by a chain of separate devices." },
    { module: 2, anchor: "sim-2-1", title: "Bring the management interface online", desc: "Enter MGT addressing, permitted IPs, and services for a lab firewall, then see what would work, what would fail, and what would lock you out." },
    { module: 2, anchor: "sim-2-2", title: "Admin password checker", desc: "Test a new password against the rules PAN-OS enforces for the predefined admin account." },
    { module: 3, anchor: "sim-3-1", title: "Candidate and running configuration lab", desc: "Two administrators make changes, save, revert, lock, and commit. Watch the candidate, running, and saved configurations change." },
    { module: 5, anchor: "sim-5-1", title: "Zone mapper", desc: "Assign the lab interfaces to zones and see which flows are intrazone, interzone, or dropped before any rule exists." },
    { module: 5, anchor: "sim-5-2", title: "Route lookup", desc: "Enter a destination and watch the virtual router apply longest-prefix match, metrics, and path monitoring, and see the destination zone that results." },
    { module: 6, anchor: "sim-6-1", title: "Packet flow stepper", desc: "Step a packet through session lookup, zones, routing, NAT, App-ID, policy, decryption, and Content-ID for four scenarios." },
    { module: 6, anchor: "sim-6-2", title: "Security policy rule tester", desc: "Test sessions against a rulebase, reorder and disable rules, and watch first-match results and shadow warnings change." },
    { module: 7, anchor: "sim-7-1", title: "Write the rules for NAT scenarios", desc: "Fill in NAT and Security rule zones and addresses for four NAT scenarios and learn the pre-NAT address, post-NAT zone rule." },
    { module: 7, anchor: "sim-7-2", title: "DIPP pool capacity", desc: "Estimate whether a DIPP pool and oversubscription rate can carry your users' sessions." },
    { module: 8, anchor: "sim-8-1", title: "Label the session", desc: "Read what happened in a session and choose the label App-ID writes in the Traffic log: incomplete, insufficient-data, not-applicable, unknown, or a real application." },
    { module: 8, anchor: "sim-8-2", title: "Convert a port-based rule", desc: "Use Policy Optimizer's four conversion methods on a legacy rule and see what each one allows, breaks, or writes into policy by mistake." },
    { module: 9, anchor: "sim-9-1", title: "Choose the mapping methods", desc: "Describe an organization and get the User-ID mapping methods that fit it, with reasons." },
    { module: 9, anchor: "sim-9-2", title: "Who gets what", desc: "Watch user and group mapping decide which rule matches for mapped, multi-group, and unmapped users." },
    { module: 10, anchor: "sim-10-1", title: "Which profile catches it?", desc: "Attach Security Profiles to an allow rule and see which threats are stopped, which get through, and which log records them." },
    { module: 10, anchor: "sim-10-2", title: "Follow a sinkholed lookup", desc: "Step through a DNS sinkhole from infected host to Threat log to Traffic log, and see why the Threat log points at the DNS server." },
    { module: 11, anchor: "sim-11-1", title: "What happens to this URL?", desc: "Set URL Filtering profile actions and trace how custom categories, EDLs, PAN-DB, and multi-category precedence decide a URL's fate." },
    { module: 12, anchor: "sim-12-1", title: "Follow a file through WildFire", desc: "Trace known, unknown, signed, oversized, and grayware files through WildFire at three license levels, and see when protection arrives." },
    { module: 13, anchor: "sim-13-1", title: "What does the browser see?", desc: "Toggle decrypt and no-decrypt rules, the Forward Untrust certificate, the Decryption profile, and client trust, then see what certificate the user gets." },
    { module: 14, anchor: "sim-14-1", title: "Where would you look?", desc: "Match investigation questions to the right tool: Dashboard, ACC, a specific log, App Scope, a report, or correlated events." },
    { module: 14, anchor: "sim-14-2", title: "Log filter builder", desc: "Build log filters clause by clause, the way the Add Log Filter dialog does, and check them against filters from the labs." },
    { module: 15, anchor: "sim-15-1", title: "Where does the traffic go?", desc: "Compare hub-and-spoke backhaul with cloud-delivered inspection for users at headquarters, a branch, home, and on the road." },
    { module: 16, anchor: "sim-16-1", title: "Triage discovered apps", desc: "Tag six discovered SaaS apps as sanctioned, tolerated, or unsanctioned and see the controls and reasoning for each." },
    { module: 4, anchor: "sim-4-1", title: "Authentication sequence tracer", desc: "Order LDAP, RADIUS, and local profiles, take servers offline, and trace exactly how the firewall authenticates and authorizes an admin." }
  ];
})();
