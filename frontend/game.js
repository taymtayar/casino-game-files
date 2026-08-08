/* ══════════════════════════════════════════════
   Cops & Robbers — Slot Game Engine
   ══════════════════════════════════════════════ */

let API_BASE = window.location.origin;
let SESSION_ID = '';
const COLS = 7;
const ROWS = 7;
const API_MULTIPLIER = 1000000;

// ── Symbol Definitions ──
const SYMBOLS = {
  H1: { name: 'Necklace', file: 'H1_necklace.png', tier: 'high' },
  H2: { name: 'Watch', file: 'H2_watch.png', tier: 'high' },
  H3: { name: 'Gold Bars', file: 'H3_gold_bars.png', tier: 'high' },
  H4: { name: 'Cash', file: 'H4_cash.png', tier: 'high' },
  L1: { name: 'Cop', file: 'L1_cop.png', tier: 'low' },
  L2: { name: 'Handcuffs', file: 'L2_handcuffs.png', tier: 'low' },
  L3: { name: 'Siren', file: 'L3_siren.png', tier: 'low' },
  L4: { name: 'Flashlight', file: 'L4_flashlight.png', tier: 'low' },
  W: { name: 'Wild', file: 'W_wild_scroll.png', tier: 'special' },
  S: { name: 'Scatter', file: 'S_vault.png', tier: 'special' },
};

const PAYTABLE_DISPLAY = {
  H1: { '5': '5x', '6-8': '12.5x', '9-12': '25x', '13+': '60x' },
  H2: { '5': '2x', '6-8': '5x', '9-12': '10x', '13+': '40x' },
  H3: { '5': '1.3x', '6-8': '3.2x', '9-12': '7x', '13+': '30x' },
  H4: { '5': '1x', '6-8': '2.5x', '9-12': '6x', '13+': '20x' },
  L1: { '5': '0.6x', '6-8': '1.5x', '9-12': '4x', '13+': '10x' },
  L2: { '5': '0.4x', '6-8': '1.0x', '9-12': '3x', '13+': '8x' },
  L3: { '5': '0.2x', '6-8': '0.8x', '9-12': '2.5x', '13+': '5x' },
  L4: { '5': '0.1x', '6-8': '0.5x', '9-12': '1.5x', '13+': '4x' },
};

// ── Game State ──
const state = {
  betLevels: [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100],
  minBet: 0.1,
  fastSpin: false,
  autoSpinsRemaining: 0,
  
  // Replay State
  isReplay: false,
  replayParams: null,
  replayData: null,

  currency: 'USD',
  balance: 0,
  spinning: false,
  board: [],
  images: {},
  gridCellImg: null,
  bgImg: null,
};

