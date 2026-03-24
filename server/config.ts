/**
 * Unified configuration loader.
 *
 * Priority: .env (process.env) → ~/.autotuner/config.yaml → defaults
 *
 * This module is the single source of truth for all runtime configuration.
 * Both the Express server and the CLI entry point should use this.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

// ── Paths ────────────────────────────────────────────────────────────────────

function expandHome(p: string): string {
  return p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}

export const CONFIG_DIR = process.env.AUTOTUNER_DIR
  ? expandHome(process.env.AUTOTUNER_DIR)
  : path.join(os.homedir(), '.autotuner');
export const CONFIG_YAML_PATH = path.join(CONFIG_DIR, 'config.yaml');
/** Legacy JSON path — auto-migrated to YAML on first load */
const CONFIG_JSON_PATH = path.join(CONFIG_DIR, 'config.json');
export const SAVED_PROMPTS_DIR = path.join(CONFIG_DIR, 'saved-prompts');
export const LEGACY_SAVED_PROMPTS_JSON = path.join(CONFIG_DIR, 'saved-prompts.json');

// ── Types ────────────────────────────────────────────────────────────────────

export type StorageBackend = 'file' | 'localstorage';

export interface AppConfig {
  openrouterApiKey: string;
  port: number;
  /** Whether `port` was explicitly set via .env or config.yaml (not a default) */
  portExplicit: boolean;
  apiPort: number;
  /** Whether `apiPort` was explicitly set via .env or config.yaml (not a default) */
  apiPortExplicit: boolean;
  storageBackend: StorageBackend;
}

interface YamlConfig {
  openrouterApiKey?: string;
  port?: number;
  apiPort?: number;
  storageBackend?: string;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: Omit<AppConfig, 'portExplicit' | 'apiPortExplicit'> = {
  openrouterApiKey: '',
  port: 3000,
  apiPort: 3001,
  storageBackend: 'file',
};

// ── YAML read / write ────────────────────────────────────────────────────────

export function loadYamlConfig(): YamlConfig {
  // Auto-migrate legacy config.json → config.yaml
  migrateJsonToYaml();

  if (!fs.existsSync(CONFIG_YAML_PATH)) return {};

  try {
    const raw = fs.readFileSync(CONFIG_YAML_PATH, 'utf8');
    const parsed = yaml.load(raw);
    return (parsed && typeof parsed === 'object') ? parsed as YamlConfig : {};
  } catch {
    return {};
  }
}

export function saveYamlConfig(config: YamlConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const content = yaml.dump(config, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(CONFIG_YAML_PATH, content, 'utf8');
}

// ── Migration: config.json → config.yaml ─────────────────────────────────────

function migrateJsonToYaml(): void {
  if (!fs.existsSync(CONFIG_JSON_PATH)) return;
  if (fs.existsSync(CONFIG_YAML_PATH)) {
    // JSON still hanging around but YAML already exists — just remove the old file
    try { fs.unlinkSync(CONFIG_JSON_PATH); } catch { /* ignore */ }
    return;
  }

  try {
    const raw = fs.readFileSync(CONFIG_JSON_PATH, 'utf8');
    const json = JSON.parse(raw) as Record<string, unknown>;
    const yamlConfig: YamlConfig = {};

    if (typeof json.openrouterApiKey === 'string') {
      yamlConfig.openrouterApiKey = json.openrouterApiKey;
    }

    saveYamlConfig(yamlConfig);
    fs.unlinkSync(CONFIG_JSON_PATH);
    console.log(`✅  Migrated ${CONFIG_JSON_PATH} → ${CONFIG_YAML_PATH}`);
  } catch {
    // Migration failure is non-fatal — user can still set values via .env
  }
}

// ── Unified config resolver ──────────────────────────────────────────────────

/**
 * Resolve all configuration with strict priority:
 *   1. process.env (from .env or shell)
 *   2. ~/.autotuner/config.yaml
 *   3. Built-in defaults
 */
export function resolveConfig(): AppConfig {
  const yamlCfg = loadYamlConfig();

  const storageRaw = process.env.STORAGE_BACKEND || yamlCfg.storageBackend || DEFAULTS.storageBackend;
  const storageBackend: StorageBackend = (storageRaw === 'localstorage') ? 'localstorage' : 'file';

  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  const envApiPort = process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : undefined;

  // When launched from bin/autotuner.js or bin/dev.js, ports are pre-resolved
  // by the parent process. Treat as explicit so the server doesn't retry on EADDRINUSE.
  const preresolved = process.env._PORT_PRERESOLVED === '1';

  const portExplicit = preresolved || envPort !== undefined || yamlCfg.port !== undefined;
  const apiPortExplicit = preresolved || envApiPort !== undefined || yamlCfg.apiPort !== undefined;

  return {
    openrouterApiKey:
      process.env.OPENROUTER_API_KEY
      || yamlCfg.openrouterApiKey
      || DEFAULTS.openrouterApiKey,

    port: envPort ?? yamlCfg.port ?? DEFAULTS.port,
    portExplicit,

    apiPort: envApiPort ?? yamlCfg.apiPort ?? DEFAULTS.apiPort,
    apiPortExplicit,

    storageBackend,
  };
}
