import React, { useEffect, useState } from 'react';
import { Award, Download, Lock, Sparkles, Star } from 'lucide-react';
import { ChildScreen, LessonModule, MapStopId, ModuleProgress } from '../../types/curriculum';
import { canOpenTreasureChest } from '../../engine/gameEngine';
import { STORYBOOK_ART, WARDROBE_ART_MAP } from '../../data/storybookArt';
import { renderTreasureDiploma, triggerPngDownload } from '../../utils/postcardExporter';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from './MascotAvatar';

export const MAP_BG_URL = STORYBOOK_ART.mapFourSeasons;
export const TREASURE_IMG_URL = STORYBOOK_ART.treasureChest;

interface MapNode {
  id: MapStopId;
  num: number;
  titleEn: string;
  subtitlePl: string;
  xPct: number;
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

const AMBIENT_PARTICLES = [
  // Spring pink petals (top-left)
  { id: 'sp-1', left: '8%', top: '8%', color: '#F9A8D4', size: 10, delay: '0s', duration: '9.5s', kind: 'petal' },
  { id: 'sp-2', left: '19%', top: '5%', color: '#FBCFE8', size: 8, delay: '3.2s', duration: '11s', kind: 'petal' },
  { id: 'sp-3', left: '28%', top: '12%', color: '#F472B6', size: 9, delay: '6.1s', duration: '10.2s', kind: 'petal' },
  // Summer warm sunlit motes (top-right)
  { id: 'su-1', left: '72%', top: '14%', color: '#FDE047', size: 8, delay: '0.8s', duration: '5.5s', kind: 'mote' },
  { id: 'su-2', left: '84%', top: '10%', color: '#FDBA74', size: 10, delay: '2.4s', duration: '6.2s', kind: 'mote' },
  { id: 'su-3', left: '91%', top: '24%', color: '#FEF08A', size: 7, delay: '1.5s', duration: '4.9s', kind: 'mote' },
  // Autumn golden leaves (bottom-right)
  { id: 'au-1', left: '78%', top: '46%', color: '#F59E0B', size: 11, delay: '1.1s', duration: '10.5s', kind: 'leaf' },
  { id: 'au-2', left: '89%', top: '52%', color: '#EA580C', size: 9, delay: '4.3s', duration: '12s', kind: 'leaf' },
  { id: 'au-3', left: '66%', top: '48%', color: '#D97706', size: 10, delay: '7.2s', duration: '11.4s', kind: 'leaf' },
  // Winter gentle snowflakes (bottom-left)
  { id: 'wi-1', left: '9%', top: '54%', color: '#FFFFFF', size: 9, delay: '0.5s', duration: '11.5s', kind: 'snow' },
  { id: 'wi-2', left: '21%', top: '58%', color: '#E0F2FE', size: 7, delay: '3.8s', duration: '10.8s', kind: 'snow' },
  { id: 'wi-3', left: '34%', top: '52%', color: '#FFFFFF', size: 8, delay: '6.4s', duration: '12.5s', kind: 'snow' },
] as const;

const BURST_CONFETTI = [
  { tx: '-110px', ty: '-82px', color: '#F59E0B', delay: '0ms' },
  { tx: '-74px', ty: '-112px', color: '#EC4899', delay: '60ms' },
  { tx: '-26px', ty: '-124px', color: '#60A5FA', delay: '90ms' },
  { tx: '28px', ty: '-122px', color: '#34D399', delay: '40ms' },
  { tx: '78px', ty: '-106px', color: '#A855F7', delay: '80ms' },
  { tx: '112px', ty: '-74px', color: '#FBBF24', delay: '30ms' },
  { tx: '-96px', ty: '-22px', color: '#F472B6', delay: '110ms' },
  { tx: '98px', ty: '-20px', color: '#38BDF8', delay: '120ms' },
];

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
  const [chestPhase, setChestPhase] = useState<'locked' | 'shaking' | 'revealed'>('locked');
  const [diplomaLoading, setDiplomaLoading] = useState(false);

