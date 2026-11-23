import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, ShieldCheck, Star, Timer, Volume2 } from 'lucide-react';
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
  const [duelLayout, setDuelLayout] = useState<'tabletop180' | 'turns'>('tabletop180');
  const [fairHandicap, setFairHandicap] = useState(true);
  const [parentLocked, setParentLocked] = useState(false);
  const [roundWinner, setRoundWinner] = useState<null | 'child' | 'parent'>(null);

  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [finished, setFinished] = useState(false);

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const soundRef = useRef(soundEffectsEnabled);
  soundRef.current = soundEffectsEnabled;
  const onCompleteLightningRef = useRef(onCompleteLightning);
  onCompleteLightningRef.current = onCompleteLightning;
  const tabletopTimerRef = useRef<number | null>(null);

  const current = questions.length > 0 ? questions[idx % questions.length] : undefined;
  const currentPlayer = idx % 2 === 0 ? 1 : 2;

  useEffect(() => {
    return () => {
      if (tabletopTimerRef.current !== null) {
        clearTimeout(tabletopTimerRef.current);
        tabletopTimerRef.current = null;
      }
    };
  }, []);

  // Stable 1-second countdown timer that never resets when score changes
  useEffect(() => {
    if (mode !== 'lightning' || !started || finished) return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, started, finished]);

  // Complete Lightning session once timeLeft reaches 0
  useEffect(() => {
    if (mode !== 'lightning' || !started || finished || timeLeft > 0) return;
    setFinished(true);
    const finalScore = scoreRef.current;
    const earned = Math.max(1, Math.min(5, Math.ceil(finalScore / 3)));
    playToneEffect('fanfare', soundRef.current);
    onCompleteLightningRef.current(finalScore, earned);
  }, [mode, started, finished, timeLeft]);

  useEffect(() => {
    if (started && !finished && current) {
      speakText(current.spokenText, { lang: module.speechLang });
    }
  }, [started, finished, idx, current, module.speechLang]);

  // Fair 0.8s handicap for Parent in 180-degree tabletop duel so 8-year-old has a fair edge
  useEffect(() => {
    if (mode !== 'duel' || duelLayout !== 'tabletop180' || !started || finished || !fairHandicap) {
      setParentLocked(false);
      return;
    }
    setParentLocked(true);
    const timer = window.setTimeout(() => {
      setParentLocked(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [mode, duelLayout, started, finished, fairHandicap, idx]);

  const handleTurnAnswer = (optId: string) => {
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

  const handleTabletopAnswer = (who: 'child' | 'parent', optId: string) => {
    if (!current || finished || roundWinner) return;
    if (who === 'parent' && parentLocked) return;

    const isRight = optId === current.correctOptionId;
    if (!isRight) {
      playToneEffect('tryAgain', soundEffectsEnabled);
      return;
    }

    playToneEffect('success', soundEffectsEnabled);
    setRoundWinner(who);
    if (who === 'child') setP1Score((s) => s + 1);
    else setP2Score((s) => s + 1);

    if (tabletopTimerRef.current !== null) {
      clearTimeout(tabletopTimerRef.current);
    }
    tabletopTimerRef.current = window.setTimeout(() => {
      tabletopTimerRef.current = null;
      setRoundWinner(null);
      if (idx + 1 >= questions.length) {
        setFinished(true);
        playToneEffect('fanfare', soundEffectsEnabled);
        onCompleteDuel(4);
      } else {
        setIdx((i) => i + 1);
      }
    }, 750);
  };

  const handleRestart = () => {
    if (tabletopTimerRef.current !== null) {
      clearTimeout(tabletopTimerRef.current);
      tabletopTimerRef.current = null;
    }
    setSeed((s) => s + 41);
    setIdx(0);
    setTimeLeft(60);
    setScore(0);
    setP1Score(0);
    setP2Score(0);
    setRoundWinner(null);
    setFinished(false);
    setStarted(true);
  };

  const title = mode === 'lightning' ? 'Błyskawica (60s)' : 'Pojedynek z rodzicem';

  if (questions.length === 0 || !current) {
    return (
      <StorybookLessonShell title={title} module={module} onBackToMap={onBackToMap}>
        <div className="storybook-card rounded-[32px] p-8 text-center max-w-xl mx-auto">
          <p className="font-display text-xl font-bold text-[#3E2F2B]">
            Za mało haseł do tej gry!
          </p>
          <p className="mt-2 text-sm font-semibold text-[#6E5B4F]">
            Dodaj co najmniej 2 słówka w tym module, aby uruchomić Błyskawicę lub Pojedynek.
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
              : 'Połóż iPad na stole i zagraj z Rodzicem!'}
          </h2>
          <p className="mt-2 text-base text-[#6E5B4F] leading-relaxed">
            {mode === 'lightning'
              ? 'Słuchaj uważnie i stukaj obrazki jak najszybciej! Każda dobra odpowiedź to +1 punkt i gwiazdki na koniec.'
              : 'W trybie 180° siedzicie naprzeciwko siebie: górna połowa ekranu jest obrócona dla Rodzica, a dolna dla Córki! Kto pierwszy stuknie właściwy obrazek, zdobywa punkt!'}
          </p>

          {mode === 'duel' && (
            <div className="mt-5 space-y-3">
              <div className="inline-flex p-1 rounded-full bg-[#F5ECE0] border border-[#E7D8C5]">
                <button
                  type="button"
                  onClick={() => setDuelLayout('tabletop180')}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    duelLayout === 'tabletop180'
                      ? 'bg-white text-[#3E2F2B] shadow-sm'
                      : 'text-[#8A7465]'
                  }`}
                >
                  Przy stole (180°)
                </button>
                <button
                  type="button"
                  onClick={() => setDuelLayout('turns')}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    duelLayout === 'turns'
                      ? 'bg-white text-[#3E2F2B] shadow-sm'
                      : 'text-[#8A7465]'
                  }`}
                >
                  Na zmianę
                </button>
              </div>

              {duelLayout === 'tabletop180' && (
                <label className="flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-[#6E5B4F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fairHandicap}
                    onChange={(e) => setFairHandicap(e.target.checked)}
                    className="w-4 h-4 accent-[#55B373] rounded"
                  />
                  <ShieldCheck className="w-4 h-4 text-[#55B373]" aria-hidden="true" />
                  Wyrównanie szans (+0,8 s przewagi dla córki)
                </label>
              )}
            </div>
          )}

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

  // --- TRUE 180° TABLETOP SPLIT-SCREEN DUEL ---
  if (mode === 'duel' && duelLayout === 'tabletop180') {
    return (
      <div className="min-h-screen w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center gap-5">
        {/* TOP HALF: PARENT (Rotated 180 degrees for face-to-face iPad tabletop play) */}
        <section
          aria-label="Strefa Rodzica (obrócona 180 stopni)"
          className={`rotate-180 storybook-card rounded-[28px] p-4 sm:p-5 border-2 transition-colors ${
            roundWinner === 'parent'
              ? 'bg-[#EAF8EE] border-[#55B373]'
              : 'bg-[#F4F9FF] border-[#C7E0FA]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-display text-base font-bold text-[#2A5E9E]">
              Rodzic · {p2Score} pkt
            </span>
            <span className="font-display text-lg font-bold text-[#3E2F2B]">
              „{current.spokenText}”
            </span>
            <span className="text-xs font-bold text-[#5496E8]">
              {parentLocked ? 'Chwileczkę...' : 'Twój ruch!'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {current.options.map((opt) => (
              <button
                key={`parent-${opt.id}`}
                type="button"
                disabled={parentLocked || Boolean(roundWinner)}
                onClick={() => handleTabletopAnswer('parent', opt.id)}
                aria-label={`Rodzic wybiera: ${opt.label}`}
                className={`min-h-[116px] sm:min-h-[132px] rounded-[22px] border-[3px] p-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  roundWinner === 'parent' && opt.id === current.correctOptionId
                    ? 'border-[#55B373] bg-[#EAF8EE] scale-105'
                    : parentLocked
                      ? 'border-[#E2D8CC] bg-[#F7F3EE] opacity-60 cursor-wait'
                      : 'border-[#C7E0FA] bg-white hover:border-[#5496E8] active:scale-95'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] overflow-hidden flex items-center justify-center">
                  <ItemIllustration
                    kind={opt.illustration}
                    colorHex={opt.colorHex}
                    className="w-full h-full"
                    roundedClass="rounded-[12px]"
                  />
                </div>
                <span className="font-display text-xs font-bold text-[#3E2F2B] leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* CENTER SCORE & AUDIO RIBBON */}
        <div className="rounded-full bg-[#FFFDF8] border-2 border-[#EED9BD] shadow-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToMap}
            className="btn-puffy-white min-h-[40px] px-3.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Mapa
          </button>

          <div className="flex items-center gap-3 font-display text-sm font-bold text-[#3E2F2B] tabular-nums">
            <span className="px-3 py-1 rounded-full bg-[#FCE8EE] text-[#9D2A52]">
              Córka {p1Score}
            </span>
            <span className="text-xs text-[#8A7465]">
              Runda {idx + 1} / {questions.length}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#E5F2FE] text-[#2A5E9E]">
              Rodzic {p2Score}
            </span>
          </div>

          <button
            type="button"
            onClick={() => speakText(current.spokenText, { lang: module.speechLang })}
            className="btn-puffy-blue min-h-[40px] px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            Powtórz
          </button>
        </div>

        {/* BOTTOM HALF: CHILD (Normal 0 degrees) */}
        <section
          aria-label="Strefa Córki"
          className={`storybook-card rounded-[28px] p-4 sm:p-5 border-2 transition-colors ${
            roundWinner === 'child'
              ? 'bg-[#EAF8EE] border-[#55B373]'
              : 'bg-[#FFF6F8] border-[#F6C8D6]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-display text-base font-bold text-[#9D2A52]">
              Córka · {p1Score} pkt
            </span>
            <span className="font-display text-lg font-bold text-[#3E2F2B]">
              „{current.spokenText}”
            </span>
            <span className="text-xs font-bold text-[#D64988]">
              {roundWinner === 'child' ? 'Punkt dla Ciebie!' : 'Stuknij szybciej!'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {current.options.map((opt) => (
              <button
                key={`child-${opt.id}`}
                type="button"
                disabled={Boolean(roundWinner)}
                onClick={() => handleTabletopAnswer('child', opt.id)}
                aria-label={`Córka wybiera: ${opt.label}`}
                className={`min-h-[116px] sm:min-h-[132px] rounded-[22px] border-[3px] p-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  roundWinner === 'child' && opt.id === current.correctOptionId
                    ? 'border-[#55B373] bg-[#EAF8EE] scale-105'
                    : 'border-[#F6C8D6] bg-white hover:border-[#D64988] active:scale-95'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] overflow-hidden flex items-center justify-center">
                  <ItemIllustration
                    kind={opt.illustration}
                    colorHex={opt.colorHex}
                    className="w-full h-full"
                    roundedClass="rounded-[12px]"
                  />
                </div>
                <span className="font-display text-xs font-bold text-[#3E2F2B] leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // --- STANDARD LIGHTNING OR TURN-BASED DUEL ---
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
              onClick={() => handleTurnAnswer(opt.id)}
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
