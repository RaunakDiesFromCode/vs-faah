# 🎵 Faah — Terminal Error Sound for VS Code

Faah plays a sound the moment something breaks in your workspace.

It runs quietly in the background and reacts to failures from:

* Integrated Terminal
* VS Code Tasks
* Code Diagnostics (Problems panel)

If something fails — you hear it.

---

# 🚀 Why Faah?

When you’re focused, you don’t always stare at the terminal.
Faah gives you instant audio feedback so you know immediately when:

* A command fails
* A task exits with an error
* New problems appear in your code

No polling. No hacks. Uses official VS Code APIs.

---

# ✨ Features

## 🔴 Smart Terminal Error Detection

Uses VS Code Shell Integration to detect:

* Non‑zero exit codes
* Failure keywords in output

### Trigger Keywords

```
error
failed
fatal
exception
traceback
panic
segmentation fault
permission denied
command not found
```

Example:

```bash
asd
zsh: command not found: asd
```

→ Faah plays instantly.

---

## 🧪 Task Failure Detection

If a VS Code task finishes with a non‑zero exit code, Faah triggers automatically.

Works with:

* npm scripts
* build pipelines
* custom shell tasks

---

## 🧠 Diagnostic Error Detection

When new **Error-level** diagnostics appear in the Problems panel (TypeScript, ESLint, etc.), Faah reacts.

It does **not** trigger for warnings — only real errors.

---

## ⏳ Cooldown Protection

Prevents rapid repeated playback for the same failure.

Fully configurable.

---

# ⚙️ Requirements

* VS Code **1.77+**
* Terminal Shell Integration enabled

Check this setting:

```
terminal.integrated.shellIntegration.enabled
```

Faah will prompt you if it’s disabled.

---

# 📦 Installation

## From VS Code Marketplace (Recommended)

1. Open Extensions (`Ctrl + Shift + X`)
2. Search for **Faah**
3. Click **Install**

Restart VS Code if necessary.

---

## From VSIX (Manual Install)

### 1️⃣ Package

```bash
npm install
npm run compile
npm install -g vsce
vsce package
```

This generates a `.vsix` file.

### 2️⃣ Install

```bash
code --install-extension faah-<version>.vsix
```

Restart VS Code.

---

## Development Mode

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host.

---

# 🧪 Testing Faah

## Terminal Test

```bash
notarealcommand
```

If it fails → sound plays.

---

## Task Test

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "fail-task",
      "type": "shell",
      "command": "exit 1"
    }
  ]
}
```

Run the task → sound plays.

---

## Diagnostic Test

```ts
const x: string = 123
```

Error appears → sound plays.

---

# 🔧 Configuration

Search **Faah** in VS Code Settings.

| Setting                   | Description                       |
| ------------------------- | --------------------------------- |
| `faah.enabled`            | Enable / disable extension        |
| `faah.cooldown`           | Minimum time (ms) between sounds  |
| `faah.onDiagnosticErrors` | Trigger on Problems panel errors  |
| `faah.onTaskErrors`       | Trigger on task failures          |
| `faah.onTerminalErrors`   | Trigger on terminal failures      |
| `faah.volume`             | Reserved for future audio control |

---

# 🖥 Sidebar View

Faah includes a sidebar view:

* ✅ Shows clean state when no errors exist
* 🖼 Displays image when an error triggers

Provides visual confirmation alongside audio.

---

# 📁 Required Project Structure

```
extension-root/
 ├── src/
 ├── media/
 │    ├── faah.mp3
 │    └── faah.jpeg
 ├── package.json
 └── tsconfig.json
```

The sound file **must** exist inside `media/`.

---

# ⌨️ Command Palette Controls

Faah can also be controlled directly from the **Command Palette**.

Open:

```
Ctrl + Shift + P
```

Type **Faah** to access:

* `Faah: Toggle Extension`
* `Faah: Toggle Diagnostic Errors`
* `Faah: Toggle Task Errors`
* `Faah: Toggle Terminal Errors`
* `Faah: Settings` (Quick toggle menu)

All commands update your global `settings.json` automatically.

This allows fast enabling/disabling without opening the Settings UI.

---

# 🛑 Troubleshooting

## No Sound?

* Ensure `faah.mp3` exists in `/media`
* Ensure VS Code ≥ 1.77
* Ensure Shell Integration is enabled
* Check Developer Tools console

Open:

```
Help → Toggle Developer Tools
```

Look for playback errors.

---

# 🧩 How It Works (Under the Hood)

Faah relies on official VS Code APIs:

* `onDidEndTerminalShellExecution`
* `onDidEndTaskProcess`
* `onDidChangeDiagnostics`

Logic:

1. Detect failure event
2. Check cooldown
3. Play sound
4. Update sidebar view

Efficient and lightweight.

---

# 🎯 Use Case

* Running builds in background
* Watching long scripts
* CI-like local workflows
* Accessibility enhancement

You break it.
You hear it.
You fix it.
