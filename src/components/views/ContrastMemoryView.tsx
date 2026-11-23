import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Play, RotateCcw, XCircle } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { seededShuffle } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { STORYBOOK_ART } from '../../data/storybookArt';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { MascotAvatar } from '../storybook/MascotAvatar';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface ContrastMemoryViewProps {
  module: LessonModule;
  initialSubMode?: 'sorting' | 'memory';
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteGame: (starsEarned: number, mapStars: number) => void;
}

interface MemoryCard {
  uid: string;
  pairId: string;
  word: string;
  translation: string;
  illustration: LessonModule['vocabulary'][number]['illustration'];
  colorHex?: string;
}

export const ContrastMemoryView: React.FC<ContrastMemoryViewProps> = ({
  module,
  initialSubMode,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteGame,
}) => {
  const hasSorting = Boolean(module.sortingGame && module.sortingGame.items.length > 0);
  const [subMode, setSubMode] = useState<'sorting' | 'memory'>(
    initialSubMode === 'memory' ? 'memory' : hasSorting ? 'sorting' : 'memory'
  );

  // --- Sorting state ---
  const sortingItems = useMemo(
    () => (module.sortingGame ? seededShuffle(module.sortingGame.items, 33) : []),
    [module.sortingGame]
  );
  const [sortIdx, setSortIdx] = useState(0);
  const [sortCorrect, setSortCorrect] = useState(0);
  const [sortFeedback, setSortFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sortDone, setSortDone] = useState(false);

  // --- Memory state ---
  const [memSeed, setMemSeed] = useState(71);
  const memoryDeck = useMemo<MemoryCard[]>(() => {
    const picked = seededShuffle(module.vocabulary, memSeed).slice(0, 6);
    const pairs: MemoryCard[] = picked.flatMap((v) => [
      {
        uid: `${v.id}-a`,
        pairId: v.id,
        word: v.word,
        translation: v.translation,
        illustration: v.illustration,
        colorHex: v.defaultColor,
      },
      {
        uid: `${v.id}-b`,
        pairId: v.id,
        word: v.word,
        translation: v.translation,
        illustration: v.illustration,
        colorHex: v.defaultColor,
      },
    ]);
    return seededShuffle(pairs, memSeed + 11);
  }, [module.vocabulary, memSeed]);

  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [lockBoard, setLockBoard] = useState(false);
  const sortTimerRef = useRef<number | null>(null);
  const memTimerRef = useRef<number | null>(null);

  const clearPendingTimers = () => {
    if (sortTimerRef.current !== null) {
      clearTimeout(sortTimerRef.current);
      sortTimerRef.current = null;
    }
    if (memTimerRef.current !== null) {
      clearTimeout(memTimerRef.current);
      memTimerRef.current = null;
    }
  };

  useEffect(() => {
    return clearPendingTimers;
  }, []);

  useEffect(() => {
    clearPendingTimers();
    setLockBoard(false);
  }, [subMode]);

  const currentSortItem = sortingItems[sortIdx];

  const handleSortChoice = (bucketId: string) => {
    if (!currentSortItem || sortDone || !module.sortingGame || sortFeedback !== null) return;
    const isCorrect = currentSortItem.bucketId === bucketId;
    const nextCorrect = isCorrect ? sortCorrect + 1 : sortCorrect;
    if (isCorrect) {
      playToneEffect('success', soundEffectsEnabled);
      setSortCorrect(nextCorrect);
      speakText(currentSortItem.spokenHint, { lang: module.speechLang, rate: speechRate });
      setSortFeedback({ ok: true, text: `Super! ${currentSortItem.spokenHint}` });
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
      const rightBucket = module.sortingGame.buckets.find((b) => b.id === currentSortItem.bucketId);
      setSortFeedback({
        ok: false,
        text: `„${currentSortItem.word}” pasuje do: ${rightBucket?.label ?? ''}!`,
      });
    }

    if (sortTimerRef.current !== null) clearTimeout(sortTimerRef.current);
    sortTimerRef.current = window.setTimeout(() => {
      sortTimerRef.current = null;
      if (sortIdx + 1 >= sortingItems.length) {
        const ratio = nextCorrect / sortingItems.length;
        const mapStars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
        playToneEffect('fanfare', soundEffectsEnabled);
        onCompleteGame(mapStars + 1, mapStars);
        setSortDone(true);
      } else {
        setSortIdx((i) => i + 1);
        setSortFeedback(null);
      }
    }, 950);
  };

  const handleFlipCard = (card: MemoryCard) => {
    if (lockBoard) return;
    if (flippedUids.includes(card.uid) || matchedPairIds.includes(card.pairId)) return;

    playToneEffect('tap', soundEffectsEnabled);
    speakText(card.word, { lang: module.speechLang, rate: speechRate });

    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = memoryDeck.find((c) => c.uid === nextFlipped[0]);
      if (firstCard && firstCard.pairId === card.pairId) {
        playToneEffect('success', soundEffectsEnabled);
        const nextMatched = [...matchedPairIds, card.pairId];
        setMatchedPairIds(nextMatched);
        setFlippedUids([]);
        if (nextMatched.length === memoryDeck.length / 2) {
          playToneEffect('fanfare', soundEffectsEnabled);
          onCompleteGame(4, 3);
        }
      } else {
        setLockBoard(true);
        if (memTimerRef.current !== null) clearTimeout(memTimerRef.current);
        memTimerRef.current = window.setTimeout(() => {
          memTimerRef.current = null;
          setFlippedUids([]);
          setLockBoard(false);
        }, 850);
      }
    }
  };

  const memoryWon = memoryDeck.length > 0 && matchedPairIds.length === memoryDeck.length / 2;

  return (
    <StorybookLessonShell
      title={subMode === 'sorting' ? 'Pory roku i kontrasty' : 'Audio Memory'}
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={subMode === 'sorting' && !sortDone ? sortingItems.length : undefined}
      currentStepIndex={subMode === 'sorting' && !sortDone ? sortIdx : undefined}
      rightSlot={
        hasSorting ? (
          <div className="inline-flex p-1 rounded-full bg-[#F5ECE0] border border-[#E7D8C5]">
            <button
              type="button"
              onClick={() => setSubMode('sorting')}
              className={`min-h-[44px] px-3.5 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                subMode === 'sorting'
                  ? 'bg-white text-[#3E2F2B] shadow-sm'
                  : 'text-[#755F51] hover:text-[#3E2F2B]'
              }`}
            >
              Pory roku
            </button>
            <button
              type="button"
              onClick={() => setSubMode('memory')}
              className={`min-h-[44px] px-3.5 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                subMode === 'memory'
                  ? 'bg-white text-[#3E2F2B] shadow-sm'
                  : 'text-[#755F51] hover:text-[#3E2F2B]'
              }`}
            >
              Audio Memory
            </button>
          </div>
        ) : undefined
      }
    >
      {subMode === 'sorting' && module.sortingGame ? (
        sortDone ? (
          <StorybookCelebrationCard
            title="Brawo! Pory roku opanowane!"
            subtitle={
              <>
                Poprawnie dopasowane karty: <strong>{sortCorrect} z {sortingItems.length}</strong>! Zdobywasz gwiazdki i naklejkę!
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
                  onClick={() => {
                    setSortIdx(0);
                    setSortCorrect(0);
                    setSortFeedback(null);
                    setSortDone(false);
                  }}
                  className="btn-puffy-white min-h-[50px] px-5 rounded-full font-display font-bold inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Zagraj ponownie
                </button>
                <button
                  type="button"
                  onClick={() => setSubMode('memory')}
                  className="btn-puffy-blue min-h-[50px] px-5 rounded-full font-display font-bold"
                >
                  Audio Memory
                </button>
              </>
            }
          />
        ) : (
          <div className="space-y-5">
            <div className="storybook-card rounded-[30px] p-6 sm:p-8 text-center">
              <p className="text-xs font-bold text-[#755F51] tabular-nums">
                Karta {sortIdx + 1} / {sortingItems.length} · Wynik: {sortCorrect}
              </p>
              <p className="mt-1 text-base font-bold text-[#6E5B4F]">
                {module.sortingGame.instructionPl}
              </p>

              <div className="mt-5 mx-auto w-36 h-36 sm:w-40 sm:h-40 rounded-[28px] watercolor-frame border-2 border-[#EED9BD] shadow-sm overflow-hidden flex items-center justify-center">
                <ItemIllustration
                  kind={currentSortItem.illustration}
                  className="w-full h-full"
                  roundedClass="rounded-[26px]"
                />
              </div>

              <h2 className="mt-4 font-display text-3xl font-bold text-[#3E2F2B]">
                {currentSortItem.word}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#755F51]">
                {currentSortItem.translation}
              </p>

              <button
                type="button"
                onClick={() =>
                  speakText(currentSortItem.word, { lang: module.speechLang, rate: speechRate })
                }
                className="mt-4 btn-puffy-blue min-h-[46px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                Posłuchaj słówka
              </button>
            </div>

            {sortFeedback && (
              <div
                className={`rounded-2xl border-2 p-4 flex items-center justify-center gap-2.5 text-sm font-bold ${
                  sortFeedback.ok
                    ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                    : 'bg-[#FFF0F3] border-[#F6B8CE] text-[#9D2A52]'
                }`}
              >
                {sortFeedback.ok ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
                <span>{sortFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {module.sortingGame.buckets.map((bucket) => (
                <button
                  key={bucket.id}
                  type="button"
                  disabled={sortFeedback !== null}
                  onClick={() => handleSortChoice(bucket.id)}
                  className="storybook-card min-h-[136px] rounded-[28px] hover:border-[#5496E8] hover:-translate-y-0.5 p-5 flex items-center gap-5 text-left active:scale-[0.98] transition-all"
                >
                  <div className="w-24 h-24 rounded-[22px] watercolor-frame border-2 border-[#EFE0CC] overflow-hidden shrink-0 flex items-center justify-center">
                    <ItemIllustration
                      kind={bucket.illustration}
                      className="w-full h-full"
                      roundedClass="rounded-[20px]"
                    />
                  </div>
                  <div>
                    <span className="font-display text-2xl font-bold text-[#3E2F2B] block">
                      {bucket.label}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-[#786356] block">
                      {bucket.sublabelPl}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        /* Audio Memory Mode */
        <div className="space-y-5">
          <div className="storybook-card rounded-[26px] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#3E2F2B]">Audio Memory</h2>
              <p className="text-xs font-semibold text-[#755F51]">
                Odkrywaj po dwie karty — każda karta wypowiada swoje słówko na głos!
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-[#6E5B4F] tabular-nums">
              <span>Pary: {matchedPairIds.length} / {memoryDeck.length / 2}</span>
              <span>Ruchy: {moves}</span>
              <button
                type="button"
                onClick={() => {
                  setMemSeed((s) => s + 29);
                  setFlippedUids([]);
                  setMatchedPairIds([]);
                  setMoves(0);
                  setLockBoard(false);
                }}
                className="btn-puffy-white min-h-[44px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Nowe karty
              </button>
            </div>
          </div>

          {memoryWon && (
            <div className="rounded-[26px] bg-[#EAF8EE] border-2 border-[#A7E3B9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MascotAvatar
                  size="sm"
                  equippedAccessories={equippedAccessories}
                  mood="cheer"
                />
                <p className="font-bold text-[#226B3B]">
                  Znakomicie! Znalazłaś wszystkie pary w {moves} ruchach (+4 gwiazdki)!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMemSeed((s) => s + 29);
                  setFlippedUids([]);
                  setMatchedPairIds([]);
                  setMoves(0);
                }}
                className="btn-puffy-green min-h-[46px] px-5 rounded-full font-display text-sm font-bold whitespace-nowrap"
              >
                Zagraj z innymi słówkami
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
            {memoryDeck.map((card, i) => {
              const isMatched = matchedPairIds.includes(card.pairId);
              const isFlipped = isMatched || flippedUids.includes(card.uid);
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleFlipCard(card)}
                  aria-label={
                    isFlipped ? `Odkryta karta: ${card.word}` : `Zakryta karta numer ${i + 1}`
                  }
                  className={`min-h-[144px] sm:min-h-[164px] rounded-[26px] border-[3px] overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isMatched
                      ? 'bg-[#EAF8EE] border-[#55B373] p-2.5 shadow-sm'
                      : isFlipped
                        ? 'bg-[#FFF8EE] border-[#5496E8] p-2.5 ring-4 ring-[#BFDBFE]/60'
                        : 'bg-[#FFF8EE] border-[#D9C2A3] hover:border-[#5496E8] hover:-translate-y-0.5 active:scale-[0.97] shadow-[0_5px_0_#D8C0A2]'
                  }`}
                >
                  {isFlipped ? (
                    <>
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[18px] overflow-hidden flex items-center justify-center">
                        <ItemIllustration
                          kind={card.illustration}
                          colorHex={card.colorHex}
                          className="w-full h-full"
                          roundedClass="rounded-[16px]"
                        />
                      </div>
                      <span className="mt-1.5 font-display text-sm sm:text-base font-bold text-[#3E2F2B] leading-tight">
                        {card.word}
                      </span>
                    </>
                  ) : (
                    <div className="relative w-full h-full min-h-[138px] sm:min-h-[158px] overflow-hidden flex items-center justify-center bg-[#FFF8EE]">
                      <img
                        src={STORYBOOK_ART.memoryCardBack}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover scale-[1.16] pointer-events-none"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </StorybookLessonShell>
  );
};
