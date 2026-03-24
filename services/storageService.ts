import type { SavedPrompt } from '../types';
import { SAVED_PROMPTS_LOCAL_STORAGE_KEY } from '../constants';

type StorageBackend = 'file' | 'localstorage';

let detectedBackend: StorageBackend | null = null;

async function detectBackend(): Promise<StorageBackend> {
  if (detectedBackend) return detectedBackend;

  try {
    const res = await fetch('/api/storage/config');
    if (res.ok) {
      const data = await res.json();
      if (data.backend === 'file') {
        detectedBackend = 'file';
        return 'file';
      }
    }
  } catch {
    // Server unreachable — fall back to localStorage
  }

  detectedBackend = 'localstorage';
  return 'localstorage';
}

function loadFromLocalStorage(): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(SAVED_PROMPTS_LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(prompts: SavedPrompt[]): void {
  try {
    localStorage.setItem(SAVED_PROMPTS_LOCAL_STORAGE_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error('Failed to save prompts to localStorage', e);
  }
}

export async function loadSavedPrompts(): Promise<SavedPrompt[]> {
  const backend = await detectBackend();

  if (backend === 'file') {
    try {
      const res = await fetch('/api/storage/prompts');
      if (res.ok) {
        const data = await res.json();
        if (data.backend === 'file' && Array.isArray(data.prompts)) {
          return data.prompts;
        }
      }
    } catch {
      detectedBackend = null;
    }
  }

  return loadFromLocalStorage();
}

export async function saveSavedPrompts(prompts: SavedPrompt[]): Promise<void> {
  const backend = await detectBackend();

  if (backend === 'file') {
    try {
      const res = await fetch('/api/storage/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts }),
      });
      if (res.ok) return;
    } catch {
      detectedBackend = null;
    }
  }

  saveToLocalStorage(prompts);
}

/**
 * One-time migration: if file storage is empty but localStorage has data,
 * push localStorage data to file storage so the user doesn't lose prompts.
 */
export async function migrateLocalStorageToFile(): Promise<void> {
  const backend = await detectBackend();
  if (backend !== 'file') return;

  const localPrompts = loadFromLocalStorage();
  if (localPrompts.length === 0) return;

  try {
    const res = await fetch('/api/storage/prompts');
    if (!res.ok) return;
    const data = await res.json();

    if (Array.isArray(data.prompts) && data.prompts.length > 0) return;

    await saveSavedPrompts(localPrompts);
    localStorage.removeItem(SAVED_PROMPTS_LOCAL_STORAGE_KEY);
    console.log(`Migrated ${localPrompts.length} saved prompts from localStorage to file storage`);
  } catch {
    // Non-fatal — keep localStorage data as-is
  }
}
