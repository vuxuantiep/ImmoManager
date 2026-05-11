
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Wichtig für das Hosting unter itpiep.de/ImmoTiep/
  base: '/ImmoTiep/',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true
  }
});