// ── Currency Meta ──
const CurrencyMeta = {
  USD: { symbol: '$', decimals: 2 },
  CAD: { symbol: 'CA$', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
  EUR: { symbol: '€', decimals: 2 },
  RUB: { symbol: '₽', decimals: 2 },
  CNY: { symbol: 'CN¥', decimals: 2 },
  PHP: { symbol: '₱', decimals: 2 },
  INR: { symbol: '₹', decimals: 2 },
  IDR: { symbol: 'Rp', decimals: 0 },
  KRW: { symbol: '₩', decimals: 0 },
  BRL: { symbol: 'R$', decimals: 2 },
  MXN: { symbol: 'MX$', decimals: 2 },
  DKK: { symbol: 'KR', decimals: 2, symbolAfter: true },
  PLN: { symbol: 'zł', decimals: 2, symbolAfter: true },
  VND: { symbol: '₫', decimals: 0, symbolAfter: true },
  TRY: { symbol: '₺', decimals: 2 },
  CLP: { symbol: 'CLP', decimals: 0, symbolAfter: true },
  ARS: { symbol: 'ARS', decimals: 2, symbolAfter: true },
  PEN: { symbol: 'S/', decimals: 2, symbolAfter: true },
  NGN: { symbol: '₦', decimals: 2 },
  SAR: { symbol: 'SAR', decimals: 2, symbolAfter: true },
  ILS: { symbol: '₪', decimals: 2 },
  AED: { symbol: 'AED', decimals: 2, symbolAfter: true },
  TWD: { symbol: 'NT$', decimals: 2 },
  NOK: { symbol: 'kr', decimals: 2, symbolAfter: true },
  KWD: { symbol: 'KD', decimals: 3 },
  JOD: { symbol: 'JD', decimals: 3 },
  CRC: { symbol: '₡', decimals: 2 },
  TND: { symbol: 'TND', decimals: 3, symbolAfter: true },
  SGD: { symbol: 'SG$', decimals: 2 },
  MYR: { symbol: 'RM', decimals: 2 },
  OMR: { symbol: 'OMR', decimals: 3, symbolAfter: true },
  QAR: { symbol: 'QAR', decimals: 2, symbolAfter: true },
  BHD: { symbol: 'BD', decimals: 3 },
  PKR: { symbol: '₨', decimals: 2 },
  EGP: { symbol: 'ج.م', decimals: 2 },
  NZD: { symbol: 'NZ$', decimals: 2 },
  BOB: { symbol: 'Bs', decimals: 2 },
  GHS: { symbol: 'GH₵', decimals: 2 },
  KES: { symbol: 'KSh', decimals: 2 },
  MAD: { symbol: 'MAD', decimals: 2, symbolAfter: true },
  BAM: { symbol: 'KM', decimals: 2 },
  ISK: { symbol: 'kr', decimals: 0, symbolAfter: true },
  TZS: { symbol: 'TSh', decimals: 2 },
  UGX: { symbol: 'USh', decimals: 0 },
  XOF: { symbol: 'CFA', decimals: 0, symbolAfter: true },
  XGC: { symbol: 'GC', decimals: 0 },
  XSC: { symbol: 'SC', decimals: 2 },
  XEC: { symbol: 'SC', decimals: 2 },
};

function formatCurrency(amount, currency) {
  const meta = CurrencyMeta[currency] ?? {
    symbol: currency,
    decimals: 2,
    symbolAfter: true,
  };
  // As per instructions, if minimum win is >= 0.1x with base < 0.10, we may need more precision.
  // We'll keep it to the meta default for balance, and dynamic for win amounts below
  const formattedAmount = amount.toFixed(meta.decimals);
  if (meta.symbolAfter) {
    return `${formattedAmount} ${meta.symbol}`;
  } else {
    return `${meta.symbol}${formattedAmount}`;
  }
}

// ── DOM Elements ──
const els = {};

// ── Audio Manager ──
const audioManager = {
  bgmEnabled: true,
  sfxEnabled: true,
  hasInteracted: false,
  sfx: {
    click: new Audio('assets/audio/click.ogg'),
    land: new Audio('assets/audio/land.mp3'),
    win: new Audio('assets/audio/win_jingle.mp3'),
    winSmall: new Audio('assets/audio/small_win.mp3'),
    winBig: new Audio('assets/audio/big_win.wav'),
    minWin: new Audio('assets/audio/min_win.mp3'),
  },
  bgm: new Audio('assets/audio/bg_music.mp3')
};

audioManager.bgm.loop = true;
audioManager.bgm.volume = 0.15;

function playSound(name) {
  if (!audioManager.sfxEnabled) return;
  const sound = audioManager.sfx[name];
  if (sound) {
    // Clone node to allow overlapping sounds (e.g., rapid hovering)
    const clone = sound.cloneNode(true);
    
    // Duck background music for win sounds
    if (name.startsWith('win')) {
      audioManager.bgm.volume = 0.02; // Duck music volume heavily
      clone.addEventListener('ended', () => {
        audioManager.bgm.volume = 0.15; // Restore volume
      });
    }
    
    clone.play().catch(() => {});
  }
}

function toggleBGM() {
  audioManager.bgmEnabled = !audioManager.bgmEnabled;
  if (audioManager.bgmEnabled) {
    els.btnOptBgm.classList.remove('muted');
    els.btnOptBgm.textContent = 'MUSIC: ON';
  } else {
    els.btnOptBgm.classList.add('muted');
    els.btnOptBgm.textContent = 'MUSIC: OFF';
  }
  
  if (audioManager.bgmEnabled && audioManager.hasInteracted) {
    audioManager.bgm.play().catch(() => {});
  } else {
    audioManager.bgm.pause();
  }
}

function toggleSFX() {
  audioManager.sfxEnabled = !audioManager.sfxEnabled;
  if (audioManager.sfxEnabled) {
    els.btnOptSfx.classList.remove('muted');
    els.btnOptSfx.textContent = 'SFX: ON';
  } else {
    els.btnOptSfx.classList.add('muted');
    els.btnOptSfx.textContent = 'SFX: OFF';
  }
}

function handleFirstInteraction() {
  if (!audioManager.hasInteracted) {
    audioManager.hasInteracted = true;
    if (audioManager.bgmEnabled) {
      audioManager.bgm.play().catch(() => {});
    }
    // Remove this listener so it only runs once
    document.removeEventListener('click', handleFirstInteraction);
  }
}

// ── Initialization ──
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  setupListeners();
  
  window.addEventListener('resize', resizeControls);
  resizeControls(); // Initial call
  
  await loadAssets();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('rgs_url')) {
    let rgsUrl = urlParams.get('rgs_url');
    if (!rgsUrl.startsWith('http')) {
      rgsUrl = 'https://' + rgsUrl;
    }
    API_BASE = rgsUrl.replace(/\/$/, '');
  }
  if (urlParams.has('sessionID')) {
    SESSION_ID = urlParams.get('sessionID');
  }
  if (urlParams.get('replay') === 'true') {
    state.isReplay = true;
    document.body.classList.add('replay-mode');
    state.replayParams = {
      game: urlParams.get('game'),
      version: urlParams.get('version'),
      mode: urlParams.get('mode'),
      event: urlParams.get('event'),
      rgsUrl: API_BASE,
      currency: urlParams.get('currency') || 'USD',
      amount: parseFloat(urlParams.get('amount') || (10 * API_MULTIPLIER)) / API_MULTIPLIER
    };
    state.currency = state.replayParams.currency;
    els.betValue.value = state.replayParams.amount.toFixed(2);
    els.btnSpin.querySelector('.spin-text').textContent = 'PLAY REPLAY';
    await fetchReplayData();
  } else {
    await authenticate();
  }

  buildGrid();
  buildPaytable();
  applySocialTranslations();
  
  els.loaderText.textContent = "PRESS TO CONTINUE";
  els.loaderText.style.animation = "pulse-glow 1.5s infinite";
  els.loaderText.style.cursor = "pointer";
  els.loaderBar.parentElement.style.display = "none";
  els.loadingScreen.style.cursor = "pointer";
  els.loadingScreen.addEventListener('click', () => {
    hideLoadingScreen();
    handleFirstInteraction();
  }, { once: true });
});

function resizeControls() {
  const container = document.getElementById('game-container');
  const controls = document.getElementById('controls');
  if (!container || !controls) return;
  
  // Base the ratio on a 1400px width.
  // This is a sweet spot so it's not too small on landscape, but not too big either.
  let ratio = container.clientWidth / 1400;
  
  // Cap the scale at 1 to prevent it getting too big
  ratio = Math.min(ratio, 1);
  
  // Apply a smooth scale centered at bottom
  controls.style.transform = `translateX(-50%) scale(${ratio})`;
}

