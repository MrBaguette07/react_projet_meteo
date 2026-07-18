"use client";

/**
 * Petit store synchronisé avec `localStorage` / `sessionStorage`.
 *
 * Le stockage du navigateur est une source de vérité **externe** à React. Le lire
 * dans un `useEffect` pour recopier la valeur dans un état provoquerait un rendu en
 * cascade à chaque montage — ce que React 19 signale désormais explicitement.
 * On expose donc le contrat attendu par `useSyncExternalStore` : un abonnement, un
 * instantané client et un instantané serveur.
 *
 * `getServerSnapshot()` renvoie toujours la valeur de repli : le serveur n'a pas
 * accès au stockage, et React utilise cet instantané pour toute l'hydratation, ce
 * qui écarte par construction les divergences serveur/client.
 */

export interface StorageStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  /** Remplace la valeur, la persiste et notifie les abonnés. */
  set: (value: T) => void;
}

interface CreateStorageStoreOptions<T> {
  /** Clé de stockage, versionnée pour permettre des évolutions de format. */
  key: string;
  area: "local" | "session";
  /** Valide et convertit le contenu brut ; doit tolérer une donnée corrompue. */
  parse: (raw: string) => T;
  /** Valeur utilisée côté serveur, et en cas de stockage vide ou illisible. */
  fallback: T;
}

export function createStorageStore<T>({
  key,
  area,
  parse,
  fallback,
}: CreateStorageStoreOptions<T>): StorageStore<T> {
  // `snapshot` doit rester référentiellement stable entre deux lectures inchangées,
  // faute de quoi `useSyncExternalStore` boucherait indéfiniment.
  let snapshot: T = fallback;
  let hasReadStorage = false;
  const listeners = new Set<() => void>();

  /** Accès défensif : le stockage est inaccessible en navigation privée stricte. */
  function getStorage(): Storage | null {
    try {
      return area === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  function readFromStorage(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      const raw = storage.getItem(key);
      snapshot = raw ? parse(raw) : fallback;
    } catch {
      snapshot = fallback;
    }
  }

  function emit(): void {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      // Première lecture différée au premier abonnement, donc jamais pendant le
      // rendu serveur. React relit l'instantané juste après `subscribe()` et
      // déclenche le rendu nécessaire si la valeur a changé.
      if (!hasReadStorage) {
        hasReadStorage = true;
        readFromStorage();
      }

      listeners.add(listener);

      // Répercute les modifications faites depuis un autre onglet.
      function handleStorageEvent(event: StorageEvent) {
        if (event.key !== key) return;
        readFromStorage();
        emit();
      }

      window.addEventListener("storage", handleStorageEvent);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", handleStorageEvent);
      };
    },

    getSnapshot: () => snapshot,
    getServerSnapshot: () => fallback,

    set(value) {
      snapshot = value;
      try {
        getStorage()?.setItem(key, JSON.stringify(value));
      } catch {
        // Quota atteint ou stockage refusé : la valeur reste valable en mémoire
        // pour la session en cours, seule la persistance est perdue.
      }
      emit();
    },
  };
}
