import React, { useRef, useState } from 'react';
import { Lock, Star, Volume2, VolumeX } from 'lucide-react';
import { ChildScreen, LessonModule, ModuleProgress } from '../../types/curriculum';
import {
  formatStarsPl,
  getAvailableStars,
  getLast7DaysCalendar,
} from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STICKERS_CATALOG } from '../../data/rewardsCatalog';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { AdventureMap } from '../storybook/AdventureMap';
import { PWAInstallButton } from '../layout/PWAInstallButton';

export const HERO_SCENE_URL = STORYBOOK_ART.heroFriends;

interface StorybookHomeViewProps {
  modules: LessonModule[];
  activeModule: LessonModule;
  progress: ModuleProgress;
  soundEffectsEnabled: boolean;
  onToggleSound: () => void;
  onOpenScreen: (screen: ChildScreen) => void;
  onClaimTreasure: () => void;
  onSelectModule: (id: string) => void;
}

export const StorybookHomeView: React.FC<StorybookHomeViewProps> = ({
  modules,
  activeModule,
  progress,
  soundEffectsEnabled,
  onToggleSound,
  onOpenScreen,
  onClaimTreasure,
  onSelectModule,
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [sceneErr, setSceneErr] = useState(false);
  const holdTimerRef = useRef<number | null>(null);

  const availableStars = getAvailableStars(progress);
  const calendarDays = getLast7DaysCalendar(progress.completedDates);
  const todayDone = calendarDays[calendarDays.length - 1]?.isDone;
  const mistakeCount = progress.mistakeWordIds.length;
  const unlockedStickerCount = progress.unlockedStickers.length;

  const isEnglishClothes = activeModule.id === 'en-unit1-mr-beetle-clothes';

  const startParentHold = () => {
    setHoldProgress(15);
    const start = Date.now();
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 1200) * 100));
      setHoldProgress(pct);
      if (pct >= 100) {
        stopParentHold();
        onOpenScreen({ type: 'parent' });
      }
    }, 60);
  };

  const stopParentHold = () => {
    if (holdTimerRef.current !== null) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const handleHeroSpeak = () => {
    playToneEffect('tap', soundEffectsEnabled);
    speakText(
      activeModule.speechLang.startsWith('en')
        ? "Hello! Let's learn English together! Tap a stop on the map!"
        : `Cześć! Zaczynamy wspólną zabawę: ${activeModule.title}.`,
      { lang: activeModule.speechLang }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16 space-y-6">
      {/* 1. Cozy Storybook Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleHeroSpeak}
            aria-label="Posłuchaj powitania Iskierki"
            className="focus-visible:outline-2 focus-visible:outline-amber-500 rounded-full"
          >
            <MascotAvatar
              size="md"
              equippedAccessories={progress.equippedAccessories}
              mood="happy"
            />
          </button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#3E2F2B]">
              {isEnglishClothes ? 'English with Iskierka' : activeModule.title}
            </h1>
            <p className="text-sm font-semibold text-[#8A7465]">
              {isEnglishClothes
                ? 'Angielski · klasa 2 · Unit 1: clothes, seasons, weather'
                : `${activeModule.subjectLabel} · ${activeModule.gradeLevel}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'wardrobe' });
            }}
            aria-label={`Masz ${availableStars} gwiazdek do wydania w Garderobie Iskierki`}
            className="btn-puffy-white min-h-[46px] px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-bold text-[#3E2F2B] whitespace-nowrap shrink-0 tabular-nums"
          >
            <Star className="w-5 h-5 fill-[#F5A623] text-[#D9820B]" aria-hidden="true" />
            <span>{availableStars} do wydania</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleSound();
            }}
            aria-label={soundEffectsEnabled ? 'Wycisz dźwięki' : 'Włącz dźwięki'}
            className="btn-puffy-white min-h-[46px] min-w-[46px] rounded-full flex items-center justify-center text-[#3E2F2B]"
          >
            {soundEffectsEnabled ? (
              <Volume2 className="w-5 h-5 text-[#5496E8]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-5 h-5 text-[#A89687]" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Warm Dashed Storybook Welcome Card with Generated Illustration */}
      <section className="rounded-[30px] bg-[#FFFDF8] border-2 border-dashed border-[#DFC19B] shadow-[0_6px_20px_rgba(133,94,58,0.06)] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {!sceneErr && (
          <img
            src={HERO_SCENE_URL}
            alt="Dziewczynka i Pan Chrząszcz rysują kredkami ubrania"
            referrerPolicy="no-referrer"
            onError={() => setSceneErr(true)}
            className="w-full sm:w-52 h-40 sm:h-36 rounded-[22px] object-cover border-2 border-[#EEDAC1] shadow-sm shrink-0"
          />
        )}
        <div className="flex-1 text-center sm:text-left">
          <p className="font-display text-lg sm:text-xl font-bold text-[#3E2F2B] leading-snug">
            Cześć! Iskierka i Pan Chrząszcz uczą się angielskiego razem z Tobą!
          </p>
          <p className="mt-1.5 text-sm text-[#6E5B4F] leading-relaxed">
            Idź ścieżką przez cztery pory roku. Za każdy przystanek dostajesz gwiazdki, naklejki do albumu oraz ubranka do Garderoby Iskierki. Przycisk z głośnikiem czyta słowa po angielsku!
          </p>
        </div>
      </section>

      {/* 3. Mój kalendarz (7-day streak card) */}
      <section className="storybook-card rounded-[28px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="font-display text-xl font-bold text-[#3E2F2B]">Mój kalendarz</h2>
            <span className="text-sm font-semibold text-[#8A7465]">
              {todayDone
                ? 'Dzisiejsze zadanie zaliczone — brawo!'
                : 'Zrób zadanie dnia i zacznij serię!'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({
                type: 'audio-quiz',
                title: 'Zadanie dnia (5 pytań)',
                dailyMode: true,
              });
            }}
            className="text-sm font-bold text-[#5496E8] hover:underline whitespace-nowrap"
          >
            Zrób zadanie dnia →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => (
            <div
              key={day.dateKey}
              className={`rounded-2xl py-2.5 px-1 flex flex-col items-center justify-center transition-colors ${
                day.isToday
                  ? 'bg-[#EEF6FF] border-2 border-[#5496E8]'
                  : day.isDone
                    ? 'bg-[#FEF7DC] border-2 border-[#F3DFA2]'
                    : 'bg-[#FAF5EE] border border-[#F0E5D7]'
              }`}
            >
              <span className="text-xs font-bold text-[#8A7465]">{day.weekdayShort}</span>
              <span className="mt-0.5 font-display text-lg font-bold text-[#3E2F2B] tabular-nums">
                {day.dayNumber}
              </span>
              {day.isDone && (
                <Star
                  className="mt-0.5 w-4 h-4 fill-[#F5A623] text-[#D9820B]"
                  aria-label="Zadanie wykonane"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Interactive 4-Seasons Adventure Map */}
      <AdventureMap
        module={activeModule}
        progress={progress}
        onOpenScreen={(screen) => {
          playToneEffect('tap', soundEffectsEnabled);
          onOpenScreen(screen);
        }}
        onClaimTreasure={onClaimTreasure}
      />

      {/* 5. Gry i nagrody (Warm Playful Tiles matching Screenshot 2) */}
      <section aria-labelledby="games-rewards-heading" className="pt-2">
        <h2
          id="games-rewards-heading"
          className="font-display text-2xl font-bold text-[#3E2F2B] mb-4"
        >
          Gry i nagrody
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Słowniczek obrazkowy */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'dictionary' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <ItemIllustration kind="jumper" colorHex="#FACC15" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Słowniczek obrazkowy
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465]">
                Picture dictionary: posłuchaj słówek
              </p>
            </div>
          </button>

          {/* Zadanie dnia */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({
                type: 'audio-quiz',
                title: 'Zadanie dnia',
                dailyMode: true,
              });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <ItemIllustration kind="winter" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Zadanie dnia
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465]">
                5 szybkich zadań za gwiazdki
              </p>
            </div>
          </button>

          {/* Błyskawica */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'lightning' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.gameLightning}
                alt="Bajkowa błyskawica z gwiazdkami"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Błyskawica
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465] tabular-nums">
                {progress.bestLightningScore > 0
                  ? `Rekord: ${progress.bestLightningScore} pkt w minutę!`
                  : 'Ile zrobisz w minutę?'}
              </p>
            </div>
          </button>

          {/* Powtórka błędów */}
          <button
            type="button"
            disabled={mistakeCount === 0}
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({
                type: 'audio-quiz',
                title: 'Powtórka błędów',
                mistakeOnly: true,
              });
            }}
            className={`storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left transition-all min-h-[108px] ${
              mistakeCount === 0
                ? 'opacity-80 cursor-default'
                : 'hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99]'
            }`}
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <ItemIllustration kind="rainy" className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Powtórka błędów
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465]">
                {mistakeCount === 0
                  ? 'Brak błędów. Super!'
                  : `Do poćwiczenia: ${mistakeCount}`}
              </p>
            </div>
          </button>

          {/* Pojedynek z rodzicem */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'duel' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.gameDuel}
                alt="Dwa złote medale rodzinnego pojedynku"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Pojedynek
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465]">
                Zagraj z rodzicem na iPadzie!
              </p>
            </div>
          </button>

          {/* Album naklejek */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'stickers' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.gameStickers}
                alt="Otwarty bajkowy album z naklejkami"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.05]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Album naklejek
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465] tabular-nums">
                {unlockedStickerCount} z {STICKERS_CATALOG.length} naklejek
              </p>
            </div>
          </button>

          {/* Garderoba Iskierki */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'wardrobe' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <MascotAvatar
              size="sm"
              equippedAccessories={progress.equippedAccessories}
              className="w-[72px] h-[72px]"
            />
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Garderoba Iskierki
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465] tabular-nums">
                {formatStarsPl(availableStars)} do wydania
              </p>
            </div>
          </button>

          {/* Audio Memory */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'contrast-memory', initialSubMode: 'memory' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.memoryCardBack}
                alt="Bajkowe karty Audio Memory z księżycem i gwiazdkami"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.18]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Audio Memory
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#8A7465]">
                Odkrywaj pary i słuchaj słówek
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 6. Soft Butter-Cream "Dla rodzica" Card (matching Screenshot 2) */}
      <section className="rounded-[28px] bg-[#FEF7DC] border-2 border-[#F3E2A9] p-6 sm:p-7 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h2 className="font-display text-xl font-bold text-[#4E3818]">Dla rodzica</h2>
            <p className="text-sm text-[#6B5028] leading-relaxed">
              {activeModule.teacherNote ||
                'Zakres: podręcznik str. 8–16 i słowniczek ze str. 80. Ubrania, kolory, zdania „I\'m wearing a coat / purple shorts”, pory roku i pogoda.'}
            </p>
            <p className="text-sm text-[#6B5028] leading-relaxed">
              Lektor angielski w Unit 1 to studyjne nagrania brytyjskie MP3 (wbudowane offline w aplikację — dla własnych nowych modułów automatycznie włącza się głos iPada). Jeśli nic nie słychać, sprawdź, czy iPad nie jest wyciszony. W dyktandzie można klikać literki lub pisać rysikiem Apple Pencil (Bazgroły).
            </p>
          </div>
          <div className="shrink-0">
            <PWAInstallButton />
          </div>
        </div>

        {/* Quiet subject switcher for parent + protected Parent Panel button */}
        <div className="pt-3 border-t border-[#EED998] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 max-w-full">
            <button
              type="button"
              onMouseDown={startParentHold}
              onMouseUp={stopParentHold}
              onMouseLeave={stopParentHold}
              onTouchStart={startParentHold}
              onTouchEnd={stopParentHold}
              onClick={() => onOpenScreen({ type: 'parent' })}
              className="relative overflow-hidden min-h-[46px] max-w-full px-5 py-2.5 rounded-full bg-white border-2 border-dashed border-[#D3B56E] text-sm font-bold text-[#5C4118] hover:bg-[#FFFDF5] inline-flex items-center gap-2 text-left"
            >
              {holdProgress > 0 && (
                <span
                  className="absolute inset-y-0 left-0 bg-amber-200/70 transition-all"
                  style={{ width: `${holdProgress}%` }}
                />
              )}
              <Lock className="w-4 h-4 relative z-10 shrink-0" aria-hidden="true" />
              <span className="relative z-10">
                Panel rodzica (moduły, JSON, architektura)
              </span>
            </button>
          </div>

          {modules.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
              <label htmlFor="parent-quick-module" className="text-xs font-bold text-[#7A5D2E] shrink-0">
                Przedmiot / moduł:
              </label>
              <select
                id="parent-quick-module"
                value={activeModule.id}
                onChange={(e) => onSelectModule(e.target.value)}
                className="min-h-[40px] w-full sm:w-auto max-w-full min-w-0 rounded-full border border-[#E2CA86] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4E3818]"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.subjectLabel} — {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
