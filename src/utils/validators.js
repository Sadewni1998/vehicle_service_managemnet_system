// Unicode-aware validators and sanitizers for form inputs
// These follow broadly accepted name rules: any letters from any language
// plus common separators used in personal names (space, hyphen, apostrophe, period).

// Regex: start with a letter/mark, then allow letters/marks, spaces, periods, apostrophes, or hyphens
// The "u" flag enables Unicode property escapes.
export const unicodeNameRegex = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

// Remove characters that are not letters/marks or the allowed separators
export function sanitizeNameInput(value = "") {
  return value
    .normalize("NFC")
    .replace(/[^\p{L}\p{M} .'-]+/gu, "") // drop disallowed characters
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

// Phone helpers: keep only digits and cap to 10, plus a 10-digit validator
export function sanitizePhoneInput(value = "") {
  return String(value).replace(/\D+/g, "").slice(0, 10);
}

export const tenDigitPhoneRegex = /^\d{10}$/;