async function fetchReplayData() {
  try {
    const { game, version, mode, event, rgsUrl } = state.replayParams;
    let url = `${rgsUrl}/bet/replay/${game}/${version}/${mode}/${event}`.replace(/([^:]\/)\/+/g, "$1");
    // If running locally or no base URL is present, default to the mock server logic
    if (rgsUrl.includes('localhost') || !rgsUrl) {
      url = `${API_BASE}/bet/replay/${game}/${version}/${mode}/${event}`.replace(/([^:]\/)\/+/g, "$1");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.replayData = data;
  } catch (e) {
    console.error('Failed to fetch replay data', e);
    showNotification('Replay failed to load');
  }
}

function cacheElements() {
  els.loadingScreen = document.getElementById('loading-screen');
  els.loaderBar = document.getElementById('loader-bar');
  els.loaderText = document.getElementById('loader-text');
  els.gameBg = document.getElementById('game-bg');
  els.gridContainer = document.getElementById('grid-container');
  els.freeSpinsIndicator = document.getElementById('free-spins-indicator');
  els.fsCount = document.getElementById('fs-count');
  els.balanceValue = document.getElementById('balance-value');
  els.betValue = document.getElementById('bet-value');
  els.multValue = document.getElementById('mult-value');
  els.btnSpin = document.getElementById('btn-spin');
  els.btnBetUp = document.getElementById('btn-bet-up');
  els.btnBetDown = document.getElementById('btn-bet-down');
  els.btnFastSpin = document.getElementById('btn-fast-spin');
  els.btnAutoSpin = document.getElementById('btn-auto-spin');
  els.autoSpinMenu = document.getElementById('auto-spin-menu');
  els.autoSpinCount = document.getElementById('auto-spin-count');
  els.autoOpts = document.querySelectorAll('.auto-opt');
  els.btnMenuHamburger = document.getElementById('btn-menu-hamburger');
  els.closePaytable = document.getElementById('close-paytable');
  els.paytablePanel = document.getElementById('paytable-panel');
  els.paytableGrid = document.getElementById('paytable-grid');
  els.winOverlay = document.getElementById('win-overlay');
  els.overlayWinAmount = document.getElementById('overlay-win-amount');
  els.btnAudioMain = document.getElementById('btn-audio-main');
  els.audioPopMenu = document.getElementById('audio-pop-menu');
  els.btnOptBgm = document.getElementById('btn-opt-bgm');
  els.btnOptSfx = document.getElementById('btn-opt-sfx');
  
  els.btnBuyBonus = document.getElementById('btn-buy-bonus');
  els.buyBonusCost = document.getElementById('buy-bonus-cost');
  
  // Modal elements
  els.buyBonusModal = document.getElementById('buy-bonus-modal');
  els.modalBonusCost = document.getElementById('modal-bonus-cost');
  els.btnCancelBonus = document.getElementById('btn-cancel-bonus');
  els.btnConfirmBonus = document.getElementById('btn-confirm-bonus');
}

function setupListeners() {
  // First interaction for autoplay policy
  document.addEventListener('click', handleFirstInteraction);

  // Hamburger Menu (Paytable/Info)
  els.btnMenuHamburger.addEventListener('click', () => {
    playSound('click');
    els.paytablePanel.classList.remove('hidden');
  });

  els.btnAudioMain.addEventListener('click', () => {
    playSound('click');
    els.audioPopMenu.classList.toggle('hidden');
  });

  els.btnOptBgm.addEventListener('click', () => {
    playSound('click');
    toggleBGM();
  });

  els.btnOptSfx.addEventListener('click', () => {
    playSound('click');
    toggleSFX();
  });

  document.addEventListener('click', (e) => {
    if (els.btnAudioMain && !els.btnAudioMain.contains(e.target) && els.audioPopMenu && !els.audioPopMenu.contains(e.target)) {
      els.audioPopMenu.classList.add('hidden');
    }
  });

  els.btnSpin.addEventListener('click', () => {
    playSound('click');
    spin('base');
  });
  
  els.btnBuyBonus.addEventListener('click', () => {
    playSound('click');
    const bet = parseFloat(els.betValue.value);
    const cost = bet * 200;
    els.modalBonusCost.textContent = formatCurrency(cost);
    els.buyBonusModal.classList.remove('hidden');
  });

  els.btnCancelBonus.addEventListener('click', () => {
    playSound('click');
    els.buyBonusModal.classList.add('hidden');
  });

  els.btnConfirmBonus.addEventListener('click', () => {
    playSound('click');
    els.buyBonusModal.classList.add('hidden');
    spin('bonus');
  });

  els.btnBetUp.addEventListener('click', () => {
    playSound('click');
    changeBet(1);
  });
  els.btnBetDown.addEventListener('click', () => {
    playSound('click');
    changeBet(-1);
  });
  els.closePaytable.addEventListener('click', () => {
    playSound('click');
    els.paytablePanel.classList.add('hidden');
  });
  els.winOverlay.addEventListener('click', () => {
    playSound('click');
    els.winOverlay.classList.add('hidden');
  });
  


  els.betValue.addEventListener('input', adjustBetInputFontSize);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !state.spinning) { e.preventDefault(); spin(); }
  });

  // Setup auto & fast spin
  els.btnFastSpin.addEventListener('click', () => {
    state.isFastSpin = !state.isFastSpin;
    els.btnFastSpin.classList.toggle('active', state.isFastSpin);
  });

  els.btnAutoSpin.addEventListener('click', () => {
    if (state.autoSpinsRemaining > 0 || state.autoSpinsRemaining === 'Infinity') {
      // Cancel auto spin
      state.autoSpinsRemaining = 0;
      updateAutoSpinUI();
    } else {
      // Toggle menu
      els.autoSpinMenu.classList.toggle('hidden');
    }
  });

  // Hide auto menu if clicked outside
  document.addEventListener('click', (e) => {
    if (!els.btnAutoSpin.contains(e.target) && !els.autoSpinMenu.contains(e.target)) {
      els.autoSpinMenu.classList.add('hidden');
    }
  });

  els.autoOpts.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spins = e.target.dataset.spins;
      state.autoSpinsRemaining = spins === 'Infinity' ? 'Infinity' : parseInt(spins, 10);
      els.autoSpinMenu.classList.add('hidden');
      updateAutoSpinUI();
      // Per compliance: user must explicitly click spin to confirm autoplay
    });
  });
}

