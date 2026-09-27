/**
 * Point d'entrée : démarre le serveur HTTP de l'API.
 *
 * Tier : métier. Lancé par « npm run dev » (node --watch) ou « npm start ».
 * La construction de l'app est séparée (app.js) pour pouvoir la tester sans ouvrir de port.
 */
import { env } from './config/env.js';
import { creerApp } from './app.js';

const app = creerApp();

app.listen(env.PORT, () => {
  console.log(`API démarrée sur http://localhost:${env.PORT}/api/v1`);
  console.log(`Documentation : http://localhost:${env.PORT}/api/docs`);
});
