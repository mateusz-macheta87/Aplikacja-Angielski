export type SubjectId = 'english' | 'math' | 'science' | 'polish' | 'custom';

export type VocabCategory =
  | 'clothes'
  | 'seasons'
  | 'weather'
  | 'bedtime'
  | 'colours'
  | 'contrast'
  | 'general';

export type IllustrationKey =
  | 'coat'
  | 'trousers'
  | 'tshirt'
  | 'jumper'
  | 'skirt'
  | 'shorts'
  | 'shoes'
  | 'cap'
  | 'hat'
  | 'pyjamas'
  | 'slippers'
  | 'dressing-gown'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'hot'
  | 'cold'
  | 'ice-cream'
  | 'soup'
  | 'park'
  | 'house'
  | 'colour-swatch'
  | 'math-card'
  | 'science-card'
  | 'generic';

export interface VocabItem {
  id: string;
  word: string;
  translation: string;
  category: VocabCategory;
  categoryLabel: string;
  illustration: IllustrationKey;
  defaultColor?: string;
  isPlural?: boolean;
  phonicsHighlight?: string;
  exampleSentence: string;
  exampleTranslation: string;
  textbookPage?: string;
}

export interface SentenceChallenge {
  id: string;
  promptPl: string;
  targetSentence: string;
  tokens: string[];
  distractorTokens?: string[];
  grammarTipPl: string;
  illustration: IllustrationKey;
  itemColor?: string;
  skillTag: 'wearing-article' | 'weather' | 'seasons' | 'bedtime' | 'phonics' | 'general';
}

export interface CrayonChallenge {
  id: string;
  sentence: string;
  translationPl: string;
  targetPart: 'cap' | 'tshirt' | 'jumper' | 'coat' | 'trousers' | 'shorts' | 'skirt' | 'shoes';
  targetColorName: string;
  targetColorPl: string;
  targetColorHex: string;
  outfitMode: 'casual' | 'winter' | 'skirt';
}

export interface SortingItem {
  id: string;
  word: string;
  translation: string;
  bucketId: string;
  illustration: IllustrationKey;
  spokenHint: string;
}

export interface SortingGameConfig {
  title: string;
  instructionPl: string;
  buckets: {
    id: string;
    label: string;
    sublabelPl: string;
    illustration: IllustrationKey;
    accentColor: string;
  }[];
  items: SortingItem[];
}

export interface AudioQuizQuestion {
  id: string;
  spokenText: string;
  questionPromptPl: string;
  correctOptionId: string;
  options: {
    id: string;
    label: string;
    sublabel?: string;
    illustration: IllustrationKey;
    colorHex?: string;
  }[];
  skillTag: 'vocabulary' | 'weather' | 'wearing' | 'phonics' | 'seasons' | 'general';
}

export interface LessonModule {
  id: string;
  title: string;
  subtitle: string;
  subject: SubjectId;
  subjectLabel: string;
  gradeLevel: string;
  speechLang: string;
  sourceReference: string;
  teacherNote?: string;
  isBuiltIn?: boolean;
  vocabulary: VocabItem[];
  sentences: SentenceChallenge[];
  crayonChallenges: CrayonChallenge[];
  sortingGame?: SortingGameConfig;
  customAudioQuizzes?: AudioQuizQuestion[];
}

export type MapStopId =
  | 'stop-clothes'
  | 'stop-colours'
  | 'stop-wearing'
  | 'stop-dressup'
  | 'stop-seasons'
  | 'stop-weather'
  | 'stop-audio'
  | 'stop-write'
  | 'stop-test';

export interface ModuleProgress {
  moduleId: string;
  masteredWordIds: string[];
  mistakeWordIds: string[];
  stopStars: Partial<Record<MapStopId, number>>; // 0..3 stars per map stop
  stars: number; // total stars earned
  starsSpent: number; // stars spent in Wardrobe
  ownedAccessories: string[];
  equippedAccessories: string[];
  unlockedStickers: string[];
  completedDates: string[]; // YYYY-MM-DD local dates for Mój kalendarz
  treasureClaimed: boolean;
  quizzesCompleted: number;
  bestTestScore: number; // 0..100
  bestLightningScore: number;
  lastPlayedAt: string;
  skillStats: Record<string, { correct: number; total: number }>;
}

export interface AppStateStorage {
  activeModuleId: string;
  progressByModule: Record<string, ModuleProgress>;
  customModules: LessonModule[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
}

export type ChildScreen =
  | { type: 'map' }
  | { type: 'dictionary' }
  | { type: 'audio-quiz'; stopId?: MapStopId; categoryFilter?: VocabCategory; title?: string; dailyMode?: boolean; mistakeOnly?: boolean }
  | { type: 'crayon-studio'; stopId?: MapStopId }
  | { type: 'sentence-builder'; stopId?: MapStopId }
  | { type: 'contrast-memory'; stopId?: MapStopId; initialSubMode?: 'sorting' | 'memory' }
  | { type: 'listen-write'; stopId?: MapStopId }
  | { type: 'test'; stopId?: MapStopId }
  | { type: 'lightning' }
  | { type: 'duel' }
  | { type: 'stickers' }
  | { type: 'wardrobe' }
  | { type: 'parent' };
