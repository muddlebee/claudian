/**
 * Kilo Code CLI resolver
 *
 * Shared resolver for Kilo Code CLI path detection across services.
 */

import * as fs from 'fs';
import * as path from 'path';

import { type HostnameCliPaths } from '../core/types/settings';
import { getHostnameKey, parseEnvironmentVariables } from './env';
import { expandHomePath, parsePathEntries } from './path';

export class KilocodeCliResolver {
  private resolvedPath: string | null = null;
  private lastHostnamePath = '';
  private lastEnvText = '';
  private readonly cachedHostname = getHostnameKey();

  /**
   * Resolves CLI path with priority: hostname-specific -> auto-detect.
   * @param hostnamePaths Per-device CLI paths keyed by hostname
   * @param envText Environment variables text
   */
  resolve(hostnamePaths: HostnameCliPaths | undefined, envText: string): string | null {
    const hostnameKey = this.cachedHostname;
    const hostnamePath = (hostnamePaths?.[hostnameKey] ?? '').trim();
    const normalizedEnv = envText ?? '';

    if (
      this.resolvedPath &&
      hostnamePath === this.lastHostnamePath &&
      normalizedEnv === this.lastEnvText
    ) {
      return this.resolvedPath;
    }

    this.lastHostnamePath = hostnamePath;
    this.lastEnvText = normalizedEnv;

    this.resolvedPath = resolveKilocodeCliPath(hostnamePath, normalizedEnv);
    return this.resolvedPath;
  }

  reset(): void {
    this.resolvedPath = null;
    this.lastHostnamePath = '';
    this.lastEnvText = '';
  }
}

/**
 * Resolves CLI path with fallback chain.
 * @param hostnamePath Hostname-specific path for this device
 * @param envText Environment variables text
 */
export function resolveKilocodeCliPath(
  hostnamePath: string | undefined,
  envText: string
): string | null {
  const trimmedHostname = (hostnamePath ?? '').trim();
  if (trimmedHostname) {
    try {
      const expandedPath = expandHomePath(trimmedHostname);
      if (fs.existsSync(expandedPath)) {
        const stat = fs.statSync(expandedPath);
        if (stat.isFile()) {
          return expandedPath;
        }
      }
    } catch {
      // Fall through to auto-detect
    }
  }

  const customEnv = parseEnvironmentVariables(envText || '');
  return findKilocodeCLIPath(customEnv.PATH);
}

/**
 * Searches PATH for the kilo CLI executable.
 */
export function findKilocodeCLIPath(pathValue?: string): string | null {
  const entries = parsePathEntries(pathValue);
  if (entries.length === 0) {
    return null;
  }

  const candidates =
    process.platform === 'win32'
      ? ['kilo.exe', 'kilo.cmd', 'kilo']
      : ['kilo'];

  for (const entry of entries) {
    if (!entry) continue;
    for (const candidate of candidates) {
      const fullPath = path.join(entry, candidate);
      try {
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            return fullPath;
          }
        }
      } catch {
        // Ignore errors and continue searching
      }
    }
  }

  return null;
}
