# 🎵 Faah — Terminal Error Sound for VS Code

Faah plays a sound whenever something breaks.

It monitors your workspace in the background and triggers a sound when errors occur in:

* Integrated Terminal
* VS Code Tasks
* Code Diagnostics (Problems panel)

A short cooldown prevents repeated playback for the same failure.

---

# ✨ Features

## 🔴 Terminal Error Detection

Faah monitors integrated terminals using VS Code Shell Integration.

It triggers when:

* A command exits with a **non‑zero exit code**
* Output contains keywords like:

  * `error`
  * `failed`
  * `fatal`
  * `exception`
  * `traceback`
  * `panic`
  * `command not found`

Example:

```bash
asd
zsh: command not found: asd
```

→ Faah plays.

---

## 🧪 Task Failure Detection

When a VS Code task finishes with a non‑zero exit code, Faah triggers automatically.

---

## 🧠 Diagnostic Error Detection

If new errors appear in the Problems panel (TypeScript, ESLint, etc.), Faah plays.

---

## ⏳ Cooldown Protection

Prevents multiple sounds from triggering rapidly for the same failure.

Configurable via settings.

---

# ⚙️ Requirements

* VS Code **1.77+**
* Terminal Shell Integration enabled (enabled by default)

Check:

```
terminal.integrated.shellIntegration.enabled
```

---

# 📦 Installation Guide

## Option 1 — Install from VSIX (Recommended for Local Dev)

### 1️⃣ Package the Extension

```bash
npm install
npm run compile
npm install -g vsce
vsce package
```

This generates a `.vsix` file.

---

### 2️⃣ Install the Extension

```bash
code --install-extension your-extension-name.vsix
```

Restart VS Code.

---

## Option 2 — Development Mode

1. Open the extension folder in VS Code
2. Run:

```bash
npm install
npm run compile
```

1. Press **F5**
2. A new "Extension Development Host" window opens

Test inside that window.

---

# 🧪 How to Test

### Terminal Test

Open terminal and type:

```bash
notarealcommand
```

If it fails → Faah plays.

---

### Task Test

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

Run the task → Faah plays.

---

### Diagnostic Test

Create a TypeScript error:

```ts
const x: string = 123
```

Error appears → Faah plays.

---

# 🔧 Configuration

Search in Settings for **Faah**.

Available options:

* `faah.enabled`
* `faah.cooldown`
* `faah.onDiagnosticErrors`
* `faah.onTaskErrors`
* `faah.onTerminalErrors`

---

# 📁 Required Structure

```
extension-root/
 ├── src/
 ├── media/
 │    └── faah.mp3
 ├── package.json
 └── tsconfig.json
```

`faah.mp3` must exist inside the `media` folder.

---

# 🛑 Troubleshooting

### No Sound?

* Ensure `faah.mp3` exists
* Ensure VS Code ≥ 1.77
* Ensure Shell Integration is enabled
* Check Developer Tools console for errors

Open:

```
Help → Toggle Developer Tools
```

---

# 🧩 How It Works

Faah uses:

* `onDidEndTerminalShellExecution` for terminal commands
* `onDidEndTaskProcess` for tasks
* `onDidChangeDiagnostics` for code errors

If a command exits with non‑zero status or output contains failure keywords, the sound plays.

A cooldown prevents repeated triggers.

---

# 🚀 That’s It

Break something.
Hear it.
Fix it.
