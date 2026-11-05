/* ClimaxDJ marketing site — website-only demo. Does not touch the app engine. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mouse = { x: 0.7, y: 0.4 };
  var scrollEnergy = 0;
  var lastScroll = 0;

  /* ---------- Loader ---------- */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    if (!loader) return;
    setTimeout(function () {
      loader.classList.add("is-done");
    }, reduce ? 100 : 900);
  });

  /* ---------- Nav ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("mobileNav");
  window.addEventListener("scroll", function () {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
    var dy = Math.abs(window.scrollY - lastScroll);
    scrollEnergy = Math.min(1, scrollEnergy * 0.85 + dy / 80);
    lastScroll = window.scrollY;
  }, { passive: true });

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
      mobileNav.classList.toggle("is-open", !open);
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
        mobileNav.classList.remove("is-open");
      });
    });
  }

  /* ---------- Hero mouse glow + optional video ---------- */
  var glow = document.getElementById("heroGlow");
  document.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
    if (glow && !reduce) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }
  }, { passive: true });

  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    fetch("./assets/hero.mp4", { method: "HEAD" })
      .then(function (r) {
        if (!r.ok) return;
        heroVideo.classList.add("is-ready");
        if (!reduce) {
          var p = heroVideo.play();
          if (p && p.catch) p.catch(function () {});
        }
      })
      .catch(function () {});
  }

  /* ---------- Shared wave signal (generated) ---------- */
  var t0 = performance.now();
  var demoBoost = 0;
  function signal(t, i, n) {
    var phase = t * (0.9 + demoBoost * 0.4) + i * 0.17;
    var a = Math.sin(phase * 2.1) * 0.55;
    var b = Math.sin(phase * 5.3 + mouse.x * 4) * 0.28;
    var c = Math.sin(phase * 11.0 + mouse.y * 6) * 0.12;
    var env = 0.55 + 0.35 * Math.sin(t * 0.7 + i / n * Math.PI * 2);
    return (a + b + c) * env * (0.7 + scrollEnergy * 0.5 + demoBoost * 0.35);
  }

  /* ---------- Hero waveform canvas ---------- */
  var heroCanvas = document.getElementById("heroWave");
  var heroCtx = heroCanvas ? heroCanvas.getContext("2d") : null;
  function sizeHero() {
    if (!heroCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    heroCanvas.width = heroCanvas.clientWidth * dpr;
    heroCanvas.height = heroCanvas.clientHeight * dpr;
    if (heroCtx) heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeHero();
  window.addEventListener("resize", sizeHero);

  function drawHeroWave(now) {
    if (!heroCtx || !heroCanvas) return;
    var w = heroCanvas.clientWidth;
    var h = heroCanvas.clientHeight;
    var t = (now - t0) / 1000;
    heroCtx.clearRect(0, 0, w, h);
    var rows = 3;
    for (var r = 0; r < rows; r++) {
      heroCtx.beginPath();
      var mid = h * (0.35 + r * 0.18);
      for (var x = 0; x <= w; x += 4) {
        var n = x / w;
        var y = mid + signal(t + r * 0.4, x / 4, w / 4) * (38 - r * 8) * (0.6 + mouse.y);
        if (x === 0) heroCtx.moveTo(x, y);
        else heroCtx.lineTo(x, y);
      }
      heroCtx.strokeStyle = r === 1 ? "rgba(229,35,61,0.55)" : "rgba(255,255,255," + (0.12 + r * 0.05) + ")";
      heroCtx.lineWidth = r === 1 ? 2 : 1.2;
      heroCtx.stroke();
    }
  }

  /* ---------- Showcase thumbs + scroll perspective ---------- */
  var showcaseImg = document.getElementById("showcaseImg");
  var showcaseFrame = document.getElementById("showcaseFrame");
  document.querySelectorAll("#showcaseThumbs [data-shot]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#showcaseThumbs .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      if (showcaseImg) {
        showcaseImg.src = "./screenshots/" + btn.getAttribute("data-shot");
        showcaseImg.alt = "ClimaxDJ — " + (btn.getAttribute("data-label") || "interface");
      }
      demoBoost = Math.min(1, demoBoost + 0.4);
    });
  });

  /* ---------- Interactive DJ Demo ---------- */
  var TRACKS = [
    { title: "Nachtkante", artist: "Nord", bpm: 124, key: "8A", hue: 0 },
    { title: "Hafenlicht", artist: "Kai", bpm: 126, key: "8B", hue: 20 },
    { title: "Kiesweg", artist: "Ost", bpm: 128, key: "9B", hue: 200 },
    { title: "Spätschicht", artist: "Süd", bpm: 122, key: "9A", hue: 320 },
    { title: "Neonbrücke", artist: "West", bpm: 130, key: "10A", hue: 350 },
    { title: "Gleis 7", artist: "Linie", bpm: 125, key: "7A", hue: 160 }
  ];

  var state = {
    active: "A",
    A: { track: TRACKS[0], playing: false, cueFlash: 0, slip: false, sync: false, phase: 0 },
    B: { track: TRACKS[1], playing: false, cueFlash: 0, slip: false, sync: false, phase: Math.PI },
    xf: 50,
    eq: { hi: 0, mid: 0, low: 0 },
    fx: {},
    wmode: "classic",
    pitch: 0,
    audioOn: false
  };

  var lib = document.getElementById("libList");
  if (lib) {
    TRACKS.forEach(function (tr, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<strong>" + tr.title + "</strong><span>" + tr.artist + " · " + tr.bpm.toFixed(1) + " · " + tr.key + "</span>";
      b.addEventListener("click", function () {
        lib.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        loadTrack(state.active, tr);
        demoBoost = 1;
      });
      if (i < 2) b.classList.toggle("is-active", i === 0);
      li.appendChild(b);
      lib.appendChild(li);
    });
  }

  function loadTrack(deck, tr) {
    state[deck].track = tr;
    state[deck].phase = Math.random() * Math.PI * 2;
    paintDeckMeta(deck);
    updateBpmReadout();
    pulseDeck(deck);
  }

  function paintDeckMeta(deck) {
    var tr = state[deck].track;
    var title = document.getElementById("deck" + deck + "Title");
    var meta = document.getElementById("deck" + deck + "Meta");
    if (title) title.textContent = tr.title;
    if (meta) meta.textContent = tr.artist + " · " + (tr.bpm + state.pitch * 0.4).toFixed(1) + " BPM · " + tr.key;
  }

  function setActiveDeck(deck) {
    state.active = deck;
    document.getElementById("deckA").classList.toggle("is-active", deck === "A");
    document.getElementById("deckB").classList.toggle("is-active", deck === "B");
    updateBpmReadout();
  }

  document.getElementById("deckA").addEventListener("pointerdown", function () { setActiveDeck("A"); });
  document.getElementById("deckB").addEventListener("pointerdown", function () { setActiveDeck("B"); });

  document.querySelectorAll("[data-act]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var deck = btn.getAttribute("data-deck");
      var act = btn.getAttribute("data-act");
      setActiveDeck(deck);
      var d = state[deck];
      if (act === "play") {
        d.playing = !d.playing;
        btn.classList.toggle("is-on", d.playing);
        document.getElementById("deck" + deck + "State").textContent = d.playing ? "PLAYING" : "READY";
        if (audio) syncAudio();
      } else if (act === "cue") {
        d.cueFlash = 1;
        d.phase = 0;
        btn.classList.add("is-on");
        setTimeout(function () { btn.classList.remove("is-on"); }, 180);
        demoBoost = 1;
      } else if (act === "sync") {
        d.sync = !d.sync;
        btn.classList.toggle("is-on", d.sync);
        if (d.sync) {
          var other = deck === "A" ? "B" : "A";
          state.pitch = 0;
          // match display bpm toward other deck
          updateBpmReadout();
        }
      } else if (act === "slip") {
        d.slip = !d.slip;
        btn.classList.toggle("is-on", d.slip);
      }
      demoBoost = Math.min(1, demoBoost + 0.5);
    });
  });

  var xfader = document.getElementById("xfader");
  var xfaderVal = document.getElementById("xfaderVal");
  if (xfader) {
    xfader.addEventListener("input", function () {
      state.xf = +xfader.value;
      if (xfaderVal) xfaderVal.textContent = String(state.xf);
      demoBoost = Math.min(1, demoBoost + 0.15);
      if (audio) syncAudio();
    });
  }

  [["eqHi", "hi", "eqHiOut"], ["eqMid", "mid", "eqMidOut"], ["eqLow", "low", "eqLowOut"]].forEach(function (row) {
    var el = document.getElementById(row[0]);
    var out = document.getElementById(row[2]);
    if (!el) return;
    el.addEventListener("input", function () {
      state.eq[row[1]] = +el.value;
      if (out) out.textContent = (state.eq[row[1]] > 0 ? "+" : "") + state.eq[row[1]] + " dB";
      demoBoost = Math.min(1, demoBoost + 0.1);
      if (audio) syncAudio();
    });
  });

  document.querySelectorAll("#fxGrid [data-fx]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var fx = btn.getAttribute("data-fx");
      state.fx[fx] = !state.fx[fx];
      btn.classList.toggle("is-on", state.fx[fx]);
      demoBoost = 1;
      if (audio) syncAudio();
    });
  });

  document.querySelectorAll("#waveModes [data-wmode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#waveModes .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      state.wmode = btn.getAttribute("data-wmode");
      demoBoost = Math.min(1, demoBoost + 0.3);
    });
  });

  function updateBpmReadout() {
    var tr = state[state.active].track;
    var bpm = tr.bpm * (1 + state.pitch / 100);
    var bpmVal = document.getElementById("bpmVal");
    var pitchVal = document.getElementById("pitchVal");
    if (bpmVal) bpmVal.textContent = bpm.toFixed(1);
    if (pitchVal) pitchVal.textContent = "Pitch " + (state.pitch > 0 ? "+" : "") + state.pitch.toFixed(1) + "%";
    paintDeckMeta("A");
    paintDeckMeta("B");
  }

  function bumpBpm(dir) {
    var tr = state[state.active].track;
    tr.bpm = Math.max(60, Math.min(200, +(tr.bpm + dir).toFixed(1)));
    updateBpmReadout();
    demoBoost = Math.min(1, demoBoost + 0.25);
  }
  function bumpPitch(dir) {
    state.pitch = Math.max(-16, Math.min(16, +(state.pitch + dir).toFixed(1)));
    updateBpmReadout();
    demoBoost = Math.min(1, demoBoost + 0.25);
    if (audio) syncAudio();
  }
  var bpmUp = document.getElementById("bpmUp");
  var bpmDown = document.getElementById("bpmDown");
  var pitchUp = document.getElementById("pitchUp");
  var pitchDown = document.getElementById("pitchDown");
  if (bpmUp) bpmUp.addEventListener("click", function () { bumpBpm(0.5); });
  if (bpmDown) bpmDown.addEventListener("click", function () { bumpBpm(-0.5); });
  if (pitchUp) pitchUp.addEventListener("click", function () { bumpPitch(0.5); });
  if (pitchDown) pitchDown.addEventListener("click", function () { bumpPitch(-0.5); });

  function pulseDeck(deck) {
    var el = document.getElementById("deck" + deck);
    if (!el || reduce) return;
    el.animate([{ transform: "scale(1)" }, { transform: "scale(1.01)" }, { transform: "scale(1)" }], { duration: 280, easing: "ease-out" });
  }

  /* Deck waveform canvases */
  var waveA = document.getElementById("waveA");
  var waveB = document.getElementById("waveB");
  function sizeWave(c) {
    if (!c) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth || 320;
    var h = c.clientHeight || 64;
    c.width = w * dpr;
    c.height = h * dpr;
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  var ctxA = sizeWave(waveA);
  var ctxB = sizeWave(waveB);
  window.addEventListener("resize", function () {
    ctxA = sizeWave(waveA);
    ctxB = sizeWave(waveB);
    sizeViz();
  });

  function drawDeckWave(ctx, canvas, deckKey, now) {
    if (!ctx || !canvas) return;
    var w = canvas.clientWidth || 320;
    var h = canvas.clientHeight || 64;
    var d = state[deckKey];
    var t = (now - t0) / 1000;
    var speed = (d.track.bpm / 120) * (1 + state.pitch / 100) * (d.playing ? 1 : 0.15);
    d.phase += (d.playing ? 0.085 : 0.01) * speed;
    if (d.cueFlash > 0) d.cueFlash *= 0.85;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);

    var bars = Math.floor(w / 3);
    var eqBoost = 1 + (state.eq.hi + state.eq.mid + state.eq.low) / 60;
    var xfMul = deckKey === "A" ? (1 - state.xf / 100) : (state.xf / 100);
    xfMul = 0.35 + xfMul * 0.9;

    for (var i = 0; i < bars; i++) {
      var x = i * 3;
      var n = i / bars;
      var v = Math.abs(signal(t * speed + d.phase, i + d.track.hue, bars));
      v *= eqBoost * xfMul;
      if (state.fx.filter) v *= 0.55 + 0.45 * Math.sin(n * Math.PI);
      if (state.fx.echo) v += Math.abs(signal(t * speed + d.phase - 0.25, i, bars)) * 0.25;
      if (state.fx.brake && d.playing) v *= 0.7 + 0.3 * Math.sin(t * 8);
      if (d.cueFlash > 0.05) v += d.cueFlash * 0.5;
      var bh = Math.max(2, v * h * 0.9);
      var y = (h - bh) / 2;
      if (state.wmode === "rgb") {
        ctx.fillStyle = "hsl(" + ((d.track.hue + n * 80 + t * 30) % 360) + " 80% 55%)";
      } else if (state.wmode === "pulse") {
        var pulse = 0.5 + 0.5 * Math.sin(t * (d.track.bpm / 60) * Math.PI * 2 + n * 6);
        ctx.fillStyle = "rgba(229,35,61," + (0.35 + pulse * 0.55) + ")";
      } else {
        var hot = n > 0.48 && n < 0.52;
        ctx.fillStyle = hot ? "#E5233D" : "rgba(255,255,255," + (0.25 + v * 0.55) + ")";
      }
      ctx.fillRect(x, y, 2, bh);
    }

    // playhead
    ctx.fillStyle = "rgba(229,35,61,0.9)";
    ctx.fillRect(w * 0.5 - 1, 0, 2, h);
  }

  /* ---------- Optional WebAudio soft tone ---------- */
  var audio = null;
  var audioToggle = document.getElementById("audioToggle");
  function ensureAudio() {
    if (audio) return audio;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var oscA = ctx.createOscillator();
    var oscB = ctx.createOscillator();
    var gA = ctx.createGain();
    var gB = ctx.createGain();
    var master = ctx.createGain();
    var filter = ctx.createBiquadFilter();
    oscA.type = "sine";
    oscB.type = "triangle";
    oscA.frequency.value = 110;
    oscB.frequency.value = 130.8;
    gA.gain.value = 0;
    gB.gain.value = 0;
    master.gain.value = 0.04;
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    oscA.connect(gA); oscB.connect(gB);
    gA.connect(filter); gB.connect(filter);
    filter.connect(master); master.connect(ctx.destination);
    oscA.start(); oscB.start();
    audio = { ctx: ctx, oscA: oscA, oscB: oscB, gA: gA, gB: gB, filter: filter, master: master };
    return audio;
  }
  function syncAudio() {
    if (!audio || !state.audioOn) return;
    var a = audio;
    var bpmA = state.A.track.bpm * (1 + state.pitch / 100);
    var bpmB = state.B.track.bpm * (1 + state.pitch / 100);
    a.oscA.frequency.setTargetAtTime(55 * Math.pow(2, (bpmA - 120) / 120), a.ctx.currentTime, 0.05);
    a.oscB.frequency.setTargetAtTime(65 * Math.pow(2, (bpmB - 120) / 120), a.ctx.currentTime, 0.05);
    var volA = state.A.playing ? (1 - state.xf / 100) * 0.2 : 0;
    var volB = state.B.playing ? (state.xf / 100) * 0.2 : 0;
    a.gA.gain.setTargetAtTime(volA, a.ctx.currentTime, 0.05);
    a.gB.gain.setTargetAtTime(volB, a.ctx.currentTime, 0.05);
    var eq = 1800 + state.eq.hi * 80 - state.eq.low * 40;
    if (state.fx.filter) eq *= 0.45;
    a.filter.frequency.setTargetAtTime(Math.max(200, eq), a.ctx.currentTime, 0.08);
  }
  if (audioToggle) {
    audioToggle.addEventListener("click", function () {
      state.audioOn = !state.audioOn;
      audioToggle.textContent = state.audioOn ? "Mute soft tone" : "Unmute soft tone";
      if (state.audioOn) {
        ensureAudio();
        if (audio && audio.ctx.state === "suspended") audio.ctx.resume();
        syncAudio();
      } else if (audio) {
        audio.gA.gain.value = 0;
        audio.gB.gain.value = 0;
      }
    });
  }

  /* ---------- Visualizer section ---------- */
  var vizCanvas = document.getElementById("vizCanvas");
  var vizCtx = null;
  var vizMode = "bars";
  function sizeViz() {
    if (!vizCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    vizCanvas.width = vizCanvas.clientWidth * dpr;
    vizCanvas.height = 320 * dpr;
    vizCtx = vizCanvas.getContext("2d");
    vizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeViz();
  document.querySelectorAll("#vizModes [data-viz]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#vizModes .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      vizMode = btn.getAttribute("data-viz");
      demoBoost = Math.min(1, demoBoost + 0.3);
    });
  });

  function drawViz(now) {
    if (!vizCtx || !vizCanvas) return;
    var w = vizCanvas.clientWidth;
    var h = 320;
    var t = (now - t0) / 1000;
    vizCtx.clearRect(0, 0, w, h);
    vizCtx.fillStyle = "#0a0a0a";
    vizCtx.fillRect(0, 0, w, h);

    if (vizMode === "bars") {
      var n = 64;
      for (var i = 0; i < n; i++) {
        var v = Math.abs(signal(t, i, n));
        var bh = v * h * 0.85;
        var bw = w / n - 2;
        var x = i * (w / n);
        var g = vizCtx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, "#E5233D");
        g.addColorStop(1, "#8D1027");
        vizCtx.fillStyle = g;
        vizCtx.fillRect(x, h - bh, bw, bh);
      }
    } else if (vizMode === "wave") {
      vizCtx.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 3) {
        var y2 = h / 2 + signal(t, x2 / 3, w / 3) * h * 0.4;
        if (x2 === 0) vizCtx.moveTo(x2, y2); else vizCtx.lineTo(x2, y2);
      }
      vizCtx.strokeStyle = "#E5233D";
      vizCtx.lineWidth = 2;
      vizCtx.stroke();
    } else if (vizMode === "radial") {
      var cx = w / 2, cy = h / 2;
      for (var r = 0; r < 48; r++) {
        var ang = (r / 48) * Math.PI * 2;
        var rad = 40 + Math.abs(signal(t, r, 48)) * 110;
        vizCtx.beginPath();
        vizCtx.moveTo(cx, cy);
        vizCtx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
        vizCtx.strokeStyle = "rgba(229,35,61," + (0.25 + Math.abs(signal(t, r, 48)) * 0.6) + ")";
        vizCtx.stroke();
      }
    } else {
      // spectrum-ish mirrored
      var bins = 96;
      for (var j = 0; j < bins; j++) {
        var vv = Math.abs(signal(t * 1.2, j, bins));
        var hh = vv * h * 0.45;
        var xx = (j / bins) * w;
        vizCtx.fillStyle = "rgba(255,255,255," + (0.15 + vv * 0.5) + ")";
        vizCtx.fillRect(xx, h / 2 - hh, w / bins - 1, hh);
        vizCtx.fillStyle = "rgba(229,35,61," + (0.2 + vv * 0.5) + ")";
        vizCtx.fillRect(xx, h / 2, w / bins - 1, hh);
      }
    }
  }

  /* ---------- RAF loop ---------- */
  function frame(now) {
    drawHeroWave(now);
    drawDeckWave(ctxA, waveA, "A", now);
    drawDeckWave(ctxB, waveB, "B", now);
    drawViz(now);
    demoBoost *= 0.96;
    scrollEnergy *= 0.96;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- GSAP entrance + showcase scroll ---------- */
  function initMotion() {
    if (reduce || typeof gsap === "undefined") {
      document.querySelectorAll(".hero__title .line span").forEach(function (s) {
        s.style.transform = "none";
      });
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.from(".hero__title .line span", {
      yPercent: 110,
      duration: 1.05,
      ease: "power4.out",
      stagger: 0.12,
      delay: 0.35
    });
    gsap.from([".hero__eyebrow", ".hero__sub", ".hero__actions"], {
      opacity: 0,
      y: 18,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.7
    });

    gsap.utils.toArray(".fcard").forEach(function (card, i) {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: "top 88%" },
        opacity: 0,
        y: 28,
        duration: 0.7,
        delay: (i % 4) * 0.06,
        ease: "power3.out"
      });
    });

    gsap.utils.toArray(".callout").forEach(function (c, i) {
      gsap.from(c, {
        scrollTrigger: { trigger: c, start: "top 92%" },
        opacity: 0,
        y: 16,
        duration: 0.5,
        delay: (i % 7) * 0.03
      });
    });

    if (showcaseFrame) {
      gsap.fromTo(showcaseFrame, {
        rotateX: 18,
        rotateY: -12,
        scale: 0.88,
        y: 60
      }, {
        rotateX: 0,
        rotateY: 0,
        scale: 1.02,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "#showcaseStage",
          start: "top 80%",
          end: "bottom 45%",
          scrub: 0.6
        }
      });
    }

    gsap.from(".demo__panel", {
      scrollTrigger: { trigger: "#demo", start: "top 75%" },
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: "power3.out"
    });
  }

  if (document.readyState === "complete") initMotion();
  else window.addEventListener("load", initMotion);

  // seed meta
  updateBpmReadout();
})();
