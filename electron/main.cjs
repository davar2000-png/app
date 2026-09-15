const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const PORT = 32145;
let serverProcess;
function ensureDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'technokala.db');
  if (!fs.existsSync(dbPath)) {
    const source = app.isPackaged ? path.join(process.resourcesPath, 'prisma', 'dev.db') : path.join(app.getAppPath(), 'prisma', 'dev.db');
    if (!fs.existsSync(source)) throw new Error('فایل اولیه دیتابیس پیدا نشد.');
    fs.copyFileSync(source, dbPath);
  }
  return `file:${dbPath.replace(/\\/g, '/')}`;
}
function startServer(databaseUrl) {
  const root = app.getAppPath();
  const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  serverProcess = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(PORT)], {
    cwd: root, windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', DATABASE_URL: databaseUrl },
    stdio: 'pipe'
  });
  serverProcess.stderr.on('data', data => console.error(String(data)));
}
function waitForServer(timeout = 45000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(`http://127.0.0.1:${PORT}/login`, res => { res.resume(); resolve(); });
      req.on('error', () => Date.now() - started > timeout ? reject(new Error('زمان راه‌اندازی بیش از حد طول کشید.')) : setTimeout(probe, 350));
      req.setTimeout(1500, () => req.destroy());
    };
    probe();
  });
}
async function createWindow() {
  startServer(ensureDatabase());
  await waitForServer();
  const win = new BrowserWindow({ width: 1400, height: 900, minWidth: 1000, minHeight: 650, show: false, autoHideMenuBar: true, title: 'حسابداری تکنوکالا', webPreferences: { contextIsolation: true, nodeIntegration: false } });
  await win.loadURL(`http://127.0.0.1:${PORT}`);
  win.once('ready-to-show', () => win.show());
}
app.whenReady().then(createWindow).catch(error => { dialog.showErrorBox('خطای راه‌اندازی', error.message || String(error)); app.quit(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (serverProcess && !serverProcess.killed) serverProcess.kill(); });
