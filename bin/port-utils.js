/**
 * Port availability checking and resolution utilities.
 *
 * Used by bin/autotuner.js (npx mode) and bin/dev.js (dev mode) to
 * pre-resolve ports BEFORE spawning child processes. This ensures:
 * - The static server's /api proxy always points to the correct API port
 * - Vite's proxy target matches the actual API server port
 * - Explicit ports that are occupied cause a clear error
 */

import net from 'net';

const MAX_PORT_RETRIES = 10;

/**
 * Check if a TCP port is available on localhost by briefly binding to it.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Resolve an available port with explicit-vs-default semantics.
 *
 * - If `preferred` is available (and not in `exclude`), return it.
 * - If busy AND `explicit` → exit with error (user intentionally chose this port).
 * - If busy AND NOT explicit → scan preferred+1 … preferred+MAX_PORT_RETRIES.
 *
 * @param {number}   preferred  Desired port number
 * @param {boolean}  explicit   Whether the user explicitly configured this port
 *                              (via CLI flag, env var, or config.yaml)
 * @param {string}   label      Human-readable name for messages (e.g. 'PORT', 'API_PORT')
 * @param {number[]} [exclude]  Ports already claimed by other services (avoid collision)
 * @returns {Promise<number>}   The resolved available port
 */
export async function resolvePort(preferred, explicit, label, exclude = []) {
  if (!exclude.includes(preferred) && await isPortAvailable(preferred)) {
    return preferred;
  }

  if (explicit) {
    const reason = exclude.includes(preferred)
      ? `conflicts with another resolved port`
      : `is already in use`;
    console.error(`\n❌  Port ${preferred} ${reason}. ${label} is explicitly configured — exiting.`);
    process.exit(1);
  }

  for (let i = 1; i <= MAX_PORT_RETRIES; i++) {
    const candidate = preferred + i;
    if (exclude.includes(candidate)) continue;
    if (await isPortAvailable(candidate)) {
      console.warn(`⚠️  Port ${preferred} (${label}) is in use → using ${candidate}`);
      return candidate;
    }
  }

  console.error(`\n❌  No available port found near ${preferred} for ${label}. Exiting.`);
  process.exit(1);
}
