/* ClimaxDJ premium interactions — website only */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var mouse = { x: 0.5, y: 0.4 };

  /* ——— Lenis smooth scroll ——— */
  var lenis = null;
  function initLenis() {
    if (reduce || typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.55
    });
    window.lenis = lenis;
    if (window.ScrollTrigger && typeof gsap !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  /* ——— Custom cursor ——— */
  var cursor = document.getElementById("cursor");
  if (cursor && !coarse && !reduce) {
    document.body.classList.add("has-cursor");
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      mouse.x = e.clientX / Math.max(1, window.innerWidth);
      mouse.y = e.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });
    window.addEventListener("pointerdown", function () { cursor.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { cursor.classList.remove("is-down"); });
    document.querySelectorAll("a, button, .chip, input, .hgal__card").forEach(function (el) {
      el.addEventListener("pointerenter", function () { cursor.classList.add("is-hover"); });
      el.addEventListener("pointerleave", function () { cursor.classList.remove("is-hover"); });
    });
    (function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  }

  /* ——— Magnetic buttons ——— */
  function initMagnetic() {
    if (reduce || coarse) return;
    document.querySelectorAll(".btn--magnetic").forEach(function (btn) {
      var span = btn.querySelector("span") || btn;
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (x * 0.22) + "px," + (y * 0.28) + "px)";
        if (span !== btn) span.style.transform = "translate(" + (x * 0.12) + "px," + (y * 0.14) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
        if (span !== btn) span.style.transform = "";
      });
    });
  }

  /* ——— Hero 3D + specular follow ——— */
  function initHeroStage() {
    var stage = document.getElementById("heroStage");
    var shot = stage && stage.querySelector(".hero__shot");
    var spec = document.getElementById("heroSpecular");
    if (!stage || !shot) return;
    if (reduce || coarse) return;
    window.addEventListener("pointermove", function (e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      shot.style.transform = "rotateY(" + (-14 + nx * 6) + "deg) rotateX(" + (8 - ny * 5) + "deg) translateZ(0)";
      if (spec) {
        spec.style.setProperty("--mx", (e.clientX / window.innerWidth * 100) + "%");
        spec.style.setProperty("--my", (e.clientY / window.innerHeight * 100) + "%");
      }
    }, { passive: true });
  }

  /* ——— Split text (hero) ——— */
  function splitHero() {
    if (reduce || typeof gsap === "undefined") return;
    document.querySelectorAll(".hero__title .line > span").forEach(function (el) {
      if (el.dataset.split) return;
      el.dataset.split = "1";
      var text = el.textContent;
      el.textContent = "";
      el.classList.add("split");
      var inner = document.createElement("span");
      inner.className = "split__inner";
      inner.textContent = text;
      el.appendChild(inner);
    });
  }

  /* ——— Stats counters (real numbers only) ——— */
  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var prefix = el.getAttribute("data-prefix") || "";
        if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
        var start = performance.now(), dur = 1100;
        (function tick(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ——— Sticky story hotspots ——— */
  function initStory() {
    var steps = document.querySelectorAll(".story__step");
    var spots = document.querySelectorAll(".story__hotspot");
    if (!steps.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute("data-spot");
        steps.forEach(function (s) { s.classList.toggle("is-active", s === en.target); });
        spots.forEach(function (sp) { sp.classList.toggle("is-on", sp.getAttribute("data-spot") === id); });
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
    if (steps[0]) {
      steps[0].classList.add("is-active");
      var first = steps[0].getAttribute("data-spot");
      spots.forEach(function (sp) { sp.classList.toggle("is-on", sp.getAttribute("data-spot") === first); });
    }
  }

  /* ——— Optional sound (muted by default) ——— */
  var audioCtx = null, soundOn = false;
  function blip(freq, dur, type) {
    if (!soundOn || reduce) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(audioCtx.destination);
      var t = audioCtx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function initSound() {
    var fab = document.getElementById("soundFab");
    if (!fab) return;
    fab.addEventListener("click", function () {
      soundOn = !soundOn;
      fab.classList.toggle("is-on", soundOn);
      fab.setAttribute("aria-pressed", String(soundOn));
      fab.textContent = soundOn ? "Sound on" : "Sound";
      if (soundOn) blip(220, 0.12, "triangle");
    });
    document.querySelectorAll("section[id]").forEach(function (sec) {
      var fired = false;
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting && !fired) {
            fired = true;
            blip(sec.id === "world-studio" ? 330 : sec.id === "world-engine" ? 180 : 260, 0.1, "sine");
            setTimeout(function () { fired = false; }, 1200);
          }
        });
      }, { threshold: 0.18 });
      io.observe(sec);
    });
  }

  /* ——— Download step highlight on scroll ——— */
  function initDlSteps() {
    var steps = document.querySelectorAll(".dl-step");
    if (!steps.length) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) en.target.classList.add("is-lit");
      });
    }, { threshold: 0.55 });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ——— Horizontal gallery drag hint / momentum wheel ——— */
  function initHgal() {
    var rail = document.getElementById("hgalRail");
    if (!rail || reduce) return;
    rail.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ——— Premium GSAP bits (after main initMotion) ——— */
  function initPremiumMotion() {
    if (reduce || typeof gsap === "undefined") return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    splitHero();
    gsap.utils.toArray(".v45__card").forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 92%" },
        opacity: 0, y: 28, duration: 0.55, delay: (i % 4) * 0.06, ease: "power3.out"
      });
    });
    gsap.utils.toArray(".hgal__card").forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 95%" },
        opacity: 0, y: 24, duration: 0.6, delay: Math.min(i, 3) * 0.05
      });
    });
    var stage = document.querySelector(".hero__shot");
    if (stage) {
      gsap.from(stage, { opacity: 0, y: 40, rotateY: -24, duration: 1.2, delay: 0.15, ease: "power3.out" });
    }
  }


  /* ——— Scroll text: fade+blur+scale in → crisp hold → out (scrubbed both ways) ——— */
  function initTextScroll() {
    if (reduce || typeof gsap === "undefined" || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var selectors = [
      ".hero__eyebrow", ".hero__title .line", ".hero__sub2", ".hero__copy",
      ".kicker", ".h2", ".lead",
      ".story__step h3", ".story__step p",
      ".v45__card h3", ".v45__card p", ".v45 .honesty",
      ".fcard h3", ".fcard p",
      ".stat__n", ".stat__l",
      ".final h2", ".final p",
      ".hgal__head .kicker", ".hgal__head .h2", ".hgal__head .lead",
      "#about .h2", "#about .lead",
      "#features-title", "#worlds-title", "#dj-title", "#studio-title", "#lab-title",
      ".engine-item h3", ".engine-item p",
      ".notes h3", ".dl-step h3", ".dl-step p",
      ".dl-hero .h2", ".dl-hero .lead", ".dl-card h2", ".dl-card p"
    ];
    var seen = new WeakSet();
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (seen.has(el)) return;
        if (el.closest("#intro") || el.closest(".wm-pin") || el.closest(".nav") || el.closest(".marquee") || el.closest(".intro")) return;
        seen.add(el);
        var isBody = el.matches("p, .lead, .hero__copy, .fcard p, .v45__card p, .story__step p, .honesty, .final p, .dl-step p, .dl-card p, .engine-item p, .stat__l");
        var blurIn = isBody ? 7 : 16;
        var blurOut = isBody ? 5 : 14;
        var scaleFrom = isBody ? 1.015 : 1.05;
        var yFrom = isBody ? 10 : 24;
        var opFrom = isBody ? 0.2 : 0;
        el.style.willChange = "transform, opacity, filter";

        var rect = el.getBoundingClientRect();
        var initiallyInView = rect.top < window.innerHeight * 0.82 && rect.bottom > 0;

        if (initiallyInView) {
          // Above-fold: start crisp; only scrub fade/blur out when leaving upward
          gsap.set(el, { autoAlpha: 1, filter: "blur(0px)", scale: 1, y: 0 });
          gsap.fromTo(el,
            { autoAlpha: 1, filter: "blur(0px)", scale: 1, y: 0 },
            {
              autoAlpha: isBody ? 0.2 : 0,
              filter: "blur(" + blurOut + "px)",
              scale: isBody ? 0.99 : 0.96,
              y: isBody ? -6 : -14,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top 22%",
                end: "top -15%",
                scrub: 0.45,
                invalidateOnRefresh: true
              }
            }
          );
          return;
        }

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "bottom 8%",
            scrub: 0.45,
            invalidateOnRefresh: true
          }
        });
        tl.fromTo(el,
          { autoAlpha: opFrom, filter: "blur(" + blurIn + "px)", scale: scaleFrom, y: yFrom },
          { autoAlpha: 1, filter: "blur(0px)", scale: 1, y: 0, duration: 0.26, ease: "none" }
        );
        tl.to(el, { autoAlpha: 1, filter: "blur(0px)", scale: 1, y: 0, duration: 0.48, ease: "none" });
        tl.to(el, {
          autoAlpha: isBody ? 0.18 : 0,
          filter: "blur(" + blurOut + "px)",
          scale: isBody ? 0.99 : 0.96,
          y: isBody ? -6 : -14,
          duration: 0.26,
          ease: "none"
        });
      });
    });
  }

  function boot() {
    initLenis();
    initMagnetic();
    initHeroStage();
    initCounters();
    initStory();
    initSound();
    initDlSteps();
    initHgal();
    initPremiumMotion();
    initTextScroll();
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
