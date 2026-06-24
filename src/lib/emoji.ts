const SKIN_TONE_MODIFIER = '[\\u{1F3FB}-\\u{1F3FF}]?';
const VARIATION_SELECTOR = '\\u{FE0F}?';
const ZERO_WIDTH_JOINER = '\\u{200D}';

// One emoji "unit": a base pictograph, optional skin-tone modifier, optional
// variation selector, then any number of ZWJ-joined pictographs (for family/
// profession sequences like 👨‍👩‍👧 or 🧑‍🚒).
const ONE_EMOJI_PATTERN = new RegExp(
  `\\p{Extended_Pictographic}${SKIN_TONE_MODIFIER}${VARIATION_SELECTOR}` +
    `(?:${ZERO_WIDTH_JOINER}\\p{Extended_Pictographic}${SKIN_TONE_MODIFIER}${VARIATION_SELECTOR})*`,
  'gu'
);

// Keeps only emoji characters, and only the most recently typed one — so
// typing a second emoji replaces the first instead of appending to it.
export function extractLastEmoji(text: string): string {
  const matches = text.match(ONE_EMOJI_PATTERN);
  if (!matches || matches.length === 0) return '';
  return matches[matches.length - 1];
}
