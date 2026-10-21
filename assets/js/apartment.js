/* Marble Arch Apartments · apartment pages: the booking bar on phones, and the photograph lightbox with room filters. */
(function () {
  "use strict";
  var bar = document.querySelector("[data-book-bar]");
  if (!bar || !("IntersectionObserver" in window)) return;
  var seen = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
    bar.classList.toggle("is-off", seen.size > 0);
  }, { threshold: 0.01 });
  ["#book", ".site-footer"].forEach(function (sel) { var el = document.querySelector(sel); if (el) io.observe(el); });
})();

(function () {
  "use strict";
  var d = document, w = window, h = d.documentElement;
  var MAA = w.MAA || {}, G = w.gsap;
  var RM = h.classList.contains("rm");
  var items = w.MAA_GALLERY || [], ROOMS = w.MAA_ROOMS || {};
  var lb = d.querySelector(".lightbox");
  if (!lb || !items.length) return;

  var stage = lb.querySelector(".lb__stage");
  var img = stage.querySelector("img");
  var altEl = lb.querySelector(".lb__alt");
  var countEl = lb.querySelector(".lb__count");
  var filters = lb.querySelector(".lb__filters");
  var closeBtn = lb.querySelector(".lb__close");
  var all = items.map(function (_, i) { return i; });
  var list = all.slice(), pos = 0, opener = null;

  function srcset(it) { return it.s + " 640w, " + it.m + " 1100w, " + it.l + " 1920w"; }

  // room filters, in the order the rooms are walked
  function addFilter(key, label) {
    var b = d.createElement("button");
    b.type = "button";
    b.setAttribute("data-room", key);
    b.setAttribute("aria-pressed", key === "all" ? "true" : "false");
    var n = key === "all" ? items.length : items.filter(function (it) { return it.room === key; }).length;
    b.textContent = label + " " + n;
    filters.appendChild(b);
  }
  addFilter("all", "All");
  Object.keys(ROOMS).forEach(function (k) {
    if (items.some(function (it) { return it.room === k; })) addFilter(k, ROOMS[k]);
  });
  function setRoom(room) {
    list = room === "all" ? all.slice() : all.filter(function (i) { return items[i].room === room; });
    filters.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-room") === room ? "true" : "false"); });
    show(0, 0);
  }
  filters.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) setRoom(b.getAttribute("data-room"));
  });

  function paint(it) {
    img.srcset = srcset(it);
    img.sizes = "100vw";
    img.src = it.m;
    img.alt = it.alt;
    altEl.textContent = it.alt;
    countEl.textContent = (pos + 1) + " / " + list.length;
  }
  function preload(p) {
    var it = items[list[(p + list.length) % list.length]];
    if (!it) return;
    var im = new Image();
    im.sizes = "100vw";
    im.srcset = srcset(it);
    im.src = it.m;
  }
  function show(p, dir) {
    pos = (p + list.length) % list.length;
    var it = items[list[pos]];
    if (G && !RM && lb.classList.contains("is-open")) {
      G.killTweensOf(img);
      G.to(img, {
        opacity: 0, x: dir * -36, duration: 0.18, ease: "power2.in",
        onComplete: function () {
          paint(it);
          var enter = function () { G.fromTo(img, { opacity: 0, x: dir * 36 }, { opacity: 1, x: 0, duration: 0.5, ease: MAA.ease || "power3.out" }); };
          if (img.complete) enter(); else img.addEventListener("load", enter, { once: true });
        }
      });
    } else {
      paint(it);
    }
    preload(pos + 1);
    preload(pos - 1);
  }

  function open(i, from) {
    opener = from || null;
    list = all.slice();
    filters.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-room") === "all" ? "true" : "false"); });
    pos = Math.max(0, list.indexOf(i));
    G && G.set(img, { opacity: 1, x: 0 });
    paint(items[list[pos]]);
    lb.classList.add("is-open");
    h.classList.add("lb-open");
    if (MAA.lenis) MAA.lenis.stop();
    preload(pos + 1);
    preload(pos - 1);
    w.setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    lb.classList.remove("is-open");
    h.classList.remove("lb-open");
    if (MAA.lenis) MAA.lenis.start();
    if (opener) opener.focus({ preventScroll: true });
  }

  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-open]");
    if (!b) return;
    e.preventDefault();
    open(parseInt(b.getAttribute("data-open"), 10) || 0, b);
  });
  closeBtn.addEventListener("click", close);
  lb.querySelector(".lb__nav--prev").addEventListener("click", function () { show(pos - 1, -1); });
  lb.querySelector(".lb__nav--next").addEventListener("click", function () { show(pos + 1, 1); });

  lb.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); show(pos + 1, 1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(pos - 1, -1); return; }
    if (e.key === "Tab") {
      var f = [].slice.call(lb.querySelectorAll("button")).filter(function (x) { return x.offsetParent !== null; });
      var i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    }
  });

  // swipe between photographs
  var startX = null, startY = null;
  stage.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    startX = e.clientX; startY = e.clientY;
  });
  stage.addEventListener("pointerup", function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) show(pos + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", function () { startX = startY = null; });
})();
