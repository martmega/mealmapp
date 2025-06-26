import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import UserProfilePage from '../pages/UserProfilePage.jsx';

var recipeFilterCalls;
const recipesData = [
  { id: '1', user_id: 'user2', name: 'Public Recipe', visibility: 'public' },
  {
    id: '2',
    user_id: 'user2',
    name: 'Friends Recipe',
    visibility: 'friends_only',
  },
  { id: '3', user_id: 'user2', name: 'Private Recipe', visibility: 'private' },
];

vi.mock('../lib/supabase', () => {
  recipeFilterCalls = {};
  function createQuery(returnData) {
    const q = {};
    q.select = vi.fn(() => q);
    q.eq = vi.fn((col, val) => {
      if (col === 'visibility') recipeFilterCalls.eq = [col, val];
      if (col === 'visibility') {
        returnData = returnData.filter((r) => r.visibility === val);
      }
      return q;
    });
    q.in = vi.fn((col, val) => {
      if (col === 'visibility') recipeFilterCalls.in = [col, val];
      if (col === 'visibility') {
        returnData = returnData.filter((r) => val.includes(r.visibility));
      }
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
          Promise.resolve({
            data: { id: 'user2', username: 'User 2' },
            error: null,
          })
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
  it('shows public and friends_only recipes for friends', async () => {
    const session = { user: { id: 'user1' } };
    const { queryByText, findByText } = render(
      <MemoryRouter initialEntries={['/user2']}>
        <Routes>
          <Route
            path="/:userId"
            element={<UserProfilePage session={session} />}
          />
        </Routes>
      </MemoryRouter>
    );

    await findByText('Public Recipe');
    await findByText('Friends Recipe');
    expect(queryByText('Private Recipe')).not.toBeInTheDocument();
    expect(recipeFilterCalls.in).toEqual([
      'visibility',
      ['public', 'friends_only'],
    ]);
  });

  it('shows only public recipes when not logged in', async () => {
    const { queryByText, findByText } = render(
      <MemoryRouter initialEntries={['/user2']}>
        <Routes>
          <Route path="/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await findByText('Public Recipe');
    expect(queryByText('Friends Recipe')).not.toBeInTheDocument();
    expect(queryByText('Private Recipe')).not.toBeInTheDocument();
    expect(recipeFilterCalls.eq).toEqual(['visibility', 'public']);
  });
});
