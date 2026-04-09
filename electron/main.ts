import { app, BrowserWindow, dialog, shell } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import net from "node:net";

let mainWindow: BrowserWindow | null = null;
let nextProcess: ChildProcess | null = null;
let serverPort = parseInt(process.env.ELECTRON_DEV_PORT || "3456", 10);

const isDev = !app.isPackaged;
// When launched via concurrently, the Next.js server is already running externally
const externalDevServer = !!process.env.ELECTRON_DEV_PORT;

/** Find the AIOX workspace root by looking for .aiox-core in ancestors */
function findWorkspaceRoot(): string | null {
  // In dev mode, the app sits at apps/aiox-dashboard inside the workspace
  const devRoot = path.resolve(__dirname, "..", "..", "..");
  if (fs.existsSync(path.join(devRoot, ".aiox-core"))) {
    return devRoot;
  }

  // Check common locations
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), "..", ".."),
    path.resolve(app.getPath("home"), "Documentos", "Saas", "AIOX Pro"),
    path.resolve(app.getPath("home"), "Documents", "Saas", "AIOX Pro"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, ".aiox-core"))) {
      return candidate;
    }
  }

  // Walk up from executable location
  let current = path.dirname(app.getPath("exe"));
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(current, ".aiox-core"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

/** Find an available port starting from the preferred one */
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
function waitForServer(port: number, timeout = 30000): Promise<void> {
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
          reject(new Error("Next.js server failed to start within timeout"));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

/** Start the Next.js server (skipped if external dev server is running) */
async function startNextServer(workspaceRoot: string): Promise<void> {
  if (externalDevServer) {
    // Dev mode with concurrently — server already running, just wait for it
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
    // In production, use the standalone server
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
    mainWindow?.show();
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const workspaceRoot = findWorkspaceRoot();

  if (!workspaceRoot) {
    const result = await dialog.showOpenDialog({
      title: "Selecione a pasta do workspace AIOX Pro",
      message: "Não foi possível encontrar o workspace AIOX automaticamente. Selecione a pasta raiz do projeto.",
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      app.quit();
      return;
    }

    const selected = result.filePaths[0];
    if (!fs.existsSync(path.join(selected, ".aiox-core"))) {
      dialog.showErrorBox(
        "Workspace inválido",
        "A pasta selecionada não contém .aiox-core. Selecione a raiz do workspace AIOX Pro."
      );
      app.quit();
      return;
    }

    await startNextServer(selected);
  } else {
    await startNextServer(workspaceRoot);
  }

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
