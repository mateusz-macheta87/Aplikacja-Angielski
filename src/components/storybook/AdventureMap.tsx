import React, { useState } from 'react';
import { Lock, Star } from 'lucide-react';
import { ChildScreen, LessonModule, MapStopId, ModuleProgress } from '../../types/curriculum';
import { canOpenTreasureChest } from '../../engine/gameEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from './MascotAvatar';

export const MAP_BG_URL = STORYBOOK_ART.mapFourSeasons;
export const TREASURE_IMG_URL = STORYBOOK_ART.treasureChest;

interface MapNode {
  id: MapStopId;
  num: number;
  titleEn: string;
  subtitlePl: string;
  xPct: number; // % in desktop/iPad map canvas
  yPct: number;
  badgeColor: string;
  ringBg: string;
  targetScreen: ChildScreen;
  renderIcon: () => React.ReactNode;
}

const MedallionArt: React.FC<{ src: string; alt: string; zoom?: string }> = ({
  src,
  alt,
  zoom = 'scale-[1.06]',
}) => (
  <img
    src={src}
    alt={alt}
    referrerPolicy="no-referrer"
    loading="lazy"
    className={`w-full h-full object-cover pointer-events-none ${zoom}`}
  />
);

interface AdventureMapProps {
  module: LessonModule;
  progress: ModuleProgress;
  onOpenScreen: (screen: ChildScreen) => void;
  onClaimTreasure: () => void;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({
  module,
  progress,
  onOpenScreen,
  onClaimTreasure,
}) => {
  const [bgError, setBgError] = useState(false);
  const [chestModalOpen, setChestModalOpen] = useState(false);

  const isEnglishClothes = module.id === 'en-unit1-mr-beetle-clothes';
  const treasureUnlocked = canOpenTreasureChest(progress);

  const stops: MapNode[] = [
    {
      id: 'stop-clothes',
      num: 1,
      titleEn: isEnglishClothes ? 'Clothes' : 'Słówka',
      subtitlePl: isEnglishClothes ? 'Ubrania' : 'Poznaj hasła',
      xPct: 12,
      yPct: 24,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: {
        type: 'audio-quiz',
        stopId: 'stop-clothes',
        categoryFilter: isEnglishClothes ? 'clothes' : undefined,
        title: isEnglishClothes ? 'Ubrania' : 'Słownictwo',
      },
      renderIcon: () => (
        <ItemIllustration
          kind="coat"
          colorHex="#E05252"
          className="w-full h-full"
          roundedClass="rounded-full"
        />
      ),
    },
    {
      id: 'stop-colours',
      num: 2,
      titleEn: isEnglishClothes ? 'Colours' : 'Fiszki',
      subtitlePl: isEnglishClothes ? 'Kolory' : 'Słuchaj',
      xPct: 31,
      yPct: 19,
      badgeColor: '#55B373',
      ringBg: '#FFF6E0',
      targetScreen: isEnglishClothes
        ? {
            type: 'audio-quiz',
            stopId: 'stop-colours',
            categoryFilter: 'colours',
            title: 'Kolory i kredki',
          }
        : { type: 'dictionary' },
      renderIcon: () => (
        <ItemIllustration kind="colour-swatch" colorHex="#EAB308" className="w-14 h-14" />
      ),
    },
    {
      id: 'stop-wearing',
      num: 3,
      titleEn: isEnglishClothes ? "I'm wearing" : 'Zdania',
      subtitlePl: 'Zdania',
      xPct: 50,
      yPct: 24,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: { type: 'sentence-builder', stopId: 'stop-wearing' },
      renderIcon: () => (
        <MedallionArt src={STORYBOOK_ART.stopTalking} alt="Chmurka z ptaszkami — Zdania" />
      ),
    },
    {
      id: 'stop-dressup',
      num: 4,
      titleEn: isEnglishClothes ? 'Dress up' : 'Memory',
      subtitlePl: isEnglishClothes ? 'Ubieranka' : 'Gra w pary',
      xPct: 69,
      yPct: 19,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen:
        module.crayonChallenges.length > 0
          ? { type: 'crayon-studio', stopId: 'stop-dressup' }
          : { type: 'contrast-memory', stopId: 'stop-dressup', initialSubMode: 'memory' },
      renderIcon: () => (
        <ItemIllustration
          kind="shorts"
          colorHex="#9333EA"
          className="w-full h-full"
          roundedClass="rounded-full"
        />
      ),
    },
    {
      id: 'stop-seasons',
      num: 5,
      titleEn: isEnglishClothes ? 'Seasons' : 'Sortowanie',
      subtitlePl: isEnglishClothes ? 'Pory roku' : 'Kontrasty',
      xPct: 87,
      yPct: 37,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: {
        type: 'contrast-memory',
        stopId: 'stop-seasons',
        initialSubMode: module.sortingGame ? 'sorting' : 'memory',
      },
      renderIcon: () => (
        <ItemIllustration kind="autumn" className="w-full h-full" roundedClass="rounded-full" />
      ),
    },
    {
      id: 'stop-weather',
      num: 6,
      titleEn: isEnglishClothes ? 'Weather' : 'Quiz Audio',
      subtitlePl: isEnglishClothes ? 'Pogoda' : 'Słuchanie',
      xPct: 69,
      yPct: 57,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: {
        type: 'audio-quiz',
        stopId: 'stop-weather',
        categoryFilter: isEnglishClothes ? 'weather' : undefined,
        title: isEnglishClothes ? 'Pogoda' : 'Quiz Audio',
      },
      renderIcon: () => (
        <ItemIllustration kind="sunny" className="w-full h-full" roundedClass="rounded-full" />
      ),
    },
    {
      id: 'stop-audio',
      num: 7,
      titleEn: 'Iskierka says',
      subtitlePl: 'Słuchanie',
      xPct: 49,
      yPct: 51,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: {
        type: 'audio-quiz',
        stopId: 'stop-audio',
        title: 'Iskierka says — Słuchanie',
      },
      renderIcon: () => (
        <MedallionArt src={STORYBOOK_ART.stopHeadphones} alt="Bajkowe słuchawki z nutkami" />
      ),
    },
    {
      id: 'stop-write',
      num: 8,
      titleEn: 'Listen & write',
      subtitlePl: 'Dyktando',
      xPct: 30,
      yPct: 58,
      badgeColor: '#55B373',
      ringBg: '#FFF8EE',
      targetScreen: { type: 'listen-write', stopId: 'stop-write' },
      renderIcon: () => (
        <MedallionArt src={STORYBOOK_ART.stopPencil} alt="Bajkowy ołówek i zeszyt" />
      ),
    },
    {
      id: 'stop-test',
      num: 9,
      titleEn: 'Test',
      subtitlePl: 'Sprawdzian',
      xPct: 13,
      yPct: 79,
      badgeColor: '#D64988',
      ringBg: '#FFF8EE',
      targetScreen: { type: 'test', stopId: 'stop-test' },
      renderIcon: () => (
        <MedallionArt src={STORYBOOK_ART.stopTrophy} alt="Złoty puchar sprawdzianu" />
      ),
    },
  ];

  // Determine active stop where Iskierka stands (first stop with < 3 stars)
  const activeStopId =
    stops.find((s) => (progress.stopStars[s.id] || 0) === 0)?.id || stops[stops.length - 1].id;

  const handleTreasureClick = () => {
    setChestModalOpen(true);
    if (treasureUnlocked && !progress.treasureClaimed) {
      onClaimTreasure();
    }
  };

  return (
    <section aria-label="Mapa przygód przez cztery pory roku" className="relative">
      {/* Desktop & iPad Landscape/Portrait Winding Map Canvas */}
      <div className="hidden sm:block relative w-full h-[560px] md:h-[600px] rounded-[32px] overflow-hidden border-2 border-[#F0DFC8] shadow-[0_10px_30px_rgba(133,94,58,0.09)] bg-[#FFF8EB]">
        {/* Generated 4-Seasons Watercolor Backdrop */}
        {!bgError && (
          <img
            src={MAP_BG_URL}
            alt="Bajkowa mapa czterech pór roku"
            referrerPolicy="no-referrer"
            onError={() => setBgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-85 select-none pointer-events-none"
          />
        )}
        {/* Soft luminous center scrim so stepping stones stay crisp */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255,250,240,0.72) 0%, rgba(255,248,236,0.34) 68%, rgba(255,248,236,0.16) 100%)',
          }}
        />

