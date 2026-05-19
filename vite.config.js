import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is set so GitHub Pages serves under /cuarena-dashboard/.
// Dev server is unaffected (still serves on '/').
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/cuarena-dashboard/' : '/',
  server: {
    port: 5173,
    open: true,
  },
}));
