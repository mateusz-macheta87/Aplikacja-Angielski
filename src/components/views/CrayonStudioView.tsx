import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Palette,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { buildWearingSentence, evaluateCrayonAction } from '../../engine/gameEngine';
import { playToneEffect, speakText } from '../../engine/audioEngine';
import { DressUpCharacter, GarmentPart } from '../illustrations/DressUpCharacter';
import { ItemIllustration } from '../illustrations/ItemIllustration';
import { StorybookCelebrationCard } from '../storybook/StorybookCelebrationCard';
import { StorybookLessonShell } from '../storybook/StorybookLessonShell';

interface CrayonStudioViewProps {
  module: LessonModule;
  equippedAccessories: string[];
  soundEffectsEnabled: boolean;
  speechRate: 'normal' | 'slow';
  onBackToMap: () => void;
  onCompleteSession: (starsEarned: number, mapStars: number) => void;
}

const CRAYONS = [
  { name: 'red', labelPl: 'czerwony', hex: '#EF4444' },
  { name: 'blue', labelPl: 'niebieski', hex: '#2563EB' },
  { name: 'yellow', labelPl: 'żółty', hex: '#EAB308' },
  { name: 'green', labelPl: 'zielony', hex: '#16A34A' },
  { name: 'purple', labelPl: 'fioletowy', hex: '#9333EA' },
  { name: 'pink', labelPl: 'różowy', hex: '#EC4899' },
  { name: 'orange', labelPl: 'pomarańczowy', hex: '#F97316' },
  { name: 'black', labelPl: 'czarny', hex: '#1E293B' },
];

const PLURAL_PARTS = new Set<GarmentPart>(['shorts', 'trousers', 'shoes']);

