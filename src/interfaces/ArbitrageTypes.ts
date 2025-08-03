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
    profit: string;  // Wei string
    gasCost: string; // Wei string
    estimatedNet: string; // Wei string
    tokenAmountIn: string; // Wei string
    tokenAmountOut: string; // Wei string
    path: string[]; // Token addresses in the path
    network: NetworkType;
    timestamp: number;
    netProfit: string; // Wei string
    grossProfit: string; // Wei string
    slippageImpact?: number; // Optional percentage
    profitUSD?: string; // USD value as string
    totalFees?: string; // Total fees in wei string
    totalFeesPercent?: string; // Total fees as a percentage
    profitMargin?: string; // Profit margin as a string
    viable?: boolean; // Whether the arbitrage is viable
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
    getPriceQuote?: (params: { tokenIn: Token; tokenOut: Token; amount: string }) => Promise<PriceQuote>;
}

export interface PriceQuote {
    dex: string;
    price: string;
    gas: number;
}
