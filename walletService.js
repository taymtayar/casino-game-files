const axios = require('axios');
const crypto = require('crypto');

// The base URL of the Casino Operator's Seamless Wallet API
// Default to our local mock operator for testing if not provided in .env
const OPERATOR_API_URL = process.env.OPERATOR_API_URL || 'http://localhost:4000/wallet';

// The secret key used to sign requests so the operator knows they came from us
const OPERATOR_SECRET_KEY = process.env.OPERATOR_SECRET_KEY || 'test_secret_key_123';

/**
 * Generates an HMAC-SHA256 signature for the request body.
 * @param {object} payload - The JSON payload to be signed.
 * @returns {string} The hex signature.
 */
const generateSignature = (payload) => {
    const hmac = crypto.createHmac('sha256', OPERATOR_SECRET_KEY);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
};

/**
 * Helper to execute the signed HTTP request to the operator.
 */
const sendSignedRequest = async (endpoint, payload) => {
    const signature = generateSignature(payload);
    
    try {
        const response = await axios.post(`${OPERATOR_API_URL}${endpoint}`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature
            },
            timeout: 5000 // 5 second timeout so game doesn't hang
        });
        return response.data;
    } catch (error) {
        console.error(`[WalletService] Request to ${endpoint} failed:`, error.message);
        if (error.response) {
            console.error(`[WalletService] Operator Error Response:`, error.response.data);
            throw new Error(error.response.data.error || 'Operator declined the transaction');
        }
        throw new Error('Communication with operator failed');
    }
};

/**
 * Wallet Service API Methods
 */
const walletService = {
    /**
     * Fetch the player's real-time balance from the casino operator.
     */
    getBalance: async (token, playerId) => {
        const payload = { token, player_id: playerId };
        const data = await sendSignedRequest('/balance', payload);
        return data.balance;
    },

    /**
     * Deduct money from the player's casino wallet (for a bet).
     */
    debit: async (token, playerId, amount, roundId, transactionId) => {
        const payload = {
            token,
            player_id: playerId,
            amount,
            round_id: roundId,
            transaction_id: transactionId,
            currency: 'USD',
            description: 'Bet placed'
        };
        const data = await sendSignedRequest('/debit', payload);
        return data.balance; // The new balance after debit
    },

    /**
     * Add money to the player's casino wallet (for a win).
     */
    credit: async (token, playerId, amount, roundId, transactionId) => {
        const payload = {
            token,
            player_id: playerId,
            amount,
            round_id: roundId,
            transaction_id: transactionId,
            currency: 'USD',
            description: 'Bet won'
        };
        const data = await sendSignedRequest('/credit', payload);
        return data.balance; // The new balance after credit
    },

    /**
     * Refund money to the player's casino wallet if a round fails.
     */
    rollback: async (token, playerId, amount, roundId, transactionId) => {
        const payload = {
            token,
            player_id: playerId,
            amount,
            round_id: roundId,
            transaction_id: transactionId,
            currency: 'USD',
            description: 'Round rolled back due to error'
        };
        const data = await sendSignedRequest('/rollback', payload);
        return data.balance;
    }
};

module.exports = walletService;
