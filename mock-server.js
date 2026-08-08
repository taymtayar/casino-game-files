import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8080;
let balance = 100000 * 1000000;

// ── Paytable (cluster sizes → multiplier × bet) ──
const PAYTABLE = {
  H1: { 5: 5.0, 6: 12.5, 7: 12.5, 8: 12.5, 9: 25.0, 10: 25.0, 11: 25.0, 12: 25.0, 13: 60.0 },
  H2: { 5: 2.0, 6: 5.0,  7: 5.0,  8: 5.0,  9: 10.0, 10: 10.0, 11: 10.0, 12: 10.0, 13: 40.0 },
  H3: { 5: 1.3, 6: 3.2,  7: 3.2,  8: 3.2,  9: 7.0,  10: 7.0,  11: 7.0,  12: 7.0,  13: 30.0 },
  H4: { 5: 1.0, 6: 2.5,  7: 2.5,  8: 2.5,  9: 6.0,  10: 6.0,  11: 6.0,  12: 6.0,  13: 20.0 },
  L1: { 5: 0.6, 6: 1.5,  7: 1.5,  8: 1.5,  9: 4.0,  10: 4.0,  11: 4.0,  12: 4.0,  13: 10.0 },
  L2: { 5: 0.4, 6: 1.2,  7: 1.2,  8: 1.2,  9: 3.5,  10: 3.5,  11: 3.5,  12: 3.5,  13: 8.0  },
  L3: { 5: 0.2, 6: 0.8,  7: 0.8,  8: 0.8,  9: 2.5,  10: 2.5,  11: 2.5,  12: 2.5,  13: 5.0  },
  L4: { 5: 0.1, 6: 0.5,  7: 0.5,  8: 0.5,  9: 1.5,  10: 1.5,  11: 1.5,  12: 1.5,  13: 4.0  },
};

function getPayMultiplier(symbol, clusterSize) {
  if (clusterSize < 5) return 0;
  const table = PAYTABLE[symbol];
  if (!table) return 0;
  const key = Math.min(clusterSize, 13);
  return table[key] || 0;
}

// ── Generate random 6×5 board ──
function generateBoard() {
  const symbols = ['H1','H2','H3','H4','L1','L2','L3','L4'];
  const weights = [6,  10,  13,  16,  20,  22,  25,  30];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const board = [];

  for (let col = 0; col < 7; col++) {
    const column = [];
    for (let row = 0; row < 7; row++) {
      let r = Math.random() * totalWeight;
      let symbol = symbols[symbols.length - 1];
      for (let i = 0; i < symbols.length; i++) {
        r -= weights[i];
        if (r <= 0) { symbol = symbols[i]; break; }
      }
      // 3% chance of Wild
      if (Math.random() < 0.03) symbol = 'W';
      // 2% chance of Scatter
      if (Math.random() < 0.02) symbol = 'S';
      
      column.push(symbol);
    }
    board.push(column);
  }

  return board;
}

// ── Cluster detection via flood-fill ──
function findClusters(board) {
  const rows = 7, cols = 7;
  const visited = Array.from({ length: cols }, () => Array(rows).fill(false));
  const clusters = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (visited[c][r]) continue;
      const sym = board[c][r];
      if (sym === 'S') { visited[c][r] = true; continue; }

      // Flood-fill
      const cluster = [];
      const stack = [[c, r]];
      while (stack.length > 0) {
        const [cc, rr] = stack.pop();
        if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue;
        if (visited[cc][rr]) continue;

        const cellSym = board[cc][rr];
        const matches = cellSym === sym || cellSym === 'W' || sym === 'W';
        if (!matches) continue;

        visited[cc][rr] = true;
        cluster.push({ col: cc, row: rr, symbol: cellSym });
        stack.push([cc - 1, rr], [cc + 1, rr], [cc, rr - 1], [cc, rr + 1]);
      }

      if (cluster.length >= 5) {
        // Determine the primary symbol (non-wild) in the cluster
        const nonWild = cluster.find(c => c.symbol !== 'W');
        const paySym = nonWild ? nonWild.symbol : 'H1'; // all wilds = highest pay
        clusters.push({
          symbol: paySym,
          size: cluster.length,
          positions: cluster.map(c => ({ col: c.col, row: c.row })),
          multiplier: getPayMultiplier(paySym, cluster.length),
        });
      }
    }
  }
  return clusters;
}

