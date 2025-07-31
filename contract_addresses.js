// Contract addresses and token verification for CRV/WETH arbitrage
console.log('🔍 CONTRACT ADDRESSES AND TOKEN VERIFICATION');
console.log('=============================================\n');

// 1. TOKEN ADDRESSES
console.log('📍 TOKEN ADDRESSES:');
console.log('==================');
const CRV_ADDRESS = '0xD533a949740bb3306d119CC777fa900bA034cd52';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

console.log(`CRV Token: ${CRV_ADDRESS}`);
console.log(`WETH Token: ${WETH_ADDRESS}`);

// 2. DEX FACTORY ADDRESSES
console.log('\n🏭 DEX FACTORY ADDRESSES:');
console.log('========================');
const UNISWAP_V2_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const SUSHISWAP_FACTORY = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';

console.log(`Uniswap V2 Factory: ${UNISWAP_V2_FACTORY}`);
console.log(`Uniswap V3 Factory: ${UNISWAP_V3_FACTORY}`);
console.log(`Sushiswap Factory: ${SUSHISWAP_FACTORY}`);

// 3. EXPECTED PAIR/POOL ADDRESSES (for manual verification)
console.log('\n🔗 EXPECTED PAIR/POOL ADDRESSES:');
console.log('===============================');

// Function to calculate Uniswap V2 pair address
function getUniV2PairAddress(tokenA, tokenB, factoryAddress) {
    const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
    return `Calculated from factory: ${factoryAddress} with tokens ${token0} and ${token1}`;
}

console.log('Uniswap V2 CRV/WETH Pair:');
console.log(`  ${getUniV2PairAddress(CRV_ADDRESS, WETH_ADDRESS, UNISWAP_V2_FACTORY)}`);

console.log('\nUniswap V3 CRV/WETH Pools:');
console.log(`  0.05% fee tier: Call getPool(${CRV_ADDRESS}, ${WETH_ADDRESS}, 500)`);
console.log(`  0.3% fee tier:  Call getPool(${CRV_ADDRESS}, ${WETH_ADDRESS}, 3000)`);
console.log(`  1% fee tier:    Call getPool(${CRV_ADDRESS}, ${WETH_ADDRESS}, 10000)`);

console.log('\nSushiswap CRV/WETH Pair:');
console.log(`  ${getUniV2PairAddress(CRV_ADDRESS, WETH_ADDRESS, SUSHISWAP_FACTORY)}`);

// 4. MANUAL VERIFICATION STEPS
console.log('\n✅ MANUAL VERIFICATION STEPS:');
console.log('=============================');
console.log('1. Verify token addresses on Etherscan:');
console.log(`   • CRV: https://etherscan.io/token/${CRV_ADDRESS}`);
console.log(`   • WETH: https://etherscan.io/token/${WETH_ADDRESS}`);

console.log('\n2. Check DEX factory contracts:');
console.log(`   • Uniswap V2: https://etherscan.io/address/${UNISWAP_V2_FACTORY}`);
console.log(`   • Uniswap V3: https://etherscan.io/address/${UNISWAP_V3_FACTORY}`);
console.log(`   • Sushiswap: https://etherscan.io/address/${SUSHISWAP_FACTORY}`);

console.log('\n3. Find actual pair/pool addresses:');
console.log('   • Go to each factory contract on Etherscan');
console.log('   • Use "Read Contract" tab');
console.log('   • Call getPair() for V2 factories or getPool() for V3');

console.log('\n4. Verify liquidity and reserves:');
console.log('   • Once you have pair addresses, check their reserves');
console.log('   • Look for getReserves() on V2 pairs');
console.log('   • Look for slot0() on V3 pools');

console.log('\n5. Cross-check with DEX interfaces:');
console.log('   • Uniswap: https://app.uniswap.org/');
console.log('   • Sushiswap: https://www.sushi.com/swap');
console.log('   • Compare displayed prices with calculated ones');

// 5. PRICE CALCULATION FORMULAS
console.log('\n🧮 PRICE CALCULATION FORMULAS:');
console.log('=============================');
console.log('Uniswap V2 / Sushiswap (AMM):');
console.log('  price = (reserve_quote / 10^quote_decimals) / (reserve_base / 10^base_decimals)');
console.log('  Note: Adjust based on which token is token0 vs token1');

console.log('\nUniswap V3:');
console.log('  sqrtPriceX96 from slot0()');
console.log('  price = (sqrtPriceX96 / 2^96)^2 * 10^(base_decimals - quote_decimals)');
console.log('  Note: Adjust based on token order');

// 6. RED FLAGS TO WATCH FOR
console.log('\n🚨 RED FLAGS TO WATCH FOR:');
console.log('=========================');
console.log('• Price spreads > 30% (extremely suspicious)');
console.log('• Very low liquidity in pools (< $10k)');
console.log('• Stale price data (old timestamps)');
console.log('• Different token versions (wrapped vs native)');
console.log('• Paused or deprecated contracts');
console.log('• Unusual fee structures');

// 7. RECOMMENDED VERIFICATION TOOLS
console.log('\n🔧 RECOMMENDED VERIFICATION TOOLS:');
console.log('=================================');
console.log('• Etherscan.io - Contract verification');
console.log('• DexScreener.com - Real-time DEX prices');
console.log('• CoinGecko/CoinMarketCap - Market prices');
console.log('• Uniswap Info - Pool analytics');
console.log('• DefiPulse - Protocol information');

console.log('\n💡 NEXT STEPS:');
console.log('==============');
console.log('1. Use the addresses above to manually verify on Etherscan');
console.log('2. Check current liquidity levels in each pool');
console.log('3. Compare calculated prices with live DEX interfaces');  
console.log('4. Verify the 50.82% spread is real and not a data error');
console.log('5. If verified, consider starting with a smaller test trade');

// 8. CURRENT REPORTED OPPORTUNITY DETAILS
console.log('\n📊 REPORTED OPPORTUNITY DETAILS:');
console.log('===============================');
console.log('• Pair: CRV/WETH');
console.log('• Buy DEX: Uniswap V3 (0.05% fee)');
console.log('• Sell DEX: Sushiswap (0.3% fee)');
console.log('• Buy Price: $0.000171');
console.log('• Sell Price: $0.000259');
console.log('• Price Spread: 50.82%');
console.log('• Recommended Trade Size: 3,485,738 CRV');
console.log('• Expected Net Profit: $229.31');
console.log('• ROI: 38.37%');