// ── Asset Loading ──
async function loadAssets() {
  const totalAssets = Object.keys(SYMBOLS).length + 2; // sprites + bg + grid cell
  let loaded = 0;

  const updateProgress = (name) => {
    loaded++;
    const pct = Math.round((loaded / totalAssets) * 100);
    els.loaderBar.style.width = pct + '%';
    els.loaderText.textContent = `Loading... ${pct}%`;
  };

  // Load background
  state.bgImg = await loadImage('assets/cops_and_robbers/background-wide.jpg');
  updateProgress('background');

  // Load grid cell
  state.gridCellImg = await loadImage('assets/cops_and_robbers/grid_cell.png');
  updateProgress('grid cell');

  // Load symbol sprites
  for (const [key, sym] of Object.entries(SYMBOLS)) {
    state.images[key] = await loadImage(`assets/cops_and_robbers/sprites/${sym.file}`);
    updateProgress(sym.name);
  }

  // Preload animation sprites so they don't flash blank on first play
  const animations = [
    'cash_anim.png', 'cop_anim.png', 'handcuffs_anim.png', 'flashlight_anim.png',
    'wild_anim.png', 'watch_anim.png', 'necklace_anim.png', 'diamond_bg_anim.png',
    'siren_anim_fixed.png', 'gold_anim.png', 'S_vault_anim.png'
  ];
  for (const anim of animations) {
    await loadImage(`assets/cops_and_robbers/sprites/${anim}`);
  }

  // Set background
  els.gameBg.style.backgroundImage = `url(${state.bgImg.src})`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn(`Failed to load: ${src}`); resolve(img); };
    img.src = src;
  });
}

function hideLoadingScreen() {
  els.loadingScreen.classList.add('fade-out');
  setTimeout(() => els.loadingScreen.style.display = 'none', 700);
}

// ── API Calls ──
async function authenticate() {
  try {
    const url = `${API_BASE}/wallet/authenticate`;
    const res = await fetch(url, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionID: SESSION_ID, language: 'en' })
    });
    if (!res.ok) {
      let errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    const data = await res.json();
    state.balance = data.balance.amount / API_MULTIPLIER;
    state.currency = data.balance.currency || 'USD';
    
    if (data.config) {
      if (data.config.betLevels) state.betLevels = data.config.betLevels.map(b => b / API_MULTIPLIER);
      if (data.config.minBet !== undefined) state.minBet = data.config.minBet / API_MULTIPLIER;
    }
    
    if (state.minBet === undefined) state.minBet = 0.00001;
    els.betValue.value = data.config?.defaultBetLevel ? (data.config.defaultBetLevel / API_MULTIPLIER) : state.minBet;
    
    if (data.round && data.round.active) {
      if (data.round.betAmount !== undefined) {
        els.betValue.value = (data.round.betAmount / API_MULTIPLIER).toString();
      }
      // Round was stuck, let's end it so we can play again!
      console.log('Found stuck round! Ending it...');
      try {
        await endRound();
      } catch (err) {
        console.error('Could not end stuck round:', err);
      }
    }
    
    adjustBetInputFontSize();
    updateUI();
  } catch (e) {
    console.error('Auth failed:', e);
    showNotification(`Auth Error: ${e.message} | URL: ${API_BASE}`);
    state.spinning = true; 
    els.btnSpin.disabled = true;
    updateUI();
  }
}

async function endRound() {
  if (state.isReplay) return;
  try {
    const res = await fetch(`${API_BASE}/wallet/end-round`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionID: SESSION_ID })
    });
    if (res.ok) {
      const data = await res.json();
      state.balance = data.balance.amount / API_MULTIPLIER;
      updateUI();
    }
  } catch (e) {
    console.error('Failed to end round', e);
  }
}

