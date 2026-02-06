import type ClaudianPlugin from '../../main';
import type { CliProvider } from '../types';
import { ClaudeCliService } from './ClaudeCliService';
import { CodexCliService } from './CodexCliService';
import type { ICliService } from './ICliService';
import { KiloCodeCliService } from './KiloCodeCliService';

/** Creates the appropriate CLI service based on provider setting. */
export function createCliService(plugin: ClaudianPlugin, provider?: CliProvider): ICliService {
  const activeProvider = provider ?? plugin.settings.cliProvider ?? 'codex';

  switch (activeProvider) {
    case 'claude':
      return new ClaudeCliService(plugin);
    case 'kilocode':
      return new KiloCodeCliService(plugin);
    case 'codex':
    default:
      return new CodexCliService(plugin);
  }
}
