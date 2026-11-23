import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Play, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { LessonModule, VocabCategory } from '../../types/curriculum';
import { generateAudioQuizQuestions } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface AudioQuizViewProps {
  module: LessonModule;
  title?: string;
  categoryFilter?: VocabCategory;
  onlyWordIds?: string[];
  questionCount?: number;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteQuiz: (
    starsEarned: number,
    mapStars: number,
    masteredIds: string[],
    mistakeIds: string[],
    fixedMistakeIds: string[]
  ) => void;
}

export const AudioQuizView: React.FC<AudioQuizViewProps> = ({
  module,
  title = 'Słuchanie',
  categoryFilter,
  onlyWordIds,
  questionCount = 6,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteQuiz,
}) => {
  const [seed, setSeed] = useState(42);
  const questions = useMemo(
    () =>
      generateAudioQuizQuestions(module, questionCount, seed, {
        categoryFilter,
        onlyWordIds,
      }),
    [module, questionCount, seed, categoryFilter, onlyWordIds]
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showText, setShowText] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [masteredInRun, setMasteredInRun] = useState<string[]>([]);
  const [mistakesInRun, setMistakesInRun] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    if (!finished && currentQuestion) {
      speakText(currentQuestion.spokenText, {
        lang: module.speechLang,
        rate: speechRate,
      });
    }
  }, [currentIdx, seed, finished, currentQuestion, module.speechLang, speechRate]);

  if (!currentQuestion) {
    return (
      <StorybookLessonShell title={title} module={module} onBackToMap={onBackToMap}>
        <div className="storybook-card rounded-[28px] p-8 text-center">
          <p className="text-[#6E5B4F] font-semibold">Brak pytań do tego zestawu — wybierz inny przystanek!</p>
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

  const isCorrect = checked && pickedId === currentQuestion.correctOptionId;

  const handleCheck = () => {
    if (!pickedId || checked) return;
    setChecked(true);
    if (pickedId === currentQuestion.correctOptionId) {
      playToneEffect('success', soundEffectsEnabled);
      setCorrectCount((c) => c + 1);
      setMasteredInRun((prev) =>
        prev.includes(currentQuestion.correctOptionId)
          ? prev
          : [...prev, currentQuestion.correctOptionId]
      );
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
      setMistakesInRun((prev) =>
        prev.includes(currentQuestion.correctOptionId)
          ? prev
          : [...prev, currentQuestion.correctOptionId]
      );
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      const ratio = correctCount / questions.length;
      const mapStars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
      const earnedStars = mapStars + 1;
      playToneEffect('fanfare', soundEffectsEnabled);
      onCompleteQuiz(
        earnedStars,
        mapStars,
        masteredInRun,
        mistakesInRun,
        onlyWordIds ? masteredInRun : []
      );
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setPickedId(null);
      setChecked(false);
      setShowText(false);
    }
  };

  const handleRestart = () => {
    setSeed((s) => s + 23);
    setCurrentIdx(0);
    setPickedId(null);
    setChecked(false);
    setShowText(false);
    setCorrectCount(0);
    setMasteredInRun([]);
    setMistakesInRun([]);
    setFinished(false);
  };

  if (finished) {
    const ratio = correctCount / questions.length;
    const mapStars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
    const earnedStars = mapStars + 1;

    return (
      <StorybookLessonShell title={title} module={module} onBackToMap={onBackToMap}>
        <StorybookCelebrationCard
          title="Wspaniale Ci poszło!"
          subtitle={
            <>
              Trafione odpowiedzi: <strong>{correctCount} z {questions.length}</strong> · Zdobywasz{' '}
              <strong>+{earnedStars} gwiazdek</strong> do wydania!
            </>
          }
          starsCount={mapStars}
          equippedAccessories={equippedAccessories}
          actions={
            <>
              <button
                type="button"
                onClick={onBackToMap}
                className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display text-base font-bold"
              >
                Wróć na mapę przygód
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Zagraj jeszcze raz
              </button>
            </>
          }
        />
      </StorybookLessonShell>
    );
  }

  return (
    <StorybookLessonShell
      title={title}
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={questions.length}
      currentStepIndex={currentIdx}
    >
      <section className="storybook-card rounded-[30px] p-6 sm:p-8">
        {/* Step Heading Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#55B373] text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
              {currentIdx + 1}
            </span>
            <p className="font-display text-lg sm:text-xl font-bold text-[#3E2F2B]">
              {currentQuestion.questionPromptPl}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowText((t) => !t)}
            aria-label={showText ? 'Ukryj napis' : 'Pokaż napis pomocniczy'}
            className="min-h-[42px] px-3 rounded-full bg-[#FAF3E8] text-[#786356] text-xs font-bold hover:bg-[#F3E6D3] inline-flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{showText ? 'Ukryj napis' : 'Pokaż napis'}</span>
          </button>
        </div>

        {/* Big Juicy Audio Buttons — matching Screenshot 3 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              speakText(currentQuestion.spokenText, {
                lang: module.speechLang,
                rate: 'normal',
              })
            }
            className="btn-puffy-blue min-h-[54px] px-7 py-3 rounded-full font-display text-lg font-bold inline-flex items-center gap-2.5"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            Posłuchaj
          </button>

          <button
            type="button"
            onClick={() =>
              speakText(currentQuestion.spokenText, {
                lang: module.speechLang,
                rate: 'slow',
              })
            }
            className="btn-puffy-white min-h-[54px] px-6 py-3 rounded-full font-display text-lg font-bold inline-flex items-center gap-2"
          >
            <Volume2 className="w-5 h-5 text-[#5496E8]" aria-hidden="true" />
            Wolniej
          </button>
        </div>

        {(showText || checked) && (
          <p className="mt-4 text-center font-display text-xl font-bold text-[#4178BF]">
            „{currentQuestion.spokenText}”
          </p>
        )}

        {/* 4 Illustrated Watercolor Cards Row */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 max-w-3xl mx-auto">
          {currentQuestion.options.map((opt) => {
            const isSelected = pickedId === opt.id;
            const isRight = opt.id === currentQuestion.correctOptionId;

            let borderStyle =
              'bg-[#FFF8EE] border-[#E7D3B8] hover:border-[#5496E8] hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(145,103,60,0.08)]';
            if (!checked && isSelected) {
              borderStyle = 'bg-[#FFF8EE] border-[#5496E8] ring-4 ring-[#BFDBFE]/70 -translate-y-1 shadow-[0_8px_18px_rgba(84,150,232,0.2)]';
            } else if (checked) {
              if (isRight) {
                borderStyle = 'bg-[#EAF8EE] border-[#55B373] ring-4 ring-[#BBF7D0]/75';
              } else if (isSelected) {
                borderStyle = 'bg-[#FFF0F3] border-[#E05A88] ring-4 ring-[#FBCFE8]/75';
              } else {
                borderStyle = 'bg-[#FFF8EE] border-[#EFE4D6] opacity-55';
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={checked}
                onClick={() => {
                  playToneEffect('tap', soundEffectsEnabled);
                  setPickedId(opt.id);
                }}
                aria-label={opt.label}
                aria-pressed={isSelected}
                className={`min-h-[154px] sm:min-h-[168px] rounded-[26px] border-[3px] p-2.5 sm:p-3 flex flex-col items-center justify-center gap-2 transition-all focus-visible:outline-2 focus-visible:outline-amber-500 ${borderStyle}`}
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] overflow-hidden flex items-center justify-center">
                  <ItemIllustration
                    kind={opt.illustration}
                    colorHex={opt.colorHex}
                    className="w-full h-full"
                    roundedClass="rounded-[18px]"
                  />
                </div>
                {(checked || !module.speechLang.startsWith('en') || opt.illustration === 'generic') && (
                  <span className="font-display text-sm font-bold text-[#3E2F2B] text-center leading-tight">
                    {opt.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mascot + Puffy Green Check/Next CTA (matching Screenshot 3) */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <MascotAvatar
              size="sm"
              equippedAccessories={equippedAccessories}
              mood={checked ? (isCorrect ? 'cheer' : 'encourage') : 'happy'}
            />
            {checked && (
              <div
                className={`px-4 py-2 rounded-2xl border-2 text-sm font-bold inline-flex items-center gap-2 ${
                  isCorrect
                    ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                    : 'bg-[#FFF0F3] border-[#F6B8CE] text-[#9D2A52]'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    Brawo! Świetnie usłyszałaś!
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                    Spójrz na zielony obrazek i zapamiętaj!
                  </>
                )}
              </div>
            )}
          </div>

          {!checked ? (
            <button
              type="button"
              disabled={!pickedId}
              onClick={handleCheck}
              className={`min-h-[54px] min-w-[180px] px-8 rounded-full font-display text-lg font-bold transition-all ${
                pickedId
                  ? 'btn-puffy-green'
                  : 'bg-[#E8DFD3] text-[#A29385] cursor-not-allowed border-b-4 border-[#D5C9BA]'
              }`}
            >
              Sprawdź
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="btn-puffy-green min-h-[54px] min-w-[200px] px-8 rounded-full font-display text-lg font-bold"
            >
              {currentIdx + 1 >= questions.length ? 'Odbierz gwiazdki!' : 'Dalej →'}
            </button>
          )}
        </div>
      </section>
    </StorybookLessonShell>
  );
};
