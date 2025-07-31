/**
 * PRACTICAL ARBITRAGE TRADE SIZING EXAMPLE
 * ========================================
 * 
 * This example demonstrates how to use the new profit-targeting functionality
 * to determine exact trade amounts for profitable arbitrage opportunities.
 */

// Example usage of the new calculateMinimumProfitableAmount method
console.log('💰 ARBITRAGE PROFIT TARGETING CALCULATOR');
console.log('========================================\n');

// Simulate different arbitrage scenarios
const scenarios = [
    {
        name: 'High Volume WETH/USDC',
        buyPrice: 2500,
        sellPrice: 2515,
        buyFee: 0.003,
        sellFee: 0.003,
        flashLoanFee: 0.001,
        gasFeesUSD: 75,
        minProfitTarget: 200,
        buyLiquidity: 10000000,
        sellLiquidity: 8000000,
        maxSlippage: 0.015
    },
    {
        name: 'Small Cap Token Opportunity',
        buyPrice: 1.50,
        sellPrice: 1.58,
        buyFee: 0.003,
        sellFee: 0.003,
        flashLoanFee: 0.001,
        gasFeesUSD: 50,
        minProfitTarget: 100,
        buyLiquidity: 500000,
        sellLiquidity: 600000,
        maxSlippage: 0.025
    },
    {
        name: 'Stablecoin Arbitrage',
        buyPrice: 0.998,
        sellPrice: 1.002,
        buyFee: 0.001,
        sellFee: 0.001,
        flashLoanFee: 0.001,
        gasFeesUSD: 30,
        minProfitTarget: 50,
        buyLiquidity: 20000000,
        sellLiquidity: 25000000,
        maxSlippage: 0.005
    }
];

function calculateMinimumProfitableAmount(scenario) {
    const { buyPrice, sellPrice, buyFee, sellFee, flashLoanFee, gasFeesUSD, 
            minProfitTarget, buyLiquidity, sellLiquidity, maxSlippage } = scenario;
    
    // Check if arbitrage is theoretically possible
    if (sellPrice <= buyPrice) {
        return {
            minAmount: 0,
            maxAmount: 0,
            recommendedAmount: 0,
            profitable: false,
            reason: 'No price difference - sell price must be higher than buy price'
        };
    }

    // Binary search to find minimum profitable amount
    let minAmount = 100;
    let maxTestAmount = Math.min(
        buyLiquidity / buyPrice * 0.1, // Max 10% of pool liquidity
        sellLiquidity / sellPrice * 0.1
    );

    let foundProfitable = false;
    let bestAmount = 0;
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations && minAmount <= maxTestAmount) {
        const testAmount = (minAmount + maxTestAmount) / 2;
        
        // Estimate slippage for this trade size
        const tradeValueUSD = testAmount * buyPrice;
        const buyTradeImpact = tradeValueUSD / buyLiquidity;
        const sellTradeImpact = tradeValueUSD / sellLiquidity;
        
        const buySlippage = Math.sqrt(buyTradeImpact) * 0.5;
        const sellSlippage = Math.sqrt(sellTradeImpact) * 0.5;
        
        // Check if slippage is acceptable
        if (buySlippage > maxSlippage || sellSlippage > maxSlippage) {
            maxTestAmount = testAmount - 1;
            iterations++;
            continue;
        }

        // Calculate profit for this amount
        const effectiveBuyPrice = buyPrice * (1 + buySlippage);
        const effectiveSellPrice = sellPrice * (1 - sellSlippage);
        
        const grossRevenue = testAmount * effectiveSellPrice;
        const sellFeeAmount = grossRevenue * sellFee;
        const netRevenue = grossRevenue - sellFeeAmount;
        
        const buyAmount = testAmount * effectiveBuyPrice;
        const buyFeeAmount = buyAmount * buyFee;
        const buyCost = buyAmount + buyFeeAmount;
        
        const flashLoanCost = buyAmount * flashLoanFee;
        const totalCosts = buyCost + flashLoanCost + gasFeesUSD;
        
        const netProfit = netRevenue - totalCosts;

        if (netProfit >= minProfitTarget) {
            foundProfitable = true;
            bestAmount = testAmount;
            maxTestAmount = testAmount - 1; // Try to find smaller amount
        } else {
            minAmount = testAmount + 1; // Need larger amount
        }
        
        iterations++;
    }

    if (!foundProfitable) {
        return {
            minAmount: 0,
            maxAmount: 0,
            recommendedAmount: 0,
            profitable: false,
            reason: 'Insufficient profit margin after all costs'
        };
    }

    // Find optimal amount (maximize profit within constraints)
    let optimalAmount = bestAmount;
    let maxProfit = 0;

    for (let amount = bestAmount; amount <= maxTestAmount * 2; amount += bestAmount * 0.1) {
        const tradeValueUSD = amount * buyPrice;
        const buyTradeImpact = tradeValueUSD / buyLiquidity;
        const sellTradeImpact = tradeValueUSD / sellLiquidity;
        
        const buySlippage = Math.sqrt(buyTradeImpact) * 0.5;
        const sellSlippage = Math.sqrt(sellTradeImpact) * 0.5;
        
        if (buySlippage > maxSlippage || sellSlippage > maxSlippage) {
            break;
        }

        // Calculate detailed profit
        const effectiveBuyPrice = buyPrice * (1 + buySlippage);
        const effectiveSellPrice = sellPrice * (1 - sellSlippage);
        
        const grossRevenue = amount * effectiveSellPrice;
        const sellFeeAmount = grossRevenue * sellFee;
        const netRevenue = grossRevenue - sellFeeAmount;
        
        const buyAmount = amount * effectiveBuyPrice;
        const buyFeeAmount = buyAmount * buyFee;
        const buyCost = buyAmount + buyFeeAmount;
        
        const flashLoanCost = buyAmount * flashLoanFee;
        const totalCosts = buyCost + flashLoanCost + gasFeesUSD;
        
        const netProfit = netRevenue - totalCosts;

        if (netProfit > maxProfit) {
            maxProfit = netProfit;
            optimalAmount = amount;
        } else {
            break; // Profit is decreasing, we found the optimal point
        }
    }

    return {
        minAmount: Math.floor(bestAmount),
        maxAmount: Math.floor(maxTestAmount),
        recommendedAmount: Math.floor(optimalAmount),
        profitable: true,
        reason: `Profitable with minimum $${minProfitTarget} target`,
        expectedProfit: maxProfit,
        investmentNeeded: optimalAmount * buyPrice
    };
}

