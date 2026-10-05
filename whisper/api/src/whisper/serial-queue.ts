/**
 * Runs tasks one at a time, in arrival order. whisper.cpp already uses every
 * core, and nodejs-whisper calls `shelljs.cd()` on the process, so running two
 * transcriptions at once is both slower and unsafe.
 */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task, task);
    this.tail = result.catch(() => undefined);
    return result;
  }
}
