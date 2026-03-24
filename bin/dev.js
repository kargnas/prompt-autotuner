#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveApiKey } from './resolve-key.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const apiKey = await resolveApiKey();

const child = spawn(
  path.join(ROOT, 'node_modules', '.bin', 'concurrently'),
  ['vite', 'tsx watch server/index.ts'],
  {
    cwd: ROOT,
    env: { ...process.env, OPENROUTER_API_KEY: apiKey },
    stdio: 'inherit',
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
const shutdown = () => { child.kill(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
