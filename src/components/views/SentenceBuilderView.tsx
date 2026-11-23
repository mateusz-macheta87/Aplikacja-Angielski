import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { evaluateSentenceAssembly, seededShuffle } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface SentenceBuilderViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteSession: (starsEarned: number, mapStars: number) => void;
}

interface IndexedToken {
  uid: string;
  text: string;
}

export const SentenceBuilderView: React.FC<SentenceBuilderViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteSession,
}) => {
  const sentences = module.sentences;
  const [idx, setIdx] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<IndexedToken[]>([]);
  const [result, setResult] = useState<{ isCorrect: boolean; feedbackPl: string } | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = sentences[idx];

  const allBankTokens = useMemo<IndexedToken[]>(() => {
    if (!current) return [];
    const combined = [...current.tokens, ...(current.distractorTokens || [])].map((text, i) => ({
      uid: `${current.id}-${i}-${text}`,
      text,
    }));
    return seededShuffle(combined, idx * 53 + 17);
  }, [current, idx]);

  if (!current) {
    return (
      <StorybookLessonShell title="Zdania — I'm wearing" module={module} onBackToMap={onBackToMap}>
        <div className="storybook-card rounded-[28px] p-8 text-center">
          <p className="font-semibold text-[#6E5B4F]">
            Ten moduł nie zawiera jeszcze zadań z układaniem zdań.
          </p>
          <button
            type="button"
            onClick={onBackToMap}
            className="mt-4 btn-puffy-green min-h-[48px] px-7 rounded-full font-display font-bold"
          >
            Wróć na mapę
          </button>
        </div>
      </StorybookLessonShell>
    );
  }

  const selectedUids = new Set(selectedTokens.map((t) => t.uid));

  const handlePickToken = (token: IndexedToken) => {
    if (result?.isCorrect) return;
    playToneEffect('tap', soundEffectsEnabled);
    setSelectedTokens((prev) => [...prev, token]);
    setResult(null);
  };

  const handleRemoveToken = (uid: string) => {
    if (result?.isCorrect) return;
    playToneEffect('tap', soundEffectsEnabled);
    setSelectedTokens((prev) => prev.filter((t) => t.uid !== uid));
    setResult(null);
  };

  const handleCheck = () => {
    const evaluation = evaluateSentenceAssembly(
      selectedTokens.map((t) => t.text),
      current.tokens,
      current.grammarTipPl
    );
    setResult(evaluation);
    if (evaluation.isCorrect) {
      playToneEffect('success', soundEffectsEnabled);
      setSolvedCount((c) => c + 1);
      speakText(current.targetSentence, { lang: module.speechLang, rate: speechRate });
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= sentences.length) {
      playToneEffect('fanfare', soundEffectsEnabled);
      onCompleteSession(4, 3);
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setSelectedTokens([]);
      setResult(null);
      setShowTip(false);
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setSelectedTokens([]);
    setResult(null);
    setShowTip(false);
    setSolvedCount(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <StorybookLessonShell title="Zdania — I'm wearing" module={module} onBackToMap={onBackToMap}>
        <StorybookCelebrationCard
          title="Gramatyka opanowana!"
          subtitle={
            <>
              Ułożyłaś poprawnie wszystkie <strong>{solvedCount} z {sentences.length}</strong> zdań (+4 gwiazdki i naklejka!). Zasada „a” oraz pytania o pogodę są już w małym paluszku!
            </>
          }
          starsCount={3}
          equippedAccessories={equippedAccessories}
          actions={
            <>
              <button
                type="button"
                onClick={onBackToMap}
                className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display font-bold"
              >
                Wróć na mapę przygód
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Ułóż jeszcze raz
              </button>
            </>
          }
        />
      </StorybookLessonShell>
    );
  }

  return (
    <StorybookLessonShell
      title="Zdania — I'm wearing"
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={sentences.length}
      currentStepIndex={idx}
    >
      <div className="space-y-5">
        {/* Prompt Card */}
        <section className="storybook-card rounded-[30px] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-[26px] watercolor-frame border-2 border-[#EED9BD] shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            <ItemIllustration
              kind={current.illustration}
              colorHex={current.itemColor}
              className="w-full h-full"
              roundedClass="rounded-[24px]"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-8 h-8 rounded-full bg-[#55B373] text-white font-display text-base font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p className="text-xs font-bold text-[#8A7465]">Ułóż zdanie z kafelków</p>
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#3E2F2B]">
              {current.promptPl}
            </h2>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() =>
                  speakText(current.targetSentence, { lang: module.speechLang, rate: speechRate })
                }
                className="btn-puffy-blue min-h-[46px] px-5 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                Posłuchaj zdania
              </button>
              <button
                type="button"
                onClick={() => setShowTip((s) => !s)}
                className="btn-puffy-white min-h-[46px] px-4 rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Lightbulb className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
                {showTip ? 'Ukryj podpowiedź' : 'Podpowiedź Iskierki'}
              </button>
            </div>
            {showTip && (
              <p className="mt-3 text-sm font-semibold text-[#784A14] bg-[#FEF7DC] border-2 border-[#F3DFA2] rounded-2xl px-4 py-2.5">
                {current.grammarTipPl}
              </p>
            )}
          </div>
        </section>

        {/* Sentence Assembly Tray */}
        <section className="storybook-card rounded-[30px] p-6 sm:p-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#8A7465]">
              Twoje zdanie (stuknij kafelek, aby go cofnąć)
            </p>
            {selectedTokens.length > 0 && !result?.isCorrect && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTokens([]);
                  setResult(null);
                }}
                className="text-xs font-bold text-[#D64988] hover:underline"
              >
                Wyczyść wszystko
              </button>
            )}
          </div>

          <div
            aria-label="Obszar układania zdania"
            className="min-h-[86px] rounded-[24px] border-2 border-dashed border-[#D9BC9A] bg-[#FFFDF9] p-3.5 flex flex-wrap items-center gap-2.5"
          >
            {selectedTokens.length === 0 ? (
              <span className="text-sm font-semibold text-[#A89687] px-2">
                Kliknij słowa poniżej w odpowiedniej kolejności…
              </span>
            ) : (
              selectedTokens.map((tok) => (
                <button
                  key={tok.uid}
                  type="button"
                  onClick={() => handleRemoveToken(tok.uid)}
                  className="btn-puffy-blue min-h-[48px] px-5 py-2 rounded-2xl font-display text-lg font-bold"
                >
                  {tok.text}
                </button>
              ))
            )}
          </div>

          {/* Word Tile Bank */}
          <div className="mt-6">
            <p className="text-xs font-bold text-[#8A7465] mb-3">
              Dostępne słowa (uwaga: niektóre kafelki to zmyłki!)
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allBankTokens.map((tok) => {
                const used = selectedUids.has(tok.uid);
                return (
                  <button
                    key={tok.uid}
                    type="button"
                    disabled={used || result?.isCorrect}
                    onClick={() => handlePickToken(tok)}
                    className={`min-h-[50px] px-5 py-2.5 rounded-2xl font-display text-lg font-bold transition-all ${
                      used
                        ? 'bg-[#F5ECE0] border-2 border-[#E7D8C5] text-[#C9B9A7] cursor-default'
                        : 'btn-puffy-white text-[#3E2F2B]'
                    }`}
                  >
                    {tok.text}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 pt-5 border-t border-[#F2E7D8] flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <MascotAvatar
                size="sm"
                equippedAccessories={equippedAccessories}
                mood={result ? (result.isCorrect ? 'cheer' : 'encourage') : 'happy'}
              />
              {result && (
                <div
                  className={`rounded-2xl border-2 px-4 py-2.5 flex items-start gap-2.5 text-sm font-bold ${
                    result.isCorrect
                      ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                      : 'bg-[#FFF0F3] border-[#F6B8CE] text-[#9D2A52]'
                  }`}
                >
                  {result.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <p>{result.feedbackPl}</p>
                    {result.isCorrect && (
                      <p className="mt-0.5 text-xs font-semibold text-[#2E7D4A]">
                        {current.grammarTipPl}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!result?.isCorrect ? (
              <button
                type="button"
                onClick={handleCheck}
                className="btn-puffy-green min-h-[54px] min-w-[200px] px-8 rounded-full font-display text-lg font-bold"
              >
                Sprawdź zdanie
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="btn-puffy-green min-h-[54px] min-w-[220px] px-8 rounded-full font-display text-lg font-bold inline-flex items-center justify-center gap-2"
              >
                {idx + 1 >= sentences.length ? 'Odbierz gwiazdki!' : 'Następne zdanie'}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      </div>
    </StorybookLessonShell>
  );
};