  const isEnglishClothes = module.id === 'en-unit1-mr-beetle-clothes';
  const treasureUnlocked = canOpenTreasureChest(progress);

  useEffect(() => {
    if (!chestModalOpen || chestPhase !== 'shaking') return;
    const timer = window.setTimeout(() => {
      setChestPhase('revealed');
    }, 1150);
    return () => clearTimeout(timer);
  }, [chestModalOpen, chestPhase]);

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

  const activeStopId =
    stops.find((s) => (progress.stopStars[s.id] || 0) === 0)?.id || stops[stops.length - 1].id;

  const handleTreasureClick = () => {
    setChestModalOpen(true);
    if (!treasureUnlocked) {
      setChestPhase('locked');
      return;
    }
    if (!progress.treasureClaimed) {
      setChestPhase('shaking');
      onClaimTreasure();
    } else {
      setChestPhase('revealed');
    }
  };

  const handleDownloadDiploma = async () => {
    setDiplomaLoading(true);
    try {
      const dataUrl = await renderTreasureDiploma(progress.stars, module.title);
      triggerPngDownload(dataUrl, 'dyplom-mistrzyni-angielskiego.png');
    } finally {
      setDiplomaLoading(false);
    }
  };

  const secretHatArt = WARDROBE_ART_MAP['acc-winter-hat'];

