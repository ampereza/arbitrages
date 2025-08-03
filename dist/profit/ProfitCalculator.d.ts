import { ArbitrageOpportunity } from '../interfaces/ArbitrageTypes';
import Web3 from 'web3';
export interface TradingCosts {
    aaveFlashLoanFee: number;
    gasPrice: number;
    totalGasUsed: number;
    totalGasCostETH: number;
    totalGasCostUSD: number;
    buyDexFee: number;
    sellDexFee: number;
    buyDexFeeAmount: number;
    sellDexFeeAmount: number;
    buySlippage: number;
    sellSlippage: number;
    totalSlippageCost: number;
    mevProtectionFee: number;
    bridgeFees: number;
    totalCosts: number;
}
export interface ProfitAnalysisDetailed {
    grossRevenue: number;
    costs: TradingCosts;
    netProfit: number;
    profitMargin: number;
    roi: number;
    breakEvenSpread: number;
    safetyMargin: number;
    optimalTradeSize: number;
    maxTradeSize: number;
    minProfitableSize: number;
    priceImpact: number;
    liquidityRisk: number;
    executionWindow: number;
    latencyRisk: number;
}
export declare class ProfitCalculator {
    private web3;
    private ethPriceUSD;
    private static readonly GAS_ESTIMATES;
    private static readonly DEX_FEES;
    constructor(web3: Web3);
    /**
     * Update ETH price for accurate USD calculations
     */
    updateETHPrice(priceUSD: number): void;
    /**
     * Calculate comprehensive profit analysis including all trading costs
     */
    calculateDetailedProfit(opportunity: ArbitrageOpportunity, tradeAmountUSD: number, options?: {
        gasPrice?: number;
        slippageTolerance?: number;
        mevProtection?: boolean;
        useFlashLoan?: boolean;
    }): Promise<ProfitAnalysisDetailed>;
    /**
     * Calculate all trading costs including gas, fees, and slippage
     */
    private calculateTradingCosts;
    /**
     * Get gas estimate for specific DEX
     */
    private getGasEstimateForDex;
    /**
     * Calculate optimal trade sizing for maximum profit
     */
    private calculateOptimalTradeSizing;
    /**
     * Calculate market risks and execution factors
     */
    private calculateMarketRisks;
    /**
     * Get current gas price from network
     */
    private getCurrentGasPrice;
    /**
     * Quick profit check - simplified calculation for fast screening
     */
    quickProfitCheck(opportunity: ArbitrageOpportunity, tradeAmountUSD?: number): Promise<{
        isProfit: boolean;
        netProfitUSD: number;
        profitMarginPercent: number;
        breakEvenSpread: number;
    }>;
    /**
     * Format profit analysis for display
     */
    formatProfitAnalysis(analysis: ProfitAnalysisDetailed): string;
}