async function playRound(betAmount, mode = 'base') {
  let modeToSend = mode;
  if (mode === 'free_spin') {
    modeToSend = 'base';
  }
  
  const res = await fetch(`${API_BASE}/wallet/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionID: SESSION_ID, amount: Math.round(betAmount * API_MULTIPLIER), mode: modeToSend }),
  });
  if (!res.ok) {
    let errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return res.json();
}

// ── Grid Building ──
function buildGrid() {
  els.gridContainer.innerHTML = '';
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.col = col;
      cell.dataset.row = row;
      cell.id = `cell-${col}-${row}`;

      // Symbol image inside cell
      const img = document.createElement('img');
      img.className = 'symbol-img';
      img.alt = '';
      img.draggable = false;
      cell.appendChild(img);

      els.gridContainer.appendChild(cell);
    }
  }

  // Place initial random symbols (static, no animation)
  const symbols = Object.keys(SYMBOLS);
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const sym = symbols[Math.floor(Math.random() * 6)]; // regular symbols only (6 of them)
      const cell = document.getElementById(`cell-${col}-${row}`);
      const img = cell.querySelector('.symbol-img');
      img.src = state.images[sym].src;
      img.dataset.symbol = sym;
      img.classList.add('landed');
    }
  }
}

// ── Paytable ──
function buildPaytable() {
  els.paytableGrid.innerHTML = '';
  for (const [key, pays] of Object.entries(PAYTABLE_DISPLAY)) {
    const sym = SYMBOLS[key];
    const item = document.createElement('div');
    item.className = 'paytable-item';
    item.innerHTML = `
      <img src="${state.images[key]?.src || ''}" alt="${sym.name}">
      <div class="pay-info">
        <div class="pay-name">${key} — ${sym.name}</div>
        <div class="pay-tiers">
          5: <span>${pays['5']}</span> · 6-8: <span>${pays['6-8']}</span> · 9-12: <span>${pays['9-12']}</span> · 13+: <span>${pays['13+']}</span>
        </div>
      </div>
    `;
    els.paytableGrid.appendChild(item);
  }

  // Add Wild & Scatter info
  const specials = [
    { key: 'W', desc: 'Substitutes for ALL regular symbols in clusters' },
    { key: 'S', desc: 'Land 4+ for FREE SPINS! (4→10, 5→12, 6→15, 7→18)' },
  ];
  specials.forEach(({ key, desc }) => {
    const sym = SYMBOLS[key];
    const item = document.createElement('div');
    item.className = 'paytable-item';
    item.innerHTML = `
      <img src="${state.images[key]?.src || ''}" alt="${sym.name}">
      <div class="pay-info">
        <div class="pay-name">${key} — ${sym.name}</div>
        <div class="pay-tiers">${desc}</div>
      </div>
    `;
    els.paytableGrid.appendChild(item);
  });
}

// ── Bet Controls ──
function changeBet(dir) {
  if (state.spinning) return;
  let current = getCurrentBet();
  
  if (state.betLevels && state.betLevels.length > 0) {
    const levels = state.betLevels.sort((a, b) => a - b);
    let idx = levels.findIndex(l => Math.abs(l - current) < 0.000001);
    
    if (idx === -1) {
      // Find nearest
      idx = 0;
      let minDiff = Infinity;
      levels.forEach((l, i) => {
        if (Math.abs(l - current) < minDiff) {
          minDiff = Math.abs(l - current);
          idx = i;
        }
      });
    }
    
    idx += dir;
    if (idx < 0) idx = 0;
    if (idx >= levels.length) idx = levels.length - 1;
    current = levels[idx];
  } else {
    // Fallback if RGS didn't provide bet levels
    if (dir === 1) current *= 2;
    else current /= 2;
    current = Math.max(state.minBet || 0.00001, current);
  }
  
  // Format based on value to prevent scientific notation for small numbers and keep decimals clean
  if (current < 0.01) {
    els.betValue.value = current.toFixed(5);
  } else {
    els.betValue.value = current.toFixed(2);
  }
  adjustBetInputFontSize();
}

function adjustBetInputFontSize() {
  const chars = els.betValue.value.length;
  if (chars <= 5) {
    els.betValue.style.fontSize = '16px';
  } else if (chars <= 7) {
    els.betValue.style.fontSize = '14px';
  } else if (chars <= 9) {
    els.betValue.style.fontSize = '12px';
  } else {
    els.betValue.style.fontSize = '10px';
  }
  
  if (els.buyBonusCost) {
    const cost = (state.isFreeSpins || state.isReplay) ? 0 : parseFloat(els.betValue.value) * 200;
    els.buyBonusCost.textContent = formatCurrency(cost);
  }
}

function getCurrentBet() {
  const val = parseFloat(els.betValue.value);
  return isNaN(val) ? 0 : val;
}

// ── Spin ──
async function spin(mode = 'base') {
  if (state.spinning) return;

  const bet = getCurrentBet();
  const cost = mode === 'bonus' ? bet * 200 : (mode === 'free_spin' ? 0 : bet);
  
  state.isFreeSpins = mode === 'free_spin';
  
  if (!state.isReplay && !state.isFreeSpins && cost < (state.minBet || 0.00001)) {
    state.autoSpinsRemaining = 0;
    updateAutoSpinUI();
    showNotification("Invalid bet amount!");
    return;
  }
  
  if (!state.isReplay && !state.isFreeSpins && state.balance < cost) {
    state.autoSpinsRemaining = 0;
    updateAutoSpinUI();
    showNotification("Insufficient balance!");
    return;
  }

  state.spinning = true;
  els.btnSpin.disabled = true;
  els.btnSpin.classList.add('spinning');
  if (state.isFreeSpins) {
    els.btnSpin.querySelector('.spin-text').textContent = 'FREE SPIN';
  } else if (state.autoSpinsRemaining > 0 || state.autoSpinsRemaining === 'Infinity') {
    els.btnSpin.querySelector('.spin-text').textContent = 'STOP AUTO';
  } else if (!state.isReplay) {
    els.btnSpin.querySelector('.spin-text').textContent = 'SPIN';
  }
  els.multValue.textContent = '—';
  els.winOverlay.classList.add('hidden');

  // Clear cluster highlights
  document.querySelectorAll('.grid-cell').forEach(c => {
    c.classList.remove(
      'cluster-win', 'dimmed', 'cash-anim', 'cop-anim', 
      'flashlight-anim', 'handcuffs-anim', 'siren-anim', 
      'necklace-anim', 'watch-anim', 'gold-anim', 
      'vault-anim', 'wild-anim'
    );
  });

  // Start spin animation - instantly hide all cells
  startSpinAnimation();
  
  // Wait for drop-out animation to complete
  await sleep(100);

  try {
    let round = {};
    if (state.isReplay) {
      if (!state.replayData) throw new Error('No replay data');
      
      // Extract root properties if present
      if (state.replayData.amount !== undefined) round.amount = state.replayData.amount;
      if (state.replayData.payout !== undefined) round.payout = state.replayData.payout;
      if (state.replayData.payoutMultiplier !== undefined) round.payoutMultiplier = state.replayData.payoutMultiplier;

      let replayObj = state.replayData.data ? state.replayData.data : state.replayData;
      let innerRound = replayObj.round ? replayObj.round : replayObj;
      if (!innerRound.board && innerRound.state && !Array.isArray(innerRound.state) && innerRound.state.board) {
        innerRound = innerRound.state;
      }
      if (!innerRound.state && replayObj.state) {
        innerRound.state = replayObj.state;
      }
      
      // Merge inner round properties onto round
      Object.assign(round, innerRound);
      
      // Replay mode doesn't deduct or add to a real balance, we can just freeze the balance display
    } else {
      // Make API call
      const data = await playRound(bet, mode);
      if (data.balance && data.balance.amount !== undefined) {
        state.balance = data.balance.amount / API_MULTIPLIER;
      }
      round = data.round;
    }

    if (round.betAmount !== undefined) round.betAmount /= API_MULTIPLIER;
    if (round.amount !== undefined) round.amount /= API_MULTIPLIER;
    if (round.payout !== undefined) round.payout /= API_MULTIPLIER;
    
    // Ensure UI expected fields are present
    if (round.betAmount === undefined) round.betAmount = round.amount || bet;
    if (round.totalWin === undefined) {
      if (round.payout !== undefined) {
        round.totalWin = round.payout;
      } else if (round.payoutMultiplier !== undefined && round.betAmount > 0) {
        round.totalWin = round.payoutMultiplier * round.betAmount;
      } else {
        round.totalWin = 0;
      }
    }
    if (round.payoutMultiplier === undefined) {
      round.payoutMultiplier = round.betAmount > 0 ? (round.payout || 0) / round.betAmount : 0;
    }

    // Handle Stake Engine's Math format (events array)
    let boardData = round.board;
    let events = null;
    
    if (Array.isArray(round.state)) {
      events = round.state;
    } else if (round.state && Array.isArray(round.state.events)) {
      events = round.state.events;
    }
    
    if (events) {
      const revealEvent = events.find(e => e.type === 'reveal');
      if (revealEvent && revealEvent.board && revealEvent.board.length > 0) {
        // Detect padding from the math engine
        const padding = revealEvent.board[0].length > ROWS ? 1 : 0;
        events.paddingOffset = padding;
        
        boardData = revealEvent.board.map(col => {
          return col.slice(padding, padding + ROWS).map(s => typeof s === 'object' ? s.name : s);
        });
      }
    }

    if (!boardData || !Array.isArray(boardData) || boardData.length < COLS) {
      state.spinning = false;
      updateUI();
      showNotification("Invalid board data returned from server!");
      return;
    }

    // Make sure round.board is populated for our game logic
    round.board = boardData;

    // Wait a bit before revealing (200ms + 1050ms reveal = ~1.25s total)
    await sleep(200);

    // Stop spinning and reveal board column by column
    await revealBoard(round.board);

    // Show results
    await sleep(300);

    let hasClusters = round.clusters && round.clusters.length > 0;
    if (!hasClusters && events) {
      hasClusters = events.some(e => e.type === 'winInfo' && e.wins && e.wins.length > 0);
    }
    const hasFreeSpins = round.freeSpinsAwarded > 0;

    if (hasClusters || hasFreeSpins) {
      await showWins(round);
    }

    if (round && round.active && round.totalWin > 0) {
      await endRound();
    }

    updateUI();
  } catch (e) {
    console.error('Spin failed:', e);
    showNotification(`Spin Error: ${e.message}`);
    // Clear spin animation on error
    const cells = document.querySelectorAll('.grid-cell .symbol-img');
    cells.forEach(img => {
      img.classList.remove('spinning');
    });
  }

  state.spinning = false;
  els.btnSpin.disabled = false;
  els.btnSpin.classList.remove('spinning');
  if (state.isReplay) {
    els.btnSpin.querySelector('.spin-text').textContent = 'PLAY AGAIN';
  } else if (state.autoSpinsRemaining === 0 && state.freeSpinsRemaining === 0) {
    els.btnSpin.querySelector('.spin-text').textContent = 'SPIN';
    state.isFreeSpins = false;
  }
  updateUI();

  if (state.freeSpinsRemaining > 0) {
    state.freeSpinsRemaining--;
    // Update UI to show free spins remaining if needed
    setTimeout(() => spin('free_spin'), state.isFastSpin ? 200 : 800);
  } else if (state.autoSpinsRemaining === 'Infinity' || state.autoSpinsRemaining > 0) {
    if (state.autoSpinsRemaining !== 'Infinity') {
      state.autoSpinsRemaining--;
    }
    updateAutoSpinUI();
    if (!state.isReplay && (state.autoSpinsRemaining === 'Infinity' || state.autoSpinsRemaining > 0)) {
      setTimeout(() => spin(), state.isFastSpin ? 200 : 800);
    }
  }
}

// ── Spin Animation ──
function startSpinAnimation() {
  const cells = document.querySelectorAll('.grid-cell .symbol-img');
  cells.forEach(img => {
    img.style.animationDelay = '0s';
    img.classList.remove('landed');
    img.classList.add('spinning');
  });
}

// Background balance polling (keeps UI up to date with Social/Real switching)
setInterval(async () => {
  if (state.spinning || !SESSION_ID) return;
  try {
    const res = await fetch(`${API_BASE}/wallet/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionID: SESSION_ID })
    });
    const data = await res.json();
    if (data.balance && data.balance.amount !== undefined) {
      state.balance = data.balance.amount / API_MULTIPLIER;
      updateUI();
    }
  } catch (e) {
    // Ignore silent polling errors
  }
}, 5000);

