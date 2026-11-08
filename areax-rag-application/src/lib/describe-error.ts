import type { Translate, TranslationKey } from "@/hooks/common/useT";
import en from "@/locales/en.json";
import { isApiError } from "./api-error";

function isKnown(key: string): key is TranslationKey {
  return key in en;
}

/**
 * Turns any thrown value into a localized sentence for the user.
 * Only the stable error `code` is used; the server `message` is never shown.
 */
export function describeError(error: unknown, t: Translate): string {
  if (isApiError(error)) {
    const key = `error.${error.code}`;
    if (isKnown(key)) return t(key);
  }
  return t("error.UNKNOWN");
}

/** Maps `errors[]` of a validation failure to a localized message per field name. */
export function describeFieldErrors(
  error: unknown,
  t: Translate,
): Readonly<Record<string, string>> {
  if (!isApiError(error)) return {};
  const messages: Record<string, string> = {};
  for (const fieldError of error.errors) {
    const key = `field.${fieldError.code}`;
    if (isKnown(key)) messages[fieldError.field] = t(key);
  }
  return messages;
}
