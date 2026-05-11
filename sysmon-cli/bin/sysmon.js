#!/usr/bin/env node
const chalk = require('chalk');
const Table = require('cli-table3');
const { getAll } = require('../src/monitor');
const { checkAll } = require('../src/healthcheck');
const { parseLogs } = require('../src/logparser');
const { loadConfig } = require('../src/config');
const { startDashboard } = require('../src/dashboard');

const args = process.argv.slice(2);
const config = loadConfig();

function checkAlerts(data) {
  const alerts = [];
  const { cpu_threshold, memory_threshold, disk_threshold } = config.alerts;
  if (data.cpu.usagePercent > cpu_threshold) alerts.push(`CPU at ${data.cpu.usagePercent}% (threshold: ${cpu_threshold}%)`);
  if (data.memory.usagePercent > memory_threshold) alerts.push(`Memory at ${data.memory.usagePercent}% (threshold: ${memory_threshold}%)`);
  if (data.disk.usagePercent > disk_threshold) alerts.push(`Disk at ${data.disk.usagePercent}% (threshold: ${disk_threshold}%)`);
  return alerts;
}

function printStatus(data) {
  console.clear();
  console.log(chalk.cyan.bold('\n  ⚡ SysMon CLI — System Monitor\n'));
  console.log(chalk.gray(`  ${data.system.hostname} | ${data.system.platform}/${data.system.arch} | Uptime: ${data.system.uptime}`));
  console.log(chalk.gray(`  ${data.timestamp}\n`));

  const table = new Table({ head: ['Metric', 'Value', 'Status'].map(h => chalk.white.bold(h)) });
  const cpuStatus = data.cpu.usagePercent > config.alerts.cpu_threshold ? chalk.red('⚠ HIGH') : chalk.green('✓ OK');
  const memStatus = data.memory.usagePercent > config.alerts.memory_threshold ? chalk.red('⚠ HIGH') : chalk.green('✓ OK');
  const diskStatus = data.disk.usagePercent > config.alerts.disk_threshold ? chalk.red('⚠ HIGH') : chalk.green('✓ OK');

  table.push(
    ['CPU', `${data.cpu.usagePercent}% (${data.cpu.cores} cores)`, cpuStatus],
    ['Memory', `${data.memory.usedGB}/${data.memory.totalGB} GB (${data.memory.usagePercent}%)`, memStatus],
    ['Disk', `${data.disk.used}/${data.disk.total} (${data.disk.usagePercent}%)`, diskStatus]
  );
  console.log(table.toString());

  const alerts = checkAlerts(data);
  if (alerts.length) {
    console.log(chalk.red.bold('\n  🚨 ALERTS:'));
    alerts.forEach(a => console.log(chalk.red(`    • ${a}`)));
  }
}

async function printHealthChecks() {
  if (!config.endpoints || !config.endpoints.length) return;
  const results = await checkAll(config.endpoints);
  console.log(chalk.cyan.bold('\n  🏥 Health Checks:\n'));
  results.forEach(r => {
    const icon = r.healthy ? chalk.green('✓') : chalk.red('✗');
    console.log(`    ${icon} ${r.url} — ${r.status || 'DOWN'} (${r.responseTime}ms)`);
  });
}

function printLogErrors() {
  if (!config.logs || !config.logs.files || !config.logs.files.length) return;
  const results = parseLogs(config.logs.files, config.logs.patterns);
  console.log(chalk.cyan.bold('\n  📋 Log Errors:\n'));
  results.forEach(r => {
    if (r.error) return console.log(chalk.gray(`    ${r.file}: ${r.error}`));
    const color = r.errorCount > 0 ? chalk.yellow : chalk.green;
    console.log(color(`    ${r.file}: ${r.errorCount} errors found`));
  });
}

async function run() {
  if (args.includes('--dashboard') || args.includes('-d')) {
    startDashboard(config);
    return;
  }

  if (args.includes('--once') || args.includes('-o')) {
    const data = getAll();
    printStatus(data);
    await printHealthChecks();
    printLogErrors();
    return;
  }

  // Continuous monitoring
  console.log(chalk.cyan(`Starting monitor (interval: ${config.interval}s)... Press Ctrl+C to stop\n`));
  const tick = async () => {
    const data = getAll();
    printStatus(data);
    await printHealthChecks();
    printLogErrors();
    console.log(chalk.gray(`\n  Refreshing every ${config.interval}s... (Ctrl+C to stop)`));
  };
  await tick();
  setInterval(tick, config.interval * 1000);
}

run().catch(err => { console.error(chalk.red(err.message)); process.exit(1); });