        {/* Winding dotted golden-sand path connecting stops 1..9 -> Treasure */}
        <svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <polyline
            points="120,144 310,114 500,144 690,114 870,222 690,342 490,306 300,348 130,474 410,504"
            fill="none"
            stroke="#C9A87E"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="12 14"
            opacity="0.85"
          />
        </svg>

        {/* Stepping-Stone Stops 1..9 */}
        {stops.map((stop) => {
          const earned = progress.stopStars[stop.id] || 0;
          const isMascotHere = stop.id === activeStopId;

          return (
            <div
              key={stop.id}
              style={{ left: `${stop.xPct}%`, top: `${stop.yPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            >
              <button
                type="button"
                onClick={() => onOpenScreen(stop.targetScreen)}
                aria-label={`Przystanek ${stop.num}: ${stop.titleEn} — ${stop.subtitlePl}`}
                className="group relative flex flex-col items-center focus-visible:outline-2 focus-visible:outline-amber-500 rounded-3xl"
              >
                {/* Mascot standing right next to current active stop */}
                {isMascotHere && (
                  <div className="absolute -right-7 -top-4 z-30 pointer-events-none">
                    <MascotAvatar
                      size="sm"
                      equippedAccessories={progress.equippedAccessories}
                      mood="happy"
                      className="shadow-md border-white"
                    />
                  </div>
                )}

                {/* Number Circle Badge */}
                <span
                  style={{ backgroundColor: stop.badgeColor }}
                  className="absolute -left-1.5 -top-1.5 z-20 w-7 h-7 rounded-full text-white font-display text-sm font-bold flex items-center justify-center shadow-sm border-2 border-white"
                >
                  {stop.num}
                </span>

                {/* Circular Stepping Stone */}
                <div
                  style={{ backgroundColor: stop.ringBg }}
                  className="w-[82px] h-[82px] md:w-[88px] md:h-[88px] rounded-full border-4 border-white shadow-[0_6px_16px_rgba(92,65,24,0.16)] overflow-hidden flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform"
                >
                  {stop.renderIcon()}
                </div>

                {/* Label Plaque */}
                <div className="mt-1.5 px-3 py-1 rounded-2xl bg-white/95 border border-[#EFE2D2] shadow-sm text-center min-w-[96px]">
                  <span className="block font-display text-sm font-bold text-[#3E2F2B] leading-tight whitespace-nowrap">
                    {stop.titleEn}
                  </span>
                  <span className="block text-[11px] font-semibold text-[#8A7465] leading-tight">
                    {stop.subtitlePl}
                  </span>
                  <div className="mt-0.5 flex items-center justify-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= earned
                            ? 'fill-[#F5A623] text-[#D9820B]'
                            : 'text-[#D6C7B7]'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {/* Stop 10: Magical Treasure Chest */}
        <div
          style={{ left: '41%', top: '84%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <button
            type="button"
            onClick={handleTreasureClick}
            aria-label={
              treasureUnlocked
                ? 'Otwórz Skrzynię Skarbów'
                : 'Skrzynia Skarbów (zamknięta — zdobądź 6 gwiazdek na mapie)'
            }
            className="group flex flex-col items-center focus-visible:outline-2 focus-visible:outline-amber-500 rounded-3xl"
          >
            <div
              className={`relative w-[86px] h-[86px] rounded-full border-4 border-white shadow-[0_6px_18px_rgba(146,64,14,0.2)] overflow-hidden bg-[#FFF9F0] flex items-center justify-center group-hover:scale-105 transition-transform ${
                treasureUnlocked ? 'ring-4 ring-amber-300/70' : 'opacity-80'
              }`}
            >
              <img
                src={TREASURE_IMG_URL}
                alt="Bajkowa Skrzynia Skarbów"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-110"
              />
              {!treasureUnlocked && (
                <div className="absolute inset-0 bg-[#FFF9F0]/45 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#784A14]" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="mt-1.5 px-3 py-1 rounded-2xl bg-white/95 border border-[#EFE2D2] shadow-sm text-center">
              <span className="block font-display text-sm font-bold text-[#3E2F2B] leading-tight">
                Treasure
              </span>
              <span className="block text-[11px] font-semibold text-[#8A7465] leading-tight">
                {progress.treasureClaimed
                  ? 'otwarta!'
                  : treasureUnlocked
                    ? 'otwórz skarb!'
                    : 'zamknięta'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Compact 2-Column Stepping-Stone Trail (< 640px) */}
      <div className="sm:hidden rounded-[28px] bg-[#FFF8EB] border-2 border-[#F0DFC8] p-4 space-y-3">
        <p className="font-display text-lg font-bold text-[#3E2F2B] text-center">
          Ścieżka przez cztery pory roku
        </p>
        <div className="grid grid-cols-2 gap-3">
          {stops.map((stop) => {
            const earned = progress.stopStars[stop.id] || 0;
            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => onOpenScreen(stop.targetScreen)}
                className="relative rounded-2xl bg-white border-2 border-[#F0DFC8] p-3.5 flex flex-col items-center text-center active:scale-[0.98] transition-transform"
              >
                <span
                  style={{ backgroundColor: stop.badgeColor }}
                  className="absolute left-2.5 top-2.5 w-6 h-6 rounded-full text-white font-display text-xs font-bold flex items-center justify-center"
                >
                  {stop.num}
                </span>
                <div
                  style={{ backgroundColor: stop.ringBg }}
                  className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center"
                >
                  {stop.renderIcon()}
                </div>
                <span className="mt-2 font-display text-sm font-bold text-[#3E2F2B]">
                  {stop.titleEn}
                </span>
                <span className="text-xs text-[#8A7465]">{stop.subtitlePl}</span>
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= earned ? 'fill-[#F5A623] text-[#D9820B]' : 'text-[#D6C7B7]'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </button>
            );
          })}

          {/* Mobile Treasure Card */}
          <button
            type="button"
            onClick={handleTreasureClick}
            className="rounded-2xl bg-[#FEF7DC] border-2 border-[#F3DFA2] p-3.5 flex flex-col items-center text-center"
          >
            <img
              src={TREASURE_IMG_URL}
              alt="Skrzynia Skarbów"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover"
            />
            <span className="mt-2 font-display text-sm font-bold text-[#3E2F2B]">Treasure</span>
            <span className="text-xs text-[#8A7465]">
              {progress.treasureClaimed ? 'otwarta!' : treasureUnlocked ? 'otwórz!' : 'zamknięta'}
            </span>
          </button>
        </div>
      </div>

      {/* Treasure Chest Modal */}
      {chestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E2F2B]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="treasure-modal-title"
        >
          <div className="w-full max-w-md rounded-[30px] bg-[#FFFDF8] border-2 border-[#F0DFC8] p-7 text-center shadow-2xl">
            <img
              src={TREASURE_IMG_URL}
              alt="Skrzynia Skarbów"
              referrerPolicy="no-referrer"
              className="w-36 h-36 mx-auto rounded-3xl object-cover border-2 border-[#F3DFA2]"
            />
            <h2 id="treasure-modal-title" className="mt-4 font-display text-2xl font-bold text-[#3E2F2B]">
              {treasureUnlocked ? 'Hurra! Skrzynia Skarbów otwarta!' : 'Skrzynia czeka na Ciebie!'}
            </h2>
            <p className="mt-2 text-sm text-[#786356] leading-relaxed">
              {treasureUnlocked
                ? 'Zdobywasz +6 dodatkowych gwiazdek do wydania w Garderobie Iskierki oraz wyjątkową naklejkę „Skarb Czterech Pór Roku”!'
                : 'Zdobądź łącznie 6 gwiazdek na przystankach mapy (albo 12 gwiazdek w grach), aby otworzyć magiczną skrzynię ze skarbami i naklejką!'}
            </p>
            <button
              type="button"
              onClick={() => setChestModalOpen(false)}
              className="mt-6 w-full btn-puffy-amber min-h-[48px] rounded-full font-display text-base font-bold"
            >
              {treasureUnlocked ? 'Super, dziękuję!' : 'Idę zdobyć gwiazdki!'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
