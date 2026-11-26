## Plugin

- **Name / id:**
- **New plugin or update?**
- **What it does (one paragraph):**
- **What it changes in Ruby (pages, tabs, settings, events it listens to):**

## Checklist

- [ ] My plugin lives in `plugins/<id>/` and `plugin.json`'s `id` matches the folder.
- [ ] I bumped `version` (for updates).
- [ ] `node scripts/validate.cjs` passes with no failures.
- [ ] It only uses the `ruby` API — no `document.cookie`, IPC/`__TAURI__`, or Ruby internals.
- [ ] It makes no network requests and loads no code (`fetch`, `eval`, `new Function`, `import()`).
- [ ] The code is readable source — not minified, obfuscated or encoded.
- [ ] It builds UI with `createElement`/`textContent` and cleans up when turned off.
- [ ] It follows Roblox's Terms of Use.
- [ ] It doesn't call itself "Ruby" or "Ruby Launcher" or use Ruby's logo.
- [ ] I wrote this code (or have the right to submit it) and agree to license it under MIT.

## Testing

How did you test it in Ruby? (Screenshots welcome.)
