// Avatar Frames: animated rings around avatars, colored by online status.
//
// Ruby marks every avatar with data-presence ("online", "ingame", "studio", "offline") and
// data-user (the user id). This plugin only adds CSS for those, so it never reads anyone's data.

const FRAMES = {
  ruby: ["#ff2d55", "#ff6b81", "#b3002d", "#ff2d55"],
  frost: ["#bfe9ff", "#6fc3ff", "#ffffff", "#bfe9ff"],
  emerald: ["#3fe08a", "#0fa968", "#a8ffcf", "#3fe08a"],
  gold: ["#ffd45c", "#e09b1a", "#fff1b8", "#ffd45c"],
  prismatic: ["#ff4d6d", "#ffb347", "#3fe08a", "#2ec5ff", "#b06bff", "#ff4d6d"],
  silver: ["#e6e8f0", "#8f95a8", "#ffffff", "#e6e8f0"],
  ember: ["#ff7a45", "#ff3d00", "#ffc05c", "#ff7a45"],
  ocean: ["#2ec5ff", "#2f6bff", "#7fe3ff", "#2ec5ff"],
};
const FRAME_NAMES = {
  ruby: "Ruby",
  frost: "Frost",
  emerald: "Emerald",
  gold: "Royal Gold",
  prismatic: "Prismatic",
  silver: "Silver",
  ember: "Ember",
  ocean: "Ocean",
};

// Which frame each status gets (editable in Settings).
const DEFAULTS = { online: "emerald", ingame: "ocean", studio: "ember", offline: "none", self: "prismatic" };
const STATUS_LABELS = { self: "Your avatar", online: "Online", ingame: "In a game", studio: "In Studio", offline: "Offline" };

function load() {
  let saved = {};
  try {
    saved = JSON.parse(ruby.storage.get("frames") || "{}");
  } catch (e) {
    saved = {};
  }
  return {
    frames: Object.assign({}, DEFAULTS, saved.frames || {}),
    animated: saved.animated !== false,
    speed: Number(saved.speed) || 3,
    width: Number(saved.width) || 7,
  };
}
function save(cfg) {
  ruby.storage.set("frames", JSON.stringify(cfg));
}

function gradient(name) {
  const stops = FRAMES[name];
  return stops ? "conic-gradient(from var(--rf-angle), " + stops.join(", ") + ")" : "none";
}

function ring(selector, frame, cfg, glow) {
  if (!FRAMES[frame]) return "";
  const anim = cfg.animated ? "animation: rf-spin " + cfg.speed + "s linear infinite;" : "";
  const shadow = glow ? "filter: drop-shadow(0 0 4px " + FRAMES[frame][0] + ");" : "";
  return (
    selector + "::before {" +
    "content: ''; position: absolute; inset: calc(-1 * var(--rf-w)); padding: var(--rf-w);" +
    "border-radius: 50%; pointer-events: none; z-index: 1;" +
    "background: " + gradient(frame) + ";" +
    "-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);" +
    "-webkit-mask-composite: xor; mask-composite: exclude;" +
    anim + shadow + "}\n"
  );
}

let removeStyles = null;
function apply() {
  const cfg = load();
  const me = ruby.user.id;
  let css =
    "@property --rf-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }\n" +
    "@keyframes rf-spin { to { --rf-angle: 360deg; } }\n" +
    ".headshot[data-presence] { --rf-w: " + cfg.width + "%; }\n" +
    "html.reduce-motion .headshot::before { animation: none !important; }\n" +
    "@media (prefers-reduced-motion: reduce) { .headshot::before { animation: none !important; } }\n";
  for (const status of ["online", "ingame", "studio", "offline"]) {
    css += ring('.headshot[data-presence="' + status + '"]:not([data-user="' + me + '"])', cfg.frames[status], cfg, status === "ingame");
  }
  css += ring('.headshot[data-user="' + me + '"]', cfg.frames.self, cfg, true);
  if (removeStyles) removeStyles();
  removeStyles = ruby.addStyles(css);
}

apply();
ruby.onUnload(() => {
  if (removeStyles) removeStyles();
});

// Settings: pick a frame per status, animation and thickness.
ruby.registerSettings({
  id: "frames",
  title: "Avatar Frames",
  mount(container) {
    const cfg = load();
    const wrap = document.createElement("div");
    wrap.className = "rf-settings";

    const note = document.createElement("p");
    note.className = "muted small";
    note.textContent = "Rings follow each friend's status. Your own avatar uses its own frame.";
    wrap.append(note);

    for (const key of ["self", "online", "ingame", "studio", "offline"]) {
      const row = document.createElement("div");
      row.className = "setting-row";
      const label = document.createElement("div");
      label.className = "setting-label";
      label.textContent = STATUS_LABELS[key];
      const picks = document.createElement("div");
      picks.className = "rf-picks";
      for (const id of ["none"].concat(Object.keys(FRAMES))) {
        const b = document.createElement("button");
        b.className = "rf-pick" + (cfg.frames[key] === id ? " on" : "");
        b.title = id === "none" ? "None" : FRAME_NAMES[id];
        b.style.background = id === "none" ? "var(--surface-3)" : "linear-gradient(135deg, " + FRAMES[id].join(", ") + ")";
        b.onclick = () => {
          cfg.frames[key] = id;
          save(cfg);
          apply();
          for (const other of picks.children) other.classList.remove("on");
          b.classList.add("on");
        };
        picks.append(b);
      }
      row.append(label, picks);
      wrap.append(row);
    }

    const anim = document.createElement("label");
    anim.className = "setting-row";
    const animLabel = document.createElement("div");
    animLabel.className = "setting-label";
    animLabel.textContent = "Animated";
    const animBox = document.createElement("input");
    animBox.type = "checkbox";
    animBox.className = "switch";
    animBox.checked = cfg.animated;
    animBox.onchange = () => {
      cfg.animated = animBox.checked;
      save(cfg);
      apply();
    };
    anim.append(animLabel, animBox);
    wrap.append(anim);

    const thick = document.createElement("div");
    thick.className = "setting-row";
    const thickLabel = document.createElement("div");
    thickLabel.className = "setting-label";
    thickLabel.textContent = "Ring thickness";
    const range = document.createElement("input");
    range.type = "range";
    range.min = "4";
    range.max = "12";
    range.value = String(cfg.width);
    range.style.setProperty("--pct", ((cfg.width - 4) / 8) * 100 + "%");
    range.oninput = () => {
      cfg.width = Number(range.value);
      range.style.setProperty("--pct", ((cfg.width - 4) / 8) * 100 + "%");
      save(cfg);
      apply();
    };
    thick.append(thickLabel, range);
    wrap.append(thick);

    container.append(wrap);
  },
});

// Small style for the settings pickers (CSS only, nothing loaded).
const removePickerStyles = ruby.addStyles(
  ".rf-picks { display: flex; flex-wrap: wrap; gap: 6px; }" +
    ".rf-pick { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }" +
    ".rf-pick.on { border-color: var(--text); }",
);
ruby.onUnload(removePickerStyles);
