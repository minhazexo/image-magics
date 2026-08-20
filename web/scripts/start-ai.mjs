#!/usr/bin/env node
/**
 * Cross-platform launcher for the bg-remover Python service.
 *
 * 1. Checks if the service is already running (health endpoint).
 * 2. If not, tries `py`, `python3`, `python` in order.
 * 3. If the port is already taken by a stale process, logs a helpful message
 *    and exits cleanly so concurrently doesn't kill the web server.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICE_DIR = resolve(__dirname, "../../services/bg-remover");
const ENTRY = "app.py";

const SERVICE_URL = process.env.BG_REMOVER_URL ?? "http://127.0.0.1:8765";

const PYTHON_CANDIDATES =
  process.platform === "win32" ? ["py", "python3", "python"] : ["python3", "python", "py"];

// ── Health check ────────────────────────────────────────────────

async function checkHealth() {
  try {
    const res = await fetch(`${SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Python detection ────────────────────────────────────────────

async function findPython(candidates) {
  for (const cmd of candidates) {
    try {
      const ok = await new Promise((resolve) => {
        const child = spawn(cmd, ["--version"], {
          stdio: "ignore",
          shell: process.platform === "win32",
        });
        child.on("error", () => resolve(false));
        child.on("exit", (code) => resolve(code === 0));
        // Kill after 3s in case it hangs (e.g. MS Store stub)
        setTimeout(() => { try { child.kill(); } catch {} resolve(false); }, 3_000);
      });
      if (ok) return cmd;
    } catch {
      // continue
    }
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  // 1. Already running?
  if (await checkHealth()) {
    console.log(`[ai] bg-remover already running at ${SERVICE_URL} — reusing.`);
    // Stay alive as long as the parent process (concurrently) is alive,
    // so the [ai] prefix stays active in the terminal.
    await new Promise(() => {});
    return;
  }

  // 2. Find Python
  const python = await findPython(PYTHON_CANDIDATES);
  if (!python) {
    console.error(
      "\n⚠️  No working Python found. AI background removal will be unavailable.\n" +
        "   Install Python 3.10+: https://www.python.org/downloads/\n" +
        "   Then: cd services/bg-remover && pip install -r requirements.txt\n"
    );
    process.exit(1);
  }

  // 3. Start the service
  console.log(`[ai] Starting bg-remover service with ${python}...`);
  const child = spawn(python, [ENTRY], {
    cwd: SERVICE_DIR,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (err) => {
    console.error(`[ai] Failed to start:`, err.message);
    process.exit(1);
  });

  child.on("exit", async (code, signal) => {
    // Exit code 143 = SIGTERM (128 + 15), 130 = SIGINT (128 + 2)
    const isSignalExit = signal === "SIGINT" || signal === "SIGTERM" || code === 143 || code === 130;
    if (isSignalExit) {
      process.exit(0);
    }
    if (code !== 0) {
      // Check if port is taken by a stale instance
      const alive = await checkHealth();
      if (alive) {
        console.log(`[ai] Port already in use but service is healthy — reusing existing instance.`);
        await new Promise(() => {}); // stay alive
        return;
      }
      console.error(
        `\n⚠️  bg-remover exited with code ${code}.\n` +
          "   Make sure dependencies are installed:\n" +
          "   cd services/bg-remover && pip install -r requirements.txt\n"
      );
    }
    process.exit(code ?? 0);
  });

  // Forward parent signals to child
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => child.kill(sig));
  }
}

main();
