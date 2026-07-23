document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let balance = 100.00;
    const betAmount = 1.00;
    let currentRoundId = null;

    // --- DOM Elements ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const messageEl = document.getElementById('message');
    const betBtn = document.getElementById('bet-btn');
    const doubledownBtn = document.getElementById('doubledown-btn');
    const cashoutBtn = document.getElementById('cashout-btn');

    // --- UI Update Functions ---
    const updateBalance = (newBalance) => {
        balance = newBalance;
        balanceAmountEl.textContent = balance.toFixed(2);
    };

    const showMessage = (msg) => {
        messageEl.textContent = msg;
    };

    const setGameState = (state) => {
        betBtn.classList.toggle('hidden', state !== 'ready');
        doubledownBtn.classList.toggle('hidden', state !== 'decision');
        cashoutBtn.classList.toggle('hidden', state !== 'decision');
    };

    // --- API Call Functions ---
    const handleBet = async () => {
        setGameState('loading');
        showMessage('Placing bet...');

        try {
            const response = await fetch('/api/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientSeed: `client-seed-${Date.now()}`,
                    betAmount,
                    balance,
                }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Bet failed');

            updateBalance(data.balance);
            if (data.step_1_outcome === 'win') {
                currentRoundId = data.round_id;
                showMessage('You won Step 1! Double down or cash out?');
                setGameState('decision');
            } else {
                showMessage('Bust! You lost the initial bet. Try again.');
                setGameState('ready');
            }
        } catch (err) {
            showMessage(err.message);
            setGameState('ready');
        }
    };

    const handleAction = async (endpoint) => {
        setGameState('loading');
        showMessage('Revealing outcome...');

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    round_id: currentRoundId,
                    balance,
                }),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Action failed');

            updateBalance(data.balance);
            if (endpoint === '/api/doubledown') {
                showMessage(`You hit a ${data.step_2_tier} tier! Won ${data.amount_won.toFixed(2)}.`);
            } else {
                showMessage(`Cashed out successfully! Won ${data.amount_won.toFixed(2)}.`);
            }
        } catch (err) {
            showMessage(err.message);
        } finally {
            currentRoundId = null;
            setGameState('ready');
        }
    };

    // --- Event Listeners ---
    betBtn.addEventListener('click', handleBet);
    doubledownBtn.addEventListener('click', () => handleAction('/api/doubledown'));
    cashoutBtn.addEventListener('click', () => handleAction('/api/cashout'));

    // --- Initial Setup ---
    updateBalance(balance);
    setGameState('ready');
});