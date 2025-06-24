import { describe, it, expect } from 'vitest';
import { allowedVisibilities } from '../lib/relationships.js';

describe('allowedVisibilities', () => {
  it('includes friend-only recipes when status is friends', () => {
    const result = allowedVisibilities('user1', 'user2', 'friends');
    expect(result).toEqual(['public', 'friends_only']);
  });
});
