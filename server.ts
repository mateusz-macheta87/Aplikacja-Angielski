import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_SUBJECTS = new Set(['english', 'math', 'science', 'polish', 'custom']);
const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // 7 MB
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_MAX_TRACKED_IPS = 1000;

const SUBJECT_LABELS: Record<string, string> = {
  english: 'Język angielski',
  math: 'Matematyka',
  science: 'Przyroda',
  polish: 'Język polski',
  custom: 'Inny przedmiot',
};

export function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

export function createRateLimiter(
  maxRequests = RATE_LIMIT_MAX_REQUESTS,
  windowMs = RATE_LIMIT_WINDOW_MS
) {
  const buckets = new Map<string, number[]>();
  return function checkRateLimit(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
    const key = ip || 'unknown';
    const cutoff = now - windowMs;
    const existing = (buckets.get(key) ?? []).filter((ts) => ts > cutoff);

    if (existing.length >= maxRequests) {
      const oldest = existing[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      buckets.set(key, existing);
      return { allowed: false, retryAfterSec };
    }

    existing.push(now);
    buckets.set(key, existing);

    // Prevent memory exhaustion from spoofed IP floods
    if (buckets.size > RATE_LIMIT_MAX_TRACKED_IPS) {
      for (const [k, timestamps] of buckets.entries()) {
        if (timestamps.every((t) => t <= cutoff)) {
          buckets.delete(k);
        }
        if (buckets.size <= RATE_LIMIT_MAX_TRACKED_IPS) break;
      }
      if (buckets.size > RATE_LIMIT_MAX_TRACKED_IPS) {
        const firstKey = buckets.keys().next().value;
        if (firstKey) buckets.delete(firstKey);
      }
    }

    return { allowed: true, retryAfterSec: 0 };
  };
}

export function createApp(options?: { maxPhotoRequestsPerWindow?: number }) {
  const app = express();
  app.disable('x-powered-by');

  // Security headers compatible with AI Studio iframe embedding & Voice/Photo features
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
    next();
  });

  const checkPhotoRateLimit = createRateLimiter(
    options?.maxPhotoRequestsPerWindow ?? RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS
  );

  // Scoped JSON parser with 12mb cap strictly for the photo upload endpoint
  app.post(
    '/api/generate-module-from-photo',
    express.json({ limit: '12mb' }),
    async (req, res) => {
      try {
        const clientIp =
          (typeof req.headers['x-forwarded-for'] === 'string'
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : '') ||
          req.socket.remoteAddress ||
          'unknown';

        const rate = checkPhotoRateLimit(clientIp);
        if (!rate.allowed) {
          res.setHeader('Retry-After', String(rate.retryAfterSec));
          res.status(429).json({
            error: 'Zbyt wiele prób analizy zdjęć w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.',
          });
          return;
        }

        const { imageBase64, mimeType, subjectHint, titleHint } = req.body ?? {};

        if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
          res.status(400).json({
            error: 'Obsługiwane są wyłącznie zdjęcia JPG, PNG lub WebP.',
          });
          return;
        }

        if (typeof imageBase64 !== 'string' || imageBase64.trim().length < 32) {
          res.status(400).json({
            error: 'Nie przesłano prawidłowego zdjęcia strony podręcznika.',
          });
          return;
        }

        const cleanBase64 = imageBase64
          .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
          .replace(/\s+/g, '');

        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64) || cleanBase64.length % 4 !== 0) {
          res.status(400).json({
            error: 'Nieprawidłowy format zakodowanego obrazu.',
          });
          return;
        }

        const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
        if (approxBytes > MAX_IMAGE_BYTES) {
          res.status(413).json({
            error: 'Zdjęcie jest zbyt duże (maksymalnie 7 MB). Zrób zdjęcie w mniejszej rozdzielczości.',
          });
          return;
        }

        const decodedBuffer = Buffer.from(cleanBase64, 'base64');
        if (decodedBuffer.length > MAX_IMAGE_BYTES) {
          res.status(413).json({
            error: 'Zdjęcie jest zbyt duże (maksymalnie 7 MB). Zrób zdjęcie w mniejszej rozdzielczości.',
          });
          return;
        }

        if (!validateImageMagicBytes(decodedBuffer, mimeType)) {
          res.status(400).json({
            error: 'Plik nie jest prawidłowym obrazem JPG, PNG ani WebP.',
          });
          return;
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
          res.status(503).json({
            error:
              'Klucz GEMINI_API_KEY nie jest jeszcze skonfigurowany na serwerze. Dodaj go w ustawieniach sekretów projektu.',
          });
          return;
        }

        const safeSubject =
          typeof subjectHint === 'string' && ALLOWED_SUBJECTS.has(subjectHint)
            ? subjectHint
            : 'english';
        const safeTitleHint =
          typeof titleHint === 'string'
            ? titleHint.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 100)
            : '';

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' },
          },
        });

      const prompt = [
        'Jesteś nauczycielem szkoły podstawowej (klasy 1–3) tworzącym moduł edukacyjny do aplikacji dla 8-letniego dziecka na podstawie zdjęcia strony z podręcznika lub zeszytu.',
        `Wskazówka przedmiotu: ${SUBJECT_LABELS[safeSubject]}.`,
        safeTitleHint ? `Wskazówka tytułu: ${safeTitleHint}.` : '',
        'Odczytaj ze zdjęcia najważniejsze słówka/pojęcia (od 6 do 14 pozycji) oraz 2 do 4 krótkich zdań lub pytań sprawdzających do ułożenia z rozsypanki.',
        'Jeśli to język angielski, ustaw speechLang na "en-GB", pola word i exampleSentence po angielsku, a translation, exampleTranslation, promptPl i grammarTipPl po polsku.',
        'Jeśli to przedmiot po polsku (matematyka, przyroda, język polski), ustaw speechLang na "pl-PL".',
        'Zwróć wyłącznie czysty obiekt JSON zgodny ze schematem.',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              speechLang: { type: Type.STRING },
              teacherNote: { type: Type.STRING },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    categoryLabel: { type: Type.STRING },
                    exampleSentence: { type: Type.STRING },
                    exampleTranslation: { type: Type.STRING },
                  },
                  required: ['word', 'translation', 'categoryLabel', 'exampleSentence', 'exampleTranslation'],
                },
              },
              sentences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    promptPl: { type: Type.STRING },
                    targetSentence: { type: Type.STRING },
                    grammarTipPl: { type: Type.STRING },
                  },
                  required: ['promptPl', 'targetSentence', 'grammarTipPl'],
                },
              },
            },
            required: ['title', 'subtitle', 'speechLang', 'vocabulary'],
          },
        },
      });

      const rawText = response.text || '';
      if (!rawText.trim()) {
        res.status(502).json({
          error: 'Model nie zwrócił danych modułu. Spróbuj zrobić wyraźniejsze zdjęcie strony.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        title?: string;
        subtitle?: string;
        speechLang?: string;
        teacherNote?: string;
        vocabulary?: Array<{
          word?: string;
          translation?: string;
          categoryLabel?: string;
          exampleSentence?: string;
          exampleTranslation?: string;
        }>;
        sentences?: Array<{
          promptPl?: string;
          targetSentence?: string;
          grammarTipPl?: string;
        }>;
      };

      const rawVocab = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
      const vocabulary = rawVocab
        .filter((v) => v && typeof v.word === 'string' && v.word.trim() && typeof v.translation === 'string' && v.translation.trim())
        .slice(0, 16)
        .map((v, index) => ({
          id: `ai-v-${Date.now()}-${index + 1}`,
          word: v.word!.trim().slice(0, 80),
          translation: v.translation!.trim().slice(0, 100),
          category: 'general' as const,
          categoryLabel: (v.categoryLabel || 'Słownictwo').trim().slice(0, 40),
          illustration: (safeSubject === 'math' ? 'math-card' : safeSubject === 'science' ? 'science-card' : 'generic') as
            | 'math-card'
            | 'science-card'
            | 'generic',
          exampleSentence: (v.exampleSentence || v.word!).trim().slice(0, 160),
          exampleTranslation: (v.exampleTranslation || v.translation!).trim().slice(0, 160),
        }));

      if (vocabulary.length < 2) {
        res.status(422).json({
          error: 'Nie udało się odczytać wystarczającej liczby słówek ze zdjęcia. Upewnij się, że tekst jest wyraźny.',
        });
        return;
      }

      const rawSentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
      const sentences = rawSentences
        .filter((s) => s && typeof s.targetSentence === 'string' && s.targetSentence.trim())
        .slice(0, 6)
        .map((s, index) => {
          const target = s.targetSentence!.trim().slice(0, 140);
          const tokens = target.split(/\s+/).filter(Boolean);
          return {
            id: `ai-s-${Date.now()}-${index + 1}`,
            promptPl: (s.promptPl || 'Ułóż poprawne zdanie').trim().slice(0, 140),
            targetSentence: target,
            tokens,
            grammarTipPl: (s.grammarTipPl || 'Sprawdź kolejność wyrazów i przeczytaj na głos.').trim().slice(0, 180),
            illustration: 'generic' as const,
            skillTag: 'general' as const,
          };
        });

      const speechLang =
        typeof parsed.speechLang === 'string' && /^[a-z]{2}-[A-Z]{2}$/.test(parsed.speechLang.trim())
          ? parsed.speechLang.trim()
          : safeSubject === 'english'
            ? 'en-GB'
            : 'pl-PL';

      const modulePayload = {
        id: `ai-mod-${Date.now()}`,
        title: (safeTitleHint || parsed.title || 'Nowa lekcja ze zdjęcia').trim().slice(0, 100),
        subtitle: (parsed.subtitle || `Zestaw utworzony ze zdjęcia (${vocabulary.length} haseł)`).trim().slice(0, 140),
        subject: safeSubject,
        subjectLabel: SUBJECT_LABELS[safeSubject],
        gradeLevel: 'Klasa 1–3',
        speechLang,
        sourceReference: 'Utworzono ze zdjęcia podręcznika (Kreator AI)',
        teacherNote: (parsed.teacherNote || 'Zestaw wygenerowany na podstawie zdjęcia strony podręcznika.').trim().slice(0, 320),
        isBuiltIn: false,
        vocabulary,
        sentences,
        crayonChallenges: [],
      };

      res.json({ module: modulePayload });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating module from photo:', msg);
      res.status(500).json({
        error: 'Nie udało się przeanalizować zdjęcia podręcznika. Spróbuj ponownie za chwilę.',
      });
    }
  });

  // Clean JSON error handler so malformed JSON or oversized bodies never leak HTML stack traces
  app.use(
    (
      err: { status?: number; type?: string; message?: string } | null,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (!err) {
        next();
        return;
      }
      if (err.type === 'entity.too.large' || err.status === 413) {
        res.status(413).json({
          error: 'Przesłane dane przekraczają dopuszczalny limit rozmiaru.',
        });
        return;
      }
      if (err.type === 'entity.parse.failed' || err.status === 400) {
        res.status(400).json({
          error: 'Nieprawidłowy format żądania JSON.',
        });
        return;
      }
      res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
  );

  return app;
}

async function startServer() {
  const app = createApp();
  const http = await import('http');
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
        ws: disableHmr ? false : undefined,
      },
      appType: 'spa',
    });

    if (disableHmr) {
      // Vite 8 still injects /@vite/client in middlewareMode even with hmr:false & ws:false,
      // which triggers WebSocket connection errors in proxied environments. Serve a lightweight
      // no-WebSocket shim that keeps CSS injection working without opening any sockets.
      app.get('/@vite/client', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay {}
export function createHotContext() {
  const noop = () => {};
  return {
    data: {},
    accept: noop,
    acceptExports: noop,
    dispose: noop,
    prune: noop,
    invalidate: noop,
    on: noop,
    off: noop,
    send: noop,
  };
}
`);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

const isDirectExecution =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  startServer();
}
