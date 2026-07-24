const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 4000;
const SECRET_KEY = 'test_secret_key_123'; // Must match walletService.js

app.use(express.json());

// In-memory mock database of player balances
const players = {
    'player_1': { balance: 5000 }, // $50.00
    'player_2': { balance: 1000 }  // $10.00
};

/**
 * Middleware to verify the HMAC-SHA256 signature from the Game Server
 */
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-signature'];
    
    if (!signature) {
        return res.status(401).json({ error: "Missing signature" });
    }

    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
        console.error("Signature mismatch!");
        return res.status(401).json({ error: "Invalid signature" });
    }

    next();
};

app.post('/wallet/balance', verifySignature, (req, res) => {
    const { player_id } = req.body;
    const player = players[player_id];
    
    if (!player) return res.status(404).json({ error: "Player not found" });
    
    console.log(`[Mock Casino] Balance requested for ${player_id}: $${player.balance}`);
    res.json({ balance: player.balance });
});

app.post('/wallet/debit', verifySignature, (req, res) => {
    const { player_id, amount, transaction_id } = req.body;
    const player = players[player_id];

    if (!player) return res.status(404).json({ error: "Player not found" });
    if (player.balance < amount) return res.status(400).json({ error: "Insufficient funds" });

    player.balance -= amount;
    console.log(`[Mock Casino] DEBIT $${amount} from ${player_id}. New Balance: $${player.balance}. (Trx: ${transaction_id})`);
    
    res.json({ balance: player.balance });
});

app.post('/wallet/credit', verifySignature, (req, res) => {
    const { player_id, amount, transaction_id } = req.body;
    const player = players[player_id];

    if (!player) return res.status(404).json({ error: "Player not found" });

    player.balance += amount;
    console.log(`[Mock Casino] CREDIT $${amount} to ${player_id}. New Balance: $${player.balance}. (Trx: ${transaction_id})`);
    
    res.json({ balance: player.balance });
});

app.post('/wallet/rollback', verifySignature, (req, res) => {
    const { player_id, amount, transaction_id } = req.body;
    const player = players[player_id];

    if (!player) return res.status(404).json({ error: "Player not found" });

    player.balance += amount; // Rollback adds the deducted bet back
    console.log(`[Mock Casino] ROLLBACK $${amount} for ${player_id}. New Balance: $${player.balance}. (Trx: ${transaction_id})`);
    
    res.json({ balance: player.balance });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock Casino Operator Server running on http://localhost:${PORT}`);
});
