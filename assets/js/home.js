/* Marble Arch Apartments · the home page.
   The Arch at rest frames a film of Central London through its three openings. Scrolling walks you
   through the central arch until the film fills the screen. Below: the four apartments on a
   horizontal gallery, and the owners' A to Z lighting up letter by letter. */
(function () {
  "use strict";
  var d = document, w = window, h = d.documentElement;
  var MAA = w.MAA || {}, G = w.gsap, ST = w.ScrollTrigger;
  var RM = h.classList.contains("rm");
  var EASE = MAA.ease || "power3.out";
  if (MAA.store) MAA.store.set("maa-seen", "1");

  var hero = d.querySelector(".hero");
  var facade = hero && hero.querySelector(".facade");
  var film = hero && hero.querySelector(".hero__film");
  var v = d.getElementById("hero-film");

  // ------------------------------------------------------------ the film
  var userPaused = false;
  function pickSource() {
    var portrait = w.matchMedia("(max-aspect-ratio: 1/1)").matches;
    var c = navigator.connection || {};
    var light = c.saveData || /(^|-)2g$/.test(c.effectiveType || "");
    if (portrait) return v.getAttribute("data-src-portrait");
    if (light || w.innerWidth <= 1100) return v.getAttribute("data-src-720");
    return v.getAttribute("data-src-1080");
  }
  function setSource() {
    var s = pickSource();
    if (!s || v.getAttribute("data-current") === s) return;
    var wasPlaying = !v.paused;
    v.setAttribute("data-current", s);
    v.src = s;
    v.load();
    if (wasPlaying || (!RM && !userPaused)) v.play().catch(function () {});
  }
  if (v) {
    v.muted = true;
    // the film opens on Wellington Arch at sunset, the frame the poster shows
    var start = parseFloat(v.getAttribute("data-start") || "0");
    v.addEventListener("loadedmetadata", function () {
      if (start && !v.hasAttribute("data-started")) { v.setAttribute("data-started", ""); try { v.currentTime = start; } catch (e) { /* not seekable yet */ } }
    });
    setSource();
    var ctl = hero.querySelector("[data-film-ctl]");
    var ctlBtn = ctl && ctl.querySelector("button");
    var chapterEl = ctl && ctl.querySelector("[data-chapter]");
    var syncCtl = function () {
      if (!ctlBtn) return;
      var playing = !v.paused;
      ctlBtn.setAttribute("aria-label", playing ? "Pause the film" : "Play the film");
      if (MAA.setIcon) MAA.setIcon(ctlBtn, playing ? "pause" : "play");
    };
    v.addEventListener("play", syncCtl);
    v.addEventListener("pause", syncCtl);
    v.addEventListener("playing", function () { film.classList.add("is-live"); });
    if (ctlBtn) ctlBtn.addEventListener("click", function () {
      if (v.paused) { userPaused = false; v.play().catch(function () {}); }
      else { userPaused = true; v.pause(); }
    });
    syncCtl();
    if (!RM) v.play().catch(function () {});

    // chapter titles follow the film
    var chapters = [];
    try { chapters = JSON.parse(v.getAttribute("data-chapters") || "[]"); } catch (e) { chapters = []; }
    var current = -1;
    for (var c0 = 0; c0 < chapters.length; c0++) if (start >= chapters[c0][0]) current = c0;
    var swap = function (text) {
      if (!chapterEl) return;
      if (G && !RM) {
        G.to(chapterEl, {
          yPercent: -70, opacity: 0, duration: 0.28, ease: "power2.in",
          onComplete: function () {
            chapterEl.textContent = text;
            G.fromTo(chapterEl, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: EASE });
          }
        });
      } else chapterEl.textContent = text;
    };
    v.addEventListener("timeupdate", function () {
      if (v.paused || v.readyState < 2) return;
      var t = v.currentTime, i = 0;
      for (var k = 0; k < chapters.length; k++) if (t >= chapters[k][0]) i = k;
      if (i !== current) { current = i; swap(chapters[i][1]); }
    });

    // only play while the hero is on screen
    if ("IntersectionObserver" in w) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!userPaused && !RM) v.play().catch(function () {}); }
        else v.pause();
      }, { threshold: 0.02 }).observe(hero);
    }
    w.matchMedia("(max-aspect-ratio: 1/1)").addEventListener("change", setSource);
  }

  // ------------------------------------------------------------ geometry of the central arch
  function activeSvg() {
    var svgs = facade ? facade.querySelectorAll(".facade__svg") : [];
    for (var i = 0; i < svgs.length; i++) if (w.getComputedStyle(svgs[i]).display !== "none") return svgs[i];
    return null;
  }
  // scale and origin that make the central opening cover the whole screen
  function throughArch() {
    var svg = activeSvg();
    var W = facade.clientWidth, H = facade.clientHeight;
    if (!svg) return { k: 6, ox: W / 2, oy: H * 0.75 };
    var vb = svg.viewBox.baseVal;
    var f = svg.getAttribute("data-focus").split(" ").map(Number);
    var o = svg.getAttribute("data-open").split(" ").map(Number); // x, width, springing, bottom
    var s = Math.max(W / vb.width, H / vb.height);
    var X = function (x) { return (W - vb.width * s) / 2 + (x - vb.x) * s; };
    var Y = function (y) { return (y - vb.y) * s; };
    var fx = X(f[0]), fy = Y(f[1]);
    var L = X(o[0]), R = X(o[0] + o[1]), S = Y(o[2]), B = Y(o[3]);
    var k = Math.max(
      fx / Math.max(1, fx - L),
      (W - fx) / Math.max(1, R - fx),
      fy / Math.max(1, fy - S),
      (H - fy) / Math.max(1, B - fy),
      1
    );
    return { k: k * 1.08, ox: fx, oy: fy };
  }

  // ------------------------------------------------------------ the walk through the Arch
  if (hero && facade && G && ST && !RM) {
    var geo = throughArch();
    var title = hero.querySelector(".hero__title");
    var fades = hero.querySelectorAll(".hero__corner, .hero__tag");
    var scrim = hero.querySelector(".hero__scrim");
    var tl = G.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: function () { return "+=" + Math.round(w.innerHeight * 1.7); },
        pin: true,
        scrub: 0.9,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: function () { geo = throughArch(); }
      }
    });
    tl.fromTo(facade,
      { scale: 1, transformOrigin: function () { return geo.ox + "px " + geo.oy + "px"; } },
      { scale: function () { return geo.k; }, transformOrigin: function () { return geo.ox + "px " + geo.oy + "px"; }, duration: 0.8, ease: "power2.in" }, 0)
      .to(facade, { opacity: 0, duration: 0.14, ease: "power1.in" }, 0.68)
      .fromTo(film, { scale: 1.14 }, { scale: 1, duration: 1 }, 0)
      .to(fades, { opacity: 0, y: -16, duration: 0.16 }, 0)
      .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.72)
      .fromTo(title, { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.78)
      .to({}, { duration: 0.1 });

    // the film drifts a little against the pointer, for depth behind the stone
    if (MAA.fine) {
      var movers = film.querySelectorAll("video, .poster");
      G.set(movers, { scale: 1.05 });
      var mx = G.quickTo(movers, "x", { duration: 1.4, ease: "power3" });
      var my = G.quickTo(movers, "y", { duration: 1.4, ease: "power3" });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        mx(-((e.clientX - r.left) / r.width - 0.5) * 22);
        my(-((e.clientY - r.top) / r.height - 0.5) * 14);
      });
    }
  }

  // ------------------------------------------------------------ the entrance, once the preloader lifts
  function entrance() {
    if (!G || RM || !facade) return;
    var svgs = facade.querySelectorAll(".facade__svg");
    G.fromTo(svgs, { scale: 1.05, transformOrigin: "50% 100%" }, { scale: 1, duration: 2.2, ease: "expo.out", clearProps: "transform" });
    G.fromTo(hero.querySelectorAll(".hero__corner, .hero__tag, .film-ctl"), { y: 18 }, { y: 0, duration: 1.4, ease: EASE, stagger: 0.08, delay: 0.25, clearProps: "transform" });
  }
  var pl = d.querySelector(".preloader");
  if (pl && w.getComputedStyle(pl).display !== "none") {
    var done = false;
    var finish = function () { if (done) return; done = true; if (pl.parentNode) pl.parentNode.removeChild(pl); entrance(); };
    pl.addEventListener("animationend", function (e) { if (e.target === pl) finish(); });
    w.setTimeout(finish, 4200);
  } else {
    entrance();
  }

  // ------------------------------------------------------------ the four apartments, a horizontal gallery
  var homes = d.querySelector("[data-homes]");
  if (homes && G && ST) {
    var pinBox = homes.querySelector(".homes__pin");
    var track = homes.querySelector(".homes__track");
    var bar = homes.querySelector(".homes__progress i");
    var mm = G.matchMedia();
    mm.add("(min-width: 761px) and (prefers-reduced-motion: no-preference)", function () {
      homes.classList.add("is-pinned");
      var dist = function () { return Math.max(0, track.scrollWidth - pinBox.clientWidth); };
      var tween = G.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: pinBox,
          start: "center center",
          end: function () { return "+=" + dist(); },
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100).toFixed(2) + "%"; }
        }
      });
      // keyboard users: a focused card scrolls the gallery to it
      var onFocus = function (e) {
        var card = e.target.closest && e.target.closest(".home-card");
        var st = tween.scrollTrigger;
        if (!card || !st) return;
        var pad = parseFloat(w.getComputedStyle(track).paddingLeft) || 0;
        var x = Math.min(dist(), Math.max(0, card.offsetLeft - pad));
        var y = st.start + x;
        if (MAA.lenis) MAA.lenis.scrollTo(y, { immediate: true }); else w.scrollTo(0, y);
      };
      track.addEventListener("focusin", onFocus);
      return function () { homes.classList.remove("is-pinned"); track.removeEventListener("focusin", onFocus); };
    });
  }

  // ------------------------------------------------------------ owners: A to Z, one letter at a time
  var az = d.querySelector("[data-az]");
  if (az && G && ST && !RM) {
    var letters = [].slice.call(az.children);
    G.fromTo(az, { x: function () { return w.innerWidth * 0.06; } }, {
      x: function () { return -(az.scrollWidth - w.innerWidth * 0.94); },
      ease: "none",
      scrollTrigger: {
        trigger: az.closest("section"),
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var n = Math.round(self.progress * letters.length * 1.25);
          for (var i = 0; i < letters.length; i++) letters[i].classList.toggle("lit", i < n);
        }
      }
    });
  }
})();
