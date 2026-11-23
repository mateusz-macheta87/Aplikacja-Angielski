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
  return `I'm wearing a ${prefix}${cleanColor} ${cleanWord}.`;
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

export function validateLessonModuleJson(rawText: string): ModuleValidationResult {
  if (!rawText.trim()) {
    return { valid: false, error: 'Wklej poprawny obiekt JSON modułu.' };
  }
  try {
    const parsed = JSON.parse(rawText) as Partial<LessonModule>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'JSON musi być obiektem modułu.' };
    }
    if (!parsed.title || typeof parsed.title !== 'string' || !parsed.title.trim()) {
      return { valid: false, error: 'Brakuje wymaganego pola „title” (tytuł lekcji).' };
    }
    if (!Array.isArray(parsed.vocabulary) || parsed.vocabulary.length === 0) {
      return {
        valid: false,
        error: 'Pole „vocabulary” musi być niepustą tablicą ze słówkami lub pojęciami.',
      };
    }

    const sanitizedVocab: VocabItem[] = parsed.vocabulary.map((item, idx) => ({
      id: item.id || `v-${idx + 1}`,
      word: String(item.word || '').trim(),
      translation: String(item.translation || '').trim(),
      category: item.category || 'general',
      categoryLabel: item.categoryLabel || 'Słownictwo',
      illustration: item.illustration || 'generic',
      defaultColor: item.defaultColor,
      isPlural: Boolean(item.isPlural),
      phonicsHighlight: item.phonicsHighlight,
      exampleSentence: item.exampleSentence || String(item.word || ''),
      exampleTranslation: item.exampleTranslation || String(item.translation || ''),
      textbookPage: item.textbookPage,
    }));

    if (sanitizedVocab.some((v) => !v.word || !v.translation)) {
      return {
        valid: false,
        error: 'Każdy element w „vocabulary” musi mieć wypełnione pola „word” oraz „translation”.',
      };
    }

    const validModule: LessonModule = {
      id: parsed.id?.trim() || `custom-${Date.now()}`,
      title: parsed.title.trim(),
      subtitle: parsed.subtitle?.trim() || 'Własny moduł tematyczny',
      subject: parsed.subject || 'custom',
      subjectLabel: parsed.subjectLabel?.trim() || 'Własny przedmiot',
      gradeLevel: parsed.gradeLevel?.trim() || 'Własny zestaw',
      speechLang: parsed.speechLang?.trim() || 'en-GB',
      sourceReference: parsed.sourceReference?.trim() || 'Moduł dodany przez rodzica',
      teacherNote: parsed.teacherNote,
      isBuiltIn: false,
      vocabulary: sanitizedVocab,
      sentences: Array.isArray(parsed.sentences) ? parsed.sentences : [],
      crayonChallenges: Array.isArray(parsed.crayonChallenges) ? parsed.crayonChallenges : [],
      sortingGame: parsed.sortingGame,
      customAudioQuizzes: parsed.customAudioQuizzes,
    };

    return { valid: true, module: validModule };
  } catch {
    return { valid: false, error: 'Nieprawidłowa składnia JSON. Sprawdź przecinki i cudzysłowy.' };
  }
}
