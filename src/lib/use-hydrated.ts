"use client";

import { useSyncExternalStore } from "react";

/** Abonnement inerte : la valeur ne change jamais après l'hydratation. */
const noopSubscribe = () => () => {};

/**
 * Indique si le composant s'exécute après l'hydratation côté client.
 *
 * Utile pour distinguer « je ne sais pas encore » de « la liste est vide » : sans
 * cette information, la page d'accueil afficherait brièvement « aucun favori » à un
 * utilisateur qui en possède, le temps que le stockage local soit lu.
 *
 * L'implémentation passe par `useSyncExternalStore` plutôt qu'un `useState` + effet :
 * React garantit ainsi que le rendu d'hydratation utilise `false` — donc identique
 * au HTML serveur — puis bascule à `true` sans risque de divergence.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
