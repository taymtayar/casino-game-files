const request = require('supertest');
const server = require('./server'); // Import the entire module
const { app, redisClient } = server;

// This is a more robust way to mock a function from the same module
// that the tests are exercising.
jest.spyOn(server, 'getProvablyFairResult');

// We don't need to start the server here, supertest does it for us.

describe('iGaming RGS API', () => {

    // Before any tests run, connect to the Redis client.
    beforeAll(async () => {
        await redisClient.connect();
    });

    // Before each test, reset the mocks to ensure a clean state
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // After all tests are finished, close the Redis connection
    // to allow Jest to exit gracefully.
    afterAll(async () => {
        await redisClient.flushAll(); // Clean up the test database
        await redisClient.quit();
    });

    describe('Full Game Loop Simulation', () => {
        let balance = 100.00;
        const betAmount = 1.00;

        it('should successfully place a bet and return a win on Step 1', async () => {
            // Force a win on Step 1 (roll < 0.4825) and a specific outcome on Step 2
            // We mock the implementation for this specific test run
            server.getProvablyFairResult.mockReturnValueOnce(0.1);  // Step 1 roll -> WIN
            server.getProvablyFairResult.mockReturnValueOnce(0.2); // Step 2 roll -> Uncommon Win

            const response = await request(app)
                .post('/api/bet')
                .send({
                    clientSeed: 'test-seed-happy-path',
                    betAmount: betAmount,
                    balance: balance,
                });

            // Assertions: Check if the API behaved correctly
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('round_id');
            expect(response.body.step_1_outcome).toBe('win');
            
            // Update our mock casino balance
            balance = response.body.balance;
            expect(balance).toBe(99.00);

            global.roundId = response.body.round_id;
        });

        it('should successfully double down and return a final outcome', async () => {
            // This test depends on the previous one setting a global roundId.
            if (!global.roundId) {
                throw new Error('Cannot run double down test because roundId was not set in the previous test.');
            }

            const response = await request(app)
                .post('/api/doubledown')
                .send({
                    round_id: global.roundId,
                    balance: balance,
                });

            expect(response.status).toBe(200);
            // Because we controlled the RNG, we can now test for an exact outcome
            expect(response.body.step_2_tier).toBe('Uncommon');
            expect(response.body.final_multiplier).toBe(3.50);
            expect(response.body.amount_won).toBe(3.50);

            // Verify the final balance calculation is correct
            const expectedBalance = 99.00 + 3.50;
            expect(response.body.balance).toBe(expectedBalance);
        });
    });
});
