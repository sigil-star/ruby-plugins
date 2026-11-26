// Session Stats: records when you start and stop playing (Ruby's gameLaunch / gameLeave events)
// and shows your play time. Everything stays in this plugin's own storage on this PC.

const MAX_SESSIONS = 300;

function loadSessions() {
  try {
    const list = JSON.parse(ruby.storage.get("sessions") || "[]");
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}
function saveSessions(list) {
  ruby.storage.set("sessions", JSON.stringify(list.slice(-MAX_SESSIONS)));
}

let current = null; // { start, placeId }

ruby.on("gameLaunch", (g) => {
  if (current) return;
  current = { start: Date.now(), placeId: g && g.placeId ? Number(g.placeId) : null };
});
ruby.on("gameLeave", () => {
  if (!current) return;
  const end = Date.now();
  if (end - current.start >= 15000) {
    const list = loadSessions();
    list.push({ start: current.start, end: end, placeId: current.placeId });
    saveSessions(list);
  }
  current = null;
});

function fmt(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return m + "m";
  return Math.floor(m / 60) + "h " + (m % 60) + "m";
}

function startOfDay(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

ruby.registerPage({
  id: "main",
  label: "Sessions",
  iconUrl: ruby.iconUrl,
  mount(container) {
    function render() {
      container.replaceChildren();
      const list = loadSessions();
      const now = Date.now();
      const all = current ? list.concat([{ start: current.start, end: now, placeId: current.placeId, live: true }]) : list;
      const today = startOfDay(now);
      const week = today - 6 * 86400000;
      const dur = (s) => s.end - s.start;
      const sum = (arr) => arr.reduce((n, s) => n + dur(s), 0);

      container.append(el("h1", "page-title", "Session Stats"));
      const stats = el("div", "ss-stats");
      const card = (label, value) => {
        const c = el("div", "ss-card");
        c.append(el("div", "ss-value", value), el("div", "muted small", label));
        return c;
      };
      stats.append(
        card("Today", fmt(sum(all.filter((s) => s.start >= today)))),
        card("Last 7 days", fmt(sum(all.filter((s) => s.start >= week)))),
        card("Sessions", String(all.length)),
        card("Longest", all.length ? fmt(Math.max.apply(null, all.map(dur))) : "0m"),
      );
      container.append(stats);

      // A small bar chart of the last 7 days.
      const chart = el("div", "ss-chart");
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const s = today - i * 86400000;
        days.push({ s: s, total: sum(all.filter((x) => x.start >= s && x.start < s + 86400000)) });
      }
      const max = Math.max(1, Math.max.apply(null, days.map((d) => d.total)));
      for (const d of days) {
        const col = el("div", "ss-col");
        const bar = el("div", "ss-bar");
        bar.style.height = Math.max(2, Math.round((d.total / max) * 100)) + "%";
        bar.title = fmt(d.total);
        col.append(bar, el("div", "muted tiny", new Date(d.s).toLocaleDateString(undefined, { weekday: "short" })));
        chart.append(col);
      }
      container.append(el("h2", "sub-title", "This week"), chart);

      container.append(el("h2", "sub-title", "Recent sessions"));
      if (!all.length) {
        container.append(el("p", "muted small", "Play something and your sessions show up here."));
      } else {
        const rows = el("div", "ss-rows");
        for (const s of all.slice().reverse().slice(0, 30)) {
          const r = el("div", "ss-row");
          const when = new Date(s.start).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          r.append(el("span", "", when + (s.live ? " (playing now)" : "")), el("span", "muted", fmt(dur(s))));
          rows.append(r);
        }
        container.append(rows);
      }

      const clear = el("button", "btn btn-secondary btn-small", "Clear history");
      clear.onclick = async () => {
        if (await ruby.confirm("Clear all saved sessions?")) {
          saveSessions([]);
          render();
        }
      };
      container.append(clear);
    }
    render();
    const timer = setInterval(() => {
      if (current) render();
    }, 30000);
    return () => clearInterval(timer);
  },
});

const removeStyles = ruby.addStyles(
  ".ss-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 12px 0 20px; }" +
    ".ss-card { padding: 14px 16px; border-radius: 12px; background: var(--surface-2); }" +
    ".ss-value { font-size: 24px; font-weight: 800; }" +
    ".ss-chart { display: flex; align-items: flex-end; gap: 10px; height: 140px; margin: 8px 0 20px; }" +
    ".ss-col { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }" +
    ".ss-bar { width: 100%; max-width: 42px; border-radius: 8px 8px 3px 3px; background: var(--blue); }" +
    ".ss-rows { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }" +
    ".ss-row { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 8px; background: var(--surface-2); }",
);
ruby.onUnload(removeStyles);
