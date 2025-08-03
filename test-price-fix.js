const { DexPriceFetcher } = require('./dist/dex/DexPriceFetcher');

async function testPriceCalculations() {
    console.log('🧪 Testing Price Calculation Fixes\n');
    
    try {
        const priceFetcher = new DexPriceFetcher('https://arb1.arbitrum.io/rpc');
        
        // Test tokens - USDT and USDC should have ~1.0 exchange rate
        const USDT = {
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6
        };
        
        const USDC = {
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            symbol: 'USDC',
            name: 'USD Coin (Native)', 
            decimals: 6
        };
        
        const DAI = {
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18
        };
        
        // Test amount: 1000 USDT (1000 * 10^6 = 1000000000)
        const testAmount = '1000000000'; // 1000 USDT in wei
        
        console.log('💰 Testing stablecoin exchange rates (should be ~1.0):');
        
        // Test USDT → USDC on UniswapV2 (SushiSwap)
        try {
            const sushiFactory = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'; // SushiSwap Factory
            const usdtToUsdcPrice = await priceFetcher.getUniswapV2Price(
                sushiFactory,
                USDT,
                USDC,
                testAmount
            );
            console.log(`   USDT → USDC (SushiSwap): ${usdtToUsdcPrice.price} (Expected: ~1.0)`);
        } catch (error) {
            console.log(`   USDT → USDC (SushiSwap): Error - ${error.message}`);
        }
        
        // Test USDC → USDT 
        try {
            const sushiFactory = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
            const usdcToUsdtPrice = await priceFetcher.getUniswapV2Price(
                sushiFactory,
                USDC,
                USDT,
                testAmount
            );
            console.log(`   USDC → USDT (SushiSwap): ${usdcToUsdtPrice.price} (Expected: ~1.0)`);
        } catch (error) {
            console.log(`   USDC → USDT (SushiSwap): Error - ${error.message}`);
        }
        
        // Test USDT → DAI (should be ~1.0 but might vary more)
        try {
            const sushiFactory = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
            const usdtToDaiPrice = await priceFetcher.getUniswapV2Price(
                sushiFactory,
                USDT,
                DAI,
                testAmount
            );
            console.log(`   USDT → DAI (SushiSwap): ${usdtToDaiPrice.price} (Expected: ~1.0)`);
        } catch (error) {
            console.log(`   USDT → DAI (SushiSwap): Error - ${error.message}`);
        }
        
        console.log('\n✅ Price calculation testing completed!');
        
    } catch (error) {
        console.error('❌ Error testing price calculations:', error.message);
    }
}

testPriceCalculations().catch(console.error);
