const http = require('http');
const { getAll } = require('./monitor');
const { checkAll } = require('./healthcheck');

function startDashboard(config) {
  const port = config.dashboard?.port || 3847;

  const server = http.createServer((req, res) => {
    if (req.url === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(getAll()));
    } else if (req.url === '/api/health') {
      checkAll(config.endpoints || []).then(results => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(results));
      });
    } else if (req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      const send = () => res.write(`data: ${JSON.stringify(getAll())}\n\n`);
      send();
      const id = setInterval(send, (config.interval || 5) * 1000);
      req.on('close', () => clearInterval(id));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getHTML());
    }
  });

  server.listen(port, () => {
    const chalk = require('chalk');
    console.log(chalk.cyan.bold(`\n  ⚡ SysMon Dashboard running at http://localhost:${port}\n`));
    console.log(chalk.gray('  Press Ctrl+C to stop\n'));
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SysMon Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:2rem}
h1{text-align:center;font-size:1.8rem;margin-bottom:2rem;color:#38bdf8}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto}
.card{background:#1e293b;border-radius:12px;padding:1.5rem;border:1px solid #334155}
.card h3{color:#94a3b8;font-size:.85rem;text-transform:uppercase;margin-bottom:.5rem}
.card .value{font-size:2rem;font-weight:700;color:#f1f5f9}
.card .bar{height:8px;background:#334155;border-radius:4px;margin-top:.75rem;overflow:hidden}
.card .bar-fill{height:100%;border-radius:4px;transition:width .5s}
.ok{background:#22c55e}.warn{background:#eab308}.crit{background:#ef4444}
.meta{text-align:center;color:#64748b;margin-top:2rem;font-size:.8rem}
.health{margin-top:.5rem}.health span{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.8rem;margin:2px}
.health .up{background:#166534;color:#86efac}.health .down{background:#7f1d1d;color:#fca5a5}
</style></head><body>
<h1>⚡ SysMon Live Dashboard</h1>
<div class="grid">
  <div class="card"><h3>CPU Usage</h3><div class="value" id="cpu">--</div><div class="bar"><div class="bar-fill" id="cpu-bar"></div></div></div>
  <div class="card"><h3>Memory Usage</h3><div class="value" id="mem">--</div><div class="bar"><div class="bar-fill" id="mem-bar"></div></div></div>
  <div class="card"><h3>Disk Usage</h3><div class="value" id="disk">--</div><div class="bar"><div class="bar-fill" id="disk-bar"></div></div></div>
  <div class="card"><h3>System Info</h3><div id="sys" style="font-size:.9rem;line-height:1.8"></div></div>
  <div class="card" style="grid-column:span 2"><h3>Health Checks</h3><div class="health" id="health">Loading...</div></div>
</div>
<div class="meta">Auto-refreshing via Server-Sent Events • <span id="ts">--</span></div>
<script>
function barClass(v){return v>90?'crit':v>70?'warn':'ok'}
function update(d){
  document.getElementById('cpu').textContent=d.cpu.usagePercent+'%';
  document.getElementById('cpu-bar').style.width=d.cpu.usagePercent+'%';
  document.getElementById('cpu-bar').className='bar-fill '+barClass(d.cpu.usagePercent);
  document.getElementById('mem').textContent=d.memory.usagePercent+'%';
  document.getElementById('mem-bar').style.width=d.memory.usagePercent+'%';
  document.getElementById('mem-bar').className='bar-fill '+barClass(d.memory.usagePercent);
  document.getElementById('disk').textContent=d.disk.usagePercent+'%';
  document.getElementById('disk-bar').style.width=d.disk.usagePercent+'%';
  document.getElementById('disk-bar').className='bar-fill '+barClass(d.disk.usagePercent);
  document.getElementById('sys').innerHTML=\`\${d.system.hostname}<br>\${d.system.platform}/\${d.system.arch}<br>Uptime: \${d.system.uptime}<br>Cores: \${d.cpu.cores}\`;
  document.getElementById('ts').textContent=new Date(d.timestamp).toLocaleTimeString();
}
const es=new EventSource('/events');
es.onmessage=e=>update(JSON.parse(e.data));
fetch('/api/health').then(r=>r.json()).then(results=>{
  document.getElementById('health').innerHTML=results.map(r=>\`<span class="\${r.healthy?'up':'down'}">\${r.healthy?'✓':'✗'} \${r.url} (\${r.responseTime}ms)</span>\`).join('');
});
</script></body></html>`;
}

module.exports = { startDashboard };
