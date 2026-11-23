import { BUILT_IN_MODULES } from '../data/demoModules';
import { AppStateStorage, LessonModule, ModuleProgress } from '../types/curriculum';

const STORAGE_KEY = 'lingoplay_storybook_state_v2';

export function createEmptyProgress(moduleId: string): ModuleProgress {
  return {
    moduleId,
    masteredWordIds: [],
    mistakeWordIds: [],
    stopStars: {},
    stars: 0,
    starsSpent: 0,
    ownedAccessories: [],
    equippedAccessories: [],
    unlockedStickers: [],
    completedDates: [],
    treasureClaimed: false,
    quizzesCompleted: 0,
    bestTestScore: 0,
    bestLightningScore: 0,
    lastPlayedAt: new Date().toISOString(),
    skillStats: {},
  };
}

export function normalizeProgress(moduleId: string, raw?: Partial<ModuleProgress>): ModuleProgress {
  const base = createEmptyProgress(moduleId);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    moduleId,
    masteredWordIds: Array.isArray(raw.masteredWordIds) ? raw.masteredWordIds : [],
    mistakeWordIds: Array.isArray(raw.mistakeWordIds) ? raw.mistakeWordIds : [],
    stopStars: raw.stopStars && typeof raw.stopStars === 'object' ? raw.stopStars : {},
    ownedAccessories: Array.isArray(raw.ownedAccessories) ? raw.ownedAccessories : [],
    equippedAccessories: Array.isArray(raw.equippedAccessories) ? raw.equippedAccessories : [],
    unlockedStickers: Array.isArray(raw.unlockedStickers) ? raw.unlockedStickers : [],
    completedDates: Array.isArray(raw.completedDates) ? raw.completedDates : [],
    starsSpent: typeof raw.starsSpent === 'number' ? raw.starsSpent : 0,
    treasureClaimed: Boolean(raw.treasureClaimed),
    bestLightningScore: typeof raw.bestLightningScore === 'number' ? raw.bestLightningScore : 0,
  };
}

export function getDefaultAppState(): AppStateStorage {
  return {
    activeModuleId: BUILT_IN_MODULES[0].id,
    progressByModule: {
      [BUILT_IN_MODULES[0].id]: createEmptyProgress(BUILT_IN_MODULES[0].id),
    },
    customModules: [],
    soundEffectsEnabled: true,
    speechRate: 'normal',
  };
}

export function loadAppState(): AppStateStorage {
  if (typeof window === 'undefined') return getDefaultAppState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAppState();
    const parsed = JSON.parse(raw) as Partial<AppStateStorage>;
    const normalizedMap: Record<string, ModuleProgress> = {};
    if (parsed.progressByModule && typeof parsed.progressByModule === 'object') {
      for (const [k, v] of Object.entries(parsed.progressByModule)) {
        normalizedMap[k] = normalizeProgress(k, v);
      }
    }
    return {
      activeModuleId: parsed.activeModuleId || BUILT_IN_MODULES[0].id,
      progressByModule: normalizedMap,
      customModules: Array.isArray(parsed.customModules) ? parsed.customModules : [],
      soundEffectsEnabled: parsed.soundEffectsEnabled ?? true,
      speechRate: parsed.speechRate === 'slow' ? 'slow' : 'normal',
    };
  } catch {
    return getDefaultAppState();
  }
}

export function saveAppState(state: AppStateStorage): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues in restricted private mode
  }
}

export function getAllModules(customModules: LessonModule[]): LessonModule[] {
  return [...BUILT_IN_MODULES, ...customModules];
}
