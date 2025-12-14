import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock environment variables
vi.stubEnv('VITE_OPENROUTER_API_KEY', 'test_api_key');

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Clear localStorage after each test
  localStorage.clear();
});

// Add custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to be in the document`
          : `expected element to be in the document`,
    };
  },
});
