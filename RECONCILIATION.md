# PAN-OS 11.0 Firewall Essentials lab companions: reconciliation report

Source of truth: NDG PDFs, Labs 1–13 v2025-10-13, Lab 14 v2024-01-15. Every PDF was read in full (text layer, all pages).
Files: `labs/lab-01.html` to `labs/lab-14.html`, drop-in replacements for the perimsec repo. Only page content and a
page-local `<style id="mb-css">` block changed; `site.css`, the JS, lab mode, and the shot/callout styling are untouched.

"Commands" = shell/CLI lines typed at a prompt. "Filters" = log-filter strings printed in the PDF (repeats counted).

| Lab | PDF commands | Matched (same prompt + machine) | PDF filters | Matched | Status |
|---|---|---|---|---|---|
| 1 Initial settings | 0 | – | 0 | – | Reconciled (GUI only) |
| 2 Managing configurations | 0 | – | 0 typed (click-built) | – | Reconciled |
| 3 Admin accounts | 0 | – | 3 | 3 | Reconciled |
| 4 Production networks | 8 | 8 | 0 | – | Reconciled |
| 5 Security policy rules | 5 | 5 | 4 | 4 | Reconciled; one flagged addition |
| 6 NAT | 1 | 1 | 1 | 1 | Reconciled |
| 7 App-ID | 0 | – | 6 | 6 | Reconciled |
| 8 Security profiles | 6 | 6 | 0 | – | Reconciled; prompt errors fixed |
| 9 URL filtering | 0 | – | 2 | 2 | Reconciled |
| 10 WildFire | 2 | 2 | 0 | – | Reconciled |
| 11 User-ID | 4 | 4 | 6 | 6 | Reconciled; prompt errors fixed |
| 12 Decryption | 0 | – | 2 | 2 | Reconciled |
| 13 Logs and reports | 1 | 1 | 1 | 1* | Reconciled |
| 14 Capstone | 4 | 4 | 0 | – | Reconciled (objectives, not steps) |

\* Lab 13's one printed filter, `(zone.src eq Users_Net)`, is an intermediate state inside the Filter Builder; it appears
verbatim in step 2.8.8, and the applied result is shown as a copyable filter block.

Zero real command gaps remain. Labs 1, 2, 3, 7, 9 and 12 have no typed commands; all their work is GUI steps.

## Applied to every lab
- Steps renumbered to match the PDF's Detailed Lab Steps one-for-one (previously condensed; e.g. 2.1's 15 steps were 4).
- Task 2.1 generated from one template and diffed against all 13 PDFs (only the snapshot name and Lab 8/13 step 15 differ).
- Machine bands: Client, Firewall web interface, Firewall CLI, Server-Extranet; inline labels where a step switches.
- Exact Lab Settings table (Client, DMZ, Firewall, vRouter) plus a pod topology diagram, zone names per lab.
- Evidence checklist regenerated from the screenshot markers (counts always match).
- Currency note: PAN-OS 11.0 reached end-of-life on 17 Nov 2024.

## Verification
- Command audit: prompt + command + machine band must all match the PDF. Results above.
- Prompt/band audit: no command's prompt contradicts its band or inline label.
- Reference/cheat-sheet sections: the CLI extras the companion adds beyond the PDF all use `admin@firewall-a>`, consistent.
- No inline event handlers; HTML balanced; all internal anchors and page links resolve.
- Headless Chromium, light/dark, desktop/phone: lab mode reaches 9/9 sections on all 14 pages; every command block has a
  working Copy button that copies only the command; no JS errors from these pages.

## Not part of this change, but needs attention
`assets/js/prefs.js`, `assets/js/glossary.js`, and `assets/js/activities.js` return 404 on the live site, and every lab
page loads them. Glossary tooltips, saved preferences, and checklist activity behavior are likely broken until those are pushed.
