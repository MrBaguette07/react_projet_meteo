"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import type { GeocodingApiResponse } from "@/app/api/geocoding/route";
import { useGeolocation } from "@/lib/use-geolocation";
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
  onSelect?: (city: City) => void;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "default" | "lg";
  showGeolocation?: boolean;
  className?: string;
}

export function SearchBar({
  onSelect,
  placeholder = "Rechercher une ville…",
  autoFocus = false,
  size = "default",
  showGeolocation = false,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const { isLocating, error: geolocationError, locate, clearError } = useGeolocation();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [search, setSearch] = useState<{
    results: City[];
    isLoading: boolean;
    error: string | null;
  }>({ results: [], isLoading: false, error: null });

  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef(new Map<string, City[]>());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const timer = setTimeout(async () => {
      const key = trimmed.toLowerCase();

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
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSearch({ results: [], isLoading: false, error: "Recherche momentanément indisponible." });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

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
        inputRef.current?.focus();
      } else {
        setQuery(city.name);
        router.push(cityHref(city));
      }
    },
    [onSelect, router],
  );

  const selectCurrentPosition = useCallback(async () => {
    setIsOpen(false);
    const city = await locate();
    if (city) selectCity(city);
  }, [locate, selectCity]);

  const showPopover = isOpen && isQueryLongEnough;

  return (
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
                "bg-card pl-10 [&::-webkit-search-cancel-button]:hidden",
                showGeolocation ? "pr-20" : "pr-10",
                size === "lg" && "h-12 text-base md:text-base",
              )}
            />

            {isLoading && (
              <Loader2
                className={cn(
                  "absolute top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground",
                  showGeolocation ? "right-12" : "right-3.5",
                )}
                aria-hidden="true"
              />
            )}

            {showGeolocation && (
              <button
                type="button"
                onClick={selectCurrentPosition}
                disabled={isLocating}
                aria-label="Utiliser ma position actuelle"
                title="Utiliser ma position actuelle"
                className={cn(
                  "absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md",
                  "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                  size === "lg" && "size-9",
                )}
              >
                {isLocating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LocateFixed className="size-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) p-1"
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

      {/*
        Rendu hors du popover : une localisation refusée doit rester lisible même
        quand la liste de suggestions est fermée. `role="alert"` l'annonce
        immédiatement aux lecteurs d'écran.
      */}
      {geolocationError && (
        <p
          role="alert"
          className="mt-2 flex items-start justify-between gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {geolocationError}
          <button
            type="button"
            onClick={clearError}
            aria-label="Masquer le message"
            className="shrink-0 font-medium underline underline-offset-2"
          >
            Fermer
          </button>
        </p>
      )}
    </Command>
  );
}