// ── Count scatters ──
function countScatters(board) {
  let count = 0;
  const positions = [];
  const cols = board.length;
  const rows = cols > 0 ? board[0].length : 0;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (board[c][r] === 'S') { count++; positions.push({ col: c, row: r }); }
    }
  }
  return { count, positions };
}

// ── MIME types ──
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ── API Routes ──
  if (req.url === '/wallet/authenticate' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      balance: { amount: balance, currency: 'USD' },
      activeBet: null,
      config: {
        game: 'cops_and_robbers',
        provider: 'stake_engine',
        version: '1.0',
        minBet: 0.10 * 1000000,
        maxBet: 1000.00 * 1000000,
        stepBet: 0.10 * 1000000,
        betLevels: [0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50, 100].map(x => x * 1000000),
        defaultBetLevel: 0.10 * 1000000,
        betModes: { BASE: { mode: 'BASE', costMultiplier: 1, feature: false } },
        currencies: ['USD'],
      },
    }));
    return;
  }

  if (req.url === '/wallet/play' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      const betAmount = data.amount || 10;
      const isBonus = data.mode === 'bonus';
      const isFreeSpin = data.mode === 'free_spin';
      
      const costAmount = isBonus ? betAmount * 200 : (isFreeSpin ? 0 : betAmount);
      balance -= costAmount;

      const board = generateBoard();
      
      if (isBonus) {
        // Force 4 scatters on the board for the mock server to simulate the bonus buy
        board[0][0] = 'S';
        board[1][1] = 'S';
        board[2][2] = 'S';
        board[3][3] = 'S';
      }

      const clusters = findClusters(board);
      const scatters = countScatters(board);

      let totalWin = 0;
      clusters.forEach(cl => { totalWin += cl.multiplier * betAmount; });
      totalWin = Math.round(totalWin * 100) / 100;
      balance += totalWin;

      const freeSpinsAwarded = scatters.count >= 4
        ? { 4: 10, 5: 12, 6: 15, 7: 18 }[Math.min(scatters.count, 7)] || 20
        : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        balance: { amount: balance, currency: 'USD' },
        round: {
          active: false,
          betAmount,
          totalWin,
          payoutMultiplier: betAmount > 0 ? totalWin / betAmount : 0,
          board,
          clusters,
          scatters: scatters.count > 0 ? scatters : null,
          freeSpinsAwarded,
          state: [
            {
              type: 'reveal',
              board: board,
              paddingPositions: [],
              anticipation: [],
              gameType: 'base'
            },
            {
              type: 'finalWin',
              amount: totalWin
            }
          ]
        },
      }));
    });
    return;
  }

  if (req.url === '/wallet/end-round' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ balance: { amount: balance, currency: 'USD' } }));
    return;
  }

  // ── Mock Replay Endpoint ──
  // GET {rgs_url}/bet/replay/{game}/{version}/{mode}/{event}
  if (req.url.startsWith('/bet/replay/') && req.method === 'GET') {
    const parts = req.url.split('/');
    // e.g. ["", "bet", "replay", "cops_and_robbers", "1", "SUPER", "55"]
    const betAmount = 10;
    const board = generateBoard();
    const clusters = findClusters(board);
    const scatters = countScatters(board);
    
    let totalWin = 0;
    clusters.forEach(cl => { totalWin += cl.multiplier * betAmount; });
    totalWin = Math.round(totalWin * 100) / 100;
    
    const freeSpinsAwarded = scatters.count >= 4
      ? { 4: 10, 5: 12, 6: 15, 7: 18 }[Math.min(scatters.count, 7)] || 20
      : 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      payoutMultiplier: betAmount > 0 ? totalWin / betAmount : 0,
      costMultiplier: 1.0,
      state: {
        active: false,
        betAmount,
        totalWin,
        payoutMultiplier: betAmount > 0 ? totalWin / betAmount : 0,
        board,
        clusters,
        scatters: scatters.count > 0 ? scatters : null,
        freeSpinsAwarded,
      }
    }));
    return;
  }

  // ── Static file serving ──
  let filePath;
  const pathname = req.url.split('?')[0];
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'frontend', 'index.html');
  } else {
    // Serve from frontend directory
    const cleanUrl = decodeURIComponent(pathname);
    filePath = path.join(__dirname, 'frontend', cleanUrl);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🎰 Cops & Robbers Slot Game`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Open in browser to play!\n`);
});
