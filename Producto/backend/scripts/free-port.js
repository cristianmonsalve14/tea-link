/**
 * Libera el puerto 3000 antes de arrancar el backend.
 */
const path = require('path');

const port = Number(process.env.PORT || 3000);

async function main() {
  try {
    const killPort = require('kill-port');
    await killPort(port, 'tcp');
    console.log(`[free-port] Puerto ${port} liberado`);
  } catch (err) {
    const msg = String(err?.message || err);
    if (/not found|no process/i.test(msg)) {
      console.log(`[free-port] Puerto ${port} ya estaba libre`);
      return;
    }
    console.warn(`[free-port] kill-port: ${msg}`);
    await fallbackWindows(port);
  }

  await sleep(1500);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fallbackWindows(port) {
  if (process.platform !== 'win32') return;

  const { execSync } = require('child_process');
  const myPid = process.pid;
  const netstat = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'NETSTAT.EXE');

  try {
    const out = execSync(`"${netstat}" -ano | findstr :${port}`, {
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
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', shell: true });
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
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
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
