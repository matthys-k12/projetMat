/**
 * Composant racine : fournisseurs globaux (données, authentification, toasts) + routeur.
 * Tier : présentation.
 */
import { Fournisseurs } from './app/fournisseurs';
import { Routeur } from './app/routeur';

export default function App() {
  return (
    <Fournisseurs>
      <Routeur />
    </Fournisseurs>
  );
}
