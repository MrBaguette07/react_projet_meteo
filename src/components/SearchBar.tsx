"use client";

/**
 * Recherche de villes avec suggestions en temps réel.
 *
 * Construite sur `Command` (cmdk) et `Popover` de shadcn/ui, qui apportent la
 * sémantique ARIA `combobox`/`listbox` et la navigation clavier. Le filtrage
 * intégré de cmdk est **désactivé** (`shouldFilter={false}`) : les résultats
 * viennent du serveur de géocodage, les refiltrer côté client masquerait des
 * correspondances pertinentes (« Lyon » proposé pour « lyo » par exemple).
 *
 * Trois mécanismes limitent le trafic réseau :
 *  - un **debounce** de 280 ms, qui laisse passer la frappe avant d'interroger l'API ;
 *  - un **cache mémoire** (`Map` conservée entre les rendus via `useRef`), qui rend
 *    instantanée toute requête déjà vue - typiquement lorsqu'on efface un caractère ;
 *  - un **AbortController**, qui annule la requête précédente afin qu'une réponse
 *    lente arrivant après une plus récente n'écrase pas les suggestions affichées.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search } from "lucide-react";
import type { GeocodingApiResponse } from "@/app/api/geocoding/route";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cityHref, countryFlag, formatCitySubtitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/types";

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

interface SearchBarProps {
  /**
   * Comportement à la sélection d'une ville.
   * Par défaut, on navigue vers sa page de détail ; le comparateur, lui,
   * ajoute la ville à sa sélection sans quitter la page.
   */
  onSelect?: (city: City) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Agrandit le champ, pour l'usage en élément principal de la page d'accueil. */
  size?: "default" | "lg";
  className?: string;
}

export function SearchBar({
  onSelect,
  placeholder = "Rechercher une ville…",
  autoFocus = false,
  size = "default",
  className,
}: SearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Résultats, chargement et erreur forment un seul état : ils changent toujours
   * ensemble, et les regrouper interdit par construction les combinaisons
   * incohérentes du type « en cours de chargement ET en erreur ».
   */
  const [search, setSearch] = useState<{
    results: City[];
    isLoading: boolean;
    error: string | null;
  }>({ results: [], isLoading: false, error: null });

  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef(new Map<string, City[]>());
  const abortRef = useRef<AbortController | null>(null);

  // Recherche débouncée. Aucun `setState` n'est appelé dans le corps de l'effet :
  // tout passe par le callback du timer, ce qui évite un rendu en cascade au montage.
  // Le nettoyage annule à la fois le timer et la requête encore en vol.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const timer = setTimeout(async () => {
      const key = trimmed.toLowerCase();

      // Requête déjà vue - typiquement après l'effacement d'un caractère.
      const cached = cacheRef.current.get(key);
      if (cached) {
        setSearch({ results: cached, isLoading: false, error: null });
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearch((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/geocoding?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));

        const data: GeocodingApiResponse = await response.json();
        cacheRef.current.set(key, data.results);
        setSearch({ results: data.results, isLoading: false, error: null });
      } catch (cause) {
        // Une annulation volontaire n'est pas une erreur à signaler à l'utilisateur :
        // une requête plus récente est déjà en cours et produira l'affichage final.
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSearch({ results: [], isLoading: false, error: "Recherche momentanément indisponible." });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  // Sous le seuil de déclenchement, la liste est vide et rien ne charge - inutile
  // de le réécrire dans l'état, la valeur se déduit de la saisie courante.
  const isQueryLongEnough = query.trim().length >= MIN_QUERY_LENGTH;
  const results = isQueryLongEnough ? search.results : [];
  const isLoading = isQueryLongEnough && search.isLoading;
  const error = isQueryLongEnough ? search.error : null;

  const selectCity = useCallback(
    (city: City) => {
      setIsOpen(false);
      if (onSelect) {
        setQuery("");
        onSelect(city);
        // Le champ garde le focus : le comparateur invite à enchaîner les ajouts.
        inputRef.current?.focus();
      } else {
        setQuery(city.name);
        router.push(cityHref(city));
      }
    },
    [onSelect, router],
  );

  const showPopover = isOpen && isQueryLongEnough;

  return (
    /**
     * Le champ est rendu **à l'intérieur** de `Command`, et non dans le popover.
     *
     * cmdk installe son gestionnaire de touches sur sa racine : les flèches et
     * Entrée frappées dans le champ y remontent donc naturellement et pilotent la
     * liste, sans avoir à recâbler quoi que ce soit. Le popover étant rendu dans
     * un portail, seul le DOM est déplacé - l'arbre React, lui, reste intact, si
     * bien que le contexte et la propagation des évènements continuent de
     * fonctionner. Les styles de conteneur de `Command` sont neutralisés puisque
     * la surface visible est celle du popover.
     */
    <Command
      shouldFilter={false}
      loop
      className="overflow-visible rounded-none! bg-transparent p-0"
    >
      <Popover open={showPopover} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <div className={cn("relative", className)}>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              ref={inputRef}
              type="search"
              value={query}
              autoFocus={autoFocus}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsOpen(false);
                if (event.key === "ArrowDown" && !showPopover) setIsOpen(true);
              }}
              placeholder={placeholder}
              aria-label="Rechercher une ville"
              className={cn(
                "bg-card pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden",
                size === "lg" && "h-12 text-base md:text-base",
              )}
            />

            {isLoading && (
              <Loader2
                className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) p-1"
          // Le focus reste dans le champ : l'utilisateur continue de taper pendant
          // que la liste se met à jour sous ses yeux.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <CommandList className="max-h-72">
            {error ? (
              <div className="px-4 py-6 text-center text-sm text-destructive">{error}</div>
            ) : (
              <>
                <CommandEmpty>
                  {isLoading ? "Recherche…" : `Aucune ville ne correspond à « ${query.trim()} ».`}
                </CommandEmpty>

                {results.length > 0 && (
                  <CommandGroup heading="Villes">
                    {results.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={String(city.id)}
                        onSelect={() => selectCity(city)}
                        className="gap-3"
                      >
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-muted font-mono text-[0.625rem] font-semibold text-muted-foreground"
                          aria-hidden="true"
                        >
                          {city.countryCode || <MapPin className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{city.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {formatCitySubtitle(city)}
                          </span>
                        </span>
                        <span className="shrink-0 text-base" aria-hidden="true">
                          {countryFlag(city.countryCode)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
