const fs = require('fs');
const path = require('path');

function parseLogFile(filePath, patterns = ['ERROR', 'FATAL', 'CRITICAL', 'Exception']) {
  if (!fs.existsSync(filePath)) return { file: filePath, error: 'File not found', matches: [] };

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];

  lines.forEach((line, i) => {
    for (const pattern of patterns) {
      if (line.includes(pattern)) {
        matches.push({ line: i + 1, pattern, text: line.trim().substring(0, 120) });
        break;
      }
    }
  });

  return { file: filePath, totalLines: lines.length, matches, errorCount: matches.length };
}

function parseLogs(files = [], patterns) {
  return files.map(f => parseLogFile(f, patterns));
}

module.exports = { parseLogFile, parseLogs };
