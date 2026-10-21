/* Marble Arch Apartments · the neighbourhood map: choose a place, see the walk. */
(function () {
  "use strict";
  var d = document;
  var map = d.querySelector("[data-map]");
  if (!map) return;
  var buttons = [].slice.call(d.querySelectorAll("[data-walk]"));
  var routes = [].slice.call(map.querySelectorAll(".route"));
  var pins = [].slice.call(map.querySelectorAll(".pin"));

  var svg = map.querySelector("svg");
  var home = map.querySelector(".home-pin circle");
  // on phones the map is larger than its frame: bring the walk into view
  function frame(id) {
    if (!svg || map.scrollWidth <= map.clientWidth + 2) return;
    var dot = map.querySelector('.pin[data-pin="' + id + '"] .dot');
    if (!dot || !home) return;
    var k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    var x = (parseFloat(dot.getAttribute("cx")) + parseFloat(home.getAttribute("cx"))) / 2 * k;
    var y = (parseFloat(dot.getAttribute("cy")) + parseFloat(home.getAttribute("cy"))) / 2 * k;
    map.scrollTo({ left: x - map.clientWidth / 2, top: y - map.clientHeight / 2, behavior: initial ? "auto" : "smooth" });
  }
  var initial = true;
  function select(id) {
    if (!id) return;
    frame(id);
    map.classList.add("is-focus");
    routes.forEach(function (r) { r.classList.toggle("is-on", r.getAttribute("data-route") === id); });
    pins.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-pin") === id); });
    buttons.forEach(function (b) {
      var on = b.getAttribute("data-walk") === id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  buttons.forEach(function (b) {
    var id = b.getAttribute("data-walk");
    b.addEventListener("click", function () { select(id); });
    b.addEventListener("mouseenter", function () { select(id); });
    b.addEventListener("focus", function () { select(id); });
  });
  map.addEventListener("click", function (e) {
    var p = e.target.closest && e.target.closest(".pin");
    if (p) select(p.getAttribute("data-pin"));
  });
  var first = d.querySelector('[data-walk="hyde-park"]') || buttons[0];
  if (first) select(first.getAttribute("data-walk"));
  initial = false;
})();
