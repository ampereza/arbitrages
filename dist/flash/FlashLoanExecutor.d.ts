import Web3 from 'web3';
import { Token } from '../interfaces/GraphTypes';
import { FlashLoanParams, FlashLoanQuote, FlashLoanResult } from '../interfaces/FlashLoanTypes';
export declare class FlashLoanExecutor {
    private web3;
    private lendingPool;
    private readonly AAVE_LENDING_POOL;
    private readonly PREMIUM_DECIMALS;
    constructor(provider: Web3);
    getFlashLoanQuote(token: Token, amount: string): Promise<FlashLoanQuote>;
    private getMaxFlashLoanAmount;
    executeFlashLoan(params: FlashLoanParams): Promise<FlashLoanResult>;
    private getOptimalMaxFeePerGas;
}
