// Comprehensive Slippage Impact Analysis for Flash Loan Arbitrage

console.log('🔄 SLIPPAGE IMPACT ON ARBITRAGE PROFITABILITY');
console.log('==============================================');

// Mock scenario: UNI token arbitrage
const baseScenario = {
    buyPrice: 10.00,
    sellPrice: 10.20,
    amount: 5000, // 5000 UNI tokens
    buyDexFee: 0.003, // 0.3%
    sellDexFee: 0.0005, // 0.05% Uniswap V3
    flashLoanFee: 0.001, // 0.1% AAVE
    gasFeesUSD: 150
};

// Different slippage scenarios
const slippageScenarios = [
    { name: 'No Slippage (Theoretical)', buySlip: 0, sellSlip: 0 },
    { name: 'Low Slippage (High Liquidity)', buySlip: 0.002, sellSlip: 0.002 }, // 0.2%
    { name: 'Medium Slippage (Normal)', buySlip: 0.005, sellSlip: 0.005 }, // 0.5%
    { name: 'High Slippage (Low Liquidity)', buySlip: 0.015, sellSlip: 0.015 }, // 1.5%
    { name: 'Very High Slippage (Thin Pool)', buySlip: 0.03, sellSlip: 0.03 } // 3%
];

function calculateArbitrageWithSlippage(scenario, buySlip, sellSlip) {
    // Apply slippage to prices
    const effectiveBuyPrice = scenario.buyPrice * (1 + buySlip);
    const effectiveSellPrice = scenario.sellPrice * (1 - sellSlip);
    
    // Calculate revenue (with slippage)
    const grossRevenue = scenario.amount * effectiveSellPrice;
    const sellFeeAmount = grossRevenue * scenario.sellDexFee;
    const netRevenue = grossRevenue - sellFeeAmount;
    
    // Calculate costs (with slippage)
    const buyAmount = scenario.amount * effectiveBuyPrice;
    const buyFeeAmount = buyAmount * scenario.buyDexFee;
    const buyCost = buyAmount + buyFeeAmount;
    
    const flashLoanCost = buyAmount * scenario.flashLoanFee;
    const totalCosts = buyCost + flashLoanCost + scenario.gasFeesUSD;
    
    // Calculate slippage impact
    const slippageCost = (scenario.amount * scenario.buyPrice * buySlip) + 
                        (scenario.amount * scenario.sellPrice * sellSlip);
    
    // Final calculations
    const grossProfit = (scenario.amount * scenario.sellPrice) - (scenario.amount * scenario.buyPrice);
    const netProfit = netRevenue - totalCosts;
    const profitMargin = (netProfit / (scenario.amount * scenario.buyPrice)) * 100;
    
    return {
        effectiveBuyPrice,
        effectiveSellPrice,
        grossProfit,
        netProfit,
        profitMargin,
        slippageCost,
        totalCosts,
        viable: netProfit > 0
    };
}

console.log(`Base Scenario: ${baseScenario.amount} UNI @ $${baseScenario.buyPrice} → $${baseScenario.sellPrice}`);
console.log(`Target Gross Profit: $${((baseScenario.sellPrice - baseScenario.buyPrice) * baseScenario.amount).toFixed(2)}\n`);

slippageScenarios.forEach((slip, i) => {
    const result = calculateArbitrageWithSlippage(baseScenario, slip.buySlip, slip.sellSlip);
    
    console.log(`${i + 1}. ${slip.name}`);
    console.log(`   Buy Slippage: ${(slip.buySlip * 100).toFixed(1)}% | Sell Slippage: ${(slip.sellSlip * 100).toFixed(1)}%`);
    console.log(`   Effective Prices: $${result.effectiveBuyPrice.toFixed(4)} → $${result.effectiveSellPrice.toFixed(4)}`);
    console.log(`   Slippage Cost: $${result.slippageCost.toFixed(2)}`);
    console.log(`   Net Profit: $${result.netProfit.toFixed(2)} (${result.profitMargin.toFixed(2)}%)`);
    console.log(`   Status: ${result.viable ? '✅ PROFITABLE' : '❌ LOSS'}`);
    console.log('');
});

// Trade size optimization example
console.log('\n📊 TRADE SIZE vs SLIPPAGE OPTIMIZATION');
console.log('=====================================');

const poolLiquidity = 2000000; // $2M pool liquidity
const tradeSizes = [1000, 5000, 10000, 25000, 50000];

console.log('Trade Size | Slippage | Net Profit | Profit/Size | Viable');
console.log('-----------|----------|------------|-------------|-------');

tradeSizes.forEach(size => {
    // Estimate slippage based on trade impact
    const tradeValue = size * baseScenario.buyPrice;
    const tradeImpact = tradeValue / poolLiquidity;
    const estimatedSlippage = Math.sqrt(tradeImpact) * 0.5; // Simplified model
    const cappedSlippage = Math.min(estimatedSlippage, 0.05); // Max 5%
    
    const testScenario = { ...baseScenario, amount: size };
    const result = calculateArbitrageWithSlippage(testScenario, cappedSlippage, cappedSlippage);
    const profitPerToken = result.netProfit / size;
    
    console.log(
        `${size.toString().padStart(10)} | ` +
        `${(cappedSlippage * 100).toFixed(2)}%`.padStart(8) + ' | ' +
        `$${result.netProfit.toFixed(0)}`.padStart(10) + ' | ' +
        `$${profitPerToken.toFixed(4)}`.padStart(11) + ' | ' +
        (result.viable ? '✅' : '❌')
    );
});

console.log('\n🎯 KEY INSIGHTS:');
console.log('• Slippage can completely eliminate arbitrage profits');
console.log('• Larger trades = higher slippage but better gas efficiency');
console.log('• Optimal trade size balances slippage vs fixed costs');
console.log('• Pool liquidity depth is critical for trade sizing');
console.log('• Always simulate slippage before executing trades');

