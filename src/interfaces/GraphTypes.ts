export interface Token {
  id?: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: string;
  volume?: string;
  volumeUSD?: string;
  untrackedVolumeUSD?: string;
  txCount?: string;
  liquidity?: string;
  derivedETH?: string;
  hasAaveSupport?: boolean;
  liquidityScore?: number;
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feeTier: string;
}

export interface TopPoolsResponse {
  pools: Pool[];
}

export interface PoolsQueryVariables {
  first: number;
  orderBy: string;
  orderDirection: string;
  minLiquidity?: string;
}
