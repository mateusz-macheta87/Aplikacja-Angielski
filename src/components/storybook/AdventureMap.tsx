import React, { useEffect, useState } from 'react';
import { Award, Check, Download, Lock, Sparkles, Star } from 'lucide-react';
import { ChildScreen, LessonModule, MapStopId, ModuleProgress } from '../../types/curriculum';
import { canOpenTreasureChest } from '../../engine/gameEngine';
import { ISKIERKA_OUTFIT_PORTRAIT, STORYBOOK_ART, WARDROBE_ART_MAP } from '../../data/storybookArt';
import { renderTreasureDiploma, triggerPngDownload } from '../../utils/postcardExporter';
import { ItemIllustration } from '../illustrations/ItemIllustration';

export const MAP_BG_URL = STORYBOOK_ART.mapFourSeasons;
export const TREASURE_IMG_URL = STORYBOOK_ART.treasureChest;

export interface MapStop {
  id: MapStopId;
  num: number;
  titleEn: string;
  subtitlePl: string;
  /** One short sentence for the "next stop" card on the home screen. */
  descriptionPl: string;
  targetScreen: ChildScreen;
  renderIcon: () => React.ReactNode;
}

const MedallionArt: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    referrerPolicy="no-referrer"
    loading="lazy"
    className="w-[86%] h-[86%] object-contain pointer-events-none"
  />
);

const PaletteIcon: React.FC = () => (
  <svg viewBox="0 0 80 80" className="w-[72%] h-[72%]" role="img" aria-label="Paleta kolorów">
    <circle cx="27" cy="28" r="13" fill="#E8584A" />
    <circle cx="53" cy="28" r="13" fill="#F5A623" />
    <circle cx="27" cy="53" r="13" fill="#5496E8" />
    <circle cx="53" cy="53" r="13" fill="#55B373" />
  </svg>
);

