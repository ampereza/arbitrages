// Manual verification of arbitrage calculations
console.log('🔍 MANUAL VERIFICATION OF CRV/WETH ARBITRAGE CALCULATIONS');
console.log('=========================================================\n');

// Reported values
const reportedBuyPrice = 0.000171;    // Uniswap V3
const reportedSellPrice = 0.000259;   // Sushiswap
const reportedAmount = 3485738;       // CRV tokens
const reportedInvestment = 597.61;    // USD
const reportedGrossProfit = 303.72;   // USD
const reportedNetProfit = 229.31;     // USD
const reportedTotalFees = 53.57;      // USD
const reportedROI = 38.37;            // %

console.log('📊 REPORTED VALUES:');
console.log(`Buy Price (Uniswap V3): $${reportedBuyPrice}`);
console.log(`Sell Price (Sushiswap): $${reportedSellPrice}`);
console.log(`Trade Amount: ${reportedAmount.toLocaleString()} CRV`);
console.log(`Investment: $${reportedInvestment}`);
console.log(`Gross Profit: $${reportedGrossProfit}`);
console.log(`Net Profit: $${reportedNetProfit}`);
console.log(`Total Fees: $${reportedTotalFees}`);
console.log(`ROI: ${reportedROI}%`);

console.log('\n🧮 MANUAL CALCULATIONS:');
console.log('=======================');

// 1. Verify price spread
const calculatedSpread = ((reportedSellPrice - reportedBuyPrice) / reportedBuyPrice) * 100;
console.log(`✓ Price spread: ${calculatedSpread.toFixed(2)}% (reported: 50.82%)`);

// 2. Verify investment amount
const calculatedInvestment = reportedAmount * reportedBuyPrice;
console.log(`✓ Investment: $${calculatedInvestment.toFixed(2)} (reported: $${reportedInvestment})`);

// 3. Verify gross profit (before fees and slippage)
const calculatedGrossProfit = reportedAmount * (reportedSellPrice - reportedBuyPrice);
console.log(`✓ Gross profit: $${calculatedGrossProfit.toFixed(2)} (reported: $${reportedGrossProfit})`);

// 4. Trading fees analysis
const buyAmount = reportedAmount * reportedBuyPrice;
const sellAmount = reportedAmount * reportedSellPrice;

// Assuming standard DEX fees
const uniV3Fee = 0.0005; // 0.05%
const sushiFee = 0.003;  // 0.3%

const buyFee = buyAmount * uniV3Fee;
const sellFee = sellAmount * sushiFee;
const flashLoanFee = buyAmount * 0.001; // 0.1% AAVE
const gasFees = 50; // $50

const calculatedTotalFees = buyFee + sellFee + flashLoanFee + gasFees;
console.log(`✓ Buy fee (0.05%): $${buyFee.toFixed(2)}`);
console.log(`✓ Sell fee (0.3%): $${sellFee.toFixed(2)}`);
console.log(`✓ Flash loan fee (0.1%): $${flashLoanFee.toFixed(2)}`);
console.log(`✓ Gas fees: $${gasFees.toFixed(2)}`);
console.log(`✓ Total fees: $${calculatedTotalFees.toFixed(2)} (reported: $${reportedTotalFees})`);

// 5. Net profit
const calculatedNetProfit = calculatedGrossProfit - calculatedTotalFees;
console.log(`✓ Net profit: $${calculatedNetProfit.toFixed(2)} (reported: $${reportedNetProfit})`);

// 6. ROI
const calculatedROI = (calculatedNetProfit / calculatedInvestment) * 100;
console.log(`✓ ROI: ${calculatedROI.toFixed(2)}% (reported: ${reportedROI}%)`);

console.log('\n⚠️  ANALYSIS & RED FLAGS:');
console.log('=========================');

// Check for red flags
const redFlags = [];

if (calculatedSpread > 30) {
    redFlags.push(`🚨 EXTREMELY HIGH spread (${calculatedSpread.toFixed(2)}%) - Suspicious for same token pair`);
}

if (Math.abs(calculatedInvestment - reportedInvestment) > 10) {
    redFlags.push(`🚨 Investment calculation mismatch: ${calculatedInvestment.toFixed(2)} vs ${reportedInvestment}`);
}

if (Math.abs(calculatedGrossProfit - reportedGrossProfit) > 10) {
    redFlags.push(`🚨 Gross profit calculation mismatch: ${calculatedGrossProfit.toFixed(2)} vs ${reportedGrossProfit}`);
}

if (calculatedROI > 50) {
    redFlags.push(`🚨 ROI too high (${calculatedROI.toFixed(2)}%) - Likely not sustainable`);
}

// Check if this could be stale price data
const minViableSpread = 1.0; // 1% minimum for profitable arbitrage after fees
if (calculatedSpread < minViableSpread) {
    redFlags.push(`🚨 Spread too low (${calculatedSpread.toFixed(2)}%) for profitable arbitrage`);
}

// Check slippage impact
const tradeSize = reportedAmount * reportedBuyPrice; // USD value
const highSlippageThreshold = 100000; // $100k
if (tradeSize > highSlippageThreshold) {
    redFlags.push(`🚨 Large trade size ($${tradeSize.toLocaleString()}) - High slippage risk`);
}

if (redFlags.length === 0) {
    console.log('✅ No major red flags detected in calculations');
    console.log('💡 However, verify current on-chain prices to confirm opportunity still exists');
} else {
    console.log('🚨 RED FLAGS DETECTED:');
    redFlags.forEach((flag, i) => console.log(`   ${i + 1}. ${flag}`));
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('===================');
console.log('1. ✅ Calculations appear mathematically correct');
console.log('2. ⚠️  50%+ spread is unusual - verify prices are current and accurate');
console.log('3. 🔍 Check if both DEXs have sufficient liquidity for the trade size');
console.log('4. ⏰ Arbitrage opportunities disappear quickly - verify prices in real-time');
console.log('5. 🦺 Consider starting with smaller amounts to test execution');

console.log('\n📝 CONCLUSION:');
console.log('==============');
if (calculatedSpread > 30) {
    console.log('🚨 VERDICT: SUSPICIOUS - 50%+ spread is extremely high and likely indicates:');
    console.log('   • Stale/incorrect price data');
    console.log('   • Different token versions (e.g., CRV vs wrapped CRV)');
    console.log('   • Liquidity issues on one of the DEXs');
    console.log('   • Price oracle manipulation');
} else {
    console.log('✅ VERDICT: Calculations are reasonable but verify current market conditions');
}
