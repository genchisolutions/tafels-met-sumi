// app.js — screens, session flow, shop/room, parent area. Ties storage + learning-engine + sumi + audio together.

const CATALOG = {
  bed: [
    { id: 'roze_kussen', name: 'Roze kussen', price: 10, emoji: '🛏️', color: '#FFC2D6' },
    { id: 'blauwe_mand', name: 'Blauwe mand', price: 50, emoji: '🧺', color: '#BEE7FB' },
    { id: 'pluche_wolk', name: 'Pluche wolk', price: 80, emoji: '☁️', color: '#F3F0FF' },
    { id: 'noordse_mand', name: 'Noordse mand', price: 120, emoji: '🪵', color: '#E7C79A' }
  ],
  neck: [
    { id: 'strikje', name: 'Strikje', price: 15, emoji: '🎀' },
    { id: 'sjaal', name: 'Sjaal', price: 25, emoji: '🧣' },
    { id: 'halsband', name: 'Halsband', price: 20, emoji: '🟠' }
  ],
  back: [
    { id: 'rugzak', name: 'Rugzak', price: 40, emoji: '🎒' }
  ],
  head: [
    { id: 'wintermuts', name: 'Wintermuts', price: 30, emoji: '🧢' },
    { id: 'kroontje', name: 'Kroontje', price: 60, emoji: '👑' }
  ],
  toy: [
    { id: 'bal', name: 'Bal', price: 12, emoji: '🎾' },
    { id: 'botje', name: 'Botje', price: 12, emoji: '🦴' },
    { id: 'teddybeer', name: 'Teddybeer', price: 18, emoji: '🧸' }
  ],
  background: [
    { id: 'alpendorp', name: 'Alpendorp', price: 0, emoji: '🏔️' },
    { id: 'bos', name: 'Bos', price: 35, emoji: '🌲' },
    { id: 'bevroren_meer', name: 'Bevroren meer', price: 55, emoji: '❄️' },
    { id: 'waterval', name: 'Waterval', price: 70, emoji: '💧' },
    { id: 'sneeuwkasteel', name: 'Sneeuwkasteel', price: 100, emoji: '🏰' },
    { id: 'noorderlicht', name: 'Noorderlicht', price: 150, emoji: '🌌' }
  ]
};

const ADVENTURE_LOCATIONS = [
  { id: 'alpendorp', name: 'Alpendorp', threshold: 0, emoji: '🏔️' },
  { id: 'dennenbos', name: 'Dennenbos', threshold: 20, emoji: '🌲' },
  { id: 'bevroren_meer', name: 'Bevroren meer', threshold: 45, emoji: '❄️' },
  { id: 'waterval', name: 'Waterval', threshold: 75, emoji: '💧' },
  { id: 'sneeuwkasteel', name: 'Sneeuwkasteel', threshold: 110, emoji: '🏰' },
  { id: 'noorderlicht', name: 'Noorderlicht', threshold: 150, emoji: '🌌' }
];

const WORLD_GRADIENTS = {
  alpendorp: 'linear-gradient(180deg,#8FD0F5 0%,#C9E9FA 45%,#EAF6FF 100%)',
  bos: 'linear-gradient(180deg,#6FB08A 0%,#A9D6B8 50%,#E9F5EC 100%)',
  bevroren_meer: 'linear-gradient(180deg,#7FC9E8 0%,#BFE8F2 50%,#EFFBFD 100%)',
  waterval: 'linear-gradient(180deg,#5EA7C9 0%,#A9D9E8 50%,#EAF7FA 100%)',
  sneeuwkasteel: 'linear-gradient(180deg,#B79CE0 0%,#DCCBF5 50%,#F5EFFF 100%)',
  noorderlicht: 'linear-gradient(180deg,#241C44 0%,#4A3A8A 55%,#7A5FC4 100%)'
};

