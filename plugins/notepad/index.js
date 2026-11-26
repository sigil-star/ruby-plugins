// Notepad: a few quick notes, saved in this plugin's own storage as you type.

function loadNotes() {
  try {
    const n = JSON.parse(ruby.storage.get("notes") || "null");
    if (Array.isArray(n) && n.length) return n;
  } catch (e) {
    /* start fresh */
  }
  return [{ id: Date.now(), title: "My notes", body: "" }];
}
function saveNotes(n) {
  ruby.storage.set("notes", JSON.stringify(n));
}

ruby.registerPage({
  id: "main",
  label: "Notepad",
  iconUrl: ruby.iconUrl,
  mount(container) {
    let notes = loadNotes();
    let active = notes[0].id;
    let saveTimer = null;

    const root = document.createElement("div");
    root.className = "np";
    const side = document.createElement("div");
    side.className = "np-side";
    const editor = document.createElement("div");
    editor.className = "np-editor";
    root.append(side, editor);

    const title = document.createElement("input");
    title.className = "text-input np-title";
    title.maxLength = 80;
    const body = document.createElement("textarea");
    body.className = "np-body";
    body.maxLength = 20000;
    body.placeholder = "Write something…";
    const status = document.createElement("div");
    status.className = "muted tiny";

    const current = () => notes.find((n) => n.id === active);
    const queueSave = () => {
      status.textContent = "Saving…";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveNotes(notes);
        status.textContent = "Saved";
      }, 400);
    };

    function renderSide() {
      side.replaceChildren();
      const add = document.createElement("button");
      add.className = "btn btn-primary btn-small";
      add.textContent = "New note";
      add.onclick = () => {
        const n = { id: Date.now(), title: "Untitled", body: "" };
        notes.unshift(n);
        active = n.id;
        saveNotes(notes);
        renderSide();
        renderEditor();
        title.focus();
      };
      side.append(add);
      for (const n of notes) {
        const b = document.createElement("button");
        b.className = "np-item" + (n.id === active ? " on" : "");
        b.textContent = n.title || "Untitled";
        b.onclick = () => {
          active = n.id;
          renderSide();
          renderEditor();
        };
        side.append(b);
      }
    }

    function renderEditor() {
      const n = current();
      title.value = n.title;
      body.value = n.body;
      status.textContent = "Saved";
      editor.replaceChildren(title, body, status);
      if (notes.length > 1) {
        const del = document.createElement("button");
        del.className = "btn btn-secondary btn-small";
        del.textContent = "Delete note";
        del.onclick = async () => {
          if (!(await ruby.confirm('Delete "' + (n.title || "Untitled") + '"?'))) return;
          notes = notes.filter((x) => x.id !== n.id);
          active = notes[0].id;
          saveNotes(notes);
          renderSide();
          renderEditor();
        };
        editor.append(del);
      }
    }

    title.oninput = () => {
      current().title = title.value;
      queueSave();
      renderSide();
    };
    body.oninput = () => {
      current().body = body.value;
      queueSave();
    };

    renderSide();
    renderEditor();
    container.append(root);
    return () => {
      clearTimeout(saveTimer);
      saveNotes(notes);
    };
  },
});

const removeStyles = ruby.addStyles(
  ".np { display: grid; grid-template-columns: 220px 1fr; gap: 16px; height: calc(100vh - 140px); }" +
    ".np-side { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; }" +
    ".np-item { text-align: left; padding: 9px 12px; border-radius: 8px; background: var(--surface-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }" +
    ".np-item.on { background: var(--surface-3); font-weight: 700; }" +
    ".np-editor { display: flex; flex-direction: column; gap: 10px; min-height: 0; }" +
    ".np-title { font-size: 18px; font-weight: 700; }" +
    ".np-body { flex: 1; min-height: 200px; resize: none; padding: 14px; border-radius: 10px; border: 1px solid var(--line-strong); background: var(--bg); color: var(--text); font: inherit; line-height: 1.5; outline: none; }" +
    ".np-body:focus { border-color: var(--text-3); }",
);
ruby.onUnload(removeStyles);
