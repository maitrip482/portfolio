const http = require('http');
const https = require('https');

function checkEndpoint(url, timeout = 5000) {
  return new Promise(resolve => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout }, res => {
      resolve({
        url,
        status: res.statusCode,
        responseTime: Date.now() - start,
        healthy: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    req.on('error', () => resolve({ url, status: 0, responseTime: Date.now() - start, healthy: false }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, responseTime: timeout, healthy: false }); });
  });
}

async function checkAll(endpoints = []) {
  return Promise.all(endpoints.map(url => checkEndpoint(url)));
}

module.exports = { checkEndpoint, checkAll };
