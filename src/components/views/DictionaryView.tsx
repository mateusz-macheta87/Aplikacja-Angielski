import React, { useMemo, useState } from 'react';
import { Check, Eye, EyeOff, Play, Volume2 } from 'lucide-react';
import { LessonModule, VocabItem } from '../../types/curriculum';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface DictionaryViewProps {
  module: LessonModule;
  masteredWordIds: string[];
  soundEffectsEnabled: boolean;
  onToggleMastered: (wordId: string) => void;
  onBackToMap: () => void;
}

function renderWordWithPhonics(word: string, highlight?: string) {
  if (!highlight) return word;
  const idx = word.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return word;
  const before = word.slice(0, idx);
  const match = word.slice(idx, idx + highlight.length);
  const after = word.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span className="text-[#D64988] underline decoration-2 underline-offset-4">{match}</span>
      {after}
    </>
  );
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  module,
  masteredWordIds,
  soundEffectsEnabled,
  onToggleMastered,
  onBackToMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTranslations, setShowTranslations] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of module.vocabulary) {
      if (!map.has(item.category)) {
        map.set(item.category, item.categoryLabel);
      }
    }
    return [{ id: 'all', label: `Wszystkie (${module.vocabulary.length})` }].concat(
      Array.from(map.entries()).map(([id, label]) => ({ id, label }))
    );
  }, [module.vocabulary]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return module.vocabulary;
    return module.vocabulary.filter((item) => item.category === selectedCategory);
  }, [module.vocabulary, selectedCategory]);

  const handleSpeak = (item: VocabItem, text: string, rate: 'normal' | 'slow') => {
    playToneEffect('tap', soundEffectsEnabled);
    speakText(text, {
      lang: module.speechLang,
      rate,
      onStart: () => setSpeakingId(item.id),
      onEnd: () => setSpeakingId((curr) => (curr === item.id ? null : curr)),
    });
  };

  return (
    <StorybookLessonShell
      title="Słowniczek obrazkowy"
      module={module}
      onBackToMap={onBackToMap}
      showCheatSheetButton={false}
      rightSlot={
        <button
          type="button"
          onClick={() => setShowTranslations((prev) => !prev)}
          className="btn-puffy-white min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          {showTranslations ? (
            <EyeOff className="w-4 h-4 text-[#755F51]" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 text-[#2F6DB5]" aria-hidden="true" />
          )}
          {showTranslations ? 'Ukryj tłumaczenia' : 'Pokaż tłumaczenia'}
        </button>
      }
    >
      <div className="space-y-5">
        <p className="text-sm font-semibold text-[#786356]">
          {module.sourceReference} · Stuknij dowolny obrazek lub przycisk głośnika, aby usłyszeć brytyjską wymowę. Zaznacz „Umiem!”, gdy znasz już słówko.
        </p>

        {/* Warm Category Filter Bar */}
        <div
          role="tablist"
          aria-label="Kategorie słownictwa"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'btn-puffy-blue'
                    : 'bg-[#FFFDF9] border-2 border-[#EFE2D2] text-[#6E5B4F] hover:border-[#D9BC9A]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Picture Dictionary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isMastered = masteredWordIds.includes(item.id);
            const isSpeaking = speakingId === item.id;
            return (
              <article
                key={item.id}
                className={`storybook-card rounded-[26px] p-5 flex flex-col justify-between transition-all ${
                  isSpeaking
                    ? 'border-[#5496E8] ring-4 ring-[#BFDBFE]/60'
                    : isMastered
                      ? 'border-[#8AD1A0] bg-[#F7FDF9]'
                      : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleSpeak(item, item.word, 'normal')}
                      aria-label={`Posłuchaj wymowy słowa ${item.word}`}
                      className="w-28 h-28 rounded-[22px] watercolor-frame border-2 border-[#EED9BD] shadow-sm overflow-hidden flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                    >
                      <ItemIllustration
                        kind={item.illustration}
                        colorHex={item.defaultColor}
                        className="w-full h-full"
                        roundedClass="rounded-[20px]"
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#9C8677]">
                        {item.categoryLabel}
                        {item.textbookPage ? ` · ${item.textbookPage}` : ''}
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold text-[#3E2F2B] break-words">
                        {renderWordWithPhonics(item.word, item.phonicsHighlight)}
                      </h2>
                      {showTranslations && (
                        <p className="mt-0.5 text-sm font-bold text-[#786356]">
                          {item.translation}
                        </p>
                      )}
                      {module.speechLang.startsWith('en') && item.category === 'clothes' && (
                        <p className="mt-1.5 text-xs text-[#2F6DB5] font-bold">
                          {item.isPlural ? 'Liczba mnoga (bez „a”)' : 'Liczba pojedyncza (z „a”)'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Example Sentence */}
                  <div className="mt-4 pt-3 border-t border-[#F2E7D8]">
                    <button
                      type="button"
                      onClick={() => handleSpeak(item, item.exampleSentence, 'normal')}
                      className="w-full text-left group"
                    >
                      <p className="text-sm font-bold text-[#3E2F2B] group-hover:text-[#2F6DB5] transition-colors">
                        „{item.exampleSentence}”
                      </p>
                      {showTranslations && (
                        <p className="mt-0.5 text-xs font-semibold text-[#755F51]">
                          {item.exampleTranslation}
                        </p>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-4 pt-3 border-t border-[#F2E7D8] flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSpeak(item, item.word, 'normal')}
                      aria-label={`Wymów słowo ${item.word}`}
                      className="btn-puffy-blue min-h-[44px] px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      Słuchaj
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpeak(item, item.word, 'slow')}
                      aria-label={`Wymów powoli słowo ${item.word}`}
                      className="btn-puffy-white min-h-[44px] px-2.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#2F6DB5]" aria-hidden="true" />
                      Wolniej
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playToneEffect(isMastered ? 'tap' : 'success', soundEffectsEnabled);
                      onToggleMastered(item.id);
                    }}
                    aria-pressed={isMastered}
                    className={`min-h-[44px] px-2.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-all whitespace-nowrap shrink-0 ${
                      isMastered
                        ? 'btn-puffy-green'
                        : 'bg-[#FAF3E8] border-2 border-[#E7D8C5] text-[#6E5B4F] hover:border-[#55B373]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    {isMastered ? 'Umiem!' : 'Umiem'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </StorybookLessonShell>
  );
};
