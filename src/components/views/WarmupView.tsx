import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { LessonModule, ModuleProgress } from '../../types/curriculum';
import {
  buildParentWarmupSummary,
  buildSmartWarmupQuestions,
  WarmupAnswerRecord,
} from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface WarmupViewProps {
  module: LessonModule;
  progress: ModuleProgress;
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteWarmup: (starsEarned: number, masteredIds: string[], mistakeIds: string[]) => void;
}

export const WarmupView: React.FC<WarmupViewProps> = ({
  module,
  progress,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteWarmup,
}) => {
  const [seed, setSeed] = useState(17);
  const questions = useMemo(
    () => buildSmartWarmupQuestions(module, progress, seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [module, seed]
  );

  const [idx, setIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [records, setRecords] = useState<WarmupAnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);

  const current = questions[idx];

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!finished && current) {
      speakText(current.spokenText, { lang: module.speechLang, rate: speechRate });
    }
  }, [finished, idx, current, module.speechLang, speechRate]);

  const handleSelect = (optId: string) => {
    if (!current || finished || selectedId) return;
    const isRight = optId === current.correctOptionId;

    if (isRight) {
      playToneEffect('success', soundEffectsEnabled);
      setSelectedId(optId);
      const vocabItem = module.vocabulary.find((v) => v.id === current.correctOptionId);
      const nextRecord: WarmupAnswerRecord = {
        wordId: current.correctOptionId,
        word: vocabItem?.word || current.spokenText,
        categoryLabel: vocabItem?.categoryLabel || 'Słownictwo',
        correct: !wrongAttempt,
      };
      const updatedRecords = [...records, nextRecord];
      setRecords(updatedRecords);

      if (advanceTimerRef.current !== null) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        setSelectedId(null);
        setWrongAttempt(false);
        if (idx + 1 >= questions.length) {
          playToneEffect('fanfare', soundEffectsEnabled);
          const masteredIds = updatedRecords.filter((r) => r.correct).map((r) => r.wordId);
          const mistakeIds = updatedRecords.filter((r) => !r.correct).map((r) => r.wordId);
          onCompleteWarmup(3, masteredIds, mistakeIds);
          setFinished(true);
        } else {
          setIdx((i) => i + 1);
        }
      }, 650);
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
      setWrongAttempt(true);
      speakText(current.spokenText, { lang: module.speechLang, rate: 'slow' });
    }
  };

  const parentSummary = useMemo(() => buildParentWarmupSummary(records), [records]);
  const correctFirstTryCount = records.filter((r) => r.correct).length;

  return (
    <StorybookLessonShell
      title="3-minutowa rozgrzewka przed sprawdzianem"
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={!finished ? questions.length : undefined}
      currentStepIndex={!finished ? idx : undefined}
    >
      {finished ? (
        <div className="space-y-5 max-w-2xl mx-auto">
          <StorybookCelebrationCard
            title="Jesteś gotowa na sprawdzian!"
            subtitle={`Świetna rozgrzewka! Bezbłędne odpowiedzi za pierwszym razem: ${correctFirstTryCount} z ${records.length} (${parentSummary.scorePercent}%). Zdobywasz +3 gwiazdki!`}
            starsCount={parentSummary.readyForTest ? 3 : 2}
            equippedAccessories={progress.equippedAccessories}
            actions={
              <>
                <button
                  type="button"
                  onClick={onBackToMap}
                  className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display font-bold"
                >
                  Wróć na mapę
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeed((s) => s + 29);
                    setIdx(0);
                    setRecords([]);
                    setFinished(false);
                    setWrongAttempt(false);
                    setParentOpen(false);
                  }}
                  className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Jeszcze jedna rozgrzewka
                </button>
              </>
            }
          />

          {/* Collapsible Parent Warmup Summary */}
          <section className="storybook-card rounded-[28px] p-5">
            <button
              type="button"
              onClick={() => setParentOpen((o) => !o)}
              aria-expanded={parentOpen}
              className="w-full flex items-center justify-between gap-3 text-left font-display text-base font-bold text-[#3E2F2B]"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2F6DB5]" aria-hidden="true" />
                Podsumowanie dla rodzica (co już umie, a co warto powtórzyć)
              </span>
              {parentOpen ? (
                <ChevronUp className="w-5 h-5 text-[#755F51]" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#755F51]" aria-hidden="true" />
              )}
            </button>

            {parentOpen && (
              <div className="mt-4 pt-4 border-t border-[#EFE0CC] space-y-3 text-sm">
                {parentSummary.strongCategories.length > 0 && (
                  <div className="rounded-2xl bg-[#EAF8EE] border border-[#A7E3B9] p-3.5 text-[#226B3B]">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      Mocne strony:
                    </p>
                    <p className="mt-1 font-semibold">
                      {parentSummary.strongCategories.join(', ')}
                    </p>
                  </div>
                )}

                {parentSummary.reviewWords.length > 0 ? (
                  <div className="rounded-2xl bg-[#FEF7DC] border border-[#F3DFA2] p-3.5 text-[#784A14]">
                    <p className="font-bold">Warto 1 raz przypomnieć przed sprawdzianem:</p>
                    <ul className="mt-1.5 space-y-1">
                      {parentSummary.reviewWords.map((word) => {
                        const vocab = module.vocabulary.find((v) => v.word === word);
                        return (
                          <li key={word} className="flex items-center justify-between gap-2 font-semibold">
                            <span>
                              <strong>{word}</strong>
                              {vocab ? ` — ${vocab.translation}` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => speakText(word, { lang: module.speechLang })}
                              className="px-2.5 py-1 rounded-full bg-white border border-[#EED9BD] text-xs font-bold text-[#2F6DB5] inline-flex items-center gap-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Posłuchaj
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#EAF8EE] border border-[#A7E3B9] p-3.5 font-bold text-[#226B3B]">
                    Wszystkie {records.length} pytań rozwiązane za pierwszym razem bez wahania!
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      ) : current ? (
        <section className="storybook-card rounded-[32px] p-6 sm:p-8 max-w-3xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MascotAvatar
              size="sm"
              equippedAccessories={progress.equippedAccessories}
              mood={selectedId ? 'cheer' : wrongAttempt ? 'thinking' : 'listening'}
            />
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-[#755F51]">
                Rozgrzewka · Pytanie {idx + 1} z {questions.length}
              </p>
              <h2 className="font-display text-2xl font-bold text-[#3E2F2B]">
                Posłuchaj i stuknij właściwy obrazek!
              </h2>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => speakText(current.spokenText, { lang: module.speechLang, rate: speechRate })}
              className="btn-puffy-blue min-h-[48px] px-7 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              Posłuchaj
            </button>
            <button
              type="button"
              onClick={() => speakText(current.spokenText, { lang: module.speechLang, rate: 'slow' })}
              className="btn-puffy-white min-h-[48px] px-5 rounded-full font-display text-sm font-bold"
            >
              Wolniej
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {current.options.map((opt) => {
              const isChosenCorrect = selectedId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  aria-label={opt.label}
                  className={`min-h-[154px] rounded-[26px] border-[3px] p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                    isChosenCorrect
                      ? 'border-[#55B373] bg-[#EAF8EE] scale-105'
                      : 'border-[#E7D3B8] bg-[#FFF8EE] hover:border-[#5496E8] active:scale-95'
                  }`}
                >
                  <div className="w-24 h-24 rounded-[18px] overflow-hidden flex items-center justify-center">
                    <ItemIllustration
                      kind={opt.illustration}
                      colorHex={opt.colorHex}
                      className="w-full h-full"
                      roundedClass="rounded-[16px]"
                    />
                  </div>
                  <span className="font-display text-sm font-bold text-[#3E2F2B]">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {wrongAttempt && !selectedId && (
            <p className="mt-4 rounded-2xl bg-[#FEF7DC] border border-[#F3DFA2] px-4 py-2.5 text-sm font-bold text-[#784A14]">
              Prawie! Posłuchaj uważnie jeszcze raz i spróbuj inny obrazek.
            </p>
          )}
        </section>
      ) : null}
    </StorybookLessonShell>
  );
};
