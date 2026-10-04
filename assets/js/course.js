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

  /* Weeks follow the NETW 237 11-week outline. Due dates are the end of each week. */
  window.PS_WEEKS = [
    { week: 1, due: "Wed 10/7", modules: [1, 2], labs: [1], quizzes: [1, 2] },
    { week: 2, due: "Wed 10/14", modules: [3, 4], labs: [2, 3], quizzes: [3, 4] },
    { week: 3, due: "Wed 10/21", modules: [5, 6], labs: [4, 5], quizzes: [5, 6] },
    { week: 4, due: "Wed 10/28", modules: [7], labs: [6], quizzes: [7] },
    { week: 5, due: "Wed 11/4", modules: [8, 9], labs: [7, 8], quizzes: [8, 9] },
    { week: 6, due: "Wed 11/11", modules: [10, 11], labs: [9, 10], quizzes: [10, 11] },
    { week: 7, due: "Wed 11/18", modules: [12], labs: [11], quizzes: [12] },
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
    8: "Controlling Access to Network Resources with User-ID",
    9: "Blocking Known Threats Using Security Profiles",
    10: "Blocking Inappropriate Web Traffic with Advanced URL Filtering",
    11: "Blocking Unknown Threats with WildFire",
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
    { n: 5, file: "module-05.html", available: false, edu: "EDU-210 Module 5", lab: 4,
      title: "Connecting Security Zones",
      short: "Segmentation and zones, tap, virtual wire, and Layer 3 interfaces, subinterfaces, virtual routers, and static routes." },
    { n: 6, file: "module-06.html", available: false, edu: "EDU-210 Module 6", lab: 5,
      title: "Security Policies",
      short: "Packet flow, rule types, rule matching and shadowing, address objects and groups, tags, schedules, and policy testing." },
    { n: 7, file: "module-07.html", available: false, edu: "EDU-210 Module 7", lab: 6,
      title: "NAT Policies",
      short: "Source NAT types, DIPP oversubscription, destination NAT and port translation, and the pre-NAT/post-NAT rule logic." },
    { n: 8, file: "module-08.html", available: false, edu: "EDU-210 Module 8", lab: 7,
      title: "Application Identity (App-ID)",
      short: "How App-ID classifies traffic, shifts and dependencies, groups and filters, unknown traffic, and Policy Optimizer migration." },
    { n: 9, file: "module-09.html", available: false, edu: "EDU-210 Module 12", lab: 8,
      title: "User-ID",
      short: "User and group mapping, the integrated and Windows agents, mapping methods, LDAP group filters, and dynamic user groups." },
    { n: 10, file: "module-10.html", available: false, edu: "EDU-210 Module 9", lab: 9,
      title: "Security Profiles",
      short: "Content-ID, vulnerability, antivirus, and anti-spyware profiles, DNS sinkholing, file blocking, data filtering, and profile groups." },
    { n: 11, file: "module-11.html", available: false, edu: "EDU-210 Module 10", lab: 10,
      title: "Advanced URL Filtering",
      short: "PAN-DB categories, URL profiles versus policy matching, custom categories, action precedence, and response pages." },
    { n: 12, file: "module-12.html", available: false, edu: "EDU-210 Module 11", lab: 11,
      title: "WildFire",
      short: "Verdicts, the WildFire analysis flow, licensing and deployments, analysis profiles, and reading WildFire reports." },
    { n: 13, file: "module-13.html", available: false, edu: "EDU-210 Module 13", lab: 12,
      title: "Encrypted Traffic and Decryption",
      short: "PKI and certificates, SSL forward proxy, inbound inspection, exclusions, SSH proxy, and decryption troubleshooting." },
    { n: 14, file: "module-14.html", available: false, edu: "EDU-210 Module 14", lab: 13,
      title: "Logs and Reports",
      short: "Dashboard, ACC, log types, App Scope, predefined and custom reports, correlation, and log forwarding." },
    { n: 15, file: "module-15.html", available: false, edu: "Supplemental", lab: null,
      title: "SASE Overview and Architecture",
      short: "Why the perimeter moved, SASE building blocks (SWG, ZTNA, FWaaS, SD-WAN), and how Prisma Access implements them." },
    { n: 16, file: "module-16.html", available: false, edu: "Supplemental", lab: null,
      title: "Cloud Access Security Broker (CASB)",
      short: "Shadow IT, inline and API-based CASB, SaaS posture and data protection, and Palo Alto Networks SaaS Security." }
  ];

  /* Simulations listed on simulations.html. anchor = element id on the module page. */
  window.PS_SIMS = [
    { module: 1, anchor: "sim-1-1", title: "Single-pass versus stacked inspection", desc: "Turn on security services and compare how many times traffic is parsed by a single-pass engine and by a chain of separate devices." },
    { module: 2, anchor: "sim-2-1", title: "Bring the management interface online", desc: "Enter MGT addressing, permitted IPs, and services for a lab firewall, then see what would work, what would fail, and what would lock you out." },
    { module: 2, anchor: "sim-2-2", title: "Admin password checker", desc: "Test a new password against the rules PAN-OS enforces for the predefined admin account." },
    { module: 3, anchor: "sim-3-1", title: "Candidate and running configuration lab", desc: "Two administrators make changes, save, revert, lock, and commit. Watch the candidate, running, and saved configurations change." },
    { module: 4, anchor: "sim-4-1", title: "Authentication sequence tracer", desc: "Order LDAP, RADIUS, and local profiles, take servers offline, and trace exactly how the firewall authenticates and authorizes an admin." }
  ];
})();
