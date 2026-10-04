# Perimeter Security

Interactive companion site for a next-generation firewall course, aligned to the Palo Alto Networks EDU-210 (Firewall Essentials, PAN-OS 11) curriculum. Built for NETW 237 at Brookdale Community College. Static HTML, CSS, and JavaScript: no build step, no external dependencies, works offline and inside a Canvas iframe.

## Publish on GitHub Pages

1. Create a repository (for example `perimsec`) and upload everything in this folder to its root.
2. Settings > Pages > Source: Deploy from a branch, branch `main`, folder `/ (root)`.
3. The site appears at `https://<account>.github.io/<repo>/`. All links are relative, so the repository name does not matter.

## Structure

```
index.html          Home: progress faceplate and modules by week
schedule.html       Week-by-week table (rendered from course.js)
syllabus.html       Syllabus draft: fill in the [bracketed] placeholders
glossary.html       Searchable glossary (from glossary.js)
simulations.html    Index of every simulation
my-work.html        Progress summary, backup, restore, reset
modules/            One page per module (module-01.html ...)
assets/css/site.css Design tokens and all styles (light and dark)
assets/js/
  prefs.js          Applies saved theme and text size before first paint
  course.js         Course data: weeks, due dates, labs, modules, simulations
  glossary.js       Glossary terms (used for hover definitions)
  site.js           Header, footer, progress, section rail, notes panel, tooltips
  activities.js     Quiz, sort, fact/myth, ordering, writing, guided problems, checklists
  pages.js          Schedule, glossary, simulations, and My work renderers
  sims/mNN.js       Module-specific simulations
```

## Common edits

- **Due dates or week contents:** edit `PS_WEEKS` in `assets/js/course.js`. Lab numbers there are NDG Online's numbers (User-ID is Lab 11, done in week 5).
- **Open a new module:** add `modules/module-NN.html`, then set `available: true` and `sections: <count>` for that module in `course.js`.
- **Overview video:** on the module page, find `<div class="video-slot" ...>`. Set `data-embed` to an embeddable player URL for an inline video, or `data-link` to link out to a page (for example a Screencast.com link).
- **Glossary term:** add an entry to `glossary.js`, then use `<dfn data-term="key">term</dfn>` in a module.

## Student data

Progress, answers, quiz scores, and notes are stored in the browser's localStorage under the `ps-` prefix. Nothing is sent to a server. Students can back up and restore from My work.

## Notice

Independent study companion. Not affiliated with or endorsed by Palo Alto Networks. All text, diagrams, activities, and simulations are original. Product names are trademarks of their owners.
