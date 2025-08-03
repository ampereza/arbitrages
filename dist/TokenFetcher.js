"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenFetcher = void 0;
const addresses_1 = require("./constants/addresses");
const supported_tokens_1 = require("./constants/supported-tokens");
const Web3TokenFetcher_1 = require("./utils/Web3TokenFetcher");
const bn_js_1 = __importDefault(require("bn.js"));
class TokenFetcher {
    constructor(networkType = 'arbitrum') {
        this.networkType = networkType;
        this.dexAddresses = addresses_1.DEX_ADDRESSES[networkType];
        const defaultUrl = networkType === 'arbitrum'
            ? 'https://arb1.arbitrum.io/rpc'
            : 'https://mainnet.infura.io/v3/your-project-id';
        const providerUrl = process.env.PROVIDER_URL || defaultUrl;
        this.web3TokenFetcher = new Web3TokenFetcher_1.Web3TokenFetcher(providerUrl, {
            factoryAddress: this.dexAddresses.UNISWAP_V2_FACTORY,
            baseTokens: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
                '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC (Native)
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
                this.dexAddresses.WETH, // Keep WETH for compatibility
            ],
            supportedTokens: supported_tokens_1.SUPPORTED_BASE_TOKENS.map(token => token.address),
            excludedTokens: []
        });
    }
    async fetchTokens(options = {}) {
        const { minLiquidity = 0 } = options;
        try {
            // Filter tokens by minimum liquidity score if specified
            const filteredTokens = supported_tokens_1.SUPPORTED_BASE_TOKENS.filter(token => (token.liquidityScore || 0) >= minLiquidity);
            console.log(`Fetched ${filteredTokens.length} tokens for arbitrage scanning (min liquidity: ${minLiquidity})`);
            return filteredTokens;
        }
        catch (error) {
            console.error('Error fetching tokens:', error);
            return [];
        }
    }
    async generateTradingPairs() {
        const tokens = await this.fetchTokens();
        return tokens;
    }
    async analyzeArbitrageOpportunity(tokenIn, tokenOut, amount) {
        const buyPrice = 1000; // Example price
        const sellPrice = 1010; // Example price
        const gasCost = 50; // Example gas cost in USD
        const profitDetails = this.calculateProfitability(amount, buyPrice, sellPrice, gasCost);
        return {
            buyDEX: 'UniswapV2',
            sellDEX: 'SushiSwap',
            buyPrice,
            sellPrice,
            priceSpread: ((sellPrice - buyPrice) / buyPrice) * 100,
            estimatedROI: (Number(profitDetails.netProfit) / Number(amount)) * 100,
            profitAnalysis: {
                netProfit: Number(profitDetails.netProfit),
                grossProfit: Number(profitDetails.profit),
                gasCost: Number(profitDetails.gasCost)
            },
            tradeSizing: {
                recommendedAmount: Number(amount),
                maxAmount: Number(amount) * 2,
                minAmount: Number(amount) * 0.5
            },
            riskFactors: [],
            tokenIn: { address: tokenIn },
            tokenOut: { address: tokenOut },
            timestamp: Date.now()
        };
    }
    calculateProfitability(inputAmount, buyPrice, sellPrice, gasCost, dexFees = 0.003 // 0.3% standard fee
    ) {
        const inputAmountBN = new bn_js_1.default(inputAmount);
        const grossProfit = new bn_js_1.default((sellPrice - buyPrice).toString()).mul(inputAmountBN);
        const totalFees = new bn_js_1.default(Math.floor(dexFees * Number(grossProfit))).toString();
        const gasCostBN = new bn_js_1.default(gasCost.toString());
        const netProfit = grossProfit.sub(new bn_js_1.default(totalFees)).sub(gasCostBN);
        return {
            profit: grossProfit.toString(),
            gasCost: gasCostBN.toString(),
            estimatedNet: netProfit.toString(),
            tokenAmountIn: inputAmount,
            tokenAmountOut: new bn_js_1.default(Math.floor(Number(inputAmount) * sellPrice).toString()).toString(),
            path: [],
            network: this.networkType,
            timestamp: Date.now(),
            netProfit: netProfit.toString(),
            grossProfit: grossProfit.toString(),
            totalFees,
            totalFeesPercent: ((Number(totalFees) / Number(grossProfit)) * 100).toString(),
            profitMargin: ((Number(netProfit) / Number(inputAmount)) * 100).toString(),
            viable: netProfit.gt(new bn_js_1.default(0)),
            breakdown: {
                route: `UniswapV2 -> SushiSwap`,
                gasUsed: gasCostBN.toString(),
                fees: totalFees,
                profit: grossProfit.toString(),
                tokens: [],
                amounts: []
            }
        };
    }
}
exports.TokenFetcher = TokenFetcher;
//# sourceMappingURL=TokenFetcher.js.map