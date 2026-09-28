(function () {
  "use strict";

  // Owner controls: speeds are CSS pixels/second, durations are seconds,
  // and fps is the sprite playback rate. The original four frames face left.
  const settings = {
    frames: 4,
    spriteFacing: -1,
    startPosition: .35,
    turnChance: .3,
    modes: [
      { name: "rest", weight: .24, speed: [0, 0], duration: [.8, 2.5], fps: [0, 0] },
      { name: "walk", weight: .36, speed: [28, 55], duration: [1.5, 4], fps: [5, 7] },
      { name: "run", weight: .28, speed: [80, 135], duration: [.9, 2.8], fps: [9, 12] },
      { name: "dash", weight: .12, speed: [180, 280], duration: [.45, 1.2], fps: [14, 18] }
    ]
  };
  const random = (min, max) => min + Math.random() * (max - min);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-horse-lane]").forEach(lane => {
    const sprite = lane.querySelector(".horse-sprite");
    if (!sprite) return;
    let x = 0, limit = 0, measured = false, direction = 1;
    let mode = settings.modes[0], speed = 0, targetSpeed = 0, fps = 0;
    let remaining = random(.5, 1.2), frameProgress = 0, shownFrame = -1;
    let frame = null, lastTime = null, inView = true, pageActive = true;

    function draw() {
      sprite.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scaleX(${direction * settings.spriteFacing})`;
      const index = Math.floor(frameProgress) % settings.frames;
      if (index !== shownFrame) {
        sprite.style.backgroundPositionX = `${index * 100 / (settings.frames - 1)}%`;
        shownFrame = index;
      }
    }

    function measure() {
      const fraction = measured && limit > 0 ? x / limit : settings.startPosition;
      limit = Math.max(0, lane.clientWidth - sprite.offsetWidth);
      x = limit * fraction;
      measured = true;
      draw();
      sync();
    }

    function chooseMode() {
      // A pause always leads back to movement, rather than repeated long rests.
      const choices = settings.modes.filter(next => mode.name !== "rest" || next.name !== "rest");
      let pick = Math.random() * choices.reduce((sum, next) => sum + next.weight, 0);
      mode = choices.find(next => (pick -= next.weight) < 0) || choices.at(-1);
      remaining = random(...mode.duration);
      targetSpeed = random(...mode.speed);
      if (targetSpeed > 0) {
        fps = random(...mode.fps);
        if (x <= 1) direction = 1;
        else if (x >= limit - 1) direction = -1;
        else if (Math.random() < settings.turnChance) direction *= -1;
      }
      lane.dataset.horseState = mode.name;
    }

    function tick(now) {
      frame = null;
      const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      remaining -= dt;
      if (remaining <= 0) chooseMode();
      const acceleration = mode.name === "dash" ? 14 : 7;
      speed += (targetSpeed - speed) * (1 - Math.exp(-acceleration * dt));
      x += direction * speed * dt;
      if (x < 0 || x > limit) {
        x = Math.max(0, Math.min(limit, x));
        direction = x === 0 ? 1 : -1;
        // Some turns are immediate; others pause at the end of the pacing area.
        speed = 0;
        if (Math.random() < .45) {
          mode = settings.modes[0];
          targetSpeed = 0;
          remaining = random(...mode.duration);
          lane.dataset.horseState = mode.name;
        }
      }
      if (speed > 2) frameProgress += dt * fps * Math.min(1, speed / Math.max(targetSpeed, 28));
      else frameProgress = 0;
      draw();
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = lastTime = null;
      const motionAllowed = !reducedMotion.matches && window.AOT_ANIMATIONS?.enabled !== false;
      if (!motionAllowed) {
        speed = 0;
        frameProgress = 0;
        draw();
      }
      const page = document.documentElement;
      if (motionAllowed && pageActive && inView && !document.hidden && limit > 0 &&
          !page.classList.contains("home-returning") && !page.classList.contains("page-wave-reveal")) {
        frame = requestAnimationFrame(tick);
      }
    }

    lane.dataset.horseState = "rest";
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(lane);
    else window.addEventListener("resize", measure);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        sync();
      }).observe(lane);
    }
    // Pause along with the existing star control and page transition effects.
    window.AOT_ANIMATIONS?.subscribe(sync);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pagehide", () => { pageActive = false; sync(); });
    window.addEventListener("pageshow", () => { pageActive = true; measure(); });
  });
})();
