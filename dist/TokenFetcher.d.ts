import { NetworkType } from './interfaces/Web3Types';
import { Token } from './interfaces/GraphTypes';
import { ArbitrageOpportunity } from './interfaces/ArbitrageTypes';
export declare class TokenFetcher {
    private readonly networkType;
    private readonly web3TokenFetcher;
    private readonly dexAddresses;
    constructor(networkType?: NetworkType);
    fetchTokens(options?: {
        minLiquidity?: number;
    }): Promise<Token[]>;
    generateTradingPairs(): Promise<Token[]>;
    analyzeArbitrageOpportunity(tokenIn: string, tokenOut: string, amount: string): Promise<ArbitrageOpportunity>;
    private calculateProfitability;
}
