import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  cn,
  Input,
} from "@saascription/ui";
import { useEffect, useId, useRef, useState } from "react";

import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  SAAS_NAME_SEARCH_MIN_CHARS,
  useSaasCatalogNameSearch,
} from "@/services/saas-catalog";

const SEARCH_DEBOUNCE_MS = 300;

type SubscriptionSaasComboboxProps = {
  id: string;
  value: string;
  hasError: boolean;
  onUpdate: (patch: { name: string; saasId?: string }) => void;
};

export function SubscriptionSaasCombobox({
  id,
  value,
  hasError,
  onUpdate,
}: SubscriptionSaasComboboxProps) {
  const listLabelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const debouncedSearch = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
  const trimmedDebounced = debouncedSearch.trim();
  const canQuery = trimmedDebounced.length >= SAAS_NAME_SEARCH_MIN_CHARS;

  const {
    data: hits = [],
    isFetching,
    isError,
    error,
  } = useSaasCatalogNameSearch(debouncedSearch);

  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  const showPanel = focused && canQuery && !suppressSuggestions;

  useEffect(() => {
    if (!showPanel) {
      return;
    }
    const onPointerDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el?.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [showPanel]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        required
        placeholder="e.g. Notion, AWS, Spotify"
        aria-invalid={hasError ? true : undefined}
        aria-expanded={showPanel}
        aria-controls={showPanel ? listLabelId : undefined}
        aria-autocomplete="list"
        role="combobox"
        value={value}
        onChange={(e) => {
          setSuppressSuggestions(false);
          onUpdate({ name: e.target.value, saasId: undefined });
        }}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && containerRef.current?.contains(next)) {
            return;
          }
          setSuppressSuggestions(false);
          window.setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              setFocused(false);
            }
          }, 0);
        }}
      />
      {showPanel ? (
        <div
          id={listLabelId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10",
          )}
        >
          <Command
            shouldFilter={false}
            className="max-h-60 rounded-lg bg-transparent"
          >
            <CommandList>
              {isFetching ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Searching catalog…
                </div>
              ) : isError ? (
                <div className="px-2 py-4 text-center text-xs text-destructive">
                  {error instanceof Error
                    ? error.message
                    : "Could not load suggestions."}
                </div>
              ) : hits.length === 0 ? (
                <CommandEmpty>
                  No catalog matches — we will save the name you typed.
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {hits.map((h) => (
                    <CommandItem
                      key={h.id}
                      value={h.id}
                      onSelect={() => {
                        onUpdate({ name: h.name, saasId: h.id });
                        setSuppressSuggestions(true);
                      }}
                    >
                      {h.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}
