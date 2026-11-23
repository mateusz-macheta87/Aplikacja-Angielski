import {
  AudioQuizQuestion,
  CrayonChallenge,
  LessonModule,
  ModuleProgress,
  VocabCategory,
  VocabItem,
} from '../types/curriculum';

export function formatStarsPl(count: number): string {
  const n = Math.abs(Math.floor(count));
  if (n === 1) return '1 gwiazdka';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${n} gwiazdki`;
  }
  return `${n} gwiazdek`;
}

export function getAvailableStars(progress: Pick<ModuleProgress, 'stars' | 'starsSpent'>): number {
  return Math.max(0, (progress.stars || 0) - (progress.starsSpent || 0));
}

export function getTotalMapStars(progress: Pick<ModuleProgress, 'stopStars'>): number {
  return Object.values(progress.stopStars || {}).reduce((acc, n) => acc + (n || 0), 0);
}

export function canOpenTreasureChest(progress: Pick<ModuleProgress, 'stopStars' | 'stars'>): boolean {
  return getTotalMapStars(progress) >= 6 || progress.stars >= 12;
}

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface CalendarDayItem {
  dateKey: string;
  weekdayShort: string;
  dayNumber: number;
  isToday: boolean;
  isDone: boolean;
}

const PL_WEEKDAYS = ['nd', 'pn', 'wt', 'śr', 'czw', 'pt', 'sob'];

export function getLast7DaysCalendar(
  completedDates: readonly string[],
  referenceDate = new Date()
): CalendarDayItem[] {
  const doneSet = new Set(completedDates);
  const days: CalendarDayItem[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(referenceDate);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const key = formatLocalDateKey(d);
    days.push({
      dateKey: key,
      weekdayShort: PL_WEEKDAYS[d.getDay()],
      dayNumber: d.getDate(),
      isToday: offset === 0,
      isDone: doneSet.has(key),
    });
  }
  return days;
}

export function checkSpellingAnswer(input: string, targetWord: string): boolean {
  const clean = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, '');
  return clean(input) === clean(targetWord);
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let s = Math.abs(Math.floor(seed)) || 1;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function buildWearingSentence(
  word: string,
  colorName: string,
  isPlural: boolean,
  includeNew = false
): string {
  const cleanWord = word.trim();
  const cleanColor = colorName.trim().toLowerCase();
  const prefix = includeNew ? 'new ' : '';
  if (isPlural) {
    return `I'm wearing ${prefix}${cleanColor} ${cleanWord}.`;
  }
  const firstWord = includeNew ? 'new' : cleanColor;
  const article = /^[aeiou]/.test(firstWord) ? 'an' : 'a';
  return `I'm wearing ${article} ${prefix}${cleanColor} ${cleanWord}.`;
}

export interface SentenceCheckResult {
  isCorrect: boolean;
  feedbackPl: string;
}

export function evaluateSentenceAssembly(
  selectedTokens: string[],
  targetTokens: string[],
  grammarTipPl: string
): SentenceCheckResult {
  if (selectedTokens.length === 0) {
    return {
      isCorrect: false,
      feedbackPl: 'Stuknij kafelki ze słowami, aby ułożyć zdanie!',
    };
  }

  const normalize = (t: string) => t.trim().toLowerCase();
  const joinedSelected = selectedTokens.map(normalize).join(' ');
  const joinedTarget = targetTokens.map(normalize).join(' ');

  if (joinedSelected === joinedTarget) {
    return {
      isCorrect: true,
      feedbackPl: 'Brawo! Zdanie jest bezbłędne!',
    };
  }

  const hasArticleA = selectedTokens.some((t) => normalize(t) === 'a');
  const targetHasArticleA = targetTokens.some((t) => normalize(t) === 'a');

  if (hasArticleA && !targetHasArticleA) {
    return {
      isCorrect: false,
      feedbackPl: `Uwaga na słówko „a”! ${grammarTipPl}`,
    };
  }

  if (!hasArticleA && targetHasArticleA) {
    return {
      isCorrect: false,
      feedbackPl: `Brakuje słówka „a” przed pojedynczą rzeczą! ${grammarTipPl}`,
    };
  }

  return {
    isCorrect: false,
    feedbackPl: `Prawie! Sprawdź kolejność słów. Podpowiedź: ${grammarTipPl}`,
  };
}

