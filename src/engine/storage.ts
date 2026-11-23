import { BUILT_IN_MODULES } from '../data/demoModules';
import { AppStateStorage, LessonModule, ModuleProgress } from '../types/curriculum';
import { validateLessonModuleJson } from './gameEngine';

const STORAGE_KEY = 'lingoplay_storybook_state_v2';
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_CUSTOM_MODULES = 25;

function clampInt(value: unknown, min: number, max: number, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function sanitizeStringArray(value: unknown, maxItems = 200): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 80)
    .slice(0, maxItems);
}

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
    stickerPlacements: {},
    stickerSceneId: 'seasons',
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
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const sceneId =
    raw.stickerSceneId === 'boutique' || raw.stickerSceneId === 'picnic'
      ? raw.stickerSceneId
      : 'seasons';

  const safeStopStars: Record<string, number> = {};
  if (raw.stopStars && typeof raw.stopStars === 'object' && !Array.isArray(raw.stopStars)) {
    for (const [k, v] of Object.entries(raw.stopStars)) {
      if (!FORBIDDEN_KEYS.has(k) && k.length <= 48) {
        safeStopStars[k] = clampInt(v, 0, 3, 0);
      }
    }
  }

  const safePlacements: ModuleProgress['stickerPlacements'] = {};
  if (
    raw.stickerPlacements &&
    typeof raw.stickerPlacements === 'object' &&
    !Array.isArray(raw.stickerPlacements)
  ) {
    for (const [k, v] of Object.entries(raw.stickerPlacements)) {
      if (
        !FORBIDDEN_KEYS.has(k) &&
        k.length <= 48 &&
        v &&
        typeof v === 'object' &&
        typeof v.xPct === 'number' &&
        typeof v.yPct === 'number' &&
        Number.isFinite(v.xPct) &&
        Number.isFinite(v.yPct)
      ) {
        safePlacements[k] = {
          xPct: Math.min(100, Math.max(0, v.xPct)),
          yPct: Math.min(100, Math.max(0, v.yPct)),
        };
      }
    }
  }

  return {
    ...base,
    moduleId,
    masteredWordIds: sanitizeStringArray(raw.masteredWordIds, 200),
    mistakeWordIds: sanitizeStringArray(raw.mistakeWordIds, 200),
    stopStars: safeStopStars,
    stars: clampInt(raw.stars, 0, 100000, 0),
    starsSpent: clampInt(raw.starsSpent, 0, 100000, 0),
    ownedAccessories: sanitizeStringArray(raw.ownedAccessories, 50),
    equippedAccessories: sanitizeStringArray(raw.equippedAccessories, 1),
    unlockedStickers: sanitizeStringArray(raw.unlockedStickers, 50),
    stickerPlacements: safePlacements,
    stickerSceneId: sceneId,
    completedDates: sanitizeStringArray(raw.completedDates, 400),
    treasureClaimed: Boolean(raw.treasureClaimed),
    quizzesCompleted: clampInt(raw.quizzesCompleted, 0, 100000, 0),
    bestTestScore: clampInt(raw.bestTestScore, 0, 100, 0),
    bestLightningScore: clampInt(raw.bestLightningScore, 0, 500, 0),
    lastPlayedAt:
      typeof raw.lastPlayedAt === 'string' && raw.lastPlayedAt.length <= 40
        ? raw.lastPlayedAt
        : base.lastPlayedAt,
    skillStats: {},
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
    if (!raw || raw.length > 2 * 1024 * 1024) return getDefaultAppState();
    const parsed = JSON.parse(raw, (key, value) =>
      FORBIDDEN_KEYS.has(key) ? undefined : value
    ) as Partial<AppStateStorage>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return getDefaultAppState();
    }
    const normalizedMap: Record<string, ModuleProgress> = {};
    if (
      parsed.progressByModule &&
      typeof parsed.progressByModule === 'object' &&
      !Array.isArray(parsed.progressByModule)
    ) {
      for (const [k, v] of Object.entries(parsed.progressByModule)) {
        if (!FORBIDDEN_KEYS.has(k) && k.length <= 64) {
          normalizedMap[k] = normalizeProgress(k, v);
        }
      }
    }
    const safeCustomModules: LessonModule[] = [];
    if (Array.isArray(parsed.customModules)) {
      for (const candidate of parsed.customModules.slice(0, MAX_CUSTOM_MODULES)) {
        const res = validateLessonModuleJson(JSON.stringify(candidate));
        if (res.valid && res.module) {
          safeCustomModules.push(res.module);
        }
      }
    }
    const activeId =
      typeof parsed.activeModuleId === 'string' &&
      !FORBIDDEN_KEYS.has(parsed.activeModuleId) &&
      parsed.activeModuleId.length <= 64
        ? parsed.activeModuleId
        : BUILT_IN_MODULES[0].id;
    return {
      activeModuleId: activeId,
      progressByModule: normalizedMap,
      customModules: safeCustomModules,
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
