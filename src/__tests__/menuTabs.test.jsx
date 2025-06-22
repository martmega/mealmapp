import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import MenuTabs from '../components/MenuTabs.jsx';

const sampleMenus = [
  { id: '1', user_id: 'user1', name: 'Menu 1' },
  { id: '2', user_id: 'user1', name: 'Menu 2' },
];

function Wrapper() {
  const [menus, setMenus] = useState(sampleMenus);
  const [activeId, setActiveId] = useState(sampleMenus[0].id);

  const handleRename = (id, name) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name } : m))
    );
  };

  const handleDelete = (id) => {
    setMenus((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <MenuTabs
      menus={menus}
      activeMenuId={activeId}
      onSelect={setActiveId}
      currentUserId="user1"
      onRename={handleRename}
      onDelete={handleDelete}
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
      />
    );

    const tab = screen.getByRole('tab', { name: 'Menu 2' });
    fireEvent.mouseDown(tab, { button: 0 });
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('suppression et renommage modifient le state', () => {
    render(<Wrapper />);

    vi.spyOn(window, 'prompt').mockReturnValue('Menu Renommé');
    const tab1 = screen.getByRole('tab', { name: 'Menu 1' });
    const renameBtn = within(tab1).getByLabelText('Renommer');
    fireEvent.click(renameBtn);
    expect(
      screen.getByRole('tab', { name: 'Menu Renommé' })
    ).toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteBtn = within(
      screen.getByRole('tab', { name: 'Menu Renommé' })
    ).getByLabelText('Supprimer');
    fireEvent.click(deleteBtn);
    expect(
      screen.queryByRole('tab', { name: 'Menu Renommé' })
    ).not.toBeInTheDocument();
  });

  it('affiche un message et un bouton quand la liste est vide', () => {
    render(<MenuTabs menus={[]} onCreate={() => {}} />);

    expect(
      screen.getByText('Aucun menu disponible pour le moment')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer un menu' })).toBeInTheDocument();
  });
});
