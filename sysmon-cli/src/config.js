const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const DEFAULT_CONFIG = {
  interval: 5,
  alerts: { cpu_threshold: 80, memory_threshold: 85, disk_threshold: 90 },
  endpoints: ['https://google.com'],
  logs: { files: [], patterns: ['ERROR', 'FATAL', 'CRITICAL'] },
  dashboard: { port: 3847 }
};

function loadConfig(configPath) {
  const file = configPath || path.join(process.cwd(), 'config.yaml');
  if (!fs.existsSync(file)) return DEFAULT_CONFIG;
  const content = fs.readFileSync(file, 'utf8');
  return { ...DEFAULT_CONFIG, ...YAML.parse(content) };
}

module.exports = { loadConfig };
