import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignedImage from '../components/SignedImage.jsx';
import { DEFAULT_IMAGE_URL } from '../lib/images.js';

// Helper to mock fetch responses
function mockFetch(response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SignedImage', () => {
  it('uses the signed URL returned by the API', async () => {
    const signedUrl = 'https://example.com/signed.jpg';
    mockFetch({ ok: true, json: () => Promise.resolve({ url: signedUrl }) });

    render(<SignedImage bucket="recipe-images" path="image.jpg" alt="image" />);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', signedUrl);
  });

  it('falls back to default image when API fails', async () => {
    mockFetch({ ok: false });

    render(<SignedImage bucket="recipe-images" path="image.jpg" alt="image" />);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', DEFAULT_IMAGE_URL);
  });
});
