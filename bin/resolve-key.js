import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.autotuner');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export { CONFIG_PATH };

export function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
  }
  return {};
}

export function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function findEnvKey() {
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().includes('OPENROUTER') && v && v.length > 8) {
      return { name: k, value: v };
    }
  }
  return null;
}

// Resolve API key: env var → ~/.autotuner/config.json → interactive Ink prompt
export async function resolveApiKey() {
  const envMatch = findEnvKey();
  if (envMatch) {
    if (envMatch.name !== 'OPENROUTER_API_KEY') {
      console.log(`✅  Using ${envMatch.name} as API key`);
    }
    return envMatch.value;
  }

  const config = loadConfig();
  if (config.openrouterApiKey) {
    return config.openrouterApiKey;
  }

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
