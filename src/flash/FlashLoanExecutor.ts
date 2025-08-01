import Web3 from 'web3';
import { NetworkType } from '../interfaces/Web3Types';
import { Token } from '../interfaces/GraphTypes';
import { FlashLoanParams, FlashLoanQuote, FlashLoanResult } from '../interfaces/FlashLoanTypes';
import { AAVE_LENDING_POOL_ABI } from '../constants/abis';
import BN from 'bn.js';

export class FlashLoanExecutor {
    private web3: NetworkType;
    private lendingPool: any;
    private readonly AAVE_LENDING_POOL = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
    private readonly PREMIUM_DECIMALS = 4;  // 10000 = 1%

    constructor(web3: NetworkType) {
        this.web3 = web3;
        this.lendingPool = new web3.eth.Contract(AAVE_LENDING_POOL_ABI, this.AAVE_LENDING_POOL);
    }

    public async getFlashLoanQuote(token: Token, amount: string): Promise<FlashLoanQuote> {
        try {
            const premium = await this.lendingPool.methods.FLASHLOAN_PREMIUM_TOTAL().call();
            const premiumPercent = new BN(premium).toNumber() / Math.pow(10, this.PREMIUM_DECIMALS);
            
            // Estimate gas for the flash loan
            const estimatedGas = 350000; // Base gas estimate, can be refined based on actual usage

            // Get maximum available to borrow (available liquidity in the pool)
            const maxLoanAmount = await this.getMaxFlashLoanAmount(token);

            return {
                premium: premiumPercent,
                estimatedGas,
                maxLoanAmount
            };
        } catch (error) {
            console.error('Error getting flash loan quote:', error);
            throw error;
        }
    }

    private async getMaxFlashLoanAmount(token: Token): Promise<string> {
        // This would involve checking the available liquidity in the Aave pool
        // For now, returning a large number as placeholder
        return '1000000000000000000000000'; // 1M tokens
    }

    public async executeFlashLoan(params: FlashLoanParams): Promise<FlashLoanResult> {
        const { token, amount, targets, data } = params;
        
        try {
            // Calculate premium
            const quote = await this.getFlashLoanQuote(token, amount);
            const premium = new BN(amount).muln(quote.premium).divn(100);

            // Prepare flash loan parameters
            const assets = [token.address];
            const amounts = [amount];
            const modes = [0]; // 0 = no debt, 1 = stable, 2 = variable
            const onBehalfOf = this.web3.currentProvider.host; // Our contract address
            const params = web3.eth.abi.encodeParameters(
                ['address[]', 'bytes[]'],
                [targets, data]
            );

            // Estimate gas
            const gasEstimate = await this.lendingPool.methods.flashLoan(
                assets,
                amounts,
                modes,
                onBehalfOf,
                params
            ).estimateGas();

            // Execute flash loan
            const result = await this.lendingPool.methods.flashLoan(
                assets,
                amounts,
                modes,
                onBehalfOf,
                params
            ).send({
                gas: Math.ceil(gasEstimate * 1.1), // Add 10% buffer
                maxFeePerGas: await this.getOptimalMaxFeePerGas(),
                maxPriorityFeePerGas: '2000000000' // 2 Gwei priority fee
            });

            // Calculate actual gas cost
            const gasCost = result.gasUsed * (await this.web3.eth.getGasPrice());

            return {
                success: true,
                gasCost,
                profitOrLoss: new BN(result.logs[0].data).sub(premium).toString()
            };

        } catch (error) {
            console.error('Flash loan execution failed:', error);
            return {
                success: false,
                gasCost: 0,
                profitOrLoss: '0',
                error: error.message
            };
        }
    }

    private async getOptimalMaxFeePerGas(): Promise<string> {
        try {
            // Get recent base fees
            const blockCount = 10;
            const latestBlock = await this.web3.eth.getBlockNumber();
            const blocks = await Promise.all(
                Array.from({length: blockCount}, (_, i) => 
                    this.web3.eth.getBlock(latestBlock - i)
                )
            );

            // Calculate median base fee from recent blocks
            const baseFees = blocks
                .map(block => parseInt(block.baseFeePerGas))
                .sort((a, b) => a - b);
            const medianBaseFee = baseFees[Math.floor(baseFees.length / 2)];

            // Add buffer for price changes
            const maxFeePerGas = Math.ceil(medianBaseFee * 1.5).toString();

            return maxFeePerGas;
        } catch (error) {
            console.error('Error calculating optimal max fee:', error);
            return '50000000000'; // 50 Gwei fallback
        }
    }
}
