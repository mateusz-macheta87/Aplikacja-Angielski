import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, Flower2, Sparkles, Volume2 } from 'lucide-react';
import { LessonModule, ModuleProgress, VocabItem } from '../../types/curriculum';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface WordGardenViewProps {
  module: LessonModule;
  progress: ModuleProgress;
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onWaterWordSuccess: (wordId: string) => void;
}

export const WordGardenView: React.FC<WordGardenViewProps> = ({
  module,
  progress,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onWaterWordSuccess,
}) => {
  const [bonusMode, setBonusMode] = useState(false);
  const [bonusIndex, setBonusIndex] = useState(0);
  const [bloomingWordId, setBloomingWordId] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const waterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (waterTimerRef.current !== null) {
        clearTimeout(waterTimerRef.current);
        waterTimerRef.current = null;
      }
    };
  }, []);

  const thirstyWords = useMemo(
    () =>
      progress.mistakeWordIds
        .map((id) => module.vocabulary.find((v) => v.id === id))
        .filter((v): v is VocabItem => Boolean(v)),
    [progress.mistakeWordIds, module.vocabulary]
  );

  const bloomingWords = useMemo(
    () =>
      progress.masteredWordIds
        .map((id) => module.vocabulary.find((v) => v.id === id))
        .filter((v): v is VocabItem => Boolean(v)),
    [progress.masteredWordIds, module.vocabulary]
  );

  const unmasteredPool = useMemo(() => {
    const masteredSet = new Set(progress.masteredWordIds);
    const remaining = module.vocabulary.filter((v) => !masteredSet.has(v.id));
    return remaining.length > 0 ? remaining : module.vocabulary;
  }, [module.vocabulary, progress.masteredWordIds]);

  const activeTarget: VocabItem | null =
    thirstyWords[0] || (bonusMode && unmasteredPool.length > 0 ? unmasteredPool[bonusIndex % unmasteredPool.length] : null);

  const options = useMemo(() => {
    if (!activeTarget) return [];
    const others = module.vocabulary
      .filter((v) => v.id !== activeTarget.id)
      .sort((a, b) => {
        const scoreA = a.category === activeTarget.category ? 0 : 1;
        const scoreB = b.category === activeTarget.category ? 0 : 1;
        return scoreA - scoreB;
      })
      .slice(0, 3);
    const combined = [activeTarget, ...others];
    // Deterministic shuffle based on target id length + bonusIndex
    const shift = (activeTarget.id.length + bonusIndex) % combined.length;
    return [...combined.slice(shift), ...combined.slice(0, shift)];
  }, [activeTarget, module.vocabulary, bonusIndex]);

  useEffect(() => {
    if (activeTarget && !bloomingWordId) {
      speakText(activeTarget.word, { lang: module.speechLang, rate: speechRate });
    }
  }, [activeTarget, bloomingWordId, module.speechLang, speechRate]);

  const handleWaterOption = (chosen: VocabItem) => {
    if (!activeTarget || bloomingWordId) return;
    if (chosen.id === activeTarget.id) {
      playToneEffect('splash', soundEffectsEnabled);
      setHintText(null);
      setBloomingWordId(activeTarget.id);
      if (waterTimerRef.current !== null) clearTimeout(waterTimerRef.current);
      waterTimerRef.current = window.setTimeout(() => {
        waterTimerRef.current = null;
        onWaterWordSuccess(activeTarget.id);
        setBloomingWordId(null);
        if (bonusMode) {
          setBonusIndex((i) => i + 1);
        }
      }, 850);
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
      setHintText(`To było „${chosen.word}” (${chosen.translation}). Posłuchaj jeszcze raz i podlej właściwy kwiatek!`);
      speakText(activeTarget.word, { lang: module.speechLang, rate: 'slow' });
    }
  };

  return (
    <StorybookLessonShell
      title="Ogródek słówek Iskierki"
      module={module}
      onBackToMap={onBackToMap}
      rightSlot={
        <span className="px-4 py-1.5 rounded-full bg-[#EAF8EE] border border-[#A7E3B9] font-display text-sm font-bold text-[#226B3B] inline-flex items-center gap-1.5 tabular-nums">
          <Flower2 className="w-4 h-4" aria-hidden="true" />
          Kwitnie: {bloomingWords.length} / {module.vocabulary.length}
        </span>
      }
    >
      <div className="space-y-6">
        {/* Top Watering Section */}
        <section className="storybook-card rounded-[32px] p-6 sm:p-7">
          {activeTarget ? (
            <div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-[#EFE0CC]">
                <div className="flex items-center gap-4">
                  <MascotAvatar
                    size="sm"
                    equippedAccessories={progress.equippedAccessories}
                    mood={bloomingWordId ? 'cheer' : hintText ? 'thinking' : 'listening'}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#226B3B] inline-flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-[#5496E8]" aria-hidden="true" />
                      {thirstyWords.length > 0
                        ? `Pączki czekające na podlanie: ${thirstyWords.length}`
                        : 'Podlewanie bonusowego kwiatka (+1 gwiazdka!)'}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#3E2F2B]">
                      Posłuchaj słówka i podlej właściwy kwiatek!
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakText(activeTarget.word, { lang: module.speechLang, rate: speechRate })}
                    className="btn-puffy-blue min-h-[46px] px-5 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    Posłuchaj
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(activeTarget.word, { lang: module.speechLang, rate: 'slow' })}
                    className="btn-puffy-white min-h-[46px] px-4 rounded-full font-display text-xs font-bold"
                  >
                    Wolniej
                  </button>
                </div>
              </div>

              {bloomingWordId ? (
                <div className="py-8 flex flex-col items-center text-center animate-flower-bloom">
                  <div className="w-28 h-28 rounded-full border-4 border-[#55B373] bg-[#EAF8EE] overflow-hidden shadow-md">
                    <ItemIllustration
                      kind={activeTarget.illustration}
                      colorHex={activeTarget.defaultColor}
                      className="w-full h-full"
                      roundedClass="rounded-full"
                    />
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold text-[#226B3B]">
                    Chlup! Kwiatek „{activeTarget.word}” pięknie zakwitł!
                  </p>
                  <p className="text-sm font-semibold text-[#6E5B4F]">
                    {activeTarget.translation} · +1 gwiazdka do garderoby!
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    {options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleWaterOption(opt)}
                        className="min-h-[152px] rounded-[26px] border-[3px] border-[#E7D3B8] bg-[#FFF8EE] hover:border-[#55B373] hover:-translate-y-0.5 active:scale-95 p-3 flex flex-col items-center justify-center gap-2 transition-all"
                      >
                        <div className="w-24 h-24 rounded-[18px] overflow-hidden flex items-center justify-center">
                          <ItemIllustration
                            kind={opt.illustration}
                            colorHex={opt.defaultColor}
                            className="w-full h-full"
                            roundedClass="rounded-[16px]"
                          />
                        </div>
                        <span className="font-display text-sm font-bold text-[#3E2F2B]">
                          {opt.translation}
                        </span>
                      </button>
                    ))}
                  </div>

                  {hintText && (
                    <p className="mt-4 rounded-2xl bg-[#FEF7DC] border border-[#F3DFA2] px-4 py-3 text-sm font-bold text-[#784A14] text-center">
                      {hintText}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-28 h-28 rounded-[26px] watercolor-frame border-2 border-[#EED9BD] overflow-hidden shrink-0">
                <img
                  src={STORYBOOK_ART.gameWordGarden}
                  alt="Konewka wróżki podlewająca uśmiechnięte kwiatki"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-[1.06]"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold text-[#226B3B]">
                  Wszystkie pączki w ogródku podlane!
                </h2>
                <p className="mt-1 text-sm sm:text-base font-semibold text-[#6E5B4F] leading-relaxed">
                  Nie masz żadnych zaległych błędów — świetnie Ci idzie! Możesz podlać kolejne losowe słówko, żeby ogródek zakwitł jeszcze mocniej.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playToneEffect('tap', soundEffectsEnabled);
                    setBonusMode(true);
                  }}
                  className="mt-4 btn-puffy-green min-h-[46px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
                >
                  <Droplets className="w-4 h-4" aria-hidden="true" />
                  Podlej nowy kwiatek (+1 ⭐)
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Blooming Words Meadow */}
        <section className="storybook-card rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-display text-xl font-bold text-[#3E2F2B] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#55B373]" aria-hidden="true" />
              Kwitnąca łąka Twoich słówek
            </h3>
            <span className="text-xs font-bold text-[#8A7465]">
              Stuknij kwiatek, aby posłuchać
            </span>
          </div>

          {bloomingWords.length === 0 ? (
            <div className="rounded-[24px] bg-[#FAF5EC] border-2 border-dashed border-[#DFD1C0] p-6 text-center">
              <p className="text-sm font-semibold text-[#786356]">
                Kiedy poznasz pierwsze słówka na mapie albo podlejesz pączek powyżej, tutaj wyrosną Twoje kwitnące słówka!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {bloomingWords.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playToneEffect('tap', soundEffectsEnabled);
                    speakText(item.word, { lang: module.speechLang, rate: speechRate });
                  }}
                  className="rounded-[24px] bg-[#FFFDF8] border-2 border-[#BFE8CC] hover:border-[#55B373] p-3.5 flex flex-col items-center text-center shadow-xs transition-all hover:-translate-y-0.5"
                >
                  <div className="w-18 h-18 rounded-full border-2 border-white shadow-sm overflow-hidden watercolor-frame">
                    <ItemIllustration
                      kind={item.illustration}
                      colorHex={item.defaultColor}
                      className="w-full h-full"
                      roundedClass="rounded-full"
                    />
                  </div>
                  <span className="mt-2 font-display text-base font-bold text-[#3E2F2B]">
                    {item.word}
                  </span>
                  <span className="text-xs font-semibold text-[#786356]">{item.translation}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </StorybookLessonShell>
  );
};
