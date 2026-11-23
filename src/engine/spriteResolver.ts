import { AudioSpriteCue, KROPKA_AUDIO_SPRITE } from '../data/kropkaAudioSprite';

// Explicit phrases we intentionally skip from the sprite (e.g., homograph 'bow' pronounced /baʊ/)
const EXCLUDED_KEYS = new Set<string>(['bow']);

// Smart aliases bridging textbook phrasing in Unit 1 to exact ElevenLabs studio clips
const PHRASE_ALIASES: Record<string, string[]> = {
  "i'm wearing a new green t-shirt": ["i'm wearing a green t-shirt"],
  "i'm wearing pyjamas": ["i'm wearing pink pyjamas"],
  "good night i'm wearing pyjamas": ['good night put on your pyjamas'],
  "i'm wearing a hat": ["i'm wearing a red hat"],
  "it's winter i'm wearing a hat": ["it's winter", "i'm wearing a red hat"],
  "i'm wearing a warm jumper": ["i'm wearing a yellow jumper"],
  "i'm wearing a hat in winter": ["it's winter", "i'm wearing a red hat"],
  'sunny & hot': ['sunny', 'hot'],
  'snowy & cold': ['snowy', 'cold'],
  "it's sunny and hot": ["it's sunny", "it's hot"],
  "it's snowy and cold": ["it's snowy", "it's cold"],
  'yummy ice cream in summer': ['ice cream', "it's summer"],
  'hot soup in winter': ['soup', "it's winter"],
  "here's a new coat for mr beetle": ["here's a new coat for you"],
  "hello let's learn english together tap a stop on the map": ['super', 'i love my new clothes'],
  'red coat superstar': ['great', "i'm wearing a red coat"],
  'colour artist': ['brilliant', 'crayons'],
  'great sentences': ['excellent'],
  'purple shorts champion': ['fantastic', "i'm wearing purple shorts"],
  'happy spring': ['super', "it's spring"],
  'sunny day star': ['brilliant', "it's sunny"],
  'super listener': ['super'],
  'amazing spelling': ['fantastic'],
  'you are ready for the test': ['excellent', 'well done'],
  'daily hero': ['daily task done'],
  'family game winner': ['well done'],
  'magical treasure': ['treasure chest'],
};

export function normalizeSpokenPhrase(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[„”".,!?:;—–()]/g, ' ')
    .replace(/\bcolor\b/g, 'colour')
    .replace(/\bgray\b/g, 'grey')
    .replace(/\bpajamas\b/g, 'pyjamas')
    .replace(/\bfavorite\b/g, 'favourite')
    .replace(/\bgoodnight\b/g, 'good night')
    .replace(/\btshirt\b/g, 't-shirt')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookupSingleCue(normalizedKey: string): AudioSpriteCue | null {
  if (!normalizedKey || EXCLUDED_KEYS.has(normalizedKey)) return null;
  return KROPKA_AUDIO_SPRITE[normalizedKey] || null;
}

/**
 * Resolves any English word, sentence, or multi-sentence textbook prompt into
 * an ordered list of exact ElevenLabs MP3 sprite cues.
 * Returns null if any part cannot be matched (so caller can cleanly fall back to TTS).
 */
export function resolveSpriteSequence(text: string): AudioSpriteCue[] | null {
  const fullKey = normalizeSpokenPhrase(text);
  if (!fullKey) return null;

  // 1. Direct exact hit in the 245-clip ElevenLabs sprite
  const direct = lookupSingleCue(fullKey);
  if (direct) return [direct];

  // 2. Smart alias hit (single or multi-cue)
  const aliasKeys = PHRASE_ALIASES[fullKey];
  if (aliasKeys) {
    const resolved: AudioSpriteCue[] = [];
    for (const k of aliasKeys) {
      const cue = lookupSingleCue(k);
      if (!cue) return null;
      resolved.push(cue);
    }
    return resolved.length > 0 ? resolved : null;
  }

  // 3. Multi-sentence split (e.g. "What's the weather like today? It's sunny.")
  const clauses = text
    .split(/[.!?]+/)
    .map((part) => normalizeSpokenPhrase(part))
    .filter(Boolean);

  if (clauses.length > 1) {
    const chained: AudioSpriteCue[] = [];
    for (const clause of clauses) {
      const cue = lookupSingleCue(clause);
      if (cue) {
        chained.push(cue);
      } else if (PHRASE_ALIASES[clause]) {
        for (const ak of PHRASE_ALIASES[clause]) {
          const ac = lookupSingleCue(ak);
          if (!ac) return null;
          chained.push(ac);
        }
      } else {
        return null;
      }
    }
    return chained.length > 0 ? chained : null;
  }

  return null;
}
