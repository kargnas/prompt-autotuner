#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { lookup as mimeLookup } from 'mime-types';
import { createReadStream } from 'fs';
import { resolveApiKey, CONFIG_PATH } from './resolve-key.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? parseInt(args[idx + 1]) : def;
};
const PORT = getArg('--port', 3000);
const API_PORT = getArg('--api-port', 3001);

function execSafe(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { return ''; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const apiKey = await resolveApiKey();

const nodeModules = path.join(ROOT, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('📦  Installing dependencies...');
  const installCmd = fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml')) ? 'pnpm install' : 'npm install';
  try {
    execSync(installCmd, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌  Install failed. Check your network connection.');
    process.exit(1);
  }
}

const distDir = path.join(ROOT, 'dist');
const needsBuild =
  !fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'));

if (needsBuild) {
  console.log('📦  Building frontend...');
  const usePnpm = fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml')) && !!execSafe('which pnpm');
  const buildCmd = usePnpm ? 'pnpm build' : 'npm run build';
  try {
    execSync(buildCmd, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌  Build failed.');
    process.exit(1);
  }
}

// npm/npx hoists deps to a parent node_modules, so walk up to find tsx
function findBin(name) {
  let dir = ROOT;
  while (true) {
    const bin = path.join(dir, 'node_modules', '.bin', name);
    if (fs.existsSync(bin)) return bin;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const tsxBin = findBin('tsx');
if (!tsxBin) {
  console.error('❌  tsx not found. Run: npm install tsx');
  process.exit(1);
}
const apiServer = spawn(tsxBin, [path.join(ROOT, 'server', 'index.ts')], {
  env: { ...process.env, API_PORT: String(API_PORT), OPENROUTER_API_KEY: apiKey },
  stdio: 'inherit',
});
apiServer.on('error', (err) => {
  console.error('❌  Failed to start API server:', err.message);
  process.exit(1);
});

const staticServer = http.createServer((req, res) => {
  const url = req.url || '/';

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

  let filePath = path.join(distDir, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath)) filePath = path.join(distDir, 'index.html');

  const mime = mimeLookup(filePath) || 'text/plain';
  res.writeHead(200, { 'Content-Type': mime });
  createReadStream(filePath).pipe(res);
});

staticServer.listen(PORT, () => {
  console.log(`\n✅  autotuner → http://localhost:${PORT}`);
  console.log(`    API server on port ${API_PORT}`);
  console.log(`    Config: ${CONFIG_PATH}\n`);
});

const shutdown = () => { apiServer.kill(); staticServer.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
