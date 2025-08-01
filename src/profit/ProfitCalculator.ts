import { Token } from '../interfaces/GraphTypes';
import { ArbitrageOpportunity } from '../interfaces/ArbitrageTypes';
import { FlashLoanExecutor } from '../flash/FlashLoanExecutor';
import Web3 from 'web3';
import { NetworkType } from '../interfaces/Web3Types';

export interface ProfitAnalysis {
    baseProfit: string;
    flashLoanFee: string;
    estimatedGasCost: string;
    slippageImpact: string;
    mevProtectionCost: string;
    netProfit: string;
    netProfitUSD: string;
    profitableAmount: string;
    isViable: boolean;
    details: {
        priceImpact: string;
        executionPriority: number;
        flashLoanAmount: string;
        optimalGasPrice: string;
        minProfit: string;
    };
}

export class ProfitCalculator {
    private web3: Web3;
    private flashLoanExecutor: FlashLoanExecutor;
    
    // Constants for calculations
    private readonly MEV_PROTECTION_FACTOR = 0.005; // 0.5% for MEV protection
    private readonly MIN_PROFIT_THRESHOLD = 0.001; // 0.1% minimum profit
    private readonly MAX_PRICE_IMPACT = 0.02; // 2% maximum price impact
    private readonly GAS_PRICE_BUFFER = 1.2; // 20% buffer on gas price
    
    constructor(web3: NetworkType) {
        this.web3 = web3 as any;
        this.flashLoanExecutor = new FlashLoanExecutor(web3);
    }
    
    private async calculateSlippageImpact(
        opportunity: ArbitrageOpportunity,
        amount: string
    ): Promise<string> {
        // Calculate slippage based on order size and liquidity
        const amountBN = BigInt(amount);
        const poolLiquidity = BigInt(opportunity.tokenIn.liquidity || '0');
        
        if (poolLiquidity === BigInt(0)) return '0';
        
        // Impact increases exponentially with order size
        const impact = Number((amountBN * BigInt(10000)) / poolLiquidity) / 100;
        const slippageImpact = Math.min(
            impact * impact, // Quadratic impact
            Number(this.MAX_PRICE_IMPACT)
        );
        
        return (slippageImpact * Number(amount)).toString();
    }
    
    private async estimateOptimalGasPrice(): Promise<string> {
        const baseGasPrice = await this.web3.eth.getGasPrice();
        const optimalGasPrice = BigInt(baseGasPrice) * BigInt(Math.floor(this.GAS_PRICE_BUFFER * 100)) / BigInt(100);
        return optimalGasPrice.toString();
    }
    
    private calculateMEVProtection(amount: string): string {
        return (BigInt(amount) * BigInt(Math.floor(this.MEV_PROTECTION_FACTOR * 10000)) / BigInt(10000)).toString();
    }
    
    private async findOptimalTradeSize(
        opportunity: ArbitrageOpportunity,
        maxAmount: string
    ): Promise<string> {
        const steps = 10;
        let optimalAmount = '0';
        let maxProfit = BigInt(0);
        
        for (let i = 1; i <= steps; i++) {
            const amount = (BigInt(maxAmount) * BigInt(i) / BigInt(steps)).toString();
            const analysis = await this.analyzeProfitability(opportunity, amount);
            const profit = BigInt(analysis.netProfit);
            
            if (profit > maxProfit) {
                maxProfit = profit;
                optimalAmount = amount;
            }
        }
        
        return optimalAmount;
    }
    
    public async analyzeProfitability(
        opportunity: ArbitrageOpportunity,
        amount: string
    ): Promise<ProfitAnalysis> {
        try {
            // Calculate base profit
            const baseProfit = BigInt(opportunity.expectedProfit);
            
            // Calculate flash loan fee
            const flashLoanFee = BigInt(this.flashLoanExecutor.calculateFlashLoanFee(amount));
            
            // Estimate gas cost
            const optimalGasPrice = await this.estimateOptimalGasPrice();
            const estimatedGas = await this.flashLoanExecutor.estimateFlashLoanGas({
                token: opportunity.tokenIn,
                amount,
                targetDex: opportunity.toDex,
                minProfitUSD: '0'
            });
            const estimatedGasCost = BigInt(optimalGasPrice) * BigInt(estimatedGas);
            
            // Calculate slippage impact
            const slippageImpact = BigInt(await this.calculateSlippageImpact(opportunity, amount));
            
            // Calculate MEV protection cost
            const mevProtectionCost = BigInt(this.calculateMEVProtection(amount));
            
            // Calculate net profit
            const totalCosts = flashLoanFee + estimatedGasCost + slippageImpact + mevProtectionCost;
            const netProfit = baseProfit > totalCosts ? baseProfit - totalCosts : BigInt(0);
            
            // Determine if the trade is viable
            const isViable = netProfit > (BigInt(amount) * BigInt(Math.floor(this.MIN_PROFIT_THRESHOLD * 10000)) / BigInt(10000));
            
            // Find optimal trade size if viable
            const profitableAmount = isViable
                ? await this.findOptimalTradeSize(opportunity, amount)
                : '0';
            
            // Calculate price impact
            const priceImpact = ((slippageImpact * BigInt(10000)) / BigInt(amount)).toString();
            
            // Determine execution priority based on profit margin
            const profitMargin = Number(netProfit) / Number(amount);
            const executionPriority = Math.floor(profitMargin * 100);
            
            return {
                baseProfit: baseProfit.toString(),
                flashLoanFee: flashLoanFee.toString(),
                estimatedGasCost: estimatedGasCost.toString(),
                slippageImpact: slippageImpact.toString(),
                mevProtectionCost: mevProtectionCost.toString(),
                netProfit: netProfit.toString(),
                netProfitUSD: (Number(netProfit) / 1e18).toString(), // Assuming 18 decimals
                profitableAmount,
                isViable,
                details: {
                    priceImpact,
                    executionPriority,
                    flashLoanAmount: amount,
                    optimalGasPrice,
                    minProfit: (BigInt(amount) * BigInt(Math.floor(this.MIN_PROFIT_THRESHOLD * 10000)) / BigInt(10000)).toString()
                }
            };
        } catch (error) {
            console.error('Error analyzing profitability:', error);
            throw error;
        }
    }
}
