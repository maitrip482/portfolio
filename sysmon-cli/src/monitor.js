const os = require('os');
const fs = require('fs');

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) totalTick += cpu.times[type];
    totalIdle += cpu.times.idle;
  });
  return {
    cores: cpus.length,
    model: cpus[0].model.trim(),
    usagePercent: Math.round((1 - totalIdle / totalTick) * 100)
  };
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalGB: (total / 1e9).toFixed(2),
    usedGB: (used / 1e9).toFixed(2),
    freeGB: (free / 1e9).toFixed(2),
    usagePercent: Math.round((used / total) * 100)
  };
}

function getDiskUsage() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('df -h / | tail -1', { encoding: 'utf8' });
    const parts = output.trim().split(/\s+/);
    return {
      total: parts[1],
      used: parts[2],
      available: parts[3],
      usagePercent: parseInt(parts[4])
    };
  } catch {
    return { total: 'N/A', used: 'N/A', available: 'N/A', usagePercent: 0 };
  }
}

function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: Math.floor(os.uptime() / 3600) + 'h ' + Math.floor((os.uptime() % 3600) / 60) + 'm'
  };
}

function getAll() {
  return {
    timestamp: new Date().toISOString(),
    system: getSystemInfo(),
    cpu: getCpuUsage(),
    memory: getMemoryUsage(),
    disk: getDiskUsage()
  };
}

module.exports = { getCpuUsage, getMemoryUsage, getDiskUsage, getSystemInfo, getAll };
