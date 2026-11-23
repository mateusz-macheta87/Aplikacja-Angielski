import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Download,
  Eye,
  Lock,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { LessonModule, ModuleProgress, StickerSceneId } from '../../types/curriculum';
import { STICKERS_CATALOG, WARDROBE_ACCESSORIES, WardrobeAccessory } from '../../data/rewardsCatalog';
import {
  ISKIERKA_OUTFIT_SCENE,
  STORYBOOK_ART,
  WARDROBE_ART_MAP,
} from '../../data/storybookArt';
import { buildOutfitCaptionEn, formatStarsPl, getAvailableStars } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { renderWardrobePostcard, triggerPngDownload } from '../../utils/postcardExporter';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface RewardsWardrobeViewProps {
  mode: 'stickers' | 'wardrobe';
  module: LessonModule;
  progress: ModuleProgress;
  soundEffectsEnabled: boolean;
  onBackToMap: () => void;
  onBuyAccessory: (accessoryId: string, price: number) => void;
  onToggleEquipAccessory: (accessoryId: string) => void;
  onUpdateStickerPlacement: (stickerId: string, xPct: number, yPct: number) => void;
  onRemoveStickerPlacement: (stickerId: string) => void;
  onClearStickers: () => void;
  onChangeStickerScene: (sceneId: StickerSceneId) => void;
}

type SlotFilter = 'all' | WardrobeAccessory['slot'];

const SLOT_FILTERS: { id: SlotFilter; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'head', label: 'Na głowę' },
  { id: 'eyes', label: 'Na oczy' },
  { id: 'neck', label: 'Na szyję' },
  { id: 'back', label: 'Na plecy' },
];

const STICKER_SCENES: { id: StickerSceneId; label: string; src: string }[] = [
  { id: 'seasons', label: 'Kraina Pór Roku', src: STORYBOOK_ART.mapFourSeasons },
  { id: 'boutique', label: 'Leśny Butik', src: STORYBOOK_ART.wardrobeStage },
  { id: 'picnic', label: 'Polana Piknikowa', src: STORYBOOK_ART.comicPanel4Party },
];

