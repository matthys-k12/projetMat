// Configuration Vitest de l'API : variables d'environnement factices,
// aucun test n'appelle le vrai Supabase (le client est mocké).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://projet-de-test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'cle-service-role-factice-pour-les-tests',
      WEB_URL: 'http://localhost:5173',
    },
  },
});
