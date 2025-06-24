import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignedImage from '../components/SignedImage.jsx';
import imageInfo from '../../tests/fixtures/recipe-image.json';

vi.mock('../lib/images', () => {
  return {
    DEFAULT_IMAGE_URL: '/placeholder.png',
    getSignedImageUrl: vi.fn(() => Promise.resolve('https://example.com/signed.png')),
  };
});

describe('SignedImage', () => {
  it('loads the signed URL for the image', async () => {
    render(<SignedImage bucket={imageInfo.bucket} path={imageInfo.path} alt="test" />);
    await waitFor(() => {
      expect(screen.getByAltText('test')).toHaveAttribute('src', 'https://example.com/signed.png');
    });
  });
});
