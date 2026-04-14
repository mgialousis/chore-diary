"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { getIngredientSuggestions } from "@/actions/recipes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function IngredientNameInput({
  value,
  onChange,
  placeholder,
  className,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onEnter?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const results = await getIngredientSuggestions(value);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const trimmedValue = value.trim();
  const normalizedValue = trimmedValue.toLowerCase();
  const hasExactMatch = suggestions.some((suggestion) => suggestion.toLowerCase() === normalizedValue);
  const shouldShowCreateOption = trimmedValue.length > 0 && !hasExactMatch;
  const shouldShowSuggestions = showSuggestions && (suggestions.length > 0 || shouldShowCreateOption);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            event.preventDefault();
            onEnter();
          }
        }}
        onFocus={async () => {
          if (suggestions.length === 0) {
            setSuggestions(await getIngredientSuggestions(value));
          }
          setShowSuggestions(true);
        }}
      />

      {shouldShowSuggestions && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {suggestions.length > 0 && (
            <div className="border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Existing ingredients
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
            {shouldShowCreateOption && (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(trimmedValue);
                    setShowSuggestions(false);
                  }}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span>Use &quot;{trimmedValue}&quot;</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
