import { DEFAULT_ARTWORK_URL } from "../config/constants";

const PROGRAMME_ARTWORK_BY_SLUG: Record<string, string> = {
  "after-hours": "/programmes/after-hours.png",
  bassline: "/programmes/bassline.png",
  "first-light": "/programmes/first-light.png",
  "good-energy": "/programmes/good-energy.png",
  "low-key": "/programmes/low-key.png",
  "next-up": "/programmes/next-up.png",
  "next-wave": "/programmes/next-wave.png",
  "prime-hits": "/programmes/prime-hits.png",
  "the-a-list": "/programmes/the-a-list.png",
  "the-drive": "/programmes/the-drive.png"
};

const PROGRAMME_ALIAS_TO_SLUG: Record<string, string> = {
  "a-list": "the-a-list",
  alist: "the-a-list",
  drive: "the-drive"
};

export function toProgrammeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveProgrammeSlug(name: string): string {
  const slug = toProgrammeSlug(name);
  return PROGRAMME_ALIAS_TO_SLUG[slug] ?? slug;
}

export function getProgrammeArtworkUrl(programmeName: string): string {
  const slug = resolveProgrammeSlug(programmeName);
  return PROGRAMME_ARTWORK_BY_SLUG[slug] ?? DEFAULT_ARTWORK_URL;
}

export function formatIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseIsoDateLocal(dateIso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = dateIso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function shiftLocalDays(date: Date, offsetDays: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offsetDays);
  return next;
}
