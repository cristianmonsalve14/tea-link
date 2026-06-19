/**
 * Libera el puerto del backend antes de arrancar (Windows/Linux/macOS).
 */
const path = require('path');
const { execSync } = require('child_process');

const port = Number(process.env.PORT || 3000);

const POWERSHELL =
  process.platform === 'win32'
    ? path.join(
        process.env.SystemRoot || 'C:\\Windows',
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe'
      )
    : 'powershell';

const NETSTAT =
  process.platform === 'win32'
    ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'NETSTAT.EXE')
    : 'netstat';

async function main() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await killListeners(port);
    await sleep(1000);
    const busy = portInUse(port);
    if (!busy) {
      console.log(`[free-port] Puerto ${port} liberado`);
      return;
    }
    console.warn(`[free-port] Intento ${attempt}/3: puerto ${port} aún en uso`);
  }

  console.error(`[free-port] No se pudo liberar el puerto ${port}.`);
  console.error('  Cierre otras terminales con "npm run dev" del backend o ejecute:');
  console.error('  npm run dev:kill-port');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function killListeners(targetPort) {
  try {
    const killPort = require('kill-port');
    await killPort(targetPort, 'tcp');
  } catch (err) {
    const msg = String(err?.message || err);
    if (!/not found|no process/i.test(msg)) {
      console.warn(`[free-port] kill-port: ${msg}`);
    }
  }

  if (process.platform === 'win32') {
    fallbackWindows(targetPort);
  }
}

function portInUse(targetPort) {
  if (process.platform === 'win32') {
    try {
      const out = execSync(`"${NETSTAT}" -ano | findstr :${targetPort}`, {
        encoding: 'utf8',
        shell: true,
        stdio: ['pipe', 'pipe', 'ignore']
      });
      return /LISTENING/i.test(out);
    } catch {
      return false;
    }
  }

  try {
    execSync(`lsof -i :${targetPort} -sTCP:LISTEN`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function fallbackWindows(targetPort) {
  const myPid = process.pid;

  try {
    const out = execSync(`"${NETSTAT}" -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      shell: true,
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!/LISTENING/i.test(line)) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid) && Number(pid) !== myPid) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore', shell: true });
        console.log(`[free-port] Cerrado PID ${pid}`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  try {
    execSync(
      `"${POWERSHELL}" -NoProfile -Command "Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore', shell: true }
    );
  } catch {
    /* ignore */
  }
}

main().catch(e => {
  console.error('[free-port] Error:', e.message || e);
  process.exit(1);
});
