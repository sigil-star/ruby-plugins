// Chroma: cycles Ruby's accent color (--blue) through the rainbow with a CSS animation.
// Turn the plugin off and Ruby's own accent color comes straight back.

const SPEEDS = { slow: 60, medium: 24, fast: 8 };

function speed() {
  const s = ruby.storage.get("speed");
  return SPEEDS[s] ? s : "medium";
}

let removeStyles = null;
function apply() {
  const secs = SPEEDS[speed()];
  const css =
    "@property --blue { syntax: '<color>'; inherits: true; initial-value: #335fff; }\n" +
    "@property --blue-hover { syntax: '<color>'; inherits: true; initial-value: #4a71ff; }\n" +
    "@keyframes chroma-cycle {" +
    " 0% { --blue: hsl(0 85% 58%); --blue-hover: hsl(0 85% 66%); }" +
    " 17% { --blue: hsl(40 90% 55%); --blue-hover: hsl(40 90% 63%); }" +
    " 33% { --blue: hsl(140 70% 45%); --blue-hover: hsl(140 70% 53%); }" +
    " 50% { --blue: hsl(195 90% 50%); --blue-hover: hsl(195 90% 58%); }" +
    " 67% { --blue: hsl(225 90% 60%); --blue-hover: hsl(225 90% 68%); }" +
    " 83% { --blue: hsl(280 80% 62%); --blue-hover: hsl(280 80% 70%); }" +
    " 100% { --blue: hsl(360 85% 58%); --blue-hover: hsl(360 85% 66%); } }\n" +
    ":root { animation: chroma-cycle " + secs + "s linear infinite; }\n" +
    "html.reduce-motion { animation: none !important; }\n" +
    "@media (prefers-reduced-motion: reduce) { :root { animation: none !important; } }\n";
  if (removeStyles) removeStyles();
  removeStyles = ruby.addStyles(css);
}
apply();
ruby.onUnload(() => {
  if (removeStyles) removeStyles();
});

ruby.registerSettings({
  id: "speed",
  title: "Chroma",
  mount(container) {
    const row = document.createElement("div");
    row.className = "setting-row";
    const label = document.createElement("div");
    label.className = "setting-label";
    label.textContent = "Color cycle speed";
    const group = document.createElement("div");
    group.className = "segmented small";
    for (const s of ["slow", "medium", "fast"]) {
      const b = document.createElement("button");
      b.textContent = s[0].toUpperCase() + s.slice(1);
      if (speed() === s) b.className = "active";
      b.onclick = () => {
        ruby.storage.set("speed", s);
        apply();
        for (const other of group.children) other.className = "";
        b.className = "active";
      };
      group.append(b);
    }
    row.append(label, group);
    container.append(row);
  },
});
