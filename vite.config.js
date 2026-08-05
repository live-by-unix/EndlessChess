import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { base44 } from '@base44/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // Can be removed once your project has been migrated to @base44/sdk imports.
      legacySDKImports:
        process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',

      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true,
    }),

    react(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
