import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// VITE_SINGLE_FILE=1: um único bundle JS (sem code splitting) para a página única do artifact (tools/artifact/inline.mjs).
const single = !!process.env.VITE_SINGLE_FILE;

/** /apresentacao/ (public/) abre o index.html estático em vez do fallback da SPA, no dev e no preview. Em produção o Cloudflare Pages já faz isso. */
const presentation = () => {
  const mw = (req: { url?: string }, _res: unknown, next: () => void) => { if (/^\/apresentacao\/?(\?.*)?$/.test(req.url ?? '')) req.url = '/apresentacao/index.html'; next(); };
  return { name: 'biweb-presentation', configureServer: (srv: { middlewares: { use: (f: typeof mw) => void } }) => { srv.middlewares.use(mw); }, configurePreviewServer: (srv: { middlewares: { use: (f: typeof mw) => void } }) => { srv.middlewares.use(mw); } };
};

export default defineConfig({
  plugins: [react(), tailwindcss(), presentation()],
  server: { port: 5173 },
  // Caminhos relativos no build estático (VITE_HASH_HISTORY=1).
  base: process.env.VITE_HASH_HISTORY ? './' : '/',
  build: {
    // Orçamento de bundle (docs/architecture/24): shell inicial pequeno; builder em chunk próprio.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        ...(single ? { inlineDynamicImports: true } : {}),
        // Sem manualChunks: o agrupamento manual (aria/react/vendor) gerava dependência circular
        // entre chunks e quebrava o build de produção ("Cannot access 'm' before initialization").
      },
    },
  },
});
