// learning-engine.js — decides which fact to ask next and generates answer choices.
const LearningEngine = (() => {

  function pickWeightedFact(facts, recentKeys, retryQueue) {
    // Bring back a due retry first, if it's not the most recent question.
    for (let i = 0; i < retryQueue.length; i++) {
      const key = retryQueue[i];
      if (key !== recentKeys[recentKeys.length - 1]) {
        retryQueue.splice(i, 1);
        return key;
      }
    }

    const learningKeys = Object.keys(facts).filter(k => facts[k].status === 'learning');
    const knownKeys = Object.keys(facts).filter(k => facts[k].status === 'known');
    const pool = [];

    // 65-75% learning, 25-35% known. If one bucket is empty, use the other entirely.
    if (learningKeys.length && knownKeys.length) {
      for (let i = 0; i < 70; i++) pool.push('learning');
      for (let i = 0; i < 30; i++) pool.push('known');
    } else if (learningKeys.length) {
      pool.push('learning');
    } else if (knownKeys.length) {
      pool.push('known');
    } else {
      return null; // nothing available to ask
    }

    let attempts = 0;
    while (attempts < 12) {
      attempts++;
      const bucket = pool[Math.floor(Math.random() * pool.length)];
      const source = bucket === 'learning' ? learningKeys : knownKeys;
      const candidate = source[Math.floor(Math.random() * source.length)];
      // Avoid immediately repeating the last 2 questions when alternatives exist.
      if (!recentKeys.slice(-2).includes(candidate) || source.length <= 2) {
        return candidate;
      }
    }
    const fallbackSource = learningKeys.length ? learningKeys : knownKeys;
    return fallbackSource[Math.floor(Math.random() * fallbackSource.length)];
  }

  function generateDistractors(a, b, correct) {
    const distractors = new Set();
    const candidates = [
      a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b,
      correct + a, correct - a, correct + b, correct - b,
      correct + 1, correct - 1, correct + 10, correct - 10
    ].filter(n => n > 0 && n !== correct);

    // Shuffle candidates then pick unique ones.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const c of candidates) {
      if (distractors.size >= 3) break;
      if (!distractors.has(c)) distractors.add(c);
    }
    // Backfill if we somehow didn't get 3 unique plausible values.
    let filler = correct + 2;
    while (distractors.size < 3) {
      if (filler !== correct && filler > 0) distractors.add(filler);
      filler++;
    }
    return Array.from(distractors).slice(0, 3);
  }

  function buildQuestion(facts, recentKeys, retryQueue) {
    const key = pickWeightedFact(facts, recentKeys, retryQueue);
    if (!key) return null;
    const fact = facts[key];
    const options = generateDistractors(fact.a, fact.b, fact.result);
    options.push(fact.result);
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { key, a: fact.a, b: fact.b, result: fact.result, options };
  }

  function recordAnswer(fact, wasCorrect) {
    fact.attempts += 1;
    if (wasCorrect) {
      fact.correct += 1;
      fact.streak = (fact.streak || 0) + 1;
    } else {
      fact.incorrect += 1;
      fact.streak = 0;
    }
    fact.lastPracticed = Date.now();
    fact.mastery = fact.attempts ? Math.round((fact.correct / fact.attempts) * 100) / 100 : 0;
    return fact;
  }

  function suggestsMastery(fact) {
    return fact.status === 'learning' && fact.attempts >= 6 && fact.mastery >= 0.85 && fact.streak >= 3;
  }

  return { buildQuestion, recordAnswer, suggestsMastery, pickWeightedFact, generateDistractors };
})();