async function revealBoard(board) {
  // First: set all images to their new symbols but keep them hidden
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const sym = board[col][row];
      const cell = document.getElementById(`cell-${col}-${row}`);
      const img = cell.querySelector('.symbol-img');
      img.classList.remove('spinning');
      img.classList.remove('landed');
      img.style.opacity = '0';
      img.style.transform = 'translateY(-250%)';
      img.style.animationDelay = '0s';
      img.src = state.images[sym]?.src || '';
      img.dataset.symbol = sym;
    }
  }

  // Timing per sprite drop (ms) — 49 sprites * 15ms = ~0.75s total cascade
  const SPRITE_DELAY = state.isFastSpin ? 6 : 15;
  
  // Drop sprites one by one: left-to-right columns, top-to-bottom rows
  return new Promise(resolve => {
    let index = 0;
    const totalCells = COLS * ROWS;
    
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const currentIndex = index;
        const delay = currentIndex * SPRITE_DELAY;
        
        setTimeout(() => {
          const cell = document.getElementById(`cell-${col}-${row}`);
          const img = cell.querySelector('.symbol-img');
          
          // Reset inline styles and trigger landing animation
          img.style.opacity = '';
          img.style.transform = '';
          img.classList.add('landed');
          
          // Play a subtle land sound every few sprites
          if (currentIndex % ROWS === 0) {
            playSound('land');
          }
          
          // Resolve when last sprite has landed
          if (currentIndex === totalCells - 1) {
            setTimeout(() => {
              state.board = board;
              resolve();
            }, 250);
          }
        }, delay);
        
        index++;
      }
    }
  });
}

