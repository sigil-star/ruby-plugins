// Hello Ruby — a small example plugin. Copy this folder, change plugin.json, and build.

// A page in the left bar.
ruby.registerPage({
  id: "main",
  label: "Hello",
  icon: "star",
  mount(container) {
    const clicks = Number(ruby.storage.get("clicks") || "0");
    const h = document.createElement("h1");
    h.textContent = "Hello " + (ruby.user.displayName || "there") + " 👋";
    const p = document.createElement("p");
    p.style.opacity = "0.7";
    p.textContent = ruby.name + " on Ruby v" + ruby.version + ". You've clicked " + clicks + " time(s).";
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Click me";
    let n = clicks;
    btn.onclick = () => {
      n += 1;
      ruby.storage.set("clicks", String(n));
      p.textContent = ruby.name + " on Ruby v" + ruby.version + ". You've clicked " + n + " time(s).";
      ruby.toast("Hello! (" + n + ")");
    };
    const link = document.createElement("button");
    link.className = "btn btn-secondary";
    link.textContent = "Open the docs";
    link.onclick = async () => {
      if (await ruby.confirm("Open the plugin docs in your browser?")) {
        ruby.openExternal("https://github.com/sigil-star/ruby-launcher/blob/main/docs/PLUGINS.md");
      }
    };
    container.append(h, p, btn, link);
  },
});

// A tab inside the Customize page.
ruby.registerCustomizeTab({
  id: "tab",
  label: "Hello",
  icon: "star",
  mount(container) {
    // Build UI with createElement + textContent. Never build HTML from strings.
    const h = document.createElement("h2");
    h.className = "sub-title";
    h.textContent = "Hello from a plugin";
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "This Customize tab was added by the Hello Ruby example plugin.";
    container.append(h, p);
  },
});

// A section under Ruby Settings > General.
ruby.registerSettings({
  id: "about",
  title: "Hello Ruby",
  mount(container) {
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "This settings section was added by the Hello Ruby example plugin.";
    container.append(p);
  },
});

// React to events.
ruby.on("navigate", (route) => console.log("[hello-ruby] navigated to", route && route.name));
ruby.on("gameLaunch", (g) => ruby.toast("Have fun! (place " + (g && g.placeId) + ")"));
ruby.onUnload(() => console.log("[hello-ruby] unloaded"));
