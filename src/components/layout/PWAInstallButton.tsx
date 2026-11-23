import React, { useState } from 'react';
import { Download, Share, Tablet, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        Zainstaluj aplikację
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
      >
        <Tablet className="w-4 h-4 text-blue-600" aria-hidden="true" />
        {isIOS ? 'Dodaj na ekran iPada' : 'Jak zainstalować na iPadzie'}
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ipad-install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <h3 id="ipad-install-title" className="font-display text-xl font-bold text-slate-900">
                Uruchom LingoPlay jak aplikację na iPadzie
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Zamknij instrukcję instalacji"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
              <li className="flex gap-3">
                <span className="font-display font-bold text-blue-600">1.</span>
                <span>
                  Otwórz ten adres w przeglądarce <strong>Safari</strong> na iPadzie.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-blue-600">2.</span>
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  Stuknij ikonę <strong>Udostępnij</strong>
                  <Share className="w-4 h-4 text-blue-600 inline" aria-hidden="true" />
                  na górnym pasku Safari.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-blue-600">3.</span>
                <span>
                  Wybierz <strong>„Do ekranu początkowego”</strong> (Add to Home Screen) i zatwierdź.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display font-bold text-blue-600">4.</span>
                <span>
                  Aplikacja otworzy się na pełnym ekranie z własną ikoną i działa także bez internetu!
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[46px] rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </>
  );
};
