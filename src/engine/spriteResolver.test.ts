import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSpokenPhrase, resolveSpriteSequence } from './spriteResolver';
import { KROPKA_AUDIO_SPRITE } from '../data/kropkaAudioSprite';
import { UNIT1_CLOTHES_MODULE } from '../data/unit1Clothes';

test('normalizeSpokenPhrase standardizes UK/US spelling, punctuation, and apostrophes', () => {
  assert.equal(normalizeSpokenPhrase("Color the gray T-shirt!"), 'colour the grey t-shirt');
  assert.equal(normalizeSpokenPhrase("I’m wearing pajamas."), "i'm wearing pyjamas");
  assert.equal(normalizeSpokenPhrase("What’s the weather like today?"), "what's the weather like today");
  assert.equal(normalizeSpokenPhrase('Goodnight!'), 'good night');
});

test('all 245 sprite cues have strictly valid monotonic timestamps with zero overlaps', () => {
  const entries = Object.entries(KROPKA_AUDIO_SPRITE);
  assert.equal(entries.length, 245);

  let prevEnd = 0;
  for (const [phrase, cue] of entries) {
    assert.ok(cue.start >= prevEnd - 0.001, `Overlap detected at "${phrase}"`);
    assert.ok(cue.end > cue.start + 0.15, `Clip too short at "${phrase}"`);
    prevEnd = cue.end;
  }
});

test('all 30 Unit 1 vocabulary words and all 8 crayon challenges resolve to ElevenLabs studio cues', () => {
  for (const item of UNIT1_CLOTHES_MODULE.vocabulary) {
    const wordCues = resolveSpriteSequence(item.word);
    assert.ok(wordCues && wordCues.length >= 1, `Missing studio audio for vocab word: ${item.word}`);

    const exampleCues = resolveSpriteSequence(item.exampleSentence);
    assert.ok(
      exampleCues && exampleCues.length >= 1,
      `Missing studio audio for example sentence: ${item.exampleSentence}`
    );
  }

  for (const challenge of UNIT1_CLOTHES_MODULE.crayonChallenges) {
    const cues = resolveSpriteSequence(challenge.sentence);
    assert.ok(cues && cues.length === 1, `Missing exact studio audio for crayon challenge: ${challenge.sentence}`);
  }
});

test('multi-sentence weather & season prompts chain seamlessly into sequential ElevenLabs cues', () => {
  const weatherQA = resolveSpriteSequence("What's the weather like today? It's sunny.");
  assert.ok(weatherQA && weatherQA.length === 2);
  assert.ok(weatherQA[0].start > 300 && weatherQA[1].start > weatherQA[0].end);

  const seasons = resolveSpriteSequence("It's snowy. It's winter!");
  assert.ok(seasons && seasons.length === 2);
});

test('all 10 Unit 1 Sentence Builder challenges resolve to ElevenLabs studio cues', () => {
  for (const s of UNIT1_CLOTHES_MODULE.sentences) {
    const cues = resolveSpriteSequence(s.targetSentence);
    assert.ok(cues && cues.length >= 1, `Missing studio audio for sentence: ${s.targetSentence}`);
  }
});

test('excluded homograph "bow" and non-English Polish phrases return null for graceful fallback', () => {
  assert.equal(resolveSpriteSequence('bow'), null);
  assert.equal(resolveSpriteSequence('Ile to jest trzy razy cztery?'), null);
});
