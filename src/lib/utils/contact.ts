/** Shown in the phone box so the shape is obvious before anyone types. */
export const PHONE_PLACEHOLDER = "(555) 234-5678";

/** Turns typed digits into (555) 234-5678. Extra digits are dropped. */
export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Same as formatPhone, but if the person deletes a parenthesis, space, or dash,
 * the digit just before it is removed too so backspace still works.
 */
export function formatPhoneTyping(next: string, prev: string): string {
  const nextDigits = next.replace(/\D/g, "");
  const prevDigits = prev.replace(/\D/g, "");
  if (next.length < prev.length && nextDigits === prevDigits && prevDigits.length > 0) {
    return formatPhone(prevDigits.slice(0, -1));
  }
  return formatPhone(next);
}

/** Client contact checks used on new-file intake. Empty values are required errors. */

export function phoneError(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Phone number is required.";
  const digits = text.replace(/\D/g, "");
  const ok = digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  if (!ok) return "Use a 10-digit phone number, like (555) 234-5678.";
  return undefined;
}

export function emailError(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Email address is required.";
  if (!/^[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,}$/.test(text)) {
    return "Enter a full email, like sarah@email.com.";
  }
  return undefined;
}
