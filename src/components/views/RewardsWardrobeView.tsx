import React, { useMemo, useState } from 'react';
import { Check, Eye, Lock, RotateCcw, Sparkles, Star, Volume2 } from 'lucide-react';
import { LessonModule, ModuleProgress } from '../../types/curriculum';
import { STICKERS_CATALOG, WARDROBE_ACCESSORIES, WardrobeAccessory } from '../../data/rewardsCatalog';
import { STORYBOOK_ART, WARDROBE_ART_MAP } from '../../data/storybookArt';
import { formatStarsPl, getAvailableStars } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
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
}

type SlotFilter = 'all' | WardrobeAccessory['slot'];

const SLOT_FILTERS: { id: SlotFilter; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'head', label: 'Na głowę' },
  { id: 'eyes', label: 'Na oczy' },
  { id: 'neck', label: 'Na szyję' },
  { id: 'back', label: 'Na plecy' },
];

export const RewardsWardrobeView: React.FC<RewardsWardrobeViewProps> = ({
  mode,
  module,
  progress,
  soundEffectsEnabled,
  onBackToMap,
  onBuyAccessory,
  onToggleEquipAccessory,
}) => {
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  // Live try-on map by slot so a child can try any locked accessory on Iskierka before buying
  const [tryOnBySlot, setTryOnBySlot] = useState<Partial<Record<WardrobeAccessory['slot'], string>>>({});
  const [stageBgError, setStageBgError] = useState(false);

  const availableStars = getAvailableStars(progress);

  // Merge equipped items with any live try-on overrides (respecting 1 item per slot)
  const previewAccessories = useMemo(() => {
    const bySlot = new Map<WardrobeAccessory['slot'], string>();
    for (const id of progress.equippedAccessories) {
      const found = WARDROBE_ACCESSORIES.find((a) => a.id === id);
      if (found) bySlot.set(found.slot, id);
    }
    for (const [slot, id] of Object.entries(tryOnBySlot) as [WardrobeAccessory['slot'], string][]) {
      if (id) bySlot.set(slot, id);
    }
    return Array.from(bySlot.values());
  }, [progress.equippedAccessories, tryOnBySlot]);

  const tryOnIds = Object.values(tryOnBySlot).filter(Boolean) as string[];
  const isTryingOn = tryOnIds.length > 0;

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
    setTryOnBySlot((prev) => {
      if (prev[acc.slot] === acc.id) {
        const next = { ...prev };
        delete next[acc.slot];
        return next;
      }
      return { ...prev, [acc.slot]: acc.id };
    });
  };

  if (mode === 'stickers') {
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
        <div className="storybook-card rounded-[30px] p-6 sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 rounded-[24px] bg-[#FFF8EC] border-2 border-[#EFE0CC] p-4">
            <div className="w-20 h-20 rounded-[20px] watercolor-frame border-2 border-white shadow-sm overflow-hidden shrink-0">
              <img
                src={STORYBOOK_ART.gameStickers}
                alt="Bajkowy album naklejek"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-[1.08]"
              />
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#6E5B4F] text-center sm:text-left leading-relaxed">
              Ukończ przystanki na mapie i gry, aby zbierać bajkowe naklejki! Stuknij zdobytą naklejkę, aby usłyszeć pochwałę po angielsku.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {STICKERS_CATALOG.map((stk) => {
              const unlocked = progress.unlockedStickers.includes(stk.id);
              return (
                <button
                  key={stk.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    playToneEffect('success', soundEffectsEnabled);
                    speakText(stk.englishPraise, { lang: 'en-GB' });
                  }}
                  className={`rounded-[24px] border-2 p-4 flex flex-col items-center text-center transition-all ${
                    unlocked
                      ? 'bg-[#FFFDF8] border-[#F3DFA2] hover:border-[#F4A938] hover:-translate-y-0.5 shadow-sm'
                      : 'bg-[#FAF5EE] border-dashed border-[#DFD1C0] opacity-75 cursor-default'
                  }`}
                >
                  <div
                    className={`w-24 h-24 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center ${
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
                      <Lock className="w-7 h-7 text-[#A89687]" aria-hidden="true" />
                    )}
                  </div>
                  <span className="mt-2.5 font-display text-sm font-bold text-[#3E2F2B]">
                    {stk.title}
                  </span>
                  <span className="mt-1 text-[11px] font-semibold text-[#8A7465] leading-snug">
                    {unlocked ? stk.englishPraise : stk.unlockHintPl}
                  </span>
                  {unlocked && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#5496E8]">
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Posłuchaj
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </StorybookLessonShell>
    );
  }

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

            {isTryingOn && (
              <button
                type="button"
                onClick={() => {
                  playToneEffect('tap', soundEffectsEnabled);
                  setTryOnBySlot({});
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
              ? 'Podoba Ci się ten strój? Zdobądź gwiazdki w grach, aby zatrzymać go na stałe!'
              : 'Kliknij „Przymierz” przy dowolnym dodatku, aby sprawdzić, jak pięknie wygląda na Iskierce!'}
          </p>

          {/* Active Worn / Tried-On Watercolor Charms Strip */}
          {previewAccessories.length > 0 && (
            <div className="mt-4 w-full rounded-[20px] bg-[#FFF8EE] border border-[#EFE0CC] p-3">
              <p className="text-[11px] font-bold text-[#8A7465] mb-2">
                {isTryingOn ? 'Aktualnie przymierzone dodatki:' : 'Założone dodatki Iskierki:'}
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
                          className={`w-full h-full object-contain ${art.zoomClass || 'scale-[1.06]'}`}
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

          <button
            type="button"
            onClick={() => {
              playToneEffect('success', soundEffectsEnabled);
              speakText('I love my new clothes!', { lang: 'en-GB' });
            }}
            className="mt-4 btn-puffy-blue min-h-[48px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            „I love my new clothes!”
          </button>
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

          {/* Slot Filter Bar */}
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
              const equipped = progress.equippedAccessories.includes(acc.id);
              const tryingThis = tryOnBySlot[acc.slot] === acc.id;
              const canAfford = availableStars >= acc.priceStars;
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
                    {/* Big Watercolor Accessory Showcase */}
                    <button
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        speakText(acc.englishName, { lang: 'en-GB' });
                      }}
                      aria-label={`Posłuchaj po angielsku: ${acc.englishName}`}
                      className="group relative w-full h-36 rounded-[20px] bg-[#FFF9F0] border border-[#EFE0CC] overflow-hidden flex items-center justify-center mb-3"
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

                      {/* Quiet price / owned indicator in top-right corner */}
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 tabular-nums shadow-xs ${
                          owned
                            ? 'bg-[#EAF8EE] text-[#226B3B] border border-[#A7E3B9]'
                            : 'bg-[#FFFDF8]/95 text-[#9A5B0C] border border-[#F3DFA2]'
                        }`}
                      >
                        {owned ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Masz
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

                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-display text-base font-bold text-[#3E2F2B] leading-snug">
                        {acc.namePl}
                      </h4>
                    </div>
                    <p className="text-xs font-bold text-[#4178BF] mt-0.5">
                      {acc.englishName} · <span className="text-[#9A8577] font-semibold">{acc.slotLabelPl}</span>
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#786356] leading-relaxed">
                      {acc.descriptionPl}
                    </p>
                  </div>

                  {/* Interactive Actions */}
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        setTryOnBySlot((prev) => {
                          const next = { ...prev };
                          delete next[acc.slot];
                          return next;
                        });
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

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          playToneEffect('fanfare', soundEffectsEnabled);
                          setTryOnBySlot((prev) => {
                            const next = { ...prev };
                            delete next[acc.slot];
                            return next;
                          });
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
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </StorybookLessonShell>
  );
};
