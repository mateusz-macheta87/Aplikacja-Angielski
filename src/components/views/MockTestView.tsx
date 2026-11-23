import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Play,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { buildMockTest } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface MockTestViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onTestFinished: (scorePct: number, starsEarned: number, mapStars: number) => void;
  onBackToMap: () => void;
}

export const MockTestView: React.FC<MockTestViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onTestFinished,
  onBackToMap,
}) => {
  const [seed, setSeed] = useState(2026);
  const questions = useMemo(() => buildMockTest(module, seed), [module, seed]);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const current = questions[idx];

  useEffect(() => {
    if (started && !finished && current && current.type === 'audio-choice') {
      speakText(current.spokenText, { lang: module.speechLang, rate: speechRate });
    }
  }, [started, finished, idx, current, module.speechLang, speechRate]);

  const handleChoose = (optionId: string) => {
    if (!current || answers[current.id]) return;
    const isCorrect = optionId === current.correctOptionId;
    playToneEffect(isCorrect ? 'success' : 'tryAgain', soundEffectsEnabled);
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const correctTotal = questions.filter((q) => answers[q.id] === q.correctOptionId).length;
      const pct = Math.round((correctTotal / questions.length) * 100);
      const mapStars = pct >= 85 ? 3 : pct >= 55 ? 2 : 1;
      const starsEarned = mapStars + 2;
      playToneEffect('fanfare', soundEffectsEnabled);
      onTestFinished(pct, starsEarned, mapStars);
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const handleRetake = () => {
    setSeed((s) => s + 37);
    setIdx(0);
    setAnswers({});
    setFinished(false);
    setStarted(true);
  };

  if (questions.length === 0) {
    return (
      <StorybookLessonShell
        title="Sprawdzian próbny"
        module={module}
        onBackToMap={onBackToMap}
      >
        <div className="max-w-xl mx-auto storybook-card rounded-[32px] p-8 text-center">
          <p className="font-display text-xl font-bold text-[#3E2F2B]">
            Za mało haseł na sprawdzian!
          </p>
          <p className="mt-2 text-sm font-semibold text-[#6E5B4F]">
            Ten moduł potrzebuje co najmniej 2 słówek lub zdań, aby wygenerować próbny sprawdzian.
          </p>
          <button
            type="button"
            onClick={onBackToMap}
            className="mt-5 btn-puffy-green min-h-[48px] px-7 rounded-full font-display font-bold"
          >
            Wróć na mapę
          </button>
        </div>
      </StorybookLessonShell>
    );
  }

  if (!started) {
    return (
      <StorybookLessonShell
        title="Sprawdzian próbny"
        module={module}
        onBackToMap={onBackToMap}
      >
        <div className="max-w-2xl mx-auto storybook-card rounded-[32px] p-7 sm:p-10 text-center">
          <div className="flex items-center justify-center gap-4">
            <MascotAvatar
              size="lg"
              equippedAccessories={equippedAccessories}
              mood="happy"
            />
            <div className="w-24 h-24 rounded-full watercolor-frame border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              <img
                src={STORYBOOK_ART.stopTrophy}
                alt="Złoty puchar sprawdzianu"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover scale-[1.08]"
              />
            </div>
          </div>
          <p className="mt-4 text-xs font-bold text-[#8A7465]">
            {module.subjectLabel} · {questions.length} pytań · bez limitu czasu
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold text-[#3E2F2B]">
            Próbny Sprawdzian Iskierki
          </h2>
          <p className="mt-3 text-base text-[#6E5B4F] leading-relaxed max-w-lg mx-auto">
            Sprawdzian łączy słuchanie ze zrozumieniem, gramatykę („I&apos;m wearing a…” i liczbę mnogą) oraz pytania o pogodę. Na końcu otrzymasz bajkowy Dyplom Mistrzyni i pucharową naklejkę!
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                playToneEffect('tap', soundEffectsEnabled);
                setStarted(true);
              }}
              className="btn-puffy-green min-h-[54px] px-9 rounded-full font-display text-lg font-bold inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
              Zacznij sprawdzian!
            </button>
          </div>
        </div>
      </StorybookLessonShell>
    );
  }

  if (finished) {
    const correctTotal = questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    const pct = Math.round((correctTotal / questions.length) * 100);
    const mapStars = pct >= 85 ? 3 : pct >= 55 ? 2 : 1;
    const gradeLabel =
      pct >= 90
        ? 'Celująco! Pełna gotowość na sprawdzian!'
        : pct >= 70
          ? 'Bardzo dobrze! Już prawie wszystko opanowane!'
          : 'Dobry start! Poćwicz chwilę w Słowniczku i spróbuj ponownie.';

    const byCategory = new Map<string, { ok: number; total: number }>();
    for (const q of questions) {
      const entry = byCategory.get(q.skillCategory) || { ok: 0, total: 0 };
      entry.total += 1;
      if (answers[q.id] === q.correctOptionId) entry.ok += 1;
      byCategory.set(q.skillCategory, entry);
    }

    return (
      <StorybookLessonShell
        title="Dyplom Mistrzyni"
        module={module}
        onBackToMap={onBackToMap}
        showCheatSheetButton={false}
      >
        <StorybookCelebrationCard
          title={`Wynik: ${correctTotal} / ${questions.length} (${pct}%)`}
          subtitle={
            <>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A7465] mb-1">
                <Award className="w-4 h-4 text-[#D9820B]" aria-hidden="true" />
                Dyplom Mistrzyni · {module.title}
              </span>
              <span className="block text-base font-bold text-[#4178BF]">{gradeLabel}</span>
            </>
          }
          starsCount={mapStars}
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
                onClick={handleRetake}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Nowy zestaw pytań
              </button>
            </>
          }
        >
          {/* Parent Skill Breakdown */}
          <div className="mt-6 pt-5 border-t border-[#F2E7D8] text-left">
            <h3 className="font-display text-lg font-bold text-[#3E2F2B]">
              Podsumowanie umiejętności (dla rodzica)
            </h3>
            <div className="mt-3 space-y-2">
              {Array.from(byCategory.entries()).map(([cat, stats]) => {
                const catPct = Math.round((stats.ok / stats.total) * 100);
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-4 text-sm rounded-xl bg-[#FAF5EE] px-4 py-2.5"
                  >
                    <span className="font-bold text-[#6E5B4F]">{cat}</span>
                    <span className="font-display font-bold text-[#3E2F2B] tabular-nums">
                      {stats.ok} / {stats.total} ({catPct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </StorybookCelebrationCard>
      </StorybookLessonShell>
    );
  }

  const chosenId = answers[current.id];
  const isAnswered = Boolean(chosenId);
  const isCorrect = chosenId === current.correctOptionId;

  return (
    <StorybookLessonShell
      title="Sprawdzian próbny"
      module={module}
      onBackToMap={onBackToMap}
      showCheatSheetButton={false}
      totalSteps={questions.length}
      currentStepIndex={idx}
    >
      <div className="space-y-5">
        <section className="storybook-card rounded-[30px] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#D64988] text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <div>
              <p className="text-xs font-bold text-[#8A7465]">{current.skillCategory}</p>
              <p className="font-display text-lg sm:text-xl font-bold text-[#3E2F2B]">
                {current.promptPl}
              </p>
            </div>
          </div>

          {current.displayQuestion && (
            <h2 className="mt-4 font-display text-2xl font-bold text-[#4178BF]">
              {current.displayQuestion}
            </h2>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                speakText(current.spokenText, { lang: module.speechLang, rate: 'normal' })
              }
              className="btn-puffy-blue min-h-[50px] px-6 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              Posłuchaj
            </button>
            <button
              type="button"
              onClick={() =>
                speakText(current.spokenText, { lang: module.speechLang, rate: 'slow' })
              }
              className="btn-puffy-white min-h-[50px] px-5 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-[#5496E8]" aria-hidden="true" />
              Wolniej
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {current.options.map((opt) => {
            const isRight = opt.id === current.correctOptionId;
            const isPicked = opt.id === chosenId;
            let style =
              'bg-white border-[#E5D7C6] hover:border-[#5496E8] hover:-translate-y-0.5';
            if (isAnswered) {
              if (isRight) style = 'bg-[#EAF8EE] border-[#55B373] ring-4 ring-[#BBF7D0]/70';
              else if (isPicked) style = 'bg-[#FFF0F3] border-[#E05A88] ring-4 ring-[#FBCFE8]/70';
              else style = 'bg-white border-[#EFE4D6] opacity-55';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswered}
                onClick={() => handleChoose(opt.id)}
                className={`min-h-[98px] rounded-[24px] border-[3px] p-4 flex items-center gap-4 text-left transition-all ${style}`}
              >
                {opt.illustration && (
                  <div className="w-20 h-20 rounded-[18px] watercolor-frame border border-[#EFE0CC] overflow-hidden flex items-center justify-center shrink-0">
                    <ItemIllustration
                      kind={opt.illustration}
                      colorHex={opt.colorHex}
                      className="w-full h-full"
                      roundedClass="rounded-[16px]"
                    />
                  </div>
                )}
                <span className="font-display text-lg font-bold text-[#3E2F2B] flex-1">
                  {opt.label}
                </span>
                {isAnswered && isRight && (
                  <CheckCircle2 className="w-6 h-6 text-[#3E965A] shrink-0" aria-hidden="true" />
                )}
                {isAnswered && isPicked && !isRight && (
                  <XCircle className="w-6 h-6 text-[#D64988] shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className={`rounded-[24px] border-2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isCorrect
                ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                : 'bg-[#FFF0F3] border-[#F6B8CE] text-[#9D2A52]'
            }`}
          >
            <p className="text-sm font-bold">{current.explanationPl}</p>
            <button
              type="button"
              onClick={handleNext}
              className="btn-puffy-green min-h-[48px] px-6 rounded-full font-display text-base font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              {idx + 1 >= questions.length ? 'Zobacz Dyplom!' : 'Następne pytanie'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </StorybookLessonShell>
  );
};
