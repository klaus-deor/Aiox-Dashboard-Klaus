const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");

const PORT = 3456;
const appDir = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(appDir, "..", "..");

// Start Next.js dev server
const nextProc = spawn("npx", ["next", "dev", "--turbopack", "--port", String(PORT)], {
  cwd: appDir,
  stdio: "inherit",
  env: { ...process.env, AIOX_WORKSPACE_ROOT: workspaceRoot },
});

// Wait for server then launch Electron
function waitAndLaunch() {
  const socket = net.createConnection({ port: PORT, host: "127.0.0.1" });
  socket.on("connect", () => {
    socket.destroy();
    console.log(`[electron] Next.js ready on port ${PORT}, launching Electron...`);
    const electronProc = spawn("npx", ["electron", "."], {
      cwd: appDir,
      stdio: "inherit",
      env: {
        ...process.env,
        ELECTRON_DEV_PORT: String(PORT),
        AIOX_WORKSPACE_ROOT: workspaceRoot,
      },
    });
    electronProc.on("close", () => {
      nextProc.kill("SIGTERM");
      process.exit(0);
    });
  });
  socket.on("error", () => {
    setTimeout(waitAndLaunch, 500);
  });
}

waitAndLaunch();

process.on("SIGINT", () => {
  nextProc.kill("SIGTERM");
  process.exit(0);
});