export const RewardsWardrobeView: React.FC<RewardsWardrobeViewProps> = ({
  mode,
  module,
  progress,
  soundEffectsEnabled,
  onBackToMap,
  onBuyAccessory,
  onToggleEquipAccessory,
  onUpdateStickerPlacement,
  onRemoveStickerPlacement,
  onClearStickers,
  onChangeStickerScene,
}) => {
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  // Strictly max 1 tried-on or equipped accessory at a time so Iskierka shows her dedicated bespoke portrait
  const [tryOnId, setTryOnId] = useState<string | null>(null);
  const [stageBgError, setStageBgError] = useState(false);

  // Wardrobe photo postcard state
  const [postcardModal, setPostcardModal] = useState<{ dataUrl: string; captionEn: string } | null>(null);
  const [postcardLoading, setPostcardLoading] = useState(false);

  // Interactive Sticker Panorama drag state
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ xPct: number; yPct: number } | null>(null);
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const dragMovedRef = useRef(false);

  const availableStars = getAvailableStars(progress);

  const activeEquippedId = progress.equippedAccessories[0] || null;
  const activePreviewId = tryOnId || activeEquippedId;
  const previewAccessories = useMemo(
    () => (activePreviewId ? [activePreviewId] : []),
    [activePreviewId]
  );

  const isTryingOn = Boolean(tryOnId);

  const visibleAccessories = useMemo(
    () =>
      slotFilter === 'all'
        ? WARDROBE_ACCESSORIES
        : WARDROBE_ACCESSORIES.filter((a) => a.slot === slotFilter),
    [slotFilter]
  );

  const handleToggleTryOn = (acc: WardrobeAccessory) => {
    playToneEffect('tap', soundEffectsEnabled);
    speakText(acc.englishName, { lang: 'en-GB' });
    setTryOnId((prev) => (prev === acc.id ? null : acc.id));
  };

  const handleTakePostcard = async () => {
    setPostcardLoading(true);
    playToneEffect('success', soundEffectsEnabled);
    try {
      const captionEn = buildOutfitCaptionEn(previewAccessories, WARDROBE_ACCESSORIES);
      const dataUrl = await renderWardrobePostcard(previewAccessories, captionEn);
      setPostcardModal({ dataUrl, captionEn });
      speakText(captionEn, { lang: 'en-GB' });
    } finally {
      setPostcardLoading(false);
    }
  };

  // --- STICKER BOOK PANORAMA MODE ---
  if (mode === 'stickers') {
    const activeScene =
      STICKER_SCENES.find((s) => s.id === (progress.stickerSceneId || 'seasons')) || STICKER_SCENES[0];
    const placementsRecord = progress.stickerPlacements || {};
    const placements = Object.entries(placementsRecord).map(([stickerId, pos]) => ({
      stickerId,
      xPct: pos.xPct,
      yPct: pos.yPct,
    }));

    const clampPct = (val: number) => Math.max(8, Math.min(92, Math.round(val)));

    const handleStickerPointerDown = (stickerId: string, e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDraggingId(stickerId);
      dragMovedRef.current = false;
    };

    const handleStickerPointerMove = (e: React.PointerEvent) => {
      if (!draggingId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const xPct = clampPct(((e.clientX - rect.left) / rect.width) * 100);
      const yPct = clampPct(((e.clientY - rect.top) / rect.height) * 100);
      dragMovedRef.current = true;
      setDragPos({ xPct, yPct });
    };

    const handleStickerPointerUp = (stickerId: string) => {
      if (draggingId === stickerId) {
        if (dragMovedRef.current && dragPos) {
          onUpdateStickerPlacement(stickerId, dragPos.xPct, dragPos.yPct);
          playToneEffect('paint', soundEffectsEnabled);
        } else {
          // Tap on placed sticker -> bounce & speak praise!
          const stk = STICKERS_CATALOG.find((s) => s.id === stickerId);
          if (stk) {
            playToneEffect('success', soundEffectsEnabled);
            speakText(stk.englishPraise, { lang: 'en-GB' });
            setBouncingId(stickerId);
            window.setTimeout(() => setBouncingId((cur) => (cur === stickerId ? null : cur)), 550);
          }
        }
      }
      setDraggingId(null);
      setDragPos(null);
    };

    const handleAutoArrange = () => {
      playToneEffect('success', soundEffectsEnabled);
      progress.unlockedStickers.forEach((stkId, index) => {
        const col = index % 5;
        const row = Math.floor(index / 5);
        const xPct = 15 + col * 17.5 + (row % 2 === 1 ? 5 : 0);
        const yPct = 24 + row * 28;
        onUpdateStickerPlacement(stkId, clampPct(xPct), clampPct(yPct));
      });
    };

    return (
      <StorybookLessonShell
        title="Album naklejek"
        module={module}
        onBackToMap={onBackToMap}
        showCheatSheetButton={false}
        rightSlot={
          <span className="px-4 py-1.5 rounded-full bg-[#EAF8EE] border border-[#A7E3B9] font-display text-sm font-bold text-[#226B3B] tabular-nums">
            {progress.unlockedStickers.length} z {STICKERS_CATALOG.length} naklejek
          </span>
        }
      >
        <div className="space-y-6">
          {/* Interactive Panorama Canvas */}
          <section className="storybook-card rounded-[32px] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#3E2F2B]">
                  Twoja Bajkowa Plansza Naklejek
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#786356]">
                  Przeciągaj naklejki palcem w dowolne miejsce planszy, a potem stuknij je, aby usłyszeć pochwałę!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {STICKER_SCENES.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      playToneEffect('tap', soundEffectsEnabled);
                      onChangeStickerScene(sc.id);
                    }}
                    className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                      activeScene.id === sc.id
                        ? 'btn-puffy-amber'
                        : 'bg-[#FFF8EE] border border-[#EAD7BE] text-[#6E5B4F]'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Drop & Drag Panorama */}
            <div
              ref={canvasRef}
              className="relative w-full h-[320px] sm:h-[380px] rounded-[26px] border-2 border-[#EED9BD] overflow-hidden bg-[#FFF9EC] shadow-inner select-none touch-none"
            >
              <img
                src={activeScene.src}
                alt={`Bajkowe tło albumu naklejek: ${activeScene.label}`}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(255,252,245,0.12) 0%, rgba(62,47,43,0.08) 100%)',
                }}
              />

              {placements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                  <div className="rounded-[24px] bg-[#FFFDF8]/92 border-2 border-[#EFE0CC] px-6 py-4 text-center shadow-sm max-w-sm">
                    <p className="font-display text-base font-bold text-[#3E2F2B]">
                      {progress.unlockedStickers.length > 0
                        ? 'Stuknij zdobytą naklejkę poniżej, aby przykleić ją na planszę!'
                        : 'Ukończ pierwszy przystanek na mapie, aby zdobyć naklejki do przyklejania!'}
                    </p>
                  </div>
                </div>
              )}

              {placements.map((pl) => {
                const stk = STICKERS_CATALOG.find((s) => s.id === pl.stickerId);
                if (!stk) return null;
                const isDragging = draggingId === pl.stickerId;
                const xPct = isDragging && dragPos ? dragPos.xPct : pl.xPct;
                const yPct = isDragging && dragPos ? dragPos.yPct : pl.yPct;

                return (
                  <div
                    key={pl.stickerId}
                    role="button"
                    tabIndex={0}
                    aria-label={`Naklejka na planszy: ${stk.title}. Przeciągnij aby przesunąć lub stuknij, aby posłuchać.`}
                    onPointerDown={(e) => handleStickerPointerDown(pl.stickerId, e)}
                    onPointerMove={handleStickerPointerMove}
                    onPointerUp={() => handleStickerPointerUp(pl.stickerId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playToneEffect('success', soundEffectsEnabled);
                        speakText(stk.englishPraise, { lang: 'en-GB' });
                      }
                    }}
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform ${
                      isDragging
                        ? 'z-30 scale-110'
                        : bouncingId === pl.stickerId
                          ? 'z-20 scale-115'
                          : 'z-10 hover:scale-105'
                    }`}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-[0_8px_18px_rgba(62,47,43,0.22)] overflow-hidden bg-[#FFFDF8]">
                      <ItemIllustration
                        kind={stk.illustration}
                        colorHex={stk.colorHex}
                        className="w-full h-full"
                        roundedClass="rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panorama Helper Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#8A7465]">
                Przyklejone na planszy: {placements.length}
              </span>
              <div className="flex flex-wrap gap-2">
                {progress.unlockedStickers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoArrange}
                    className="btn-puffy-white min-h-[40px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-[#D9820B]" aria-hidden="true" />
                    Ułóż bajkowo
                  </button>
                )}
                {placements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      playToneEffect('tap', soundEffectsEnabled);
                      onClearStickers();
                    }}
                    className="btn-puffy-white min-h-[40px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 text-[#9A5B0C]"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Wyczyść planszę
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Sticker Collection Tray */}
          <section className="storybook-card rounded-[30px] p-5 sm:p-6">
            <h3 className="font-display text-lg font-bold text-[#3E2F2B] mb-4">
              Twoja Kolekcja Naklejek (stuknij, aby przykleić lub zdjąć z planszy)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {STICKERS_CATALOG.map((stk, index) => {
                const unlocked = progress.unlockedStickers.includes(stk.id);
                const placed = placements.some((p) => p.stickerId === stk.id);

                return (
                  <button
                    key={stk.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      if (placed) {
                        playToneEffect('tap', soundEffectsEnabled);
                        onRemoveStickerPlacement(stk.id);
                      } else {
                        playToneEffect('success', soundEffectsEnabled);
                        speakText(stk.englishPraise, { lang: 'en-GB' });
                        const xPct = clampPct(18 + ((index * 19) % 66));
                        const yPct = clampPct(25 + ((index * 23) % 52));
                        onUpdateStickerPlacement(stk.id, xPct, yPct);
                      }
                    }}
                    className={`rounded-[24px] border-2 p-3.5 flex flex-col items-center text-center transition-all ${
                      !unlocked
                        ? 'bg-[#FAF5EE] border-dashed border-[#DFD1C0] opacity-75 cursor-default'
                        : placed
                          ? 'bg-[#EEF9F1] border-[#55B373] shadow-sm'
                          : 'bg-[#FFFDF8] border-[#F3DFA2] hover:border-[#F4A938] hover:-translate-y-0.5 shadow-sm'
                    }`}
                  >
                    <div
                      className={`w-20 h-20 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ${
                        unlocked ? 'watercolor-frame' : 'bg-[#EFE6DA]'
                      }`}
                    >
                      {unlocked ? (
                        <ItemIllustration
                          kind={stk.illustration}
                          colorHex={stk.colorHex}
                          className="w-full h-full"
                          roundedClass="rounded-full"
                        />
                      ) : (
                        <Lock className="w-6 h-6 text-[#A89687]" aria-hidden="true" />
                      )}
                    </div>
                    <span className="mt-2 font-display text-sm font-bold text-[#3E2F2B] leading-tight">
                      {stk.title}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold text-[#8A7465] leading-snug">
                      {unlocked ? (placed ? 'Na planszy (zdejmij)' : 'Przyklej na planszę!') : stk.unlockHintPl}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </StorybookLessonShell>
    );
  }

  // --- WARDROBE MODE ---
  return (
    <StorybookLessonShell
      title="Garderoba Iskierki"
      module={module}
      onBackToMap={onBackToMap}
      showCheatSheetButton={false}
      rightSlot={
        <span className="px-4 py-1.5 rounded-full bg-[#FEF5D9] border-2 border-[#F3DFA2] font-display text-sm font-bold text-[#784A14] inline-flex items-center gap-1.5 tabular-nums whitespace-nowrap shrink-0">
          <Star className="w-4 h-4 fill-[#F5A623] text-[#D9820B]" aria-hidden="true" />
          {formatStarsPl(availableStars)} do wydania
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Enchanted Woodland Dressing-Room Stage */}
        <section className="lg:col-span-5 lg:sticky lg:top-6 storybook-card rounded-[32px] p-5 sm:p-6 flex flex-col items-center text-center">
          <div className="relative w-full aspect-[4/3] rounded-[26px] border-2 border-[#EED9BD] bg-[#FFF9EC] overflow-hidden flex items-center justify-center shadow-inner">
            {previewAccessories[0] && ISKIERKA_OUTFIT_SCENE[previewAccessories[0]] ? (
              <img
                src={ISKIERKA_OUTFIT_SCENE[previewAccessories[0]]}
                alt="Iskierka w wybranym dodatku w Bajkowym Butiku"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-transform duration-300 ${
                  isTryingOn ? 'scale-[1.03]' : ''
                }`}
              />
            ) : (
              <>
                {!stageBgError && (
                  <img
                    src={STORYBOOK_ART.wardrobeStage}
                    alt="Bajkowa leśna garderoba Iskierki z lampkami i wstążkami"
                    referrerPolicy="no-referrer"
                    onError={() => setStageBgError(true)}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  />
                )}

                <div className="relative z-10 translate-y-2">
                  <MascotAvatar
                    variant="stage"
                    equippedAccessories={previewAccessories}
                    mood={isTryingOn ? 'cheer' : 'happy'}
                  />
                </div>
              </>
            )}

            {isTryingOn && (
              <button
                type="button"
                onClick={() => {
                  playToneEffect('tap', soundEffectsEnabled);
                  setTryOnId(null);
                }}
                className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-full bg-[#FFFDF8]/95 border border-[#E5D3BC] shadow-sm text-xs font-bold text-[#6E5B4F] hover:text-[#3E2F2B] inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Zdejmij
              </button>
            )}
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold text-[#3E2F2B]">
            {isTryingOn ? 'Przymiarka w Butiku!' : 'Twoja Iskierka'}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#786356] leading-relaxed">
            {isTryingOn
              ? 'Podoba Ci się ta stylizacja? Zdobądź gwiazdki w grach, aby Iskierka mogła w niej chodzić cały czas!'
              : 'Iskierka nosi jeden wybrany dodatek naraz — kliknij „Przymierz”, aby zobaczyć ją w nowym stroju!'}
          </p>

          {previewAccessories.length > 0 && (
            <div className="mt-4 w-full rounded-[20px] bg-[#FFF8EE] border border-[#EFE0CC] p-3">
              <p className="text-[11px] font-bold text-[#8A7465] mb-2">
                {isTryingOn ? 'Aktualnie przymierzony dodatek:' : 'Aktywny dodatek Iskierki:'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {previewAccessories.map((id) => {
                  const item = WARDROBE_ACCESSORIES.find((a) => a.id === id);
                  const art = WARDROBE_ART_MAP[id];
                  if (!item || !art) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        speakText(item.englishName, { lang: 'en-GB' });
                      }}
                      title={`Posłuchaj: ${item.englishName}`}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-[#FFFDF8] border border-[#E6D4BC] shadow-xs hover:border-[#5496E8] transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full overflow-hidden bg-[#FFF8EE] shrink-0 flex items-center justify-center">
                        <img
                          src={art.src}
                          alt={art.altPl}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-contain mix-blend-multiply ${art.zoomClass || 'scale-[1.06]'}`}
                        />
                      </span>
                      <span className="text-xs font-bold text-[#3E2F2B] whitespace-nowrap">
                        {item.englishName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage Action Row: Speak Phrase + Photo Postcard */}
          <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                playToneEffect('success', soundEffectsEnabled);
                speakText('I love my new clothes!', { lang: 'en-GB' });
              }}
              className="btn-puffy-blue min-h-[46px] px-5 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              „I love my new clothes!”
            </button>

            <button
              type="button"
              disabled={postcardLoading}
              onClick={handleTakePostcard}
              className="btn-puffy-amber min-h-[46px] px-5 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              {postcardLoading ? 'Robię zdjęcie...' : 'Zrób zdjęcie Iskierce'}
            </button>
          </div>
        </section>

        {/* Right: Illustrated Fairy-Tale Boutique Shelf */}
        <section className="lg:col-span-7 storybook-card rounded-[32px] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-display text-xl font-bold text-[#3E2F2B] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F4A938]" aria-hidden="true" />
              Bajkowy Butik Iskierki
            </h3>
            <span className="text-xs font-bold text-[#8A7465] tabular-nums">
              Posiadane: {progress.ownedAccessories.length} / {WARDROBE_ACCESSORIES.length}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Kategorie dodatków w garderobie"
            className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4"
          >
            {SLOT_FILTERS.map((f) => {
              const active = slotFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSlotFilter(f.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    active
                      ? 'btn-puffy-amber'
                      : 'bg-[#FFF8EE] border border-[#EAD7BE] text-[#6E5B4F] hover:border-[#D6B892]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleAccessories.map((acc) => {
              const owned = progress.ownedAccessories.includes(acc.id);
              const equipped = activeEquippedId === acc.id;
              const tryingThis = tryOnId === acc.id;
              const canAfford = !acc.secretTreasureOnly && availableStars >= acc.priceStars;
              const art = WARDROBE_ART_MAP[acc.id];

              return (
                <article
                  key={acc.id}
                  className={`rounded-[26px] border-2 p-4 flex flex-col justify-between gap-3 transition-all ${
                    equipped
                      ? 'bg-[#EEF9F1] border-[#55B373] shadow-sm'
                      : tryingThis
                        ? 'bg-[#F0F7FF] border-[#5496E8] ring-4 ring-[#BFDBFE]/55 shadow-sm'
                        : 'bg-[#FFFDF8] border-[#EFE0CC] hover:border-[#DFC3A0]'
                  }`}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        speakText(acc.englishName, { lang: 'en-GB' });
                      }}
                      aria-label={`Posłuchaj po angielsku: ${acc.englishName}`}
                      className="group relative w-full h-36 rounded-[20px] bg-[#FBF4E5] border border-[#EFE0CC] overflow-hidden flex items-center justify-center mb-3"
                    >
                      {art ? (
                        <img
                          src={art.src}
                          alt={art.altPl}
                          referrerPolicy="no-referrer"
                          className={`w-32 h-32 object-contain mix-blend-multiply pointer-events-none group-hover:scale-105 transition-transform ${
                            art.zoomClass || 'scale-[1.04]'
                          }`}
                        />
                      ) : null}

                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 tabular-nums shadow-xs ${
                          owned
                            ? 'bg-[#EAF8EE] text-[#226B3B] border border-[#A7E3B9]'
                            : acc.secretTreasureOnly
                              ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/50'
                              : 'bg-[#FFFDF8]/95 text-[#9A5B0C] border border-[#F3DFA2]'
                        }`}
                      >
                        {owned ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Masz
                          </>
                        ) : acc.secretTreasureOnly ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            Skarb
                          </>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#D9820B]" aria-hidden="true" />
                            {acc.priceStars}
                          </>
                        )}
                      </span>

                      <span className="absolute bottom-2 right-2.5 w-7 h-7 rounded-full bg-[#FFFDF8]/90 border border-[#EAE0D2] flex items-center justify-center text-[#5496E8] opacity-85 group-hover:opacity-100">
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </button>

                    <h4 className="font-display text-base font-bold text-[#3E2F2B] leading-snug">
                      {acc.namePl}
                    </h4>
                    <p className="text-xs font-bold text-[#4178BF] mt-0.5">
                      {acc.englishName} · <span className="text-[#9A8577] font-semibold">{acc.slotLabelPl}</span>
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#786356] leading-relaxed">
                      {acc.descriptionPl}
                    </p>
                  </div>

                  {owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        setTryOnId(null);
                        onToggleEquipAccessory(acc.id);
                      }}
                      className={`min-h-[44px] w-full rounded-full font-display text-sm font-bold inline-flex items-center justify-center gap-1.5 ${
                        equipped ? 'btn-puffy-white' : 'btn-puffy-green'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-4 h-4 text-[#226B3B]" aria-hidden="true" />
                          Założone (zdejmij)
                        </>
                      ) : (
                        'Załóż Iskierce'
                      )}
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleTryOn(acc)}
                        aria-pressed={tryingThis}
                        className={`min-h-[42px] px-2 rounded-full font-display text-xs font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                          tryingThis ? 'btn-puffy-blue' : 'btn-puffy-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        {tryingThis ? 'Zdejmij' : 'Przymierz'}
                      </button>

                      {acc.secretTreasureOnly ? (
                        <span className="min-h-[42px] px-2 rounded-full bg-[#FEF7DC] border border-[#F3DFA2] text-[#92400E] font-display text-[11px] font-bold flex items-center justify-center text-center leading-tight">
                          Ze Skrzyni Skarbów
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            playToneEffect('fanfare', soundEffectsEnabled);
                            setTryOnId(null);
                            onBuyAccessory(acc.id, acc.priceStars);
                          }}
                          className={`min-h-[42px] px-2 rounded-full font-display text-xs font-bold whitespace-nowrap tabular-nums ${
                            canAfford
                              ? 'btn-puffy-amber'
                              : 'bg-[#F0E6D8] text-[#9A897A] cursor-not-allowed'
                          }`}
                        >
                          {canAfford
                            ? `Kup · ${acc.priceStars} ⭐`
                            : `Brak ${acc.priceStars - availableStars} ⭐`}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Wardrobe Photo Postcard Preview Modal */}
      {postcardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E2F2B]/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="postcard-modal-title"
        >
          <div className="relative w-full max-w-xl rounded-[32px] bg-[#FFFDF8] border-2 border-[#F0DFC8] p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setPostcardModal(null)}
              aria-label="Zamknij podgląd pocztówki"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF3E8] border border-[#E7D8C5] flex items-center justify-center text-[#6E5B4F] hover:text-[#3E2F2B]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <h3 id="postcard-modal-title" className="font-display text-2xl font-bold text-[#3E2F2B]">
              Pocztówka Iskierki gotowa!
            </h3>
            <p className="mt-1 text-sm font-bold text-[#4178BF]">
              „{postcardModal.captionEn}”
            </p>

            <div className="mt-4 rounded-[22px] overflow-hidden border-2 border-[#EED9BD] shadow-md bg-[#FFF8EC]">
              <img
                src={postcardModal.dataUrl}
                alt={`Pocztówka z Iskierką: ${postcardModal.captionEn}`}
                className="w-full h-auto block"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => triggerPngDownload(postcardModal.dataUrl, 'pocztowka-iskierki.png')}
                className="btn-puffy-green min-h-[48px] px-7 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Zapisz pocztówkę (PNG)
              </button>
              <button
                type="button"
                onClick={() => setPostcardModal(null)}
                className="btn-puffy-white min-h-[48px] px-6 rounded-full font-display text-sm font-bold"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </StorybookLessonShell>
  );
};