/** The nine stops of the adventure path, in play order. */
export function getMapStops(module: LessonModule): MapStop[] {
  const en = module.id === 'en-unit1-mr-beetle-clothes';
  return [
    {
      id: 'stop-clothes',
      num: 1,
      titleEn: en ? 'Clothes' : 'Słówka',
      subtitlePl: en ? 'Ubrania' : 'Poznaj hasła',
      descriptionPl: en ? 'Posłuchaj i stuknij właściwe ubranie' : 'Poznaj nowe słówka',
      targetScreen: {
        type: 'audio-quiz',
        stopId: 'stop-clothes',
        categoryFilter: en ? 'clothes' : undefined,
        title: en ? 'Ubrania' : 'Słownictwo',
      },
      renderIcon: () => (
        <ItemIllustration kind="coat" colorHex="#E05252" className="w-full h-full" roundedClass="rounded-full" />
      ),
    },
    {
      id: 'stop-colours',
      num: 2,
      titleEn: en ? 'Colours' : 'Fiszki',
      subtitlePl: en ? 'Kolory' : 'Słuchaj',
      descriptionPl: en ? 'Kolory i kredki po angielsku' : 'Posłuchaj fiszek',
      targetScreen: en
        ? { type: 'audio-quiz', stopId: 'stop-colours', categoryFilter: 'colours', title: 'Kolory i kredki' }
        : { type: 'dictionary' },
      renderIcon: () => <PaletteIcon />,
    },
    {
      id: 'stop-wearing',
      num: 3,
      titleEn: en ? "I'm wearing" : 'Zdania',
      subtitlePl: 'Zdania',
      descriptionPl: en ? 'Układamy zdania o ubraniach' : 'Ułóż zdania z kafelków',
      targetScreen: { type: 'sentence-builder', stopId: 'stop-wearing' },
      renderIcon: () => (
        <MedallionArt src={ISKIERKA_OUTFIT_PORTRAIT['acc-scarf']} alt="Iskierka w szaliku" />
      ),
    },
    {
      id: 'stop-dressup',
      num: 4,
      titleEn: en ? 'Dress up' : 'Memory',
      subtitlePl: en ? 'Ubieranka' : 'Gra w pary',
      descriptionPl: en ? 'Pokoloruj strój Pana Chrząszcza' : 'Znajdź pary kart',
      targetScreen:
        module.crayonChallenges.length > 0
          ? { type: 'crayon-studio', stopId: 'stop-dressup' }
          : { type: 'contrast-memory', stopId: 'stop-dressup', initialSubMode: 'memory' },
      renderIcon: () => (
        <ItemIllustration kind="shorts" colorHex="#9333EA" className="w-full h-full" roundedClass="rounded-full" />
      ),
    },
    {
      id: 'stop-seasons',
      num: 5,
      titleEn: en ? 'Seasons' : 'Sortowanie',
      subtitlePl: en ? 'Pory roku' : 'Kontrasty',
      descriptionPl: en ? 'Lato czy zima? Pory roku' : 'Posortuj hasła',
      targetScreen: {
        type: 'contrast-memory',
        stopId: 'stop-seasons',
        initialSubMode: module.sortingGame ? 'sorting' : 'memory',
      },
      renderIcon: () => <ItemIllustration kind="autumn" className="w-full h-full" roundedClass="rounded-full" />,
    },
    {
      id: 'stop-weather',
      num: 6,
      titleEn: en ? 'Weather' : 'Quiz Audio',
      subtitlePl: en ? 'Pogoda' : 'Słuchanie',
      descriptionPl: en ? 'Jaka jest dziś pogoda?' : 'Posłuchaj i wybierz',
      targetScreen: {
        type: 'audio-quiz',
        stopId: 'stop-weather',
        categoryFilter: en ? 'weather' : undefined,
        title: en ? 'Pogoda' : 'Quiz Audio',
      },
      renderIcon: () => <ItemIllustration kind="rainy" className="w-full h-full" roundedClass="rounded-full" />,
    },
    {
      id: 'stop-audio',
      num: 7,
      titleEn: 'Iskierka says',
      subtitlePl: 'Słuchanie',
      descriptionPl: 'Posłuchaj zdań Iskierki',
      targetScreen: { type: 'audio-quiz', stopId: 'stop-audio', title: 'Iskierka says — Słuchanie' },
      renderIcon: () => <MedallionArt src={STORYBOOK_ART.stopHeadphones} alt="Bajkowe słuchawki z nutkami" />,
    },
    {
      id: 'stop-write',
      num: 8,
      titleEn: 'Listen & write',
      subtitlePl: 'Dyktando',
      descriptionPl: 'Posłuchaj i napisz słówko',
      targetScreen: { type: 'listen-write', stopId: 'stop-write' },
      renderIcon: () => <MedallionArt src={STORYBOOK_ART.stopPencil} alt="Bajkowy ołówek i zeszyt" />,
    },
    {
      id: 'stop-test',
      num: 9,
      titleEn: 'Test',
      subtitlePl: 'Sprawdzian',
      descriptionPl: 'Próbny sprawdzian — dasz radę!',
      targetScreen: { type: 'test', stopId: 'stop-test' },
      renderIcon: () => <MedallionArt src={STORYBOOK_ART.stopTrophy} alt="Złoty puchar sprawdzianu" />,
    },
  ];
}

/** First stop without stars, or null when every stop has been played. */
export function getNextStop(stops: MapStop[], progress: ModuleProgress): MapStop | null {
  return stops.find((s) => (progress.stopStars[s.id] || 0) === 0) ?? null;
}

