#!/usr/bin/env node

/**
 * autotuner CLI
 * Usage: npx prompt-autotuner [--port 3000] [--api-port 3001]
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { lookup as mimeLookup } from 'mime-types';
import { createReadStream } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Parse args
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? parseInt(args[idx + 1]) : def;
};
const PORT = getArg('--port', 3000);
const API_PORT = getArg('--api-port', 3001);

// Check API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error('\n❌  OPENROUTER_API_KEY is not set.');
  console.error('    Export it first:\n');
  console.error('    export OPENROUTER_API_KEY=sk-or-...\n');
  process.exit(1);
}

// Build if needed
const distDir = path.join(ROOT, 'dist');
const needsBuild =
  !fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'));

if (needsBuild) {
  console.log('📦  Building frontend...');
  const buildCmd = fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml'))
    ? 'pnpm build'
    : 'npm run build';
  try {
    execSync(buildCmd, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌  Build failed. Run `pnpm install` first.');
    process.exit(1);
  }
}

// Start API server (Express via tsx)
const tsxBin = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const apiServer = spawn(tsxBin, [path.join(ROOT, 'server', 'index.ts')], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: 'inherit',
});

apiServer.on('error', (err) => {
  console.error('❌  Failed to start API server:', err.message);
  process.exit(1);
});

// Static file server with /api proxy
const staticServer = http.createServer((req, res) => {
  const url = req.url || '/';

  // Proxy /api/* → Express
  if (url.startsWith('/api')) {
    const opts = {
      hostname: 'localhost',
      port: API_PORT,
      path: url,
      method: req.method,
      headers: req.headers,
    };
    const proxy = http.request(opts, (pr) => {
      res.writeHead(pr.statusCode, pr.headers);
      pr.pipe(res);
    });
    proxy.on('error', () => res.writeHead(502).end('Bad Gateway'));
    req.pipe(proxy);
    return;
  }

  // Serve static files (SPA fallback to index.html)
  let filePath = path.join(distDir, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const mime = mimeLookup(filePath) || 'text/plain';
  res.writeHead(200, { 'Content-Type': mime });
  createReadStream(filePath).pipe(res);
});

staticServer.listen(PORT, () => {
  console.log(`\n✅  autotuner is running at http://localhost:${PORT}`);
  console.log(`    API server on port ${API_PORT}\n`);
});

const shutdown = () => {
  apiServer.kill();
  staticServer.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
