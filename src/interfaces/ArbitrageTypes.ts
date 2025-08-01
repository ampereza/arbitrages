import { Token } from './GraphTypes';

export interface ArbitrageOpportunity {
    fromDex: string;
    toDex: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    expectedProfit: number;
    profitPercent: number;
    gasCost: number;
    netProfit: number;
}

export interface DexConfig {
    name: string;
    address: string;
    fee: number;
    type: 'UniswapV2' | 'UniswapV3' | 'Curve' | 'Balancer' | 'GMX' | 'KyberSwap' | 'TraderJoe';
    factoryAddress?: string;
    routerAddress?: string;
    getPrice?: (tokenIn: Token, tokenOut: Token, amount: string) => Promise<string>;
    estimatedGas?: number;
}

export interface PriceQuote {
    dex: string;
    price: string;
    gas: number;
}
