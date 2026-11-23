import React, { useEffect, useRef, useState } from 'react';
import { CalendarCheck, Flame, Lock, Play, Star, Timer, Volume2, VolumeX } from 'lucide-react';
import { ChildScreen, LessonModule, ModuleProgress } from '../../types/curriculum';
import {
  formatStarsPl,
  getAvailableStars,
  getCurrentStreak,
  getLast7DaysCalendar,
  getTotalMapStars,
} from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STICKERS_CATALOG } from '../../data/rewardsCatalog';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { AdventureMap, getMapStops, getNextStop } from '../storybook/AdventureMap';
import { PWAInstallButton } from '../layout/PWAInstallButton';

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
  const [holdHintVisible, setHoldHintVisible] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdHintTimerRef = useRef<number | null>(null);
  const holdCompletedRef = useRef(false);

  const availableStars = getAvailableStars(progress);
  const calendarDays = getLast7DaysCalendar(progress.completedDates);
  const todayDone = calendarDays[calendarDays.length - 1]?.isDone;
  const streak = getCurrentStreak(progress.completedDates);
  const mapStops = getMapStops(activeModule);
  const nextStop = getNextStop(mapStops, progress);
  const doneStops = mapStops.filter((s) => (progress.stopStars[s.id] || 0) > 0).length;
  const mapStars = getTotalMapStars(progress);
  const mistakeCount = progress.mistakeWordIds.length;
  const unlockedStickerCount = progress.unlockedStickers.length;

  const isEnglishClothes = activeModule.id === 'en-unit1-mr-beetle-clothes';

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (holdHintTimerRef.current !== null) {
        clearTimeout(holdHintTimerRef.current);
        holdHintTimerRef.current = null;
      }
    };
  }, []);

  const startParentHold = () => {
    if (holdTimerRef.current !== null) return;
    holdCompletedRef.current = false;
    setHoldHintVisible(false);
    setHoldProgress(12);
    const start = Date.now();
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / 1200) * 100));
      setHoldProgress(pct);
      if (pct >= 100) {
        holdCompletedRef.current = true;
        stopParentHold(false);
        onOpenScreen({ type: 'parent' });
      }
    }, 60);
  };

  const stopParentHold = (showHintIfIncomplete = true) => {
    const wasHolding = holdTimerRef.current !== null;
    if (holdTimerRef.current !== null) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
    if (showHintIfIncomplete && wasHolding && !holdCompletedRef.current) {
      setHoldHintVisible(true);
      if (holdHintTimerRef.current !== null) clearTimeout(holdHintTimerRef.current);
      holdHintTimerRef.current = window.setTimeout(() => setHoldHintVisible(false), 2400);
    }
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
            <p className="text-sm font-semibold text-[#755F51]">
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
            <span className="text-base">{availableStars}</span>
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
              <Volume2 className="w-5 h-5 text-[#2F6DB5]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-5 h-5 text-[#A89687]" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* 2. One obvious next step: continue the adventure */}
      <section
        aria-labelledby="next-stop-heading"
        className="rounded-[30px] border-2 border-[#CBEBD5] bg-gradient-to-br from-[#FFFDF8] to-[#F1FAF3] shadow-[0_6px_20px_rgba(62,154,91,0.08)] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_minmax(300px,330px)] items-center gap-4 md:gap-6"
      >
        <button
          type="button"
          onClick={handleHeroSpeak}
          aria-label="Posłuchaj powitania Iskierki"
          className="hidden md:flex justify-center rounded-3xl focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <MascotAvatar
            variant="stage"
            equippedAccessories={progress.equippedAccessories}
            className="w-40! h-40! sm:w-40! sm:h-40! -my-3"
          />
        </button>

        <div className="min-w-0 text-center md:text-left">
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#2B7A47]">
            {nextStop ? 'Następny przystanek' : 'Cała mapa ukończona!'}
          </p>
          <h2 id="next-stop-heading" className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#3E2F2B] leading-tight">
            {nextStop ? `${nextStop.num} · ${nextStop.titleEn}` : 'Brawo, mistrzyni!'}
          </h2>
          <p className="mt-0.5 text-base sm:text-lg font-bold text-[#755F51]">
            {nextStop
              ? nextStop.descriptionPl
              : 'Zbieraj więcej gwiazdek, powtarzając ulubione przystanki.'}
          </p>
          <div
            className="mt-3.5 h-3 rounded-full bg-[#E1F0E6] overflow-hidden"
            role="progressbar"
            aria-label="Postęp na mapie"
            aria-valuemin={0}
            aria-valuemax={mapStops.length}
            aria-valuenow={doneStops}
          >
            <div
              className="h-full rounded-full bg-[#55B373] transition-[width] duration-500"
              style={{ width: `${(doneStops / mapStops.length) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-sm font-bold text-[#755F51] tabular-nums">
            {doneStops} z {mapStops.length} przystanków · ⭐ {mapStars} na mapie
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen(
                nextStop
                  ? nextStop.targetScreen
                  : { type: 'audio-quiz', title: 'Zadanie dnia', dailyMode: true }
              );
            }}
            className="btn-puffy-green min-h-[72px] rounded-full font-display text-2xl font-bold inline-flex items-center justify-center gap-3"
          >
            <Play className="w-7 h-7 fill-current" aria-hidden="true" />
            {nextStop ? 'Graj dalej' : 'Zagraj znowu'}
          </button>

          <div className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-2"
              aria-label={`Seria: ${streak} ${streak === 1 ? 'dzień' : 'dni'} z rzędu`}
            >
              <Flame
                className={`w-5 h-5 ${streak > 0 ? 'fill-[#F5A623] text-[#D9820B]' : 'text-[#C9B8A6]'}`}
                aria-hidden="true"
              />
              <span className="text-sm font-extrabold text-[#3E2F2B] tabular-nums whitespace-nowrap">
                {streak} {streak === 1 ? 'dzień' : 'dni'}
              </span>
              <span className="flex gap-1" aria-hidden="true">
                {calendarDays.map((day) => (
                  <span
                    key={day.dateKey}
                    title={`${day.weekdayShort} ${day.dayNumber}`}
                    className={`w-3 h-3 rounded-full ${
                      day.isDone
                        ? 'bg-[#F5A623]'
                        : day.isToday
                          ? 'bg-white ring-2 ring-[#2F6DB5]'
                          : 'bg-[#EADFCF]'
                    }`}
                  />
                ))}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                playToneEffect('tap', soundEffectsEnabled);
                onOpenScreen({ type: 'audio-quiz', title: 'Zadanie dnia', dailyMode: true });
              }}
              aria-label={todayDone ? 'Zadanie dnia — dziś już zrobione' : 'Zadanie dnia'}
              className="btn-puffy-white min-h-[44px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-sm font-bold text-[#3E2F2B] whitespace-nowrap shrink-0"
            >
              <CalendarCheck className={`w-4 h-4 ${todayDone ? 'text-[#2B7A47]' : 'text-[#D9820B]'}`} aria-hidden="true" />
              Zadanie dnia
            </button>
          </div>
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
              <p className="mt-1 text-xs font-semibold text-[#755F51]">
                Posłuchaj wszystkich słówek
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
              <p className="mt-1 text-xs font-semibold text-[#755F51] tabular-nums">
                {progress.bestLightningScore > 0
                  ? `Rekord: ${progress.bestLightningScore} pkt w minutę!`
                  : 'Ile zrobisz w minutę?'}
              </p>
            </div>
          </button>

          {/* Ogródek słówek Iskierki (zastępuje nieaktywną Powtórkę błędów) */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'garden' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#A7E3B9] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.gameWordGarden}
                alt="Bajkowa konewka podlewająca kwitnące słówka"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Ogródek słówek
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#226B3B]">
                {mistakeCount > 0
                  ? `Pączki do podlania: ${mistakeCount}`
                  : `Kwitnie ${progress.masteredWordIds.length} kwiatków!`}
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
              <p className="mt-1 text-xs font-semibold text-[#755F51]">
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
              <p className="mt-1 text-xs font-semibold text-[#755F51] tabular-nums">
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
              <p className="mt-1 text-xs font-semibold text-[#755F51] tabular-nums">
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
                alt="Bajkowe karty Memory z księżycem i gwiazdkami"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.18]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Memory ze słuchu
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#755F51]">
                Znajdź pary i posłuchaj słówek
              </p>
            </div>
          </button>

          {/* Powiedz z Iskierką! (Studio Wymowy) */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'voice-studio' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.gameVoiceStudio}
                alt="Złoty bajkowy mikrofon ze śpiewającymi ptaszkami"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Powiedz z Iskierką!
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#755F51]">
                Nagraj głos i posłuchaj duszka
              </p>
            </div>
          </button>

          {/* Bajkowy Komiks */}
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              onOpenScreen({ type: 'comic' });
            }}
            className="storybook-card rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#DFC29D] active:scale-[0.99] transition-all min-h-[108px]"
          >
            <div className="w-[72px] h-[72px] rounded-2xl watercolor-frame overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={STORYBOOK_ART.comicPanel2Coat}
                alt="Bajkowy komiks Nowe ubrania Pana Chrząszcza"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover scale-[1.06]"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-[#3E2F2B] leading-tight">
                Bajkowy komiks
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#755F51]">
                Historyjka z mówiącymi dymkami
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 6. Parent corner: one quiet bar, details folded away */}
      <section
        aria-labelledby="parent-corner-heading"
        className="rounded-[28px] bg-[#FFFBEF] border-2 border-dashed border-[#E2CA86] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="parent-corner-heading" className="font-display text-lg font-bold text-[#4E3818]">
              Dla rodzica
            </h2>
            <p className="text-sm font-semibold text-[#6B5028]">
              Zakres sprawdzianu, rozgrzewka przed testem, zmiana modułu
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 max-w-full">
            <button
              type="button"
              onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === 'mouse') return;
                startParentHold();
              }}
              onPointerUp={() => stopParentHold(true)}
              onPointerLeave={() => stopParentHold(false)}
              onPointerCancel={() => stopParentHold(false)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                  e.preventDefault();
                  startParentHold();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  stopParentHold(true);
                }
              }}
              aria-label="Panel rodzica — przytrzymaj przez ponad sekundę, aby otworzyć"
              className="relative overflow-hidden select-none min-h-[46px] max-w-full px-5 py-2.5 rounded-full bg-white border-2 border-dashed border-[#D3B56E] text-sm font-bold text-[#5C4118] hover:bg-[#FFFDF5] inline-flex items-center gap-2 text-left"
            >
              {holdProgress > 0 && (
                <span
                  className="absolute inset-y-0 left-0 bg-amber-200/70 transition-all"
                  style={{ width: `${holdProgress}%` }}
                />
              )}
              <Lock className="w-4 h-4 relative z-10 shrink-0" aria-hidden="true" />
              <span className="relative z-10">
                Panel rodzica · przytrzymaj
              </span>
            </button>
            {holdHintVisible && (
              <span className="text-xs font-bold text-[#8A5A12]">
                Przytrzymaj przycisk chwilę dłużej, aby wejść do Panelu rodzica.
              </span>
            )}
          </div>

        </div>

        <details className="group mt-3 border-t border-[#EED998] pt-3">
          <summary className="min-h-[44px] inline-flex items-center gap-1.5 cursor-pointer select-none text-sm font-bold text-[#7A5D2E] list-none [&::-webkit-details-marker]:hidden">
            <span className="transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
            Więcej informacji
          </summary>
          <div className="mt-2 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-2 max-w-3xl">
              <p className="text-sm text-[#6B5028] leading-relaxed">
                {activeModule.teacherNote ||
                  'Zakres: podręcznik str. 8–16 i słowniczek ze str. 80. Ubrania, kolory, zdania „I\'m wearing a coat / purple shorts”, pory roku i pogoda.'}
              </p>
              <p className="text-sm text-[#6B5028] leading-relaxed">
                Lektor angielski w Unit 1 to studyjne nagrania brytyjskie MP3 (wbudowane offline w aplikację — dla własnych nowych modułów automatycznie włącza się głos iPada). Jeśli nic nie słychać, sprawdź, czy iPad nie jest wyciszony. W dyktandzie można klikać literki lub pisać rysikiem Apple Pencil (Bazgroły).
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2.5 md:min-w-[260px]">
              <button
                type="button"
                onClick={() => {
                  playToneEffect('tap', soundEffectsEnabled);
                  onOpenScreen({ type: 'warmup' });
                }}
                className="btn-puffy-amber min-h-[44px] px-4 rounded-full font-display text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                <Timer className="w-4 h-4" aria-hidden="true" />
                3-min rozgrzewka przed sprawdzianem
              </button>
              <PWAInstallButton />
              {modules.length > 1 && (
                <div className="flex flex-col gap-1 min-w-0">
                  <label htmlFor="parent-quick-module" className="text-xs font-bold text-[#7A5D2E]">
                    Przedmiot / moduł:
                  </label>
                  <select
                    id="parent-quick-module"
                    value={activeModule.id}
                    onChange={(e) => onSelectModule(e.target.value)}
                    className="min-h-[44px] w-full max-w-full min-w-0 rounded-full border border-[#E2CA86] bg-white px-3.5 py-1.5 text-xs font-bold text-[#4E3818]"
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
          </div>
        </details>
      </section>
    </div>
  );
};
