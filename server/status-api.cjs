// Status API server — collects system metrics, runs standalone
// Config via env: PORT (default 3001), CHECK_URLS (comma-separated URLs to health-check)
// Collects once, then serves from cache. Background refresh every 60s.

const http = require('http');
const os = require('os');
const { exec } = require('child_process');

const PORT = parseInt(process.env.PORT || '3001', 10);
const CHECK_URLS = (process.env.CHECK_URLS || '').split(',').filter(Boolean);

// ---------- data cache ----------
let cached = null;
let prevCpu = null;

function execPromise(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 5000 }, (err, stdout) => {
      resolve(err ? '' : stdout.trim());
    });
  });
}

// ---------- collectors ----------

function getCpu() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  const now = { totalTick, totalIdle, time: Date.now() };
  if (!prevCpu) { prevCpu = now; return 0; }
  const tickDiff = now.totalTick - prevCpu.totalTick;
  const idleDiff = now.totalIdle - prevCpu.totalIdle;
  prevCpu = now;
  if (tickDiff === 0) return 0;
  return Math.round((1 - idleDiff / tickDiff) * 100);
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const gb = (v) => (v / 1024 / 1024 / 1024).toFixed(1);
  return { used: parseFloat(gb(used)), total: parseFloat(gb(total)), unit: 'GB' };
}

function getUptime() {
  const s = os.uptime();
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

function getLoad() {
  return parseFloat(os.loadavg()[0].toFixed(2));
}

async function getDisk() {
  const out = await execPromise("df -h / | awk 'NR==2{print $3,$2}'");
  if (!out) return { used: 0, total: 0, unit: 'GB' };
  const [used, total] = out.split(' ');
  const parseVal = (v) => {
    if (!v) return 0;
    const num = parseFloat(v.replace(/[^0-9.]/g, ''));
    return v.includes('T') ? num * 1024 : num;
  };
  const unit = total && total.includes('T') ? 'TB' : 'GB';
  return { used: parseVal(used), total: parseVal(total), unit };
}

async function getNetwork() {
  const out = await execPromise("awk 'NR>2{print $1,$2,$10}' /proc/net/dev");
  if (!out) return { rx: '0', tx: '0' };
  let rxBytes = 0, txBytes = 0;
  for (const line of out.split('\n')) {
    const parts = line.trim().split(/\s+/);
    const iface = (parts[0] || '').replace(':', '');
    if (iface === 'lo') continue;
    rxBytes += parseInt(parts[1] || '0', 10);
    txBytes += parseInt(parts[2] || '0', 10);
  }
  const fmt = (b) => {
    if (b > 1e9) return (b / 1e9).toFixed(1) + 'G';
    if (b > 1e6) return (b / 1e6).toFixed(0) + 'M';
    if (b > 1e3) return (b / 1e3).toFixed(0) + 'K';
    return b.toString();
  };
  return { rx: fmt(rxBytes), tx: fmt(txBytes) };
}

async function getDocker() {
  const out = await execPromise('docker ps -a --format \'{"name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}"}\'');
  if (!out) return [];
  try {
    const lines = out.split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line)).map(c => {
      const uptimeMatch = c.status.match(/Up\s+(.+)/);
      return {
        name: c.name,
        image: c.image,
        running: c.state === 'running',
        uptime: uptimeMatch ? uptimeMatch[1] : (c.state === 'running' ? '...' : 'stopped'),
      };
    });
  } catch { return []; }
}

async function getApiServices() {
  if (!CHECK_URLS.length) return [];
  const results = await Promise.all(CHECK_URLS.map(async (url) => {
    const name = new URL(url).hostname;
    const start = Date.now();
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, { timeout: 5000, family: 4 }, (res) => {
          res.resume();
          res.statusCode < 500 ? resolve() : reject(new Error(`status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      return { name, url, ok: true, latency: Date.now() - start };
    } catch {
      return { name, url, ok: false, latency: Date.now() - start };
    }
  }));
  return results;
}

// ---------- collect all ----------

async function collect() {
  const [disk, network, docker, apiServices] = await Promise.all([
    getDisk(),
    getNetwork(),
    getDocker(),
    getApiServices(),
  ]);
  return {
    cpu: getCpu(),
    memory: getMemory(),
    uptime: getUptime(),
    load: getLoad(),
    disk,
    network,
    docker,
    api_services: apiServices,
  };
}

// ---------- initial collection then background refresh ----------

async function refresh() {
  try {
    cached = await collect();
  } catch (e) {
    console.error('Refresh failed:', e.message);
  }
}

// ---------- HTTP server ----------

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/status' || req.url === '/api/status/') {
    if (!cached) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'initializing' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(cached, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Start: collect once, then listen, then refresh periodically
refresh().then(() => {
  server.listen(PORT, () => {
    console.log(`Status API listening on http://localhost:${PORT}/api/status`);
  });
  // Background refresh every minute
  setInterval(refresh, 60000);
});
