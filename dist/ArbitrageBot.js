"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrageBot = void 0;
const web3_1 = __importDefault(require("web3"));
const dotenv = __importStar(require("dotenv"));
const TokenFetcher_1 = require("./TokenFetcher");
const DexPriceFetcher_1 = require("./dex/DexPriceFetcher");
const ProfitCalculator_1 = require("./profit/ProfitCalculator");
const dex_config_1 = require("./config/dex-config");
// Load environment variables
dotenv.config();
class ArbitrageBot {
    constructor() {
        const ARBITRUM_RPC = `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
        this.web3 = new web3_1.default(ARBITRUM_RPC);
        this.tokenFetcher = new TokenFetcher_1.TokenFetcher('arbitrum');
        this.dexPriceFetcher = new DexPriceFetcher_1.DexPriceFetcher(ARBITRUM_RPC);
        this.profitCalculator = new ProfitCalculator_1.ProfitCalculator(this.web3);
        this.isRunning = false;
        this.tokens = [];
        this.lastPrices = {};
        this.opportunities = [];
        this.marketPrices = new Map();
        this.lastPriceUpdate = 0;
    }
    async initializeWeb3() {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            console.log('Connected to Arbitrum. Current gas price:', web3_1.default.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        }
        catch (error) {
            console.error('Failed to initialize Web3:', error);
            throw error;
        }
    }
    async getBalancerPoolId(tokenIn, tokenOut) {
        // Use a known WETH/USDC pool on Arbitrum Balancer V2
        // This is the 80/20 WETH/USDC pool on Arbitrum
        const poolIds = {
            'WETH-USDC': '0x64541216bafffeec8ea535bb71fbc927831d0595000200000000000000000002',
            'WETH-USDC.e': '0x64541216bafffeec8ea535bb71fbc927831d0595000200000000000000000002'
        };
        // Create a key from token symbols
        const key1 = `${tokenIn.symbol}-${tokenOut.symbol}`;
        const key2 = `${tokenOut.symbol}-${tokenIn.symbol}`;
        const poolId = poolIds[key1] || poolIds[key2] || '0x64541216bafffeec8ea535bb71fbc927831d0595000200000000000000000002';
        return poolId;
    }
    async getPriceQuote(dex, tokenIn, tokenOut, amount) {
        const config = ArbitrageBot.DEX_CONFIG[dex];
        if (!config)
            throw new Error(`DEX ${dex} not supported`);
        try {
            switch (config.type) {
                case 'UniswapV2':
                    if (dex === 'ARBSWAP') {
                        return await this.dexPriceFetcher.getArbswapPrice(config.factoryAddress, tokenIn, tokenOut, amount);
                    }
                    else {
                        return await this.dexPriceFetcher.getUniswapV2Price(config.factoryAddress, tokenIn, tokenOut, amount);
                    }
                case 'UniswapV3':
                    return await this.dexPriceFetcher.getUniswapV3Price(config.quoterAddress, tokenIn, tokenOut, amount);
                case 'Curve':
                    return await this.dexPriceFetcher.getCurvePrice(config.address, tokenIn, tokenOut, amount);
                case 'Balancer':
                    const poolId = await this.getBalancerPoolId(tokenIn, tokenOut);
                    return await this.dexPriceFetcher.getBalancerPrice(poolId, config.address, tokenIn, tokenOut, amount);
                case 'Wombat':
                    return await this.dexPriceFetcher.getWombatPrice(config.address, tokenIn, tokenOut, amount);
                case 'GMX':
                    return await this.dexPriceFetcher.getGMXPrice(config.address, tokenIn, tokenOut, amount);
                case 'TraderJoe':
                    return await this.dexPriceFetcher.getTraderJoePrice(config.routerAddress, tokenIn, tokenOut, amount);
                default:
                    throw new Error(`Unsupported DEX type: ${config.type}`);
            }
        }
        catch (error) {
            console.error(`Error getting price from ${dex}:`, error);
            throw error;
        }
    }
    // New method: Fetch all market prices from all DEXes for all token pairs
    async fetchAllMarketPrices() {
        console.log('📊 Fetching current market prices from all DEXes...');
        // Start with working DEXes and known good pairs
        const enabledDexes = ['SUSHISWAP', 'UNISWAPV3']; // Test both
        // Start with major pairs that definitely exist
        const majorPairs = [
            { base: 'WETH', quote: 'USDC' },
            { base: 'WETH', quote: 'USDT' },
            { base: 'USDC', quote: 'USDT' },
            { base: 'WETH', quote: 'ARB' }
        ];
        const testAmount = '1000000'; // 1 token with 6 decimals
        this.marketPrices.clear();
        for (const dexName of enabledDexes) {
            const dexPrices = new Map();
            console.log(`\n🔄 Scanning ${dexName} for prices...`);
            for (const pair of majorPairs) {
                const baseTokenData = this.tokens.find(t => t.symbol === pair.base);
                const quoteTokenData = this.tokens.find(t => t.symbol === pair.quote);
                if (!baseTokenData || !quoteTokenData) {
                    console.log(`   ⚠️  Missing token data for ${pair.base}/${pair.quote}`);
                    continue;
                }
                const pairKey = `${pair.base}-${pair.quote}`;
                try {
                    // Adjust test amount based on token decimals
                    const adjustedAmount = baseTokenData.decimals === 18
                        ? '1000000000000000000' // 1 token with 18 decimals
                        : '1000000'; // 1 token with 6 decimals
                    // Get price for base -> quote
                    const priceQuote = await this.getPriceQuote(dexName, baseTokenData, quoteTokenData, adjustedAmount);
                    const price = parseFloat(priceQuote.price);
                    if (price > 0) {
                        dexPrices.set(pairKey, price);
                        console.log(`   ✅ ${dexName}: ${pairKey} = ${price.toFixed(6)}`);
                    }
                    else {
                        console.log(`   ❌ ${dexName}: ${pairKey} = 0 (no liquidity)`);
                    }
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    console.log(`   ❌ ${dexName}: ${pairKey} - ${errorMsg}`);
                    continue;
                }
                // Small delay to avoid overwhelming the node
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            this.marketPrices.set(dexName, dexPrices);
            console.log(`📊 ${dexName}: Successfully fetched ${dexPrices.size} price pairs`);
        }
        this.lastPriceUpdate = Date.now();
        console.log(`\n🎯 Price fetching completed. Next: Analyze for arbitrage opportunities...`);
    }
    // New method: Find arbitrage opportunities using cached prices with detailed profit analysis
    async findArbitrageOpportunities() {
        const opportunities = [];
        const dexNames = Array.from(this.marketPrices.keys());
        if (dexNames.length < 2) {
            console.log('⚠️  Need at least 2 DEXes with prices to find arbitrage');
            return opportunities;
        }
        console.log('🔍 Analyzing price differences for arbitrage opportunities...');
        for (let i = 0; i < dexNames.length; i++) {
            for (let j = i + 1; j < dexNames.length; j++) {
                const dex1 = dexNames[i];
                const dex2 = dexNames[j];
                const prices1 = this.marketPrices.get(dex1);
                const prices2 = this.marketPrices.get(dex2);
                // Find common trading pairs
                for (const [pairKey, price1] of prices1) {
                    const price2 = prices2.get(pairKey);
                    if (!price2)
                        continue;
                    // Calculate price difference percentage
                    const priceDiff = Math.abs(price1 - price2);
                    const avgPrice = (price1 + price2) / 2;
                    const diffPercentage = (priceDiff / avgPrice) * 100;
                    // Only consider significant price differences (>0.1%)
                    if (diffPercentage > 0.1) {
                        const [baseSymbol, tokenSymbol] = pairKey.split('-');
                        const buyDex = price1 < price2 ? dex1 : dex2;
                        const sellDex = price1 < price2 ? dex2 : dex1;
                        const buyPrice = Math.min(price1, price2);
                        const sellPrice = Math.max(price1, price2);
                        const tokenIn = this.tokens.find(t => t.symbol === baseSymbol);
                        const tokenOut = this.tokens.find(t => t.symbol === tokenSymbol);
                        // Create basic opportunity object
                        const basicOpportunity = {
                            buyDEX: buyDex,
                            sellDEX: sellDex,
                            buyPrice,
                            sellPrice,
                            priceSpread: diffPercentage,
                            estimatedROI: diffPercentage - 0.5, // Rough estimate minus fees
                            profitAnalysis: {
                                netProfit: (sellPrice - buyPrice) * 1000, // Placeholder
                                grossProfit: (sellPrice - buyPrice) * 1000,
                                gasCost: 50 // Placeholder
                            },
                            tradeSizing: {
                                recommendedAmount: 1000,
                                maxAmount: 5000,
                                minAmount: 100
                            },
                            riskFactors: [],
                            tokenIn,
                            tokenOut,
                            timestamp: Date.now()
                        };
                        // Perform detailed profit analysis
                        try {
                            const detailedAnalysis = await this.profitCalculator.calculateDetailedProfit(basicOpportunity, 1000, // Default $1000 trade size
                            {
                                slippageTolerance: 0.005, // 0.5%
                                useFlashLoan: true,
                                mevProtection: false
                            });
                            // Only add opportunities that are profitable after all costs
                            if (detailedAnalysis.netProfit > 0 && detailedAnalysis.safetyMargin > 0) {
                                // Update opportunity with detailed analysis
                                basicOpportunity.profitAnalysis = {
                                    netProfit: detailedAnalysis.netProfit,
                                    grossProfit: detailedAnalysis.grossRevenue,
                                    gasCost: detailedAnalysis.costs.totalGasCostUSD
                                };
                                basicOpportunity.tradeSizing = {
                                    recommendedAmount: detailedAnalysis.optimalTradeSize,
                                    maxAmount: detailedAnalysis.maxTradeSize,
                                    minAmount: detailedAnalysis.minProfitableSize
                                };
                                basicOpportunity.estimatedROI = detailedAnalysis.roi;
                                // Add risk factors based on analysis
                                if (detailedAnalysis.safetyMargin < 1) {
                                    basicOpportunity.riskFactors.push('Low safety margin');
                                }
                                if (detailedAnalysis.priceImpact > 0.02) {
                                    basicOpportunity.riskFactors.push('High price impact');
                                }
                                if (detailedAnalysis.liquidityRisk > 0.5) {
                                    basicOpportunity.riskFactors.push('Liquidity risk');
                                }
                                if (detailedAnalysis.executionWindow < 60) {
                                    basicOpportunity.riskFactors.push('Short execution window');
                                }
                                opportunities.push(basicOpportunity);
                                console.log(`💰 PROFITABLE ARBITRAGE: ${pairKey}`);
                                console.log(`   Buy: ${buyDex} ($${buyPrice.toFixed(6)}) | Sell: ${sellDex} ($${sellPrice.toFixed(6)})`);
                                console.log(`   Spread: ${diffPercentage.toFixed(2)}% | Net Profit: $${detailedAnalysis.netProfit.toFixed(2)}`);
                                console.log(`   Break-even: ${detailedAnalysis.breakEvenSpread.toFixed(2)}% | Safety: ${detailedAnalysis.safetyMargin.toFixed(2)}%`);
                                console.log(`   Optimal Size: $${detailedAnalysis.optimalTradeSize.toLocaleString()}`);
                                console.log(`   Gas Cost: $${detailedAnalysis.costs.totalGasCostUSD.toFixed(2)} | Total Costs: $${detailedAnalysis.costs.totalCosts.toFixed(2)}`);
                            }
                            else {
                                console.log(`❌ UNPROFITABLE: ${pairKey} | Spread: ${diffPercentage.toFixed(2)}% | Net: $${detailedAnalysis.netProfit.toFixed(2)} | Break-even: ${detailedAnalysis.breakEvenSpread.toFixed(2)}%`);
                            }
                        }
                        catch (error) {
                            console.error(`Error analyzing profit for ${pairKey}:`, error);
                            // Fall back to basic opportunity without detailed analysis
                            console.log(`💰 BASIC ARBITRAGE: ${pairKey} | Buy: ${buyDex} (${buyPrice.toFixed(6)}) | Sell: ${sellDex} (${sellPrice.toFixed(6)}) | Spread: ${diffPercentage.toFixed(2)}%`);
                        }
                    }
                }
            }
        }
        return opportunities.sort((a, b) => (b.profitAnalysis.netProfit - a.profitAnalysis.netProfit)); // Sort by highest net profit first
    }
    async scanArbitrageOpportunities(baseToken, options) {
        const { originDEX, excludeDEXs = [], minProfitPercent = 0.5, maxSlippage = 1 } = options;
        try {
            for (const token of this.tokens) {
                if (token.address === baseToken.address)
                    continue;
                const availableDexes = Object.keys(ArbitrageBot.DEX_CONFIG)
                    .filter(dex => !excludeDEXs.includes(dex));
                for (const buyDex of availableDexes) {
                    if (originDEX && buyDex !== originDEX)
                        continue;
                    for (const sellDex of availableDexes) {
                        if (buyDex === sellDex)
                            continue;
                        try {
                            // Use a standard test amount (1 token) for price comparison
                            const testAmount = '1000000000000000000'; // 1 token in wei
                            // Get quotes for the test amount
                            const buyQuote = await this.getPriceQuote(buyDex, baseToken, token, testAmount);
                            // Convert the exchange rate to an amount in wei for the sell quote
                            // buyQuote.price is the exchange rate, multiply by testAmount to get output amount
                            const outputAmount = Math.floor(parseFloat(buyQuote.price) * parseFloat(testAmount)).toString();
                            const sellQuote = await this.getPriceQuote(sellDex, token, baseToken, outputAmount);
                            const buyPrice = parseFloat(buyQuote.price);
                            const sellPrice = parseFloat(sellQuote.price);
                            console.log(`📈 ${baseToken.symbol}→${token.symbol}: ${buyDex} buy=${buyPrice.toFixed(6)}, ${sellDex} sell=${sellPrice.toFixed(6)}`);
                            if (sellPrice > buyPrice) {
                                // Calculate simple profit percentage without flash loan costs
                                const grossProfit = sellPrice - buyPrice;
                                const profitPercent = (grossProfit / buyPrice) * 100;
                                // Check if profitable (use a lower threshold since we removed flash loan costs)
                                if (profitPercent > minProfitPercent && grossProfit > 0) {
                                    this.opportunities.push({
                                        buyDEX: buyDex,
                                        sellDEX: sellDex,
                                        tokenIn: baseToken,
                                        tokenOut: token,
                                        profitAnalysis: {
                                            netProfit: grossProfit, // Simplified without fees
                                            grossProfit,
                                            gasCost: 0 // Will calculate later when executing
                                        },
                                        tradeSizing: {
                                            recommendedAmount: parseFloat(testAmount),
                                            maxAmount: parseFloat(testAmount) * 10,
                                            minAmount: parseFloat(testAmount) * 0.1
                                        },
                                        priceSpread: profitPercent,
                                        estimatedROI: grossProfit / parseFloat(testAmount),
                                        buyPrice: parseFloat(buyPrice.toString()),
                                        sellPrice: parseFloat(sellPrice.toString()),
                                        timestamp: Date.now(),
                                        riskFactors: []
                                    });
                                }
                            }
                        }
                        catch (error) {
                            console.error(`Error checking arbitrage between ${buyDex} and ${sellDex}:`, error);
                            continue;
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in arbitrage scan:', error);
        }
    }
    async calculateOptimalTradeSize(buyDex, sellDex, tokenIn, tokenOut, flashLoanPremium, maxSlippage) {
        // Start with base amounts
        const amounts = [
            '1000000000000000000', // 1 token
            '10000000000000000000', // 10 tokens
            '100000000000000000000' // 100 tokens
        ];
        let bestAmount = amounts[0];
        let bestProfit = 0;
        for (const amount of amounts) {
            try {
                // Get quotes for this amount
                const buyQuote = await this.getPriceQuote(buyDex, tokenIn, tokenOut, amount);
                // Convert the exchange rate to an amount in wei for the sell quote
                const outputAmount = Math.floor(parseFloat(buyQuote.price) * parseFloat(amount)).toString();
                const sellQuote = await this.getPriceQuote(sellDex, tokenOut, tokenIn, outputAmount);
                // Calculate costs
                const flashLoanFee = parseFloat(amount) * (flashLoanPremium / 100);
                const slippageCost = (parseFloat(amount) * maxSlippage) / 100;
                const totalCost = flashLoanFee + slippageCost;
                // Calculate profit
                const profit = parseFloat(sellQuote.price) - parseFloat(amount) - totalCost;
                if (profit > bestProfit) {
                    bestAmount = amount;
                    bestProfit = profit;
                }
            }
            catch (error) {
                console.error(`Error calculating optimal size for amount ${amount}:`, error);
                continue;
            }
        }
        return bestAmount;
    }
    async start(options = {}) {
        if (this.isRunning)
            return;
        this.isRunning = true;
        const { minLiquidity = 0.5, // Use liquidity score (0-1.0) instead of USD amount
        maxGasPrice = 100, scanInterval = 10000 } = options;
        try {
            await this.initializeWeb3();
            this.tokens = await this.tokenFetcher.fetchTokens({ minLiquidity });
            while (this.isRunning) {
                const gasPrice = await this.web3.eth.getGasPrice();
                if (Number(web3_1.default.utils.fromWei(gasPrice, 'gwei')) > maxGasPrice) {
                    console.log('⛽ Gas price too high, skipping scan');
                    await new Promise(resolve => setTimeout(resolve, scanInterval));
                    continue;
                }
                // STEP 1: Fetch all current market prices first
                await this.fetchAllMarketPrices();
                // STEP 2: Find arbitrage opportunities using the cached prices
                const opportunities = await this.findArbitrageOpportunities();
                // STEP 3: Display results with detailed profit analysis
                if (opportunities.length > 0) {
                    console.log(`\n🎯 Found ${opportunities.length} PROFITABLE arbitrage opportunities:`);
                    opportunities.slice(0, 5).forEach((opp, i) => {
                        const riskInfo = opp.riskFactors.length > 0 ? ` ⚠️ ${opp.riskFactors.join(', ')}` : '';
                        console.log(`   ${i + 1}. ${opp.tokenIn.symbol}→${opp.tokenOut.symbol}: $${opp.buyPrice.toFixed(2)} → $${opp.sellPrice.toFixed(2)}`);
                        console.log(`      💰 Net Profit: $${opp.profitAnalysis.netProfit.toFixed(2)} | ROI: ${(opp.estimatedROI * 100).toFixed(2)}%`);
                        console.log(`      📊 ${opp.buyDEX} → ${opp.sellDEX} | Size: $${opp.tradeSizing.recommendedAmount.toLocaleString()}${riskInfo}`);
                    });
                }
                else {
                    console.log('📊 No profitable arbitrage opportunities found this scan (after costs)');
                }
                // Wait before next scan
                await new Promise(resolve => setTimeout(resolve, scanInterval));
            }
        }
        catch (error) {
            console.error('Error in arbitrage bot:', error);
            this.stop();
        }
    }
    stop() {
        this.isRunning = false;
        console.log('Arbitrage bot stopped');
    }
    getOpportunities() {
        return this.opportunities;
    }
    async executeArbitrage(opportunity) {
        // TODO: Implement direct arbitrage execution (without flash loans) 
        // This will be implemented when integrating your smart contract
        console.log('💡 Found arbitrage opportunity (execution disabled for now):', {
            buyDEX: opportunity.buyDEX,
            sellDEX: opportunity.sellDEX,
            profitPercent: opportunity.priceSpread.toFixed(3) + '%',
            tokenPair: `${opportunity.tokenIn.symbol}/${opportunity.tokenOut.symbol}`,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice
        });
        return false;
    }
    /**
     * Get detailed profit analysis for a specific opportunity
     */
    async getDetailedProfitAnalysis(opportunity, tradeAmountUSD = 1000) {
        try {
            const analysis = await this.profitCalculator.calculateDetailedProfit(opportunity, tradeAmountUSD, {
                slippageTolerance: 0.005,
                useFlashLoan: true,
                mevProtection: false
            });
            return this.profitCalculator.formatProfitAnalysis(analysis);
        }
        catch (error) {
            return `Error calculating detailed profit analysis: ${error}`;
        }
    }
    /**
     * Quick profit screening for multiple opportunities
     */
    async screenOpportunities(opportunities) {
        console.log('\n🔍 PROFIT SCREENING RESULTS:');
        console.log('='.repeat(80));
        for (const opp of opportunities.slice(0, 10)) {
            const quick = await this.profitCalculator.quickProfitCheck(opp, 1000);
            const status = quick.isProfit ? '✅ PROFITABLE' : '❌ UNPROFITABLE';
            const spread = opp.priceSpread.toFixed(2);
            const breakeven = quick.breakEvenSpread.toFixed(2);
            const profit = quick.netProfitUSD.toFixed(2);
            console.log(`${status} | ${opp.tokenIn.symbol}-${opp.tokenOut.symbol} | Spread: ${spread}% | Break-even: ${breakeven}% | Net: $${profit}`);
        }
    }
    encodeBuyTransaction(dex, opportunity) {
        switch (dex.type) {
            case 'UniswapV2':
                return this.encodeUniswapV2Swap(dex.routerAddress, opportunity.tradeSizing.recommendedAmount.toString(), opportunity.tokenIn.address, opportunity.tokenOut.address);
            case 'Curve':
                return this.encodeCurveSwap(dex.address, opportunity.tradeSizing.recommendedAmount.toString(), opportunity.tokenIn.address, opportunity.tokenOut.address);
            case 'Balancer':
                return this.encodeBalancerSwap(dex.address, opportunity.tradeSizing.recommendedAmount.toString(), opportunity.tokenIn.address, opportunity.tokenOut.address);
            case 'GMX':
                return this.encodeGMXSwap(dex.address, opportunity.tradeSizing.recommendedAmount.toString(), opportunity.tokenIn.address, opportunity.tokenOut.address);
            case 'TraderJoe':
                return this.encodeTraderJoeSwap(dex.routerAddress, opportunity.tradeSizing.recommendedAmount.toString(), opportunity.tokenIn.address, opportunity.tokenOut.address);
            default:
                throw new Error(`Unsupported DEX type: ${dex.type}`);
        }
    }
    encodeSellTransaction(dex, opportunity) {
        // Similar to encodeBuyTransaction but with tokenIn/tokenOut swapped
        // and using the output amount from the buy transaction
        return this.encodeBuyTransaction(dex, {
            ...opportunity,
            tokenIn: opportunity.tokenOut,
            tokenOut: opportunity.tokenIn
        });
    }
    encodeUniswapV2Swap(router, amountIn, tokenIn, tokenOut) {
        const path = [tokenIn, tokenOut];
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swapExactTokensForTokens',
            type: 'function',
            inputs: [
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'amountOutMin' },
                { type: 'address[]', name: 'path' },
                { type: 'address', name: 'to' },
                { type: 'uint256', name: 'deadline' }
            ]
        }, [
            amountIn,
            '0', // No slippage check for atomic transaction
            path,
            this.web3.currentProvider?.host || this.web3.currentProvider?.toString() || '',
            deadline.toString()
        ]);
    }
    encodeCurveSwap(pool, amountIn, tokenIn, tokenOut) {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'exchange',
            type: 'function',
            inputs: [
                { type: 'int128', name: 'i' },
                { type: 'int128', name: 'j' },
                { type: 'uint256', name: 'dx' },
                { type: 'uint256', name: 'min_dy' }
            ]
        }, [
            '0', // Token indices need to be determined
            '1',
            amountIn,
            '0' // No slippage check
        ]);
    }
    encodeBalancerSwap(vault, amountIn, tokenIn, tokenOut) {
        const poolId = '0x...'; // Need to get pool ID
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swap',
            type: 'function',
            inputs: [
                { type: 'bytes32', name: 'poolId' },
                { type: 'uint256', name: 'amountIn' },
                { type: 'address', name: 'tokenIn' },
                { type: 'address', name: 'tokenOut' },
                { type: 'uint256', name: 'minAmountOut' }
            ]
        }, [
            poolId,
            amountIn,
            tokenIn,
            tokenOut,
            '0' // No slippage check
        ]);
    }
    encodeGMXSwap(router, amountIn, tokenIn, tokenOut) {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swap',
            type: 'function',
            inputs: [
                { type: 'address', name: 'tokenIn' },
                { type: 'address', name: 'tokenOut' },
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'minOut' }
            ]
        }, [
            tokenIn,
            tokenOut,
            amountIn,
            '0' // No slippage check
        ]);
    }
    encodeTraderJoeSwap(router, amountIn, tokenIn, tokenOut) {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swapExactTokensForTokens',
            type: 'function',
            inputs: [
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'amountOutMin' },
                { type: 'address[]', name: 'path' },
                { type: 'address', name: 'to' },
                { type: 'uint256', name: 'deadline' }
            ]
        }, [
            amountIn,
            '0', // No slippage check
            [tokenIn, tokenOut],
            this.web3.currentProvider?.host || this.web3.currentProvider?.toString() || '',
            Math.floor(Date.now() / 1000) + 300 // 5 minutes
        ]);
    }
}
exports.ArbitrageBot = ArbitrageBot;
ArbitrageBot.API_ENDPOINTS = {
    oneInch: 'https://api.1inch.io/v5.0/42161', // Arbitrum network
    paraswap: 'https://apiv5.paraswap.io',
    openocean: 'https://arbitrum-api.openocean.finance/v3',
    kyberswap: 'https://aggregator-api.kyberswap.com/arbitrum/api/v1',
    cowswap: 'https://api.cow.fi/arbitrum'
};
ArbitrageBot.DEX_CONFIG = (() => {
    const config = {};
    // Convert new DEX config format to old format for compatibility
    dex_config_1.ARBITRUM_DEX_CONFIG.dexes.forEach(dex => {
        // Skip disabled DEXes
        if (!dex.enabled) {
            return;
        }
        const dexKey = dex.name.toUpperCase().replace(/\s/g, '').replace('V2', '').replace('V3', '');
        if (dex.name === 'UniswapV3') {
            config['UNISWAPV3'] = {
                name: dex.name,
                address: dex.factory,
                fee: 0.003,
                type: 'UniswapV3',
                factoryAddress: dex.factory,
                quoterAddress: dex.quoter,
                routerAddress: dex.router,
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
        else if (dex.name === 'SushiSwap') {
            config['SUSHISWAP'] = {
                name: dex.name,
                address: dex.factory,
                fee: 0.003,
                type: 'UniswapV2',
                factoryAddress: dex.factory,
                routerAddress: dex.router,
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
        else if (dex.name === 'BalancerV2') {
            config['BALANCER'] = {
                name: dex.name,
                address: dex.vault,
                fee: 0.002,
                type: 'Balancer',
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
        else if (dex.name === 'Arbswap') {
            config['ARBSWAP'] = {
                name: dex.name,
                address: dex.factory,
                fee: 0.003,
                type: 'UniswapV2',
                factoryAddress: dex.factory,
                routerAddress: dex.router,
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
        else if (dex.name === 'WombatExchange') {
            config['WOMBAT'] = {
                name: dex.name,
                address: dex.pool,
                fee: 0.001,
                type: 'Wombat',
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
        else if (dex.name === 'CurveFinance') {
            config['CURVE'] = {
                name: dex.name,
                address: dex.registry,
                fee: 0.0004,
                type: 'Curve',
                networkType: 'arbitrum',
                priority: dex.priority,
                estimatedGas: dex.gasEstimate
            };
        }
    });
    return config;
})();
//# sourceMappingURL=ArbitrageBot.js.map