function worldSvg(bgId) {
  const grad = WORLD_GRADIENTS[bgId] || WORLD_GRADIENTS.alpendorp;
  return `<div class="world-bg" style="background:${grad}">
    <svg viewBox="0 0 400 260" preserveAspectRatio="none">
      <polygon points="0,180 90,90 170,180" fill="rgba(255,255,255,0.55)"/>
      <polygon points="120,190 220,80 320,190" fill="rgba(255,255,255,0.7)"/>
      <polygon points="260,190 340,110 400,190" fill="rgba(255,255,255,0.5)"/>
      <rect x="0" y="185" width="400" height="75" fill="rgba(255,255,255,0.85)"/>
    </svg>
  </div>`;
}

function factKey(a, b) { return `${a}x${b}`; }
function fmtDate(ts) {
  if (!ts) return 'nog niet geoefend';
  const d = new Date(ts);
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

const App = (() => {
  let session = null; // active game session state
  let ouderTab = 'week';
  let kamerTab = 'kamer';
  let unlockedForParent = false;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  function showToast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function showScreen(name) {
    $all('.screen').forEach(s => s.classList.remove('active'));
    const target = $(`#screen-${name}`);
    if (target) target.classList.add('active');
    $all('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
    renderScreen(name);
    window.scrollTo(0, 0);
  }

  function renderScreen(name) {
    const player = Storage.getPlayer();
    updatePawPill(player);
    switch (name) {
      case 'home': return renderHome();
      case 'leren': return renderLeren();
      case 'avontuur': return renderAvontuur();
      case 'kamer': return renderKamer();
      case 'voortgang': return renderVoortgang();
      case 'ouders': return renderOuders();
      case 'play': return; // handled by startSession/askNext directly
    }
  }

  function updatePawPill(player) {
    $all('.paw-pill-count').forEach(el => { el.textContent = player.paws; });
  }

  function bumpPawPill() {
    $all('.pill.paw-pill').forEach(el => {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  }

  // ---------- HOME ----------
  function renderHome() {
    const player = Storage.getPlayer();
    $('#home-stage-bg').innerHTML = worldSvg(player.equippedItems.background);
    $('#home-sumi').innerHTML = Sumi.render('neutral', player.equippedItems);
  }

  // ---------- LEREN (browse facts, child-facing) ----------
  function renderLeren() {
    const facts = Storage.getFacts();
    const wrap = $('#leren-grid');
    wrap.innerHTML = '';
    const order = Storage.allFactKeys().filter(k => facts[k].status !== 'locked');
    if (!order.length) {
      wrap.innerHTML = `<div class="empty-state">Sumi wacht tot de juf of meester nieuwe sommen instelt. 🐾</div>`;
      return;
    }
    order.forEach(key => {
      const f = facts[key];
      const icon = f.status === 'known' ? '⭐' : '🌱';
      const card = document.createElement('button');
      card.className = 'menu-card small';
      card.innerHTML = `<div class="icon">${icon}</div><div class="title">${f.a} × ${f.b}</div>`;
      card.addEventListener('click', () => {
        AudioFx.click();
        Speech.say(`${f.a} keer ${f.b} is ${f.result}`);
        showToast(`${f.a} × ${f.b} = ${f.result}`);
      });
      wrap.appendChild(card);
    });
  }

  // ---------- GAME SESSION ----------
  function startSession() {
    const facts = Storage.getFacts();
    const available = Object.values(facts).filter(f => f.status !== 'locked');
    if (!available.length) {
      showToast('Vraag aan een ouder om eerst sommen te kiezen bij "Voor ouders".');
      return;
    }
    session = {
      total: 10, index: 0, score: 0, streak: 0,
      recentKeys: [], retryQueue: [], current: null
    };
    showScreen('play');
    nextQuestion();
  }

  function nextQuestion() {
    const facts = Storage.getFacts();
    if (session.index >= session.total) return endSession();
    const q = LearningEngine.buildQuestion(facts, session.recentKeys, session.retryQueue);
    if (!q) return endSession();
    session.current = q;
    session.recentKeys.push(q.key);
    session.index += 1;
    renderPlayScreen(q);
    Speech.askQuestion(q.a, q.b);
  }

  function renderPlayScreen(q) {
    $('#play-progress-label').textContent = `Vraag ${session.index} van ${session.total}`;
    const paws = $('#play-progress-paws');
    paws.innerHTML = '';
    for (let i = 0; i < session.total; i++) {
      const span = document.createElement('span');
      span.textContent = '🐾';
      if (i < session.index - 1) span.classList.add('done');
      paws.appendChild(span);
    }
    $('#play-question').textContent = `${q.a} × ${q.b} = ?`;
    $('#play-sumi').innerHTML = Sumi.render('thinking', Storage.getPlayer().equippedItems);
    $('#play-feedback').textContent = '';
    const grid = $('#play-answers');
    grid.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(opt, btn));
      grid.appendChild(btn);
    });
  }

  function handleAnswer(chosen, btnEl) {
    const q = session.current;
    const facts = Storage.getFacts();
    const fact = facts[q.key];
    const correct = chosen === q.result;
    $all('#play-answers .answer-btn').forEach(b => {
      b.disabled = true;
      if (Number(b.textContent) === q.result) b.classList.add('correct');
      else if (b === btnEl) b.classList.add('wrong');
    });

    LearningEngine.recordAnswer(fact, correct);
    const player = Storage.getPlayer();

    if (correct) {
      session.score += 1;
      session.streak += 1;
      player.currentStreak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      player.paws += 1;
      player.lifetimePaws += 1;
      AudioFx.correct();
      AudioFx.paw();
      bumpPawPill();
      const mood = session.streak >= 5 ? 'celebrate' : 'happy';
      $('#play-sumi').innerHTML = Sumi.render(mood, player.equippedItems);
      $('#play-feedback').textContent = session.streak >= 5
        ? `Wow, ${session.streak} op een rij! ${q.a} × ${q.b} = ${q.result}. Super! 🎉`
        : `Super! ${q.a} × ${q.b} = ${q.result} 🎉  +1 pootje!`;
    } else {
      session.streak = 0;
      player.currentStreak = 0;
      session.retryQueue.push(q.key);
      AudioFx.incorrect();
      $('#play-sumi').innerHTML = Sumi.render('oops', player.equippedItems);
      $('#play-feedback').textContent = `Bijna! 💜 ${q.a} × ${q.b} = ${q.result}. We proberen deze later nog eens.`;
    }

    if (LearningEngine.suggestsMastery(fact)) {
      fact.status = 'known';
      showToast(`Sumi denkt dat je ${q.a} × ${q.b} heel goed kent! ⭐`);
    }

    Storage.saveFacts(facts);
    Storage.savePlayer(player);
    updatePawPill(player);
    unlockAdventureIfEligible(player);

    setTimeout(() => nextQuestion(), 1500);
  }

  function endSession() {
    const player = Storage.getPlayer();
    player.sessionsCompleted += 1;
    const perfect = session.score === session.total;
    if (perfect) { player.perfectSessions += 1; AudioFx.perfect(); }
    else AudioFx.reward();
    Storage.savePlayer(player);

    const box = $('#play-summary');
    box.innerHTML = `
      <div class="session-summary">
        <div class="sumi-wrap" style="width:min(46%,200px);margin:0 auto 12px;">${Sumi.render(perfect ? 'celebrate' : 'happy', player.equippedItems)}</div>
        <div class="big-score">${session.score}/${session.total}</div>
        <p style="color:var(--lavender);margin-top:8px;">${perfect ? 'Geweldig! Je kent deze sommen supergoed! 🏆' : 'Goed gedaan! Sumi is trots op jou! 💜'}</p>
      </div>`;
    $('#play-question-area').style.display = 'none';
    box.style.display = 'block';
    $('#play-again-actions').style.display = 'flex';
  }

  function resetPlayScreenForRestart() {
    $('#play-summary').style.display = 'none';
    $('#play-question-area').style.display = '';
    $('#play-again-actions').style.display = 'none';
  }

  // ---------- AVONTUUR ----------
  function unlockAdventureIfEligible(player) {
    let changed = false;
    ADVENTURE_LOCATIONS.forEach(loc => {
      if (player.lifetimePaws >= loc.threshold && !player.unlockedLocations.includes(loc.id)) {
        player.unlockedLocations.push(loc.id);
        changed = true;
        showToast(`Nieuw avontuur ontgrendeld: ${loc.name}! 🗺️`);
      }
    });
    if (changed) Storage.savePlayer(player);
  }

  function renderAvontuur() {
    const player = Storage.getPlayer();
    const wrap = $('#avontuur-path');
    const nodesHtml = ADVENTURE_LOCATIONS.map((loc, i) => {
      const unlocked = player.unlockedLocations.includes(loc.id);
      const x = 40 + i * 65;
      const y = i % 2 === 0 ? 60 : 140;
      return `<g class="adventure-node ${unlocked ? '' : 'locked'}" data-loc="${loc.id}" data-unlocked="${unlocked}" transform="translate(${x} ${y})">
        <circle r="26" fill="${unlocked ? '#FFD166' : '#C9C2E8'}" stroke="#fff" stroke-width="3"/>
        <text x="0" y="8" text-anchor="middle" font-size="22">${unlocked ? loc.emoji : '🔒'}</text>
      </g>`;
    }).join('');
    const lineHtml = ADVENTURE_LOCATIONS.map((loc, i) => {
      if (i === 0) return '';
      const x1 = 40 + (i - 1) * 65, y1 = (i - 1) % 2 === 0 ? 60 : 140;
      const x2 = 40 + i * 65, y2 = i % 2 === 0 ? 60 : 140;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="6" stroke-dasharray="4 10" opacity="0.6"/>`;
    }).join('');
    wrap.innerHTML = `<svg viewBox="0 0 ${40 + (ADVENTURE_LOCATIONS.length - 1) * 65 + 40} 200">${lineHtml}${nodesHtml}</svg>`;
    $all('.adventure-node').forEach(node => {
      node.addEventListener('click', () => {
        const locId = node.dataset.loc;
        const unlocked = node.dataset.unlocked === 'true';
        const loc = ADVENTURE_LOCATIONS.find(l => l.id === locId);
        if (!unlocked) {
          showToast(`Verdien meer pootjes om ${loc.name} te ontgrendelen! 🐾 (${loc.threshold} nodig)`);
          return;
        }
        AudioFx.click();
        $('#avontuur-stage-bg').innerHTML = worldSvg(locId);
        $('#avontuur-sumi').innerHTML = Sumi.render('adventure', player.equippedItems);
        $('#avontuur-caption').textContent = loc.name;
      });
    });
    // default view: last unlocked
    const last = player.unlockedLocations[player.unlockedLocations.length - 1];
    $('#avontuur-stage-bg').innerHTML = worldSvg(last);
    $('#avontuur-sumi').innerHTML = Sumi.render('adventure', player.equippedItems);
    $('#avontuur-caption').textContent = ADVENTURE_LOCATIONS.find(l => l.id === last)?.name || 'Alpendorp';
  }

  // ---------- KAMER + WINKEL ----------
  function renderKamer() {
    $all('#kamer-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === kamerTab));
    $('#kamer-panel-kamer').style.display = kamerTab === 'kamer' ? '' : 'none';
    $('#kamer-panel-winkel').style.display = kamerTab === 'winkel' ? '' : 'none';
    if (kamerTab === 'kamer') renderKamerScene(); else renderWinkel();
  }

  function renderKamerScene() {
    const player = Storage.getPlayer();
    $('#kamer-room-bg').innerHTML = worldSvg(player.equippedItems.background);
    $('#kamer-sumi').innerHTML = Sumi.render('sleeping', player.equippedItems);
    const bedId = player.equippedItems.bed;
    const bedItem = CATALOG.bed.find(b => b.id === bedId);
    $('#kamer-bed').innerHTML = bedItem
      ? `<svg viewBox="0 0 200 60"><ellipse cx="100" cy="40" rx="95" ry="18" fill="${bedItem.color}"/><ellipse cx="100" cy="30" rx="80" ry="14" fill="#fff" opacity="0.6"/></svg>`
      : '';

    const grid = $('#kamer-equip-grid');
    grid.innerHTML = '';
    const owned = player.purchasedItems;
    ['bed', 'neck', 'back', 'head', 'background'].forEach(slot => {
      CATALOG[slot].forEach(item => {
        const isOwned = slot === 'background' ? (item.price === 0 || owned.includes(item.id)) : owned.includes(item.id);
        if (!isOwned) return;
        const equipped = player.equippedItems[slot] === item.id;
        const card = document.createElement('div');
        card.className = 'item-card' + (equipped ? ' equipped' : '');
        card.innerHTML = `<div class="emoji">${item.emoji}</div><div class="price">${item.name}</div>
          <button class="game-btn ${equipped ? 'ghost' : 'secondary'}">${equipped ? 'Gedragen' : 'Aandoen'}</button>`;
        card.querySelector('button').addEventListener('click', () => {
          player.equippedItems[slot] = equipped ? (slot === 'background' ? 'alpendorp' : null) : item.id;
          Storage.savePlayer(player);
          AudioFx.click();
          renderKamerScene();
        });
        grid.appendChild(card);
      });
    });
  }

  function renderWinkel() {
    const player = Storage.getPlayer();
    const wrap = $('#winkel-grid');
    wrap.innerHTML = '';
    Object.entries(CATALOG).forEach(([slot, items]) => {
      items.forEach(item => {
        if (slot === 'background' && item.price === 0) return; // free default, not for sale
        const owned = player.purchasedItems.includes(item.id);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `<div class="emoji">${item.emoji}</div><div class="price">${item.name}</div>
          <div class="price">🐾 ${item.price}</div>
          <button class="game-btn ${owned ? 'ghost' : 'gold'}" ${owned ? 'disabled' : ''}>${owned ? 'Gekocht' : 'Kopen'}</button>`;
        if (!owned) {
          card.querySelector('button').addEventListener('click', () => {
            if (player.paws < item.price) { showToast('Niet genoeg pootjes! Blijf oefenen 🐾'); return; }
            player.paws -= item.price;
            player.purchasedItems.push(item.id);
            player.equippedItems[slot] = item.id;
            Storage.savePlayer(player);
            AudioFx.reward();
            updatePawPill(player);
            showToast(`Nieuwe verrassing! ${item.name} 🎁`);
            renderWinkel();
          });
        }
        wrap.appendChild(card);
      });
    });
  }

  // ---------- VOORTGANG (child-facing) ----------
  function renderVoortgang() {
    const player = Storage.getPlayer();
    const facts = Storage.getFacts();
    const known = Object.values(facts).filter(f => f.status === 'known').length;
    const learning = Object.values(facts).filter(f => f.status === 'learning').length;
    $('#voortgang-stats').innerHTML = `
      <div class="card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><span>🐾 Pootjes verdiend</span><b>${player.lifetimePaws}</b></div></div>
      <div class="card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><span>⭐ Sommen die je kent</span><b>${known}</b></div></div>
      <div class="card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><span>🌱 Sommen die je leert</span><b>${learning}</b></div></div>
      <div class="card" style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><span>🏆 Perfecte beurten</span><b>${player.perfectSessions}</b></div></div>
      <div class="card"><div style="display:flex;justify-content:space-between;"><span>🔥 Beste reeks</span><b>${player.bestStreak}</b></div></div>`;
  }

  // ---------- OUDERS (parent area, gated) ----------
  function renderOuders() {
    if (!unlockedForParent) {
      const a = 2 + Math.floor(Math.random() * 8);
      const b = 2 + Math.floor(Math.random() * 8);
      $('#ouders-gate-question').textContent = `Hoeveel is ${a} × ${b}?`;
      $('#ouders-gate-question').dataset.answer = a * b;
      $('#ouders-gate-input').value = '';
      $('#ouders-gate').style.display = '';
      $('#ouders-content').style.display = 'none';
      return;
    }
    $('#ouders-gate').style.display = 'none';
    $('#ouders-content').style.display = '';
    $all('#ouders-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === ouderTab));
    ['week', 'sommen', 'progress', 'settings'].forEach(t => {
      $(`#ouders-panel-${t}`).style.display = t === ouderTab ? '' : 'none';
    });
    if (ouderTab === 'week') renderOudersWeek();
    if (ouderTab === 'sommen') renderOudersSommen();
    if (ouderTab === 'progress') renderOudersProgress();
    if (ouderTab === 'settings') renderOudersSettings();
  }

  function checkGate() {
    const expected = Number($('#ouders-gate-question').dataset.answer);
    const val = Number($('#ouders-gate-input').value);
    if (val === expected) {
      unlockedForParent = true;
      renderOuders();
    } else {
      showToast('Niet helemaal juist, probeer opnieuw.');
    }
  }

  function renderOudersWeek() {
    const facts = Storage.getFacts();
    const wrap = $('#ouders-week-list');
    wrap.innerHTML = '';
    const notKnown = Storage.allFactKeys().filter(k => facts[k].status !== 'known');
    notKnown.forEach(key => {
      const f = facts[key];
      const row = document.createElement('label');
      row.className = 'checkbox-row';
      row.innerHTML = `<input type="checkbox" data-key="${key}" ${f.status === 'learning' ? 'checked' : ''}/> ${f.a} × ${f.b}`;
      wrap.appendChild(row);
    });
  }

  function applyWeekSelection() {
    const facts = Storage.getFacts();
    $all('#ouders-week-list input[type=checkbox]').forEach(cb => {
      const key = cb.dataset.key;
      if (cb.checked) facts[key].status = 'learning';
      else if (facts[key].status === 'learning') facts[key].status = 'locked';
    });
    Storage.saveFacts(facts);
    showToast('Deze week is ingesteld!');
  }

  function renderOudersSommen() {
    const facts = Storage.getFacts();
    const grid = $('#ouders-matrix');
    grid.innerHTML = '';
    grid.appendChild(makeCell('×', 'header'));
    for (let b = 1; b <= 10; b++) grid.appendChild(makeCell(b, 'header'));
    for (let a = 1; a <= 10; a++) {
      grid.appendChild(makeCell(a, 'header'));
      for (let b = 1; b <= 10; b++) {
        const key = factKey(a, b);
        const f = facts[key];
        const cell = makeCell(f.result, f.status);
        cell.title = `${a} × ${b} — tik om status te wijzigen`;
        cell.addEventListener('click', () => {
          const order = ['locked', 'learning', 'known'];
          f.status = order[(order.indexOf(f.status) + 1) % order.length];
          Storage.saveFacts(facts);
          renderOudersSommen();
        });
        grid.appendChild(cell);
      }
    }
  }
  function makeCell(text, cls) {
    const d = document.createElement('div');
    d.className = 'fact-cell ' + cls;
    d.textContent = text;
    return d;
  }

  function renderOudersProgress() {
    const facts = Storage.getFacts();
    const rows = Object.values(facts)
      .filter(f => f.attempts > 0)
      .sort((a, b) => a.mastery - b.mastery);
    const wrap = $('#ouders-progress-list');
    if (!rows.length) { wrap.innerHTML = `<p style="color:var(--ink-soft)">Nog geen sommen geoefend.</p>`; return; }
    wrap.innerHTML = rows.map(f => `
      <div class="stat-row">
        <span class="fact-label">${f.a} × ${f.b} = ${f.result}</span>
        <span class="fact-meta">${f.correct}/${f.attempts} goed · reeks ${f.streak} · ${Math.round(f.mastery * 100)}% · ${fmtDate(f.lastPracticed)}</span>
      </div>`).join('');
  }

  function renderOudersSettings() {
    const player = Storage.getPlayer();
    $('#toggle-sound').checked = player.settings.soundEffects;
    $('#toggle-speech').checked = player.settings.spokenQuestions;
    $('#toggle-music').checked = player.settings.backgroundMusic;
  }

  function bindSettingsToggles() {
    ['sound', 'speech', 'music'].forEach(key => {
      $(`#toggle-${key}`).addEventListener('change', (e) => {
        const player = Storage.getPlayer();
        const map = { sound: 'soundEffects', speech: 'spokenQuestions', music: 'backgroundMusic' };
        player.settings[map[key]] = e.target.checked;
        Storage.savePlayer(player);
      });
    });
  }

  function confirmModal(title, text, onConfirm) {
    $('#modal-title').textContent = title;
    $('#modal-text').textContent = text;
    $('#modal-overlay').classList.add('active');
    const yes = $('#modal-confirm');
    const clone = yes.cloneNode(true);
    yes.parentNode.replaceChild(clone, yes);
    clone.addEventListener('click', () => { onConfirm(); $('#modal-overlay').classList.remove('active'); });
  }

  // ---------- INIT / WIRING ----------
  function init() {
    $all('.nav-btn').forEach(btn => btn.addEventListener('click', () => { AudioFx.click(); showScreen(btn.dataset.screen); }));
    $all('[data-goto]').forEach(btn => btn.addEventListener('click', () => { AudioFx.click(); showScreen(btn.dataset.goto); }));

    $('#btn-start-play').addEventListener('click', () => { AudioFx.unlock(); startSession(); });
    $('#btn-play-again').addEventListener('click', () => { resetPlayScreenForRestart(); startSession(); });
    $('#btn-play-home').addEventListener('click', () => { resetPlayScreenForRestart(); showScreen('home'); });

    $all('#kamer-tabs .tab-btn').forEach(b => b.addEventListener('click', () => { kamerTab = b.dataset.tab; renderKamer(); }));
    $all('#ouders-tabs .tab-btn').forEach(b => b.addEventListener('click', () => { ouderTab = b.dataset.tab; renderOuders(); }));

    $('#ouders-gate-submit').addEventListener('click', checkGate);
    $('#ouders-gate-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
    $('#btn-week-apply').addEventListener('click', applyWeekSelection);

    $('#modal-cancel').addEventListener('click', () => $('#modal-overlay').classList.remove('active'));
    $('#btn-reset-progress').addEventListener('click', () => {
      confirmModal('Voortgang wissen?', 'Alle sommen en statistieken worden gewist. Dit kan niet ongedaan gemaakt worden.', () => {
        Storage.resetProgress(); showToast('Voortgang gewist.'); renderOuders();
      });
    });
    $('#btn-reset-rewards').addEventListener('click', () => {
      confirmModal('Beloningen wissen?', 'Pootjes en aankopen worden gewist.', () => {
        Storage.resetRewards(); showToast('Beloningen gewist.'); renderOuders();
      });
    });
    bindSettingsToggles();

    $all('.round-btn.sound-toggle').forEach(b => b.addEventListener('click', () => {
      const player = Storage.getPlayer();
      player.settings.soundEffects = !player.settings.soundEffects;
      Storage.savePlayer(player);
      b.textContent = player.settings.soundEffects ? '🔊' : '🔇';
      showToast(player.settings.soundEffects ? 'Geluid aan' : 'Geluid uit');
    }));

    // Warm up voice list for speech synthesis (some browsers load async)
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

    showScreen('home');

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
