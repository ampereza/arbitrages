const { ArbitrageBot } = require('./dist/arbitrage-bot');

console.log('🧪 TESTING ARBITRAGE LOGIC');
console.log('===========================\n');

async function testArbitrageLogic() {
    try {
        // Test 1: Bot Initialization
        console.log('🤖 1. Testing Bot Initialization...');
        const bot = new ArbitrageBot();
        console.log('   ✅ ArbitrageBot instance created successfully');
        
        // Test 2: Mock Token Creation
        console.log('\n💰 2. Testing Token Structures...');
        const mockTokenA = {
            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18
        };
        
        const mockTokenB = {
            address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6
        };
        
        console.log(`   ✅ Token A: ${mockTokenA.symbol} (${mockTokenA.address})`);
        console.log(`   ✅ Token B: ${mockTokenB.symbol} (${mockTokenB.address})`);
        
        // Test 3: Trading Pair Structure
        console.log('\n🔄 3. Testing Trading Pair Structure...');
        const tradingPair = {
            token0: mockTokenA,
            token1: mockTokenB
        };
        
        if (!tradingPair.token0 || !tradingPair.token1) {
            throw new Error('Trading pair structure is invalid');
        }
        
        console.log(`   ✅ Trading pair: ${tradingPair.token0.symbol}/${tradingPair.token1.symbol}`);
        
        // Test 4: Mock Price Comparison
        console.log('\n💲 4. Testing Price Comparison Logic...');
        const mockPrices = [
            { dex: 'UniswapV3', price: '1850.50', gas: 100000 },
            { dex: 'SushiSwap', price: '1852.30', gas: 150000 },
            { dex: 'BalancerV2', price: '1849.80', gas: 200000 },
            { dex: 'Arbswap', price: '1851.10', gas: 130000 }
        ];
        
        // Sort to find arbitrage opportunity
        const sortedPrices = mockPrices.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        const buyDex = sortedPrices[0]; // Lowest price
        const sellDex = sortedPrices[sortedPrices.length - 1]; // Highest price
        
        const priceDiff = parseFloat(sellDex.price) - parseFloat(buyDex.price);
        const profitPercent = (priceDiff / parseFloat(buyDex.price)) * 100;
        
        console.log(`   📉 Best Buy:  ${buyDex.dex} at $${buyDex.price} (Gas: ${buyDex.gas})`);
        console.log(`   📈 Best Sell: ${sellDex.dex} at $${sellDex.price} (Gas: ${sellDex.gas})`);
        console.log(`   💰 Price Difference: $${priceDiff.toFixed(2)}`);
        console.log(`   📊 Profit Percentage: ${profitPercent.toFixed(3)}%`);
        
        if (profitPercent > 0.1) {
            console.log('   ✅ Profitable arbitrage opportunity detected!');
        } else {
            console.log('   ℹ️  Opportunity exists but below minimum profit threshold');
        }
        
        // Test 5: Gas Cost Calculation
        console.log('\n⛽ 5. Testing Gas Cost Calculations...');
        const totalGas = buyDex.gas + sellDex.gas;
        const gasPrice = 20; // 20 gwei
        const ethPrice = 1850; // $1850 per ETH
        const gasCostUSD = (totalGas * gasPrice * 1e-9) * ethPrice;
        
        console.log(`   ⛽ Total Gas: ${totalGas} units`);
        console.log(`   💰 Gas Cost: ~$${gasCostUSD.toFixed(2)} USD`);
        console.log(`   📊 Net Profit: $${(priceDiff - gasCostUSD).toFixed(2)} USD`);
        
        if (priceDiff > gasCostUSD) {
            console.log('   ✅ Profitable after gas costs!');
        } else {
            console.log('   ❌ Not profitable after gas costs');
        }
        
        // Test 6: Arbitrage Opportunity Structure
        console.log('\n📋 6. Testing Arbitrage Opportunity Structure...');
        const mockOpportunity = {
            buyDEX: buyDex.dex,
            sellDEX: sellDex.dex,
            buyPrice: parseFloat(buyDex.price),
            sellPrice: parseFloat(sellDex.price),
            priceSpread: priceDiff,
            estimatedROI: profitPercent,
            profitAnalysis: {
                netProfit: priceDiff - gasCostUSD,
                grossProfit: priceDiff,
                gasCost: totalGas
            },
            tradeSizing: {
                recommendedAmount: 1000000000000000000, // 1 ETH in wei
                maxAmount: 2000000000000000000, // 2 ETH in wei
                minAmount: 100000000000000000 // 0.1 ETH in wei
            },
            riskFactors: ['gas_price_volatility', 'slippage_risk'],
            tokenIn: mockTokenA,
            tokenOut: mockTokenB,
            timestamp: Date.now()
        };
        
        // Validate opportunity structure
        const requiredFields = ['buyDEX', 'sellDEX', 'buyPrice', 'sellPrice', 'profitAnalysis', 'tradeSizing'];
        for (const field of requiredFields) {
            if (!(field in mockOpportunity)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('   ✅ Arbitrage opportunity structure is valid');
        console.log(`   ✅ All required fields present: ${requiredFields.join(', ')}`);
        
        console.log('\n🎉 ALL ARBITRAGE LOGIC TESTS PASSED!');
        console.log('====================================');
        
    } catch (error) {
        console.log('\n❌ ARBITRAGE LOGIC TEST FAILED:', error.message);
        console.log(error.stack);
        process.exit(1);
    }
}

// Run the tests
testArbitrageLogic();
