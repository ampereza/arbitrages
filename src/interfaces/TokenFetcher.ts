import { Contract } from 'web3-eth-contract';
import { ArbitrageOpportunity } from './ArbitrageTypes';
import { Token } from './GraphTypes';

export interface TradingPair {
    token0: Token;
    token1: Token;
}

export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    contract: Contract;
}

export interface PairInfo {
    pairAddress: string;
    token0: TokenInfo;
    token1: TokenInfo;
    contract: Contract;
    token0Address: string;
    token1Address: string;
    reserve0: string;
    reserve1: string;
    token0Info: TokenInfo;
    token1Info: TokenInfo;
}

export interface TokenFetcherConfig {
    factoryAddress: string;
    baseTokens: string[];
    supportedTokens: string[];
    excludedTokens: string[];
    maxRetries?: number;
    retryDelay?: number;
    rateLimit?: number;
    network?: 'arbitrum' | 'mainnet';
    minLiquidityUsd?: number;
    debug?: boolean;
}

export interface TokenFetcher {
    getTokenInfo(address: string): Promise<TokenInfo>;
    getPairInfo(token0: string, token1: string): Promise<PairInfo>;
    getAllSupportedPairs(): Promise<PairInfo[]>;
    updatePairReserves(pair: PairInfo): Promise<[string, string]>;
    generateTradingPairs(): Promise<TradingPair[]>;
    analyzeArbitrageOpportunity(
        tokenIn: string,
        tokenOut: string,
        amount: string
    ): Promise<ArbitrageOpportunity>;
}
