"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlashLoanExecutor = void 0;
const abis_1 = require("../constants/abis");
const bn_js_1 = __importDefault(require("bn.js"));
class FlashLoanExecutor {
    constructor(provider) {
        this.AAVE_LENDING_POOL = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';
        this.PREMIUM_DECIMALS = 4; // 10000 = 1%
        this.web3 = provider;
        this.lendingPool = new this.web3.eth.Contract(abis_1.AAVE_LENDING_POOL_ABI, this.AAVE_LENDING_POOL);
    }
    async getFlashLoanQuote(token, amount) {
        try {
            // Try to get the premium rate, but handle if method doesn't exist
            let premium = 0.0009; // Default 0.09% premium for Aave v3
            try {
                const premiumFromContract = await this.lendingPool.methods.FLASHLOAN_PREMIUM_TOTAL().call();
                premium = new bn_js_1.default(premiumFromContract).toNumber() / Math.pow(10, this.PREMIUM_DECIMALS);
            }
            catch (contractError) {
                console.log('Using default flash loan premium rate (contract method not available)');
            }
            // Estimate gas for the flash loan
            const estimatedGas = 350000; // Base gas estimate, can be refined based on actual usage
            // Get maximum available to borrow (available liquidity in the pool)
            const maxLoanAmount = await this.getMaxFlashLoanAmount(token);
            return {
                premium,
                estimatedGas,
                maxLoanAmount
            };
        }
        catch (error) {
            console.error('Error getting flash loan quote:', error);
            // Return default values instead of throwing
            return {
                premium: 0.0009, // Default 0.09% premium
                estimatedGas: 350000,
                maxLoanAmount: '0' // No flash loan available
            };
        }
    }
    async getMaxFlashLoanAmount(token) {
        // This would involve checking the available liquidity in the Aave pool
        // For now, returning a large number as placeholder
        return '1000000000000000000000000'; // 1M tokens
    }
    async executeFlashLoan(params) {
        const { token, amount, targets, data } = params;
        try {
            // Calculate premium
            const quote = await this.getFlashLoanQuote(token, amount);
            const premium = new bn_js_1.default(amount).muln(quote.premium).divn(100);
            // Prepare flash loan parameters
            const assets = [token.address];
            const amounts = [amount];
            const modes = [0]; // 0 = no debt, 1 = stable, 2 = variable
            const onBehalfOf = targets[0]; // Use the first target address as the onBehalfOf address
            const encodedParams = this.web3.eth.abi.encodeParameters(['address[]', 'bytes[]'], [targets, data]);
            // Estimate gas
            const gasEstimate = await this.lendingPool.methods.flashLoan(assets, amounts, modes, onBehalfOf, encodedParams).estimateGas();
            // Execute flash loan
            const result = await this.lendingPool.methods.flashLoan(assets, amounts, modes, onBehalfOf, encodedParams).send({
                gas: Math.ceil(gasEstimate * 1.1), // Add 10% buffer
                maxFeePerGas: await this.getOptimalMaxFeePerGas(),
                maxPriorityFeePerGas: '2000000000' // 2 Gwei priority fee
            });
            // Calculate actual gas cost
            const gasPrice = await this.web3.eth.getGasPrice();
            const gasCostWei = new bn_js_1.default(result.gasUsed).mul(new bn_js_1.default(gasPrice));
            const gasCost = Number(gasCostWei.toString()); // Convert to number for interface compatibility
            return {
                success: true,
                gasCost,
                profitOrLoss: new bn_js_1.default(result.logs[0].data).sub(premium).toString()
            };
        }
        catch (error) {
            console.error('Flash loan execution failed:', error instanceof Error ? error.message : String(error));
            return {
                success: false,
                gasCost: 0,
                profitOrLoss: '0',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async getOptimalMaxFeePerGas() {
        const gasPrice = await this.web3.eth.getGasPrice();
        return new bn_js_1.default(gasPrice).muln(2).toString(); // Double the current gas price
    }
}
exports.FlashLoanExecutor = FlashLoanExecutor;
//# sourceMappingURL=FlashLoanExecutor.js.map