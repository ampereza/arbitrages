"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfitCalculator = void 0;
const web3_1 = __importDefault(require("web3"));
class ProfitCalculator {
    constructor(web3) {
        this.ethPriceUSD = 3300; // Current ETH price estimate
        this.web3 = web3;
    }
    /**
     * Update ETH price for accurate USD calculations
     */
    updateETHPrice(priceUSD) {
        this.ethPriceUSD = priceUSD;
    }
    /**
     * Calculate comprehensive profit analysis including all trading costs
     */
    async calculateDetailedProfit(opportunity, tradeAmountUSD, options = {}) {
        const { gasPrice = await this.getCurrentGasPrice(), slippageTolerance = 0.005, // 0.5% default slippage
        mevProtection = false, useFlashLoan = true } = options;
        // Calculate trade amounts
        const tradeAmountToken = tradeAmountUSD / opportunity.buyPrice;
        const expectedOutput = tradeAmountToken * opportunity.sellPrice;
        const grossRevenue = expectedOutput - tradeAmountUSD;
        // Calculate all trading costs
        const costs = await this.calculateTradingCosts(opportunity, tradeAmountToken, tradeAmountUSD, gasPrice, slippageTolerance, mevProtection, useFlashLoan);
        // Calculate profit metrics
        const netProfit = grossRevenue - costs.totalCosts;
        const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) : 0;
        const roi = tradeAmountUSD > 0 ? (netProfit / tradeAmountUSD) : 0;
        // Calculate risk metrics
        const breakEvenSpread = (costs.totalCosts / tradeAmountUSD) * 100;
        const currentSpread = opportunity.priceSpread;
        const safetyMargin = currentSpread - breakEvenSpread;
        // Calculate optimal trade sizing
        const tradeSizing = await this.calculateOptimalTradeSizing(opportunity, costs, gasPrice);
        // Calculate market impact and risks
        const marketRisks = this.calculateMarketRisks(opportunity, tradeAmountToken, currentSpread);
        return {
            grossRevenue,
            costs,
            netProfit,
            profitMargin,
            roi,
            breakEvenSpread,
            safetyMargin,
            optimalTradeSize: tradeSizing.optimal,
            maxTradeSize: tradeSizing.maximum,
            minProfitableSize: tradeSizing.minimum,
            priceImpact: marketRisks.priceImpact,
            liquidityRisk: marketRisks.liquidityRisk,
            executionWindow: marketRisks.executionWindow,
            latencyRisk: marketRisks.latencyRisk
        };
    }
    /**
     * Calculate all trading costs including gas, fees, and slippage
     */
    async calculateTradingCosts(opportunity, tradeAmount, tradeAmountUSD, gasPrice, slippageTolerance, mevProtection, useFlashLoan) {
        // 1. Aave Flash Loan Fee (0.1%)
        const aaveFlashLoanFee = useFlashLoan ? 0.001 : 0; // 0.1%
        // 2. Gas costs calculation
        let totalGasUsed = ProfitCalculator.GAS_ESTIMATES.baseTransaction;
        if (useFlashLoan) {
            totalGasUsed += ProfitCalculator.GAS_ESTIMATES.aaveFlashLoan;
        }
        // Add gas for buy transaction
        totalGasUsed += this.getGasEstimateForDex(opportunity.buyDEX);
        // Add gas for sell transaction
        totalGasUsed += this.getGasEstimateForDex(opportunity.sellDEX);
        // Add token approvals (2 approvals typically needed)
        totalGasUsed += ProfitCalculator.GAS_ESTIMATES.tokenApproval * 2;
        const totalGasCostETH = (totalGasUsed * gasPrice * 1e-9); // Convert Gwei to ETH
        const totalGasCostUSD = totalGasCostETH * this.ethPriceUSD;
        // 3. DEX trading fees
        const buyDexFee = ProfitCalculator.DEX_FEES[opportunity.buyDEX] || 0.003;
        const sellDexFee = ProfitCalculator.DEX_FEES[opportunity.sellDEX] || 0.003;
        const buyDexFeeAmount = tradeAmountUSD * buyDexFee;
        const sellDexFeeAmount = (tradeAmount * opportunity.sellPrice) * sellDexFee;
        // 4. Slippage costs
        const buySlippage = slippageTolerance;
        const sellSlippage = slippageTolerance;
        const totalSlippageCost = tradeAmountUSD * (buySlippage + sellSlippage);
        // 5. MEV protection fee (if enabled)
        const mevProtectionFee = mevProtection ? tradeAmountUSD * 0.0005 : 0; // 0.05%
        // 6. Bridge fees (usually not needed on same chain)
        const bridgeFees = 0;
        // Calculate total costs
        const totalCosts = (tradeAmountUSD * aaveFlashLoanFee) + // Flash loan fee
            totalGasCostUSD + // Gas costs
            buyDexFeeAmount + // Buy DEX fee
            sellDexFeeAmount + // Sell DEX fee
            totalSlippageCost + // Slippage costs
            mevProtectionFee + // MEV protection
            bridgeFees; // Bridge fees
        return {
            aaveFlashLoanFee,
            gasPrice,
            totalGasUsed,
            totalGasCostETH,
            totalGasCostUSD,
            buyDexFee,
            sellDexFee,
            buyDexFeeAmount,
            sellDexFeeAmount,
            buySlippage,
            sellSlippage,
            totalSlippageCost,
            mevProtectionFee,
            bridgeFees,
            totalCosts
        };
    }
    /**
     * Get gas estimate for specific DEX
     */
    getGasEstimateForDex(dexName) {
        switch (dexName) {
            case 'UNISWAPV3':
                return ProfitCalculator.GAS_ESTIMATES.uniswapV3Swap;
            case 'SUSHISWAP':
                return ProfitCalculator.GAS_ESTIMATES.sushiSwap;
            case 'CURVE':
                return ProfitCalculator.GAS_ESTIMATES.curveSwap;
            case 'BALANCER':
                return ProfitCalculator.GAS_ESTIMATES.balancerSwap;
            default:
                return ProfitCalculator.GAS_ESTIMATES.uniswapV2Swap;
        }
    }
    /**
     * Calculate optimal trade sizing for maximum profit
     */
    async calculateOptimalTradeSizing(opportunity, baseCosts, gasPrice) {
        const testSizes = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000]; // USD amounts
        let optimalSize = 1000;
        let maxProfit = -Infinity;
        for (const sizeUSD of testSizes) {
            // Calculate profit for this size
            const tradeCosts = await this.calculateTradingCosts(opportunity, sizeUSD / opportunity.buyPrice, sizeUSD, gasPrice, 0.005, // 0.5% slippage
            false, // No MEV protection for sizing calc
            true // Use flash loan
            );
            const grossRevenue = (sizeUSD / opportunity.buyPrice) * opportunity.sellPrice - sizeUSD;
            const netProfit = grossRevenue - tradeCosts.totalCosts;
            if (netProfit > maxProfit) {
                maxProfit = netProfit;
                optimalSize = sizeUSD;
            }
        }
        // Find minimum profitable size
        let minProfitableSize = 100;
        for (const sizeUSD of testSizes) {
            const tradeCosts = await this.calculateTradingCosts(opportunity, sizeUSD / opportunity.buyPrice, sizeUSD, gasPrice, 0.005, false, true);
            const grossRevenue = (sizeUSD / opportunity.buyPrice) * opportunity.sellPrice - sizeUSD;
            const netProfit = grossRevenue - tradeCosts.totalCosts;
            if (netProfit > 0) {
                minProfitableSize = sizeUSD;
                break;
            }
        }
        return {
            optimal: optimalSize,
            maximum: optimalSize * 2, // Conservative max
            minimum: minProfitableSize
        };
    }
    /**
     * Calculate market risks and execution factors
     */
    calculateMarketRisks(opportunity, tradeAmount, currentSpread) {
        // Estimate price impact based on trade size
        // Larger trades have more price impact
        const priceImpact = Math.min(tradeAmount / 100000 * 0.01, 0.05); // Max 5% impact
        // Liquidity risk based on spread size
        // Larger spreads often indicate lower liquidity
        const liquidityRisk = Math.max(0.1, currentSpread / 10);
        // Execution window - how long arbitrage opportunity might last
        // Higher spreads tend to close faster
        const executionWindow = Math.max(30, 300 - (currentSpread * 20)); // 30-300 seconds
        // Latency risk - risk of opportunity disappearing due to delays
        const latencyRisk = currentSpread > 2 ? 0.3 : 0.1; // Higher risk for large spreads
        return {
            priceImpact,
            liquidityRisk,
            executionWindow,
            latencyRisk
        };
    }
    /**
     * Get current gas price from network
     */
    async getCurrentGasPrice() {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            return parseFloat(web3_1.default.utils.fromWei(gasPrice, 'gwei'));
        }
        catch (error) {
            console.warn('Failed to get current gas price, using default');
            return 0.1; // Default 0.1 Gwei for Arbitrum
        }
    }
    /**
     * Quick profit check - simplified calculation for fast screening
     */
    async quickProfitCheck(opportunity, tradeAmountUSD = 1000) {
        // Quick cost estimation
        const aaveFlashLoanFee = tradeAmountUSD * 0.001; // 0.1%
        const estimatedGasCost = 5; // $5 estimated gas cost
        const tradingFees = tradeAmountUSD * 0.006; // 0.6% total trading fees
        const slippageCost = tradeAmountUSD * 0.01; // 1% slippage estimate
        const totalCosts = aaveFlashLoanFee + estimatedGasCost + tradingFees + slippageCost;
        // Calculate profit
        const tradeAmount = tradeAmountUSD / opportunity.buyPrice;
        const grossRevenue = (tradeAmount * opportunity.sellPrice) - tradeAmountUSD;
        const netProfit = grossRevenue - totalCosts;
        const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
        const breakEvenSpread = (totalCosts / tradeAmountUSD) * 100;
        return {
            isProfit: netProfit > 0,
            netProfitUSD: netProfit,
            profitMarginPercent: profitMargin,
            breakEvenSpread
        };
    }
    /**
     * Format profit analysis for display
     */
    formatProfitAnalysis(analysis) {
        return `
💰 PROFIT ANALYSIS
Revenue: $${analysis.grossRevenue.toFixed(2)}
Costs: $${analysis.costs.totalCosts.toFixed(2)}
Net Profit: $${analysis.netProfit.toFixed(2)} (${(analysis.profitMargin * 100).toFixed(2)}%)
ROI: ${(analysis.roi * 100).toFixed(2)}%

💸 COST BREAKDOWN
Flash Loan Fee: $${(analysis.costs.aaveFlashLoanFee * 1000).toFixed(2)} (0.1%)
Gas Costs: $${analysis.costs.totalGasCostUSD.toFixed(2)} (${analysis.costs.totalGasUsed.toLocaleString()} gas)
Trading Fees: $${(analysis.costs.buyDexFeeAmount + analysis.costs.sellDexFeeAmount).toFixed(2)}
Slippage: $${analysis.costs.totalSlippageCost.toFixed(2)}

📊 RISK METRICS
Break-even Spread: ${analysis.breakEvenSpread.toFixed(2)}%
Safety Margin: ${analysis.safetyMargin.toFixed(2)}%
Price Impact: ${(analysis.priceImpact * 100).toFixed(2)}%
Execution Window: ${analysis.executionWindow}s

💡 TRADE SIZING
Optimal Size: $${analysis.optimalTradeSize.toLocaleString()}
Min Profitable: $${analysis.minProfitableSize.toLocaleString()}
Max Recommended: $${analysis.maxTradeSize.toLocaleString()}
        `.trim();
    }
}
exports.ProfitCalculator = ProfitCalculator;
// Gas estimates for different operations on Arbitrum
ProfitCalculator.GAS_ESTIMATES = {
    aaveFlashLoan: 200000, // Aave flash loan initiation
    uniswapV2Swap: 120000, // UniswapV2 swap
    uniswapV3Swap: 150000, // UniswapV3 swap
    sushiSwap: 120000, // SushiSwap
    curveSwap: 200000, // Curve swap
    balancerSwap: 180000, // Balancer swap
    tokenApproval: 50000, // Token approval
    baseTransaction: 21000, // Base transaction cost
    complexArbitrage: 400000, // Complex multi-step arbitrage
};
// DEX fee rates
ProfitCalculator.DEX_FEES = {
    UNISWAPV3: 0.003, // 0.3%
    SUSHISWAP: 0.003, // 0.3%
    CURVE: 0.0004, // 0.04%
    BALANCER: 0.002, // 0.2%
    GMX: 0.001, // 0.1%
    TRADERJOE: 0.003, // 0.3%
    ARBSWAP: 0.003, // 0.3%
    WOMBAT: 0.001, // 0.1%
};
//# sourceMappingURL=ProfitCalculator.js.map