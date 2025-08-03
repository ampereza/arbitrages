import { Token } from './GraphTypes';
export interface FlashLoanQuote {
    premium: number;
    estimatedGas: number;
    maxLoanAmount: string;
}
export interface FlashLoanParams {
    token: Token;
    amount: string;
    targets: string[];
    data: string[];
}
export interface FlashLoanResult {
    success: boolean;
    gasCost: number;
    profitOrLoss: string;
    error?: string;
}
