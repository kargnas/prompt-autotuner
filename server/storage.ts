import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { SAVED_PROMPTS_DIR, LEGACY_SAVED_PROMPTS_JSON } from './config';

interface SavedPromptFile {
  id: string;
  prompt: string;
  savedAt: string;
  source: string;
  sourceAttempt?: number;
  sourceLabel?: string;
  details?: string;
  testCases: unknown[];
}

// path.basename strips directory traversal (e.g. "../../.bashrc" → ".bashrc"),
// then we reject anything that isn't a clean alphanumeric/dash/underscore id.
function sanitizeId(id: string): string {
  const base = path.basename(id).replace(/\0/g, '');
  if (!base || base === '.' || base === '..' || !/^[\w-]+$/.test(base)) {
    throw new Error(`Invalid prompt id: ${id}`);
  }
  return base;
}

function promptPath(id: string): string {
  return path.join(SAVED_PROMPTS_DIR, `${sanitizeId(id)}.yaml`);
}

function ensureDir(): void {
  fs.mkdirSync(SAVED_PROMPTS_DIR, { recursive: true });
}

function migrateSingleJsonToDirectory(): void {
  if (!fs.existsSync(LEGACY_SAVED_PROMPTS_JSON)) return;

  try {
    const raw = fs.readFileSync(LEGACY_SAVED_PROMPTS_JSON, 'utf8');
    const prompts: SavedPromptFile[] = JSON.parse(raw);
    if (!Array.isArray(prompts)) return;

    ensureDir();
    for (const prompt of prompts) {
      if (!prompt.id) continue;
      try {
        const filePath = promptPath(prompt.id);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, yaml.dump(prompt, { lineWidth: 120, noRefs: true }), 'utf8');
        }
      } catch { /* skip prompts with invalid ids */ }
    }

    fs.unlinkSync(LEGACY_SAVED_PROMPTS_JSON);
    console.log(`✅  Migrated saved-prompts.json → saved-prompts/ directory (${prompts.length} files)`);
  } catch { /* non-fatal */ }
}

export function loadSavedPrompts(): SavedPromptFile[] {
  migrateSingleJsonToDirectory();

  if (!fs.existsSync(SAVED_PROMPTS_DIR)) return [];

  try {
    const files = fs.readdirSync(SAVED_PROMPTS_DIR).filter(f => f.endsWith('.yaml'));
    const prompts: SavedPromptFile[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(SAVED_PROMPTS_DIR, file), 'utf8');
        const parsed = yaml.load(raw) as SavedPromptFile;
        if (parsed && parsed.id) {
          prompts.push(parsed);
        }
      } catch { /* skip corrupted files */ }
    }

    prompts.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    return prompts;
  } catch {
    return [];
  }
}

export function writeSavedPrompts(prompts: SavedPromptFile[]): void {
  ensureDir();

  const incomingIds = new Set(prompts.map(p => p.id));

  try {
    const existing = fs.readdirSync(SAVED_PROMPTS_DIR).filter(f => f.endsWith('.yaml'));
    for (const file of existing) {
      const id = file.replace(/\.yaml$/, '');
      if (!incomingIds.has(id)) {
        fs.unlinkSync(path.join(SAVED_PROMPTS_DIR, file));
      }
    }
  } catch { /* non-fatal */ }

  for (const prompt of prompts) {
    if (!prompt.id) continue;
    const filePath = promptPath(prompt.id);
    fs.writeFileSync(filePath, yaml.dump(prompt, { lineWidth: 120, noRefs: true }), 'utf8');
  }
}
