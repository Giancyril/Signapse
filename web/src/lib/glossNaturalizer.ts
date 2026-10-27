/**
 * glossNaturalizer.ts - Client-side heuristic naturalizer for ASL glosses into English sentences
 */

import { NaturalizerOptions } from '../types/speech';

// Question signs
const QUESTION_GLOSSES = new Set(['what', 'who', 'how']);

// Action verbs that typically take "to [verb]" when followed by another verb
const MODAL_OR_CATENATIVE_VERBS = new Set(['want', 'need', 'like', 'can', 'decide', 'forget', 'study']);

// Transitive verbs that often take direct objects
const ACTION_VERBS = new Set([
  'eat', 'drink', 'help', 'give', 'pull', 'paint', 'change', 'tell', 'study',
  'meet', 'play', 'dance', 'walk', 'go', 'work'
]);

// Urgent / exclamatory single signs
const EXCLAMATORY_SIGNS: Record<string, string> = {
  help: 'Please help me!',
  accident: 'There was an accident!',
  wrong: 'That is wrong!',
  finish: 'All finished!',
};

// Conversational direct translations for short 1-2 word idioms
const IDIOM_MAP: Record<string, string> = {
  'yes': 'Yes.',
  'no': 'No.',
  'fine': 'I am doing fine.',
  'cool': 'That is cool.',
  'what time': 'What time is it?',
  'time what': 'What time is it?',
  'who man': 'Who is that man?',
  'man who': 'Who is that man?',
  'who woman': 'Who is that woman?',
  'woman who': 'Who is that woman?',
  'how go': 'How do I get there?',
  'go how': 'How do I get there?',
  'need help': 'I need help.',
  'help need': 'I need help.',
  'need doctor': 'I need a doctor.',
  'doctor need': 'I need a doctor.',
  'need medicine': 'I need medicine.',
  'want drink': 'I want something to drink.',
  'want eat': 'I want to eat.',
  'go school': 'I am going to school.',
  'go work': 'I am going to work.',
  'family love': 'I love my family.',
  'play basketball': 'Let us play basketball.',
  'play bowling': 'Let us go bowling.',
};

// Countable singular nouns that need "a" or "an"
const COUNTABLE_A_NOUNS = new Set([
  'book', 'chair', 'table', 'dog', 'bird', 'cow', 'fish', 'man', 'woman',
  'doctor', 'secretary', 'cousin', 'son', 'jacket', 'shirt', 'hat', 'letter', 'pizza'
]);

const COUNTABLE_AN_NOUNS = new Set([
  'apple', 'accident', 'orange'
]);

/**
 * Naturalizes a sequence of isolated ASL glosses into an English sentence.
 */
export function naturalizeGlosses(
  rawGlosses: string[],
  options: NaturalizerOptions = {}
): string {
  const {
    capitalizeFirstLetter = true,
    addTerminalPunctuation = true,
  } = options;

  if (!rawGlosses || rawGlosses.length === 0) return '';

  const clean = rawGlosses
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  if (clean.length === 0) return '';

  // 1. Direct idiom/phrase lookup
  const joinedKey = clean.join(' ');
  if (IDIOM_MAP[joinedKey]) {
    return IDIOM_MAP[joinedKey];
  }

  // 2. Single-word handling
  if (clean.length === 1) {
    const word = clean[0];
    if (EXCLAMATORY_SIGNS[word]) {
      return EXCLAMATORY_SIGNS[word];
    }
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    return addTerminalPunctuation ? `${capitalized}.` : capitalized;
  }

  // 3. Question check: if contains question word
  const hasQuestion = clean.some((w) => QUESTION_GLOSSES.has(w));
  let sentence = '';

  // Transform words
  const tokens: string[] = [];
  const firstWord = clean[0];

  // If sentence starts directly with a verb (e.g. "want", "need", "like", "eat"), prepend "I"
  if (
    (ACTION_VERBS.has(firstWord) || MODAL_OR_CATENATIVE_VERBS.has(firstWord)) &&
    !hasQuestion
  ) {
    tokens.push('I');
  }

  for (let i = 0; i < clean.length; i++) {
    const current = clean[i];
    const prev = i > 0 ? clean[i - 1] : null;

    // Handle "want", "need", "like", "decide" followed by a verb -> insert "to"
    if (prev && MODAL_OR_CATENATIVE_VERBS.has(prev) && ACTION_VERBS.has(current) && prev !== 'can') {
      tokens.push('to');
    }

    // Handle "go" followed by a place -> insert "to" or "to the"
    if (prev === 'go') {
      if (current === 'school' || current === 'work' || current === 'bed') {
        tokens.push('to');
      } else if (current === 'city') {
        tokens.push('to', 'the');
      }
    }

    // Handle verbs followed by countable nouns -> insert article
    if (prev && (ACTION_VERBS.has(prev) || prev === 'want' || prev === 'need' || prev === 'read' || prev === 'give')) {
      if (COUNTABLE_A_NOUNS.has(current)) {
        tokens.push('a');
      } else if (COUNTABLE_AN_NOUNS.has(current)) {
        tokens.push('an');
      }
    }

    tokens.push(current);
  }

  sentence = tokens.join(' ');

  // 4. Grammar refinements
  // Replace "I can to" with "I can"
  sentence = sentence.replace(/\bcan to\b/g, 'can');
  // Handle negation: "no want" -> "do not want", "no can" -> "cannot"
  sentence = sentence.replace(/\bno can\b/g, 'cannot');
  sentence = sentence.replace(/\bno want\b/g, 'do not want');
  sentence = sentence.replace(/\bno like\b/g, 'do not like');
  sentence = sentence.replace(/\bno need\b/g, 'do not need');

  // Capitalize first letter
  if (capitalizeFirstLetter && sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  // Terminal punctuation
  if (addTerminalPunctuation) {
    if (hasQuestion) {
      if (!sentence.endsWith('?')) sentence += '?';
    } else if (clean.some((w) => w === 'help' || w === 'accident')) {
      if (!sentence.endsWith('!')) sentence += '!';
    } else {
      if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
        sentence += '.';
      }
    }
  }

  return sentence;
}