import { Token } from '../interfaces/GraphTypes';
import { PriceQuote } from '../interfaces/ArbitrageTypes';
export declare class DexPriceFetcher {
    private web3;
    constructor(provider: string);
    private calculatePrice;
    getUniswapV2Price(factoryAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getBalancerPrice(poolId: string, vaultAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getCurvePrice(poolAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getGMXPrice(routerAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getTraderJoePrice(routerAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getArbswapPrice(factoryAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getWombatPrice(poolAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getUniswapV3Price(quoterAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string, fee?: number): Promise<PriceQuote>;
    getCamelotPrice(factoryAddress: string, routerAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
    getRamsesPrice(factoryAddress: string, routerAddress: string, tokenIn: Token, tokenOut: Token, amountIn: string): Promise<PriceQuote>;
}
