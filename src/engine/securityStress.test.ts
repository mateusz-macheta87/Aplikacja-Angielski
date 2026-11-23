import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  buildWearingSentence,
  validateLessonModuleJson,
} from './gameEngine';
import { normalizeProgress } from './storage';
import {
  createApp,
  createRateLimiter,
  validateImageMagicBytes,
} from '../../server';

function makeValidPngBase64(): string {
  // Minimal valid PNG signature + IHDR chunk header bytes (>12 bytes)
  const buf = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  ]);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function withTestServer(
  fn: (baseUrl: string) => Promise<void>,
  maxPhotoRequestsPerWindow = 5
): Promise<void> {
  const app = createApp({ maxPhotoRequestsPerWindow });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr === 'object');
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('buildWearingSentence uses "an" before vowel colors like orange', () => {
  assert.equal(buildWearingSentence('coat', 'orange', false), "I'm wearing an orange coat.");
  assert.equal(buildWearingSentence('coat', 'orange', false, true), "I'm wearing a new orange coat.");
  assert.equal(buildWearingSentence('shorts', 'orange', true), "I'm wearing orange shorts.");
});

test('validateLessonModuleJson blocks prototype pollution, oversized payloads, path-traversal IDs, and CSS color injection', () => {
  // 1. Oversized payload (>128 KB)
  const giant = JSON.stringify({
    title: 'Huge',
    vocabulary: [{ word: 'a'.repeat(140_000), translation: 'b' }],
  });
  const giantRes = validateLessonModuleJson(giant);
  assert.equal(giantRes.valid, false);

  // 2. Prototype pollution attempt
  const protoPayload =
    '{"__proto__":{"polluted":true},"title":"Test","vocabulary":[{"word":"cat","translation":"kot"}]}';
  const protoRes = validateLessonModuleJson(protoPayload);
  assert.equal(protoRes.valid, false);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);

  // 3. Nested constructor/prototype key
  const nestedProto =
    '{"title":"Test","vocabulary":[{"word":"cat","translation":"kot","constructor":{"prototype":{"hacked":1}}}]}';
  const nestedRes = validateLessonModuleJson(nestedProto);
  assert.equal(nestedRes.valid, false);

  // 4. Malformed array elements (null / primitives) & excessive item count
  const nullItemRes = validateLessonModuleJson(
    JSON.stringify({ title: 'Bad', vocabulary: [null, 42, []] })
  );
  assert.equal(nullItemRes.valid, false);

  const tooManyVocab = validateLessonModuleJson(
    JSON.stringify({
      title: 'Too many',
      vocabulary: Array.from({ length: 65 }, (_, i) => ({ word: `w${i}`, translation: `t${i}` })),
    })
  );
  assert.equal(tooManyVocab.valid, false);

  // 5. Path-traversal ID, CSS injection color, invalid speechLang, control chars
  const dirtyRes = validateLessonModuleJson(
    JSON.stringify({
      id: '../../etc/passwd',
      title: 'Unit 2\u0000\u0007 Clean',
      subject: 'malicious_subject',
      speechLang: 'javascript:alert(1)',
      vocabulary: [
        {
          id: '../evil',
          word: 'coat',
          translation: 'płaszcz',
          illustration: 'evil-svg',
          defaultColor: 'red; background:url(javascript:alert(1))',
        },
        {
          id: 'ok-2',
          word: 'hat',
          translation: 'czapka',
          defaultColor: '#EF4444',
        },
      ],
    })
  );
  assert.equal(dirtyRes.valid, true);
  assert.ok(dirtyRes.module);
  assert.equal(dirtyRes.module.id.includes('..'), false);
  assert.equal(dirtyRes.module.id.includes('/'), false);
  assert.equal(dirtyRes.module.title, 'Unit 2 Clean');
  assert.equal(dirtyRes.module.subject, 'custom');
  assert.equal(dirtyRes.module.speechLang, 'en-GB');
  assert.equal(dirtyRes.module.vocabulary[0].illustration, 'generic');
  assert.equal(dirtyRes.module.vocabulary[0].defaultColor, undefined);
  assert.equal(dirtyRes.module.vocabulary[1].defaultColor, '#EF4444');
});

test('validateLessonModuleJson fuzz stress test: 300 adversarial inputs never throw', () => {
  const fuzzInputs = [
    '',
    '   ',
    'null',
    '[]',
    '123',
    '"string"',
    '{invalid',
    '{"title":123,"vocabulary":[]}',
    '{"title":"ok","vocabulary":[{"word":"","translation":""}]}',
    '{"title":"ok","vocabulary":[{"word":"<img src=x onerror=alert(1)>","translation":"ok"}],"sentences":[null,{"targetSentence":""}]}',
  ];
  for (let i = 0; i < 300; i++) {
    const sample = fuzzInputs[i % fuzzInputs.length];
    const res = validateLessonModuleJson(sample);
    assert.equal(typeof res.valid, 'boolean');
  }
});

