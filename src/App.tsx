import React, { useEffect, useMemo, useState } from 'react';
import {
  AppStateStorage,
  ChildScreen,
  LessonModule,
  MapStopId,
  ModuleProgress,
  StickerSceneId,
} from './types/curriculum';
import {
  createEmptyProgress,
  getAllModules,
  loadAppState,
  saveAppState,
} from './engine/storage';
import { formatLocalDateKey, getAvailableStars } from './engine/gameEngine';
import { preloadAudioSprite, stopSpeaking } from './engine/audioEngine';
import { STICKERS_CATALOG, WARDROBE_ACCESSORIES } from './data/rewardsCatalog';
import { StorybookHomeView } from './components/views/StorybookHomeView';
import { DictionaryView } from './components/views/DictionaryView';
import { AudioQuizView } from './components/views/AudioQuizView';
import { CrayonStudioView } from './components/views/CrayonStudioView';
import { SentenceBuilderView } from './components/views/SentenceBuilderView';
import { ContrastMemoryView } from './components/views/ContrastMemoryView';
import { ListenWriteView } from './components/views/ListenWriteView';
import { LightningDuelView } from './components/views/LightningDuelView';
import { RewardsWardrobeView } from './components/views/RewardsWardrobeView';
import { MockTestView } from './components/views/MockTestView';
import { ParentStudioView } from './components/views/ParentStudioView';
import { WordGardenView } from './components/views/WordGardenView';
import { VoiceStudioView } from './components/views/VoiceStudioView';
import { ComicStoryView } from './components/views/ComicStoryView';
import { WarmupView } from './components/views/WarmupView';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled view error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen storybook-canvas flex items-center justify-center p-6">
          <div className="storybook-card rounded-[32px] p-8 max-w-md text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#3E2F2B]">
              Ups! Coś się na chwilę zacięło
            </h1>
            <p className="text-sm font-semibold text-[#6E5B4F]">
              Twoje gwiazdki i naklejki są bezpieczne. Wróć na mapę przygód, aby kontynuować naukę!
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset();
              }}
              className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display font-bold"
            >
              Wróć na mapę przygód
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getInitialScreen(): ChildScreen {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return {
        type: 'audio-quiz',
        stopId: 'stop-clothes',
        categoryFilter: 'clothes',
        title: 'Ubrania',
      };
    }
  }
  return { type: 'map' };
}

function addUnique(list: string[], items: string[]): string[] {
  const set = new Set(list);
  for (const item of items) {
    if (item) set.add(item);
  }
  return Array.from(set);
}

