/**
 * Constants for Arbitrum network addresses
 */

// Common token addresses on Arbitrum
export const TOKEN_ADDRESSES = {
    // Major tokens
    WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    USDC: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    WBTC: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
    ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    
    // DeFi tokens
    UNI: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0',
    LINK: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
    AAVE: '0xba5ddd1f9d7f570dc94a51479a000e3bce967196',
    CRV: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978',
    BAL: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
    COMP: '0x354a6da3fcde098f8389cad84b0182725c6c91de',
    MKR: '0x2e9a6df78e42a30712c10a9dc4b1c8656f8f2879',
    SNX: '0xcba56cd8216fcbbf3fa6df6137f3147cbca37d60',
    SUSHI: '0xd4d42f0b6def4ce0383636770ef773390d85c61a',
    
    // Other popular tokens
    '1INCH': '0x111111111117dc0aa78b770fa6a738034120c302', // 1inch Token on Arbitrum
    FRAX: '0x17fc002b466eec40dae837fc4be5c67993ddbd6f',
    FXS: '0x9d2f299715d94d8a7e6f5eaa8e654e8c74a988a7',
    PERP: '0x753d224bcf9aafacd81558c32341416df61d3dac',
    SPELL: '0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af',
    GMX: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
    DPX: '0x6c2c06790b3e3e3c38e12ee22f8183b37a13ee55',
    RDNT: '0x3082cc23568ea640225c2467653db90e9250aaa0',
    MAGIC: '0x539bde0d7dbd336b79148aa742883198bbf60342',
    SPA: '0x5575552988a3a80504bbaeb1311674fcfd40ad4b',
};

// DEX factory addresses on Arbitrum
export const DEX_FACTORY_ADDRESSES = {
    SUSHISWAP_FACTORY: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4', // SushiSwap on Arbitrum
    UNISWAP_V3_FACTORY: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Uniswap V3 on Arbitrum
    CAMELOT_FACTORY: '0x6EcCab422D763aC031210895C81787E87B43A652', // Camelot DEX on Arbitrum
};

// Default common tokens
export const COMMON_TOKENS = [
    // Major tokens
    { symbol: 'WETH', address: TOKEN_ADDRESSES.WETH, decimals: 18 },
    { symbol: 'USDC', address: TOKEN_ADDRESSES.USDC, decimals: 6 },
    { symbol: 'USDT', address: TOKEN_ADDRESSES.USDT, decimals: 6 },
    { symbol: 'DAI', address: TOKEN_ADDRESSES.DAI, decimals: 18 },
    { symbol: 'WBTC', address: TOKEN_ADDRESSES.WBTC, decimals: 8 },
    { symbol: 'ARB', address: TOKEN_ADDRESSES.ARB, decimals: 18 },
    
    // DeFi tokens
    { symbol: 'UNI', address: TOKEN_ADDRESSES.UNI, decimals: 18 },
    { symbol: 'LINK', address: TOKEN_ADDRESSES.LINK, decimals: 18 },
    { symbol: 'AAVE', address: TOKEN_ADDRESSES.AAVE, decimals: 18 },
    { symbol: 'CRV', address: TOKEN_ADDRESSES.CRV, decimals: 18 },
    { symbol: 'BAL', address: TOKEN_ADDRESSES.BAL, decimals: 18 },
    { symbol: 'SUSHI', address: TOKEN_ADDRESSES.SUSHI, decimals: 18 },
    { symbol: 'SNX', address: TOKEN_ADDRESSES.SNX, decimals: 18 },
    
    // Other popular tokens
    { symbol: '1INCH', address: TOKEN_ADDRESSES['1INCH'], decimals: 18 },
    { symbol: 'FRAX', address: TOKEN_ADDRESSES.FRAX, decimals: 18 },
    { symbol: 'GMX', address: TOKEN_ADDRESSES.GMX, decimals: 18 },
    { symbol: 'RDNT', address: TOKEN_ADDRESSES.RDNT, decimals: 18 },
    { symbol: 'MAGIC', address: TOKEN_ADDRESSES.MAGIC, decimals: 18 },
];

// Major tokens for pair generation (addresses in lowercase)
export const MAJOR_TOKEN_ADDRESSES = new Set([
    // Main focus tokens with highest liquidity on Arbitrum
    TOKEN_ADDRESSES.WETH.toLowerCase(),
    TOKEN_ADDRESSES.USDC.toLowerCase(),
    TOKEN_ADDRESSES.USDT.toLowerCase(),
    TOKEN_ADDRESSES.DAI.toLowerCase(),
    TOKEN_ADDRESSES.WBTC.toLowerCase(),
    TOKEN_ADDRESSES.ARB.toLowerCase(),
    
    // Secondary tokens with good liquidity on Arbitrum
    TOKEN_ADDRESSES.GMX.toLowerCase(),
    TOKEN_ADDRESSES.MAGIC.toLowerCase(),
    TOKEN_ADDRESSES.LINK.toLowerCase(),
    TOKEN_ADDRESSES.CRV.toLowerCase(),
    TOKEN_ADDRESSES.FRAX.toLowerCase(),
]);

// Stablecoins for quote token selection
export const STABLECOINS = ['USDC', 'USDT', 'DAI', 'FRAX'];
