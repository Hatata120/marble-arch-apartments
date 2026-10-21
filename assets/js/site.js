/* Marble Arch Apartments · behaviour shared by every page.
   The page is complete without this file. Everything here is an enhancement: smooth scrolling,
   the header, the menu, page curtains, reveals (armed on the first interaction, so a still page
   shows everything), films, the cursor, forms, tabs and toasts. */
(function () {
  "use strict";
  var d = document, w = window, h = d.documentElement;
  var MAA = (w.MAA = w.MAA || {});
  var RM = h.classList.contains("rm");
  var FINE = !!(w.matchMedia && w.matchMedia("(hover: hover) and (pointer: fine)").matches);
  var G = w.gsap, ST = w.ScrollTrigger, SPLIT = w.SplitText;
  var ICONS = "#i-";

  MAA.rm = RM;
  MAA.fine = FINE;
  MAA.store = {
    get: function (k) { try { return w.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  MAA.setIcon = function (el, name) {
    var u = el && el.querySelector("use");
    if (u) u.setAttribute("href", ICONS + name);
  };

  if (G) {
    if (ST) G.registerPlugin(ST);
    if (SPLIT) G.registerPlugin(SPLIT);
    if (w.CustomEase) { G.registerPlugin(w.CustomEase); w.CustomEase.create("maa", "0.22,1,0.36,1"); }
  }
  var EASE = G && w.CustomEase ? "maa" : "power3.out";
  MAA.ease = EASE;

  // ------------------------------------------------------------ year
  d.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  // ------------------------------------------------------------ smooth scroll (fine pointers only)
  var lenis = null;
  if (!RM && FINE && w.Lenis) {
    try {
      lenis = new w.Lenis({ lerp: 0.105, smoothWheel: true, wheelMultiplier: 1, syncTouch: false });
      if (G && ST) {
        lenis.on("scroll", ST.update);
        G.ticker.add(function (t) { lenis.raf(t * 1000); });
        G.ticker.lagSmoothing(0);
      } else {
        var loop = function (t) { lenis.raf(t); w.requestAnimationFrame(loop); };
        w.requestAnimationFrame(loop);
      }
    } catch (e) { lenis = null; }
  }
  MAA.lenis = lenis;

  function headerHeight() {
    var hd = d.querySelector(".site-header");
    return hd ? hd.offsetHeight : 0;
  }
  MAA.scrollTo = function (target, opts) {
    opts = opts || {};
    var off = opts.offset != null ? opts.offset : -(headerHeight() + 16);
    if (lenis) { lenis.scrollTo(target, { offset: off, duration: opts.duration || 1.4, immediate: !!opts.immediate }); return; }
    var y = typeof target === "number" ? target : target.getBoundingClientRect().top + w.scrollY + off;
    w.scrollTo({ top: y, behavior: RM || opts.immediate ? "auto" : "smooth" });
  };

  // links to an anchor on the same page
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var t = id && d.getElementById(id);
    if (!t) return;
    e.preventDefault();
    MAA.scrollTo(t);
    if (a.classList.contains("skip") || t.tagName === "MAIN") {
      t.setAttribute("tabindex", "-1");
      t.focus({ preventScroll: true });
    }
  });

  // ------------------------------------------------------------ header
  var header = d.querySelector(".site-header");
  var lastY = w.scrollY, ticking = false;
  function onScroll() {
    var y = w.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      if (!h.classList.contains("menu-open")) {
        if (y > lastY + 4 && y > 260) header.classList.add("is-hidden");
        else if (y < lastY - 4 || y < 120) header.classList.remove("is-hidden");
      }
    }
    lastY = y;
  }
  w.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    w.requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  onScroll();
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  // ------------------------------------------------------------ menu
  var menu = d.getElementById("menu"), menuBtn = d.querySelector(".menu-btn");
  function setMenu(open, restoreFocus) {
    if (!menu || !menuBtn) return;
    h.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close the menu" : "Menu");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) {
      if (header) header.classList.remove("is-hidden");
      var links = menu.querySelectorAll(".menu__list a");
      if (G && !RM) G.fromTo(links, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: EASE, stagger: 0.055, delay: 0.18 });
      w.setTimeout(function () { if (links[0]) links[0].focus({ preventScroll: true }); }, 320);
    } else if (restoreFocus) {
      menuBtn.focus({ preventScroll: true });
    }
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(!h.classList.contains("menu-open"), true); });
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false, false); });
  d.addEventListener("keydown", function (e) {
    if (!h.classList.contains("menu-open")) return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key !== "Tab") return;
    var f = [menuBtn].concat([].slice.call(menu.querySelectorAll("a[href], button")));
    var i = f.indexOf(d.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  });
  w.addEventListener("resize", function () { if (w.innerWidth > 1080 && h.classList.contains("menu-open")) setMenu(false, false); });

  // ------------------------------------------------------------ page curtain between pages
  var curtain = d.querySelector(".curtain");
  function internal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || /^(mailto|tel|sms|javascript):/i.test(href)) return false;
    var u;
    try { u = new URL(a.href, w.location.href); } catch (e) { return false; }
    if (u.origin !== w.location.origin) return false;
    if (u.pathname === w.location.pathname) return false;
    return /\.html$|\/$/.test(u.pathname);
  }
  d.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a");
    if (!internal(a) || RM || !curtain) return;
    e.preventDefault();
    MAA.store.set("maa-curtain", "1");
    curtain.classList.add("is-on");
    w.setTimeout(function () { w.location.href = a.href; }, 560);
  });
  w.addEventListener("pageshow", function () {
    if (curtain) curtain.classList.remove("is-on");
  });
  w.setTimeout(function () { h.classList.remove("curtain-in"); }, 1400);

  // ------------------------------------------------------------ toast
  var toastEl = d.querySelector(".toast"), toastTimer = 0;
  MAA.toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    w.clearTimeout(toastTimer);
    toastTimer = w.setTimeout(function () { toastEl.classList.remove("is-on"); }, 4600);
  };

  // booking tiles whose link is not in yet: a link added to data.js turns the tile into a real link
  var DATA = w.MAA_DATA || {};
  d.querySelectorAll("[data-soon][data-slug]").forEach(function (b) {
    var home = (DATA.homes || []).filter(function (x) { return x.slug === b.getAttribute("data-slug"); })[0];
    var url = home && home.listings && home.listings[b.getAttribute("data-platform")];
    if (!url || !/^https:\/\//.test(url)) return;
    var a = d.createElement("a");
    a.className = b.className.replace(/\s*is-soon/, "");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("data-cursor", "Book");
    a.innerHTML = b.innerHTML;
    var label = a.querySelector(".book-tile__foot > span");
    if (label) label.innerHTML = "View listing<span class=\"sr-only\">: " + b.getAttribute("data-home") + " on " + b.getAttribute("data-soon") + ", opens in a new tab</span>";
    MAA.setIcon(a.querySelector(".book-tile__foot"), "arrow-up-right");
    b.parentNode.replaceChild(a, b);
  });
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-soon]");
    if (!b) return;
    MAA.toast("The " + b.getAttribute("data-soon") + " listing for " + b.getAttribute("data-home") + " is on its way. You can book this apartment now on Londoners.com.");
  });

  // ------------------------------------------------------------ platform logo marquee
  d.querySelectorAll("[data-marquee-ctl]").forEach(function (b) {
    b.addEventListener("click", function () {
      var m = d.querySelector("[data-marquee]");
      if (!m) return;
      var paused = m.classList.toggle("is-paused");
      var label = b.querySelector("span");
      if (label) label.textContent = paused ? "Play logos" : "Pause logos";
      MAA.setIcon(b, paused ? "play" : "pause");
    });
  });

  // ------------------------------------------------------------ films that play in view, each with its own pause control
  function syncVidCtl(v) {
    var c = v.parentElement && v.parentElement.querySelector(".vid-ctl");
    if (!c) return;
    var playing = !v.paused;
    c.setAttribute("aria-label", playing ? "Pause the film" : "Play the film");
    MAA.setIcon(c, playing ? "pause" : "play");
  }
  var autos = d.querySelectorAll("video[data-auto]");
  autos.forEach(function (v) {
    v.muted = true;
    v.addEventListener("play", function () { syncVidCtl(v); });
    v.addEventListener("pause", function () { syncVidCtl(v); });
    var c = v.parentElement && v.parentElement.querySelector(".vid-ctl");
    if (c) c.addEventListener("click", function () {
      if (v.paused) { v.removeAttribute("data-user-paused"); v.play().catch(function () {}); }
      else { v.setAttribute("data-user-paused", ""); v.pause(); }
    });
    syncVidCtl(v);
  });
  if ("IntersectionObserver" in w && autos.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (!RM && !v.hasAttribute("data-user-paused")) v.play().catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    autos.forEach(function (v) { vio.observe(v); });
  }

  // places: a film plays on hover, or with the play button
  d.querySelectorAll("[data-place]").forEach(function (p) {
    var v = p.querySelector("video"), btn = p.querySelector(".place__play");
    if (!v) return;
    var name = (p.querySelector("h3") || {}).textContent || "this place";
    function sync() {
      var on = p.classList.contains("is-playing");
      if (btn) { btn.setAttribute("aria-label", (on ? "Pause the film of " : "Play the film of ") + name); MAA.setIcon(btn, on ? "pause" : "play"); }
    }
    function play() {
      v.preload = "auto";
      p.classList.add("is-playing");
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () { p.classList.remove("is-playing"); sync(); });
      sync();
    }
    function stop() {
      p.classList.remove("is-playing");
      sync();
      w.setTimeout(function () { if (!p.classList.contains("is-playing")) v.pause(); }, 650);
    }
    if (FINE && !RM) {
      p.addEventListener("mouseenter", play);
      p.addEventListener("mouseleave", stop);
    }
    if (btn) btn.addEventListener("click", function (e) { e.stopPropagation(); if (p.classList.contains("is-playing")) stop(); else play(); });
    sync();
  });

  // ------------------------------------------------------------ cursor and magnetic buttons (mouse only)
  if (FINE && !RM && G) {
    var cur = d.querySelector(".cursor");
    if (cur) {
      var curLabel = cur.querySelector("span");
      var cx = G.quickTo(cur, "x", { duration: 0.42, ease: "power3" });
      var cy = G.quickTo(cur, "y", { duration: 0.42, ease: "power3" });
      w.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        cur.classList.add("is-on");
        cx(e.clientX); cy(e.clientY);
      }, { passive: true });
      d.addEventListener("pointerover", function (e) {
        var t = e.target.closest && e.target.closest("[data-cursor]");
        if (t) { curLabel.textContent = t.getAttribute("data-cursor"); cur.classList.add("is-big"); }
      });
      d.addEventListener("pointerout", function (e) {
        var t = e.target.closest && e.target.closest("[data-cursor]");
        if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) cur.classList.remove("is-big");
      });
      h.addEventListener("mouseleave", function () { cur.classList.remove("is-on"); });
      w.addEventListener("blur", function () { cur.classList.remove("is-on"); });
    }
    d.querySelectorAll(".btn, .film-ctl button, .vid-ctl").forEach(function (b) {
      var bx = G.quickTo(b, "x", { duration: 0.6, ease: "power3" });
      var by = G.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.2);
        by((e.clientY - r.top - r.height / 2) * 0.28);
      });
      b.addEventListener("pointerleave", function () { bx(0); by(0); });
    });
  }

  // ------------------------------------------------------------ forms
  function isoDate(dt) {
    var m = dt.getMonth() + 1, day = dt.getDate();
    return dt.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function validField(inp) {
    if (inp.type === "checkbox") return inp.checked;
    var v = inp.value.trim();
    if (inp.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return v !== "";
  }
  function markField(inp, ok) {
    var box = inp.closest(".field") || inp.closest(".check");
    if (box) box.classList.toggle("is-invalid", !ok);
    if (ok) inp.removeAttribute("aria-invalid"); else inp.setAttribute("aria-invalid", "true");
  }
  d.querySelectorAll("form[data-form]").forEach(function (f) {
    var arr = f.querySelector('input[name="arrival"]'), dep = f.querySelector('input[name="departure"]');
    var today = new Date(), tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    if (arr) arr.min = isoDate(today);
    if (dep) dep.min = isoDate(tomorrow);
    if (arr && dep) arr.addEventListener("change", function () {
      if (!arr.value) return;
      var n = new Date(arr.value + "T12:00:00"); n.setDate(n.getDate() + 1);
      dep.min = isoDate(n);
      if (dep.value && dep.value <= arr.value) dep.value = "";
    });
    f.addEventListener("input", function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute("required") && t.getAttribute("aria-invalid") === "true") markField(t, validField(t));
    });
    f.addEventListener("change", function (e) {
      var t = e.target;
      if (t.type === "checkbox" && t.hasAttribute("required")) markField(t, t.checked);
    });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      f.querySelectorAll("[required]").forEach(function (inp) {
        var ok = validField(inp);
        markField(inp, ok);
        if (!ok && !first) first = inp;
      });
      var note = f.querySelector(".form-note");
      if (first) {
        first.focus();
        if (note) note.classList.remove("is-on");
        return;
      }
      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      data.form = f.getAttribute("data-form");
      data.page = w.location.pathname;
      var ep = (w.MAA_DATA && w.MAA_DATA.endpoint) || "";
      var co = (w.MAA_DATA && w.MAA_DATA.company) || {};
      var name = (data.name || "").split(" ")[0];
      if (!ep && co.email) {
        // no form service yet: the visitor's email app opens with the enquiry written out
        var labels = { name: "Name", email: "Email", phone: "Telephone", area: "Area", bedrooms: "Bedrooms", status: "The apartment is",
          arrival: "Arrival", departure: "Departure", guests: "Guests", apartment: "Apartment", message: "Message" };
        var lines = [];
        Object.keys(labels).forEach(function (k) { if (data[k]) lines.push(labels[k] + ": " + data[k]); });
        var subject = data.form === "owner" ? "Apartment to look after" + (data.area ? ", " + data.area : "") : "Stay enquiry" + (data.apartment && data.apartment !== "Any apartment" ? ", " + data.apartment : "");
        w.location.href = "mailto:" + co.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
        note.textContent = "Thank you" + (name ? ", " + name : "") + ". Your email app should now open with your message to " + co.email + ", ready to send. If it does not, write to us there" + (co.phone ? " or call " + co.phone : "") + ".";
        note.classList.add("is-on");
        return;
      }
      if (!ep) {
        note.textContent = "Thank you" + (name ? ", " + name : "") + ". This form is not connected yet, so your message has not been sent. To book now, choose an apartment and book it on Londoners.com.";
        note.classList.add("is-on");
        return;
      }
      var btn = f.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          note.textContent = "Thank you" + (name ? ", " + name : "") + ". Your message has reached us and we will be in touch.";
          f.reset();
        })
        .catch(function () { note.textContent = "Your message could not be sent. Please check your connection and try again."; })
        .then(function () { if (btn) btn.disabled = false; note.classList.add("is-on"); });
    });
  });

  // ------------------------------------------------------------ tabs
  d.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var p = d.getElementById(x.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      if (ST) ST.refresh();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") j = 0;
        if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    var want = w.location.hash.replace("#", "");
    var match = tabs.filter(function (x) { return x.id === "tab-" + want; })[0];
    if (match) select(match, false);
  });

  // ------------------------------------------------------------ reveals, armed on the first interaction
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < w.innerHeight * 0.98;
  }
  function whenFonts(fn) {
    if (d.fonts && d.fonts.status !== "loaded") d.fonts.ready.then(fn); else fn();
  }
  function revealLines(el) {
    if (!SPLIT) return revealUp(el);
    whenFonts(function () {
      var split = SPLIT.create(el, { type: "lines", mask: "lines", linesClass: "line" });
      G.set(split.lines, { yPercent: 108 });
      ST.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          G.to(split.lines, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.085, onComplete: function () { split.revert(); } });
        }
      });
    });
  }
  function revealUp(el) {
    G.set(el, { y: 34, opacity: 0 });
    ST.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { G.to(el, { y: 0, opacity: 1, duration: 1.1, ease: EASE }); } });
  }
  function revealImage(el) {
    var media = el.querySelector("img, video");
    G.set(el, { clipPath: "inset(100% 0% 0% 0%)" });
    if (media) G.set(media, { scale: 1.16 });
    ST.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: function () {
        G.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out", clearProps: "clipPath" });
        if (media) G.to(media, { scale: 1, duration: 2, ease: "expo.out", clearProps: "transform" });
      }
    });
  }
  function revealStagger(el) {
    var kids = [].slice.call(el.children).filter(function (k) { return !inView(k); });
    if (!kids.length) return;
    G.set(kids, { y: 40, opacity: 0 });
    ST.batch(kids, {
      start: "top 92%", once: true,
      onEnter: function (batch) { G.to(batch, { y: 0, opacity: 1, duration: 1.05, ease: EASE, stagger: 0.075, overwrite: true }); }
    });
  }
  function scrubWords(el) {
    if (!SPLIT) return;
    whenFonts(function () {
      var split = SPLIT.create(el, { type: "words", wordsClass: "w" });
      G.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 84%", end: "bottom 50%", scrub: 0.6 }
      });
    });
  }
  var armed = false;
  var ARM_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"];
  var armOpts = { passive: true, capture: true };
  function arm() {
    if (armed) return;
    armed = true;
    ARM_EVENTS.forEach(function (t) { w.removeEventListener(t, arm, armOpts); });
    if (!G || !ST || RM) return;
    d.querySelectorAll('[data-reveal="lines"]').forEach(function (el) { if (!inView(el)) revealLines(el); });
    d.querySelectorAll('[data-reveal="up"]').forEach(function (el) { if (!inView(el)) revealUp(el); });
    d.querySelectorAll('[data-reveal="image"]').forEach(function (el) { if (!inView(el)) revealImage(el); });
    d.querySelectorAll('[data-reveal="stagger"]').forEach(function (el) { revealStagger(el); });
    d.querySelectorAll("[data-words]").forEach(function (el) { if (!inView(el)) scrubWords(el); });
    var fw = d.querySelector(".footer__word span");
    if (fw && !inView(fw)) {
      G.set(fw, { xPercent: -50, x: 0 });
      G.fromTo(fw, { yPercent: 62 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: 0.4 } });
    }
    (MAA.onArm || []).forEach(function (fn) { try { fn(); } catch (e) { /* keep going */ } });
    ST.refresh();
  }
  MAA.onArm = MAA.onArm || [];
  MAA.whenArmed = function (fn) { if (armed) { if (G && ST && !RM) fn(); } else MAA.onArm.push(fn); };
  ARM_EVENTS.forEach(function (t) { w.addEventListener(t, arm, armOpts); });

  if (ST) {
    w.addEventListener("load", function () { ST.refresh(); });
    if (d.fonts) d.fonts.ready.then(function () { ST.refresh(); });
  }
})();
