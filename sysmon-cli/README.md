# ⚡ SysMon CLI

A Node.js system monitoring CLI tool with a live web dashboard. Monitors CPU, memory, disk usage, performs health checks on endpoints, and parses log files for errors.

## Features

- **Real-time monitoring** — CPU, memory, disk usage with alert thresholds
- **Health checks** — Ping HTTP/HTTPS endpoints and report status
- **Log parsing** — Scan log files for error patterns (ERROR, FATAL, CRITICAL)
- **Live web dashboard** — Browser-based dashboard with real-time updates via SSE
- **YAML configuration** — Customize thresholds, endpoints, and log paths
- **Color-coded alerts** — Visual warnings when thresholds are exceeded

## Installation

```bash
git clone https://github.com/maitrip482/portfolio.git
cd portfolio/sysmon-cli
npm install
```

## Usage

```bash
# Run once and exit
node bin/sysmon.js --once

# Continuous monitoring (refreshes every 5s)
node bin/sysmon.js

# Launch live web dashboard
node bin/sysmon.js --dashboard
```

Then open `http://localhost:3847` for the live dashboard.

## Configuration

Edit `config.yaml`:

```yaml
interval: 5  # seconds

alerts:
  cpu_threshold: 80
  memory_threshold: 85
  disk_threshold: 90

endpoints:
  - https://google.com
  - https://github.com

logs:
  files:
    - /var/log/system.log
  patterns:
    - ERROR
    - FATAL

dashboard:
  port: 3847
```

## Architecture

```
sysmon-cli/
├── bin/sysmon.js        # CLI entry point
├── src/
│   ├── monitor.js       # CPU, memory, disk metrics (os module)
│   ├── healthcheck.js   # HTTP endpoint health checks
│   ├── logparser.js     # Log file error pattern scanner
│   ├── config.js        # YAML config loader
│   └── dashboard.js     # Live web dashboard (HTTP + SSE)
├── config.yaml          # Configuration file
└── package.json
```

## Tech Stack

- **Node.js** — Runtime
- **Server-Sent Events** — Real-time dashboard updates
- **YAML** — Configuration
- **Zero external monitoring dependencies** — Uses native `os` module

## Author

**Maitri Patel** — [LinkedIn](https://linkedin.com/in/maitri-patel-1196b5182) | [GitHub](https://github.com/maitrip482)
