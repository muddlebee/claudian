/**
 * Claudian - Codex CLI resolver
 *
 * Shared resolver for Codex CLI path resolution across services.
 */

import * as fs from 'fs';
import * as path from 'path';

import { type HostnameCliPaths } from '../core/types/settings';
import { getHostnameKey } from './env';
import { expandHomePath, parsePathEntries } from './path';

export class CodexCliResolver {
  private resolvedPath: string | null = null;
  private lastHostnamePath = '';
  private lastEnvText = '';
  // Cache hostname since it doesn't change during a session
  private readonly cachedHostname = getHostnameKey();

  /**
   * Resolves CLI path with priority: hostname-specific -> PATH lookup.
   * @param hostnamePaths Per-device CLI paths keyed by hostname (preferred)
   * @param envText Environment variables text
   */
  resolve(
    hostnamePaths: HostnameCliPaths | undefined,
    envText: string
  ): string | null {
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

    this.resolvedPath = resolveCodexCliPath(hostnamePath);
    return this.resolvedPath;
  }

  reset(): void {
    this.resolvedPath = null;
    this.lastHostnamePath = '';
    this.lastEnvText = '';
  }
}

export function resolveCodexCliPath(hostnamePath: string | undefined): string | null {
  const trimmedHostname = (hostnamePath ?? '').trim();
  if (!trimmedHostname) {
    return null;
  }

  try {
    const expandedPath = expandHomePath(trimmedHostname);
    if (fs.existsSync(expandedPath)) {
      const stat = fs.statSync(expandedPath);
      if (stat.isFile()) {
        return expandedPath;
      }
    }
  } catch {
    // Fall through to PATH lookup
  }

  return null;
}

export function findCodexCLIPath(pathValue?: string): string | null {
  const entries = parsePathEntries(pathValue);
  if (entries.length === 0) {
    return null;
  }

  const candidates = process.platform === 'win32'
    ? ['codex.exe', 'codex']
    : ['codex'];

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
        // Ignore unreadable entries
      }
    }
  }

  return null;
}
