/**
 * This utility injects environment variables into the window.ENV object
 * for client-side access to environment variables.
 */

export function injectEnv() {
  if (typeof window !== 'undefined') {
    // Initialize window.ENV if it doesn't exist
    window.ENV = window.ENV || {};
    
    // Inject environment variables from import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // Only inject variables that start with VITE_
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          // Remove VITE_ prefix and store in window.ENV
          const envKey = key.replace('VITE_', '');
          window.ENV[envKey] = import.meta.env[key];
        }
      });
    }
    
    console.log('Environment variables injected into window.ENV');
  }
}

// Auto-execute the function
injectEnv();