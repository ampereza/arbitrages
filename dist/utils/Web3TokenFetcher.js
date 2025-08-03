"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3TokenFetcher = void 0;
const web3_1 = __importDefault(require("web3"));
const abis_1 = require("../constants/abis");
const addresses_1 = require("../constants/addresses");
const abis_2 = require("../constants/abis");
const QUOTER_ABI = [
    {
        "inputs": [
            { "type": "address", "name": "tokenIn" },
            { "type": "address", "name": "tokenOut" },
            { "type": "uint24", "name": "fee" },
            { "type": "uint256", "name": "amountIn" },
            { "type": "uint160", "name": "sqrtPriceLimitX96" }
        ],
        "name": "quoteExactInputSingle",
        "outputs": [{ "type": "uint256", "name": "amountOut" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
// Minimum reserves required for a pair to be considered active (in USD value)
const MIN_LIQUIDITY_USD = 10000; // $10k minimum liquidity
class Web3TokenFetcher {
    constructor(providerUrl, config = {}) {
        this.lastRequestTime = 0;
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 5;
        this.providerUrl = providerUrl;
        // Required fields with defaults from DEX_ADDRESSES
        const network = config.network || 'arbitrum';
        const dexAddresses = addresses_1.DEX_ADDRESSES[network];
        this.config = {
            factoryAddress: config.factoryAddress || dexAddresses.UNISWAP_V2_FACTORY,
            baseTokens: config.baseTokens || [
                dexAddresses.WETH,
                dexAddresses.USDC,
                dexAddresses.USDT
            ],
            supportedTokens: config.supportedTokens || [
                dexAddresses.WETH,
                dexAddresses.USDC,
                dexAddresses.USDT
            ],
            excludedTokens: config.excludedTokens || [],
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            rateLimit: config.rateLimit || 1000,
            network: network,
            minLiquidityUsd: config.minLiquidityUsd || MIN_LIQUIDITY_USD,
            debug: config.debug || false
        };
        const provider = new web3_1.default.providers.HttpProvider(this.providerUrl, {
            timeout: 30000,
            keepAlive: true,
        });
        this.web3 = new web3_1.default(provider);
        this.maxRetries = this.config.maxRetries;
        this.retryDelay = this.config.retryDelay;
        this.rateLimit = this.config.rateLimit;
        this.network = this.config.network;
        this.minLiquidityUsd = this.config.minLiquidityUsd;
        this.debug = this.config.debug;
        this.log('Initializing Web3TokenFetcher...');
        // Initialize the factory contract
        this.factoryContract = new this.web3.eth.Contract(abis_1.FACTORY_V2_ABI, addresses_1.DEX_ADDRESSES[this.network].UNISWAP_V2_FACTORY);
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimit) {
            await this.sleep(this.rateLimit - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
    }
    log(message, error) {
        if (this.debug) {
            const timestamp = new Date().toISOString();
            if (error) {
                console.error(`[${timestamp}] Web3TokenFetcher: ${message}`, error);
            }
            else {
                console.log(`[${timestamp}] Web3TokenFetcher: ${message}`);
            }
        }
    }
    async retryOperation(operation, context) {
        let lastError;
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                await this.enforceRateLimit();
                const result = await operation();
                this.consecutiveFailures = 0; // Reset on success
                return result;
            }
            catch (error) {
                lastError = error;
                this.consecutiveFailures++;
                this.log(`${context} failed (attempt ${i + 1}/${this.maxRetries})`, lastError);
                if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    this.log(`Too many consecutive failures (${this.consecutiveFailures}). Increasing retry delay.`);
                    this.retryDelay *= 2; // Double the retry delay
                }
                if (i < this.maxRetries - 1) {
                    const delay = this.retryDelay * Math.pow(2, i);
                    this.log(`Waiting ${delay}ms before retry...`);
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    async getAllPairs(startIndex, fetchSize) {
        return this.retryOperation(async () => {
            const pairs = [];
            const activePairs = [];
            const processBatchSize = 5; // Process 5 pairs at a time
            this.log(`Fetching pairs from index ${startIndex} to ${startIndex + fetchSize}`);
            for (let i = startIndex; i < startIndex + fetchSize; i++) {
                try {
                    const pair = await this.factoryContract.methods.allPairs(i).call();
                    pairs.push(pair);
                }
                catch (error) {
                    if (error.message.includes('invalid array length')) {
                        this.log(`Reached end of pairs at index ${i}`);
                        break;
                    }
                    throw error;
                }
            }
            this.log(`Found ${activePairs.length} active pairs out of ${pairs.length} total pairs`);
            // Process pairs in parallel batches
            const results = [];
            for (let i = 0; i < pairs.length; i += processBatchSize) {
                const batch = pairs.slice(i, i + processBatchSize);
                const pairInfoPromises = batch.map(pair => this.getPairInfo(pair));
                const pairInfos = await Promise.all(pairInfoPromises);
                for (let j = 0; j < pairInfos.length; j++) {
                    const pairInfo = pairInfos[j];
                    if (await this.isPairActive(pairInfo)) {
                        activePairs.push(batch[j]);
                        this.log(`Found active pair: ${batch[j]}`);
                    }
                }
            }
            return activePairs;
        }, 'getAllPairs');
    }
    async isPairActive(pairInfo) {
        try {
            // Get token info for both tokens
            const [token0Info, token1Info] = await Promise.all([
                this.getTokenInfo(pairInfo.token0Address),
                this.getTokenInfo(pairInfo.token1Address)
            ]);
            // Calculate approximate USD value of reserves
            // Note: This is a simplified calculation. In production, you'd want to use
            // actual price feeds for more accurate USD values
            const reserve0USD = parseFloat(pairInfo.reserve0) / Math.pow(10, token0Info.decimals);
            const reserve1USD = parseFloat(pairInfo.reserve1) / Math.pow(10, token1Info.decimals);
            const totalLiquidityUSD = reserve0USD + reserve1USD;
            return totalLiquidityUSD >= this.minLiquidityUsd;
        }
        catch (error) {
            this.log(`Error checking pair activity`, error);
            return false;
        }
    }
    async getTokenInfo(tokenAddress) {
        return this.retryOperation(async () => {
            this.log(`Fetching token info for ${tokenAddress}`);
            const tokenContract = new this.web3.eth.Contract(abis_1.ERC20_ABI, tokenAddress);
            const [symbol, decimals, name] = await Promise.all([
                tokenContract.methods.symbol().call(),
                tokenContract.methods.decimals().call(),
                tokenContract.methods.name().call().catch(() => '')
            ]);
            this.log(`Found token: ${symbol} (${name})`);
            return {
                symbol,
                decimals: Number(decimals),
                name,
                address: tokenAddress
            };
        }, `getTokenInfo(${tokenAddress})`);
    }
    async getPairInfo(pairAddress) {
        return this.retryOperation(async () => {
            this.log(`Fetching pair info for ${pairAddress}`);
            const poolContract = new this.web3.eth.Contract(abis_1.POOL_ABI, pairAddress);
            // Batch call token0, token1 and reserves in parallel
            const [token0Address, token1Address, reserves] = await Promise.all([
                poolContract.methods.token0().call(),
                poolContract.methods.token1().call(),
                poolContract.methods.getReserves().call()
            ]);
            const result = {
                pairAddress,
                token0Address,
                token1Address,
                reserve0: reserves._reserve0,
                reserve1: reserves._reserve1,
                contract: new this.web3.eth.Contract(abis_2.UNISWAP_V2_PAIR_ABI, pairAddress),
                token0: await this.getTokenInfo(token0Address),
                token1: await this.getTokenInfo(token1Address),
                token0Info: await this.getTokenInfo(token0Address),
                token1Info: await this.getTokenInfo(token1Address)
            };
            // Pre-fetch token info in parallel
            const [token0Info, token1Info] = await Promise.all([
                this.getTokenInfo(token0Address),
                this.getTokenInfo(token1Address)
            ]);
            result.token0Info = token0Info;
            result.token1Info = token1Info;
            this.log(`Pair info: ${JSON.stringify(result)}`);
            return result;
        }, `getPairInfo(${pairAddress})`);
    }
    async getQuote(tokenIn, tokenOut, amountIn, source = 'v2') {
        return this.retryOperation(async () => {
            this.log(`Getting quote for ${amountIn} of ${tokenIn} to ${tokenOut}`);
            if (source === 'v2') {
                // For V2, we'll calculate the quote using the reserves
                const pair = await this.findV2Pair(tokenIn, tokenOut);
                if (!pair) {
                    throw new Error('No V2 pair found');
                }
                const pairInfo = await this.getPairInfo(pair);
                const isToken0In = tokenIn.toLowerCase() === pairInfo.token0Address.toLowerCase();
                // Use the constant product formula: dy = (y * dx) / (x + dx)
                const x = isToken0In ? pairInfo.reserve0 : pairInfo.reserve1;
                const y = isToken0In ? pairInfo.reserve1 : pairInfo.reserve0;
                const amountOut = (BigInt(y) * BigInt(amountIn)) / (BigInt(x) + BigInt(amountIn));
                return amountOut.toString();
            }
            else {
                // For V3, we'll use the quoter contract if available
                if (!addresses_1.DEX_ADDRESSES[this.network].QUOTER) {
                    throw new Error('V3 Quoter address not configured');
                }
                const quoterContract = new this.web3.eth.Contract(QUOTER_ABI, addresses_1.DEX_ADDRESSES[this.network].QUOTER);
                return await quoterContract.methods
                    .quoteExactInputSingle(tokenIn, tokenOut, 3000, amountIn, 0)
                    .call();
            }
        }, `getQuote(${tokenIn}, ${tokenOut}, ${amountIn})`);
    }
    async findV2Pair(token0, token1) {
        return this.retryOperation(async () => {
            this.log(`Finding V2 pair for ${token0} and ${token1}`);
            // Sort tokens to match the pair creation logic
            const [token0Sorted, token1Sorted] = token0.toLowerCase() < token1.toLowerCase()
                ? [token0, token1]
                : [token1, token0];
            // Get the pair address from the factory
            const pairAddress = await this.factoryContract.methods.getPair(token0Sorted, token1Sorted).call();
            if (pairAddress === '0x0000000000000000000000000000000000000000') {
                return null;
            }
            this.log(`Found V2 pair: ${pairAddress}`);
            return pairAddress;
        }, `findV2Pair(${token0}, ${token1})`);
    }
    async findV3Pool(token0, token1, fee) {
        return this.retryOperation(async () => {
            this.log(`Finding V3 pool for ${token0} and ${token1} with fee ${fee}`);
            // Sort tokens to match the pool creation logic
            const [token0Sorted, token1Sorted] = token0.toLowerCase() < token1.toLowerCase()
                ? [token0, token1]
                : [token1, token0];
            const factoryContract = new this.web3.eth.Contract(abis_1.V3_FACTORY_ABI, addresses_1.DEX_ADDRESSES[this.network].UNISWAP_V3_FACTORY);
            const poolAddress = await factoryContract.methods.getPool(token0Sorted, token1Sorted, fee).call();
            if (poolAddress === '0x0000000000000000000000000000000000000000') {
                return null;
            }
            this.log(`Found V3 pool: ${poolAddress}`);
            return poolAddress;
        }, `findV3Pool(${token0}, ${token1}, ${fee})`);
    }
    async getUniswapV2Price(token0Address, token1Address) {
        return this.retryOperation(async () => {
            const pairAddress = await this.findV2Pair(token0Address, token1Address);
            if (!pairAddress) {
                throw new Error('No V2 pair found');
            }
            const pairInfo = await this.getPairInfo(pairAddress);
            if (!pairInfo.token0Info || !pairInfo.token1Info) {
                throw new Error('Token info not available');
            }
            const reserve0 = BigInt(pairInfo.reserve0);
            const reserve1 = BigInt(pairInfo.reserve1);
            const decimals0 = pairInfo.token0Info.decimals;
            const decimals1 = pairInfo.token1Info.decimals;
            // Calculate price with decimal adjustment
            const price = Number(reserve1 * BigInt(10 ** decimals0)) / Number(reserve0 * BigInt(10 ** decimals1));
            return { price };
        }, `getUniswapV2Price(${token0Address}, ${token1Address})`);
    }
    async getUniswapV3Price(token0Address, token1Address) {
        return this.retryOperation(async () => {
            // Try different fee tiers, starting with most common
            const feeTiers = [3000, 500, 10000];
            let pool = null;
            for (const fee of feeTiers) {
                pool = await this.findV3Pool(token0Address, token1Address, fee);
                if (pool)
                    break;
            }
            if (!pool) {
                throw new Error('No V3 pool found');
            }
            const pairInfo = await this.getPairInfo(pool);
            if (!pairInfo.token0Info || !pairInfo.token1Info) {
                throw new Error('Token info not available');
            }
            const reserve0 = BigInt(pairInfo.reserve0);
            const reserve1 = BigInt(pairInfo.reserve1);
            const decimals0 = pairInfo.token0Info.decimals;
            const decimals1 = pairInfo.token1Info.decimals;
            // Calculate price with decimal adjustment
            const price = Number(reserve1 * BigInt(10 ** decimals0)) / Number(reserve0 * BigInt(10 ** decimals1));
            return { price };
        }, `getUniswapV3Price(${token0Address}, ${token1Address})`);
    }
    async getSushiswapPrice(token0Address, token1Address) {
        return this.retryOperation(async () => {
            // Create a new factory contract for Sushiswap
            const sushiFactoryContract = new this.web3.eth.Contract(abis_1.FACTORY_V2_ABI, addresses_1.DEX_ADDRESSES[this.network].SUSHISWAP_FACTORY);
            // Sort tokens to match the pair creation logic
            const [token0Sorted, token1Sorted] = token0Address.toLowerCase() < token1Address.toLowerCase()
                ? [token0Address, token1Address]
                : [token1Address, token0Address];
            const pairAddress = await sushiFactoryContract.methods.getPair(token0Sorted, token1Sorted).call();
            if (pairAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error('No Sushiswap pair found');
            }
            const pairInfo = await this.getPairInfo(pairAddress);
            if (!pairInfo.token0Info || !pairInfo.token1Info) {
                throw new Error('Token info not available');
            }
            const reserve0 = BigInt(pairInfo.reserve0);
            const reserve1 = BigInt(pairInfo.reserve1);
            const decimals0 = pairInfo.token0Info.decimals;
            const decimals1 = pairInfo.token1Info.decimals;
            // Calculate price with decimal adjustment
            const price = Number(reserve1 * BigInt(10 ** decimals0)) / Number(reserve0 * BigInt(10 ** decimals1));
            return { price };
        }, `getSushiswapPrice(${token0Address}, ${token1Address})`);
    }
    async findActivePools(tokens, feeOptions = [3000]) {
        const activePools = [];
        this.log(`Finding active pools for ${tokens.length} tokens`);
        // Process tokens in parallel with rate limiting
        const tasks = [];
        for (let i = 0; i < tokens.length; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
                const token0 = tokens[i];
                const token1 = tokens[j];
                // Check V2 pair
                tasks.push(this.findV2Pair(token0, token1).then(async (pairAddress) => {
                    if (pairAddress) {
                        const pairInfo = await this.getPairInfo(pairAddress);
                        if (await this.isPairActive(pairInfo)) {
                            activePools.push({
                                address: pairAddress,
                                token0: pairInfo.token0Address,
                                token1: pairInfo.token1Address,
                                version: 'v2'
                            });
                        }
                    }
                }));
                // Check V3 pools for each fee tier
                for (const fee of feeOptions) {
                    tasks.push(this.findV3Pool(token0, token1, fee).then(async (poolAddress) => {
                        if (poolAddress) {
                            const pairInfo = await this.getPairInfo(poolAddress);
                            if (await this.isPairActive(pairInfo)) {
                                activePools.push({
                                    address: poolAddress,
                                    token0: pairInfo.token0Address,
                                    token1: pairInfo.token1Address,
                                    version: 'v3',
                                    fee
                                });
                            }
                        }
                    }));
                }
            }
        }
        // Wait for all tasks to complete
        await Promise.all(tasks);
        this.log(`Found ${activePools.length} active pools`);
        return activePools;
    }
}
exports.Web3TokenFetcher = Web3TokenFetcher;
//# sourceMappingURL=Web3TokenFetcher.js.map