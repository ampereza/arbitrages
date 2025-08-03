import { Token } from '../interfaces/GraphTypes';

export const SUPPORTED_BASE_TOKENS: Token[] = [
    // Base trading tokens (highest liquidity)
    {
        symbol: 'USDC',
        name: 'USD Coin (Native)',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum Native USDC
        decimals: 6,
        hasAaveSupport: true,
        liquidityScore: 1.0
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
        decimals: 6,
        hasAaveSupport: true,
        liquidityScore: 1.0
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum DAI
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 1.0
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum WETH
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 0.9
    },
    // Additional high-value tokens
    {
        symbol: 'USDe',
        name: 'USDe stablecoin',
        address: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // Arbitrum USDe
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.8
    },
    {
        symbol: 'UNI',
        name: 'Uniswap',
        address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // Arbitrum UNI
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 0.7
    },
    {
        symbol: 'cbBTC',
        name: 'Coinbase Wrapped BTC',
        address: '0x1DEb47dCC9a35AD454Bf7f0fCDb03c09792C08c1', // Arbitrum cbBTC
        decimals: 8,
        hasAaveSupport: false,
        liquidityScore: 0.6
    },
    {
        symbol: 'PEPE',
        name: 'Pepe',
        address: '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00', // Arbitrum PEPE
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.5
    },
    {
        symbol: 'sUSDS',
        name: 'Savings USDS',
        address: '0xd74f5255D557944cf7Dd0E45FF521520002D5748', // Arbitrum sUSDS
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.4
    },
    {
        symbol: 'sUSDC',
        name: 'Spark USDC Vault',
        address: '0x0022228a2cc5E7eF0274A7Baa600d44da5aB5776', // Arbitrum sUSDC
        decimals: 6,
        hasAaveSupport: false,
        liquidityScore: 0.4
    },
    {
        symbol: 'BUIDL',
        name: 'BlackRock BUIDL',
        address: '0x7712c34205737192402172409a8F7ccef8aA2AEc', // Arbitrum BUIDL
        decimals: 6,
        hasAaveSupport: false,
        liquidityScore: 0.3
    },
    {
        symbol: 'sUSDe',
        name: 'Staked USDe',
        address: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2', // Arbitrum sUSDe
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.5
    },
    {
        symbol: 'ENA',
        name: 'ENA Token',
        address: '0x4617b59FF1c6c5D8b7228cdDc57c2084B73D6bEe', // Arbitrum ENA
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.4
    },
    {
        symbol: 'ARB',
        name: 'Arbitrum Governance Token',
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548', // Arbitrum ARB
        decimals: 18,
        hasAaveSupport: true,
        liquidityScore: 0.8
    },
    {
        symbol: 'SolvBTC',
        name: 'Solv BTC',
        address: '0x3647c54c4c2C65bC7a2D63c0Da2809B399DBBDC0', // Arbitrum SolvBTC
        decimals: 8,
        hasAaveSupport: false,
        liquidityScore: 0.3
    },
    {
        symbol: 'CRV',
        name: 'Curve DAO Token',
        address: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978', // Arbitrum CRV
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.6
    },
    {
        symbol: 'GRT',
        name: 'The Graph',
        address: '0x9623063377AD1B27544C965cCd7342f7EA7e88C7', // Arbitrum GRT
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.5
    },
    {
        symbol: 'USD0',
        name: 'Usual USD',
        address: '0x35D48A789904E9b15705977192AD5c9a7B9E2aE6', // Arbitrum USD0
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.3
    },
    {
        symbol: 'USDX',
        name: 'USDX',
        address: '0x1A63d1Fb1FD5eEd07B7a21a636b7D0f69F3Ff5B9', // Arbitrum USDX
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.3
    },
    {
        symbol: 'LDO',
        name: 'Lido DAO Token',
        address: '0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60', // Arbitrum LDO
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.5
    },
    {
        symbol: 'USDY',
        name: 'Ondo USD Yield',
        address: '0x5bE26527e817998A7206475496fDE1E68957c5A6', // Arbitrum USDY
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.3
    },
    {
        symbol: 'CAKE',
        name: 'PancakeSwap Token',
        address: '0x1b896893dfc86BB67Cf57767298b9073D2c1bA2c', // Arbitrum CAKE
        decimals: 18,
        hasAaveSupport: false,
        liquidityScore: 0.4
    },
    // Legacy tokens for backward compatibility
    {
        symbol: 'USDC.e',
        name: 'USD Coin (Bridged)',
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum USDC.e
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
        liquidityScore: 0.7
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
