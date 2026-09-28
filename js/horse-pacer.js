(function () {
  "use strict";

  // Owner controls: speeds are CSS pixels/second, acceleration and braking
  // are pixels/second², and pauses/look intervals are seconds.
  const settings = {
    frames: 4,
    standingFrame: 3, // Zero-based: the fourth frame has its hooves planted.
    spriteFacing: -1,
    startPosition: .35,
    pauseDuration: [2.8, 5.8],
    lookInterval: [.85, 1.35],
    strideLength: 28,
    sound: {
      enabled: true,
      src: "../assets/horse-galloping.mp3",
      volume: .5,
      // Loop between quiet gaps in the supplied recording (seconds).
      loopStart: .45,
      loopEnd: 7.6,
      recordedStridesPerSecond: 2
    },
    modes: [
      { name: "walk", weight: .5, speed: [28, 52], acceleration: 65, braking: 110 },
      { name: "run", weight: .36, speed: [80, 130], acceleration: 150, braking: 210 },
      { name: "dash", weight: .14, speed: [175, 245], acceleration: 260, braking: 330 }
    ]
  };
  const random = (min, max) => min + Math.random() * (max - min);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-horse-lane]").forEach(lane => {
    const sprite = lane.querySelector(".horse-sprite");
    if (!sprite) return;
    const sound = window.createHorseMovementSound?.(settings.sound);
    let x = 0, destination = 0, limit = 0, measured = false, direction = 1;
    let mode = null, speed = 0, cruiseSpeed = 0;
    let restTime = random(...settings.pauseDuration), lookTime = random(...settings.lookInterval);
    let phase = settings.standingFrame / settings.frames, shownFrame = -1;
    let frame = null, lastTime = null, inView = true, pageActive = true;

    function draw() {
      sprite.style.transform = `translate3d(${x.toFixed(2)}px,0,0) scaleX(${direction * settings.spriteFacing})`;
      const index = mode ? Math.floor(phase * settings.frames) % settings.frames : settings.standingFrame;
      if (index !== shownFrame) {
        sprite.style.backgroundPositionX = `${index * 100 / (settings.frames - 1)}%`;
        shownFrame = index;
      }
    }

    function rest() {
      mode = null;
      speed = cruiseSpeed = 0;
      destination = x;
      phase = settings.standingFrame / settings.frames;
      restTime = random(...settings.pauseDuration);
      lookTime = random(...settings.lookInterval);
      lane.dataset.horseState = "rest";
      sound?.rest();
    }

    function measure() {
      const fraction = measured && limit > 0 ? x / limit : settings.startPosition;
      const destinationFraction = measured && limit > 0 ? destination / limit : fraction;
      limit = Math.max(0, lane.clientWidth - sprite.offsetWidth);
      x = limit * fraction;
      destination = limit * destinationFraction;
      measured = true;
      if (!limit || (mode && Math.abs(destination - x) < .25)) rest();
      draw();
      sync();
    }

    function startTrip() {
      const minimum = Math.min(limit, Math.max(40, limit * .28));
      const canGoLeft = x >= minimum;
      const canGoRight = limit - x >= minimum;
      direction = canGoLeft && canGoRight ? (Math.random() < .5 ? -1 : 1) : (canGoRight ? 1 : -1);
      const available = direction > 0 ? limit - x : x;
      destination = x + direction * random(Math.min(minimum, available), available);
      let pick = Math.random() * settings.modes.reduce((sum, next) => sum + next.weight, 0);
      mode = settings.modes.find(next => (pick -= next.weight) < 0) || settings.modes.at(-1);
      cruiseSpeed = random(...mode.speed);
      lane.dataset.horseState = mode.name;
    }

    function stride(distance) {
      const progress = distance / (settings.strideLength + speed * .22);
      phase = (phase + progress) % 1;
    }

    function tick(now) {
      frame = null;
      const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      if (!mode) {
        restTime -= dt;
        lookTime -= dt;
        if (lookTime <= 0) {
          direction *= -1;
          lookTime = random(...settings.lookInterval);
        }
        if (restTime <= 0) startTrip();
      } else {
        const remaining = Math.abs(destination - x);
        // Brake over the remaining distance instead of bouncing off the ends.
        const desired = Math.min(cruiseSpeed, Math.sqrt(2 * mode.braking * remaining));
        const previousSpeed = speed;
        const change = (desired > speed ? mode.acceleration : mode.braking) * dt;
        speed += Math.max(-change, Math.min(change, desired - speed));
        const distance = Math.min(remaining, (previousSpeed + speed) * .5 * dt);
        x = Math.max(0, Math.min(limit, x + direction * distance));
        stride(distance);
        if (remaining - distance < .25) {
          x = destination;
          rest();
        }
      }
      sound?.update(speed, speed / (settings.strideLength + speed * .22));
      draw();
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      frame = lastTime = null;
      const motionAllowed = !reducedMotion.matches && window.AOT_ANIMATIONS?.enabled !== false;
      if (!motionAllowed) {
        if (mode) rest();
        draw();
      }
      const page = document.documentElement;
      const running = motionAllowed && pageActive && inView && !document.hidden && limit > 0 &&
        !page.classList.contains("home-returning") && !page.classList.contains("page-wave-reveal");
      sound?.setActive(running);
      if (running) frame = requestAnimationFrame(tick);
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
    window.AOT_ANIMATIONS?.subscribe(sync);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pagehide", () => { pageActive = false; sync(); });
    window.addEventListener("pageshow", () => { pageActive = true; measure(); });
  });
})();
