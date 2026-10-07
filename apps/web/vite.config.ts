import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // Caminhos relativos no build estático (VITE_HASH_HISTORY=1).
  base: process.env.VITE_HASH_HISTORY ? './' : '/',
  build: {
    // Orçamento de bundle (docs/architecture/24): shell inicial pequeno; builder em chunk próprio.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](react-aria|@react-aria|@react-stately|@react-types|@internationalized)/.test(id)) return 'aria';
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('@tanstack')) return 'router';
          if (/[\\/](react-intl|@formatjs|intl-messageformat)/.test(id)) return 'intl';
          return 'vendor';
        },
      },
    },
  },
});
