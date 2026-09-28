// Configuration Vite (serveur de dev, build) et Vitest (tests des composants).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dossier = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // « @/… » pointe vers src/ (même alias que components.json de shadcn)
    alias: { '@': path.resolve(dossier, 'src') },
  },
  server: { port: 5173 },
  // Le paquet principal (~540 ko : React, Radix, supabase-js) est chargé par tous les écrans ;
  // l'administration et Recharts sont déjà découpés à part (voir app/routeur.jsx).
  build: { chunkSizeWarningLimit: 600 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/preparation.js'],
    include: ['src/**/*.test.{js,jsx}'],
    env: {
      VITE_API_URL: 'http://localhost:3000/api/v1',
      VITE_SUPABASE_URL: 'https://projet-de-test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'cle-anon-factice',
    },
  },
});
