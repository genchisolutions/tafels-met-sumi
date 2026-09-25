// storage.js — single source of truth for persistence. No other module touches localStorage directly.
const Storage = (() => {
  const SCHEMA_VERSION = 1;
  const KEY = 'tafels-met-sumi:data';

  function allFactKeys() {
    const keys = [];
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) keys.push(`${a}x${b}`);
    }
    return keys;
  }

  function defaultFacts() {
    const facts = {};
    for (const key of allFactKeys()) {
      const [a, b] = key.split('x').map(Number);
      facts[key] = {
        a, b, result: a * b,
        status: 'locked', // locked | learning | known
        attempts: 0, correct: 0, incorrect: 0,
        streak: 0, mastery: 0, lastPracticed: null
      };
    }
    // Demo default state so the app is testable on first launch (spec section 36)
    const known = ['1x1','1x2','2x1','2x2','5x1','10x1'];
    const learning = ['2x3','3x2','2x4','4x2'];
    known.forEach(k => { facts[k].status = 'known'; facts[k].mastery = 0.9; facts[k].attempts = 6; facts[k].correct = 6; });
    learning.forEach(k => { facts[k].status = 'learning'; facts[k].mastery = 0.3; facts[k].attempts = 2; facts[k].correct = 1; facts[k].incorrect = 1; });
    return facts;
  }

  function defaultPlayer() {
    return {
      paws: 20,
      lifetimePaws: 20,
      sessionsCompleted: 0,
      perfectSessions: 0,
      currentStreak: 0,
      bestStreak: 0,
      unlockedLocations: ['alpendorp'],
      purchasedItems: [],
      equippedItems: { bed: null, neck: null, head: null, back: null, background: 'alpendorp' },
      settings: {
        soundEffects: true,
        spokenQuestions: true,
        backgroundMusic: false,
        reducedMotion: false
      }
    };
  }

  function defaultData() {
    return { version: SCHEMA_VERSION, player: defaultPlayer(), facts: defaultFacts() };
  }

  function migrate(data) {
    // Placeholder for future schema migrations. Bump SCHEMA_VERSION and add a case here.
    if (!data.version || data.version < SCHEMA_VERSION) {
      data.version = SCHEMA_VERSION;
    }
    // Defensive: fill in any missing keys from defaults without wiping progress.
    const defaults = defaultData();
    data.player = Object.assign({}, defaults.player, data.player || {});
    data.player.equippedItems = Object.assign({}, defaults.player.equippedItems, data.player.equippedItems || {});
    data.player.settings = Object.assign({}, defaults.player.settings, data.player.settings || {});
    data.facts = data.facts || {};
    for (const key of allFactKeys()) {
      if (!data.facts[key]) data.facts[key] = defaults.facts[key];
    }
    return data;
  }

  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { cache = defaultData(); save(); return cache; }
      const parsed = JSON.parse(raw);
      cache = migrate(parsed);
    } catch (e) {
      console.warn('Storage parse failed, resetting to defaults.', e);
      cache = defaultData();
    }
    return cache;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  return {
    getPlayer() { return load().player; },
    savePlayer(player) { load().player = player; save(); },
    getFacts() { return load().facts; },
    saveFacts(facts) { load().facts = facts; save(); },
    getFact(key) { return load().facts[key]; },
    saveFact(key, fact) { load().facts[key] = fact; save(); },
    allFactKeys,
    resetProgress() {
      const d = load();
      d.facts = defaultFacts();
      d.player.sessionsCompleted = 0;
      d.player.perfectSessions = 0;
      d.player.currentStreak = 0;
      d.player.bestStreak = 0;
      save();
    },
    resetRewards() {
      const d = load();
      d.player.paws = 0;
      d.player.purchasedItems = [];
      d.player.equippedItems = defaultPlayer().equippedItems;
      d.player.unlockedLocations = ['alpendorp'];
      save();
    },
    resetAll() {
      cache = defaultData();
      save();
    }
  };
})();