export interface CrayonEvaluation {
  status: 'correct' | 'wrong-part' | 'wrong-color';
  feedbackPl: string;
}

export function evaluateCrayonAction(
  challenge: CrayonChallenge,
  tappedPart: CrayonChallenge['targetPart'],
  selectedColorName: string
): CrayonEvaluation {
  if (tappedPart !== challenge.targetPart) {
    return {
      status: 'wrong-part',
      feedbackPl: `To inne ubranie! Posłuchaj uważnie zdania: „${challenge.sentence}”`,
    };
  }
  if (selectedColorName.toLowerCase() !== challenge.targetColorName.toLowerCase()) {
    return {
      status: 'wrong-color',
      feedbackPl: `Dobre ubranie, ale weź inną kredkę! Szukamy koloru: ${challenge.targetColorName} (${challenge.targetColorPl}).`,
    };
  }
  return {
    status: 'correct',
    feedbackPl: `Brawo! „${challenge.sentence}” — pięknie pokolorowane!`,
  };
}

export function generateAudioQuizQuestions(
  module: LessonModule,
  count = 6,
  seed = 42,
  options?: { categoryFilter?: VocabCategory; onlyWordIds?: string[] }
): AudioQuizQuestion[] {
  const pool: AudioQuizQuestion[] = [];

  let sourceVocab = module.vocabulary;
  if (options?.onlyWordIds && options.onlyWordIds.length > 0) {
    const idSet = new Set(options.onlyWordIds);
    const filtered = module.vocabulary.filter((v) => idSet.has(v.id));
    if (filtered.length > 0) sourceVocab = filtered;
  } else if (options?.categoryFilter) {
    const filtered = module.vocabulary.filter((v) => v.category === options.categoryFilter);
    if (filtered.length >= 2) sourceVocab = filtered;
  }

  if (module.vocabulary.length < 2) return pool;

  const shuffledVocab = seededShuffle(sourceVocab, seed);
  let idx = 0;

  for (const item of shuffledVocab) {
    if (pool.length >= count) break;
    idx++;

    const sameCat = module.vocabulary.filter((v) => v.id !== item.id && v.category === item.category);
    const otherCat = module.vocabulary.filter((v) => v.id !== item.id && v.category !== item.category);
    const distractorSource = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
    const distractors = seededShuffle(distractorSource, seed + idx * 17).slice(
      0,
      Math.min(3, distractorSource.length)
    );

    const quizOptions = seededShuffle([item, ...distractors], seed + idx * 31).map((opt) => ({
      id: opt.id,
      label: opt.word,
      sublabel: opt.translation,
      illustration: opt.illustration,
      colorHex: opt.defaultColor,
    }));

    const isWeather = item.category === 'weather';
    const isClothes = item.category === 'clothes' || item.category === 'bedtime';
    const isSeason = item.category === 'seasons';
    const isColour = item.category === 'colours';

    let spokenText = item.word;
    let questionPromptPl = 'Posłuchaj i stuknij właściwy obrazek.';
    let skillTag: AudioQuizQuestion['skillTag'] = 'vocabulary';

    if (module.speechLang.startsWith('en')) {
      if (isWeather) {
        spokenText = `What's the weather like today? It's ${item.word}.`;
        questionPromptPl = 'Posłuchaj pytania o pogodę i stuknij właściwy obrazek.';
        skillTag = 'weather';
      } else if (isSeason) {
        spokenText = `It's ${item.word}!`;
        questionPromptPl = 'Jaką porę roku słyszysz? Stuknij drzewo!';
        skillTag = 'seasons';
      } else if (isColour) {
        spokenText = item.word;
        questionPromptPl = 'Posłuchaj nazwy koloru i stuknij właściwą kredkę.';
        skillTag = 'vocabulary';
      } else if (isClothes) {
        spokenText = options?.categoryFilter === 'clothes' ? item.word : item.exampleSentence;
        questionPromptPl =
          options?.categoryFilter === 'clothes'
            ? 'Posłuchaj i stuknij właściwe ubranie.'
            : 'Posłuchaj zdania i stuknij właściwe ubranie.';
        skillTag = item.phonicsHighlight === 'sh' ? 'phonics' : 'wearing';
      }
    } else {
      spokenText = item.exampleSentence || item.word;
      questionPromptPl = 'Posłuchaj i wybierz właściwą kartę.';
      skillTag = 'general';
    }

    pool.push({
      id: `aq-${module.id}-${item.id}-${idx}`,
      spokenText,
      questionPromptPl,
      correctOptionId: item.id,
      options: quizOptions,
      skillTag,
    });
  }

  return pool.slice(0, count);
}

