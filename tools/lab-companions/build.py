#!/usr/bin/env python3
"""Build the full lab companion pages in /labs/ from the text sources in ./src/.

Run from this folder:  python3 build.py
Output is written straight to ../../labs/ (lab-NN.html). The pages use the
site's shared CSS and scripts, so they look and behave like the module pages.

Source format (one file per lab, src/labNN.txt)
-----------------------------------------------
First lines are header fields:
    title: Configuring Initial Firewall Settings
    lede: One-paragraph summary shown under the title.
    snapshot: edu-210-11.0a-01.xml
    uses: Sections 2.1 to 2.5
Then sections. Each starts with a line:
    = id | Rail label | Heading | Part name
Section ids must be: overview setup walkthrough reference stuck production
selfcheck evidence cheat (nine sections, in that order).

Block syntax inside a section:
    ## 2.2 Task title          task heading (step numbering restarts)
    > text                     task intro (muted paragraph)
    1. text                    numbered step (continue with lines indented 3 spaces)
    - text                     bullet
    ### text                   sub-heading
    !shot text                 screenshot marker (also listed in the evidence checklist)
    !fix Title | text          guide correction      !stuck Title | text   common trap
    !tip Title | text          tip                   !why Title | text     why it matters
    !q Title | text            guide question hint (never the answer)
    $fw cmd / $cl cmd / $srv cmd / $root cmd   CLI line with that host's prompt
    $f filter                  log filter expression (no prompt)
    | a | b | c                table row (first row is the header)
    ?? question  then  => answer      self-check pair (answer may continue on lines)
    [] label | where           extra evidence checklist item
    @network                   the shared lab network table
    @baseline                  the standard "load and commit the snapshot" task
    @cheatprint                the print-the-cheat-sheet button
    anything else              paragraph (consecutive lines join)
Inline: **bold**, `code`, [[Device > Setup]] web UI path, {{term|text}} glossary
term, [text](url) link, ->Lab N<- link to another lab page, ->Mod N<- module link.
"""
import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "labs"))

SECTION_IDS = ["overview", "setup", "walkthrough", "reference", "stuck",
               "production", "selfcheck", "evidence", "cheat"]
SEC_N = {"overview": "01", "setup": "02", "walkthrough": "03", "reference": "04",
         "stuck": "05", "production": "06", "selfcheck": "07", "evidence": "08", "cheat": "09"}

LABS = {
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
    14: "Capstone",
}
# lab -> (module number, module title, week, due, time)
META = {
    1: (2, "Initial Firewall Configuration", 1, "Wed 10/7", "45 to 60 minutes"),
    2: (3, "Managing Firewall Configurations", 2, "Wed 10/14", "45 to 60 minutes"),
    3: (4, "Firewall Administrator Accounts", 2, "Wed 10/14", "60 to 75 minutes"),
    4: (5, "Connecting Security Zones", 3, "Wed 10/21", "60 to 75 minutes"),
    5: (6, "Security Policies", 3, "Wed 10/21", "75 to 90 minutes"),
    6: (7, "NAT Policies", 4, "Wed 10/28", "45 to 60 minutes"),
    7: (8, "Application Identity (App-ID)", 5, "Wed 11/4", "75 to 90 minutes"),
    11: (9, "User-ID", 5, "Wed 11/4", "60 to 75 minutes"),
    8: (10, "Security Profiles", 6, "Wed 11/11", "75 to 90 minutes"),
    9: (11, "Advanced URL Filtering", 6, "Wed 11/11", "60 to 75 minutes"),
    10: (12, "WildFire", 7, "Wed 11/18", "About 45 minutes"),
    12: (13, "Encrypted Traffic and Decryption", 8, "Wed 11/25", "75 to 90 minutes"),
    13: (14, "Logs and Reports", 9, "Wed 12/2", "60 to 75 minutes"),
    14: (None, None, 11, "Wed 12/16", "2 to 3 hours"),
}
PROMPTS = {
    "fw": "admin@firewall-a&gt;",
    "cl": "lab-user@client-a:~/Desktop/Lab-Files$",
    "root": "root@client-a:/home/lab-user/Desktop/Lab-Files#",
    "srv": "paloalto42@extranet1:~$",
}
CAMERA = ('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" '
          'd="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>')

