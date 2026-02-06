import { type ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type ClaudianPlugin from '../../main';
import { getEnhancedPath, parseEnvironmentVariables } from '../../utils/env';
import { getVaultPath } from '../../utils/path';
import type { ApprovalCallback, QueryOptions } from '../agent';
import type { ChatMessage, ExitPlanModeCallback, ImageAttachment, SlashCommand, StreamChunk } from '../types';
import type { AskUserQuestionCallback, EnsureReadyOptions, ICliService, ReadyStateCallback } from './ICliService';

/** Kilo Code CLI service implementation using `kilocode` command. */
export class KiloCodeCliService implements ICliService {
  private plugin: ClaudianPlugin;
  private currentProcess: ChildProcess | null = null;
  private readyCallbacks = new Set<ReadyStateCallback>();

  constructor(plugin: ClaudianPlugin) {
    this.plugin = plugin;
  }

  onReadyStateChange(callback: ReadyStateCallback): () => void {
    this.readyCallbacks.add(callback);
    callback(true);
    return () => this.readyCallbacks.delete(callback);
  }

  isReady(): boolean {
    return true;
  }

  getSupportedCommands(): SlashCommand[] {
    return [];
  }

  async ensureReady(_options?: EnsureReadyOptions): Promise<boolean> {
    return true;
  }

  applyForkState(_conversation?: unknown): string | null {
    return null;
  }

  getSessionId(): string | null {
    return null;
  }

  setPendingResumeAt(_uuid: string | undefined): void {}

  setApprovalCallback(_callback: ApprovalCallback | null): void {}

  setApprovalDismisser(_callback: (() => void) | null): void {}

  setAskUserQuestionCallback(_callback: AskUserQuestionCallback | null): void {}

  setExitPlanModeCallback(_callback: ExitPlanModeCallback | null): void {}

  setPermissionModeSyncCallback(_callback: ((sdkMode: string) => void) | null): void {}

  setSessionId(_id: string | null, _externalContextPaths?: string[]): void {}

  resetSession(): void {
    this.cancel();
  }

  closePersistentQuery(_reason?: string): void {
    this.cancel();
  }

  cleanup(): void {
    this.cancel();
  }

  cancel(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }

  async *query(
    prompt: string,
    _images: ImageAttachment[] | undefined,
    previousMessages: ChatMessage[],
    _queryOptions?: QueryOptions
  ): AsyncGenerator<StreamChunk> {
    if (this.currentProcess) {
      this.cancel();
    }

    const vaultPath = getVaultPath(this.plugin.app);
    if (!vaultPath) {
      yield { type: 'error', content: 'Could not determine vault path.' };
      yield { type: 'done' };
      return;
    }

    const envVars = parseEnvironmentVariables(this.plugin.getActiveEnvironmentVariables());
    const configuredCliPath = this.plugin.getResolvedKilocodeCliPath();
    let enhancedPath = getEnhancedPath(envVars.PATH, configuredCliPath || undefined);
    const detectedCliPath = configuredCliPath || this.findKilocodeCLIPath(enhancedPath);

    if (!detectedCliPath) {
      yield {
        type: 'error',
        content: 'Kilo CLI not found. Install it with: npm install -g kilo-code\nThen set the path in settings or add kilo to PATH.',
      };
      yield { type: 'done' };
      return;
    }

    if (!configuredCliPath) {
      enhancedPath = getEnhancedPath(envVars.PATH, detectedCliPath);
    }

    const env = {
      ...process.env,
      ...envVars,
      PATH: enhancedPath,
    } as NodeJS.ProcessEnv;

    const promptWithHistory = this.buildPromptWithHistory(prompt, previousMessages);
    const command = detectedCliPath;
    // Use `kilo run "prompt" --model "model"` format
    const args = ['run', promptWithHistory, '--model', 'kilo/z-ai/glm-4.7:free'];

    let spawnError: unknown = null;
    let stderrBuffer = '';
    let isFirstLine = true;

    const child = spawn(command, args, {
      cwd: vaultPath,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.currentProcess = child;

    child.on('error', (error) => {
      spawnError = error;
    });

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
      });
    }

    if (child.stdout) {
      let buffer = '';
      for await (const data of child.stdout) {
        buffer += data.toString();
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          // Skip header lines starting with '>' (e.g., "> code · model")
          if (isFirstLine && line.trim().startsWith('>')) {
            isFirstLine = false;
            continue;
          }
          isFirstLine = false;
          yield { type: 'text', content: line + '\n' };
        }
      }
      // Output any remaining buffer content
      if (buffer.trim()) {
        if (!(isFirstLine && buffer.trim().startsWith('>'))) {
          yield { type: 'text', content: buffer };
        }
      }
    }

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('close', (code) => resolve(code));
    });

    this.currentProcess = null;

    if (spawnError) {
      const errorMessage = spawnError instanceof Error ? spawnError.message : String(spawnError);
      yield { type: 'error', content: errorMessage };
    } else if (exitCode && exitCode !== 0) {
      const message = stderrBuffer.trim() || `Kilo Code CLI exited with code ${exitCode}.`;
      yield { type: 'error', content: message };
    }

    yield { type: 'done' };
  }

  private findKilocodeCLIPath(pathValue?: string): string | null {
    const entries = this.parsePathEntries(pathValue);
    if (entries.length === 0) {
      return null;
    }

    const candidates = process.platform === 'win32'
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

  private parsePathEntries(pathValue?: string): string[] {
    if (!pathValue) {
      return [];
    }
    const separator = process.platform === 'win32' ? ';' : ':';
    return pathValue.split(separator).filter(Boolean);
  }

  private buildPromptWithHistory(prompt: string, previousMessages: ChatMessage[]): string {
    const lines: string[] = [];

    for (const message of previousMessages) {
      if (message.isRebuiltContext || message.isInterrupt) {
        continue;
      }

      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      const content = message.displayContent || message.content;
      if (content.trim()) {
        lines.push(`${roleLabel}: ${content.trim()}`);
      }
    }

    if (lines.length === 0) {
      return prompt;
    }

    return `${lines.join('\n\n')}\n\nUser: ${prompt}`;
  }
}
