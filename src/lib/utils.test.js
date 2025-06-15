import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });
});
