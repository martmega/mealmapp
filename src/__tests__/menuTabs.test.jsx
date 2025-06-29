import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuTabs from '../components/MenuTabs.jsx';

const sampleMenus = [
  { id: '1', user_id: 'user1', name: 'Menu 1' },
  { id: '2', user_id: 'user1', name: 'Menu 2' },
];

const sharedMenu = [
  { id: '1', user_id: 'user1', name: 'Menu 1', is_shared: true },
];

const sharedMenuOtherUser = [
  {
    id: '1',
    user_id: 'user2',
    name: 'Menu ami',
    is_shared: true,
    owner: { username: 'Ami' },
  },
];

function Wrapper() {
  const [menus, setMenus] = useState(sampleMenus);
  const [activeId, setActiveId] = useState(sampleMenus[0].id);

  const handleDelete = (id) => {
    setMenus((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreate = () => {
    const newId = String(menus.length + 1);
    setMenus((prev) => [
      ...prev,
      { id: newId, user_id: 'user1', name: 'Menu sans titre' },
    ]);
    setActiveId(newId);
  };

  return (
    <MenuTabs
      menus={menus}
      activeMenuId={activeId}
      onSelect={setActiveId}
      currentUserId="user1"
      onDelete={handleDelete}
      onCreate={handleCreate}
      friends={[]}
    />
  );
}

describe('MenuTabs', () => {
  it('affiche les onglets', () => {
    render(
      <MenuTabs
        menus={sampleMenus}
        activeMenuId="1"
        onSelect={() => {}}
        currentUserId="user1"
        friends={[]}
      />
    );

    expect(screen.getByRole('tab', { name: 'Menu 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Menu 2' })).toBeInTheDocument();
  });

  it('affiche le bon menu au clic', () => {
    const onSelect = vi.fn();
    render(
      <MenuTabs
        menus={sampleMenus}
        activeMenuId="1"
        onSelect={onSelect}
        currentUserId="user1"
        friends={[]}
      />
    );

    const tab = screen.getByRole('tab', { name: 'Menu 2' });
    fireEvent.mouseDown(tab, { button: 0 });
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('supprime un menu au clic sur la croix', () => {
    render(<Wrapper />);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteBtn = within(
      screen.getByRole('tab', { name: 'Menu 1' })
    ).getByLabelText('Supprimer');
    fireEvent.click(deleteBtn);
    expect(
      screen.queryByRole('tab', { name: 'Menu 1' })
    ).not.toBeInTheDocument();
  });

  it('cree un nouveau menu via le bouton', () => {
    render(<Wrapper />);
    const createBtn = screen.getByRole('button', { name: '+ Nouveau menu' });
    fireEvent.click(createBtn);
    const confirm = screen.getByRole('button', { name: 'Créer' });
    fireEvent.click(confirm);
    expect(
      screen.getByRole('tab', { name: 'Menu sans titre' })
    ).toBeInTheDocument();
  });

  it('affiche un message et un bouton quand la liste est vide', () => {
    render(<MenuTabs menus={[]} onCreate={() => {}} friends={[]} />);

    expect(
      screen.getByText('Aucun menu disponible pour le moment')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Créer un menu' })
    ).toBeInTheDocument();
  });

  it('applique le style partage sur un menu', () => {
    render(
      <MenuTabs
        menus={sharedMenu}
        activeMenuId="1"
        onSelect={() => {}}
        currentUserId="user1"
        friends={[]}
      />
    );

    const tab = screen.getByRole('tab', { name: 'Menu 1' });
    expect(tab).toHaveClass('violetStyle');
    expect(tab).toHaveClass('data-[state=active]:bg-pastel-primary');
  });

  it("affiche le badge avec le nom du propriétaire pour un menu partagé par un autre utilisateur", () => {
    render(
      <MenuTabs
        menus={sharedMenuOtherUser}
        activeMenuId="1"
        onSelect={() => {}}
        currentUserId="user1"
        friends={[]}
      />
    );

    const tab = screen.getByRole('tab', { name: /Menu ami/ });
    expect(within(tab).getByText('Partagé par Ami')).toBeInTheDocument();
  });

  it("n'affiche pas le bouton supprimer pour un menu partagé par un autre utilisateur", () => {
    render(
      <MenuTabs
        menus={sharedMenuOtherUser}
        activeMenuId="1"
        onSelect={() => {}}
        currentUserId="user1"
        friends={[]}
      />
    );

    const tab = screen.getByRole('tab', { name: /Menu ami/ });
    expect(within(tab).queryByLabelText('Supprimer')).toBeNull();
    expect(tab).toHaveClass('mintStyleWithBadge');
    expect(within(tab).getByText('Partagé par Ami')).toBeInTheDocument();
  });
});
