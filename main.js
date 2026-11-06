/* ClimaxDJ marketing site — website-only. Does not touch /workspace/climaxdj app. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mouse = { x: 0.65, y: 0.4 };
  var scrollEnergy = 0, lastScroll = 0, demoBoost = 0;
  var t0 = performance.now();

  /* Cinematic CLIMAXDJ intro — once per session, max ~2.5s, skippable */
  var introDone = false;
  var introTl = null;
  var heroMotionStarted = false;

  function finishIntro() {
    if (introDone) return;
    introDone = true;
    try { sessionStorage.setItem("climaxdj-intro-seen", "1"); } catch (e) {}
    var intro = document.getElementById("intro");
    document.body.classList.remove("intro-lock");
    if (introTl) { try { introTl.kill(); } catch (e) {} introTl = null; }
    if (intro) intro.classList.add("is-done");
    startHeroMotion();
  }

  function startHeroMotion() {
    if (heroMotionStarted || reduce || typeof gsap === "undefined") return;
    heroMotionStarted = true;
    gsap.from(".hero__title .line span", { yPercent: 110, duration: 1.05, ease: "power4.out", stagger: 0.1, delay: 0.05 });
    gsap.from([".hero__eyebrow", ".hero__sub2", ".hero__copy", ".hero__actions"], { opacity: 0, y: 16, duration: 0.75, stagger: 0.06, delay: 0.28 });
    if (document.querySelector(".hero__shot")) {
      gsap.from(".hero__shot", { opacity: 0, x: 40, duration: 1.1, delay: 0.18, ease: "power3.out" });
    }
  }

  function runIntro() {
    var intro = document.getElementById("intro");
    var mark = document.getElementById("introMark");
    var sweep = intro ? intro.querySelector(".intro__sweep") : null;
    var skipBtn = document.getElementById("introSkip");
    var seen = false;
    try { seen = sessionStorage.getItem("climaxdj-intro-seen") === "1"; } catch (e) {}

    if (!intro || reduce || seen || typeof gsap === "undefined") {
      if (intro) intro.classList.add("is-done");
      document.body.classList.remove("intro-lock");
      introDone = true;
      startHeroMotion();
      return;
    }

    document.body.classList.add("intro-lock");
    if (skipBtn) skipBtn.addEventListener("click", finishIntro);
    intro.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest(".intro__skip")) return;
      finishIntro();
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finishIntro();
        document.removeEventListener("keydown", onKey);
      }
    });

    introTl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: finishIntro
    });
    // total ~2.45s
    introTl.set(mark, { opacity: 0, scale: 1.18, filter: "blur(24px)" });
    introTl.to(mark, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7 }, 0);
    if (sweep) {
      introTl.fromTo(sweep, { opacity: 0, xPercent: -70 }, { opacity: 1, xPercent: 70, duration: 0.85, ease: "power2.inOut" }, 0.55);
      introTl.to(sweep, { opacity: 0, duration: 0.25 }, 1.25);
    }
    introTl.to({}, { duration: 0.35 }); // hold
    introTl.to(mark, { opacity: 0, scale: 0.92, filter: "blur(16px)", duration: 0.55, ease: "power2.in" });
    introTl.to(intro, { opacity: 0, duration: 0.35, ease: "power2.in" }, "-=0.25");
  }

  if (document.readyState === "complete") runIntro();
  else window.addEventListener("load", runIntro);

  /* Nav */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("mobileNav");
  window.addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 16);
    scrollEnergy = Math.min(1, scrollEnergy * 0.85 + Math.abs(window.scrollY - lastScroll) / 80);
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

  /* Mouse glow — no hero.mp4 request (avoids 404) */
  var glow = document.getElementById("heroGlow");
  document.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX / Math.max(1, window.innerWidth);
    mouse.y = e.clientY / Math.max(1, window.innerHeight);
    if (glow && !reduce) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }
  }, { passive: true });

  function signal(t, i, n) {
    var phase = t * (0.9 + demoBoost * 0.35) + i * 0.17;
    var a = Math.sin(phase * 2.1) * 0.55;
    var b = Math.sin(phase * 5.3 + mouse.x * 4) * 0.28;
    var c = Math.sin(phase * 11 + mouse.y * 6) * 0.12;
    var env = 0.55 + 0.35 * Math.sin(t * 0.7 + i / Math.max(1, n) * Math.PI * 2);
    return (a + b + c) * env * (0.7 + scrollEnergy * 0.45 + demoBoost * 0.35);
  }

  /* Hero canvas */
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
  function drawHero(now) {
    if (!heroCtx || !heroCanvas) return;
    var w = heroCanvas.clientWidth, h = heroCanvas.clientHeight, t = (now - t0) / 1000;
    heroCtx.clearRect(0, 0, w, h);
    for (var r = 0; r < 3; r++) {
      heroCtx.beginPath();
      var mid = h * (0.38 + r * 0.16);
      for (var x = 0; x <= w; x += 4) {
        var y = mid + signal(t + r * 0.35, x / 4, w / 4) * (36 - r * 8) * (0.55 + mouse.y * 0.5);
        if (x === 0) heroCtx.moveTo(x, y); else heroCtx.lineTo(x, y);
      }
      heroCtx.strokeStyle = r === 1 ? "rgba(255,90,31,0.5)" : "rgba(244,246,251," + (0.1 + r * 0.04) + ")";
      heroCtx.lineWidth = r === 1 ? 2 : 1.15;
      heroCtx.stroke();
    }
  }

  /* Shot switchers */
  function wireShots(rootSel, imgSel) {
    var img = document.querySelector(imgSel);
    document.querySelectorAll(rootSel + " [data-shot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(rootSel + " .chip").forEach(function (b) { b.classList.remove("is-on"); });
        btn.classList.add("is-on");
        var id = btn.getAttribute("data-shot");
        if (!img) return;
        var pic = img.closest("picture");
        if (pic) {
          var src = pic.querySelector("source");
          if (src) src.srcset = "./screenshots/" + id + ".webp";
        }
        img.src = "./screenshots/" + id + ".jpg";
        demoBoost = Math.min(1, demoBoost + 0.35);
      });
    });
  }
  wireShots("#djThumbs", "#djShot img");
  wireShots("#studioThumbs", "#studioShot");

  /* ===== DJ DEMO ===== */
  var TRACKS = [
    { title: "Nachtkante", artist: "Nord", bpm: 124, key: "8A", hue: 20 },
    { title: "Hafenlicht", artist: "Kai", bpm: 126, key: "8B", hue: 210 },
    { title: "Kiesweg", artist: "Ost", bpm: 128, key: "9B", hue: 200 },
    { title: "Spätschicht", artist: "Süd", bpm: 122, key: "9A", hue: 330 },
    { title: "Neonbrücke", artist: "West", bpm: 130, key: "10A", hue: 350 },
    { title: "Gleis 7", artist: "Linie", bpm: 125, key: "7A", hue: 160 }
  ];
  var state = {
    active: "A",
    A: { track: TRACKS[0], playing: false, cueFlash: 0, slip: false, sync: false, phase: 0 },
    B: { track: TRACKS[1], playing: false, cueFlash: 0, slip: false, sync: false, phase: Math.PI },
    xf: 50, eq: { hi: 0, mid: 0, low: 0 }, fx: {}, wmode: "classic", pitch: 0, audioOn: false, four: false
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
      if (i === 0) b.classList.add("is-active");
      li.appendChild(b); lib.appendChild(li);
    });
  }

  function loadTrack(deck, tr) {
    state[deck].track = tr;
    state[deck].phase = Math.random() * Math.PI * 2;
    paintMeta(deck);
    updateBpm();
    var mini = document.getElementById("mini" + deck);
    if (mini) mini.textContent = tr.title;
  }
  function paintMeta(deck) {
    var tr = state[deck].track;
    var title = document.getElementById("deck" + deck + "Title");
    var meta = document.getElementById("deck" + deck + "Meta");
    if (title) title.textContent = tr.title;
    if (meta) meta.textContent = tr.artist + " · " + (tr.bpm * (1 + state.pitch / 100)).toFixed(1) + " BPM · " + tr.key;
  }
  function setActive(deck) {
    state.active = deck;
    var a = document.getElementById("deckA"), b = document.getElementById("deckB");
    if (a) a.classList.toggle("is-active", deck === "A");
    if (b) b.classList.toggle("is-active", deck === "B");
    updateBpm();
  }
  var deckAEl = document.getElementById("deckA");
  var deckBEl = document.getElementById("deckB");
  if (deckAEl) deckAEl.addEventListener("pointerdown", function () { setActive("A"); });
  if (deckBEl) deckBEl.addEventListener("pointerdown", function () { setActive("B"); });

  document.querySelectorAll("[data-act]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var deck = btn.getAttribute("data-deck");
      var act = btn.getAttribute("data-act");
      setActive(deck);
      var d = state[deck];
      if (act === "play") {
        d.playing = !d.playing;
        btn.classList.toggle("is-on", d.playing);
        var st = document.getElementById("deck" + deck + "State");
        if (st) st.textContent = d.playing ? "PLAYING" : "READY";
        if (audio) syncAudio();
      } else if (act === "cue") {
        d.cueFlash = 1; d.phase = 0;
        btn.classList.add("is-on");
        setTimeout(function () { btn.classList.remove("is-on"); }, 160);
      } else if (act === "sync") {
        d.sync = !d.sync; btn.classList.toggle("is-on", d.sync); updateBpm();
      } else if (act === "slip") {
        d.slip = !d.slip; btn.classList.toggle("is-on", d.slip);
      }
      demoBoost = Math.min(1, demoBoost + 0.45);
    });
  });

  var xfader = document.getElementById("xfader");
  var xfaderVal = document.getElementById("xfaderVal");
  if (xfader) xfader.addEventListener("input", function () {
    state.xf = +xfader.value;
    if (xfaderVal) xfaderVal.textContent = String(state.xf);
    demoBoost = Math.min(1, demoBoost + 0.12);
    if (audio) syncAudio();
  });
  [["eqHi", "hi", "eqHiOut"], ["eqMid", "mid", "eqMidOut"], ["eqLow", "low", "eqLowOut"]].forEach(function (row) {
    var el = document.getElementById(row[0]), out = document.getElementById(row[2]);
    if (!el) return;
    el.addEventListener("input", function () {
      state.eq[row[1]] = +el.value;
      if (out) out.textContent = (state.eq[row[1]] > 0 ? "+" : "") + state.eq[row[1]] + " dB";
      demoBoost = Math.min(1, demoBoost + 0.08);
      if (audio) syncAudio();
    });
  });
  document.querySelectorAll("#fxGrid [data-fx]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var fx = btn.getAttribute("data-fx");
      state.fx[fx] = !state.fx[fx];
      btn.classList.toggle("is-on", state.fx[fx]);
      demoBoost = 1; if (audio) syncAudio();
    });
  });
  document.querySelectorAll("#waveModes [data-wmode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#waveModes .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      state.wmode = btn.getAttribute("data-wmode");
      demoBoost = Math.min(1, demoBoost + 0.25);
    });
  });

  function updateBpm() {
    var tr = state[state.active].track;
    var bpm = tr.bpm * (1 + state.pitch / 100);
    var bpmVal = document.getElementById("bpmVal");
    var pitchVal = document.getElementById("pitchVal");
    if (bpmVal) bpmVal.textContent = bpm.toFixed(1);
    if (pitchVal) pitchVal.textContent = "Pitch " + (state.pitch > 0 ? "+" : "") + state.pitch.toFixed(1) + "%";
    paintMeta("A"); paintMeta("B");
  }
  function bumpBpm(d) { state[state.active].track.bpm = Math.max(60, Math.min(200, +(state[state.active].track.bpm + d).toFixed(1))); updateBpm(); demoBoost = Math.min(1, demoBoost + 0.2); }
  function bumpPitch(d) { state.pitch = Math.max(-16, Math.min(16, +(state.pitch + d).toFixed(1))); updateBpm(); demoBoost = Math.min(1, demoBoost + 0.2); if (audio) syncAudio(); }
  var bpmUp = document.getElementById("bpmUp"), bpmDown = document.getElementById("bpmDown");
  var pitchUp = document.getElementById("pitchUp"), pitchDown = document.getElementById("pitchDown");
  if (bpmUp) bpmUp.addEventListener("click", function () { bumpBpm(0.5); });
  if (bpmDown) bpmDown.addEventListener("click", function () { bumpBpm(-0.5); });
  if (pitchUp) pitchUp.addEventListener("click", function () { bumpPitch(0.5); });
  if (pitchDown) pitchDown.addEventListener("click", function () { bumpPitch(-0.5); });

  var mode2 = document.getElementById("mode2"), mode4 = document.getElementById("mode4");
  var decksMain = document.getElementById("decksMain"), fourGrid = document.getElementById("fourGrid");
  if (mode2 && mode4) {
    mode2.addEventListener("click", function () {
      state.four = false; mode2.classList.add("is-on"); mode4.classList.remove("is-on");
      if (decksMain) decksMain.classList.remove("is-four");
      if (fourGrid) fourGrid.setAttribute("aria-hidden", "true");
    });
    mode4.addEventListener("click", function () {
      state.four = true; mode4.classList.add("is-on"); mode2.classList.remove("is-on");
      if (decksMain) decksMain.classList.add("is-four");
      if (fourGrid) fourGrid.setAttribute("aria-hidden", "false");
      document.getElementById("miniA").textContent = state.A.track.title;
      document.getElementById("miniB").textContent = state.B.track.title;
      document.getElementById("miniC").textContent = TRACKS[2].title;
      document.getElementById("miniD").textContent = TRACKS[3].title;
      demoBoost = 1;
    });
  }

  function sizeWave(c) {
    if (!c) return null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth || 320, h = c.clientHeight || 58;
    c.width = w * dpr; c.height = h * dpr;
    var ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  var waveA = document.getElementById("waveA"), waveB = document.getElementById("waveB");
  var ctxA = sizeWave(waveA), ctxB = sizeWave(waveB);

  function drawDeckWave(ctx, canvas, key, now) {
    if (!ctx || !canvas) return;
    var w = canvas.clientWidth || 320, h = canvas.clientHeight || 58;
    var d = state[key], t = (now - t0) / 1000;
    var speed = (d.track.bpm / 120) * (1 + state.pitch / 100) * (d.playing ? 1 : 0.12);
    d.phase += (d.playing ? 0.085 : 0.01) * speed;
    if (d.cueFlash > 0) d.cueFlash *= 0.85;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#05060a"; ctx.fillRect(0, 0, w, h);
    var bars = Math.floor(w / 3);
    var eqBoost = 1 + (state.eq.hi + state.eq.mid + state.eq.low) / 60;
    var xfMul = key === "A" ? (1 - state.xf / 100) : (state.xf / 100);
    xfMul = 0.35 + xfMul * 0.9;
    var accent = key === "A" ? "#FF5A1F" : "#3D8BFF";
    for (var i = 0; i < bars; i++) {
      var n = i / bars;
      var v = Math.abs(signal(t * speed + d.phase, i + d.track.hue, bars)) * eqBoost * xfMul;
      if (state.fx.filter) v *= 0.55 + 0.45 * Math.sin(n * Math.PI);
      if (state.fx.echo) v += Math.abs(signal(t * speed + d.phase - 0.25, i, bars)) * 0.25;
      if (state.fx.brake && d.playing) v *= 0.7 + 0.3 * Math.sin(t * 8);
      if (d.cueFlash > 0.05) v += d.cueFlash * 0.45;
      var bh = Math.max(2, v * h * 0.9);
      if (state.wmode === "rgb") ctx.fillStyle = "hsl(" + ((d.track.hue + n * 80 + t * 30) % 360) + " 80% 55%)";
      else if (state.wmode === "pulse") {
        var pulse = 0.5 + 0.5 * Math.sin(t * (d.track.bpm / 60) * Math.PI * 2 + n * 6);
        ctx.fillStyle = key === "A" ? "rgba(255,90,31," + (0.35 + pulse * 0.55) + ")" : "rgba(61,139,255," + (0.35 + pulse * 0.55) + ")";
      } else {
        var hot = n > 0.48 && n < 0.52;
        ctx.fillStyle = hot ? accent : "rgba(244,246,251," + (0.22 + v * 0.5) + ")";
      }
      ctx.fillRect(i * 3, (h - bh) / 2, 2, bh);
    }
    ctx.fillStyle = accent;
    ctx.fillRect(w * 0.5 - 1, 0, 2, h);
  }

  /* Optional WebAudio soft tone */
  var audio = null;
  function ensureAudio() {
    if (audio) return audio;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var oscA = ctx.createOscillator(), oscB = ctx.createOscillator();
    var gA = ctx.createGain(), gB = ctx.createGain(), master = ctx.createGain(), filter = ctx.createBiquadFilter();
    oscA.type = "sine"; oscB.type = "triangle";
    oscA.frequency.value = 110; oscB.frequency.value = 130.8;
    gA.gain.value = 0; gB.gain.value = 0; master.gain.value = 0.04;
    filter.type = "lowpass"; filter.frequency.value = 2400;
    oscA.connect(gA); oscB.connect(gB); gA.connect(filter); gB.connect(filter); filter.connect(master); master.connect(ctx.destination);
    oscA.start(); oscB.start();
    audio = { ctx: ctx, oscA: oscA, oscB: oscB, gA: gA, gB: gB, filter: filter };
    return audio;
  }
  function syncAudio() {
    if (!audio || !state.audioOn) return;
    var a = audio;
    a.oscA.frequency.setTargetAtTime(55 * Math.pow(2, (state.A.track.bpm * (1 + state.pitch / 100) - 120) / 120), a.ctx.currentTime, 0.05);
    a.oscB.frequency.setTargetAtTime(65 * Math.pow(2, (state.B.track.bpm * (1 + state.pitch / 100) - 120) / 120), a.ctx.currentTime, 0.05);
    a.gA.gain.setTargetAtTime(state.A.playing ? (1 - state.xf / 100) * 0.2 : 0, a.ctx.currentTime, 0.05);
    a.gB.gain.setTargetAtTime(state.B.playing ? (state.xf / 100) * 0.2 : 0, a.ctx.currentTime, 0.05);
    var eq = 1800 + state.eq.hi * 80 - state.eq.low * 40;
    if (state.fx.filter) eq *= 0.45;
    a.filter.frequency.setTargetAtTime(Math.max(200, eq), a.ctx.currentTime, 0.08);
  }
  var audioToggle = document.getElementById("audioToggle");
  if (audioToggle) audioToggle.addEventListener("click", function () {
    state.audioOn = !state.audioOn;
    audioToggle.textContent = state.audioOn ? "Mute soft tone" : "Unmute soft tone";
    if (state.audioOn) { ensureAudio(); if (audio.ctx.state === "suspended") audio.ctx.resume(); syncAudio(); }
    else if (audio) { audio.gA.gain.value = 0; audio.gB.gain.value = 0; }
  });

  /* ===== STUDIO DEMO ===== */
  var studioAC = null, synthFreq = 55, autoPts = [0.2, 0.35, 0.55, 0.4, 0.75, 0.6, 0.85, 0.5];
  function studioCtx() {
    if (studioAC) return studioAC;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    studioAC = new AC();
    return studioAC;
  }
  function beep(freq, dur, type, gain) {
    var ctx = studioCtx(); if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.value = gain || 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.25));
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (dur || 0.25));
  }

  /* Piano */
  var piano = document.getElementById("piano");
  var white = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
  var black = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1, 13: 1, 15: 1, 18: 1, 20: 1, 22: 1 };
  if (piano) {
    for (var i = 0; i < 14; i++) {
      var k = document.createElement("button");
      k.type = "button"; k.className = "key"; k.setAttribute("aria-label", "Note " + i);
      var midi = 60 + white[i];
      k.addEventListener("pointerdown", function (m) {
        return function (ev) {
          ev.currentTarget.classList.add("is-on");
          beep(440 * Math.pow(2, (m - 69) / 12), 0.28, "triangle", 0.1);
          demoBoost = 1;
        };
      }(midi));
      k.addEventListener("pointerup", function (ev) { ev.currentTarget.classList.remove("is-on"); });
      k.addEventListener("pointerleave", function (ev) { ev.currentTarget.classList.remove("is-on"); });
      piano.appendChild(k);
    }
  }

  /* Step sequencer */
  var rows = [
    { name: "Kick", pat: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], freq: 55 },
    { name: "Snare", pat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], freq: 180 },
    { name: "Hat", pat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0], freq: 6000 }
  ];
  var stepsEl = document.getElementById("steps");
  var seqTimer = null, seqStep = 0;
  if (stepsEl) {
    rows.forEach(function (row, ri) {
      var lab = document.createElement("div"); lab.className = "lab"; lab.textContent = row.name; stepsEl.appendChild(lab);
      for (var s = 0; s < 16; s++) {
        var cell = document.createElement("button");
        cell.type = "button"; cell.className = "cell" + (row.pat[s] ? " is-on" : "");
        cell.dataset.r = String(ri); cell.dataset.s = String(s);
        cell.addEventListener("click", function () {
          var r = +this.dataset.r, s2 = +this.dataset.s;
          rows[r].pat[s2] = rows[r].pat[s2] ? 0 : 1;
          this.classList.toggle("is-on", !!rows[r].pat[s2]);
        });
        stepsEl.appendChild(cell);
      }
    });
  }
  function paintPlayhead(step) {
    if (!stepsEl) return;
    stepsEl.querySelectorAll(".cell").forEach(function (c) {
      c.classList.toggle("is-playhead", +c.dataset.s === step);
    });
  }
  var seqPlay = document.getElementById("seqPlay"), seqStop = document.getElementById("seqStop");
  if (seqPlay) seqPlay.addEventListener("click", function () {
    studioCtx();
    if (seqTimer) clearInterval(seqTimer);
    seqStep = 0;
    seqTimer = setInterval(function () {
      paintPlayhead(seqStep);
      rows.forEach(function (row) {
        if (row.pat[seqStep]) beep(row.freq, row.name === "Hat" ? 0.05 : 0.12, row.name === "Hat" ? "square" : "sine", row.name === "Hat" ? 0.03 : 0.1);
      });
      seqStep = (seqStep + 1) % 16;
      demoBoost = Math.min(1, demoBoost + 0.15);
    }, 140);
  });
  if (seqStop) seqStop.addEventListener("click", function () {
    if (seqTimer) clearInterval(seqTimer); seqTimer = null; paintPlayhead(-1);
  });

  /* Arrangement playhead */
  var arrangeHead = document.getElementById("arrangeHead");
  var arrangePos = 0.08;
  function tickArrange() {
    if (!arrangeHead || reduce) return;
    arrangePos += 0.0025; if (arrangePos > 0.92) arrangePos = 0.08;
    arrangeHead.style.left = (arrangePos * 100) + "%";
  }

  /* Synths */
  document.querySelectorAll("#synthPresets [data-synth]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#synthPresets .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      synthFreq = +btn.getAttribute("data-freq");
    });
  });
  var synthPlay = document.getElementById("synthPlay");
  if (synthPlay) synthPlay.addEventListener("click", function () {
    beep(synthFreq, 0.45, "sawtooth", 0.09);
    demoBoost = 1;
  });

  /* Mixer faders */
  document.querySelectorAll("#mixFaders input").forEach(function (inp) {
    inp.addEventListener("input", function () {
      var out = inp.parentElement.querySelector("output");
      if (out) out.textContent = inp.value;
      demoBoost = Math.min(1, demoBoost + 0.08);
    });
  });

  /* Automation canvas */
  var autoCanvas = document.getElementById("autoCanvas");
  var autoCtx = autoCanvas ? autoCanvas.getContext("2d") : null;
  function sizeAuto() {
    if (!autoCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    autoCanvas.width = autoCanvas.clientWidth * dpr;
    autoCanvas.height = 90 * dpr;
    autoCtx = autoCanvas.getContext("2d");
    autoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAuto();
  }
  function drawAuto() {
    if (!autoCtx || !autoCanvas) return;
    var w = autoCanvas.clientWidth, h = 90;
    autoCtx.clearRect(0, 0, w, h);
    autoCtx.fillStyle = "#0c0e14"; autoCtx.fillRect(0, 0, w, h);
    autoCtx.beginPath();
    for (var i = 0; i < autoPts.length; i++) {
      var x = (i / (autoPts.length - 1)) * w;
      var y = (1 - autoPts[i]) * (h - 8) + 4;
      if (i === 0) autoCtx.moveTo(x, y); else autoCtx.lineTo(x, y);
    }
    autoCtx.strokeStyle = "#3D8BFF"; autoCtx.lineWidth = 2; autoCtx.stroke();
    autoPts.forEach(function (p, i) {
      var x = (i / (autoPts.length - 1)) * w, y = (1 - p) * (h - 8) + 4;
      autoCtx.fillStyle = "#FF5A1F"; autoCtx.beginPath(); autoCtx.arc(x, y, 4, 0, Math.PI * 2); autoCtx.fill();
    });
  }
  if (autoCanvas) {
    sizeAuto();
    autoCanvas.addEventListener("pointerdown", function (e) {
      var rect = autoCanvas.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = 1 - (e.clientY - rect.top) / rect.height;
      var idx = Math.round(x * (autoPts.length - 1));
      autoPts[idx] = Math.max(0, Math.min(1, y));
      drawAuto(); demoBoost = 1;
    });
  }

  /* ===== ENGINE VIZ ===== */
  var engineCanvas = document.getElementById("engineCanvas");
  var engineCtx = null, vizMode = "bars";
  function sizeEngine() {
    if (!engineCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    engineCanvas.width = engineCanvas.clientWidth * dpr;
    engineCanvas.height = 280 * dpr;
    engineCtx = engineCanvas.getContext("2d");
    engineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeEngine();
  document.querySelectorAll("#vizModes [data-viz]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#vizModes .chip").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on"); vizMode = btn.getAttribute("data-viz"); demoBoost = Math.min(1, demoBoost + 0.25);
    });
  });
  function drawEngine(now) {
    if (!engineCtx || !engineCanvas) return;
    var w = engineCanvas.clientWidth, h = 280, t = (now - t0) / 1000;
    engineCtx.clearRect(0, 0, w, h);
    engineCtx.fillStyle = "#0a0c12"; engineCtx.fillRect(0, 0, w, h);
    if (vizMode === "bars") {
      for (var i = 0; i < 64; i++) {
        var v = Math.abs(signal(t, i, 64));
        var bh = v * h * 0.85, g = engineCtx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, "#FF5A1F"); g.addColorStop(1, "#8D1027");
        engineCtx.fillStyle = g; engineCtx.fillRect(i * (w / 64), h - bh, w / 64 - 2, bh);
      }
    } else if (vizMode === "wave") {
      engineCtx.beginPath();
      for (var x = 0; x <= w; x += 3) {
        var y = h / 2 + signal(t, x / 3, w / 3) * h * 0.38;
        if (x === 0) engineCtx.moveTo(x, y); else engineCtx.lineTo(x, y);
      }
      engineCtx.strokeStyle = "#FF5A1F"; engineCtx.lineWidth = 2; engineCtx.stroke();
    } else if (vizMode === "radial") {
      var cx = w / 2, cy = h / 2;
      for (var r = 0; r < 48; r++) {
        var ang = (r / 48) * Math.PI * 2, rad = 40 + Math.abs(signal(t, r, 48)) * 100;
        engineCtx.beginPath(); engineCtx.moveTo(cx, cy);
        engineCtx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
        engineCtx.strokeStyle = "rgba(61,139,255," + (0.25 + Math.abs(signal(t, r, 48)) * 0.55) + ")";
        engineCtx.stroke();
      }
    } else {
      for (var j = 0; j < 96; j++) {
        var vv = Math.abs(signal(t * 1.2, j, 96)), hh = vv * h * 0.42, xx = (j / 96) * w;
        engineCtx.fillStyle = "rgba(244,246,251," + (0.12 + vv * 0.45) + ")";
        engineCtx.fillRect(xx, h / 2 - hh, w / 96 - 1, hh);
        engineCtx.fillStyle = "rgba(255,90,31," + (0.2 + vv * 0.45) + ")";
        engineCtx.fillRect(xx, h / 2, w / 96 - 1, hh);
      }
    }
  }

  window.addEventListener("resize", function () {
    sizeHero(); ctxA = sizeWave(waveA); ctxB = sizeWave(waveB); sizeEngine(); sizeAuto();
  });

  function frame(now) {
    drawHero(now);
    drawDeckWave(ctxA, waveA, "A", now);
    drawDeckWave(ctxB, waveB, "B", now);
    drawEngine(now);
    tickArrange();
    demoBoost *= 0.96; scrollEnergy *= 0.96;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  updateBpm();

  /* GSAP */
  function initMotion() {
    if (reduce || typeof gsap === "undefined") return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    /* Hero entrance is started by finishIntro / runIntro after the wordmark */
    /* Text scroll in premium.js owns fade/blur; keep a light lift only on cards */
    gsap.utils.toArray(".callout, .eco__node").forEach(function (el, i) {
      gsap.from(el, { scrollTrigger: { trigger: el, start: "top 92%" }, opacity: 0, y: 18, duration: 0.5, delay: (i % 6) * 0.03 });
    });
    /* Scroll-pinned CLIMAXDJ → dissolves into product worlds */
    var wmPin = document.getElementById("wm-pin");
    var wmMark = document.getElementById("wmMark");
    if (wmPin && wmMark && window.ScrollTrigger) {
      var wmTl = gsap.timeline({
        scrollTrigger: {
          trigger: wmPin,
          start: "top top",
          end: "+=145%",
          scrub: 0.65,
          pin: true,
          anticipatePin: 1
        }
      });
      wmTl.fromTo(wmMark, {
        opacity: 0, scale: 1.45, filter: "blur(22px)"
      }, {
        opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.28, ease: "none"
      });
      wmTl.to(wmMark, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.18, ease: "none" }); // hold
      wmTl.to(wmMark, {
        opacity: 0, scale: 3.4, filter: "blur(30px)", duration: 0.54, ease: "none"
      });
      wmTl.to(".wm-pin__hint", { opacity: 0, duration: 0.15 }, 0.28);
      wmTl.fromTo("#worlds", { opacity: 0.35 }, { opacity: 1, duration: 0.35, ease: "none" }, 0.55);
      gsap.from("#worlds .fcard", {
        scrollTrigger: { trigger: "#worlds", start: "top 85%" },
        opacity: 0, y: 28, scale: 0.96, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });
    }

    var djShot = document.getElementById("djShot");
    if (djShot) {
      gsap.fromTo(djShot, { rotateX: 12, rotateY: -8, scale: 0.92, y: 40 }, {
        rotateX: 0, rotateY: 0, scale: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: "#world-dj", start: "top 75%", end: "top 25%", scrub: 0.55 }
      });
    }
  }
  if (document.readyState === "complete") initMotion();
  else window.addEventListener("load", initMotion);
})();