NETWORK = """<div class="table-wrap"><table>
<caption class="visually-hidden">Hosts in the lab network</caption>
<thead><tr><th scope="col">Host</th><th scope="col">Address</th><th scope="col">Role</th></tr></thead>
<tbody>
<tr><td>Client</td><td><code>192.168.1.20</code></td><td>Your workstation (Zorin Linux). Firefox, Terminal Emulator, and Remmina live here.</td></tr>
<tr><td>Firewall MGT</td><td><code>192.168.1.254</code></td><td>Web interface and SSH (hostname firewall-a)</td></tr>
<tr><td>vRouter</td><td><code>192.168.1.10</code></td><td>Gateway for the management interface</td></tr>
<tr><td>Firewall data ports</td><td><code>203.0.113.20</code>, <code>192.168.1.1</code>, <code>192.168.50.1</code></td><td>ethernet1/1 (Internet), ethernet1/2 (users), ethernet1/3 (extranet), once Lab 4 builds them</td></tr>
<tr><td>Extranet servers</td><td><code>192.168.50.0/24</code></td><td>Web server .80, DNS .53, LDAP .89, RADIUS .150, DMZ host .10</td></tr>
<tr><td>Internet side</td><td><code>203.0.113.1</code></td><td>The ISP router; 8.8.8.8 and real websites are beyond it</td></tr>
</tbody></table></div>
<p class="box-note">Usernames and passwords are in the Lab Settings table on page 5 of each lab guide. They are not repeated here, because this site is public.</p>"""


def esc(s):
    return html.escape(s, quote=False)


def inline(s, root=".."):
    """Convert inline markup. Escapes HTML first, then re-inserts markup."""
    out = esc(s)
    out = re.sub(r"\[\[(.+?)\]\]", lambda m: '<span class="path" data-path="%s"></span>' % m.group(1).replace('"', "&quot;"), out)
    out = re.sub(r"\{\{([a-z0-9-]+)\|(.+?)\}\}", r'<dfn data-term="\1">\2</dfn>', out)
    out = re.sub(r"`(.+?)`", r"<code>\1</code>", out)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', out)
    out = re.sub(r"-&gt;Lab (\d+)&lt;-", lambda m: '<a href="lab-%02d.html">Lab %s</a>' % (int(m.group(1)), m.group(1)), out)
    out = re.sub(r"-&gt;Mod (\d+)&lt;-", lambda m: '<a href="%s/modules/module-%02d.html">Module %s</a>' % (root, int(m.group(1)), m.group(1)), out)
    # typographic apostrophes in prose (code spans are already wrapped)
    return out


def callout(kind, rest):
    title, _, body = rest.partition("|")
    labels = {"fix": "Correction to the guide", "stuck": "Common trap", "tip": "Tip", "why": "Why this matters", "q": "Guide question, answered"}
    t = title.strip() or labels[kind]
    cls = "guideq" if kind == "q" else kind
    return '<div class="callout %s"><p class="c-title">%s</p><p>%s</p></div>' % (cls, inline(t), inline(body.strip()))


class Section:
    def __init__(self, sid, label, heading, part):
        self.id, self.label, self.heading, self.part = sid, label, heading, part
        self.lines = []


def parse(path):
    head, sections, cur = {}, [], None
    for raw in open(path, encoding="utf-8").read().splitlines():
        if raw.startswith("= "):
            parts = [p.strip() for p in raw[2:].split("|")]
            cur = Section(*parts)
            sections.append(cur)
        elif cur is None:
            if ":" in raw:
                k, _, v = raw.partition(":")
                head[k.strip()] = v.strip()
        else:
            cur.lines.append(raw)
    ids = [s.id for s in sections]
    if ids != SECTION_IDS:
        sys.exit("%s: sections must be %s, got %s" % (path, SECTION_IDS, ids))
    return head, sections


