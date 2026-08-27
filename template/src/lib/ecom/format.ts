// src/lib/ecom/format.ts
// Shared currency + date formatters for the E-commerce admin.

const CURRENCY_META: Record<
  string,
  { symbol: string; locale: string }
> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "AED ", locale: "en-AE" },
  AUD: { symbol: "A$", locale: "en-AU" },
  CAD: { symbol: "C$", locale: "en-CA" },
  SGD: { symbol: "S$", locale: "en-SG" },
};

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string = "INR",
): string {
  const n = Number(amount ?? 0);
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.INR;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(isFinite(n) ? n : 0);
  } catch {
    // Fallback if the browser can't handle the currency code
    return `${meta.symbol}${(isFinite(n) ? n : 0).toLocaleString(meta.locale)}`;
  }
}

export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  },
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
