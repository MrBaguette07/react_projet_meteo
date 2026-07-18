"use client";

export interface StorageStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
}

interface CreateStorageStoreOptions<T> {
  key: string;
  area: "local" | "session";
  parse: (raw: string) => T;
  fallback: T;
}

export function createStorageStore<T>({
  key,
  area,
  parse,
  fallback,
}: CreateStorageStoreOptions<T>): StorageStore<T> {
  let snapshot: T = fallback;
  let hasReadStorage = false;
  const listeners = new Set<() => void>();

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
      if (!hasReadStorage) {
        hasReadStorage = true;
        readFromStorage();
      }

      listeners.add(listener);

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
