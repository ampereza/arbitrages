import { Token } from './GraphTypes';
import { ArbitrageOpportunity } from './ArbitrageTypes';
import { NetworkType } from './Web3Types';
export interface StartOptions {
    originDEX?: string;
    excludeDEXs?: string[];
    minProfitPercent?: number;
    maxSlippage?: number;
    minLiquidity?: number;
    maxGasPrice?: number;
    scanInterval?: number;
}
export interface ApiEndpoints {
    oneInch: string;
    paraswap: string;
    openocean: string;
    kyberswap: string;
    cowswap: string;
}
export interface ArbitrageBotState {
    isRunning: boolean;
    network: NetworkType;
    currentBlock: number;
    gasPrice: string;
    lastScan: number;
    opportunities: ArbitrageOpportunity[];
    profits: {
        total: string;
        today: string;
        lastTrade: string;
    };
    config: StartOptions;
}
export interface DexQuote {
    dex: string;
    price: string;
    estimatedGas: number;
}
export interface TokenPair {
    baseToken: Token;
    quoteToken: Token;
}
export interface ArbitrageBotOptions {
    rpcUrl: string;
    dexList: string[];
}
