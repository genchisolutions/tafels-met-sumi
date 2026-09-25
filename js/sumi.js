// sumi.js — the ONE place that draws Sumi. Every screen calls Sumi.render(mood, equipped)
// so she stays visually consistent everywhere (same Samoyed, same proportions).
const Sumi = (() => {

  function eyes(mood) {
    switch (mood) {
      case 'happy':
      case 'celebrate':
      case 'reward':
        return `<path d="M96 108 q10 -14 20 0" stroke="#2E2A4A" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path d="M150 108 q10 -14 20 0" stroke="#2E2A4A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      case 'oops':
      case 'thinking':
        return `<ellipse cx="106" cy="106" rx="7" ry="9" fill="#2E2A4A"/>
                <ellipse cx="160" cy="106" rx="7" ry="9" fill="#2E2A4A"/>
                <path d="M96 92 q10 -6 20 0" stroke="#2E2A4A" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      case 'sleeping':
        return `<path d="M96 108 q10 6 20 0" stroke="#2E2A4A" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path d="M150 108 q10 6 20 0" stroke="#2E2A4A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      default:
        return `<ellipse cx="106" cy="106" rx="8" ry="10" fill="#2E2A4A"/>
                <ellipse cx="160" cy="106" rx="8" ry="10" fill="#2E2A4A"/>
                <circle cx="103" cy="102" r="2.4" fill="#fff"/>
                <circle cx="157" cy="102" r="2.4" fill="#fff"/>`;
    }
  }

  function mouth(mood) {
    switch (mood) {
      case 'happy': case 'celebrate': case 'reward': case 'running': case 'adventure':
        return `<path d="M112 128 q21 20 42 0" stroke="#2E2A4A" stroke-width="4.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="133" cy="136" rx="9" ry="6" fill="#FF9FB8"/>`;
      case 'oops':
        return `<ellipse cx="133" cy="128" rx="9" ry="7" fill="#2E2A4A" opacity="0.85"/>`;
      case 'thinking':
        return `<path d="M120 130 q13 4 26 -2" stroke="#2E2A4A" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      case 'sleeping':
        return `<ellipse cx="133" cy="126" rx="6" ry="3" fill="#2E2A4A" opacity="0.6"/>`;
      default:
        return `<path d="M118 126 q15 12 30 0" stroke="#2E2A4A" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    }
  }

  function extras(mood) {
    switch (mood) {
      case 'celebrate':
        return `<g font-size="22">
          <text x="40" y="60">✨</text><text x="210" y="70">✨</text>
          <text x="60" y="180">🎉</text><text x="200" y="190">🎉</text>
        </g>`;
      case 'oops':
        return `<g font-size="20"><text x="185" y="70">💧</text></g>`;
      case 'thinking':
        return `<g font-size="20"><text x="190" y="60">?</text></g>`;
      case 'sleeping':
        return `<g font-size="22" font-family="Baloo 2, sans-serif" fill="#6B6190"><text x="185" y="55">z</text><text x="200" y="35">Z</text></g>`;
      case 'reward':
        return `<g font-size="24"><text x="185" y="55">🎁</text></g>`;
      default: return '';
    }
  }

  function tail(mood) {
    const wag = mood === 'happy' || mood === 'celebrate' || mood === 'running' || mood === 'reward';
    return `<g class="${wag ? 'sumi-tail-wag' : ''}">
      <path d="M205 150 q45 -10 40 -55 q-4 -25 -30 -20 q18 12 8 34 q-8 20 -30 24 Z" fill="#F5F3FA" stroke="#E3DEF2" stroke-width="2"/>
    </g>`;
  }

  function legs(mood) {
    const running = mood === 'running' || mood === 'adventure';
    if (running) {
      return `<g>
        <rect x="95" y="205" width="16" height="34" rx="8" fill="#FAF9FF" transform="rotate(-18 103 205)"/>
        <rect x="160" y="205" width="16" height="34" rx="8" fill="#FAF9FF" transform="rotate(18 168 205)"/>
      </g>`;
    }
    return `<g>
      <rect x="98" y="208" width="16" height="30" rx="8" fill="#FAF9FF"/>
      <rect x="122" y="212" width="16" height="26" rx="8" fill="#FAF9FF"/>
      <rect x="150" y="212" width="16" height="26" rx="8" fill="#FAF9FF"/>
      <rect x="172" y="208" width="16" height="30" rx="8" fill="#FAF9FF"/>
    </g>`;
  }

  function accessoryLayer(slot, itemId) {
    if (!itemId) return '';
    const map = {
      strikje: `<g transform="translate(118 150)"><path d="M0 0 L-18 -12 L-18 12 Z" fill="#FF8FB3"/><path d="M0 0 L18 -12 L18 12 Z" fill="#FF8FB3"/><circle cx="0" cy="0" r="6" fill="#E96C97"/></g>`,
      sjaal: `<g transform="translate(133 150)"><rect x="-40" y="-10" width="80" height="20" rx="10" fill="#5EC0F0"/><rect x="-6" y="6" width="16" height="34" rx="6" fill="#5EC0F0"/></g>`,
      halsband: `<g transform="translate(133 150)"><rect x="-42" y="-6" width="84" height="12" rx="6" fill="#FFA94D"/><circle cx="0" cy="8" r="5" fill="#FFD166"/></g>`,
      rugzak: `<g transform="translate(200 130)"><rect x="-14" y="-20" width="46" height="56" rx="14" fill="#6FCF97"/><rect x="-6" y="-26" width="20" height="14" rx="6" fill="#4EAF77"/></g>`,
      wintermuts: `<g transform="translate(133 55)"><path d="M-42 10 Q-42 -35 0 -38 Q42 -35 42 10 Z" fill="#FF8FB3"/><rect x="-44" y="4" width="88" height="14" rx="7" fill="#fff"/><circle cx="0" cy="-42" r="9" fill="#fff"/></g>`,
      kroontje: `<g transform="translate(133 50)"><path d="M-24 8 L-24 -10 L-10 2 L0 -14 L10 2 L24 -10 L24 8 Z" fill="#FFD166" stroke="#F0862B" stroke-width="2"/></g>`
    };
    return map[itemId] || '';
  }

  function render(mood, equipped) {
    equipped = equipped || {};
    const bounce = (mood === 'neutral' || mood === 'learning') ? 'sumi-idle-bounce' : '';
    return `
    <svg class="sumi-svg ${bounce}" viewBox="0 0 266 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sumi de hond">
      ${legs(mood)}
      ${tail(mood)}
      <!-- body -->
      <ellipse cx="133" cy="185" rx="70" ry="56" fill="#FFFFFF" stroke="#E9E5F7" stroke-width="2"/>
      <!-- ears -->
      <path d="M78 70 L60 20 L108 62 Z" fill="#FFFFFF" stroke="#E9E5F7" stroke-width="2"/>
      <path d="M188 70 L206 20 L158 62 Z" fill="#FFFFFF" stroke="#E9E5F7" stroke-width="2"/>
      <path d="M78 62 L68 34 L100 58 Z" fill="#F3D9E4"/>
      <path d="M188 62 L198 34 L166 58 Z" fill="#F3D9E4"/>
      <!-- head -->
      <ellipse cx="133" cy="105" rx="66" ry="58" fill="#FFFFFF" stroke="#E9E5F7" stroke-width="2"/>
      <!-- snout -->
      <ellipse cx="133" cy="128" rx="30" ry="22" fill="#FDFBFF"/>
      ${eyes(mood)}
      <ellipse cx="133" cy="118" rx="9" ry="7" fill="#2E2A4A"/>
      ${mouth(mood)}
      ${accessoryLayer('neck', equipped.neck)}
      ${accessoryLayer('back', equipped.back)}
      ${accessoryLayer('head', equipped.head)}
      ${extras(mood)}
    </svg>`;
  }

  return { render };
})();
