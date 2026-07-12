/**
 * Inline SVG icon library — a curated, offline set the AI references BY NAME.
 * Stroke-based (currentColor) so every icon inherits the slide's accent/text
 * colour and theme. 24x24 viewBox, Feather/Lucide style. Used to give slides a
 * visual layer (icons next to bullets, features, definition aspects) instead of
 * plain text, which is the biggest reason text-only slides look empty/flat.
 */
const PATHS: Record<string, string> = {
  idea: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  growth: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  decline: '<path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  cycle: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 6a3 3 0 0 0 6 0L5 7Zm14 0-3 6a3 3 0 0 0 6 0l-3-6ZM7 21h10"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 2.6 14H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4 7.6L3.7 7.4a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8h.1A1.6 1.6 0 0 0 21.4 12H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16Z"/><path d="M11 20c0-5 2.5-9 6-11"/>',
  atom: '<circle cx="12" cy="12" r="1.6"/><path d="M12 2a14 6 0 0 0 0 20 14 6 0 0 0 0-20Z" transform="rotate(45 12 12)"/><path d="M12 2a14 6 0 0 0 0 20 14 6 0 0 0 0-20Z" transform="rotate(-45 12 12)"/>',
  flask: '<path d="M9 2h6M10 2v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-11V2"/><path d="M7.5 14h9"/>',
  code: '<path d="m16 18 5-6-5-6M8 6l-5 6 5 6"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.9-2.5 2s1.1 1.8 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/>',
  warning: '<path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.1L12 17.8 6.5 20l1-6.1L3 9.6l6.2-.9L12 3Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  network: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7 7.5 10.5 16M17 7.5 13.5 16M7 6h10"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  brain: '<path d="M9.5 3A2.5 2.5 0 0 0 7 5.5C5.5 6 5 7.5 5.5 9 4 10 4 12.5 5.5 13.5 5 15.5 6.5 17 8.5 17a2.5 2.5 0 0 0 3.5 0M14.5 3A2.5 2.5 0 0 1 17 5.5c1.5.5 2 2 1.5 3.5 1.5 1 1.5 3.5 0 4.5.5 2-1 3.5-3 3.5a2.5 2.5 0 0 1-3.5 0M12 4v16"/>',
  document: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  energy: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  health: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M5 5l1.5 1.5M17.5 17.5 19 19M2 12h2M20 12h2M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  water: '<path d="M12 2.7s7 7.3 7 11.8a7 7 0 0 1-14 0C5 10 12 2.7 12 2.7Z"/>',
  tech: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  education: '<path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 9-9M16 3l3 3M14 6l3 3"/>',
  puzzle: '<path d="M19 11V8a2 2 0 0 0-2-2h-3a2 2 0 1 0-4 0H7a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h3a2 2 0 1 1 4 0h3a2 2 0 0 0 2-2v-3a2 2 0 1 0 0-4Z"/>',
  rocket: '<path d="M5 13c-1.5.7-3 3-3 6 3 0 5.3-1.5 6-3M9 14l-3-3a14 14 0 0 1 9-8c2 0 4 .5 4 .5s.5 2 .5 4a14 14 0 0 1-8 9l-3-3Z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  pie: '<path d="M12 3v9l7.5 4.5"/><path d="M12 3a9 9 0 1 0 9 9"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  flag: '<path d="M4 21V4M4 4h12l-2 4 2 4H4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
};

const FALLBACK = '<circle cx="12" cy="12" r="3.5"/>';

/** Returns an inline <svg> for the named icon (currentColor stroke). */
export function icon(name: string | undefined, size = 22): string {
  const key = (name ?? '').trim().toLowerCase();
  const body = PATHS[key] ?? FALLBACK;
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** The list of valid icon names, for injecting into prompts. */
export const ICON_NAMES = Object.keys(PATHS);
