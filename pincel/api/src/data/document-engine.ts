import { AsyncLocalStorage } from 'node:async_hooks';
import { applyCommand } from '../domain/commands/apply-command.js';
import type { Command } from '../domain/commands/command-types.js';
import { createDocState, type DocState } from '../domain/commands/doc-state.js';
import { replay } from '../domain/commands/replay.js';
import { findLayer } from '../domain/document/layer-stack.js';
import type { DocumentSetup } from '../domain/document/types.js';
import {
  appliedEntries,
  canRedo,
  canUndo,
  emptyHistory,
  pushEntry,
  redo,
  undo,
  type History,
} from '../domain/history/history.js';
import type { PaintEnv } from '../domain/paint/surface.js';
import { createChangeFeed } from './change-feed.js';
import type { DocumentFile } from './document-file.js';
import type { CommandSource, LoggedCommand } from './logged-command.js';
import { createSerialQueue } from './serial-queue.js';

export const DEFAULT_SETUP: DocumentSetup = { width: 1024, height: 768, background: '#ffffff' };

/**
 * Owns the single open document. State is always `setup` + the applied part of
 * `history`, so undo/redo just move the cursor and replay.
 */
export class DocumentEngine {
  readonly changes = createChangeFeed();
  private readonly enqueue = createSerialQueue();
  /** Commands collected by the group() currently running in this async context. */
  private readonly groupContext = new AsyncLocalStorage<Command[]>();
  private setup: DocumentSetup = DEFAULT_SETUP;
  private history: History<LoggedCommand> = emptyHistory();
  private state: DocState;
  private activeLayerId: string;
  private version = 0;

  constructor(
    private readonly env: PaintEnv,
    private readonly file?: DocumentFile,
  ) {
    this.state = createDocState(this.setup, env);
    this.activeLayerId = this.topLayerId();
  }

  async restore(): Promise<void> {
    const saved = await this.file?.load();
    if (!saved) return;
    this.setup = saved.setup;
    this.history = saved.history;
    await this.rebuild();
    this.activeLayerId = this.topLayerId();
  }

  get doc(): Readonly<DocState> {
    return this.state;
  }

  get activeLayer(): string {
    return this.activeLayerId;
  }

  get currentVersion(): number {
    return this.version;
  }

  get canUndo(): boolean {
    return canUndo(this.history);
  }

  get canRedo(): boolean {
    return canRedo(this.history);
  }

  get log(): readonly LoggedCommand[] {
    return appliedEntries(this.history);
  }

  /** Starts a brand-new document and forgets the old history. */
  reset(setup: DocumentSetup, source: CommandSource): Promise<void> {
    return this.outsideGroup(async () => {
      this.setup = setup;
      this.history = emptyHistory();
      await this.rebuild();
      await this.changed(`new document (${source})`);
    });
  }

  execute(command: Command, source: CommandSource): Promise<void> {
    const group = this.groupContext.getStore();
    if (group) return this.apply(command).then(() => void group.push(command));
    return this.enqueue(async () => {
      await this.apply(command);
      this.history = pushEntry(this.history, { label: command.type, commands: [command], source, at: now() });
      await this.changed(`${command.type} (${source})`);
    });
  }

  /**
   * Runs `work` as one atomic, uninterrupted edit: other clients wait until it
   * finishes, it becomes a single undo step, and if it throws nothing is kept.
   */
  group<T>(label: string, source: CommandSource, work: () => Promise<T>): Promise<T> {
    return this.outsideGroup(async () => {
      const commands: Command[] = [];
      const activeBefore = this.activeLayerId;
      let result: T;
      try {
        result = await this.groupContext.run(commands, work);
      } catch (error) {
        this.activeLayerId = activeBefore;
        await this.rebuild();
        throw error;
      }
      if (commands.length > 0) {
        this.history = pushEntry(this.history, { label, commands, source, at: now() });
        await this.changed(`${label} (${source})`);
      }
      return result;
    });
  }

  selectLayer(layerId: string): Promise<void> {
    const select = async () => {
      findLayer(this.state.meta, layerId);
      this.activeLayerId = layerId;
    };
    if (this.groupContext.getStore()) return select();
    return this.enqueue(async () => {
      await select();
      await this.changed('select_layer');
    });
  }

  undo(): Promise<boolean> {
    return this.moveCursor(undo, 'undo');
  }

  redo(): Promise<boolean> {
    return this.moveCursor(redo, 'redo');
  }

  private moveCursor(move: typeof undo, reason: string): Promise<boolean> {
    return this.outsideGroup(async () => {
      const next = move(this.history);
      if (next === this.history) return false;
      this.history = next;
      await this.rebuild();
      await this.changed(reason);
      return true;
    });
  }

  /** Applies a command to the live state, restoring the last good state if it fails. */
  private async apply(command: Command): Promise<void> {
    try {
      this.state = await applyCommand(this.state, command, this.env);
    } catch (error) {
      await this.rebuild();
      throw error;
    }
    this.followNewLayer(command);
  }

  /** Queues a job; calling it from inside a group would wait on itself forever, so that's an error. */
  private outsideGroup<T>(job: () => Promise<T>): Promise<T> {
    if (this.groupContext.getStore()) return Promise.reject(new Error('Not allowed inside a batch'));
    return this.enqueue(job);
  }

  private async rebuild(): Promise<void> {
    const pending = this.groupContext.getStore() ?? [];
    const committed = appliedEntries(this.history).flatMap((entry) => entry.commands);
    this.state = await replay(this.setup, [...committed, ...pending], this.env);
    if (!this.state.surfaces.has(this.activeLayerId)) this.activeLayerId = this.topLayerId();
  }

  private followNewLayer(command: Command): void {
    if (command.type === 'add_layer') this.activeLayerId = command.layerId;
    if (command.type === 'duplicate_layer' || command.type === 'copy_selection_to_layer' || command.type === 'stamp_visible') {
      this.activeLayerId = command.newLayerId;
    }
    if (!this.state.surfaces.has(this.activeLayerId)) this.activeLayerId = this.topLayerId();
  }

  private topLayerId(): string {
    return this.state.meta.layers[this.state.meta.layers.length - 1].id;
  }

  private async changed(reason: string): Promise<void> {
    this.version += 1;
    await this.file?.save({ setup: this.setup, history: this.history });
    this.changes.publish({ version: this.version, reason });
  }
}

function now(): string {
  return new Date().toISOString();
}
