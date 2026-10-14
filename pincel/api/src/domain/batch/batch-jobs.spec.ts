import { describe, expect, it } from 'vitest';
import { batchJobs, isImageFile } from './batch-jobs.js';

describe('isImageFile', () => {
  it('accepts the formats the editor opens', () => {
    expect(isImageFile('/a/IMG_1.JPG')).toBe(true);
    expect(isImageFile('b.webp')).toBe(true);
    expect(isImageFile('notes.txt')).toBe(false);
    expect(isImageFile('.DS_Store')).toBe(false);
  });
});

describe('batchJobs', () => {
  it('saves each result under the input name, in the chosen format', () => {
    const jobs = batchJobs(['/in/shoe.jpg', '/in/bag.png'], '/out', 'png', 'remove the white background');
    expect(jobs.map((job) => job.output)).toEqual(['/out/shoe.png', '/out/bag.png']);
    expect(jobs[0].request).toBe(
      "Input image: /in/shoe.jpg\n\nremove the white background\n\n(The result is saved automatically when you finish; don't call export_image.)",
    );
  });

  it('numbers inputs that would end up with the same output name', () => {
    const jobs = batchJobs(['/a/shoe.jpg', '/a/shoe.png', '/b/shoe.jpg'], '/out', 'jpg', 'x');
    expect(jobs.map((job) => job.output)).toEqual(['/out/shoe.jpg', '/out/shoe-2.jpg', '/out/shoe-3.jpg']);
  });
});
