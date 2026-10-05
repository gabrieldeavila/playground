import { SerialQueue } from './serial-queue';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('SerialQueue', () => {
  it('runs tasks one at a time in order', async () => {
    const queue = new SerialQueue();
    const events: string[] = [];

    const task = (name: string, ms: number) => async () => {
      events.push(`start ${name}`);
      await wait(ms);
      events.push(`end ${name}`);
      return name;
    };

    const results = await Promise.all([
      queue.run(task('a', 20)),
      queue.run(task('b', 1)),
    ]);

    expect(results).toEqual(['a', 'b']);
    expect(events).toEqual(['start a', 'end a', 'start b', 'end b']);
  });

  it('keeps running after a task fails', async () => {
    const queue = new SerialQueue();

    await expect(
      queue.run(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    await expect(queue.run(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});
