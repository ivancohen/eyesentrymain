import { jest } from '@jest/globals';
export const supabase = {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {
        signIn: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChange: jest.fn(),
    },
};