test('normalizeProgress clamps tampered values, enforces max 1 equipped accessory, and drops prototype keys', () => {
  const raw = JSON.parse(
    '{"stars":-500,"starsSpent":999999999,"bestTestScore":999,"equippedAccessories":["acc-bow","acc-cap","acc-crown"],"stopStars":{"stop-clothes":99,"__proto__":3},"stickerPlacements":{"s1":{"xPct":-50,"yPct":250}}}'
  );
  const clean = normalizeProgress('unit-1', raw);
  assert.equal(clean.stars, 0);
  assert.equal(clean.starsSpent, 100000);
  assert.equal(clean.bestTestScore, 100);
  assert.equal(clean.equippedAccessories.length, 1);
  assert.equal(clean.equippedAccessories[0], 'acc-bow');
  assert.equal(clean.stopStars['stop-clothes'], 3);
  assert.equal(Object.prototype.hasOwnProperty.call(clean.stopStars, '__proto__'), false);
  assert.deepEqual(clean.stickerPlacements['s1'], { xPct: 0, yPct: 100 });
});

test('validateImageMagicBytes verifies genuine JPEG/PNG/WebP headers and blocks spoofed scripts', () => {
  assert.equal(
    validateImageMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]), 'image/jpeg'),
    true
  );
  assert.equal(
    validateImageMagicBytes(Buffer.from('<script>alert(1)</script>'), 'image/jpeg'),
    false
  );
  assert.equal(
    validateImageMagicBytes(Buffer.from('<svg onload=alert(1)></svg>'), 'image/png'),
    false
  );
  assert.equal(
    validateImageMagicBytes(Buffer.from('RIFF1234WEBPdata'), 'image/webp'),
    true
  );
});

test('createRateLimiter enforces sliding window limits and stays bounded under 1500-IP flood', () => {
  const limiter = createRateLimiter(3, 60_000);
  const t0 = 1_000_000;
  assert.equal(limiter('10.0.0.1', t0).allowed, true);
  assert.equal(limiter('10.0.0.1', t0 + 100).allowed, true);
  assert.equal(limiter('10.0.0.1', t0 + 200).allowed, true);
  const blocked = limiter('10.0.0.1', t0 + 300);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  // Allowed again after window expires
  assert.equal(limiter('10.0.0.1', t0 + 61_000).allowed, true);

  // Stress test with 1500 distinct spoofed IPs
  for (let i = 0; i < 1500; i++) {
    assert.equal(limiter(`203.0.113.${i}`, t0 + i).allowed, true);
  }
});

test('HTTP API stress & security suite: headers, spoofed MIME, malformed JSON, oversize & rate limit 429', async () => {
  await withTestServer(async (baseUrl) => {
    // 1. Security headers + malformed JSON returns clean 400 JSON (no HTML stack trace)
    const badJsonResp = await fetch(`${baseUrl}/api/generate-module-from-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.1' },
      body: '{"broken": ',
    });
    assert.equal(badJsonResp.status, 400);
    assert.equal(badJsonResp.headers.get('x-powered-by'), null);
    assert.equal(badJsonResp.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(badJsonResp.headers.get('referrer-policy'), 'no-referrer');
    const badJsonBody = (await badJsonResp.json()) as { error?: string };
    assert.ok(badJsonBody.error && !badJsonBody.error.includes('SyntaxError'));

    // 2. Disallowed MIME type (SVG XSS payload) -> 400
    const svgResp = await fetch(`${baseUrl}/api/generate-module-from-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.2' },
      body: JSON.stringify({
        mimeType: 'image/svg+xml',
        imageBase64: Buffer.from('<svg onload=alert(1)></svg>'.repeat(4)).toString('base64'),
      }),
    });
    assert.equal(svgResp.status, 400);

    // 3. MIME spoofing: claims image/jpeg, sends HTML script bytes -> 400 blocked by magic bytes
    const spoofResp = await fetch(`${baseUrl}/api/generate-module-from-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.3' },
      body: JSON.stringify({
        mimeType: 'image/jpeg',
        imageBase64: Buffer.from('<html><script>alert(1)</script></html>'.repeat(3)).toString('base64'),
      }),
    });
    assert.equal(spoofResp.status, 400);

    // 4. Oversized >7 MB base64 image -> 413
    const hugeBase64 = 'A'.repeat(10_200_000);
    const hugeResp = await fetch(`${baseUrl}/api/generate-module-from-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.4' },
      body: JSON.stringify({
        mimeType: 'image/png',
        imageBase64: hugeBase64,
      }),
    });
    assert.equal(hugeResp.status, 413);

    // 5. Burst rate-limit stress test (limit=5, fire 8 requests from same IP -> last 3 MUST be 429)
    const burstStatuses: number[] = [];
    const validPng = makeValidPngBase64();
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${baseUrl}/api/generate-module-from-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.99' },
        body: JSON.stringify({
          mimeType: 'image/png',
          imageBase64: validPng,
          subjectHint: 'english',
        }),
      });
      burstStatuses.push(r.status);
    }
    assert.equal(burstStatuses.slice(5).every((s) => s === 429), true);
  }, 5);
});
