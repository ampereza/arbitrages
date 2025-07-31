// Example: UNI/WETH arbitrage with fees
const buyPrice = 0.0027;     // Buy on Sushiswap
const sellPrice = 0.0028;    // Sell on Uniswap V3
const buyFee = 0.003;        // 0.3% Sushiswap fee
const sellFee = 0.0005;      // 0.05% Uniswap V3 fee
const amount = 100;          // 100 UNI tokens

// Without fees
const grossProfit = (sellPrice - buyPrice) * amount;
console.log(`Gross profit (no fees): $${grossProfit.toFixed(4)}`);

// With fees
const buyCost = amount * buyPrice * (1 + buyFee);
const sellRevenue = amount * sellPrice * (1 - sellFee);
const netProfit = sellRevenue - buyCost;
const profitMargin = (netProfit / buyCost) * 100;

console.log(`\n--- Fee Breakdown ---`);
console.log(`Buy cost (with 0.3% fee): $${buyCost.toFixed(4)}`);
console.log(`Sell revenue (with 0.05% fee): $${sellRevenue.toFixed(4)}`);
console.log(`Net profit: $${netProfit.toFixed(4)}`);
console.log(`Profit margin: ${profitMargin.toFixed(2)}%`);
console.log(`Viable: ${netProfit > 0 ? 'YES' : 'NO'}`);