async function showWins(round) {
  const { totalWin, payoutMultiplier, betAmount } = round;
  
  // Play appropriate win sound based on multiplier
  if (payoutMultiplier >= 5.0) {
    playSound('winBig'); // Big and Mega wins
  } else if (payoutMultiplier >= 1.1) {
    playSound('winSmall'); // Small wins
  } else if (payoutMultiplier > 0) {
    playSound('minWin'); // Minimal wins (< 1.1x)
  }
  
  let clusters = round.clusters || [];
  let scatters = round.scatters;
  let freeSpinsAwarded = round.freeSpinsAwarded || 0;

  // Extract from Stake Engine's math events
  let events = null;
  if (Array.isArray(round.state)) {
    events = round.state;
  } else if (round.state && Array.isArray(round.state.events)) {
    events = round.state.events;
  }
  
  if (events) {
    const parsedClusters = [];
    let parsedScatters = { count: 0, positions: [] };

    events.forEach(e => {
      if (e.type === 'winInfo' && e.wins) {
        e.wins.forEach(w => {
          parsedClusters.push({
            symbol: w.symbol,
            win: w.win,
            multiplier: w.clusterMult || 1,
            positions: w.positions.map(p => ({ 
              col: p.reel !== undefined ? p.reel : p.col, 
              row: p.row - (events.paddingOffset || 0)
            }))
          });
        });
      }
    });
    
    // Find scatters by iterating the board
    if (round.board) {
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          if (round.board[c][r] === 'S') {
             parsedScatters.count++;
             parsedScatters.positions.push({ col: c, row: r });
          }
        }
      }
    }
    
    if (parsedClusters.length > 0) clusters = parsedClusters;
    if (parsedScatters.count > 0) scatters = parsedScatters;
    
    // Free spins awarded (depends on Scatter count for Cops & Robbers!)
    if (parsedScatters.count >= 4) {
       freeSpinsAwarded = { 4: 10, 5: 12, 6: 15, 7: 18 }[Math.min(parsedScatters.count, 7)] || 20;
    }
  }

  // Dim all cells first
  document.querySelectorAll('.grid-cell').forEach(c => c.classList.add('dimmed'));

  // Highlight winning clusters
  clusters.forEach(cluster => {
    cluster.positions.forEach(pos => {
      const cell = document.getElementById(`cell-${pos.col}-${pos.row}`);
      if (cell) {
        cell.classList.remove('dimmed');
        cell.classList.add('cluster-win');
        if (round.board[pos.col] && round.board[pos.col][pos.row] === 'W') {
          // If it's a Wild, ONLY play the wild animation
          cell.classList.add('wild-anim');
          setTimeout(() => cell.classList.remove('wild-anim'), 2400);
        } else {
          // Play the normal cluster symbol animation
          if (cluster.symbol === 'H4') {
            cell.classList.add('cash-anim');
            setTimeout(() => cell.classList.remove('cash-anim'), 2400);
          }
          if (cluster.symbol === 'L1') {
            cell.classList.add('cop-anim');
            setTimeout(() => cell.classList.remove('cop-anim'), 2400);
          }
          if (cluster.symbol === 'L4') {
            cell.classList.add('flashlight-anim');
            setTimeout(() => cell.classList.remove('flashlight-anim'), 2400);
          }
          if (cluster.symbol === 'L2') {
            cell.classList.add('handcuffs-anim');
            setTimeout(() => cell.classList.remove('handcuffs-anim'), 2400);
          }
          if (cluster.symbol === 'L3') {
            cell.classList.add('siren-anim');
            setTimeout(() => cell.classList.remove('siren-anim'), 2400);
          }
          if (cluster.symbol === 'H1') {
            cell.classList.add('necklace-anim');
            setTimeout(() => cell.classList.remove('necklace-anim'), 3500);
          }
          if (cluster.symbol === 'H2') {
            cell.classList.add('watch-anim');
            setTimeout(() => cell.classList.remove('watch-anim'), 2400);
          }
          if (cluster.symbol === 'H3') {
            cell.classList.add('gold-anim');
            setTimeout(() => cell.classList.remove('gold-anim'), 2400);
          }
        }
      }
    });
  });

  // Animate Scatters only if they triggered free spins
  if (freeSpinsAwarded > 0 && scatters && scatters.positions) {
    scatters.positions.forEach(pos => {
      const cell = document.getElementById(`cell-${pos.col}-${pos.row}`);
      if (cell) {
        cell.classList.remove('dimmed');
        cell.classList.add('vault-anim');
        setTimeout(() => cell.classList.remove('vault-anim'), 3500);
      }
    });

    // Show free spins text immediately alongside the vault animation
    await showFreeSpins(freeSpinsAwarded);
    state.freeSpinsRemaining = freeSpinsAwarded;
  }

  // Trigger diamond overlay for Necklace win
  const hasNecklaceWin = clusters.some(c => c.symbol === 'H1');
  if (hasNecklaceWin) {
    const diamondOverlay = document.getElementById('diamond-overlay');
    diamondOverlay.classList.remove('hidden');
    diamondOverlay.classList.add('active');
    setTimeout(() => {
      diamondOverlay.classList.remove('active');
      diamondOverlay.classList.add('hidden');
    }, 3500);
  }

  els.multValue.textContent = `${payoutMultiplier.toFixed(1)}x`;

  // Show win overlay for ALL wins > 0
  // Skip if we already showed the Heist Bonus overlay to avoid overlapping
  if (payoutMultiplier > 0 && !(round.freeSpinsAwarded > 0 && round.scatters && round.scatters.positions)) {
    let popupDuration = 3000;
    
    if (payoutMultiplier >= 20) {
      els.winOverlay.querySelector('.win-label').textContent = 'MEGA WIN!';
      els.winOverlay.classList.remove('small-win');
      els.winOverlay.classList.remove('hidden');
    } else if (payoutMultiplier >= 10) {
      els.winOverlay.querySelector('.win-label').textContent = 'SUPER WIN!';
      els.winOverlay.classList.remove('small-win');
      els.winOverlay.classList.remove('hidden');
    } else if (payoutMultiplier >= 5) {
      els.winOverlay.querySelector('.win-label').textContent = 'BIG WIN!';
      els.winOverlay.classList.remove('small-win');
      els.winOverlay.classList.remove('hidden');
    } else if (payoutMultiplier >= 1) {
      els.winOverlay.querySelector('.win-label').textContent = 'WIN!';
      els.winOverlay.classList.add('small-win');
      els.winOverlay.classList.remove('hidden');
      popupDuration = 1500;
    } else {
      els.winOverlay.querySelector('.win-label').textContent = '';
      els.winOverlay.classList.add('small-win');
      els.winOverlay.classList.remove('hidden');
      popupDuration = 1000; // Shorter popup for < 1x wins
    }
    // Adjust popup duration if fast spin is active so animation timing matches the sleep
    const actualSleepDuration = state.isFastSpin ? Math.max(popupDuration / 2.5, 750) : popupDuration;
    
    // Determine optimal decimal places based on the final win amount
    const winStr = parseFloat(totalWin.toFixed(5)).toString();
    let targetDecimals = 2;
    if (winStr.includes('.')) {
      targetDecimals = Math.max(2, winStr.split('.')[1].length);
    }

    // Animate the win amount incrementing
    const animDuration = Math.min(actualSleepDuration * 0.7, 1500); // 70% of popup time, max 1.5s
    const start = performance.now();
    const animateWin = (time) => {
      const progress = Math.min((time - start) / animDuration, 1);
      const currentVal = totalWin * progress;
      els.overlayWinAmount.textContent = `+${currentVal.toFixed(targetDecimals)}`;
      if (progress < 1) requestAnimationFrame(animateWin);
      else els.overlayWinAmount.textContent = `+${formatCurrency(totalWin)}`;
    };
    requestAnimationFrame(animateWin);

    // Enforce minimum legibility time in fast spin (750ms minimum)
    await sleep(popupDuration, 750);
    
    els.winOverlay.classList.add('hidden');
    els.winOverlay.classList.remove('small-win');
  }

  // Clear highlights after a delay
  await sleep(2000, 750);
  document.querySelectorAll('.grid-cell').forEach(c => {
    c.classList.remove('cluster-win', 'dimmed', 'cash-anim', 'cop-anim', 'siren-anim', 'gold-anim', 'wild-anim', 'watch-anim', 'necklace-anim', 'vault-anim');
  });
}

