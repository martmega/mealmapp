import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewMenuModal from '../components/NewMenuModal.jsx';

// Simple style test to ensure overlay classes are applied

describe('NewMenuModal overlay style', () => {
  it('applies the expected overlay classes', () => {
    render(<NewMenuModal onCreate={() => {}} friends={[]} />);
    const trigger = screen.getByRole('button', { name: 'Créer un menu' });
    fireEvent.click(trigger);

    const overlay = document.querySelector('.backdrop-blur-md');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('bg-surface/90');
  });
});
