import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';

const CONFIG_DIR = path.join(os.homedir(), '.autotuner');
const CONFIG_YAML_PATH = path.join(CONFIG_DIR, 'config.yaml');
const CONFIG_JSON_PATH = path.join(CONFIG_DIR, 'config.json');

export { CONFIG_YAML_PATH as CONFIG_PATH };

function migrateJsonToYaml() {
  if (!fs.existsSync(CONFIG_JSON_PATH)) return;
  if (fs.existsSync(CONFIG_YAML_PATH)) {
    try { fs.unlinkSync(CONFIG_JSON_PATH); } catch { /* already migrated */ }
    return;
  }

  try {
    const json = JSON.parse(fs.readFileSync(CONFIG_JSON_PATH, 'utf8'));
    const yamlConfig = {};
    if (json.openrouterApiKey) yamlConfig.openrouterApiKey = json.openrouterApiKey;

    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_YAML_PATH, yaml.dump(yamlConfig, { lineWidth: 120 }), 'utf8');
    fs.unlinkSync(CONFIG_JSON_PATH);
    console.log(`✅  Migrated ${CONFIG_JSON_PATH} → ${CONFIG_YAML_PATH}`);
  } catch { /* non-fatal */ }
}

export function loadConfig() {
  migrateJsonToYaml();
  if (!fs.existsSync(CONFIG_YAML_PATH)) return {};
  try {
    const parsed = yaml.load(fs.readFileSync(CONFIG_YAML_PATH, 'utf8'));
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch { return {}; }
}

export function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_YAML_PATH, yaml.dump(config, { lineWidth: 120, noRefs: true }), 'utf8');
}

export function findEnvKey() {
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toUpperCase().includes('OPENROUTER') && v && v.length > 8) {
      return { name: k, value: v };
    }
  }
  return null;
}

// Priority: env var → ~/.autotuner/config.yaml → interactive Ink prompt
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
  console.log(`✅  Saved to ${CONFIG_YAML_PATH}\n`);

  return key;
}