export interface MockTestQuestion {
  id: string;
  type: 'audio-choice' | 'grammar-choice' | 'weather-qa';
  promptPl: string;
  spokenText: string;
  displayQuestion?: string;
  correctOptionId: string;
  options: {
    id: string;
    label: string;
    illustration?: VocabItem['illustration'];
    colorHex?: string;
  }[];
  skillCategory: string;
  explanationPl: string;
}

export function buildMockTest(module: LessonModule, seed = 101): MockTestQuestion[] {
  const questions: MockTestQuestion[] = [];
  const audioQs = generateAudioQuizQuestions(module, 5, seed);

  for (const aq of audioQs) {
    const correctOpt = aq.options.find((o) => o.id === aq.correctOptionId);
    questions.push({
      id: `test-${aq.id}`,
      type: 'audio-choice',
      promptPl: aq.questionPromptPl,
      spokenText: aq.spokenText,
      correctOptionId: aq.correctOptionId,
      options: aq.options.map((o) => ({
        id: o.id,
        label: o.label,
        illustration: o.illustration,
        colorHex: o.colorHex,
      })),
      skillCategory:
        aq.skillTag === 'weather'
          ? 'Pogoda'
          : aq.skillTag === 'seasons'
            ? 'Pory roku'
            : 'Słuchanie i słownictwo',
      explanationPl: `Poprawna odpowiedź to „${correctOpt?.label ?? ''}” (${correctOpt?.sublabel ?? ''}).`,
    });
  }

  if (module.speechLang.startsWith('en')) {
    const grammarPool: MockTestQuestion[] = [
      {
        id: 'test-gram-coat',
        type: 'grammar-choice',
        promptPl: 'Wybierz poprawne zdanie po angielsku: „Mam na sobie czerwony płaszcz.”',
        spokenText: "I'm wearing a red coat.",
        displayQuestion: 'Mam na sobie czerwony płaszcz.',
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', label: "I'm wearing a red coat.", illustration: 'coat', colorHex: '#EF4444' },
          { id: 'opt-2', label: "I'm wearing red coat.", illustration: 'coat', colorHex: '#EF4444' },
          { id: 'opt-3', label: "I'm wearing a coat red.", illustration: 'coat', colorHex: '#EF4444' },
        ],
        skillCategory: "Gramatyka (I'm wearing)",
        explanationPl: 'Przed pojedynczym ubraniem (coat) dodajemy „a” i kolor przed rzeczą: a red coat.',
      },
      {
        id: 'test-gram-shorts',
        type: 'grammar-choice',
        promptPl: 'Wybierz poprawne zdanie: „Mam na sobie fioletowe spodenki.”',
        spokenText: "I'm wearing purple shorts.",
        displayQuestion: 'Mam na sobie fioletowe spodenki.',
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', label: "I'm wearing purple shorts.", illustration: 'shorts', colorHex: '#9333EA' },
          { id: 'opt-2', label: "I'm wearing a purple shorts.", illustration: 'shorts', colorHex: '#9333EA' },
          { id: 'opt-3', label: "It's purple shorts.", illustration: 'shorts', colorHex: '#9333EA' },
        ],
        skillCategory: "Gramatyka (I'm wearing)",
        explanationPl: 'Shorts (spodenki) to liczba mnoga — NIE stawiamy przed nimi „a”!',
      },
      {
        id: 'test-weather-1',
        type: 'weather-qa',
        promptPl: 'Nauczyciel pyta: „What\'s the weather like today?” Za oknem pada śnieg. Co odpowiesz?',
        spokenText: "What's the weather like today?",
        displayQuestion: "What's the weather like today? (Za oknem śnieg)",
        correctOptionId: 'w-snowy',
        options: [
          { id: 'w-snowy', label: "It's snowy.", illustration: 'snowy' },
          { id: 'w-sunny', label: "It's sunny.", illustration: 'sunny' },
          { id: 'w-cloudy', label: "It's cloudy.", illustration: 'cloudy' },
          { id: 'w-rainy', label: "It's rainy.", illustration: 'rainy' },
        ],
        skillCategory: 'Pogoda',
        explanationPl: "Śnieżnie to „snowy”, więc odpowiadamy: It's snowy.",
      },
      {
        id: 'test-weather-2',
        type: 'weather-qa',
        promptPl: 'Które pytanie zadasz, gdy chcesz zapytać o dzisiejszą pogodę?',
        spokenText: "What's the weather like today?",
        displayQuestion: 'Jaka jest dziś pogoda?',
        correctOptionId: 'q-weather',
        options: [
          { id: 'q-weather', label: "What's the weather like today?" },
          { id: 'q-wear', label: "I'm wearing a yellow jumper." },
          { id: 'q-season', label: 'My favourite season is winter.' },
        ],
        skillCategory: 'Pogoda',
        explanationPl: "Pytanie o pogodę brzmi: What's the weather like today?",
      },
      {
        id: 'test-gram-trousers',
        type: 'grammar-choice',
        promptPl: 'Wybierz poprawne zdanie: „Mam na sobie niebieskie spodnie.”',
        spokenText: "I'm wearing blue trousers.",
        displayQuestion: 'Mam na sobie niebieskie spodnie.',
        correctOptionId: 'opt-tr-1',
        options: [
          { id: 'opt-tr-1', label: "I'm wearing blue trousers.", illustration: 'trousers', colorHex: '#2563EB' },
          { id: 'opt-tr-2', label: "I'm wearing a blue trousers.", illustration: 'trousers', colorHex: '#2563EB' },
          { id: 'opt-tr-3', label: "I'm wearing blue jumper.", illustration: 'jumper', colorHex: '#2563EB' },
        ],
        skillCategory: "Gramatyka (I'm wearing)",
        explanationPl: "Trousers (spodnie) to liczba mnoga, więc mówimy: I'm wearing blue trousers.",
      },
    ];

    for (const q of grammarPool) {
      questions.push({
        ...q,
        options: seededShuffle(q.options, seed + questions.length * 13),
      });
    }
  } else {
    for (const s of module.sentences.slice(0, 4)) {
      const distractors = module.vocabulary
        .filter((v) => v.word !== s.targetSentence)
        .slice(0, 2)
        .map((v, i) => ({ id: `d-${i}`, label: v.exampleSentence || v.word }));
      questions.push({
        id: `test-sent-${s.id}`,
        type: 'grammar-choice',
        promptPl: s.promptPl,
        spokenText: s.targetSentence,
        displayQuestion: s.promptPl,
        correctOptionId: 'correct',
        options: seededShuffle(
          [{ id: 'correct', label: s.targetSentence }, ...distractors],
          seed + questions.length * 19
        ),
        skillCategory: 'Zdania i zasady',
        explanationPl: s.grammarTipPl,
      });
    }
  }

  return questions.slice(0, 10);
}

