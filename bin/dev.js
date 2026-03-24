#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveApiKey, loadConfig } from './resolve-key.js';
import { resolvePort } from './port-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const apiKey = await resolveApiKey();

// ── Port resolution (same logic as autotuner.js) ─────────────────────────────

const yamlConfig = loadConfig();

const portExplicit = !!process.env.PORT || yamlConfig.port !== undefined;
const apiPortExplicit = !!process.env.API_PORT || yamlConfig.apiPort !== undefined;

const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : yamlConfig.port ?? 3000;
const preferredApiPort = process.env.API_PORT ? parseInt(process.env.API_PORT) : yamlConfig.apiPort ?? 3001;

const API_PORT = await resolvePort(preferredApiPort, apiPortExplicit, 'API_PORT');
const PORT = await resolvePort(preferredPort, portExplicit, 'PORT', [API_PORT]);

// ── Start dev servers ────────────────────────────────────────────────────────

const child = spawn(
  path.join(ROOT, 'node_modules', '.bin', 'concurrently'),
  ['vite', 'tsx watch server/index.ts'],
  {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      API_PORT: String(API_PORT),
      OPENROUTER_API_KEY: apiKey,
      _PORT_PRERESOLVED: '1',
    },
    stdio: 'inherit',
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
const shutdown = () => { child.kill(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