def render_blocks(lines, n, shots, extra_ev, head):
    out, para, i = [], [], 0
    step = 0
    ol_open = False
    table = []
    cli = []
    qa = []

    def flush_para():
        if para:
            out.append("<p>%s</p>" % inline(" ".join(para)))
            para.clear()

    def close_ol():
        nonlocal ol_open
        if ol_open:
            out.append("</ol>")
            ol_open = False

    def flush_table():
        if table:
            rows = [[c.strip() for c in r.strip().strip("|").split("|")] for r in table]
            cls = ' class="stuck-table"' if rows[0][0].lower().startswith("symptom") else ""
            h = "".join('<th scope="col">%s</th>' % inline(c) for c in rows[0])
            body = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % inline(c) for c in r) for r in rows[1:])
            out.append('<div class="table-wrap"><table%s><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (cls, h, body))
            table.clear()

    def flush_cli():
        if cli:
            kinds = {k for k, _ in cli}
            label = "Log filter" if kinds == {"f"} else "Command"
            rows = []
            for k, c in cli:
                if k == "f":
                    rows.append('<span class="cmd">%s</span>' % esc(c))
                else:
                    rows.append('<span class="prompt">%s</span> <span class="cmd">%s</span>' % (PROMPTS[k], esc(c)))
            kind_attr = "filter" if label == "Log filter" else "command"
            out.append('<pre class="cli" data-kind="%s"><span class="kind">%s</span>%s</pre>' % (kind_attr, label, "\n".join(rows)))
            cli.clear()

    def flush_qa():
        if qa:
            q, a = qa[0], " ".join(qa[1:])
            out.append('<details class="qa"><summary>%s</summary><div class="qa-a"><p>%s</p></div></details>' % (inline(q), inline(a)))
            qa.clear()

    def flush_all(keep_ol=False):
        flush_para(); flush_table(); flush_cli(); flush_qa()
        if not keep_ol:
            close_ol()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if not s:
            flush_para(); flush_table(); flush_cli(); flush_qa()
            i += 1
            continue
        if qa and not s.startswith(("??", "=>")) and not re.match(r"^(##|- |\d+\. |!|\$|\||\[\]|@|<)", s):
            qa.append(s); i += 1; continue
        m = re.match(r"^(\d+)\. (.*)$", s)
        if m:
            flush_para(); flush_table(); flush_cli(); flush_qa()
            text = [m.group(2)]
            while i + 1 < len(lines) and lines[i + 1].startswith("   ") and lines[i + 1].strip():
                i += 1
                text.append(lines[i].strip())
            step += 1
            if not ol_open:
                out.append('<ol class="steps-list" start="%d">' % step)
                ol_open = True
            out.append("<li>%s</li>" % inline(" ".join(text)))
            i += 1
            continue
        if s.startswith("## "):
            flush_all()
            step = 0
            t = s[3:]
            mm = re.match(r"^(\d+(?:\.\d+)?)\s+(.*)$", t)
            if mm:
                out.append('<h3 class="task-head"><span class="tn">%s</span>%s</h3>' % (esc(mm.group(1)), inline(mm.group(2))))
            else:
                out.append('<h3 class="task-head">%s</h3>' % inline(t))
        elif s.startswith("### "):
            flush_all(); out.append("<h4>%s</h4>" % inline(s[4:]))
        elif s.startswith("> "):
            flush_all(); out.append('<p class="task-intro">%s</p>' % inline(s[2:]))
        elif s.startswith("- "):
            flush_para(); flush_table(); flush_cli(); flush_qa(); close_ol()
            items = [s[2:]]
            while i + 1 < len(lines) and lines[i + 1].strip().startswith("- "):
                i += 1
                items.append(lines[i].strip()[2:])
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % inline(x) for x in items))
        elif s.startswith("!shot "):
            flush_para(); flush_table(); flush_cli(); flush_qa()
            shots.append(s[6:].strip())
            k = len(shots)
            close_ol()
            out.append('<p class="shot" id="shot-%d">%s<span><span class="shot-k">Screenshot %d</span> %s</span></p>' % (k, CAMERA, k, inline(s[6:].strip())))
        elif re.match(r"^!(fix|stuck|tip|why|q) ", s):
            flush_para(); flush_table(); flush_cli(); flush_qa(); close_ol()
            kind, rest = s[1:].split(" ", 1)
            out.append(callout(kind, rest))
        elif s.startswith("$"):
            flush_para(); flush_table(); flush_qa(); close_ol()
            k, _, c = s[1:].partition(" ")
            if k not in PROMPTS and k != "f":
                sys.exit("unknown prompt %s" % k)
            cli.append((k, c))
        elif s.startswith("|"):
            flush_para(); flush_cli(); flush_qa(); close_ol()
            table.append(s)
        elif s.startswith("??"):
            flush_all(); qa.append(s[2:].strip())
        elif s.startswith("=>"):
            qa.append(s[2:].strip())
        elif s.startswith("[]"):
            lab, _, where = s[2:].partition("|")
            extra_ev.append((lab.strip(), where.strip()))
        elif s.startswith("<"):
            flush_all(); out.append(s)
        elif s == "@network":
            flush_all(); out.append(NETWORK)
        elif s == "@cheatprint":
            flush_all(); out.append('<p><button type="button" class="btn" data-print="cheat">Print only this cheat sheet</button></p>')
        elif s == "@baseline":
            flush_all()
            snap = head["snapshot"]
            out.append('<h3 class="task-head"><span class="tn">2.1</span>Load the lab configuration</h3>')
            out.append('<p class="task-intro">Every lab starts from a known baseline, so your firewall matches the guide no matter what you did last time.</p>')
            out.append('<ol class="steps-list" start="1">'
                       '<li>On the client desktop, log in as <code>lab-user</code>, open Firefox, and browse to <code>https://192.168.1.254</code>. Log in as <code>admin</code> with the password from Lab Settings. If the login page does not appear, wait 1 to 3 minutes for the firewall to finish booting and refresh.</li>'
                       '<li>Go to <span class="path" data-path="Device > Setup > Operations"></span> and click <strong>Load named configuration snapshot</strong>. Choose <code>%s</code> and click OK, then Close.</li>'
                       '<li>Open <strong>Tasks</strong> (lower right) and confirm the Load task shows completed.</li>'
                       '<li>Click <strong>Commit</strong> (upper right), then <strong>Commit</strong> in the dialog, and wait for it to finish.</li>'
                       '</ol>' % esc(snap))
            out.append('<div class="callout stuck"><p class="c-title">Loading is not committing</p><p>A loaded snapshot replaces only the candidate configuration. Until you commit, the firewall is still running whatever was there before, and nothing in the lab will match the guide.</p></div>')
            step = 0
        else:
            close_ol() if not ol_open else None
            if ol_open:
                close_ol()
            para.append(s)
        i += 1
    flush_all()
    return "\n".join(out)