export function computeMasteryPercent(
  module: LessonModule,
  progress: ModuleProgress | undefined
): number {
  if (!progress || module.vocabulary.length === 0) return 0;
  const uniqueKnown = new Set(
    progress.masteredWordIds.filter((id) => module.vocabulary.some((v) => v.id === id))
  );
  return Math.min(100, Math.round((uniqueKnown.size / module.vocabulary.length) * 100));
}

export interface ModuleValidationResult {
  valid: boolean;
  module?: LessonModule;
  error?: string;
}

const MAX_MODULE_JSON_BYTES = 128 * 1024; // 128 KB max import payload
const MAX_VOCAB_ITEMS = 60;
const MAX_SENTENCE_ITEMS = 40;
const MAX_CRAYON_ITEMS = 20;
const FORBIDDEN_JSON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const ALLOWED_SUBJECT_IDS = new Set(['english', 'math', 'science', 'polish', 'custom']);
const ALLOWED_VOCAB_CATEGORIES = new Set([
  'clothes',
  'colours',
  'seasons',
  'weather',
  'bedtime',
  'general',
]);
const ALLOWED_ILLUSTRATION_KEYS = new Set([
  'coat',
  'trousers',
  'tshirt',
  'jumper',
  'skirt',
  'shorts',
  'shoes',
  'cap',
  'hat',
  'pyjamas',
  'slippers',
  'dressing-gown',
  'spring',
  'summer',
  'autumn',
  'winter',
  'sunny',
  'cloudy',
  'rainy',
  'snowy',
  'hot',
  'cold',
  'ice-cream',
  'soup',
  'park',
  'house',
  'colour-swatch',
  'math-card',
  'science-card',
  'generic',
]);
const ALLOWED_GARMENTS = new Set(['coat', 'jumper', 'shorts', 'trousers', 'tshirt', 'skirt', 'cap', 'shoes']);
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const BCP47_LANG_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLen);
}

