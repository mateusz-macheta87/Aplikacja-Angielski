import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Delete, Play, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { checkSpellingAnswer, seededShuffle } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface ListenWriteViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onComplete: (starsEarned: number, mapStars: number, masteredIds: string[]) => void;
}

export const ListenWriteView: React.FC<ListenWriteViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onComplete,
}) => {
  const [seed, setSeed] = useState(55);
  const words = useMemo(() => {
    const clean = module.vocabulary.filter((v) => v.word.length <= 12 && !v.word.includes('='));
    return seededShuffle(clean.length >= 4 ? clean : module.vocabulary, seed).slice(0, 6);
  }, [module.vocabulary, seed]);

  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mastered, setMastered] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const current = words[idx];

  const letterTiles = useMemo(() => {
    if (!current) return [];
    const chars = current.word.replace(/[\s-]/g, '').split('');
    return seededShuffle(
      chars.map((ch, i) => ({ uid: `${current.id}-${i}`, ch })),
      seed + idx * 19
    );
  }, [current, idx, seed]);

  useEffect(() => {
    if (!finished && current) {
      speakText(current.word, { lang: module.speechLang, rate: speechRate });
    }
  }, [idx, seed, finished, current, module.speechLang, speechRate]);

  if (!current) return null;

  const isCorrect = checked && checkSpellingAnswer(typed, current.word);

  const handleCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!typed.trim() || checked) return;
    setChecked(true);
    if (checkSpellingAnswer(typed, current.word)) {
      playToneEffect('success', soundEffectsEnabled);
      setCorrectCount((c) => c + 1);
      setMastered((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= words.length) {
      const ratio = correctCount / words.length;
      const mapStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
      playToneEffect('fanfare', soundEffectsEnabled);
      onComplete(mapStars + 1, mapStars, mastered);
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setTyped('');
      setChecked(false);
    }
  };

  if (finished) {
    const ratio = correctCount / words.length;
    const mapStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    return (
      <StorybookLessonShell title="Dyktando (Listen & write)" module={module} onBackToMap={onBackToMap}>
        <StorybookCelebrationCard
          title="Mistrzyni pisania!"
          subtitle={
            <>
              Poprawnie zapisane słówka: <strong>{correctCount} z {words.length}</strong> (+{mapStars + 1} gwiazdek)!
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
                Wróć na mapę
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeed((s) => s + 17);
                  setIdx(0);
                  setTyped('');
                  setChecked(false);
                  setCorrectCount(0);
                  setMastered([]);
                  setFinished(false);
                }}
                className="btn-puffy-white min-h-[50px] px-6 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Nowe dyktando
              </button>
            </>
          }
        />
      </StorybookLessonShell>
    );
  }

  return (
    <StorybookLessonShell
      title="Dyktando (Listen & write)"
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={words.length}
      currentStepIndex={idx}
    >
      <section className="storybook-card rounded-[30px] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-[#55B373] text-white font-display text-lg font-bold flex items-center justify-center shrink-0">
            {idx + 1}
          </span>
          <p className="font-display text-lg sm:text-xl font-bold text-[#3E2F2B]">
            Posłuchaj i napisz słówko (albo ułóż z literek poniżej).
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="w-32 h-32 rounded-[26px] watercolor-frame border-2 border-[#EED9BD] shadow-sm overflow-hidden flex items-center justify-center">
            <ItemIllustration
              kind={current.illustration}
              colorHex={current.defaultColor}
              className="w-full h-full"
              roundedClass="rounded-[24px]"
            />
          </div>
          <p className="mt-2 text-sm font-bold text-[#755F51]">{current.translation}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => speakText(current.word, { lang: module.speechLang, rate: 'normal' })}
              className="btn-puffy-blue min-h-[50px] px-6 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              Posłuchaj
            </button>
            <button
              type="button"
              onClick={() => speakText(current.word, { lang: module.speechLang, rate: 'slow' })}
              className="btn-puffy-white min-h-[50px] px-5 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-[#2F6DB5]" aria-hidden="true" />
              Wolniej
            </button>
          </div>
        </div>

        {/* Input box (works with iPad Apple Pencil Scribble / keyboard) */}
        <form onSubmit={handleCheck} className="mt-6 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              aria-label="Wpisz usłyszane słówko"
              disabled={checked}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Wpisz słówko lub kliknij literki…"
              className="flex-1 min-h-[56px] rounded-2xl border-2 border-[#E5D7C6] bg-[#FFFDF9] px-4 text-center font-display text-2xl font-bold text-[#3E2F2B] tracking-wide focus:border-[#5496E8] focus:outline-none"
            />
            {!checked && typed.length > 0 && (
              <button
                type="button"
                onClick={() => setTyped((s) => s.slice(0, -1))}
                aria-label="Usuń ostatnią literę"
                className="btn-puffy-white min-h-[56px] min-w-[56px] rounded-2xl flex items-center justify-center"
              >
                <Delete className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Playful tactile letter tiles for effortless iPad tapping */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {letterTiles.map((tile) => (
              <button
                key={tile.uid}
                type="button"
                disabled={checked}
                onClick={() => {
                  playToneEffect('tap', soundEffectsEnabled);
                  setTyped((s) => s + tile.ch);
                }}
                className="btn-puffy-white min-h-[48px] min-w-[48px] px-3 rounded-2xl font-display text-xl font-bold text-[#3E2F2B]"
              >
                {tile.ch}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            {checked && (
              <div
                className={`px-4 py-2.5 rounded-2xl border-2 text-sm font-bold inline-flex items-center gap-2 ${
                  isCorrect
                    ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                    : 'bg-[#FFF0F3] border-[#F6B8CE] text-[#9D2A52]'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    Brawo! Poprawna pisownia: „{current.word}”!
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                    Poprawna pisownia to: „{current.word}”. Zapamiętaj!
                  </>
                )}
              </div>
            )}

            {!checked ? (
              <button
                type="submit"
                disabled={!typed.trim()}
                className={`min-h-[54px] min-w-[180px] px-8 rounded-full font-display text-lg font-bold ${
                  typed.trim()
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
                className="btn-puffy-green min-h-[54px] min-w-[190px] px-8 rounded-full font-display text-lg font-bold"
              >
                {idx + 1 >= words.length ? 'Odbierz gwiazdki!' : 'Następne słówko →'}
              </button>
            )}
          </div>
        </form>
      </section>
    </StorybookLessonShell>
  );
};
