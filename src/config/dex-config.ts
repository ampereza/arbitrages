export const ARBITRUM_DEX_CONFIG = {
    dexes: [
        {
            name: 'UniswapV3',
            enabled: true,
            priority: 1,
            factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
            quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
            router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            fees: [500, 3000, 10000], // 0.05%, 0.3%, 1%
            gasEstimate: 100000,
            description: 'Uniswap V3 on Arbitrum - concentrated liquidity AMM'
        },
        {
            name: 'SushiSwap',
            enabled: true,
            priority: 2,
            factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
            router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            gasEstimate: 150000,
            description: 'SushiSwap multi-chain deployment on Arbitrum'
        },
        {
            name: 'BalancerV2',
            enabled: true, // Re-enable for testing with specific pools
            priority: 3,
            vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
            queries: '0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5',
            gasEstimate: 200000,
            description: 'Balancer V2 on Arbitrum for multi-asset pools'
        },
        {
            name: 'Camelot',
            enabled: true, // New addition - major Arbitrum DEX
            priority: 4,
            factory: '0x6EcCab422D763aC031210895C81787E87B91425d',
            router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
            gasEstimate: 140000,
            description: 'Camelot DEX - leading native Arbitrum exchange with concentrated liquidity'
        },
        {
            name: 'Arbswap',
            enabled: true, // Re-enable for WETH pairs (skip stablecoin pairs)
            priority: 5,
            factory: '0x734583f62Bb6ACe3c9bA9bd5A53143CA2Ce8C55A',
            router: '0xeE01F4aB1C1bD0880c8BeF8FE7Fe439e1D7B9f50',
            gasEstimate: 130000,
            description: 'Arbswap - native AMM with staking and bridge features'
        },
        {
            name: 'Ramses',
            enabled: true, // New addition - ve(3,3) DEX on Arbitrum
            priority: 6,
            factory: '0xAAA20D08e59F6561f242b08513D36266C5A29415',
            router: '0xAAA87963EFeB6f7E0a2711F397663105Acb1805e',
            gasEstimate: 160000,
            description: 'Ramses Exchange - ve(3,3) DEX with dynamic fees'
        },
        {
            name: 'WombatExchange',
            enabled: false, // Keep disabled until ABI is fixed
            priority: 7,
            pool: '0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0',
            router: '0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7',
            gasEstimate: 120000,
            description: 'Wombat Exchange - purpose-built stable-swap DEX on Arbitrum'
        },
        {
            name: 'CurveFinance',
            enabled: true, // Re-enable for stablecoin pools
            priority: 8,
            registry: '0x445FE580eF8d70FF569aB36e80c647af338db351',
            addressProvider: '0x0000000022D53366457F9d5E68Ec105046FC4383',
            pool: '0x7f90122BF0700F9E7e1F688fe926940E8839F353', // 2CRV pool (USDC/USDT)
            gasEstimate: 180000,
            description: 'Curve Finance - specialized in low-slippage stablecoin pools on Arbitrum'
        }
    ],
    
    // Trading pairs to focus on (base tokens: USDT, USDC, DAI)
    priorityPairs: [
        // High priority stablecoin pairs
        { token0: 'USDC', token1: 'USDT' },
        { token0: 'USDC', token1: 'DAI' },
        { token0: 'USDT', token1: 'DAI' },
        
        // Major token pairs with base stablecoins
        { token0: 'WETH', token1: 'USDC' },
        { token0: 'WETH', token1: 'USDT' },
        { token0: 'WETH', token1: 'DAI' },
        
        // USDe pairs
        { token0: 'USDe', token1: 'USDC' },
        { token0: 'USDe', token1: 'USDT' },
        { token0: 'USDe', token1: 'DAI' },
        
        // Major altcoin pairs
        { token0: 'UNI', token1: 'USDC' },
        { token0: 'UNI', token1: 'USDT' },
        { token0: 'ARB', token1: 'USDC' },
        { token0: 'ARB', token1: 'USDT' },
        
        // BTC pairs
        { token0: 'cbBTC', token1: 'USDC' },
        { token0: 'cbBTC', token1: 'USDT' },
        { token0: 'WBTC', token1: 'USDC' },
        { token0: 'WBTC', token1: 'USDT' },
        
        // DeFi token pairs
        { token0: 'CRV', token1: 'USDC' },
        { token0: 'GRT', token1: 'USDC' },
        { token0: 'LDO', token1: 'USDC' },
        
        // Meme/trending pairs
        { token0: 'PEPE', token1: 'USDC' },
        { token0: 'PEPE', token1: 'USDT' },
        
        // Legacy support
        { token0: 'USDC.e', token1: 'USDC' },
        { token0: 'USDC.e', token1: 'USDT' }
    ],
    
    // Arbitrage settings
    arbitrageSettings: {
        minProfitPercent: 0.1, // 0.1% minimum profit
        maxSlippage: 2.0, // 2% max slippage
        minLiquidity: 10000, // $10k minimum liquidity
        maxGasPrice: 20, // 20 gwei max
        scanInterval: 10000, // 10 seconds
        maxTradeSize: '1000000000000000000', // 1 ETH
        minTradeSize: '100000000000000000'   // 0.1 ETH
    }
};

export type DexConfig = typeof ARBITRUM_DEX_CONFIG.dexes[0];
export type ArbitrageSettings = typeof ARBITRUM_DEX_CONFIG.arbitrageSettings;
