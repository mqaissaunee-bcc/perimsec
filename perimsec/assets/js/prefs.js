/* Loaded in <head> so the saved theme and text size apply before first paint. */
(function () {
  "use strict";
  var p = {};
  try { p = JSON.parse(localStorage.getItem("ps-prefs")) || {}; } catch (e) { p = {}; }
  var root = document.documentElement;
  root.setAttribute("data-theme", p.theme || "auto");
  if (p.scale) { root.style.setProperty("--text-scale", String(p.scale)); }
})();