  return (
    <section aria-label="Mapa przygód przez cztery pory roku" className="relative">
      {/* Desktop & iPad Landscape/Portrait Winding Map Canvas */}
      <div className="hidden sm:block relative w-full h-[560px] md:h-[600px] rounded-[32px] overflow-hidden border-2 border-[#F0DFC8] shadow-[0_10px_30px_rgba(133,94,58,0.09)] bg-[#FFF8EB]">
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

        {/* Ambient 4-Seasons Life Layer (GPU-composited, respects prefers-reduced-motion) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {AMBIENT_PARTICLES.map((p) => (
            <span
              key={p.id}
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: p.kind === 'petal' || p.kind === 'leaf' ? `${Math.round(p.size * 0.68)}px` : `${p.size}px`,
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
                borderRadius:
                  p.kind === 'petal'
                    ? '60% 40% 60% 40%'
                    : p.kind === 'leaf'
                      ? '75% 15% 75% 15%'
                      : '9999px',
                boxShadow:
                  p.kind === 'mote'
                    ? '0 0 10px rgba(253,224,71,0.85)'
                    : p.kind === 'snow'
                      ? '0 0 6px rgba(186,230,253,0.9)'
                      : '0 1px 3px rgba(120,74,20,0.18)',
              }}
              className={`absolute ${
                p.kind === 'mote' ? 'animate-ambient-mote' : 'animate-ambient-fall'
              }`}
            />
          ))}
        </div>

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

                <span
                  style={{ backgroundColor: stop.badgeColor }}
                  className="absolute -left-1.5 -top-1.5 z-20 w-7 h-7 rounded-full text-white font-display text-sm font-bold flex items-center justify-center shadow-sm border-2 border-white"
                >
                  {stop.num}
                </span>

                <div
                  style={{ backgroundColor: stop.ringBg }}
                  className="w-[82px] h-[82px] md:w-[88px] md:h-[88px] rounded-full border-4 border-white shadow-[0_6px_16px_rgba(92,65,24,0.16)] overflow-hidden flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform"
                >
                  {stop.renderIcon()}
                </div>

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
                treasureUnlocked ? 'ring-4 ring-amber-300/80' : 'opacity-85'
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

      {/* Animated Treasure Chest Ritual Modal */}
      {chestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E2F2B]/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="treasure-modal-title"
        >
          <div className="relative w-full max-w-md rounded-[32px] bg-[#FFFDF8] border-2 border-[#F0DFC8] p-7 text-center shadow-2xl overflow-hidden">
            {chestPhase === 'revealed' && (
              <div className="absolute inset-x-0 top-28 flex justify-center pointer-events-none" aria-hidden="true">
                {BURST_CONFETTI.map((c, i) => (
                  <span
                    key={i}
                    style={
                      {
                        '--tx': c.tx,
                        '--ty': c.ty,
                        backgroundColor: c.color,
                        animationDelay: c.delay,
                      } as React.CSSProperties
                    }
                    className="absolute w-3.5 h-3.5 rounded-full animate-burst-petal"
                  />
                ))}
              </div>
            )}

            <div className="relative inline-block">
              <img
                src={TREASURE_IMG_URL}
                alt="Skrzynia Skarbów"
                referrerPolicy="no-referrer"
                className={`w-36 h-36 mx-auto rounded-3xl object-cover border-2 border-[#F3DFA2] shadow-md ${
                  chestPhase === 'shaking' ? 'animate-chest-shake' : ''
                }`}
              />
              {chestPhase === 'revealed' && (
                <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#FEF5D9] border-2 border-[#F3DFA2] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-[#D9820B]" aria-hidden="true" />
                </span>
              )}
            </div>

            <h2 id="treasure-modal-title" className="mt-4 font-display text-2xl font-bold text-[#3E2F2B]">
              {chestPhase === 'shaking'
                ? 'Otwieramy magiczną skrzynię...'
                : chestPhase === 'revealed'
                  ? 'Hurra! Skrzynia Skarbów otwarta!'
                  : 'Skrzynia czeka na Ciebie!'}
            </h2>

            {chestPhase === 'revealed' ? (
              <>
                <p className="mt-2 text-sm text-[#786356] leading-relaxed">
                  Zdobywasz <strong>+6 gwiazdek</strong>, naklejkę <em>„Skarb Czterech Pór Roku”</em> oraz sekretny prezent do Garderoby Iskierki:
                </p>

                {secretHatArt && (
                  <div className="mt-4 rounded-[22px] bg-[#FFF8EC] border-2 border-[#F3DFA2] p-3.5 flex items-center gap-3.5 text-left">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#EFE0CC] flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={secretHatArt.src}
                        alt={secretHatArt.altPl}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B86E14]">
                        <Award className="w-3.5 h-3.5" aria-hidden="true" />
                        Sekretny dodatek odblokowany!
                      </span>
                      <p className="font-display text-base font-bold text-[#3E2F2B] leading-tight">
                        Czapka Skarbu z pomponem
                      </p>
                      <p className="text-xs font-semibold text-[#786356]">
                        Czeka już na Ciebie w Garderobie Iskierki!
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={diplomaLoading}
                    onClick={handleDownloadDiploma}
                    className="w-full btn-puffy-blue min-h-[48px] rounded-full font-display text-sm font-bold inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    {diplomaLoading ? 'Tworzę dyplom...' : 'Pobierz Dyplom Mistrzyni (PNG)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChestModalOpen(false)}
                    className="w-full btn-puffy-amber min-h-[48px] rounded-full font-display text-base font-bold"
                  >
                    Super, dziękuję!
                  </button>
                </div>
              </>
            ) : chestPhase === 'shaking' ? (
              <p className="mt-2 text-sm font-semibold text-[#9A5B0C]">
                Czary-mary, chmurki złote — zaraz zobaczymy Twój skarb!
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-[#786356] leading-relaxed">
                  Zdobądź łącznie <strong>6 gwiazdek</strong> na przystankach mapy (albo 12 gwiazdek w grach), aby otworzyć magiczną skrzynię z sekretną czapką do garderoby i dyplomem!
                </p>
                <button
                  type="button"
                  onClick={() => setChestModalOpen(false)}
                  className="mt-6 w-full btn-puffy-amber min-h-[48px] rounded-full font-display text-base font-bold"
                >
                  Idę zdobyć gwiazdki!
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