function sanitizeSafeId(value: unknown, fallback: string): string {
  const raw = sanitizeText(value, 64).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
  return raw || fallback;
}

export function validateLessonModuleJson(rawText: string): ModuleValidationResult {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { valid: false, error: 'Wklej poprawny obiekt JSON modułu.' };
  }
  if (rawText.length > MAX_MODULE_JSON_BYTES) {
    return {
      valid: false,
      error: 'Plik JSON jest zbyt duży (maksymalnie 128 KB). Podziel materiał na mniejsze moduły.',
    };
  }
  try {
    let sawForbiddenKey = false;
    const parsed = JSON.parse(rawText, (key, value) => {
      if (FORBIDDEN_JSON_KEYS.has(key)) {
        sawForbiddenKey = true;
        return undefined;
      }
      return value;
    }) as Partial<LessonModule>;

    if (sawForbiddenKey) {
      return {
        valid: false,
        error: 'Wykryto niedozwolone klucze techniczne w pliku JSON.',
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'JSON musi być obiektem modułu.' };
    }

    const title = sanitizeText(parsed.title, 100);
    if (!title) {
      return { valid: false, error: 'Brakuje wymaganego pola „title” (tytuł lekcji).' };
    }

    if (!Array.isArray(parsed.vocabulary) || parsed.vocabulary.length === 0) {
      return {
        valid: false,
        error: 'Pole „vocabulary” musi być niepustą tablicą ze słówkami lub pojęciami.',
      };
    }

    if (parsed.vocabulary.length > MAX_VOCAB_ITEMS) {
      return {
        valid: false,
        error: `Moduł może zawierać maksymalnie ${MAX_VOCAB_ITEMS} słówek lub pojęć.`,
      };
    }

    const sanitizedVocab: VocabItem[] = [];
    for (let idx = 0; idx < parsed.vocabulary.length; idx++) {
      const item = parsed.vocabulary[idx] as Partial<VocabItem> | null | undefined;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return {
          valid: false,
          error: `Element nr ${idx + 1} w „vocabulary” musi być obiektem.`,
        };
      }
      const word = sanitizeText(item.word, 80);
      const translation = sanitizeText(item.translation, 100);
      if (!word || !translation) {
        return {
          valid: false,
          error: 'Każdy element w „vocabulary” musi mieć wypełnione pola „word” oraz „translation”.',
        };
      }
      const rawCat = sanitizeText(item.category, 24);
      const rawIll = sanitizeText(item.illustration, 32);
      const rawColor = sanitizeText(item.defaultColor, 16);
      sanitizedVocab.push({
        id: sanitizeSafeId(item.id, `v-${idx + 1}`),
        word,
        translation,
        category: (ALLOWED_VOCAB_CATEGORIES.has(rawCat) ? rawCat : 'general') as VocabCategory,
        categoryLabel: sanitizeText(item.categoryLabel, 40) || 'Słownictwo',
        illustration: (ALLOWED_ILLUSTRATION_KEYS.has(rawIll)
          ? rawIll
          : 'generic') as VocabItem['illustration'],
        defaultColor: HEX_COLOR_RE.test(rawColor) ? rawColor : undefined,
        isPlural: Boolean(item.isPlural),
        phonicsHighlight: sanitizeText(item.phonicsHighlight, 16) || undefined,
        exampleSentence: sanitizeText(item.exampleSentence, 160) || word,
        exampleTranslation: sanitizeText(item.exampleTranslation, 160) || translation,
        textbookPage: sanitizeText(item.textbookPage, 24) || undefined,
      });
    }

    const rawSentences = Array.isArray(parsed.sentences)
      ? parsed.sentences.slice(0, MAX_SENTENCE_ITEMS)
      : [];
    const sanitizedSentences = rawSentences
      .filter((s) => s && typeof s === 'object' && !Array.isArray(s))
      .map((s, idx) => {
        const targetSentence = sanitizeText(s.targetSentence, 160);
        if (!targetSentence) return null;
        const tokens = Array.isArray(s.tokens)
          ? s.tokens
              .map((t) => sanitizeText(t, 40))
              .filter(Boolean)
              .slice(0, 20)
          : targetSentence.split(/\s+/).filter(Boolean).slice(0, 20);
        const rawIll = sanitizeText(s.illustration, 32);
        return {
          id: sanitizeSafeId(s.id, `s-${idx + 1}`),
          promptPl: sanitizeText(s.promptPl, 160) || 'Ułóż poprawne zdanie',
          targetSentence,
          tokens,
          grammarTipPl: sanitizeText(s.grammarTipPl, 200) || 'Sprawdź kolejność wyrazów.',
          illustration: (ALLOWED_ILLUSTRATION_KEYS.has(rawIll)
            ? rawIll
            : 'generic') as VocabItem['illustration'],
          skillTag: 'general' as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const rawCrayons = Array.isArray(parsed.crayonChallenges)
      ? parsed.crayonChallenges.slice(0, MAX_CRAYON_ITEMS)
      : [];
    const sanitizedCrayons: CrayonChallenge[] = [];
    for (let idx = 0; idx < rawCrayons.length; idx++) {
      const c = rawCrayons[idx];
      if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
      const targetPart = sanitizeText(c.targetPart, 24);
      const targetColorHex = sanitizeText(c.targetColorHex, 16);
      const sentence = sanitizeText(c.sentence, 160);
      if (!ALLOWED_GARMENTS.has(targetPart) || !HEX_COLOR_RE.test(targetColorHex) || !sentence) {
        continue;
      }
      const rawOutfit = sanitizeText(c.outfitMode, 16);
      const outfitMode: CrayonChallenge['outfitMode'] =
        rawOutfit === 'winter' || rawOutfit === 'skirt' ? rawOutfit : 'casual';
      sanitizedCrayons.push({
        id: sanitizeSafeId(c.id, `c-${idx + 1}`),
        sentence,
        translationPl: sanitizeText(c.translationPl, 160) || sentence,
        targetPart: targetPart as CrayonChallenge['targetPart'],
        targetColorName: sanitizeText(c.targetColorName, 24) || 'blue',
        targetColorPl: sanitizeText(c.targetColorPl, 24) || 'niebieski',
        targetColorHex,
        outfitMode,
      });
    }

    const rawSubject = sanitizeText(parsed.subject, 24);
    const rawLang = sanitizeText(parsed.speechLang, 16);

    const validModule: LessonModule = {
      id: sanitizeSafeId(parsed.id, `custom-${Date.now()}`),
      title,
      subtitle: sanitizeText(parsed.subtitle, 140) || 'Własny moduł tematyczny',
      subject: (ALLOWED_SUBJECT_IDS.has(rawSubject) ? rawSubject : 'custom') as LessonModule['subject'],
      subjectLabel: sanitizeText(parsed.subjectLabel, 48) || 'Własny przedmiot',
      gradeLevel: sanitizeText(parsed.gradeLevel, 40) || 'Własny zestaw',
      speechLang: BCP47_LANG_RE.test(rawLang) ? rawLang : 'en-GB',
      sourceReference: sanitizeText(parsed.sourceReference, 100) || 'Moduł dodany przez rodzica',
      teacherNote: sanitizeText(parsed.teacherNote, 320) || undefined,
      isBuiltIn: false,
      vocabulary: sanitizedVocab,
      sentences: sanitizedSentences,
      crayonChallenges: sanitizedCrayons,
    };

    return { valid: true, module: validModule };
  } catch {
    return { valid: false, error: 'Nieprawidłowa składnia JSON. Sprawdź przecinki i cudzysłowy.' };
  }
}

export interface WarmupAnswerRecord {
  wordId: string;
  word: string;
  categoryLabel: string;
  correct: boolean;
}

export interface ParentWarmupSummary {
  strongCategories: string[];
  reviewWords: string[];
  scorePercent: number;
  readyForTest: boolean;
}

/**
 * Selects up to 6 targeted questions for the "3-minutowa rozgrzewka przed sprawdzianem":
 * prioritizes words in mistakeWordIds first, then unmastered words spread across categories,
 * then balanced review from the full module.
 */
export function buildSmartWarmupQuestions(
  module: LessonModule,
  progress: ModuleProgress,
  seed = 77
): AudioQuizQuestion[] {
  const targetCount = Math.min(6, Math.max(1, module.vocabulary.length));
  const pickedIds: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (id: string) => {
    if (!seen.has(id) && module.vocabulary.some((v) => v.id === id) && pickedIds.length < targetCount) {
      seen.add(id);
      pickedIds.push(id);
    }
  };

  // 1. Prioritize words needing watering (mistakes)
  for (const id of progress.mistakeWordIds) {
    pushUnique(id);
  }

  // 2. Prioritize unmastered words spread across distinct categories
  const masteredSet = new Set(progress.masteredWordIds);
  const unmastered = seededShuffle(
    module.vocabulary.filter((v) => !masteredSet.has(v.id)),
    seed
  );
  const usedCats = new Set<string>();
  for (const item of unmastered) {
    if (!usedCats.has(item.category)) {
      usedCats.add(item.category);
      pushUnique(item.id);
    }
  }
  for (const item of unmastered) {
    pushUnique(item.id);
  }

  // 3. Fill remaining slots with balanced module vocabulary
  const rest = seededShuffle(module.vocabulary, seed + 19);
  for (const item of rest) {
    pushUnique(item.id);
  }

  return generateAudioQuizQuestions(module, targetCount, seed + 7, {
    onlyWordIds: pickedIds,
  });
}

/**
 * Generates an actionable Polish summary for parents after a 3-minute warmup session.
 */
export function buildParentWarmupSummary(
  records: WarmupAnswerRecord[]
): ParentWarmupSummary {
  if (records.length === 0) {
    return { strongCategories: [], reviewWords: [], scorePercent: 0, readyForTest: false };
  }

  const byCategory = new Map<string, { correct: number; total: number }>();
  const reviewWords: string[] = [];
  let totalCorrect = 0;

  for (const rec of records) {
    if (rec.correct) {
      totalCorrect += 1;
    } else if (!reviewWords.includes(rec.word)) {
      reviewWords.push(rec.word);
    }
    const stat = byCategory.get(rec.categoryLabel) || { correct: 0, total: 0 };
    stat.total += 1;
    if (rec.correct) stat.correct += 1;
    byCategory.set(rec.categoryLabel, stat);
  }

  const strongCategories: string[] = [];
  for (const [cat, stat] of byCategory.entries()) {
    if (stat.correct === stat.total && stat.total > 0) {
      strongCategories.push(cat);
    }
  }

  const scorePercent = Math.round((totalCorrect / records.length) * 100);
  return {
    strongCategories,
    reviewWords,
    scorePercent,
    readyForTest: scorePercent >= 80,
  };
}

const PLURAL_ACCESSORIES = new Set(['star glasses', 'butterfly wings']);

/**
 * Builds a natural grammatical English sentence for Iskierka's wardrobe photo postcard.
 */
export function buildOutfitCaptionEn(
  accessoryIds: string[],
  catalog: { id: string; englishName: string }[]
): string {
  const names = accessoryIds
    .map((id) => catalog.find((c) => c.id === id)?.englishName)
    .filter((n): n is string => Boolean(n));

  if (names.length === 0) {
    return 'Hello! I love learning English with you!';
  }

  const phrases = names.map((name) => {
    const lower = name.toLowerCase();
    return PLURAL_ACCESSORIES.has(lower) ? lower : `a ${lower}`;
  });

  if (phrases.length === 1) {
    return `I'm wearing ${phrases[0]}!`;
  }
  const last = phrases[phrases.length - 1];
  const head = phrases.slice(0, -1).join(', ');
  return `I'm wearing ${head} and ${last}!`;
}

