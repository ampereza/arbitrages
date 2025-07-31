// Realistic Flash Loan Arbitrage Example
// Scenario: Borrow from AAVE, buy on Sushiswap, sell on Uniswap V3

const buyPrice = 0.0027;      // Buy UNI on Sushiswap
const sellPrice = 0.0028;     // Sell UNI on Uniswap V3
const amount = 10000;         // 10,000 UNI tokens for meaningful arbitrage

// Fees
const aaveFlashLoanFee = 0.001;  // 0.1% AAVE flash loan fee
const sushiTradingFee = 0.003;   // 0.3% Sushiswap trading fee  
const uniV3TradingFee = 0.0005;  // 0.05% Uniswap V3 trading fee
const gasFeesUSD = 150;          // $150 gas for flash loan + 2 swaps

console.log('🏦 FLASH LOAN ARBITRAGE CALCULATION');
console.log('=====================================');
console.log(`Trade Size: ${amount.toLocaleString()} UNI tokens`);
console.log(`Buy Price (Sushiswap): $${buyPrice}`);
console.log(`Sell Price (Uniswap V3): $${sellPrice}`);
console.log();

// Step 1: Calculate revenue (selling on Uniswap V3)
const grossRevenue = amount * sellPrice;
const uniV3Fee = grossRevenue * uniV3TradingFee;
const netRevenue = grossRevenue - uniV3Fee;

console.log('💰 REVENUE BREAKDOWN:');
console.log(`Gross Revenue: $${grossRevenue.toFixed(2)}`);
console.log(`Uniswap V3 Fee (0.05%): -$${uniV3Fee.toFixed(2)}`);
console.log(`Net Revenue: $${netRevenue.toFixed(2)}`);
console.log();

// Step 2: Calculate costs
const buyAmount = amount * buyPrice;
const sushiFee = buyAmount * sushiTradingFee;
const buyCost = buyAmount + sushiFee;

const aaveFlashLoanCost = buyAmount * aaveFlashLoanFee;

const totalCosts = buyCost + aaveFlashLoanCost + gasFeesUSD;

console.log('💸 COST BREAKDOWN:');
console.log(`Buy Cost: $${buyAmount.toFixed(2)}`);
console.log(`Sushiswap Fee (0.3%): -$${sushiFee.toFixed(2)}`);
console.log(`AAVE Flash Loan Fee (0.1%): -$${aaveFlashLoanCost.toFixed(2)}`);
console.log(`Gas Fees: -$${gasFeesUSD.toFixed(2)}`);
console.log(`Total Costs: $${totalCosts.toFixed(2)}`);
console.log();

// Step 3: Calculate profit
const grossProfit = grossRevenue - buyAmount;
const netProfit = netRevenue - totalCosts;
const totalFees = uniV3Fee + sushiFee + aaveFlashLoanCost + gasFeesUSD;
const totalFeesPercent = (totalFees / buyAmount) * 100;
const profitMargin = (netProfit / buyAmount) * 100;

console.log('📊 PROFIT ANALYSIS:');
console.log(`Gross Profit (before fees): $${grossProfit.toFixed(2)}`);
console.log(`Total Fees: $${totalFees.toFixed(2)} (${totalFeesPercent.toFixed(2)}%)`);
console.log(`Net Profit: $${netProfit.toFixed(2)}`);
console.log(`Profit Margin: ${profitMargin.toFixed(2)}%`);
console.log(`Viable: ${netProfit > 0 ? '✅ YES' : '❌ NO'}`);
console.log();

console.log('🎯 KEY INSIGHTS:');
console.log(`• Total fee burden: ${totalFeesPercent.toFixed(2)}% (0.1% + 0.3% + 0.05% + gas)`);
console.log(`• Break-even price difference: ${(totalFeesPercent/100).toFixed(4)} per token`);
console.log(`• Minimum profit needed: $${totalFees.toFixed(2)} + desired margin`);

if (netProfit > 0) {
    console.log(`• 🚀 This arbitrage opportunity is profitable!`);
} else {
    console.log(`• ⚠️  This arbitrage would result in a loss`);
}
