import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticipantWeights from '../components/ParticipantWeights.jsx';

const participants = [
  { id: '1', username: 'Mars', avatar_url: null },
  { id: '2', username: 'Agamar', avatar_url: null },
];

describe('ParticipantWeights', () => {
  it('renders weight inputs and handles changes', () => {
    const weights = { 1: 0.6, 2: 0.4 };
    const onChange = vi.fn();
    render(
      <ParticipantWeights
        participants={participants}
        weights={weights}
        onWeightChange={onChange}
      />
    );
    const marsInput = screen.getByDisplayValue('0.6');
    expect(marsInput).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.4')).toBeInTheDocument();
    fireEvent.change(marsInput, { target: { value: '0.7' } });
    expect(onChange).toHaveBeenCalledWith('1', 0.7);
  });
});
