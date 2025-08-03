import { Token } from './GraphTypes';
import { NetworkType } from './Web3Types';
export interface ArbitrageOpportunity {
    buyDEX: string;
    sellDEX: string;
    buyPrice: number;
    sellPrice: number;
    priceSpread: number;
    estimatedROI: number;
    profitAnalysis: {
        netProfit: number;
        grossProfit: number;
        gasCost: number;
    };
    tradeSizing: {
        recommendedAmount: number;
        maxAmount: number;
        minAmount: number;
    };
    riskFactors: string[];
    tokenIn: Token;
    tokenOut: Token;
    timestamp: number;
}
export interface ArbitrageProfitDetails {
    profit: string;
    gasCost: string;
    estimatedNet: string;
    tokenAmountIn: string;
    tokenAmountOut: string;
    path: string[];
    network: NetworkType;
    timestamp: number;
    netProfit: string;
    grossProfit: string;
    slippageImpact?: number;
    profitUSD?: string;
    totalFees?: string;
    totalFeesPercent?: string;
    profitMargin?: string;
    viable?: boolean;
    breakdown?: {
        route: string;
        gasUsed: string;
        fees: string;
        profit: string;
        tokens: string[];
        amounts: string[];
    };
}
export interface DexConfig {
    name: string;
    address: string;
    fee: number;
    type: 'UniswapV2' | 'UniswapV3' | 'Curve' | 'Balancer' | 'GMX' | 'KyberSwap' | 'TraderJoe' | 'Wombat';
    factoryAddress?: string;
    quoterAddress?: string;
    routerAddress?: string;
    estimatedGas?: number;
    networkType?: NetworkType;
    priority?: number;
    subgraphUrl?: string;
    getPriceQuote?: (params: {
        tokenIn: Token;
        tokenOut: Token;
        amount: string;
    }) => Promise<PriceQuote>;
}
export interface PriceQuote {
    dex: string;
    price: string;
    gas: number;
}
