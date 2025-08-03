async function testExpandedTokens() {
    console.log('Testing expanded token configuration...\n');
    
    try {
        const { TokenFetcher } = require('./dist/TokenFetcher');
        console.log('✅ TokenFetcher imported successfully');
        
        const tokenFetcher = new TokenFetcher('arbitrum');
        console.log('✅ TokenFetcher instance created');
        
        // Test fetching all tokens
        const allTokens = await tokenFetcher.fetchTokens();
        console.log(`✅ Total tokens available: ${allTokens.length}`);
        
        // Test fetching high liquidity tokens only
        const highLiquidityTokens = await tokenFetcher.fetchTokens({ minLiquidity: 0.8 });
        console.log(`✅ High liquidity tokens (>= 0.8): ${highLiquidityTokens.length}`);
        
        // Test fetching top tier tokens only
        const topTierTokens = await tokenFetcher.fetchTokens({ minLiquidity: 1.0 });
        console.log(`✅ Top tier tokens (1.0): ${topTierTokens.length}`);
        
        console.log('\n=== BASE TOKENS (USDT/USDC/DAI Focus) ===');
        const baseTokens = allTokens.filter(t => 
            ['USDT', 'USDC', 'DAI', 'WETH'].includes(t.symbol)
        );
        baseTokens.forEach(token => {
            console.log(`${token.symbol}: ${token.name} (Liquidity: ${token.liquidityScore})`);
        });
        
        console.log('\n=== TOP ARBITRAGE TARGETS ===');
        const arbitrageTargets = allTokens
            .filter(t => (t.liquidityScore || 0) >= 0.7)
            .sort((a, b) => (b.liquidityScore || 0) - (a.liquidityScore || 0))
            .slice(0, 10);
            
        arbitrageTargets.forEach((token, i) => {
            console.log(`${i + 1}. ${token.symbol}: ${token.name} (Score: ${token.liquidityScore})`);
        });
        
        console.log('\n=== NEW TOKENS ADDED ===');
        const newTokens = allTokens.filter(t => 
            ['USDe', 'UNI', 'cbBTC', 'PEPE', 'ARB', 'COMP', 'CRV', 'BAL'].includes(t.symbol)
        );
        newTokens.forEach(token => {
            console.log(`${token.symbol}: ${token.address} (Score: ${token.liquidityScore})`);
        });
        
        console.log('\n✅ Token configuration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing token configuration:', error.message);
        console.error('Stack:', error.stack);
    }
}

testExpandedTokens().catch(console.error);