export default function App() {
  const [appState, setAppState] = useState<AppStateStorage>(() => loadAppState());
  const [screen, setScreen] = useState<ChildScreen>(() => getInitialScreen());

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    preloadAudioSprite();
  }, []);

  const allModules = useMemo(
    () => getAllModules(appState.customModules),
    [appState.customModules]
  );

  const activeModule = useMemo<LessonModule>(() => {
    return allModules.find((m) => m.id === appState.activeModuleId) || allModules[0];
  }, [allModules, appState.activeModuleId]);

  const activeProgress: ModuleProgress = useMemo(() => {
    return (
      appState.progressByModule[activeModule.id] ||
      createEmptyProgress(activeModule.id)
    );
  }, [appState.progressByModule, activeModule.id]);

  const navigateTo = (next: ChildScreen) => {
    stopSpeaking();
    setScreen(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateActiveProgress = (updater: (prev: ModuleProgress) => ModuleProgress) => {
    setAppState((prev) => {
      const curr =
        prev.progressByModule[activeModule.id] ||
        createEmptyProgress(activeModule.id);
      return {
        ...prev,
        progressByModule: {
          ...prev.progressByModule,
          [activeModule.id]: {
            ...updater(curr),
            lastPlayedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const recordActivityCompletion = (opts: {
    starsEarned: number;
    stopId?: MapStopId;
    mapStars?: number;
    masteredIds?: string[];
    mistakeIds?: string[];
    fixedMistakeIds?: string[];
    extraStickerIds?: string[];
    bestTestScore?: number;
    bestLightningScore?: number;
  }) => {
    const todayKey = formatLocalDateKey(new Date());
    const stopSticker = opts.stopId
      ? STICKERS_CATALOG.find((s) => s.unlockedByStop === opts.stopId)?.id
      : undefined;

    const stickersToUnlock = [
      ...(stopSticker ? [stopSticker] : []),
      ...(opts.extraStickerIds || []),
    ];

    updateActiveProgress((curr) => {
      const nextStopStars = { ...curr.stopStars };
      if (opts.stopId && typeof opts.mapStars === 'number') {
        nextStopStars[opts.stopId] = Math.max(
          nextStopStars[opts.stopId] || 0,
          opts.mapStars
        );
      }

      const fixedSet = new Set(opts.fixedMistakeIds || []);
      const filteredMistakes = curr.mistakeWordIds.filter((id) => !fixedSet.has(id));
      const nextMistakes = addUnique(filteredMistakes, opts.mistakeIds || []);

      return {
        ...curr,
        stars: curr.stars + opts.starsEarned,
        quizzesCompleted: curr.quizzesCompleted + 1,
        stopStars: nextStopStars,
        completedDates: addUnique(curr.completedDates, [todayKey]),
        masteredWordIds: addUnique(curr.masteredWordIds, opts.masteredIds || []),
        mistakeWordIds: nextMistakes,
        unlockedStickers: addUnique(curr.unlockedStickers, stickersToUnlock),
        bestTestScore:
          typeof opts.bestTestScore === 'number'
            ? Math.max(curr.bestTestScore, opts.bestTestScore)
            : curr.bestTestScore,
        bestLightningScore:
          typeof opts.bestLightningScore === 'number'
            ? Math.max(curr.bestLightningScore, opts.bestLightningScore)
            : curr.bestLightningScore,
      };
    });
  };

  const handleToggleMastered = (wordId: string) => {
    updateActiveProgress((curr) => {
      const exists = curr.masteredWordIds.includes(wordId);
      return {
        ...curr,
        masteredWordIds: exists
          ? curr.masteredWordIds.filter((id) => id !== wordId)
          : [...curr.masteredWordIds, wordId],
        stars: exists ? Math.max(curr.starsSpent, curr.stars - 1) : curr.stars + 1,
      };
    });
  };

  const handleClaimTreasure = () => {
    updateActiveProgress((curr) => {
      if (curr.treasureClaimed) return curr;
      return {
        ...curr,
        treasureClaimed: true,
        stars: curr.stars + 6,
        unlockedStickers: addUnique(curr.unlockedStickers, ['stk-treasure']),
        ownedAccessories: addUnique(curr.ownedAccessories, ['acc-winter-hat']),
      };
    });
  };

  const handleUpdateStickerPlacement = (stickerId: string, xPct: number, yPct: number) => {
    updateActiveProgress((curr) => ({
      ...curr,
      stickerPlacements: {
        ...curr.stickerPlacements,
        [stickerId]: { xPct, yPct },
      },
    }));
  };

  const handleRemoveStickerPlacement = (stickerId: string) => {
    updateActiveProgress((curr) => {
      const next = { ...curr.stickerPlacements };
      delete next[stickerId];
      return { ...curr, stickerPlacements: next };
    });
  };

  const handleClearStickers = () => {
    updateActiveProgress((curr) => ({
      ...curr,
      stickerPlacements: {},
    }));
  };

  const handleChangeStickerScene = (sceneId: StickerSceneId) => {
    updateActiveProgress((curr) => ({
      ...curr,
      stickerSceneId: sceneId,
    }));
  };

  const handleBuyAccessory = (accessoryId: string, price: number) => {
    const item = WARDROBE_ACCESSORIES.find((a) => a.id === accessoryId);
    if (!item) return;

    updateActiveProgress((curr) => {
      if (curr.ownedAccessories.includes(accessoryId)) return curr;
      if (getAvailableStars(curr) < price) return curr;

      return {
        ...curr,
        starsSpent: curr.starsSpent + price,
        ownedAccessories: addUnique(curr.ownedAccessories, [accessoryId]),
        // Strictly max 1 active accessory so outfits never stack or overlap
        equippedAccessories: [accessoryId],
      };
    });
  };

  const handleToggleEquipAccessory = (accessoryId: string) => {
    const item = WARDROBE_ACCESSORIES.find((a) => a.id === accessoryId);
    if (!item) return;

    updateActiveProgress((curr) => {
      if (!curr.ownedAccessories.includes(accessoryId)) return curr;
      const isEquipped = curr.equippedAccessories.includes(accessoryId);
      return {
        ...curr,
        equippedAccessories: isEquipped ? [] : [accessoryId],
      };
    });
  };

  const handleSelectModule = (moduleId: string) => {
    setAppState((prev) => ({
      ...prev,
      activeModuleId: moduleId,
    }));
  };

  const handleAddCustomModule = (mod: LessonModule) => {
    setAppState((prev) => ({
      ...prev,
      customModules: [...prev.customModules.filter((m) => m.id !== mod.id), mod].slice(-25),
    }));
  };

  const handleDeleteCustomModule = (moduleId: string) => {
    setAppState((prev) => {
      const remaining = prev.customModules.filter((m) => m.id !== moduleId);
      const nextActive =
        prev.activeModuleId === moduleId ? allModules[0].id : prev.activeModuleId;
      return {
        ...prev,
        activeModuleId: nextActive,
        customModules: remaining,
      };
    });
  };

  const handleResetProgress = (moduleId: string) => {
    setAppState((prev) => ({
      ...prev,
      progressByModule: {
        ...prev.progressByModule,
        [moduleId]: createEmptyProgress(moduleId),
      },
    }));
  };

  return (
    <AppErrorBoundary onReset={() => navigateTo({ type: 'map' })}>
    <div className="min-h-screen storybook-canvas text-[#3E2F2B]">
      <main>
        {screen.type === 'map' && (
          <StorybookHomeView
            modules={allModules}
            activeModule={activeModule}
            progress={activeProgress}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            onToggleSound={() =>
              setAppState((prev) => ({
                ...prev,
                soundEffectsEnabled: !prev.soundEffectsEnabled,
              }))
            }
            onOpenScreen={navigateTo}
            onClaimTreasure={handleClaimTreasure}
            onSelectModule={handleSelectModule}
          />
        )}

        {screen.type === 'dictionary' && (
          <DictionaryView
            module={activeModule}
            masteredWordIds={activeProgress.masteredWordIds}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            onToggleMastered={handleToggleMastered}
            onBackToMap={() => navigateTo({ type: 'map' })}
          />
        )}

        {screen.type === 'audio-quiz' && (
          <AudioQuizView
            module={activeModule}
            title={screen.title || 'Słuchanie'}
            categoryFilter={screen.categoryFilter}
            onlyWordIds={screen.mistakeOnly ? activeProgress.mistakeWordIds : undefined}
            questionCount={screen.dailyMode ? 5 : 6}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteQuiz={(starsEarned, mapStars, masteredIds, mistakeIds, fixedMistakeIds) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId,
                mapStars,
                masteredIds,
                mistakeIds,
                fixedMistakeIds,
                extraStickerIds: screen.dailyMode ? ['stk-daily'] : [],
              });
            }}
          />
        )}

        {screen.type === 'crayon-studio' && (
          <CrayonStudioView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteSession={(starsEarned, mapStars) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId || 'stop-dressup',
                mapStars,
              });
            }}
          />
        )}

        {screen.type === 'sentence-builder' && (
          <SentenceBuilderView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteSession={(starsEarned, mapStars) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId || 'stop-wearing',
                mapStars,
              });
            }}
          />
        )}

        {screen.type === 'contrast-memory' && (
          <ContrastMemoryView
            module={activeModule}
            initialSubMode={screen.initialSubMode}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteGame={(starsEarned, mapStars) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId,
                mapStars,
              });
            }}
          />
        )}

        {screen.type === 'listen-write' && (
          <ListenWriteView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onComplete={(starsEarned, mapStars, masteredIds) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId || 'stop-write',
                mapStars,
                masteredIds,
              });
            }}
          />
        )}

        {screen.type === 'test' && (
          <MockTestView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onTestFinished={(scorePct, starsEarned, mapStars) => {
              recordActivityCompletion({
                starsEarned,
                stopId: screen.stopId || 'stop-test',
                mapStars,
                bestTestScore: scorePct,
              });
            }}
            onBackToMap={() => navigateTo({ type: 'map' })}
          />
        )}

        {(screen.type === 'lightning' || screen.type === 'duel') && (
          <LightningDuelView
            mode={screen.type}
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteLightning={(score, starsEarned) => {
              recordActivityCompletion({
                starsEarned,
                bestLightningScore: score,
              });
            }}
            onCompleteDuel={(starsEarned) => {
              recordActivityCompletion({
                starsEarned,
                extraStickerIds: ['stk-duel'],
              });
            }}
          />
        )}

        {(screen.type === 'stickers' || screen.type === 'wardrobe') && (
          <RewardsWardrobeView
            mode={screen.type}
            module={activeModule}
            progress={activeProgress}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onBuyAccessory={handleBuyAccessory}
            onToggleEquipAccessory={handleToggleEquipAccessory}
            onUpdateStickerPlacement={handleUpdateStickerPlacement}
            onRemoveStickerPlacement={handleRemoveStickerPlacement}
            onClearStickers={handleClearStickers}
            onChangeStickerScene={handleChangeStickerScene}
          />
        )}

        {screen.type === 'garden' && (
          <WordGardenView
            module={activeModule}
            progress={activeProgress}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onWaterWordSuccess={(wordId) => {
              recordActivityCompletion({
                starsEarned: 1,
                masteredIds: [wordId],
                fixedMistakeIds: [wordId],
              });
            }}
          />
        )}

        {screen.type === 'voice-studio' && (
          <VoiceStudioView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteVoiceSession={(starsEarned) => {
              recordActivityCompletion({
                starsEarned,
                extraStickerIds: ['stk-voice'],
              });
            }}
          />
        )}

        {screen.type === 'comic' && (
          <ComicStoryView
            module={activeModule}
            equippedAccessories={activeProgress.equippedAccessories}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteComic={(starsEarned) => {
              recordActivityCompletion({
                starsEarned,
                extraStickerIds: ['stk-comic'],
              });
            }}
          />
        )}

        {screen.type === 'warmup' && (
          <WarmupView
            module={activeModule}
            progress={activeProgress}
            soundEffectsEnabled={appState.soundEffectsEnabled}
            speechRate={appState.speechRate}
            onBackToMap={() => navigateTo({ type: 'map' })}
            onCompleteWarmup={(starsEarned, masteredIds, mistakeIds) => {
              recordActivityCompletion({
                starsEarned,
                masteredIds,
                mistakeIds,
              });
            }}
          />
        )}

        {screen.type === 'parent' && (
          <ParentStudioView
            modules={allModules}
            activeModule={activeModule}
            progressByModule={appState.progressByModule}
            speechRate={appState.speechRate}
            onChangeSpeechRate={(rate) =>
              setAppState((prev) => ({ ...prev, speechRate: rate }))
            }
            onSelectModule={handleSelectModule}
            onAddCustomModule={handleAddCustomModule}
            onDeleteCustomModule={handleDeleteCustomModule}
            onResetProgress={handleResetProgress}
            onBackToMap={() => navigateTo({ type: 'map' })}
          />
        )}
      </main>
    </div>
    </AppErrorBoundary>
  );
}