export const CrayonStudioView: React.FC<CrayonStudioViewProps> = ({
  module,
  equippedAccessories,
  soundEffectsEnabled,
  speechRate,
  onBackToMap,
  onCompleteSession,
}) => {
  const challenges = module.crayonChallenges;
  const [mode, setMode] = useState<'challenge' | 'sandbox'>('challenge');
  const [idx, setIdx] = useState(0);
  const [selectedCrayon, setSelectedCrayon] = useState(CRAYONS[4]); // purple default
  const [partColors, setPartColors] = useState<Partial<Record<GarmentPart, string>>>({});
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'hint'; text: string } | null>(null);
  const [solvedCurrent, setSolvedCurrent] = useState(false);
  const [completedAll, setCompletedAll] = useState(false);
  const [sandboxOutfit, setSandboxOutfit] = useState<'casual' | 'winter' | 'skirt'>('casual');
  const [sandboxSentence, setSandboxSentence] = useState<string>(
    'Wybierz kredkę i kliknij dowolne ubranie Pana Chrząszcza!'
  );

  const currentChallenge = challenges[idx];

  useEffect(() => {
    if (mode === 'challenge' && currentChallenge && !completedAll) {
      speakText(currentChallenge.sentence, {
        lang: module.speechLang,
        rate: speechRate,
      });
    }
  }, [idx, mode, completedAll, currentChallenge, module.speechLang, speechRate]);

  if (challenges.length === 0) {
    return (
      <StorybookLessonShell title="Ubieranka — Kredki" module={module} onBackToMap={onBackToMap}>
        <div className="storybook-card rounded-[28px] p-8 text-center">
          <p className="font-semibold text-[#6E5B4F]">
            Ubieranka z kredkami jest dostępna w module „Unit 1: Mr Beetle&apos;s New Clothes”.
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

  const handleTapGarment = (part: GarmentPart) => {
    if (mode === 'sandbox') {
      playToneEffect('paint', soundEffectsEnabled);
      setPartColors((prev) => ({ ...prev, [part]: selectedCrayon.hex }));
      const word = part === 'tshirt' ? 'T-shirt' : part;
      const sentence = buildWearingSentence(word, selectedCrayon.name, PLURAL_PARTS.has(part));
      setSandboxSentence(sentence);
      speakText(sentence, { lang: module.speechLang, rate: speechRate });
      return;
    }

    if (!currentChallenge || solvedCurrent) return;

    const evalRes = evaluateCrayonAction(currentChallenge, part, selectedCrayon.name);
    if (evalRes.status === 'correct') {
      playToneEffect('success', soundEffectsEnabled);
      setPartColors((prev) => ({ ...prev, [part]: selectedCrayon.hex }));
      setFeedback({ kind: 'success', text: evalRes.feedbackPl });
      setSolvedCurrent(true);
      speakText(currentChallenge.sentence, { lang: module.speechLang, rate: speechRate });
    } else {
      playToneEffect('tryAgain', soundEffectsEnabled);
      setFeedback({ kind: 'hint', text: evalRes.feedbackPl });
    }
  };

  const handleNextChallenge = () => {
    if (idx + 1 >= challenges.length) {
      playToneEffect('fanfare', soundEffectsEnabled);
      onCompleteSession(4, 3);
      setCompletedAll(true);
    } else {
      setIdx((i) => i + 1);
      setPartColors({});
      setFeedback(null);
      setSolvedCurrent(false);
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setPartColors({});
    setFeedback(null);
    setSolvedCurrent(false);
    setCompletedAll(false);
  };

  return (
    <StorybookLessonShell
      title="Ubieranka — Kredki"
      module={module}
      onBackToMap={onBackToMap}
      totalSteps={mode === 'challenge' && !completedAll ? challenges.length : undefined}
      currentStepIndex={mode === 'challenge' && !completedAll ? idx : undefined}
      rightSlot={
        <div className="inline-flex p-1 rounded-full bg-[#F5ECE0] border border-[#E7D8C5]">
          <button
            type="button"
            onClick={() => {
              setMode('challenge');
              setPartColors({});
              setFeedback(null);
              setSolvedCurrent(false);
            }}
            className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              mode === 'challenge'
                ? 'bg-white text-[#3E2F2B] shadow-sm'
                : 'text-[#8A7465] hover:text-[#3E2F2B]'
            }`}
          >
            Zadania
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('sandbox');
              setPartColors({});
              setFeedback(null);
            }}
            className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              mode === 'sandbox'
                ? 'bg-white text-[#3E2F2B] shadow-sm'
                : 'text-[#8A7465] hover:text-[#3E2F2B]'
            }`}
          >
            Swobodne
          </button>
        </div>
      }
    >
      {completedAll && mode === 'challenge' ? (
        <StorybookCelebrationCard
          title="Mistrzyni Kredek i Ubrań!"
          subtitle={`Pokolorowałaś wszystkie ${challenges.length} strojów Pana Chrząszcza bezbłędnie (+4 gwiazdki i naklejka!). Kredki na sprawdzianie będą pestką!`}
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
                className="btn-puffy-white min-h-[50px] px-5 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Zagraj ponownie
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('sandbox');
                  setCompletedAll(false);
                  setPartColors({});
                }}
                className="btn-puffy-amber min-h-[50px] px-5 rounded-full font-display font-bold inline-flex items-center gap-2"
              >
                <Palette className="w-4 h-4" aria-hidden="true" />
                Koloruj dowolnie
              </button>
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Stage: Interactive Character Canvas */}
          <section className="lg:col-span-6 storybook-card rounded-[30px] p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-[#8A7465]">
                {mode === 'challenge'
                  ? `Zadanie ${idx + 1} z ${challenges.length} · Stuknij lub zamaluj palcem`
                  : 'Tryb swobodny · Stuknij lub zamaluj palcem'}
              </p>
              {mode === 'sandbox' && (
                <div className="flex gap-1.5">
                  {(['casual', 'winter', 'skirt'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => {
                        setSandboxOutfit(o);
                        setPartColors({});
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sandboxOutfit === o
                          ? 'bg-[#5496E8] text-white'
                          : 'bg-[#FAF3E8] text-[#786356]'
                      }`}
                    >
                      {o === 'casual' ? 'Lato' : o === 'winter' ? 'Zima' : 'Spódniczka'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DressUpCharacter
              outfitMode={mode === 'challenge' ? currentChallenge.outfitMode : sandboxOutfit}
              partColors={partColors}
              onTapPart={handleTapGarment}
              highlightedPart={solvedCurrent ? currentChallenge.targetPart : null}
              activeCrayonHex={selectedCrayon.hex}
              onScribbleStroke={() => playToneEffect('scribble', soundEffectsEnabled)}
            />
          </section>

          {/* Right Control Deck: Prompt + Crayon Box */}
          <section className="lg:col-span-6 space-y-5">
            {mode === 'challenge' ? (
              <div className="storybook-card rounded-[30px] p-6">
                <p className="text-xs font-bold text-[#8A7465]">
                  Posłuchaj polecenia i pokoloruj odpowiednie ubranie
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#3E2F2B]">
                  „{currentChallenge.sentence}”
                </h2>
                <p className="mt-1.5 text-sm font-semibold text-[#786356]">
                  {currentChallenge.translationPl}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    speakText(currentChallenge.sentence, {
                      lang: module.speechLang,
                      rate: speechRate,
                    })
                  }
                  className="mt-4 btn-puffy-blue min-h-[48px] px-6 rounded-full font-display text-base font-bold inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  Posłuchaj
                </button>
              </div>
            ) : (
              <div className="storybook-card rounded-[30px] p-6">
                <p className="text-xs font-bold text-[#8A7465]">
                  Twoje zdanie po angielsku
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#4178BF]">
                  {sandboxSentence}
                </h2>
                <button
                  type="button"
                  onClick={() => setPartColors({})}
                  className="mt-4 btn-puffy-white min-h-[44px] px-5 rounded-full text-sm font-bold"
                >
                  Wyczyść kolory
                </button>
              </div>
            )}

            {/* Crayon Tray */}
            <div className="storybook-card rounded-[30px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-lg font-bold text-[#3E2F2B]">
                  1. Wybierz kredkę
                </h3>
                <span className="text-xs font-bold text-[#786356] px-3 py-1 rounded-full bg-[#FAF3E8]">
                  Wybrana: {selectedCrayon.name} ({selectedCrayon.labelPl})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CRAYONS.map((crayon) => {
                  const active = selectedCrayon.name === crayon.name;
                  return (
                    <button
                      key={crayon.name}
                      type="button"
                      onClick={() => {
                        playToneEffect('tap', soundEffectsEnabled);
                        setSelectedCrayon(crayon);
                        speakText(crayon.name, { lang: 'en-GB', rate: speechRate });
                      }}
                      aria-pressed={active}
                      className={`min-h-[98px] rounded-[22px] border-2 px-1.5 py-2.5 flex flex-col items-center justify-center gap-1 transition-all text-center overflow-hidden ${
                        active
                          ? 'border-[#5496E8] bg-[#EEF6FF] ring-4 ring-[#BFDBFE]/65 -translate-y-0.5 shadow-sm'
                          : 'border-[#EFE2D2] bg-[#FFFDF8] hover:border-[#D9BC9A]'
                      }`}
                    >
                      <ItemIllustration
                        kind="colour-swatch"
                        colorHex={crayon.hex}
                        className="w-12 h-12 shrink-0"
                      />
                      <div className="w-full min-w-0">
                        <span className="block font-display text-sm font-bold text-[#3E2F2B] leading-tight">
                          {crayon.name}
                        </span>
                        <span className="block text-[10.5px] font-semibold text-[#8A7465] leading-tight mt-0.5">
                          {crayon.labelPl}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs font-semibold text-[#8A7465]">
                2. Teraz stuknij odpowiednie ubranie na Panu Chrząszczu po lewej!
              </p>
            </div>

            {/* Live Feedback */}
            {feedback && (
              <div
                className={`rounded-[24px] border-2 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  feedback.kind === 'success'
                    ? 'bg-[#EAF8EE] border-[#A7E3B9] text-[#226B3B]'
                    : 'bg-[#FEF7DC] border-[#F3DFA2] text-[#784A14]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {feedback.kind === 'success' && (
                    <CheckCircle2 className="w-6 h-6 text-[#3E965A] shrink-0" aria-hidden="true" />
                  )}
                  <p className="text-sm font-bold">{feedback.text}</p>
                </div>

                {solvedCurrent && (
                  <button
                    type="button"
                    onClick={handleNextChallenge}
                    className="btn-puffy-green min-h-[48px] px-6 rounded-full font-display text-sm font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {idx + 1 >= challenges.length ? 'Odbierz gwiazdki!' : 'Następne ubranie'}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </StorybookLessonShell>
  );
};
