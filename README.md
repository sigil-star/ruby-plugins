# Ruby plugins

The reviewed plugins for [Ruby Launcher](https://github.com/sigil-star/ruby-launcher). Every
plugin here was read by a person before it was merged. Ruby shows them under
**Plugins › Featured** and installs them straight from this repo — pinned to the exact reviewed
commit, with every file checked against a SHA-256 list signed with Ruby's release key.

- **Using Ruby?** You don't need this page. Open **Plugins** in Ruby and pick from Featured.
- **Making a plugin?** Start with the [plugin guide](https://github.com/sigil-star/ruby-launcher/blob/main/docs/PLUGINS.md),
  especially **Writing plugins safely**.

## Submit a plugin

1. **Build and test it locally.** In Ruby: Plugins › Installed › *Install from folder*.
2. **Fork this repo** and add your plugin as `plugins/<your-id>/`:
   ```
   plugins/my-plugin/
     plugin.json     # id must equal the folder name; version like 1.0.0
     index.js
     README.md       # what it does, and anything it changes
   ```
3. **Run the checker** and fix everything it flags:
   ```bash
   node scripts/validate.cjs
   ```
4. **Open a pull request.** Fill in the checklist in the template honestly.
5. **Review.** The checker runs again automatically. Then the maintainer reads the code by hand
   and may ask for changes. Please be patient; safety comes first.
6. **Listed.** Once merged, your plugin is added to Ruby's signed featured list with the next
   update.

To **update** a plugin, open a pull request that changes it and bumps `version`. Only the
plugin's author (or the maintainer) can change an existing plugin.

## The rules

The full list is in the plugin guide's
[Writing plugins safely](https://github.com/sigil-star/ruby-launcher/blob/main/docs/PLUGINS.md#writing-plugins-safely).
In short, a featured plugin must not:

- touch the Roblox session, `document.cookie`, or Ruby's native layer (`__TAURI__`, IPC);
- make network requests or load code from anywhere (`fetch`, `eval`, `new Function`, `import()`);
- contain minified, obfuscated or encoded code — every line must be readable;
- use browser storage directly (use `ruby.storage`) or open windows (use `ruby.openExternal`);
- break Roblox's Terms of Use (no cheats, exploits or harvesting other players' data);
- use the name or logo of Ruby Launcher as its own.

The checker enforces most of these automatically; the review covers the rest.

## Report a plugin

Found something wrong with a featured plugin? Open an issue with the **Report a plugin**
template. For anything that could hurt users (stealing data, malware), please use GitHub's
**Report a vulnerability** (Security tab) instead of a public issue, so it can be pulled first.

## License

Plugins in this repo are contributed under the [MIT License](LICENSE) so Ruby can distribute
them. By opening a pull request you agree to license your plugin that way. Each plugin's author
keeps their copyright.

Ruby Launcher itself is a separate project with its own license and trademark rules — see the
[main repo](https://github.com/sigil-star/ruby-launcher).
