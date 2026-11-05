(function () {
  var video = document.getElementById("heroVideo");
  if (!video) return;

  // Enable hero video only when /assets/hero.mp4 actually exists.
  fetch("./assets/hero.mp4", { method: "HEAD" })
    .then(function (res) {
      if (!res.ok) return;
      video.classList.add("is-ready");
      var play = video.play();
      if (play && typeof play.catch === "function") play.catch(function () {});
    })
    .catch(function () {});

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    video.removeAttribute("autoplay");
    video.pause();
  }
})();