// Analyze each scenario
scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log('='.repeat(scenario.name.length + 3));
    console.log(`Buy Price: $${scenario.buyPrice}`);
    console.log(`Sell Price: $${scenario.sellPrice}`);
    console.log(`Price Spread: ${(((scenario.sellPrice - scenario.buyPrice) / scenario.buyPrice) * 100).toFixed(2)}%`);
    console.log(`Profit Target: $${scenario.minProfitTarget}`);
    
    const result = calculateMinimumProfitableAmount(scenario);
    
    if (result.profitable) {
        console.log('\n✅ PROFITABLE OPPORTUNITY:');
        console.log(`🎯 Minimum amount: ${result.minAmount.toLocaleString()} tokens`);
        console.log(`🎯 Recommended amount: ${result.recommendedAmount.toLocaleString()} tokens`);
        console.log(`💰 Investment needed: $${result.investmentNeeded.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
        console.log(`🤑 Expected profit: $${result.expectedProfit.toFixed(2)}`);
        console.log(`📈 ROI: ${((result.expectedProfit / result.investmentNeeded) * 100).toFixed(3)}%`);
    } else {
        console.log('\n❌ NOT PROFITABLE:');
        console.log(`Reason: ${result.reason}`);
    }
    
    console.log('');
});

console.log('🎯 KEY INSIGHTS:');
console.log('================');
console.log('1. Higher liquidity pools allow larger trades with less slippage');
console.log('2. Smaller price spreads require larger amounts to reach profit targets');
console.log('3. Gas fees have bigger impact on smaller value trades');
console.log('4. Flash loan fees scale with trade size (0.1% of borrowed amount)');
console.log('5. Slippage becomes the limiting factor for large trades');
console.log('');
console.log('✅ Use these calculations to determine optimal trade sizes for your capital!');
