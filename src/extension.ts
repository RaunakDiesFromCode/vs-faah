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

let lastErrorCount = 0;
let lastPlayTime = 0;
let isPlaying = false;
let config: ErrorSoundConfig;

const player = require("play-sound")({}) as {
    play: (soundPath: string, cb: (err?: unknown) => void) => void;
};

export function activate(context: vscode.ExtensionContext) {
    loadConfiguration();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("faah")) {
                loadConfiguration();
            }
        }),
    );

    // =========================
    // Diagnostic Errors
    // =========================
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics(() => {
            if (config.enabled && config.onDiagnosticErrors) {
                checkDiagnostics(context);
            }
        }),
    );

    // =========================
    // Task Failures
    // =========================
    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess((event) => {
            if (
                config.enabled &&
                config.onTaskErrors &&
                event.exitCode !== undefined &&
                event.exitCode !== 0
            ) {
                triggerSound(context, "task");
            }
        }),
    );

    // =========================
    // TERMINAL SHELL EXECUTION (REAL SOLUTION)
    // =========================
    context.subscriptions.push(
        vscode.window.onDidEndTerminalShellExecution(async (event) => {
            if (!config.enabled || !config.onTerminalErrors) return;

            const exitCode = event.exitCode;

            // 1️⃣ Trigger on non-zero exit
            if (exitCode !== 0) {
                triggerSound(context, "terminal-exit");
                return;
            }

            // 2️⃣ Also scan output text
            if (event.execution.read) {
                let fullOutput = "";

                for await (const chunk of event.execution.read()) {
                    fullOutput += chunk;
                }

                if (containsErrorText(fullOutput)) {
                    triggerSound(context, "terminal-output");
                }
            }
        }),
    );

    checkDiagnostics(context);
}

function loadConfiguration() {
    const settings = vscode.workspace.getConfiguration("faah");

    config = {
        enabled: settings.get<boolean>("enabled", true),
        volume: settings.get<number>("volume", 100),
        cooldown: settings.get<number>("cooldown", 1500),
        onDiagnosticErrors: settings.get<boolean>("onDiagnosticErrors", true),
        onTaskErrors: settings.get<boolean>("onTaskErrors", true),
        onTerminalErrors: settings.get<boolean>("onTerminalErrors", true),
    };
}

function checkDiagnostics(context: vscode.ExtensionContext) {
    const diagnostics = vscode.languages.getDiagnostics();
    let errorCount = 0;

    for (const [, diagnosticArray] of diagnostics) {
        for (const d of diagnosticArray) {
            if (d.severity === vscode.DiagnosticSeverity.Error) {
                errorCount++;
            }
        }
    }

    if (errorCount > 0 && errorCount !== lastErrorCount) {
        triggerSound(context, "diagnostic");
    }

    lastErrorCount = errorCount;
}

// =========================
// Error Keyword Detection
// =========================

const errorRegex =
    /\berror\b|\bfailed\b|\bfatal\b|\bexception\b|\btraceback\b|\bpanic\b|command not found/i;

function containsErrorText(text: string): boolean {
    return errorRegex.test(text);
}

// =========================
// Sound Logic
// =========================

function triggerSound(context: vscode.ExtensionContext, source: string) {
    const now = Date.now();

    if (now - lastPlayTime < config.cooldown) return;
    if (isPlaying) return;

    lastPlayTime = now;
    playFaah(context, source);
}

function playFaah(context: vscode.ExtensionContext, source: string) {
    isPlaying = true;

    const soundPath = path.join(context.extensionPath, "media", "faah.mp3");

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

export function deactivate() {}
