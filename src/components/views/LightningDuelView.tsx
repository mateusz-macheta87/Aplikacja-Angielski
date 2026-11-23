import React, { useEffect, useMemo, useState } from 'react';
import { Play, RotateCcw, Star, Timer, Volume2 } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { generateAudioQuizQuestions } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface LightningDuelViewProps {
  mode: 'lightning' | 'duel';
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  onBackToMap: () => void;
  onCompleteLightning: (score: number, starsEarned: number) => void;
  onCompleteDuel: (starsEarned: number) => void;
}

export const LightningDuelView: React.FC<LightningDuelViewProps> = ({
  mode,
  module,
  equippedAccessories,
  soundEffectsEnabled,
  onBackToMap,
  onCompleteLightning,
  onCompleteDuel,
}) => {
  const [seed, setSeed] = useState(91);
  const questions = useMemo(
    () => generateAudioQuizQuestions(module, mode === 'lightning' ? 24 : 10, seed),
    [module, mode, seed]
  );

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[idx % Math.max(1, questions.length)];
  const currentPlayer = idx % 2 === 0 ? 1 : 2;

  useEffect(() => {
    if (mode !== 'lightning' || !started || finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      const earned = Math.max(1, Math.min(5, Math.ceil(score / 3)));
      playToneEffect('fanfare', soundEffectsEnabled);
      onCompleteLightning(score, earned);
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, started, finished, timeLeft, score, soundEffectsEnabled, onCompleteLightning]);

  useEffect(() => {
    if (started && !finished && current) {
      speakText(current.spokenText, { lang: module.speechLang });
    }
  }, [started, finished, idx, current, module.speechLang]);

  const handleAnswer = (optId: string) => {
    if (!current || finished) return;
    const isRight = optId === current.correctOptionId;
    playToneEffect(isRight ? 'success' : 'tryAgain', soundEffectsEnabled);

    if (mode === 'lightning') {
      if (isRight) setScore((s) => s + 1);
      setIdx((i) => i + 1);
    } else {
      if (isRight) {
        if (currentPlayer === 1) setP1Score((s) => s + 1);
        else setP2Score((s) => s + 1);
      }
      if (idx + 1 >= questions.length) {
        setFinished(true);
        playToneEffect('fanfare', soundEffectsEnabled);
        onCompleteDuel(4);
      } else {
        setIdx((i) => i + 1);
      }
    }
  };

  const handleRestart = () => {
    setSeed((s) => s + 41);
    setIdx(0);
    setTimeLeft(60);
    setScore(0);
    setP1Score(0);
    setP2Score(0);
    setFinished(false);
    setStarted(true);
  };

  const title = mode === 'lightning' ? 'Błyskawica (60s)' : 'Pojedynek z rodzicem';

  if (!started) {
    return (
      <StorybookLessonShell title={title} module={module} onBackToMap={onBackToMap}>
        <div className="storybook-card rounded-[32px] p-8 sm:p-10 text-center max-w-xl mx-auto">
          <div className="w-32 h-32 mx-auto rounded-[28px] watercolor-frame border-2 border-[#EED9BD] shadow-sm overflow-hidden flex items-center justify-center">
            <img
              src={mode === 'lightning' ? STORYBOOK_ART.gameLightning : STORYBOOK_ART.gameDuel}
              alt={mode === 'lightning' ? 'Magiczna złota błyskawica' : 'Medale pojedynku rodzinnego'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover scale-[1.06]"
            />
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold text-[#3E2F2B]">
            {mode === 'lightning'
              ? 'Ile słówek odgadniesz w 60 sekund?'
              : 'Zagraj na jednym iPadzie z Mamą lub Tatą!'}
          </h2>
          <p className="mt-2 text-base text-[#6E5B4F] leading-relaxed">
            {mode === 'lightning'
              ? 'Słuchaj uważnie i stukaj obrazki jak najszybciej! Każda dobra odpowiedź to +1 punkt i gwiazdki na koniec.'
              : '10 rund na zmianę: Gracz 1 (Córka) i Gracz 2 (Rodzic). Kto zdobędzie puchar rodzinnego pojedynku?'}
          </p>
          <button
            type="button"
            onClick={() => {
              playToneEffect('tap', soundEffectsEnabled);
              setStarted(true);
            }}
            className="mt-7 btn-puffy-amber min-h-[54px] px-9 rounded-full font-display text-lg font-bold inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            Startujemy!
          </button>
        </div>
      </StorybookLessonShell>
    );
  }

  if (finished) {
    return (
      <StorybookLessonShell title={title} module={module} onBackToMap={onBackToMap}>
        <StorybookCelebrationCard
          title={
            mode === 'lightning'
              ? `Wynik Błyskawicy: ${score} pkt!`
              : p1Score > p2Score
                ? 'Wygrywa Córka!'
                : p2Score > p1Score
                  ? 'Wygrywa Rodzic!'
                  : 'Remis! Obie drużyny na medal!'
          }
          subtitle={
            mode === 'lightning'
              ? 'Niesamowite tempo! Zdobywasz gwiazdki do Garderoby Iskierki!'
              : `Córka: ${p1Score} pkt · Rodzic: ${p2Score} pkt (+4 gwiazdki i naklejka!)`
          }
          starsCount={3}
          equippedAccessories={equippedAccessories}
          actions={
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="btn-puffy-green min-h-[50px] px-7 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Rewanż!
              </button>
              <button
                type="button"
                onClick={onBackToMap}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold"
              >
                Wróć na mapę
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
      showCheatSheetButton={false}
      rightSlot={
        mode === 'lightning' ? (
          <div className="flex items-center gap-3 font-display text-lg font-bold text-[#3E2F2B] tabular-nums">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF5D9] border border-[#F3DFA2]">
              <Timer className="w-4 h-4 text-[#D9820B]" aria-hidden="true" />
              {timeLeft}s
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAF8EE] border border-[#A7E3B9] text-[#226B3B]">
              <Star className="w-4 h-4 fill-[#55B373] text-[#226B3B]" aria-hidden="true" />
              {score}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold tabular-nums">
            <span
              className={`px-3.5 py-1.5 rounded-full border-2 ${
                currentPlayer === 1
                  ? 'bg-[#FCE8EE] border-[#E05A88] text-[#9D2A52]'
                  : 'bg-white border-[#EFE2D2] text-[#8A7465]'
              }`}
            >
              Córka: {p1Score}
            </span>
            <span
              className={`px-3.5 py-1.5 rounded-full border-2 ${
                currentPlayer === 2
                  ? 'bg-[#E5F2FE] border-[#5496E8] text-[#2A5E9E]'
                  : 'bg-white border-[#EFE2D2] text-[#8A7465]'
              }`}
            >
              Rodzic: {p2Score}
            </span>
          </div>
        )
      }
    >
      <section className="storybook-card rounded-[30px] p-6 sm:p-8 text-center">
        {mode === 'duel' && (
          <p className="font-display text-lg font-bold text-[#9333EA] mb-2">
            Tura: {currentPlayer === 1 ? 'Córka (Gracz 1)' : 'Rodzic (Gracz 2)'} · Runda {idx + 1} / {questions.length}
          </p>
        )}

        <p className="font-display text-2xl font-bold text-[#3E2F2B]">
          „{current.spokenText}”
        </p>

        <button
          type="button"
          onClick={() => speakText(current.spokenText, { lang: module.speechLang })}
          className="mt-4 btn-puffy-blue min-h-[48px] px-6 rounded-full font-display font-bold inline-flex items-center gap-2"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Powtórz głos
        </button>

        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-3xl mx-auto">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleAnswer(opt.id)}
              aria-label={opt.label}
              className="min-h-[154px] rounded-[26px] border-[3px] border-[#E7D3B8] bg-[#FFF8EE] hover:border-[#5496E8] hover:-translate-y-0.5 active:scale-95 p-3 flex flex-col items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(145,103,60,0.08)]"
            >
              <div className="w-28 h-28 rounded-[18px] overflow-hidden flex items-center justify-center">
                <ItemIllustration
                  kind={opt.illustration}
                  colorHex={opt.colorHex}
                  className="w-full h-full"
                  roundedClass="rounded-[16px]"
                />
              </div>
              <span className="font-display text-sm font-bold text-[#3E2F2B]">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>
    </StorybookLessonShell>
  );
};
