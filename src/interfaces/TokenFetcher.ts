export interface TokenInfo {
  symbol: string;
  decimals: number;
  name: string;
  address: string;
}

export interface PairInfo {
  token0Address: string;
  token1Address: string;
  reserve0: string;
  reserve1: string;
  address: string;
  token0Info?: TokenInfo;
  token1Info?: TokenInfo;
}

export interface TokenFetcherConfig {
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: number;
  network?: 'arbitrum' | 'mainnet';
  minLiquidityUsd?: number;
  debug?: boolean;
}
