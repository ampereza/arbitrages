import { ArbitrageOpportunity } from './interfaces/ArbitrageTypes';
export declare class ArbitrageBot {
    private web3;
    private tokenFetcher;
    private dexPriceFetcher;
    private profitCalculator;
    private isRunning;
    private tokens;
    private lastPrices;
    private opportunities;
    private marketPrices;
    private lastPriceUpdate;
    constructor();
    private static readonly API_ENDPOINTS;
    private static readonly DEX_CONFIG;
    private initializeWeb3;
    private getBalancerPoolId;
    private getPriceQuote;
    private fetchAllMarketPrices;
    private findArbitrageOpportunities;
    private scanArbitrageOpportunities;
    private calculateOptimalTradeSize;
    start(options?: {
        originDEX?: string;
        excludeDEXs?: string[];
        minProfitPercent?: number;
        maxSlippage?: number;
        minLiquidity?: number;
        maxGasPrice?: number;
        scanInterval?: number;
    }): Promise<void>;
    stop(): void;
    getOpportunities(): ArbitrageOpportunity[];
    executeArbitrage(opportunity: ArbitrageOpportunity): Promise<boolean>;
    /**
     * Get detailed profit analysis for a specific opportunity
     */
    getDetailedProfitAnalysis(opportunity: ArbitrageOpportunity, tradeAmountUSD?: number): Promise<string>;
    /**
     * Quick profit screening for multiple opportunities
     */
    screenOpportunities(opportunities: ArbitrageOpportunity[]): Promise<void>;
    private encodeBuyTransaction;
    private encodeSellTransaction;
    private encodeUniswapV2Swap;
    private encodeCurveSwap;
    private encodeBalancerSwap;
    private encodeGMXSwap;
    private encodeTraderJoeSwap;
}
