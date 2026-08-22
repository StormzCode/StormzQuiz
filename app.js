const StormzSettings = (() => {
  const KEY = "stormzquiz_settings";

  const defaults = {
    theme: "light",
    reduceMotion: false,
    sound: true,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return { ...defaults };
    }
  }

  function save(settings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch (e) {
      /* localStorage unavailable */
    }
  }

  function apply(settings) {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute(
      "data-reduce-motion",
      settings.reduceMotion ? "true" : "false"
    );
  }

  let current = load();
  apply(current);

  function update(patch) {
    current = { ...current, ...patch };
    save(current);
    apply(current);
    return current;
  }

  function get() {
    return current;
  }

  return { get, update };
})();

function playTone(frequency, durationMs) {
  if (!StormzSettings.get().sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => ctx.close();
  } catch (e) {
    /* audio not available */
  }
}

function playCorrectSound() { playTone(880, 180); }
function playIncorrectSound() { playTone(220, 260); }

function initSettingsPanel() {
  const btn = document.getElementById("settingsBtn");
  const overlay = document.getElementById("settingsOverlay");
  const panel = document.getElementById("settingsPanel");
  const closeBtn = document.getElementById("settingsClose");
  const themeSwatches = document.querySelectorAll(".theme-swatch");
  const animSwitch = document.getElementById("animSwitch");
  const soundSwitch = document.getElementById("soundSwitch");

  if (!btn || !overlay || !panel) return;

  const s = StormzSettings.get();
  setActiveSwatch(s.theme);
  setSwitch(animSwitch, s.reduceMotion);
  setSwitch(soundSwitch, s.sound);

  function open() {
    overlay.classList.add("open");
    panel.classList.add("open");
  }
  function close() {
    overlay.classList.remove("open");
    panel.classList.remove("open");
  }

  btn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay.addEventListener("click", close);

  function setActiveSwatch(themeValue) {
    themeSwatches.forEach((sw) => {
      sw.classList.toggle("active", sw.dataset.themeValue === themeValue);
      sw.setAttribute("aria-pressed", sw.dataset.themeValue === themeValue ? "true" : "false");
    });
  }

  themeSwatches.forEach((sw) => {
    sw.addEventListener("click", () => {
      const value = sw.dataset.themeValue;
      setActiveSwatch(value);
      StormzSettings.update({ theme: value });
    });
  });

  animSwitch?.addEventListener("click", () => {
    const nowOn = !animSwitch.classList.contains("on");
    setSwitch(animSwitch, nowOn);
    StormzSettings.update({ reduceMotion: nowOn });
  });

  soundSwitch?.addEventListener("click", () => {
    const nowOn = !soundSwitch.classList.contains("on");
    setSwitch(soundSwitch, nowOn);
    StormzSettings.update({ sound: nowOn });
    if (nowOn) playTone(660, 120);
  });
}

function setSwitch(el, isOn) {
  if (!el) return;
  el.classList.toggle("on", !!isOn);
  el.setAttribute("aria-checked", isOn ? "true" : "false");
}

document.addEventListener("DOMContentLoaded", initSettingsPanel);
