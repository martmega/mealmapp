import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignedImage from '../components/SignedImage.jsx';
import * as images from '../lib/images.js';
import recipeImage from '../../tests/fixtures/recipe-image.json';
import { SUPABASE_BUCKETS } from '../config/constants';
const { DEFAULT_IMAGE_URL } = images;

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

    render(<SignedImage bucket={SUPABASE_BUCKETS.recipes} path="image.jpg" alt="image" />);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', signedUrl);
  });

  it('falls back to default image when API fails', async () => {
    mockFetch({ ok: false });

    render(<SignedImage bucket={SUPABASE_BUCKETS.recipes} path="image.jpg" alt="image" />);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', DEFAULT_IMAGE_URL);
  });

  it('loads a signed URL for the fixture path', async () => {
    const signedUrl = 'https://example.com/fixture.png';
    vi.spyOn(images, 'getSignedImageUrl').mockResolvedValue(signedUrl);

    render(
      <SignedImage bucket={recipeImage.bucket} path={recipeImage.path} alt="fixture" />
    );

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', signedUrl);
    expect(images.getSignedImageUrl).toHaveBeenCalledWith(
      recipeImage.bucket,
      recipeImage.path,
      DEFAULT_IMAGE_URL
    );
  });
});
