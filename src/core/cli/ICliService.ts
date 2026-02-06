import type { ApprovalCallback, QueryOptions } from '../agent';
import type { ChatMessage, ExitPlanModeCallback, ImageAttachment, SlashCommand, StreamChunk } from '../types';

export interface EnsureReadyOptions {
  force?: boolean;
  preserveHandlers?: boolean;
  sessionId?: string;
  externalContextPaths?: string[];
}

export type ReadyStateCallback = (ready: boolean) => void;
export type AskUserQuestionCallback = (
  input: Record<string, unknown>,
  signal?: AbortSignal
) => Promise<Record<string, string> | null>;

/** Common interface for all CLI service implementations. */
export interface ICliService {
  /** Subscribe to ready state changes. Returns unsubscribe function. */
  onReadyStateChange(callback: ReadyStateCallback): () => void;

  /** Check if the service is ready to accept queries. */
  isReady(): boolean;

  /** Get supported slash commands from this CLI. */
  getSupportedCommands(): SlashCommand[];

  /** Ensure the service is ready (initialize if needed). */
  ensureReady(options?: EnsureReadyOptions): Promise<boolean>;

  /** Apply fork state from a conversation (for resuming sessions). */
  applyForkState(conversation?: unknown): string | null;

  /** Get current session ID if any. */
  getSessionId(): string | null;

  /** Set pending resume UUID. */
  setPendingResumeAt(uuid: string | undefined): void;

  /** Set approval callback for tool use authorization. */
  setApprovalCallback(callback: ApprovalCallback | null): void;

  /** Set dismisser callback for approval dialogs. */
  setApprovalDismisser(callback: (() => void) | null): void;

  /** Set callback for ask-user-question tool. */
  setAskUserQuestionCallback(callback: AskUserQuestionCallback | null): void;

  /** Set callback for exiting plan mode. */
  setExitPlanModeCallback(callback: ExitPlanModeCallback | null): void;

  /** Set callback for syncing permission mode from SDK. */
  setPermissionModeSyncCallback(callback: ((sdkMode: string) => void) | null): void;

  /** Set session ID for resuming conversations. */
  setSessionId(id: string | null, externalContextPaths?: string[]): void;

  /** Reset the current session. */
  resetSession(): void;

  /** Close persistent query connection. */
  closePersistentQuery(reason?: string): void;

  /** Cleanup resources. */
  cleanup(): void;

  /** Cancel any running query. */
  cancel(): void;

  /** Execute a query and stream response chunks. */
  query(
    prompt: string,
    images: ImageAttachment[] | undefined,
    previousMessages: ChatMessage[],
    queryOptions?: QueryOptions
  ): AsyncGenerator<StreamChunk>;

  /** Rewind conversation to a specific message (SDK-specific, no-op for CLI). */
  rewind?(userUuid: string, assistantUuid?: string): Promise<{ canRewind: boolean; error?: string; filesChanged?: string[] }>;

  /** Check if session needs reinitialization (SDK-specific, no-op for CLI). */
  consumeSessionInvalidation?(): boolean;

  /** Reload MCP servers (SDK-specific, no-op for CLI). */
  reloadMcpServers?(): Promise<void>;
}
