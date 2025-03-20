// Add any global test setup here
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock Vite's import.meta.env
const mockEnv = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  BASE_URL: '/',
} as const;

// Mock import.meta.env
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv,
    },
  },
  writable: true,
});

// Mock fetch
const mockFetch = jest.fn().mockImplementation(() => 
  Promise.resolve(new Response())
) as unknown as typeof fetch;

Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 