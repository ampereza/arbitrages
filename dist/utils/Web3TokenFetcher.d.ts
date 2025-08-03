import { PairInfo, TokenFetcherConfig } from '../interfaces/TokenFetcher';
export declare class Web3TokenFetcher {
    private web3;
    private factoryContract;
    private maxRetries;
    private retryDelay;
    private rateLimit;
    private lastRequestTime;
    private network;
    private minLiquidityUsd;
    private debug;
    private consecutiveFailures;
    private maxConsecutiveFailures;
    private providerUrl;
    private config;
    constructor(providerUrl: string, config?: Partial<TokenFetcherConfig>);
    private sleep;
    private enforceRateLimit;
    private log;
    private retryOperation;
    getAllPairs(startIndex: number, fetchSize: number): Promise<string[]>;
    private isPairActive;
    getTokenInfo(tokenAddress: string): Promise<any>;
    getPairInfo(pairAddress: string): Promise<PairInfo>;
    getQuote(tokenIn: string, tokenOut: string, amountIn: string, source?: 'v2' | 'v3'): Promise<string>;
    private findV2Pair;
    private findV3Pool;
    getUniswapV2Price(token0Address: string, token1Address: string): Promise<{
        price: number;
    }>;
    getUniswapV3Price(token0Address: string, token1Address: string): Promise<{
        price: number;
    }>;
    getSushiswapPrice(token0Address: string, token1Address: string): Promise<{
        price: number;
    }>;
    findActivePools(tokens: string[], feeOptions?: number[]): Promise<Array<{
        address: string;
        token0: string;
        token1: string;
        version: 'v2' | 'v3';
        fee?: number;
    }>>;
}