async function showFreeSpins(count) {
  els.overlayWinAmount.textContent = `${count} FREE SPINS!`;
  els.winOverlay.querySelector('.win-label').textContent = 'HEIST BONUS!';
  els.winOverlay.classList.remove('hidden');
  await sleep(3000);
  els.winOverlay.classList.add('hidden');
}

// ── UI Updates ──
function updateUI() {
  els.balanceValue.textContent = formatCurrency(state.balance);
  
  if (state.freeSpinsRemaining > 0 || state.isFreeSpins) {
    els.fsCount.textContent = state.freeSpinsRemaining;
    els.freeSpinsIndicator.classList.remove('hidden');
  } else {
    els.freeSpinsIndicator.classList.add('hidden');
  }
}

function updateAutoSpinUI() {
  const active = state.autoSpinsRemaining > 0 || state.autoSpinsRemaining === 'Infinity';
  els.autoSpinCount.textContent = state.autoSpinsRemaining === 'Infinity' ? '∞' : (state.autoSpinsRemaining > 0 ? state.autoSpinsRemaining : '');
  els.btnAutoSpin.classList.toggle('active', active);
  const icon = els.btnAutoSpin.querySelector('svg');
  if (icon) {
    icon.style.display = active ? 'none' : 'block';
  }
}

function showNotification(msg) {
  const popup = document.getElementById('notification-popup');
  const text = document.getElementById('notification-text');
  text.textContent = msg;
  popup.classList.remove('hidden');
  
  if (state.notificationTimeout) {
    clearTimeout(state.notificationTimeout);
  }
  
  state.notificationTimeout = setTimeout(() => {
    popup.classList.add('hidden');
  }, 2500);
}

// ── Utilities ──
function formatCurrency(amount) {
  let str = amount.toFixed(8);
  str = parseFloat(str).toString(); // Strip trailing zeroes
  
  // Ensure at least 2 decimal places
  if (str.indexOf('.') === -1) {
    str += '.00';
  } else if (str.split('.')[1].length === 1) {
    str += '0';
  }
  
  return str;
}

const sleep = (ms, minFastMs = 0) => new Promise(r => {
  let finalMs = state.isFastSpin ? ms / 2.5 : ms;
  if (state.isFastSpin && minFastMs > 0) {
    finalMs = Math.max(finalMs, minFastMs);
  }
  setTimeout(r, finalMs);
});

// ── Sweeps & Social Translation ──
function applySocialTranslations() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('social') !== 'true') return;

  // Change currency symbol to generic SC
  for (const key in CurrencyMeta) {
    if (CurrencyMeta[key].symbol === '$') CurrencyMeta[key].symbol = 'SC ';
    else CurrencyMeta[key].symbol = '';
  }

  const dictionary = {
    '\\bbet\\b': 'play',
    '\\bbets\\b': 'plays',
    '\\bbetting\\b': 'playing',
    '\\btotal bet\\b': 'total play',
    '\\bpay out\\b': 'win',
    '\\bpaid out\\b': 'won',
    '\\bstake\\b': 'play amount',
    '\\bpays out\\b': 'win',
    '\\bcash\\b': 'coins',
    '\\bpayer\\b': 'winner',
    '\\bpay\\b': 'win',
    '\\bpays\\b': 'wins',
    '\\bpaid\\b': 'won',
    '\\bmoney\\b': 'coins',
    '\\bbuy\\b': 'play',
    '\\bbought\\b': 'instantly triggered',
    '\\bpurchase\\b': 'play',
    '\\bat the cost of\\b': 'for',
    '\\brebet\\b': 'respin',
    '\\bcost of\\b': 'can be played for',
    '\\bcredit\\b': 'balance',
    '\\bbuy bonus\\b': 'get bonus',
    '\\bgamble\\b': 'play',
    '\\bwager\\b': 'play',
    '\\bdeposit\\b': 'get coins',
    '\\bwithdraw\\b': 'redeem',
    '\\bbonus buy\\b': 'feature',
    '\\bcurrency\\b': 'token',
    '\\bfund\\b': 'balance',
    '\\bPAYTABLE\\b': 'WINTABLE',
    '\\bPAYTABLES\\b': 'WINTABLES'
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodesToReplace = [];
  while ((node = walker.nextNode())) {
    if (node.parentElement && ['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) continue;
    nodesToReplace.push(node);
  }

  nodesToReplace.forEach(node => {
    let text = node.nodeValue;
    let changed = false;
    for (const [key, value] of Object.entries(dictionary)) {
      const regex = new RegExp(key, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, (match) => {
          if (match === match.toUpperCase()) return value.toUpperCase();
          if (match[0] === match[0].toUpperCase()) return value.charAt(0).toUpperCase() + value.slice(1);
          return value;
        });
        changed = true;
      }
    }
    if (changed) node.nodeValue = text;
  });
}
