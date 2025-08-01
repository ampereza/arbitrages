import { Token } from './GraphTypes';

export interface FlashLoanQuote {
    premium: number;  // The flash loan fee percentage
    estimatedGas: number;  // Estimated gas cost for the flash loan
    maxLoanAmount: string;  // Maximum amount that can be borrowed
}

export interface FlashLoanParams {
    token: Token;  // Token to borrow
    amount: string;  // Amount to borrow in wei
    targets: string[];  // Contract addresses to interact with
    data: string[];  // Encoded function data for each target
}

export interface FlashLoanResult {
    success: boolean;  // Whether the flash loan was successful
    gasCost: number;  // Actual gas cost
    profitOrLoss: string;  // Net profit/loss in wei
    error?: string;  // Error message if any
}
