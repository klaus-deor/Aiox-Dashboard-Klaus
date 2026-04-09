import { app, BrowserWindow, dialog, shell } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import net from "node:net";

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let nextProcess: ChildProcess | null = null;
let serverPort = parseInt(process.env.ELECTRON_DEV_PORT || "3456", 10);

const isDev = !app.isPackaged;
const externalDevServer = !!process.env.ELECTRON_DEV_PORT;

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");

/** Load last used workspace path from config */
function loadLastWorkspace(): string | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      if (config.workspaceRoot && fs.existsSync(config.workspaceRoot)) {
        return config.workspaceRoot;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/** Save workspace path for next launch */
function saveWorkspacePath(workspaceRoot: string): void {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ workspaceRoot }, null, 2));
  } catch { /* ignore */ }
}

/** Check if a folder is a valid AIOX workspace */
function isValidWorkspace(folderPath: string): boolean {
  return fs.existsSync(path.join(folderPath, ".aiox-core")) ||
         fs.existsSync(path.join(folderPath, ".aios-core"));
}

/** Find an available port */
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/** Wait for the Next.js server to be ready */
function waitForServer(port: number, timeout = 60000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = net.createConnection({ port, host: "127.0.0.1" });
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("Server failed to start within timeout"));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

/** Show splash screen while loading */
function showSplash(): void {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
    <html>
    <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
      background:rgba(9,9,11,0.95);border-radius:16px;font-family:system-ui,sans-serif;
      color:#fafafa;flex-direction:column;gap:16px;-webkit-app-region:drag;
      border:1px solid rgba(255,255,255,0.1);">
      <div style="font-size:48px;">⚡</div>
      <div style="font-size:20px;font-weight:600;">AIOX Dashboard</div>
      <div style="font-size:13px;color:#a1a1aa;">Iniciando servidor...</div>
      <div style="width:120px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
        <div style="width:40%;height:100%;background:#a78bfa;border-radius:2px;
          animation:loading 1.2s ease-in-out infinite alternate;"></div>
      </div>
      <style>@keyframes loading{from{transform:translateX(-60px)}to{transform:translateX(100px)}}</style>
    </body>
    </html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

/** Start the Next.js server */
async function startNextServer(workspaceRoot: string): Promise<void> {
  if (externalDevServer) {
    await waitForServer(serverPort);
    return;
  }

  serverPort = await findAvailablePort(3456);

  const appDir = isDev
    ? path.resolve(__dirname, "..")
    : path.resolve(__dirname, "..", "app");

  const env = {
    ...process.env,
    PORT: String(serverPort),
    AIOX_WORKSPACE_ROOT: workspaceRoot,
    NODE_ENV: isDev ? "development" as const : "production" as const,
  };

  if (isDev) {
    nextProcess = spawn("npx", ["next", "dev", "--port", String(serverPort)], {
      cwd: appDir,
      env,
      shell: true,
      stdio: "pipe",
    });
  } else {
    const serverPath = path.join(appDir, ".next", "standalone", "server.js");
    nextProcess = spawn("node", [serverPath], {
      cwd: path.join(appDir, ".next", "standalone"),
      env,
      stdio: "pipe",
    });
  }

  nextProcess.stdout?.on("data", (data) => {
    console.log(`[next] ${data.toString().trim()}`);
  });

  nextProcess.stderr?.on("data", (data) => {
    console.error(`[next] ${data.toString().trim()}`);
  });

  nextProcess.on("error", (err) => {
    console.error("Failed to start Next.js:", err);
  });

  await waitForServer(serverPort);
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "AIOX Dashboard",
    backgroundColor: "#09090b",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow?.show();
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/** Always ask user to select workspace, suggesting last used */
async function selectWorkspace(): Promise<string | null> {
  const lastUsed = loadLastWorkspace();

  const result = await dialog.showOpenDialog({
    title: "Selecione o workspace AIOX",
    message: "Escolha a pasta raiz do projeto AIOX (que contém .aiox-core)",
    defaultPath: lastUsed || app.getPath("home"),
    properties: ["openDirectory"],
    buttonLabel: "Abrir Workspace",
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const selected = result.filePaths[0];

  if (!isValidWorkspace(selected)) {
    const retry = await dialog.showMessageBox({
      type: "warning",
      title: "Workspace invalido",
      message: `A pasta selecionada nao contem .aiox-core:\n\n${selected}\n\nSelecione a pasta raiz do seu workspace AIOX.`,
      buttons: ["Tentar novamente", "Sair"],
    });
    if (retry.response === 0) return selectWorkspace();
    return null;
  }

  return selected;
}

app.whenReady().then(async () => {
  let workspaceRoot: string | null;

  if (isDev && !externalDevServer) {
    // Dev mode without external server: auto-detect from project structure
    const devRoot = path.resolve(__dirname, "..", "..", "..");
    if (isValidWorkspace(devRoot)) {
      workspaceRoot = devRoot;
    } else {
      workspaceRoot = await selectWorkspace();
    }
  } else if (externalDevServer) {
    // Dev mode with concurrently: workspace is passed via env
    workspaceRoot = process.env.AIOX_WORKSPACE_ROOT || null;
  } else {
    // Production: always ask user to choose
    workspaceRoot = await selectWorkspace();
  }

  if (!workspaceRoot) {
    app.quit();
    return;
  }

  // Show splash while server starts
  showSplash();

  saveWorkspacePath(workspaceRoot);
  await startNextServer(workspaceRoot);
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGTERM");
  }
});
