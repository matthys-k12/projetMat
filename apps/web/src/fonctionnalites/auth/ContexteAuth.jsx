/**
 * Contexte d'authentification : session Supabase + profil de l'utilisateur.
 *
 * Tier : présentation. Utilisé par : fournisseurs.jsx, gardes, mise en page, pages.
 *
 * Le SDK Supabase ne sert ici qu'à signInWithPassword, signOut, getSession et
 * onAuthStateChange. Le profil (nom, rôle) est chargé via l'API (GET /auth/me) :
 * le rôle affiché est celui de la base, pas celui du token.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { lireMonProfil, revoquerSession } from './api';

/**
 * @typedef {Object} ValeurAuth
 * @property {'chargement'|'connecte'|'deconnecte'} etat
 * @property {{ id: string, email: string, prenom: string, nom: string, nomComplet: string, role: 'USER'|'ADMIN' }|null} profil
 * @property {boolean} estAdmin
 * @property {(email: string, motDePasse: string) => Promise<void>} seConnecter
 * @property {() => Promise<void>} seDeconnecter
 */

/** @type {import('react').Context<ValeurAuth|null>} */
export const ContexteAuth = createContext(null);

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function FournisseurAuth({ children }) {
  const clientRequetes = useQueryClient();
  const [profil, setProfil] = useState(null);
  const [etat, setEtat] = useState('chargement');

  /** Charge le profil via l'API ; en cas d'échec, on considère l'utilisateur déconnecté. */
  const chargerProfil = useCallback(async () => {
    try {
      setProfil(await lireMonProfil());
      setEtat('connecte');
    } catch {
      await supabase.auth.signOut();
      setProfil(null);
      setEtat('deconnecte');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) chargerProfil();
      else setEtat('deconnecte');
    });

    // Déconnexion depuis un autre onglet ou expiration du rafraîchissement
    const { data } = supabase.auth.onAuthStateChange((evenement) => {
      if (evenement === 'SIGNED_OUT') {
        setProfil(null);
        setEtat('deconnecte');
        clientRequetes.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [chargerProfil, clientRequetes]);

  const seConnecter = useCallback(
    async (email, motDePasse) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      if (error) throw error;
      await chargerProfil();
    },
    [chargerProfil],
  );

  const seDeconnecter = useCallback(async () => {
    await revoquerSession().catch(() => {});
    await supabase.auth.signOut();
  }, []);

  const valeur = useMemo(
    () => ({ etat, profil, estAdmin: profil?.role === 'ADMIN', seConnecter, seDeconnecter }),
    [etat, profil, seConnecter, seDeconnecter],
  );

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}
