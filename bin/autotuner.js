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
import os from 'os';
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

// Config file
const CONFIG_DIR = path.join(os.homedir(), '.autotuner');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
  }
  return {};
}

function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Find any *OPENROUTER* env var (OPENROUTER_API_KEY, SYSTEM_OPENROUTER_API_KEY, etc.)
function findEnvKey() {
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().includes('OPENROUTER') && v && v.length > 8) {
      return { name: k, value: v };
    }
  }
  return null;
}

// Resolve API key: any matching env var → config file → interactive Ink prompt
async function resolveApiKey() {
  // 1. Check any env var containing OPENROUTER
  const envMatch = findEnvKey();
  if (envMatch) {
    if (envMatch.name !== 'OPENROUTER_API_KEY') {
      console.log(`✅  Using ${envMatch.name} as API key`);
    }
    return envMatch.value;
  }

  // 2. Config file
  const config = loadConfig();
  if (config.openrouterApiKey) {
    return config.openrouterApiKey;
  }

  // 3. Interactive Ink prompt
  const { promptApiKey } = await import('./setup.tsx');
  const key = await promptApiKey();

  if (!key) {
    console.error('\n❌  No API key provided. Exiting.\n');
    process.exit(1);
  }

  config.openrouterApiKey = key;
  saveConfig(config);
  console.log(`✅  Saved to ${CONFIG_PATH}\n`);

  return key;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const apiKey = await resolveApiKey();

// Install dependencies if node_modules missing
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

// Build if needed
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

function execSafe(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { return ''; }
}

// Start API server (Express via tsx)
const tsxBin = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const apiServer = spawn(tsxBin, [path.join(ROOT, 'server', 'index.ts')], {
  env: { ...process.env, PORT: String(API_PORT), OPENROUTER_API_KEY: apiKey },
  stdio: 'inherit',
});
apiServer.on('error', (err) => {
  console.error('❌  Failed to start API server:', err.message);
  process.exit(1);
});

// Static file server with /api proxy
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
