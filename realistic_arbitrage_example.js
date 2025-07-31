// Realistic Flash Loan Arbitrage - Proper Scale
// Need larger price differences and trade sizes to overcome gas costs

console.log('🔍 FINDING PROFITABLE ARBITRAGE OPPORTUNITIES');
console.log('==============================================');

const scenarios = [
    {
        name: "Small Price Gap (Current UNI Example)",
        buyPrice: 10.27,
        sellPrice: 10.30, 
        amount: 1000,
        gasCost: 150
    },
    {
        name: "Medium Price Gap (1% difference)",
        buyPrice: 10.00,
        sellPrice: 10.10,
        amount: 5000,
        gasCost: 150
    },
    {
        name: "Large Price Gap (2% difference)", 
        buyPrice: 10.00,
        sellPrice: 10.20,
        amount: 10000,
        gasCost: 150
    }
];

scenarios.forEach((scenario, i) => {
    console.log(`\n${i+1}. ${scenario.name}`);
    console.log(`   Price: $${scenario.buyPrice} → $${scenario.sellPrice}`);
    console.log(`   Size: ${scenario.amount.toLocaleString()} tokens`);
    
    // Costs
    const buyAmount = scenario.amount * scenario.buyPrice;
    const sushiFee = buyAmount * 0.003;
    const uniV3Fee = (scenario.amount * scenario.sellPrice) * 0.0005;
    const aaveFee = buyAmount * 0.001;
    const totalFees = sushiFee + uniV3Fee + aaveFee + scenario.gasCost;
    
    // Revenue
    const grossRevenue = scenario.amount * scenario.sellPrice;
    const netRevenue = grossRevenue - uniV3Fee;
    
    // Profit
    const netProfit = netRevenue - buyAmount - sushiFee - aaveFee - scenario.gasCost;
    const profitMargin = (netProfit / buyAmount) * 100;
    
    console.log(`   Total Fees: $${totalFees.toFixed(2)} (${((totalFees/buyAmount)*100).toFixed(2)}%)`);
    console.log(`   Net Profit: $${netProfit.toFixed(2)} (${profitMargin.toFixed(2)}%)`);
    console.log(`   Status: ${netProfit > 0 ? '✅ PROFITABLE' : '❌ LOSS'}`);
});

console.log('\n🎯 KEY LEARNINGS:');
console.log('• Gas costs dominate small arbitrages');
console.log('• Need >0.7% price difference + gas coverage');
console.log('• Larger trade sizes improve efficiency');
console.log('• Flash loans enable capital-free arbitrage');
