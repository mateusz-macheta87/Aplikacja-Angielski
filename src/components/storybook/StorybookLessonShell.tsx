import React, { useState } from 'react';
import { ArrowLeft, BookMarked, Volume2, X } from 'lucide-react';
import { LessonModule } from '../../types/curriculum';
import { speakText } from '../../engine/audioEngine';
import { ItemIllustration } from '../illustrations/ItemIllustration';

interface StorybookLessonShellProps {
  title: string;
  module: LessonModule;
  onBackToMap: () => void;
  totalSteps?: number;
  currentStepIndex?: number; // 0-based
  showCheatSheetButton?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const StorybookLessonShell: React.FC<StorybookLessonShellProps> = ({
  title,
  module,
  onBackToMap,
  totalSteps,
  currentStepIndex,
  showCheatSheetButton = true,
  rightSlot,
  children,
}) => {
  const [cheatOpen, setCheatOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-14">
      {/* Focused Child Header — matching warm fairy-tale reference */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="btn-puffy-white min-h-[46px] px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Mapa
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2F2B]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {rightSlot}

          {showCheatSheetButton && (
            <button
              type="button"
              onClick={() => setCheatOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#FEF3C7] border-2 border-[#F5D07B] text-[#784A14] text-sm font-bold hover:bg-[#FDE68A] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <BookMarked className="w-4 h-4" aria-hidden="true" />
              Ściągawka
            </button>
          )}

          {typeof totalSteps === 'number' && totalSteps > 0 && typeof currentStepIndex === 'number' && (
            <div className="flex items-center gap-1.5" aria-label={`Krok ${currentStepIndex + 1} z ${totalSteps}`}>
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isCurrent = i === currentStepIndex;
                const isDone = i < currentStepIndex;
                return (
                  <span
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full transition-colors ${
                      isCurrent
                        ? 'bg-[#5496E8] ring-2 ring-[#BFDBFE]'
                        : isDone
                          ? 'bg-[#55B373]'
                          : 'bg-white border-2 border-[#C7D8EE]'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </header>

      {children}

      {/* Visual Cheat Sheet Modal ("Ściągawka") */}
      {cheatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E2F2B]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cheatsheet-title"
        >
          <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-[28px] bg-[#FFFDF8] border-2 border-[#F0DFC8] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F2E7D8]">
              <div>
                <h2 id="cheatsheet-title" className="font-display text-2xl font-bold text-[#3E2F2B]">
                  Ściągawka Iskierki
                </h2>
                <p className="text-xs font-semibold text-[#8A7465]">{module.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheatOpen(false)}
                aria-label="Zamknij ściągawkę"
                className="min-h-[42px] min-w-[42px] rounded-full bg-[#F5ECE0] text-[#3E2F2B] flex items-center justify-center hover:bg-[#EBDCC8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {module.speechLang.startsWith('en') && (
              <div className="mt-4 space-y-3 rounded-2xl bg-[#FEF7DC] border border-[#F3DFA2] p-4 text-sm text-[#5C4118]">
                <p className="font-bold">Złote zasady na sprawdzian:</p>
                <ul className="space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Jedno ubranie → z „a”:</strong> I&apos;m wearing <strong>a</strong> red coat / <strong>a</strong> yellow jumper / <strong>a</strong> green cap / <strong>a</strong> pink skirt.
                  </li>
                  <li>
                    <strong>Liczba mnoga → bez „a”:</strong> I&apos;m wearing purple <strong>shorts</strong> / blue <strong>trousers</strong> / black <strong>shoes</strong> / <strong>pyjamas</strong>.
                  </li>
                  <li>
                    <strong>Pytanie o pogodę:</strong> What&apos;s the weather like today? → <strong>It&apos;s sunny / cloudy / rainy / snowy.</strong>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {module.vocabulary.slice(0, 18).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => speakText(v.word, { lang: module.speechLang })}
                  className="min-h-[54px] px-3 py-2 rounded-2xl bg-[#FFFDF9] border-2 border-[#EFE2D2] hover:border-[#5496E8] flex items-center justify-between gap-2.5 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ItemIllustration
                      kind={v.illustration}
                      colorHex={v.defaultColor}
                      className="w-10 h-10 border border-[#EFE0CC]"
                      roundedClass="rounded-xl"
                    />
                    <span className="min-w-0 truncate">
                      <strong className="text-[#3E2F2B]">{v.word}</strong>{' '}
                      <span className="text-xs text-[#8A7465]">— {v.translation}</span>
                    </span>
                  </div>
                  <Volume2 className="w-4 h-4 text-[#5496E8] shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCheatOpen(false)}
              className="mt-5 w-full btn-puffy-green min-h-[48px] rounded-full font-display text-base font-bold"
            >
              Wróć do zadania!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
