// package.json dependencies needed:
// npm install ethers@^6 @types/node typescript ts-node dotenv axios @balancer-labs/sdk @curvefi/api
import { ethers } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { TokenFetcher } from './TokenFetcher.js';
// Load environment variables
dotenv.config();
// Network configuration
const ETHEREUM_RPC = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
// DEX addresses and configurations
const DEX_CONFIG = {
    uniswapV2: {
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        name: 'Uniswap V2'
    },
    uniswapV3: {
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        name: 'Uniswap V3',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'
    },
    sushiswap: {
        router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        name: 'SushiSwap'
    },
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        name: 'Balancer'
    },
    curve: {
        addressProvider: '0x0000000022D53366457F9d5E68Ec105046FC4383',
        name: 'Curve'
    },
    zeroX: {
        api: 'https://api.0x.org',
        name: '0x Protocol'
    }
};
// API endpoints
const ONE_INCH_API = 'https://api.1inch.io/v5.0/1';
// ABIs
const ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];
const QUOTER_ABI = [
    'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external view returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
];
const BALANCER_VAULT_ABI = [
    'function queryBatchSwap(uint8 kind, tuple(bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData) [] swaps, address[] assets, tuple(address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) view returns (int256[] memory)'
];
class ArbitrageBot {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
        this.isRunning = false;
        this.tokenFetcher = new TokenFetcher();
    }
    async getUniV2Price(router, dexName, amountIn, path, decimalsOut) {
        try {
            const routerContract = new ethers.Contract(router, ROUTER_ABI, this.provider);
            const amounts = await routerContract.getAmountsOut(amountIn, path);
            return Number(amounts[1]) / Math.pow(10, decimalsOut);
        }
        catch (error) {
            console.error(`${dexName} price fetch error:`, error?.message || 'Unknown error');
            return 0;
        }
    }
    async getUniV3Price(amountIn, tokenIn, tokenOut, decimalsOut) {
        try {
            const quoterContract = new ethers.Contract(DEX_CONFIG.uniswapV3.quoter, QUOTER_ABI, this.provider);
            const fee = 3000; // 0.3% fee tier
            const sqrtPriceLimitX96 = 0;
            const params = {
                tokenIn,
                tokenOut,
                amountIn,
                fee,
                sqrtPriceLimitX96
            };
            const [amountOut] = await quoterContract.quoteExactInputSingle(params);
            return Number(amountOut) / Math.pow(10, decimalsOut);
        }
        catch (error) {
            console.error('Uniswap V3 price fetch error:', error?.message || 'Unknown error');
            return 0;
        }
    }
    async get1InchPrice(amountIn, fromToken, toToken, decimalsOut) {
        try {
            const response = await axios.get(`${ONE_INCH_API}/quote`, {
                params: {
                    fromTokenAddress: fromToken,
                    toTokenAddress: toToken,
                    amount: amountIn.toString()
                }
            });
            return Number(response.data.toTokenAmount) / Math.pow(10, decimalsOut);
        }
        catch (error) {
            console.error('1inch price fetch error:', error?.message || 'Unknown error');
            return 0;
        }
    }
    async getZeroXPrice(amountIn, sellToken, buyToken, decimalsOut) {
        try {
            const response = await axios.get(`${DEX_CONFIG.zeroX.api}/swap/v1/quote`, {
                params: {
                    sellToken,
                    buyToken,
                    sellAmount: amountIn.toString()
                },
                headers: {
                    '0x-api-key': process.env.ZEROX_API_KEY
                }
            });
            return Number(response.data.buyAmount) / Math.pow(10, decimalsOut);
        }
        catch (error) {
            console.error('0x Protocol price fetch error:', error?.message || 'Unknown error');
            return 0;
        }
    }
    async checkArbitrage(prices, baseToken, quoteToken) {
        // Use comprehensive analysis instead of manual calculation
        try {
            const analysis = await this.tokenFetcher.analyzeArbitrageOpportunity(baseToken, quoteToken, 100 // Target minimum $100 profit
            );
            if (analysis.opportunity) {
                console.log('\n🚀 VIABLE ARBITRAGE OPPORTUNITY:');
                console.log('==========================================');
                console.log(`📈 Pair: ${baseToken.symbol}/${quoteToken.symbol}`);
                console.log(`💰 Buy on: ${analysis.buyDEX} at $${analysis.buyPrice.toFixed(6)}`);
                console.log(`💸 Sell on: ${analysis.sellDEX} at $${analysis.sellPrice.toFixed(6)}`);
                console.log(`📊 Price spread: ${analysis.priceSpread.toFixed(2)}%`);
                // Trade sizing information
                console.log(`\n🎯 OPTIMAL TRADE SIZING:`);
                console.log(`💎 Minimum amount: ${analysis.tradeSizing.minAmount.toLocaleString()} ${baseToken.symbol}`);
                console.log(`💎 Maximum amount: ${analysis.tradeSizing.maxAmount.toLocaleString()} ${baseToken.symbol}`);
                console.log(`💎 Recommended amount: ${analysis.tradeSizing.recommendedAmount.toLocaleString()} ${baseToken.symbol}`);
                console.log(`💰 Investment needed: $${(analysis.tradeSizing.recommendedAmount * analysis.buyPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
                if (analysis.profitAnalysis) {
                    console.log(`\n� PROFIT ANALYSIS (${analysis.tradeSizing.recommendedAmount.toLocaleString()} tokens):`);
                    console.log(`🤑 Gross profit: $${analysis.profitAnalysis.grossProfit.toFixed(2)}`);
                    console.log(`� Net profit: $${analysis.profitAnalysis.netProfit.toFixed(2)}`);
                    console.log(`💸 Total fees: $${analysis.profitAnalysis.totalFees.toFixed(2)} (${analysis.profitAnalysis.totalFeesPercent.toFixed(2)}%)`);
                    console.log(`📈 ROI: ${analysis.estimatedROI.toFixed(2)}%`);
                    console.log(`⚡ Profit margin: ${(analysis.profitAnalysis.profitMargin * 100).toFixed(2)}%`);
                    console.log(`🎢 Slippage impact: $${analysis.profitAnalysis.slippageImpact.toFixed(2)}`);
                    console.log(`\n� COST BREAKDOWN:`);
                    console.log(`   • Buy cost: $${analysis.profitAnalysis.breakdown.buyCost.toFixed(2)}`);
                    console.log(`   • Flash loan fee: $${analysis.profitAnalysis.breakdown.flashLoanCost.toFixed(2)}`);
                    console.log(`   • Gas fees: $${analysis.profitAnalysis.breakdown.gasCost.toFixed(2)}`);
                    console.log(`   • Slippage cost: $${analysis.profitAnalysis.breakdown.slippageCost.toFixed(2)}`);
                }
                if (analysis.riskFactors.length > 0) {
                    console.log(`\n⚠️  RISK FACTORS:`);
                    analysis.riskFactors.forEach(risk => console.log(`   • ${risk}`));
                }
                console.log('==========================================');
            }
        }
        catch (error) {
            console.debug(`Analysis failed for ${baseToken.symbol}/${quoteToken.symbol}:`, error);
        }
    }
    estimatePoolLiquidity(dexName, token) {
        // Rough estimates of pool liquidity based on DEX and token type
        const baseMultiplier = this.getTokenLiquidityMultiplier(token.symbol);
        const dexLiquidityEstimates = {
            'Uniswap V2': 5000000 * baseMultiplier, // $5M base
            'Uniswap V3 (0.05%)': 10000000 * baseMultiplier, // $10M base (concentrated)
            'Uniswap V3 (0.3%)': 8000000 * baseMultiplier, // $8M base
            'Uniswap V3 (1%)': 3000000 * baseMultiplier, // $3M base
            'Sushiswap': 3000000 * baseMultiplier, // $3M base
            'AAVE V3': 15000000 * baseMultiplier, // $15M base (lending pool)
            '0x Protocol': 2000000 * baseMultiplier, // $2M base
        };
        return dexLiquidityEstimates[dexName] || 1000000 * baseMultiplier;
    }
    getTokenLiquidityMultiplier(tokenSymbol) {
        // Different tokens have different liquidity levels
        if (['WETH', 'ETH'].includes(tokenSymbol)) {
            return 3.0; // ETH has highest liquidity
        }
        else if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol)) {
            return 2.5; // Stablecoins have high liquidity
        }
        else if (tokenSymbol === 'WBTC') {
            return 2.0; // BTC has good liquidity
        }
        else if (['UNI', 'LINK', 'AAVE', 'COMP'].includes(tokenSymbol)) {
            return 1.5; // Major DeFi tokens
        }
        else {
            return 0.5; // Other tokens have lower liquidity
        }
    }
    getDexPoolType(dexName) {
        if (dexName.includes('Uniswap V3')) {
            return 'uni-v3';
        }
        else if (dexName.includes('Uniswap V2')) {
            return 'uni-v2';
        }
        else if (dexName.includes('Sushiswap')) {
            return 'sushi';
        }
        else if (dexName.includes('AAVE')) {
            return 'aave';
        }
        else {
            return 'uni-v2'; // Default
        }
    }
    getDexFee(dexName) {
        // Map DEX names to their trading fees
        const feeMap = {
            'Uniswap V2': 0.003,
            'Uniswap V3 (0.05%)': 0.0005,
            'Uniswap V3 (0.3%)': 0.003,
            'Uniswap V3 (1%)': 0.01,
            'Sushiswap': 0.003,
            'AAVE V3': 0.001,
            '0x Protocol': 0.003, // Estimate
        };
        return feeMap[dexName] || 0.003; // Default to 0.3%
    }
    calculateOptimalTradeSize(tokenPrice, tokenSymbol) {
        // Calculate trade size based on USD value and token type
        const targetTradeValueUSD = this.getTargetTradeValue(tokenSymbol);
        const optimalSize = Math.floor(targetTradeValueUSD / tokenPrice);
        // Ensure minimum viable size
        const minSize = this.getMinimumTradeSize(tokenSymbol);
        return Math.max(optimalSize, minSize);
    }
    getTargetTradeValue(tokenSymbol) {
        // Target trade values in USD for different token types
        if (['WETH', 'ETH'].includes(tokenSymbol)) {
            return 50000; // $50K for ETH trades
        }
        else if (tokenSymbol === 'WBTC') {
            return 100000; // $100K for BTC trades
        }
        else if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol)) {
            return 75000; // $75K for stablecoin trades
        }
        else {
            return 25000; // $25K for other tokens
        }
    }
    getMinimumTradeSize(tokenSymbol) {
        // Minimum trade sizes to ensure gas efficiency
        if (['WETH', 'ETH'].includes(tokenSymbol)) {
            return 10; // 10 ETH minimum
        }
        else if (tokenSymbol === 'WBTC') {
            return 1; // 1 BTC minimum
        }
        else if (['USDC', 'USDT', 'DAI'].includes(tokenSymbol)) {
            return 10000; // 10K stablecoin minimum
        }
        else {
            return 1000; // 1000 tokens minimum for others
        }
    }
    estimateGasCosts() {
        // Dynamic gas cost estimation (simplified)
        // In production, you'd fetch current gas prices and calculate based on operations
        const currentGasPrice = 30; // 30 gwei estimate
        const flashLoanGasUnits = 300000; // Estimate for flash loan + 2 swaps
        const ethPrice = 3000; // $3000 ETH estimate
        const gasCostETH = (currentGasPrice * flashLoanGasUnits) / 1e9;
        return gasCostETH * ethPrice;
    }
    getTestAmount(token) {
        // Define test amounts based on token type
        if (token.symbol === 'WETH' || token.symbol === 'ETH') {
            return ethers.parseUnits('1', token.decimals);
        }
        else if (token.symbol === 'WBTC') {
            return ethers.parseUnits('0.01', token.decimals);
        }
        else if (['USDC', 'USDT', 'DAI', 'BUSD'].includes(token.symbol)) {
            return ethers.parseUnits('1000', token.decimals);
        }
        else {
            // Default amount for other tokens
            return ethers.parseUnits('1', token.decimals);
        }
    }
    async start() {
        if (!process.env.INFURA_KEY) {
            throw new Error('Missing INFURA_KEY in .env file');
        }
        this.isRunning = true;
        console.log('Starting Enhanced Ethereum DEX arbitrage bot...');
        console.log('Fetching available tokens from DEXs...');
        try {
            const tradingPairs = await this.tokenFetcher.generateTradingPairs();
            console.log(`Found ${tradingPairs.length} trading pairs across major DEXes...\n`);
            while (this.isRunning) {
                for (const pair of tradingPairs) {
                    const prices = [];
                    const pairName = `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`;
                    console.log(`\nChecking ${pairName} prices:`);
                    // Use TokenFetcher methods to get real prices
                    const [uniV2Result, uniV3Result, sushiResult] = await Promise.all([
                        this.tokenFetcher.getUniswapV2Price(pair.baseToken, pair.quoteToken),
                        this.tokenFetcher.getUniswapV3Price(pair.baseToken, pair.quoteToken),
                        this.tokenFetcher.getSushiswapPrice(pair.baseToken, pair.quoteToken)
                    ]);
                    // 0x Protocol (keep this for external comparison)
                    const testAmount = this.getTestAmount(pair.baseToken);
                    const zeroXPrice = await this.getZeroXPrice(testAmount, pair.baseToken.address, pair.quoteToken.address, pair.quoteToken.decimals);
                    // Add all prices
                    if (uniV2Result) {
                        prices.push({ dex: uniV2Result.source, pair: pairName, buyPrice: uniV2Result.price, sellPrice: uniV2Result.price });
                    }
                    if (uniV3Result) {
                        prices.push({ dex: uniV3Result.source, pair: pairName, buyPrice: uniV3Result.price, sellPrice: uniV3Result.price });
                    }
                    if (sushiResult) {
                        prices.push({ dex: sushiResult.source, pair: pairName, buyPrice: sushiResult.price, sellPrice: sushiResult.price });
                    }
                    if (zeroXPrice > 0) {
                        prices.push({ dex: '0x Protocol', pair: pairName, buyPrice: zeroXPrice, sellPrice: zeroXPrice });
                    }
                    // Check for arbitrage opportunities
                    await this.checkArbitrage(prices, pair.baseToken, pair.quoteToken);
                    // Display current prices
                    console.log(`\nCurrent ${pairName} Prices:`);
                    prices.forEach(p => {
                        if (p.buyPrice > 0) {
                            console.log(`${p.dex}: $${p.buyPrice.toFixed(4)}`);
                        }
                    });
                    // Add rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                // Wait before next check
                console.log('\nCompleted cycle, waiting before next scan...');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        catch (error) {
            console.error('Error in arbitrage bot:', error);
            this.isRunning = false;
        }
    }
    stop() {
        this.isRunning = false;
        console.log('Stopping arbitrage bot...');
    }
}
export { ArbitrageBot };
