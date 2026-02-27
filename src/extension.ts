import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface ErrorSoundConfig {
    enabled: boolean;
    volume: number;
    cooldown: number;
    onDiagnosticErrors: boolean;
    onTaskErrors: boolean;
    onTerminalErrors: boolean;
}

let config: ErrorSoundConfig;
let lastErrorCount = 0;
let lastPlayTime = 0;
let isPlaying = false;
let faahViewProvider: FaahViewProvider;

const player = require("play-sound")({}) as {
    play: (soundPath: string, cb: (err?: unknown) => void) => void;
};

/* =========================
   ACTIVATE
========================= */

export async function activate(context: vscode.ExtensionContext) {
    loadConfiguration();

    await maybePromptShellIntegration(context);

    faahViewProvider = new FaahViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("faahView", faahViewProvider),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("faah")) {
                loadConfiguration();
            }
        }),
    );

    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics(() => {
            if (config.enabled && config.onDiagnosticErrors) {
                checkDiagnostics();
            }
        }),
    );

    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess((event) => {
            if (
                config.enabled &&
                config.onTaskErrors &&
                event.exitCode !== undefined &&
                event.exitCode !== 0
            ) {
                triggerError("task");
            }
        }),
    );

    context.subscriptions.push(
        vscode.window.onDidEndTerminalShellExecution(async (event) => {
            if (!config.enabled || !config.onTerminalErrors) return;

            if (event.exitCode !== 0) {
                triggerError("terminal-exit");
                return;
            }

            if (!event.execution.read) return;

            let output = "";
            for await (const chunk of event.execution.read()) {
                output += chunk;
            }

            if (containsErrorText(output)) {
                triggerError("terminal-output");
            }
        }),
    );

    checkDiagnostics();
}

/* =========================
   SHELL PROMPT
========================= */

async function maybePromptShellIntegration(context: vscode.ExtensionContext) {
    const terminalConfig = vscode.workspace.getConfiguration(
        "terminal.integrated",
    );
    const isEnabled = terminalConfig.get<boolean>(
        "shellIntegration.enabled",
        false,
    );

    if (isEnabled) return;

    const PROMPT_INTERVAL = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const lastPrompt = context.globalState.get<number>(
        "faah.lastShellPrompt",
        0,
    );

    if (now - lastPrompt < PROMPT_INTERVAL) return;

    const choice = await vscode.window.showWarningMessage(
        "Faah requires Terminal Shell Integration for accurate terminal error detection.",
        "Enable",
        "Later",
    );

    await context.globalState.update("faah.lastShellPrompt", now);

    if (choice === "Enable") {
        await terminalConfig.update(
            "shellIntegration.enabled",
            true,
            vscode.ConfigurationTarget.Global,
        );
    }
}

/* =========================
   CONFIG
========================= */

function loadConfiguration() {
    const settings = vscode.workspace.getConfiguration("faah");

    config = {
        enabled: settings.get("enabled", true),
        volume: settings.get("volume", 100),
        cooldown: settings.get("cooldown", 1500),
        onDiagnosticErrors: settings.get("onDiagnosticErrors", true),
        onTaskErrors: settings.get("onTaskErrors", true),
        onTerminalErrors: settings.get("onTerminalErrors", true),
    };
}

/* =========================
   DIAGNOSTICS
========================= */

function checkDiagnostics() {
    let errorCount = 0;

    for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
        for (const d of diagnostics) {
            if (d.severity === vscode.DiagnosticSeverity.Error) {
                errorCount++;
            }
        }
    }

    if (errorCount > 0 && errorCount !== lastErrorCount) {
        triggerError("diagnostic");
    }

    lastErrorCount = errorCount;
}

/* =========================
   ERROR TEXT MATCH
========================= */

const errorRegex =
    /\b(error|failed|fatal|exception|traceback|panic|segmentation fault|permission denied|command not found)\b/i;

function containsErrorText(text: string): boolean {
    return errorRegex.test(text);
}

/* =========================
   TRIGGER
========================= */

function triggerError(source: string) {
    const now = Date.now();

    if (now - lastPlayTime < config.cooldown) return;
    if (isPlaying) return;

    lastPlayTime = now;

    playFaah(source);

    if (faahViewProvider) {
        faahViewProvider.setErrorState(true);

        setTimeout(() => {
            faahViewProvider.setErrorState(false);
        }, 2000);
    }
}

/* =========================
   SOUND
========================= */

function playFaah(source: string) {
    isPlaying = true;

    const soundPath = path.join(
        faahViewProvider.context.extensionPath,
        "media",
        "faah.mp3",
    );

    if (!fs.existsSync(soundPath)) {
        vscode.window.showWarningMessage(
            "Faah sound file not found in media folder.",
        );
        isPlaying = false;
        return;
    }

    player.play(soundPath, (err?: unknown) => {
        if (err) {
            console.error("Sound error:", err);
        } else {
            console.log(`Faah triggered by ${source}`);
        }
        isPlaying = false;
    });
}

/* =========================
   SIDEBAR VIEW
========================= */

class FaahViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "faahView";
    public readonly context: vscode.ExtensionContext;
    private _view?: vscode.WebviewView;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: false,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, "media")),
            ],
        };

        this.setErrorState(false);
    }

    public setErrorState(hasError: boolean) {
        if (!this._view) return;

        if (!hasError) {
            this._view.webview.html = `
                <!DOCTYPE html>
                <html>
                <body style="
                    margin:0;
                    padding:15px;
                    background: var(--vscode-sideBar-background);
                    color: var(--vscode-editor-foreground);
                    font-family: sans-serif;
                    text-align:center;
                ">
                    <h3 style="margin:0;">✅ No errors detected</h3>
                    <p style="opacity:0.7;">Everything looks clean.</p>
                </body>
                </html>
            `;
            return;
        }

        const imagePath = vscode.Uri.file(
            path.join(this.context.extensionPath, "media", "faah.jpeg"),
        );

        const imageUri = this._view.webview.asWebviewUri(imagePath);

        this._view.webview.html = `
            <!DOCTYPE html>
            <html>
            <body style="
                margin:0;
                padding:10px;
                background: var(--vscode-sideBar-background);
                text-align:center;
            ">
                <img src="${imageUri}" style="max-width:100%;" />
            </body>
            </html>
        `;
    }
}

export function deactivate() {}