def build(n):
    path = os.path.join(SRC, "lab%02d.txt" % n)
    head, sections = parse(path)
    mod_n, mod_t, week, due, time = META[n]
    shots, extra_ev = [], []
    rendered = {}
    for sec in sections:
        if sec.id == "evidence":
            continue
        rendered[sec.id] = render_blocks(sec.lines, n, shots, extra_ev, head)
    # evidence section: its own text, then the checklist built from the markers
    ev_intro = render_blocks(next(s for s in sections if s.id == "evidence").lines, n, [], extra_ev, head)
    items = []
    idx = 0
    for k, s in enumerate(shots, 1):
        items.append('<li><input type="checkbox" id="ev%d-%d"><div><label for="ev%d-%d">Screenshot %d: %s</label><a class="ev-where" href="#shot-%d">Find it in the walkthrough</a></div></li>'
                     % (n, idx, n, idx, k, inline(s), k))
        idx += 1
    for lab, where in extra_ev:
        items.append('<li><input type="checkbox" id="ev%d-%d"><div><label for="ev%d-%d">%s</label>%s</div></li>'
                     % (n, idx, n, idx, inline(lab), ('<span class="ev-where">%s</span>' % inline(where)) if where else ""))
        idx += 1
    rendered["evidence"] = ev_intro + '\n<ul class="checklist evidence" data-save="lab%d-evidence">%s</ul>' % (n, "".join(items)) + \
        '\n<p class="box-note">Checkmarks are saved in this browser only. They help you keep track; the screenshots themselves go to Canvas.</p>'

    units = []
    for sec in sections:
        units.append('<section class="unit" id="s-%s" data-section="%s" data-label="%s" data-part="%s">\n<header><span class="sec-n">%s</span><h2>%s</h2></header>\n%s\n</section>'
                     % (sec.id, sec.id, esc(sec.label), esc(sec.part), SEC_N[sec.id], inline(sec.heading), rendered[sec.id]))

    title = LABS[n]
    if mod_n:
        kicker = "Lab %d of 14 in NDG Online. Week %d, due %s. Goes with Module %d: %s." % (n, week, due, mod_n, mod_t)
        brief = '<a class="btn" href="../modules/module-%02d.html#s-lab">Lab %d briefing in Module %d</a>' % (mod_n, n, mod_n)
    else:
        kicker = "Lab %d of 14 in NDG Online. Week %d, due %s. The capstone." % (n, week, due)
        brief = '<a class="btn" href="../capstone.html">Capstone briefing page</a>'
    facts = ["About " + time if time[0].isdigit() else time, "NDG Online, Lab %d" % n,
             "Snapshot <code>%s</code>" % esc(head["snapshot"]), "%d screenshots to capture" % len(shots)]
    if head.get("uses"):
        facts.insert(2, "Uses " + esc(head["uses"]))

    page = """<!DOCTYPE html>
<html lang="en" data-theme="auto">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lab {n} companion: {title_e} | Perimeter Security</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="../assets/css/site.css">
<script src="../assets/js/prefs.js"></script>
</head>
<body data-root=".." data-lab="{n}" data-page="labs/index.html">
<a class="skip-link" href="#main">Skip to main content</a>
<header id="site-header"></header>

<main id="main" class="page">
<div class="module-hero">
<p class="kicker">{kicker}</p>
<h1>Lab {n}: {title_e}</h1>
<p class="lede">{lede}</p>
<ul class="facts">{facts}</ul>
<div class="lab-hero-links">{brief}<a class="btn btn-quiet" href="index.html">All lab companions</a><a class="btn btn-quiet" href="#s-evidence">Screenshot checklist</a></div>
</div>

<div class="module-layout">
<nav class="module-rail" aria-label="This lab companion">
<h2>This lab</h2>
<div class="progress-wrap"><span class="label" id="rail-meter-label">0 sections reviewed</span>
<div class="meter" role="progressbar" aria-labelledby="rail-meter-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="rail-meter"></span></div></div>
<ol id="rail-list"></ol>
<p><a href="#s-cheat">Jump to the cheat sheet</a></p>
</nav>
<article>
{units}
<nav class="pager" id="pager" aria-label="Lab navigation"></nav>
</article>
</div>
</main>

<footer id="site-footer"></footer>
<script src="../assets/js/course.js"></script>
<script src="../assets/js/glossary.js"></script>
<script src="../assets/js/site.js"></script>
<script src="../assets/js/activities.js"></script>
</body>
</html>
""".format(n=n, title_e=esc(title), desc=esc("Lab %d companion for Perimeter Security: walkthrough of the detailed steps for %s, screenshots to capture, troubleshooting, and a cheat sheet." % (n, title)),
           kicker=esc(kicker), lede=inline(head["lede"]), facts="".join("<li>%s</li>" % f for f in facts), brief=brief, units="\n\n".join(units))
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "lab-%02d.html" % n), "w", encoding="utf-8") as f:
        f.write(page)
    return len(shots)


if __name__ == "__main__":
    which = [int(a) for a in sys.argv[1:]] or sorted(LABS)
    for n in which:
        if not os.path.exists(os.path.join(SRC, "lab%02d.txt" % n)):
            print("skip lab %d (no source yet)" % n)
            continue
        print("lab %02d: %d screenshots" % (n, build(n)))
