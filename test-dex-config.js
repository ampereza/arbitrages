const { ARBITRUM_DEX_CONFIG } = require('./dist/config/dex-config');

console.log('🧪 TESTING DEX CONFIGURATION');
console.log('==============================\n');

// Test 1: Check if DEX config loads properly
console.log('📋 1. Testing DEX Config Structure...');
try {
    console.log(`✅ Found ${ARBITRUM_DEX_CONFIG.dexes.length} DEXes configured`);
    console.log(`✅ Found ${ARBITRUM_DEX_CONFIG.priorityPairs.length} priority pairs`);
    console.log(`✅ Arbitrage settings loaded`);
    
    // List enabled DEXes
    const enabledDexes = ARBITRUM_DEX_CONFIG.dexes.filter(d => d.enabled);
    console.log(`\n🟢 Enabled DEXes (${enabledDexes.length}):`);
    enabledDexes.forEach(dex => {
        console.log(`   • ${dex.name} (Priority: ${dex.priority}) - ${dex.description}`);
    });
    
    console.log('\n✅ DEX Configuration Test PASSED\n');
} catch (error) {
    console.log('❌ DEX Configuration Test FAILED:', error.message);
    process.exit(1);
}

// Test 2: Validate DEX addresses
console.log('🏭 2. Testing DEX Address Validation...');
try {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    ARBITRUM_DEX_CONFIG.dexes.forEach(dex => {
        if (dex.factory && !addressRegex.test(dex.factory)) {
            throw new Error(`Invalid factory address for ${dex.name}: ${dex.factory}`);
        }
        if (dex.router && !addressRegex.test(dex.router)) {
            throw new Error(`Invalid router address for ${dex.name}: ${dex.router}`);
        }
        if (dex.vault && !addressRegex.test(dex.vault)) {
            throw new Error(`Invalid vault address for ${dex.name}: ${dex.vault}`);
        }
        console.log(`   ✅ ${dex.name} addresses are valid`);
    });
    
    console.log('\n✅ Address Validation Test PASSED\n');
} catch (error) {
    console.log('❌ Address Validation Test FAILED:', error.message);
    process.exit(1);
}

// Test 3: Check arbitrage settings
console.log('⚙️  3. Testing Arbitrage Settings...');
try {
    const settings = ARBITRUM_DEX_CONFIG.arbitrageSettings;
    
    if (settings.minProfitPercent <= 0) {
        throw new Error('Minimum profit percent must be positive');
    }
    if (settings.maxSlippage <= 0 || settings.maxSlippage > 100) {
        throw new Error('Max slippage must be between 0 and 100');
    }
    if (settings.scanInterval < 1000) {
        throw new Error('Scan interval should be at least 1 second');
    }
    
    console.log(`   ✅ Min Profit: ${settings.minProfitPercent}%`);
    console.log(`   ✅ Max Slippage: ${settings.maxSlippage}%`);
    console.log(`   ✅ Scan Interval: ${settings.scanInterval}ms`);
    console.log(`   ✅ Min Trade Size: ${settings.minTradeSize} wei`);
    console.log(`   ✅ Max Trade Size: ${settings.maxTradeSize} wei`);
    
    console.log('\n✅ Arbitrage Settings Test PASSED\n');
} catch (error) {
    console.log('❌ Arbitrage Settings Test FAILED:', error.message);
    process.exit(1);
}

console.log('🎉 ALL DEX CONFIGURATION TESTS PASSED!');
console.log('=====================================');
