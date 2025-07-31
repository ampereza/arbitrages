// Example: Comparing fees across all 4 DEXs
const buyPrice = 0.0027;
const sellPrice = 0.0028;
const amount = 100;

console.log('=== DEX Fee Comparison ===');
console.log(`Trade: Buy 100 UNI at $${buyPrice}, Sell at $${sellPrice}`);
console.log();

const exchanges = [
    { name: 'Uniswap V2', fee: 0.003 },
    { name: 'Uniswap V3 (0.05%)', fee: 0.0005 },
    { name: 'Uniswap V3 (0.3%)', fee: 0.003 },
    { name: 'Sushiswap', fee: 0.003 },
    { name: 'AAVE V3', fee: 0.001 }
];

exchanges.forEach(dex => {
    const buyCost = amount * buyPrice * (1 + dex.fee);
    const sellRevenue = amount * sellPrice * (1 - dex.fee);
    const netProfit = sellRevenue - buyCost;
    const profitMargin = (netProfit / buyCost) * 100;
    
    console.log(`${dex.name.padEnd(20)} | Fee: ${(dex.fee * 100).toFixed(2)}% | Net Profit: $${netProfit.toFixed(4)} | Margin: ${profitMargin.toFixed(2)}%`);
});

console.log();
console.log('💡 Key Insight: AAVE\'s 0.1% fee makes it competitive for arbitrage!');