// S-shaped path: stops 1-5 left to right, a bend, stops 6-9 right to left, then the treasure.
const COLS = [12, 31, 50, 69, 88];
const ROW_Y = [24, 70];
function stopPosition(index: number): { xPct: number; yPct: number } {
  if (index < 5) return { xPct: COLS[index], yPct: ROW_Y[0] };
  return { xPct: COLS[9 - index], yPct: ROW_Y[1] }; // index 5..9 (9 = treasure)
}
const VB_W = 1000;
const VB_H = 600;
const toVb = (index: number) => {
  const p = stopPosition(index);
  return { x: (p.xPct / 100) * VB_W, y: (p.yPct / 100) * VB_H };
};
/** SVG path through positions 0..lastIndex (0-9) following the S. */
function buildTrailPath(lastIndex: number): string {
  const start = toVb(0);
  let d = `M${start.x} ${start.y}`;
  for (let i = 1; i <= lastIndex; i++) {
    const p = toVb(i);
    if (i === 5) {
      const prev = toVb(4);
      const bend = prev.x + 105;
      d += ` C${bend} ${prev.y} ${bend} ${p.y} ${p.x} ${p.y}`;
    } else {
      d += ` H${p.x}`;
    }
  }
  return d;
}

const StopStars: React.FC<{ earned: number; className?: string }> = ({ earned, className = 'w-4 h-4' }) => (
  <div className="mt-0.5 flex items-center justify-center gap-0.5">
    {[1, 2, 3].map((s) => (
      <Star
        key={s}
        className={`${className} ${s <= earned ? 'fill-[#F5A623] text-[#D9820B]' : 'text-[#D6C7B7]'}`}
        aria-hidden="true"
      />
    ))}
  </div>
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

  const treasureUnlocked = canOpenTreasureChest(progress);

  useEffect(() => {
    if (!chestModalOpen || chestPhase !== 'shaking') return;
    const timer = window.setTimeout(() => {
      setChestPhase('revealed');
    }, 1150);
    return () => clearTimeout(timer);
  }, [chestModalOpen, chestPhase]);

  const stops = getMapStops(module);
  const nextStop = getNextStop(stops, progress);
  const nextIndex = nextStop ? stops.indexOf(nextStop) : stops.length; // 9 = treasure
  const treasurePos = stopPosition(9);

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
  const treasureStatus = progress.treasureClaimed ? 'otwarta!' : treasureUnlocked ? 'otwórz skarb!' : 'zamknięta';

  return (
    <section aria-labelledby="adventure-map-heading" className="relative">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 px-1">
        <h2 id="adventure-map-heading" className="font-display text-2xl font-bold text-[#3E2F2B]">
          Mapa przygód
        </h2>
        <p className="text-sm font-semibold text-[#755F51]">
          Stuknij dowolny przystanek, żeby zagrać jeszcze raz
        </p>
      </div>

      {/* Tablet & desktop: S-shaped trail over the four-seasons painting */}
      <div className="hidden sm:block relative w-full h-[600px] rounded-[32px] overflow-hidden border-2 border-[#F0DFC8] shadow-[0_10px_30px_rgba(133,94,58,0.09)] bg-[#FFF8EB]">
        {!bgError && (
          <img
            src={MAP_BG_URL}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-85 select-none pointer-events-none"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255,250,240,0.6) 0%, rgba(255,248,236,0.3) 68%, rgba(255,248,236,0.14) 100%)',
          }}
        />

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
                  p.kind === 'petal' ? '60% 40% 60% 40%' : p.kind === 'leaf' ? '75% 15% 75% 15%' : '9999px',
                boxShadow:
                  p.kind === 'mote'
                    ? '0 0 10px rgba(253,224,71,0.85)'
                    : p.kind === 'snow'
                      ? '0 0 6px rgba(186,230,253,0.9)'
                      : '0 1px 3px rgba(120,74,20,0.18)',
              }}
              className={`absolute ${p.kind === 'mote' ? 'animate-ambient-mote' : 'animate-ambient-fall'}`}
            />
          ))}
        </div>

        {/* Trail: soft white road, dotted sand, green for the part already walked */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <path d={buildTrailPath(9)} fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={buildTrailPath(9)} fill="none" stroke="#C9A87E" strokeWidth="8" strokeLinecap="round" strokeDasharray="1 17" vectorEffect="non-scaling-stroke" />
          {nextIndex > 0 && (
            <path d={buildTrailPath(nextIndex)} fill="none" stroke="#55B373" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {stops.map((stop, index) => {
          const earned = progress.stopStars[stop.id] || 0;
          const isCurrent = stop === nextStop;
          const isDone = earned > 0;
          const { xPct, yPct } = stopPosition(index);

          return (
            <div
              key={stop.id}
              // Anchor the centre of the disc (not the whole block) on the trail.
              style={{ left: `${xPct}%`, top: `${yPct}%`, transform: `translate(-50%, -${isCurrent ? 56 : 46}px)` }}
              className={`absolute flex flex-col items-center ${isCurrent ? 'z-20' : 'z-10'}`}
            >
              {isCurrent && (
                <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#2B7A47] text-white font-display text-sm font-bold whitespace-nowrap shadow-sm">
                  Tu jesteś!
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpenScreen(stop.targetScreen)}
                aria-label={`Przystanek ${stop.num}: ${stop.titleEn} — ${stop.subtitlePl}${
                  isDone ? `, ${earned} z 3 gwiazdek` : isCurrent ? ', następny przystanek' : ''
                }`}
                aria-current={isCurrent ? 'step' : undefined}
                className="group relative flex flex-col items-center focus-visible:outline-2 focus-visible:outline-amber-500 rounded-3xl"
              >
                {isCurrent && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[112px] h-[112px] rounded-full bg-[#55B373]/25 motion-safe:animate-ping pointer-events-none"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`absolute -left-2 -top-2 z-20 rounded-full font-display font-bold flex items-center justify-center shadow-sm border-[3px] ${
                    isCurrent
                      ? 'w-10 h-10 text-lg bg-[#55B373] border-white text-white'
                      : isDone
                        ? 'w-8 h-8 bg-[#55B373] border-white text-white'
                        : 'w-8 h-8 text-sm bg-white border-[#E7D5BC] text-[#3E2F2B]'
                  }`}
                  aria-hidden="true"
                >
                  {isDone && !isCurrent ? <Check className="w-4 h-4" strokeWidth={3.5} /> : stop.num}
                </span>

                <div
                  className={`relative rounded-full bg-[#FFF8EE] overflow-hidden flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform shadow-[0_6px_16px_rgba(92,65,24,0.16)] ${
                    isCurrent
                      ? 'w-[112px] h-[112px] border-[6px] border-[#55B373]'
                      : isDone
                        ? 'w-[92px] h-[92px] border-4 border-[#55B373]'
                        : 'w-[92px] h-[92px] border-4 border-white saturate-[.8]'
                  }`}
                >
                  {stop.renderIcon()}
                </div>

                <div
                  className={`mt-2 px-3 py-1.5 rounded-2xl shadow-sm text-center min-w-[112px] ${
                    isCurrent ? 'bg-[#2B7A47] text-white' : 'bg-white/95 border border-[#EFE2D2] text-[#3E2F2B]'
                  }`}
                >
                  <span className="block font-display text-base font-bold leading-tight whitespace-nowrap">
                    {stop.titleEn}
                  </span>
                  <span className={`block text-[13px] font-semibold leading-tight ${isCurrent ? 'text-[#E3F7EA]' : 'text-[#755F51]'}`}>
                    {stop.subtitlePl}
                  </span>
                  {!isCurrent && <StopStars earned={earned} />}
                </div>
              </button>
            </div>
          );
        })}

        {/* End of the trail: the treasure chest */}
        <div
          style={{ left: `${treasurePos.xPct}%`, top: `${treasurePos.yPct}%`, transform: 'translate(-50%, -46px)' }}
          className="absolute z-10"
        >
          <button
            type="button"
            onClick={handleTreasureClick}
            aria-label={
              treasureUnlocked ? 'Otwórz Skrzynię Skarbów' : 'Skrzynia Skarbów (zamknięta — zdobądź 6 gwiazdek na mapie)'
            }
            className="group flex flex-col items-center focus-visible:outline-2 focus-visible:outline-amber-500 rounded-3xl"
          >
            <div
              className={`relative w-[92px] h-[92px] rounded-full border-4 shadow-[0_6px_18px_rgba(146,64,14,0.2)] overflow-hidden bg-[#FFF5DC] flex items-center justify-center group-hover:scale-105 transition-transform ${
                treasureUnlocked ? 'border-[#F5A623] ring-4 ring-amber-300/80' : 'border-[#F3DFA2]'
              }`}
            >
              <img
                src={TREASURE_IMG_URL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-[86%] h-[86%] object-contain"
              />
              {!treasureUnlocked && (
                <span className="absolute -left-0 -top-0 w-8 h-8 rounded-full bg-white border-[3px] border-[#F3DFA2] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#784A14]" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="mt-2 px-3 py-1.5 rounded-2xl bg-white/95 border border-[#EFE2D2] shadow-sm text-center min-w-[112px]">
              <span className="block font-display text-base font-bold text-[#3E2F2B] leading-tight">Treasure</span>
              <span className="block text-[13px] font-semibold text-[#755F51] leading-tight">{treasureStatus}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Phone: the same trail as a numbered list in play order */}
      <ol className="sm:hidden rounded-[28px] bg-[#FFF8EB] border-2 border-[#F0DFC8] p-3 grid grid-cols-2 gap-3">
        {stops.map((stop) => {
          const earned = progress.stopStars[stop.id] || 0;
          const isCurrent = stop === nextStop;
          const isDone = earned > 0;
          return (
            <li key={stop.id} className={isCurrent ? 'col-span-2' : ''}>
              <button
                type="button"
                onClick={() => onOpenScreen(stop.targetScreen)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`relative w-full rounded-2xl border-2 p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform ${
                  isCurrent
                    ? 'bg-[#EAF8EE] border-[#55B373]'
                    : isDone
                      ? 'bg-white border-[#A7E3B9]'
                      : 'bg-white border-[#F0DFC8]'
                }`}
              >
                <span
                  className={`absolute left-2 top-2 z-10 w-6 h-6 rounded-full font-display text-xs font-bold flex items-center justify-center ${
                    isDone || isCurrent ? 'bg-[#55B373] text-white' : 'bg-[#F3E8D8] text-[#3E2F2B]'
                  }`}
                  aria-hidden="true"
                >
                  {isDone && !isCurrent ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : stop.num}
                </span>
                <div className="w-14 h-14 rounded-full bg-[#FFF8EE] border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {stop.renderIcon()}
                </div>
                <div className="min-w-0">
                  <span className="block font-display text-base font-bold text-[#3E2F2B] leading-tight">{stop.titleEn}</span>
                  <span className="block text-[13px] font-semibold text-[#755F51]">
                    {isCurrent ? 'Tu jesteś!' : stop.subtitlePl}
                  </span>
                  {!isCurrent && <StopStars earned={earned} className="w-3.5 h-3.5" />}
                </div>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={handleTreasureClick}
            className="w-full rounded-2xl bg-[#FEF7DC] border-2 border-[#F3DFA2] p-3 flex items-center gap-3 text-left"
          >
            <img src={TREASURE_IMG_URL} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-contain bg-[#FFF5DC]" />
            <div>
              <span className="block font-display text-base font-bold text-[#3E2F2B]">Treasure</span>
              <span className="block text-[13px] font-semibold text-[#755F51]">{treasureStatus}</span>
            </div>
          </button>
        </li>
      </ol>

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
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#B86E14]">
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
