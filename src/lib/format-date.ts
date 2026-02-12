import { format as dateFnsFormat } from "date-fns";
import {
  de,
  enUS,
  es,
  fr,
  it,
  ja,
  ko,
  nl,
  pt,
  zhCN,
  type Locale as DateFnsLocale,
} from "date-fns/locale";
import { getLocale } from "@/paraglide/runtime";

const localeMap: Record<string, DateFnsLocale> = {
  de,
  en: enUS,
  es,
  fr,
  it,
  ja,
  ko,
  nl,
  pt,
  zh: zhCN,
};

function getDateFnsLocale(): DateFnsLocale {
  const appLocale = getLocale();
  return localeMap[appLocale] ?? enUS;
}

/**
 * Format a date using the app's current locale (Paraglide).
 * Uses date-fns under the hood. Example: formatDate(date, "PPP")
 */
export function formatDate(date: Date, formatStr: string): string {
  return dateFnsFormat(date, formatStr, { locale: getDateFnsLocale() });
}

/**
 * Serialize a Date to YYYY-MM-DD using the **local** timezone.
 * Use this when sending date-only values to the API. Avoids timezone bugs
 * (e.g. toISOString().slice(0,10) uses UTC and can shift the calendar day).
 */
export function dateToLocalISOString(date: Date): string {
  return dateFnsFormat(date, "yyyy-MM-dd");
}
