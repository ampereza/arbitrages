// This script helps identify active trading pairs on Arbitrum
// Run with: node find-active-pairs.js

require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

const ARBITRUM_RPC = 'https://arb1.arbitrum.io/rpc';
const ARBITRUM_ADDRESSES = require('./arbitrum_addresses.js');

const PAIR_ABI = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)'
];

const FACTORY_ABI = [
    'function getPair(address tokenA, address tokenB) view returns (address pair)'
];

const ERC20_ABI = [
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
];

async function findActivePairs() {
    console.log('🔍 Finding active trading pairs on Arbitrum...');
    
    // Initialize provider
    const provider = new ethers.JsonRpcProvider(ARBITRUM_RPC);
    
    // Get major tokens
    const tokens = [
        ARBITRUM_ADDRESSES.TOKENS.WETH,
        ARBITRUM_ADDRESSES.TOKENS.USDC,
        ARBITRUM_ADDRESSES.TOKENS.USDT,
        ARBITRUM_ADDRESSES.TOKENS.DAI,
        ARBITRUM_ADDRESSES.TOKENS.WBTC,
        // Add more tokens here if needed
    ];
    
    // Get token symbols and decimals
    const tokenDetails = {};
    for (const address of tokens) {
        const token = new ethers.Contract(address, ERC20_ABI, provider);
        try {
            const [symbol, decimals] = await Promise.all([
                token.symbol(),
                token.decimals()
            ]);
            tokenDetails[address.toLowerCase()] = { symbol, decimals: Number(decimals) };
            console.log(`✅ ${symbol} (${address}): ${decimals} decimals`);
        } catch (error) {
            console.log(`❌ Error getting details for ${address}: ${error.message}`);
        }
    }
    
    // Initialize factory contracts
    const sushiswapFactory = new ethers.Contract(
        ARBITRUM_ADDRESSES.DEX_ADDRESSES.SUSHISWAP_FACTORY,
        FACTORY_ABI,
        provider
    );
    
    const activePairs = [];
    
    // Check all token combinations
    console.log('\n🔍 Checking token pairs...');
    for (let i = 0; i < tokens.length; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
            const token1 = tokens[i];
            const token2 = tokens[j];
            
            // Check Sushiswap
            try {
                const pairAddress = await sushiswapFactory.getPair(token1, token2);
                if (pairAddress !== ethers.ZeroAddress) {
                    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
                    const [reserves, token0, token1] = await Promise.all([
                        pair.getReserves(),
                        pair.token0(),
                        pair.token1()
                    ]);
                    
                    if (Number(reserves.reserve0) > 0 && Number(reserves.reserve1) > 0) {
                        const token0Details = tokenDetails[token0.toLowerCase()];
                        const token1Details = tokenDetails[token1.toLowerCase()];
                        
                        if (token0Details && token1Details) {
                            const reserve0Normalized = Number(reserves.reserve0) / 10 ** token0Details.decimals;
                            const reserve1Normalized = Number(reserves.reserve1) / 10 ** token1Details.decimals;
                            
                            activePairs.push({
                                dex: 'Sushiswap',
                                pairAddress,
                                token0: {
                                    address: token0,
                                    symbol: token0Details.symbol,
                                    reserve: reserve0Normalized
                                },
                                token1: {
                                    address: token1,
                                    symbol: token1Details.symbol,
                                    reserve: reserve1Normalized
                                }
                            });
                            
                            console.log(`✅ Found Sushiswap pair: ${token0Details.symbol}/${token1Details.symbol} - Reserves: ${reserve0Normalized.toFixed(2)} ${token0Details.symbol} / ${reserve1Normalized.toFixed(2)} ${token1Details.symbol}`);
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ Error checking Sushiswap pair: ${error.message}`);
            }
        }
    }
    
    // Save results
    fs.writeFileSync(
        'arbitrum-active-pairs.json',
        JSON.stringify(activePairs, null, 2),
        'utf8'
    );
    
    console.log(`\n✅ Found ${activePairs.length} active pairs on Arbitrum`);
    console.log('📄 Results saved to arbitrum-active-pairs.json');
}

findActivePairs().catch(error => {
    console.error('Error in script:', error);
});
