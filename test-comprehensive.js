console.log('🚀 Testing Expanded Token Configuration for Arbitrage\n');

async function testArbitrageWithNewTokens() {
    try {
        const { TokenFetcher } = require('./dist/TokenFetcher');
        const { SUPPORTED_BASE_TOKENS } = require('./dist/constants/supported-tokens');
        const { ARBITRUM_DEX_CONFIG } = require('./dist/config/dex-config');
        
        console.log('✅ All modules imported successfully\n');
        
        const tokenFetcher = new TokenFetcher('arbitrum');
        
        // Test fetching all tokens
        const allTokens = await tokenFetcher.fetchTokens();
        console.log(`📊 Total tokens available: ${allTokens.length}`);
        
        // Test fetching high liquidity tokens
        const highLiquidityTokens = await tokenFetcher.fetchTokens({ minLiquidity: 0.8 });
        console.log(`🔥 High liquidity tokens (>= 0.8): ${highLiquidityTokens.length}`);
        
        // Test fetching top tier tokens
        const topTierTokens = await tokenFetcher.fetchTokens({ minLiquidity: 1.0 });
        console.log(`⭐ Top tier tokens (1.0): ${topTierTokens.length}\n`);
        
        // === STABLECOIN BASE TOKENS ===
        console.log('💰 === BASE TOKENS (USDT/USDC/DAI Focus) ===');
        const baseTokens = allTokens.filter(t => 
            ['USDT', 'USDC', 'DAI', 'WETH'].includes(t.symbol)
        );
        baseTokens.forEach(token => {
            console.log(`   ${token.symbol}: ${token.name} (Liquidity: ${token.liquidityScore})`);
        });
        
        // === TOP ARBITRAGE TARGETS ===
        console.log('\n🎯 === TOP ARBITRAGE TARGETS ===');
        const arbitrageTargets = allTokens
            .filter(t => (t.liquidityScore || 0) >= 0.7)
            .sort((a, b) => (b.liquidityScore || 0) - (a.liquidityScore || 0))
            .slice(0, 12);
            
        arbitrageTargets.forEach((token, i) => {
            console.log(`   ${(i + 1).toString().padStart(2)}. ${token.symbol.padEnd(8)} | ${token.name.substring(0, 30).padEnd(30)} | Score: ${token.liquidityScore}`);
        });
        
        // === NEW TOKENS ADDED ===
        console.log('\n🆕 === NEW TOKENS ADDED ===');
        const newTokens = allTokens.filter(t => 
            ['USDe', 'UNI', 'cbBTC', 'PEPE', 'ARB', 'COMP', 'CRV', 'BAL', 'LINK', 'GMX'].includes(t.symbol)
        );
        newTokens.forEach(token => {
            console.log(`   ${token.symbol.padEnd(8)} | ${token.address} | Score: ${token.liquidityScore}`);
        });
        
        // === PRIORITY PAIRS ANALYSIS ===
        console.log('\n🔄 === PRIORITY PAIRS FOR ARBITRAGE ===');
        const PRIORITY_PAIRS = ARBITRUM_DEX_CONFIG.priorityPairs;
        console.log(`   Total priority pairs configured: ${PRIORITY_PAIRS.length}`);
        
        // Show USDT/USDC/DAI focused pairs
        const stablecoinPairs = PRIORITY_PAIRS.filter(pair => 
            ['USDT', 'USDC', 'DAI'].includes(pair[0]) || ['USDT', 'USDC', 'DAI'].includes(pair[1])
        );
        console.log(`   Stablecoin-focused pairs: ${stablecoinPairs.length}`);
        
        // Show some example pairs
        console.log('\n   Example stablecoin arbitrage pairs:');
        stablecoinPairs.slice(0, 8).forEach(pair => {
            console.log(`     ${pair[0]} ↔ ${pair[1]}`);
        });
        
        console.log('\n✅ Token configuration test completed successfully!');
        console.log('\n📈 Ready for USDT/USDC/DAI triangular arbitrage scanning!');
        
    } catch (error) {
        console.error('❌ Error testing token configuration:', error.message);
        console.error('Stack:', error.stack);
    }
}

testArbitrageWithNewTokens().catch(console.error);
