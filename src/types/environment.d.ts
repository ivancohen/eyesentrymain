declare global {
  interface Window {
    ENV: {
      GEMINI_API_KEY?: string;
      [key: string]: any;
    };
  }

  // For Vite's import.meta.env
  interface ImportMeta {
    env: {
      VITE_GEMINI_API_KEY?: string;
      [key: string]: any;
    };
  }
}

export {};