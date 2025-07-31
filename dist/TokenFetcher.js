import { ethers } from 'ethers';
import axios from 'axios';
// ABIs for DEX contracts
const PAIR_ABI = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
];
const FACTORY_ABI = [
    'function getPair(address tokenA, address tokenB) view returns (address pair)'
];
const UNIV3_FACTORY_ABI = [
    'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'
];
const UNIV3_POOL_ABI = [
    'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];
export class TokenFetcher {
    constructor() {
        this.DEX_ADDRESSES = {
            UNISWAP_V2_FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
            SUSHISWAP_FACTORY: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
            UNISWAP_V3_FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            // Note: AAVE removed - it's a lending protocol, not a DEX
            // Additional DEXs can be added here for more arbitrage opportunities
        };
        this.demoMode = false;
        try {
            if (!process.env.INFURA_KEY) {
                console.warn('⚠️ No INFURA_KEY found - running in demo mode');
                this.provider = null;
                this.demoMode = true;
            }
            else {
                this.provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
                console.log('✅ Ethereum provider initialized with Infura');
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize provider, falling back to demo mode:', error);
            this.provider = null;
            this.demoMode = true;
        }
    }
    async getUniswapV2Price(baseToken, quoteToken) {
        try {
            // Demo mode fallback
            if (this.demoMode || !this.provider) {
                console.log(`🎭 Demo mode: Simulating Uniswap V2 price for ${baseToken.symbol}/${quoteToken.symbol}`);
                return {
                    price: Math.random() * 0.1 + 0.001, // Random price between 0.001-0.101
                    source: 'Uniswap V2 (Demo)',
                    baseToken: baseToken.symbol,
                    quoteToken: quoteToken.symbol,
                    timestamp: Date.now(),
                    fee: 0.003
                };
            }
            console.log(`🔍 Fetching Uniswap V2 price for ${baseToken.symbol}/${quoteToken.symbol}`);
            const factory = new ethers.Contract(this.DEX_ADDRESSES.UNISWAP_V2_FACTORY, FACTORY_ABI, this.provider);
            const pairAddress = await factory.getPair(baseToken.address, quoteToken.address);
            console.log(`📍 Pair address: ${pairAddress}`);
            if (pairAddress === ethers.ZeroAddress) {
                console.log(`❌ No pair found for ${baseToken.symbol}/${quoteToken.symbol}`);
                return null;
            }
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
            const [token0, token1] = await Promise.all([
                pair.token0(),
                pair.token1()
            ]);
            console.log(`🔗 Token0: ${token0}, Token1: ${token1}`);
            console.log(`🏷️ Base token (${baseToken.symbol}): ${baseToken.address}`);
            console.log(`🏷️ Quote token (${quoteToken.symbol}): ${quoteToken.address}`);
            const { reserve0, reserve1 } = await pair.getReserves();
            console.log(`💰 Reserve0: ${reserve0.toString()}, Reserve1: ${reserve1.toString()}`);
            if (!reserve0 || !reserve1) {
                console.log(`❌ No reserves found`);
                return null;
            }
            const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
            console.log(`🔄 Base is token0: ${baseIsToken0}`);
            let price;
            if (baseIsToken0) {
                // Base is token0, quote is token1: price = reserve1/reserve0
                price = (Number(reserve1) / 10 ** quoteToken.decimals) / (Number(reserve0) / 10 ** baseToken.decimals);
            }
            else {
                // Base is token1, quote is token0: price = reserve0/reserve1  
                price = (Number(reserve0) / 10 ** quoteToken.decimals) / (Number(reserve1) / 10 ** baseToken.decimals);
            }
            console.log(`💲 Calculated price: ${price}`);
            return {
                price,
                source: 'Uniswap V2',
                baseToken: baseToken.symbol,
                quoteToken: quoteToken.symbol,
                timestamp: Date.now(),
                fee: 0.003 // 0.3% trading fee
            };
        }
        catch (error) {
            console.error(`❌ Error getting Uniswap V2 price for ${baseToken.symbol}/${quoteToken.symbol}:`, error);
            return null;
        }
    }
    async getUniswapV3Price(baseToken, quoteToken) {
        try {
            // Demo mode fallback
            if (this.demoMode || !this.provider) {
                console.log(`🎭 Demo mode: Simulating Uniswap V3 price for ${baseToken.symbol}/${quoteToken.symbol}`);
                return {
                    price: Math.random() * 0.1 + 0.001, // Random price between 0.001-0.101
                    source: 'Uniswap V3 (Demo)',
                    baseToken: baseToken.symbol,
                    quoteToken: quoteToken.symbol,
                    timestamp: Date.now(),
                    fee: 0.003
                };
            }
            const factory = new ethers.Contract(this.DEX_ADDRESSES.UNISWAP_V3_FACTORY, UNIV3_FACTORY_ABI, this.provider);
            // Check common fee tiers
            const fees = [500, 3000, 10000];
            for (const fee of fees) {
                const poolAddress = await factory.getPool(baseToken.address, quoteToken.address, fee);
                if (poolAddress === ethers.ZeroAddress)
                    continue;
                const pair = new ethers.Contract(poolAddress, PAIR_ABI, this.provider);
                const pool = new ethers.Contract(poolAddress, UNIV3_POOL_ABI, this.provider);
                const [token0, token1] = await Promise.all([
                    pair.token0(),
                    pair.token1()
                ]);
                const { sqrtPriceX96 } = await pool.slot0();
                if (!sqrtPriceX96)
                    continue;
                // Convert sqrtPriceX96 to a regular number and calculate price
                const sqrtPrice = Number(sqrtPriceX96);
                const denominator = 2 ** 192; // This is a regular number, not bigint
                const rawPrice = (sqrtPrice * sqrtPrice) / denominator;
                // Check if our base token is token0 in the pool
                const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
                // Adjust price based on token order and decimals
                let price;
                if (baseIsToken0) {
                    // Base is token0, quote is token1
                    price = rawPrice * (10 ** (baseToken.decimals - quoteToken.decimals));
                }
                else {
                    // Base is token1, quote is token0 
                    price = (1 / rawPrice) * (10 ** (baseToken.decimals - quoteToken.decimals));
                }
                return {
                    price,
                    source: `Uniswap V3 (${fee / 10000}%)`,
                    baseToken: baseToken.symbol,
                    quoteToken: quoteToken.symbol,
                    timestamp: Date.now(),
                    fee: fee / 1000000 // Convert basis points to decimal (500 -> 0.0005)
                };
            }
            return null;
        }
        catch (error) {
            console.debug(`Error getting Uniswap V3 price for ${baseToken.symbol}/${quoteToken.symbol}:`, error);
            return null;
        }
    }
    async getSushiswapPrice(baseToken, quoteToken) {
        try {
            // Demo mode fallback
            if (this.demoMode || !this.provider) {
                console.log(`🎭 Demo mode: Simulating Sushiswap price for ${baseToken.symbol}/${quoteToken.symbol}`);
                return {
                    price: Math.random() * 0.1 + 0.001, // Random price between 0.001-0.101
                    source: 'Sushiswap (Demo)',
                    baseToken: baseToken.symbol,
                    quoteToken: quoteToken.symbol,
                    timestamp: Date.now(),
                    fee: 0.003
                };
            }
            console.log(`🍣 Fetching Sushiswap price for ${baseToken.symbol}/${quoteToken.symbol}`);
            const factory = new ethers.Contract(this.DEX_ADDRESSES.SUSHISWAP_FACTORY, FACTORY_ABI, this.provider);
            const pairAddress = await factory.getPair(baseToken.address, quoteToken.address);
            console.log(`📍 Sushi pair address: ${pairAddress}`);
            if (pairAddress === ethers.ZeroAddress) {
                console.log(`❌ No Sushi pair found for ${baseToken.symbol}/${quoteToken.symbol}`);
                return null;
            }
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
            const [token0, token1] = await Promise.all([
                pair.token0(),
                pair.token1()
            ]);
            console.log(`🔗 Sushi Token0: ${token0}, Token1: ${token1}`);
            const { reserve0, reserve1 } = await pair.getReserves();
            console.log(`💰 Sushi Reserve0: ${reserve0.toString()}, Reserve1: ${reserve1.toString()}`);
            if (!reserve0 || !reserve1) {
                console.log(`❌ No Sushi reserves found`);
                return null;
            }
            const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
            console.log(`🔄 Sushi base is token0: ${baseIsToken0}`);
            let price;
            if (baseIsToken0) {
                // Base is token0, quote is token1: price = reserve1/reserve0
                price = (Number(reserve1) / 10 ** quoteToken.decimals) / (Number(reserve0) / 10 ** baseToken.decimals);
            }
            else {
                // Base is token1, quote is token0: price = reserve0/reserve1  
                price = (Number(reserve0) / 10 ** quoteToken.decimals) / (Number(reserve1) / 10 ** baseToken.decimals);
            }
            console.log(`💲 Sushi calculated price: ${price}`);
            return {
                price,
                source: 'Sushiswap',
                baseToken: baseToken.symbol,
                quoteToken: quoteToken.symbol,
                timestamp: Date.now(),
                fee: 0.003 // 0.3% trading fee
            };
        }
        catch (error) {
            console.error(`❌ Error getting Sushiswap price for ${baseToken.symbol}/${quoteToken.symbol}:`, error);
            return null;
        }
    }
    // AAVE method removed - AAVE is a lending protocol, not a DEX
    // Flash loans from AAVE can still be used for arbitrage funding, but AAVE doesn't provide tradeable prices
    async getAllPrices(baseToken, quoteToken) {
        const prices = await Promise.all([
            this.getUniswapV3Price(baseToken, quoteToken),
            this.getUniswapV2Price(baseToken, quoteToken),
            this.getSushiswapPrice(baseToken, quoteToken)
            // Note: AAVE is a lending protocol, not a DEX - removed from price comparison
        ]);
        return prices.filter((price) => price !== null);
    }
    async getUniswapTokens() {
        const endpoints = [
            'https://tokens.uniswap.org',
            'https://tokens.coingecko.com/uniswap/all.json',
            'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
            'https://token-list.sushi.com'
        ];
        const allTokens = new Set();
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                let tokenList = response.data;
                // Handle different token list formats
                if (response.data.tokens && Array.isArray(response.data.tokens)) {
                    tokenList = response.data.tokens;
                }
                else if (!Array.isArray(response.data)) {
                    console.debug(`Invalid response from ${endpoint}: Expected array or object with tokens property`);
                    continue;
                }
                const filteredTokens = tokenList
                    .filter((token) => token.symbol &&
                    token.address &&
                    token.decimals &&
                    (token.chainId === 1 || token.chainId === '1') && // Ethereum mainnet only
                    token.symbol !== 'unknown' &&
                    !token.symbol.includes('UNI-V2') &&
                    !token.symbol.includes('SLP'))
                    .map((token) => ({
                    symbol: token.symbol,
                    address: token.address.toLowerCase(),
                    decimals: parseInt(token.decimals)
                }));
                if (filteredTokens.length > 0) {
                    console.log(`Successfully fetched ${filteredTokens.length} tokens from ${endpoint}`);
                    // Add to set to avoid duplicates
                    filteredTokens.forEach((token) => {
                        allTokens.add(token);
                    });
                }
            }
            catch (error) {
                console.error(`Error fetching from ${endpoint}:`, error.message || 'Unknown error');
            }
        }
        const uniqueTokens = Array.from(allTokens);
        console.log(`Total unique Uniswap tokens collected: ${uniqueTokens.length}`);
        return uniqueTokens;
    }
    async getSushiswapTokens() {
        const endpoints = [
            'https://token-list.sushi.com',
            'https://tokens.coingecko.com/uniswap/all.json',
            'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
            'https://tokens.1inch.io'
        ];
        const allTokens = new Set();
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    timeout: 5000, // 5 second timeout
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0' // Set a standard user agent
                    }
                });
                let tokens = response.data;
                if (response.data.tokens && Array.isArray(response.data.tokens)) {
                    tokens = response.data.tokens;
                }
                else if (!Array.isArray(response.data)) {
                    console.debug(`Invalid response from ${endpoint}: Expected array or object with tokens property`);
                    continue;
                }
                const filteredTokens = tokens
                    .filter((token) => token.symbol &&
                    token.address &&
                    token.decimals &&
                    (token.chainId === 1 || token.chainId === '1') && // Ethereum mainnet only
                    token.symbol !== 'unknown' &&
                    !token.symbol.includes('SLP') &&
                    !token.symbol.includes('UNI-V2'))
                    .map((token) => ({
                    symbol: token.symbol,
                    address: token.address.toLowerCase(),
                    decimals: parseInt(token.decimals)
                }));
                if (filteredTokens.length > 0) {
                    console.log(`Successfully fetched ${filteredTokens.length} tokens from ${endpoint}`);
                    // Add to set to avoid duplicates
                    filteredTokens.forEach((token) => {
                        allTokens.add(token);
                    });
                }
            }
            catch (error) { // Type assertion for error
                console.error(`Error fetching from ${endpoint}:`, error.message || 'Unknown error');
            }
        }
        const uniqueTokens = Array.from(allTokens);
        console.log(`Total unique Sushiswap tokens collected: ${uniqueTokens.length}`);
        return uniqueTokens;
    }
    async getCurveTokens() {
        const endpoints = [
            'https://tokens.coingecko.com/uniswap/all.json',
            'https://tokens.1inch.io',
            'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
            'https://token-list.sushi.com'
        ];
        const tokens = new Set();
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    timeout: 5000, // 5 second timeout
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0' // Standard user agent
                    }
                });
                if (endpoint.includes('curve-token-list')) {
                    // Handle GitHub token list format
                    if (Array.isArray(response.data)) {
                        response.data.forEach((token) => {
                            if (token.address && token.symbol && token.decimals) {
                                tokens.add({
                                    symbol: token.symbol,
                                    address: token.address.toLowerCase(),
                                    decimals: parseInt(token.decimals)
                                });
                            }
                        });
                    }
                }
                else {
                    // Handle Curve API format
                    if (response.data?.data?.poolData) {
                        response.data.data.poolData.forEach((pool) => {
                            if (pool.coins && Array.isArray(pool.coins)) {
                                pool.coins.forEach((coin) => {
                                    if (coin.address && coin.symbol && typeof coin.decimals !== 'undefined') {
                                        tokens.add({
                                            symbol: coin.symbol,
                                            address: coin.address.toLowerCase(),
                                            decimals: parseInt(coin.decimals)
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            }
            catch (error) { // Type assertion for error
                console.error(`Error fetching from ${endpoint}:`, error.message || 'Unknown error');
                continue;
            }
        }
        const tokenArray = Array.from(tokens);
        if (tokenArray.length > 0) {
            console.log(`Successfully fetched ${tokenArray.length} tokens from Curve sources`);
            return tokenArray;
        }
        console.warn('All Curve token endpoints failed');
        return [];
    }
    async getAllTokens() {
        const tokenMap = new Map();
        // Common stablecoin addresses (as a fallback)
        const commonTokens = [
            { symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', decimals: 18 },
            { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
            { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
            { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
            { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8 }
        ];
        try {
            console.log('Fetching tokens from Uniswap V3...');
            const uniTokens = await this.getUniswapTokens();
            console.log(`Found ${uniTokens.length} tokens on Uniswap V3`);
            console.log('Fetching tokens from Sushiswap...');
            const sushiTokens = await this.getSushiswapTokens();
            console.log(`Found ${sushiTokens.length} tokens on Sushiswap`);
            console.log('Fetching tokens from Curve...');
            const curveTokens = await this.getCurveTokens();
            console.log(`Found ${curveTokens.length} tokens on Curve`);
            // Combine tokens from all sources and deduplicate by address
            [...uniTokens, ...sushiTokens, ...curveTokens, ...commonTokens].forEach((token) => {
                const lowerAddress = token.address.toLowerCase();
                if (!tokenMap.has(lowerAddress)) {
                    tokenMap.set(lowerAddress, {
                        ...token,
                        address: lowerAddress
                    });
                }
            });
            const totalTokens = tokenMap.size;
            console.log(`Total unique tokens found: ${totalTokens}`);
            // If we have very few tokens, something might be wrong
            if (totalTokens < 10) {
                console.warn('Warning: Found very few tokens. Some DEX APIs might be failing.');
                console.warn('Proceeding with available tokens...');
            }
        }
        catch (error) {
            console.error('Error in getAllTokens:', error);
            // If everything fails, at least use the common tokens
            commonTokens.forEach((token) => {
                const lowerAddress = token.address.toLowerCase();
                tokenMap.set(lowerAddress, {
                    ...token,
                    address: lowerAddress
                });
            });
        }
        return tokenMap;
    }
    async getTokenPrice(baseToken, quoteToken) {
        // Addresses of major DEX contracts
        const UNISWAP_V2_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
        const SUSHISWAP_FACTORY = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';
        const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        try {
            // Load factory contracts
            const uniV2Factory = new ethers.Contract(UNISWAP_V2_FACTORY, ['function getPair(address tokenA, address tokenB) view returns (address pair)'], this.provider);
            const sushiFactory = new ethers.Contract(SUSHISWAP_FACTORY, ['function getPair(address tokenA, address tokenB) view returns (address pair)'], this.provider);
            const uniV3Factory = new ethers.Contract(UNISWAP_V3_FACTORY, ['function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'], this.provider);
            // Try Uniswap V3 first (most liquid)
            const fees = [3000, 500, 10000]; // 0.3%, 0.05%, 1% fee tiers
            for (const fee of fees) {
                const poolAddress = await uniV3Factory.getPool(baseToken.address, quoteToken.address, fee);
                if (poolAddress !== ethers.ZeroAddress) {
                    const pool = new ethers.Contract(poolAddress, ['function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'], this.provider);
                    const pair = new ethers.Contract(poolAddress, PAIR_ABI, this.provider);
                    const [token0, token1] = await Promise.all([
                        pair.token0(),
                        pair.token1()
                    ]);
                    const { sqrtPriceX96 } = await pool.slot0();
                    // Convert sqrtPriceX96 to a regular number and calculate price
                    const sqrtPrice = Number(sqrtPriceX96);
                    const denominator = 2 ** 192; // This is a regular number, not bigint
                    const basePrice = (sqrtPrice * sqrtPrice) / denominator;
                    // Check if our base token is token0 in the pool
                    const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
                    // Calculate final price with decimal adjustment
                    const price = baseIsToken0
                        ? basePrice * (10 ** (quoteToken.decimals - baseToken.decimals))
                        : (1 / basePrice) * (10 ** (quoteToken.decimals - baseToken.decimals));
                    return { price, source: `Uniswap V3 (${fee / 10000}%)`, fee: fee / 1000000 };
                }
            }
            // Try Uniswap V2
            const uniV2PairAddress = await uniV2Factory.getPair(baseToken.address, quoteToken.address);
            if (uniV2PairAddress !== ethers.ZeroAddress) {
                const pair = new ethers.Contract(uniV2PairAddress, PAIR_ABI, this.provider);
                const [token0, token1] = await Promise.all([
                    pair.token0(),
                    pair.token1()
                ]);
                const { reserve0, reserve1 } = await pair.getReserves();
                const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
                const price = baseIsToken0
                    ? (Number(reserve1) / Number(reserve0)) * (10 ** (quoteToken.decimals - baseToken.decimals))
                    : (Number(reserve0) / Number(reserve1)) * (10 ** (quoteToken.decimals - baseToken.decimals));
                return { price, source: 'Uniswap V2', fee: 0.003 };
            }
            // Try Sushiswap
            const sushiPairAddress = await sushiFactory.getPair(baseToken.address, quoteToken.address);
            if (sushiPairAddress !== ethers.ZeroAddress) {
                const pair = new ethers.Contract(sushiPairAddress, PAIR_ABI, this.provider);
                const [token0, token1] = await Promise.all([
                    pair.token0(),
                    pair.token1()
                ]);
                const { reserve0, reserve1 } = await pair.getReserves();
                const baseIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
                const price = baseIsToken0
                    ? (Number(reserve1) / Number(reserve0)) * (10 ** (quoteToken.decimals - baseToken.decimals))
                    : (Number(reserve0) / Number(reserve1)) * (10 ** (quoteToken.decimals - baseToken.decimals));
                return { price, source: 'Sushiswap', fee: 0.003 };
            }
            throw new Error('No liquidity found in major DEXs');
        }
        catch (error) {
            console.error('Error getting token price:', error);
            throw error;
        }
    }
    async generateTradingPairs() {
        const tokenMap = await this.getAllTokens();
        const tokens = Array.from(tokenMap.values());
        const pairs = [];
        // Define major tokens to prioritize
        const majorTokens = new Set([
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
            '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
            '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' // WBTC
        ]);
        // Generate pairs ensuring at least one major token
        for (let i = 0; i < tokens.length; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
                const token1 = tokens[i];
                const token2 = tokens[j];
                // Skip pairs where both tokens are unknown
                if (!majorTokens.has(token1.address.toLowerCase()) &&
                    !majorTokens.has(token2.address.toLowerCase())) {
                    continue;
                }
                // Skip pairs where one of the tokens is a wrapped version of the other
                if ((token1.symbol.includes(token2.symbol) && token1.symbol.startsWith('W')) ||
                    (token2.symbol.includes(token1.symbol) && token2.symbol.startsWith('W'))) {
                    continue;
                }
                // Always put WETH as the quote token if possible
                // For other pairs, put the more liquid token as quote
                const token1IsWETH = token1.address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
                const token2IsWETH = token2.address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
                if (token1IsWETH || token2IsWETH) {
                    // Always put WETH as quote token
                    pairs.push({
                        baseToken: token1IsWETH ? token2 : token1,
                        quoteToken: token1IsWETH ? token1 : token2
                    });
                }
                else {
                    // For non-WETH pairs, put the more liquid token (likely stablecoin) as quote
                    const token1IsStable = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(token1.symbol);
                    const token2IsStable = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(token2.symbol);
                    if (token1IsStable) {
                        pairs.push({
                            baseToken: token2,
                            quoteToken: token1
                        });
                    }
                    else if (token2IsStable) {
                        pairs.push({
                            baseToken: token1,
                            quoteToken: token2
                        });
                    }
                    else {
                        // If neither is stable, use the more "major" token as quote
                        if (majorTokens.has(token1.address.toLowerCase())) {
                            pairs.push({
                                baseToken: token2,
                                quoteToken: token1
                            });
                        }
                        else {
                            pairs.push({
                                baseToken: token1,
                                quoteToken: token2
                            });
                        }
                    }
                }
            }
        }
        console.log(`Generated ${pairs.length} valid trading pairs`);
        return pairs;
    }
    /**
     * Calculate flash loan arbitrage profit after accounting for all fees AND slippage
     * @param buyPrice Price to buy at on DEX A
     * @param sellPrice Price to sell at on DEX B
     * @param buyDexFee Trading fee for DEX A (as decimal, e.g., 0.003 for 0.3%)
     * @param sellDexFee Trading fee for DEX B (as decimal, e.g., 0.003 for 0.3%)
     * @param flashLoanFee AAVE flash loan fee (as decimal, e.g., 0.001 for 0.1%)
     * @param gasFeesUSD Estimated gas fees in USD for all transactions
     * @param amount Amount to trade (in base token units)
     * @param buySlippage Expected slippage on buy DEX (as decimal, e.g., 0.01 for 1%)
     * @param sellSlippage Expected slippage on sell DEX (as decimal, e.g., 0.01 for 1%)
     * @returns Net profit after all fees, costs, and slippage
     */
    calculateArbitrageProfit(buyPrice, sellPrice, buyDexFee, sellDexFee, flashLoanFee = 0.001, // Default AAVE 0.1%
    gasFeesUSD = 50, // Default $50 gas estimate
    amount = 1000, // Default 1000 tokens for meaningful arbitrage
    buySlippage = 0.005, // Default 0.5% slippage on buy
    sellSlippage = 0.005 // Default 0.5% slippage on sell
    ) {
        // Step 1: Apply slippage to prices
        const effectiveBuyPrice = buyPrice * (1 + buySlippage); // Higher price due to slippage
        const effectiveSellPrice = sellPrice * (1 - sellSlippage); // Lower price due to slippage
        // Step 2: Calculate revenue from selling (with slippage)
        const grossRevenue = amount * effectiveSellPrice;
        const sellFeeAmount = grossRevenue * sellDexFee;
        const netRevenue = grossRevenue - sellFeeAmount;
        // Step 3: Calculate costs (with slippage)
        const buyAmount = amount * effectiveBuyPrice;
        const buyFeeAmount = buyAmount * buyDexFee;
        const buyCost = buyAmount + buyFeeAmount;
        // Step 4: Flash loan fee (charged on the borrowed amount)
        const flashLoanCost = buyAmount * flashLoanFee;
        // Step 5: Calculate slippage impact
        const slippageCost = (amount * buyPrice * buySlippage) + (amount * sellPrice * sellSlippage);
        // Step 6: Total costs
        const totalCosts = buyCost + flashLoanCost + gasFeesUSD;
        // Step 7: Calculate profits
        const grossProfit = (amount * sellPrice) - (amount * buyPrice); // Before fees and slippage
        const netProfit = netRevenue - totalCosts;
        const totalFees = sellFeeAmount + buyFeeAmount + flashLoanCost + gasFeesUSD;
        const totalFeesPercent = (totalFees / (amount * buyPrice)) * 100;
        const profitMargin = netProfit / (amount * buyPrice); // Profit margin on investment
        return {
            grossProfit,
            netProfit,
            totalFees,
            totalFeesPercent,
            profitMargin,
            viable: netProfit > 0,
            slippageImpact: slippageCost,
            breakdown: {
                revenue: netRevenue,
                buyCost,
                flashLoanCost,
                gasCost: gasFeesUSD,
                totalCosts,
                slippageCost
            }
        };
    }
    /**
     * Estimate slippage based on trade size and pool liquidity
     * @param tradeAmount Amount to trade (in tokens)
     * @param tokenPrice Current token price
     * @param poolLiquidityUSD Estimated pool liquidity in USD
     * @param poolType Type of pool ('uni-v2', 'uni-v3', 'sushi')
     * @returns Estimated slippage as decimal (0.01 = 1%)
     */
    estimateSlippage(tradeAmount, tokenPrice, poolLiquidityUSD, poolType = 'uni-v2') {
        const tradeValueUSD = tradeAmount * tokenPrice;
        const tradeImpact = tradeValueUSD / poolLiquidityUSD;
        // Different slippage models for different pool types
        let baseSlippage;
        switch (poolType) {
            case 'uni-v3':
                // Uniswap V3 has concentrated liquidity, can be more efficient
                baseSlippage = Math.sqrt(tradeImpact) * 0.3;
                break;
            case 'uni-v2':
            case 'sushi':
                // Uniswap V2 and Sushiswap use constant product formula
                baseSlippage = Math.sqrt(tradeImpact) * 0.5;
                break;
            case 'aave':
                // AAVE typically has less slippage for supported assets
                baseSlippage = Math.sqrt(tradeImpact) * 0.2;
                break;
            default:
                baseSlippage = Math.sqrt(tradeImpact) * 0.5;
        }
        // Cap slippage at reasonable levels
        return Math.min(baseSlippage, 0.1); // Max 10% slippage
    }
    /**
     * Get optimal trade size considering slippage
     * @param buyPrice Price on buy DEX
     * @param sellPrice Price on sell DEX
     * @param buyPoolLiquidity Liquidity on buy DEX (USD)
     * @param sellPoolLiquidity Liquidity on sell DEX (USD)
     * @param maxSlippage Maximum acceptable slippage (decimal)
     * @returns Optimal trade amount in tokens
     */
    getOptimalTradeSize(buyPrice, sellPrice, buyPoolLiquidity, sellPoolLiquidity, maxSlippage = 0.02 // 2% max slippage
    ) {
        // Find the trade size that maximizes profit while staying under slippage limit
        const minLiquidity = Math.min(buyPoolLiquidity, sellPoolLiquidity);
        // Start with a conservative trade size (1% of pool liquidity)
        let maxTradeValue = minLiquidity * 0.01;
        // Adjust based on slippage tolerance
        const slippageConstrainedValue = (maxSlippage * maxSlippage) * minLiquidity / 0.25; // Simplified formula
        maxTradeValue = Math.min(maxTradeValue, slippageConstrainedValue);
        // Convert to token amount
        const optimalAmount = Math.floor(maxTradeValue / buyPrice);
        // Ensure minimum viable trade size
        return Math.max(optimalAmount, 1000); // At least 1000 tokens
    }
    /**
     * Calculate the minimum profitable trade amount for arbitrage
     * @param buyPrice Price on buy DEX
     * @param sellPrice Price on sell DEX
     * @param buyDexFee Trading fee for buy DEX
     * @param sellDexFee Trading fee for sell DEX
     * @param flashLoanFee Flash loan fee (default 0.1%)
     * @param gasFeesUSD Gas costs in USD
     * @param minProfitUSD Minimum profit target in USD
     * @param buyPoolLiquidity Buy DEX liquidity in USD
     * @param sellPoolLiquidity Sell DEX liquidity in USD
     * @param maxSlippage Maximum acceptable slippage
     * @returns Minimum trade amount needed for profitability
     */
    calculateMinimumProfitableAmount(buyPrice, sellPrice, buyDexFee, sellDexFee, flashLoanFee = 0.001, gasFeesUSD = 50, minProfitUSD = 100, // Target $100 minimum profit
    buyPoolLiquidity = 1000000, sellPoolLiquidity = 1000000, maxSlippage = 0.02) {
        // Check if arbitrage is theoretically possible
        if (sellPrice <= buyPrice) {
            return {
                minAmount: 0,
                maxAmount: 0,
                recommendedAmount: 0,
                profitable: false,
                reason: 'No price difference - sell price must be higher than buy price'
            };
        }
        // Binary search to find minimum profitable amount
        let minAmount = 100; // Start with 100 tokens
        let maxTestAmount = Math.min(buyPoolLiquidity / buyPrice * 0.1, // Max 10% of pool liquidity
        sellPoolLiquidity / sellPrice * 0.1);
        let foundProfitable = false;
        let bestAmount = 0;
        let iterations = 0;
        const maxIterations = 20;
        while (iterations < maxIterations && minAmount <= maxTestAmount) {
            const testAmount = (minAmount + maxTestAmount) / 2;
            // Estimate slippage for this trade size
            const buySlippage = this.estimateSlippage(testAmount, buyPrice, buyPoolLiquidity, 'uni-v2');
            const sellSlippage = this.estimateSlippage(testAmount, sellPrice, sellPoolLiquidity, 'uni-v2');
            // Check if slippage is acceptable
            if (buySlippage > maxSlippage || sellSlippage > maxSlippage) {
                maxTestAmount = testAmount - 1;
                iterations++;
                continue;
            }
            // Calculate profit for this amount
            const result = this.calculateArbitrageProfit(buyPrice, sellPrice, buyDexFee, sellDexFee, flashLoanFee, gasFeesUSD, testAmount, buySlippage, sellSlippage);
            if (result.netProfit >= minProfitUSD) {
                foundProfitable = true;
                bestAmount = testAmount;
                maxTestAmount = testAmount - 1; // Try to find smaller amount
            }
            else {
                minAmount = testAmount + 1; // Need larger amount
            }
            iterations++;
        }
        if (!foundProfitable) {
            // Check why it's not profitable
            const testResult = this.calculateArbitrageProfit(buyPrice, sellPrice, buyDexFee, sellDexFee, flashLoanFee, gasFeesUSD, 1000, 0.005, 0.005);
            let reason = 'Insufficient profit margin';
            if (testResult.netProfit < 0) {
                if (testResult.totalFees > testResult.grossProfit) {
                    reason = 'Trading fees exceed gross profit';
                }
                else if (testResult.slippageImpact > testResult.grossProfit) {
                    reason = 'Slippage impact exceeds gross profit';
                }
                else {
                    reason = 'Gas fees too high relative to profit potential';
                }
            }
            return {
                minAmount: 0,
                maxAmount: 0,
                recommendedAmount: 0,
                profitable: false,
                reason
            };
        }
        // Find optimal amount (maximize profit within constraints)
        let optimalAmount = bestAmount;
        let maxProfit = 0;
        for (let amount = bestAmount; amount <= maxTestAmount * 2; amount += bestAmount * 0.1) {
            const buySlippage = this.estimateSlippage(amount, buyPrice, buyPoolLiquidity, 'uni-v2');
            const sellSlippage = this.estimateSlippage(amount, sellPrice, sellPoolLiquidity, 'uni-v2');
            if (buySlippage > maxSlippage || sellSlippage > maxSlippage) {
                break;
            }
            const result = this.calculateArbitrageProfit(buyPrice, sellPrice, buyDexFee, sellDexFee, flashLoanFee, gasFeesUSD, amount, buySlippage, sellSlippage);
            if (result.netProfit > maxProfit) {
                maxProfit = result.netProfit;
                optimalAmount = amount;
            }
            else {
                break; // Profit is decreasing, we found the optimal point
            }
        }
        return {
            minAmount: Math.floor(bestAmount),
            maxAmount: Math.floor(maxTestAmount),
            recommendedAmount: Math.floor(optimalAmount),
            profitable: true,
            reason: `Profitable with minimum $${minProfitUSD} target`
        };
    }
    /**
     * Comprehensive arbitrage analysis with optimal trade sizing
     * @param baseToken The token to arbitrage
     * @param quoteToken The quote token (usually WETH, USDC)
     * @param minProfitUSD Minimum profit target
     * @returns Complete arbitrage opportunity analysis
     */
    async analyzeArbitrageOpportunity(baseToken, quoteToken, minProfitUSD = 100) {
        try {
            // Get prices from all DEXs
            const prices = await this.getAllPrices(baseToken, quoteToken);
            if (prices.length < 2) {
                return {
                    opportunity: false,
                    buyDEX: '',
                    sellDEX: '',
                    buyPrice: 0,
                    sellPrice: 0,
                    priceSpread: 0,
                    tradeSizing: {
                        minAmount: 0,
                        maxAmount: 0,
                        recommendedAmount: 0,
                        profitable: false,
                        reason: 'Insufficient liquidity sources'
                    },
                    profitAnalysis: null,
                    estimatedROI: 0,
                    riskFactors: ['Insufficient DEX coverage']
                };
            }
            // Find best buy (lowest price) and sell (highest price) opportunities
            const sortedPrices = prices.sort((a, b) => a.price - b.price);
            const buyOption = sortedPrices[0];
            const sellOption = sortedPrices[sortedPrices.length - 1];
            const priceSpread = ((sellOption.price - buyOption.price) / buyOption.price) * 100;
            // Skip if spread is too small (less than 0.5%)
            if (priceSpread < 0.5) {
                return {
                    opportunity: false,
                    buyDEX: buyOption.source,
                    sellDEX: sellOption.source,
                    buyPrice: buyOption.price,
                    sellPrice: sellOption.price,
                    priceSpread,
                    tradeSizing: {
                        minAmount: 0,
                        maxAmount: 0,
                        recommendedAmount: 0,
                        profitable: false,
                        reason: 'Price spread too small for profitable arbitrage'
                    },
                    profitAnalysis: null,
                    estimatedROI: 0,
                    riskFactors: ['Minimal price spread']
                };
            }
            // Estimate pool liquidity (simplified)
            const estimatedLiquidity = 1000000; // $1M default - would need actual pool data
            // Calculate optimal trade sizing
            const tradeSizing = this.calculateMinimumProfitableAmount(buyOption.price, sellOption.price, buyOption.fee, sellOption.fee, 0.001, // AAVE flash loan fee
            50, // Gas fees
            minProfitUSD, estimatedLiquidity, estimatedLiquidity);
            let profitAnalysis = null;
            let estimatedROI = 0;
            const riskFactors = [];
            if (tradeSizing.profitable) {
                // Calculate detailed profit analysis for recommended amount
                const buySlippage = this.estimateSlippage(tradeSizing.recommendedAmount, buyOption.price, estimatedLiquidity);
                const sellSlippage = this.estimateSlippage(tradeSizing.recommendedAmount, sellOption.price, estimatedLiquidity);
                profitAnalysis = this.calculateArbitrageProfit(buyOption.price, sellOption.price, buyOption.fee, sellOption.fee, 0.001, 50, tradeSizing.recommendedAmount, buySlippage, sellSlippage);
                estimatedROI = (profitAnalysis.netProfit / (tradeSizing.recommendedAmount * buyOption.price)) * 100;
                // Assess risk factors
                if (buySlippage > 0.01)
                    riskFactors.push('High buy slippage risk');
                if (sellSlippage > 0.01)
                    riskFactors.push('High sell slippage risk');
                if (profitAnalysis.totalFeesPercent > 2)
                    riskFactors.push('High fee impact');
                if (estimatedROI < 1)
                    riskFactors.push('Low profit margin');
            }
            else {
                riskFactors.push('Not profitable at current market conditions');
            }
            return {
                opportunity: tradeSizing.profitable,
                buyDEX: buyOption.source,
                sellDEX: sellOption.source,
                buyPrice: buyOption.price,
                sellPrice: sellOption.price,
                priceSpread,
                tradeSizing,
                profitAnalysis,
                estimatedROI,
                riskFactors
            };
        }
        catch (error) {
            console.error('Error analyzing arbitrage opportunity:', error);
            return {
                opportunity: false,
                buyDEX: '',
                sellDEX: '',
                buyPrice: 0,
                sellPrice: 0,
                priceSpread: 0,
                tradeSizing: {
                    minAmount: 0,
                    maxAmount: 0,
                    recommendedAmount: 0,
                    profitable: false,
                    reason: 'Analysis failed due to error'
                },
                profitAnalysis: null,
                estimatedROI: 0,
                riskFactors: ['Technical analysis error']
            };
        }
    }
}
