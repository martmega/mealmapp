import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import UserProfilePage from '../pages/UserProfilePage.jsx';

var recipeFilterCalls;
const recipesData = [
  { id: '1', user_id: 'user2', name: 'Public Recipe', is_public: true },
  { id: '2', user_id: 'user2', name: 'Private Recipe', is_public: false },
];

vi.mock('../lib/supabase', () => {
  recipeFilterCalls = {};
  function createQuery(returnData) {
    const q = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn((col, val) => {
      if (col === 'is_public') recipeFilterCalls.eq = [col, val];
      return q;
    });
    q.in = vi.fn((col, val) => {
      if (col === 'is_public') recipeFilterCalls.in = [col, val];
      return q;
    });
    q.or = vi.fn(() => q);
    q.limit = vi.fn(() => q);
    q.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
    q.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
    q.order = vi.fn(() => Promise.resolve({ data: returnData, error: null }));
    return q;
  }
  const supabase = {
    from: (table) => {
      if (table === 'public_user_view') {
        const q = createQuery([{ id: 'user2', username: 'User 2' }]);
        q.eq = vi.fn(() => q);
        q.single = vi.fn(() =>
          Promise.resolve({ data: { id: 'user2', username: 'User 2' }, error: null })
        );
        return q;
      }
      if (table === 'user_relationships') {
        const q = createQuery([]);
        q.select = vi.fn(() => q);
        q.or = vi.fn(() => q);
        q.in = vi.fn(() => q);
        q.limit = vi.fn(() => q);
        q.maybeSingle = vi.fn(() =>
          Promise.resolve({
            data: {
              id: 'rel1',
              requester_id: 'user1',
              addressee_id: 'user2',
              status: 'accepted',
            },
            error: null,
          })
        );
        return q;
      }
      if (table === 'recipes') {
        const q = createQuery(recipesData);
        return q;
      }
      return createQuery([]);
    },
  };
  return { getSupabase: () => supabase };
});

vi.mock('../hooks/useSessionRequired', () => ({
  default: () => {},
}));

vi.mock('../components/FriendActionButton.jsx', () => ({
  default: () => <div>friend-button</div>,
}));

describe('UserProfilePage recipe visibility', () => {
  it('shows private recipes when users are friends', async () => {
    const session = { user: { id: 'user1' } };
    const { findByText } = render(
      <MemoryRouter initialEntries={['/user2']}>
        <Routes>
          <Route path="/:userId" element={<UserProfilePage session={session} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await findByText('Private Recipe')).toBeInTheDocument();
    expect(recipeFilterCalls.in).toEqual(['is_public', [true, false]]);
  });
});
