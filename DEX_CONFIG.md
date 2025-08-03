# Arbitrage Bot DEX Configuration

This arbitrage bot is configured to find opportunities between multiple DEXes on the Arbitrum network.

## Supported DEXes

### 1. Uniswap V3 (Priority 1)
- **Description**: Concentrated liquidity AMM with multiple fee tiers
- **Factory**: `0x1F98431c8aD98523631AE4a59f267346ea31F984`
- **Quoter**: `0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6`
- **Fee Tiers**: 0.05%, 0.3%, 1%
- **Gas Estimate**: ~100,000

### 2. SushiSwap (Priority 2)
- **Description**: Multi-chain deployment including Arbitrum
- **Factory**: `0xc35DADB65012eC5796536bD9864eD8773aBc74C4`
- **Router**: `0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506`
- **Gas Estimate**: ~150,000

### 3. Balancer V2 (Priority 3)
- **Description**: Multi-asset pools with flexible weights
- **Vault**: `0xBA12222222228d8Ba445958a75a0704d566BF2C8`
- **Queries**: `0xE39B5e3B6D74016b2F6A9673D7d7493B6DF549d5`
- **Gas Estimate**: ~200,000

### 4. Arbswap (Priority 4)
- **Description**: Native AMM with staking and bridge features
- **Factory**: `0x734583f62Bb6ACe3c9bA9bd5A53143CA2Ce8C55A`
- **Router**: `0xeE01F4aB1C1bD0880c8BeF8FE7Fe439e1D7B9f50`
- **Gas Estimate**: ~130,000

### 5. Wombat Exchange (Priority 5)
- **Description**: Purpose-built stable-swap DEX deployed on Arbitrum
- **Pool**: `0x312Bc7eAAF93f1C60Dc5AfC115FcCDE161055fb0`
- **Router**: `0x19609B03C976CCA288fbDae5c21d4290e9a4aDD7`
- **Gas Estimate**: ~120,000

### 6. Curve Finance (Priority 6)
- **Description**: Specialized in low-slippage stablecoin pools
- **Registry**: `0x445FE580eF8d70FF569aB36e80c647af338db351`
- **Address Provider**: `0x0000000022D53366457F9d5E68Ec105046FC4383`
- **Gas Estimate**: ~180,000

## Priority Trading Pairs

The bot focuses on these high-liquidity pairs:
- WETH/USDC
- WETH/USDT
- USDC/USDT
- WETH/ARB
- ARB/USDC
- WETH/DAI

## Arbitrage Settings

- **Minimum Profit**: 0.1%
- **Maximum Slippage**: 2%
- **Minimum Liquidity**: $10,000
- **Maximum Gas Price**: 20 gwei
- **Scan Interval**: 10 seconds
- **Trade Size Range**: 0.1 - 1 ETH

## Configuration

You can modify the DEX configuration in `src/config/dex-config.ts`:

```typescript
export const ARBITRUM_DEX_CONFIG = {
    dexes: [
        // Add or modify DEX configurations
    ],
    priorityPairs: [
        // Specify which token pairs to monitor
    ],
    arbitrageSettings: {
        // Adjust profit thresholds and risk parameters
    }
};
```

## Usage

The bot automatically scans all enabled DEXes for arbitrage opportunities. To start:

```bash
npm run build
npm start
```

Or use the API server:

```bash
./start-api.sh
```

The bot will continuously monitor price differences between the configured DEXes and execute profitable arbitrage trades when found.
