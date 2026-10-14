import { spawn } from 'node:child_process';
import os from 'node:os';
import net from 'node:net';

const PORT = 5175;
const HOST = '0.0.0.0';

/**
 * Discovers active non-loopback IPv4 network addresses on the host machine.
 * Sorts addresses so that standard private LAN ranges (192.168.x, 10.x, 172.16-31.x)
 * and active Wi-Fi / Ethernet adapters are prioritized.
 */
export function getLanIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, netInterface] of Object.entries(interfaces)) {
    if (!netInterface) continue;
    for (const iface of netInterface) {
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal && iface.address && iface.address !== '127.0.0.1' && iface.address !== '0.0.0.0') {
        addresses.push({
          name,
          address: iface.address,
        });
      }
    }
  }

  addresses.sort((a, b) => {
    const isPrivateA = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address);
    const isPrivateB = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(b.address);
    if (isPrivateA && !isPrivateB) return -1;
    if (!isPrivateA && isPrivateB) return 1;

    const isCommonA = /wi-?fi|ethernet|wlan|lan/i.test(a.name);
    const isCommonB = /wi-?fi|ethernet|wlan|lan/i.test(b.name);
    if (isCommonA && !isCommonB) return -1;
    if (!isCommonA && isCommonB) return 1;

    return 0;
  });

  return addresses;
}

/**
 * Checks if a port has a listener active via TCP connect.
 */
function checkPortInUse(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Checks whether the listener on port 5175 is the authentic CampusHub development server.
 */
async function checkCampusHubHealth(url, timeoutMs = 1500) {
  try {
    const res = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    return body?.success === true && body?.message === 'CampusHub API is running.';
  } catch {
    return false;
  }
}

/**
 * Formats and prints the clean CampusHub terminal banner.
 */
function printBanner({ isAlreadyRunning = false, lanList = [] }) {
  console.log('\n========================================');
  console.log('        CampusHub Development Server    ');
  console.log('========================================\n');

  if (isAlreadyRunning) {
    console.log('  CampusHub is already running.\n');
  }

  console.log(`  Local:    http://localhost:${PORT}/`);

  if (lanList.length > 0) {
    console.log(`  Network:  http://${lanList[0].address}:${PORT}/`);
    for (let i = 1; i < lanList.length; i++) {
      console.log(`            http://${lanList[i].address}:${PORT}/`);
    }
  } else {
    console.log('  Network:  (No active LAN interface detected)');
  }

  console.log(`\n  Host:     ${HOST}`);
  console.log(`  Port:     ${PORT}\n`);
  console.log('========================================\n');
}

async function main() {
  const lanList = getLanIpAddresses();
  const primaryLan = lanList[0]?.address;

  const portInUse = await checkPortInUse(PORT, '127.0.0.1');

  if (portInUse) {
    const isCampusHub = await checkCampusHubHealth(`http://127.0.0.1:${PORT}`);
    if (isCampusHub) {
      printBanner({ isAlreadyRunning: true, lanList });

      // Verify whether the running instance responds over LAN
      if (primaryLan) {
        const lanHealthy = await checkCampusHubHealth(`http://${primaryLan}:${PORT}`, 1200);
        if (!lanHealthy) {
          console.warn('⚠️  Notice: The existing server responded on localhost, but could not be reached via Network IP.');
          console.warn('   If it was started with a localhost-only binding, stop that process and re-run "npm run dev".\n');
        }
      }
      return;
    }

    // Port is occupied by a foreign application
    console.error('\n========================================');
    console.error('        CampusHub Startup Error         ');
    console.error('========================================\n');
    console.error(`  Port ${PORT} is already in use by another application.`);
    console.error(`  Please stop the conflicting process or free port ${PORT}, then run "npm run dev" again.\n`);
    console.error('========================================\n');
    process.exitCode = 1;
    return;
  }

  // Display clean startup banner before launching Vite
  printBanner({ isAlreadyRunning: false, lanList });

  // Start Vite dev server on 0.0.0.0
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : npmCommand;
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', `${npmCommand} --prefix frontend run dev`]
    : ['--prefix', 'frontend', 'run', 'dev'];

  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  // Relay termination signals to child process
  const cleanExit = (signal) => {
    if (child && !child.killed) {
      if (process.platform === 'win32' && child.pid) {
        try {
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
        } catch {
          child.kill(signal || 'SIGINT');
        }
      } else {
        child.kill(signal || 'SIGINT');
      }
    }
  };

  process.on('SIGINT', () => cleanExit('SIGINT'));
  process.on('SIGTERM', () => cleanExit('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exitCode = code ?? 0;
    }
  });
}

main().catch((error) => {
  console.error('Unable to start CampusHub:', error.message);
  process.exitCode = 1;
});
