import { resolveProgrammeSlug } from "../utils/programme";

export interface ProgrammeCatalogEntry {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
}

const PROGRAMME_CATALOG: Record<string, ProgrammeCatalogEntry> = {
  bassline: {
    slug: "bassline",
    name: "Bassline",
    shortDescription:
      "Toronto's late-night drum and bass session: fast, heavy, and built for after-dark energy.",
    longDescription:
      "Bassline is Hits 93 Toronto's midnight rush: drum and bass, bassline, and high-BPM electronic built for night drives, workouts, and anyone still wide awake. Expect rolling low-end, crisp breaks, and big festival-ready moments, plus left-field dance cuts and remixes that keep the momentum moving. If your idea of late night is intensity, Bassline is the soundtrack."
  },
  "after-hours": {
    slug: "after-hours",
    name: "After Hours",
    shortDescription:
      "A smooth overnight blend: chill pop, mellow electronic, and late-night favourites for the quiet hours.",
    longDescription:
      "After Hours slows the station down without losing the glow. It is a laid-back overnight mix of chill pop, R&B, downtempo electronic, and comfort-classics. Think dreamy vocals, warm grooves, and the occasional hip-hop throwback that still feels soft at 3 a.m. Perfect for studying, winding down, or keeping you company on the overnight shift."
  },
  "prime-hits": {
    slug: "prime-hits",
    name: "Prime Hits",
    shortDescription:
      "Big hits, big throwbacks, zero filler: high-impact pop and party-ready favourites, morning and late morning.",
    longDescription:
      "Prime Hits is your core Hits 93 Toronto sound: major pop bangers, crossover anthems, and the throwbacks that still hit hard. You will hear everything from dance-pop and hip-hop staples to indie crossovers and classic singalongs, with tight pacing, high familiarity, and constant momentum. It is built for mornings, late mornings, and anyone who wants the turn-it-up version of Top 40 radio."
  },
  "first-light": {
    slug: "first-light",
    name: "First Light",
    shortDescription:
      "Bright, upbeat breakfast radio: current pop, fresh dance, and feel-good momentum to start your day.",
    longDescription:
      "First Light is the main morning block: energetic, upbeat, and tuned for that get-moving window. It blends today's pop, dance crossovers, and alt-pop favourites with a few punchy curveballs, enough variety to keep it interesting without drifting away from the hits. Clean, bright, and forward, built for commutes, coffee, and the first real stretch of the day."
  },
  "the-a-list": {
    slug: "the-a-list",
    name: "The A-List",
    shortDescription:
      "The afternoon hit list: current pop power, iconic throwbacks, and radio-defining anthems.",
    longDescription:
      "The A-List is where the station leans into mainstream pop and big, recognisable records. Expect current chart leaders, modern classics, and perfectly timed throwbacks: pop, dance-pop, and hip-hop crossovers that feel instantly familiar. It is upbeat and hook-heavy, designed to carry you through the afternoon with high replay value and constant surprise favourites."
  },
  "the-drive": {
    slug: "the-drive",
    name: "The Drive",
    shortDescription:
      "Your commute soundtrack: big choruses, high-energy pop, and a clean mix of new plus familiar for the ride home.",
    longDescription:
      "The Drive is late-afternoon pacing done right: upbeat, confident, and built for movement. You will hear current pop, dance crossovers, and modern alt favourites alongside established hits that keep the energy steady. It is the bridge between workday and evening: big hooks, strong rhythm, and a mix that feels like Toronto traffic: fast, busy, and alive."
  },
  "next-up": {
    slug: "next-up",
    name: "Next Up",
    shortDescription:
      "Emerging artists and future favourites: new voices, new tracks, and what is next in pop and beyond.",
    longDescription:
      "Next Up is the discovery hour: a spotlight on emerging artists, new releases, and records that have not hit everywhere yet. The sound leans modern and forward: alt-pop, pop-adjacent R&B, indie-leaning cuts, and boundary-pushing tracks that still feel accessible. If you want to find your next favourite artist before everyone else does, start here."
  },
  "next-wave": {
    slug: "next-wave",
    name: "Next Wave",
    shortDescription:
      "Forward-leaning pop and new sounds: fresh releases, rising artists, and the edge of the mainstream.",
    longDescription:
      "Next Wave pushes a little further: contemporary pop with a sharper edge, new voices, and trend-setting sounds that sit just ahead of the pack. Expect modern pop, alt-pop, electronic-pop, and left-of-centre tracks that still feel like hits, often from rising names and breakout moments. It is the evening block for listeners who want new to actually sound new."
  },
  "low-key": {
    slug: "low-key",
    name: "Low Key",
    shortDescription:
      "A calm, late-evening unwind: smooth R&B, mellow indie, and low-lit electronic with room to breathe.",
    longDescription:
      "Low Key is the exhale. It is a relaxed, taste-forward blend of smooth R&B, mellow indie, alternative soul, and softly pulsing electronic: tracks that feel warm, intimate, and unforced. Think late-night headphone music: groove without the rush, mood without the gloom, and a pace that lets you settle in."
  },
  "good-energy": {
    slug: "good-energy",
    name: "Good Energy",
    shortDescription:
      "A feel-good finale: upbeat pop, fun throwbacks, and late-night wins to end the day on a high.",
    longDescription:
      "Good Energy closes the schedule with momentum and a smile. It is upbeat pop, dance-pop, and fun, familiar favourites: high-singalong, party-adjacent, and built to lift the mood before midnight. You will hear modern hits, throwback heaters, and the kind of tracks that make you want one more song before you call it a night."
  }
};

export function getProgrammeCatalogEntry(slug: string): ProgrammeCatalogEntry | null {
  return PROGRAMME_CATALOG[slug] ?? null;
}

export function getProgrammeCatalogEntryByName(name: string): ProgrammeCatalogEntry | null {
  return getProgrammeCatalogEntry(resolveProgrammeSlug(name));
}

export function getAllProgrammeCatalogEntries(): ProgrammeCatalogEntry[] {
  return Object.values(PROGRAMME_CATALOG);
}

export function getProgrammeShortDescriptionByName(name: string, fallback = "Music programme block"): string {
  const entry = getProgrammeCatalogEntryByName(name);
  return entry?.shortDescription ?? fallback;
}

export function getProgrammeLongDescriptionByName(name: string, fallback = "Hits 93 Toronto programme."): string {
  const entry = getProgrammeCatalogEntryByName(name);
  return entry?.longDescription ?? fallback;
}

export function getProgrammeLongDescriptionBySlug(slug: string, fallback = "Hits 93 Toronto programme."): string {
  const entry = getProgrammeCatalogEntry(slug);
  return entry?.longDescription ?? fallback;
}

export function getProgrammeNameBySlug(slug: string, fallback = "Programme"): string {
  const entry = getProgrammeCatalogEntry(slug);
  return entry?.name ?? fallback;
}
