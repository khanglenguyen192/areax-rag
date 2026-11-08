import { useCallback } from "react";
import en from "@/locales/en.json";

export type TranslationKey = keyof typeof en;

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

const messages: Record<string, string> = en;

/**
 * Returns the translate function. Every component reads strings through this hook so a locale
 * library can replace it later without touching callers.
 */
export function useT(): Translate {
  return useCallback<Translate>((key, params) => {
    const template = messages[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
  }, []);
}

/** Returns the locale code used for number and date formatting. */
export function useLocale(): string {
  return "en";
}
