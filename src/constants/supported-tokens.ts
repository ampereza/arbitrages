import { Token } from '../interfaces/GraphTypes';

export const SUPPORTED_BASE_TOKENS: Token[] = [
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum WETH
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 1.0 // Highest liquidity
    },
    {
        symbol: 'USDC.e',
        name: 'USD Coin (Bridged)',
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum USDC.e
        decimals: 6,
        hasAaveSupport: true,
        liquidityScore: 1.0
    },
    {
        symbol: 'USDC',
        name: 'USD Coin (Native)',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum Native USDC
        decimals: 6,
        hasAaveSupport: true,
        liquidityScore: 0.9
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum DAI
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 0.8
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
        decimals: 6,
        hasAaveSupport: true,
        liquidityScore: 0.9
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // Arbitrum WBTC
        decimals: 8,
        hasAaveSupport: true,
        liquidityScore: 0.7 // Lower liquidity as noted
    }
];

// Helper functions to validate tokens
export function isTokenSupported(tokenSymbol: string): boolean {
    return SUPPORTED_BASE_TOKENS.some(token => token.symbol === tokenSymbol);
}

export function hasSufficientLiquidity(token: Token): boolean {
    const baseToken = SUPPORTED_BASE_TOKENS.find(t => t.symbol === token.symbol);
    // If no base token found or no liquidity score defined, assume insufficient liquidity
    return baseToken?.liquidityScore ? baseToken.liquidityScore >= 0.7 : false;
}

export function getTokenBySymbol(symbol: string): Token | undefined {
    return SUPPORTED_BASE_TOKENS.find(token => token.symbol === symbol);
}

// Check if at least one token in a pair is supported by Aave (for flash loans)
export function hasSupportedTokenInPair(token1Symbol: string, token2Symbol: string): boolean {
    return isTokenSupported(token1Symbol) || isTokenSupported(token2Symbol);
}
