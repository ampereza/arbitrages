// package.json dependencies needed:
// npm install ethers@^6 @types/node typescript ts-node dotenv axios ws @balancer-labs/sdk curve-js
// npm install -D @types/ws

import { ethers } from 'ethers';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Network configuration
const ETHEREUM_RPC = `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;

// Token addresses on Ethereum
const TOKENS = {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
};

// DEX addresses and configurations
const DEX_CONFIG = {
    uniswapV2: {
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        name: 'Uniswap V2'
    },
    uniswapV3: {
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        name: 'Uniswap V3',
        quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
    },
    sushiswap: {
        router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        name: 'SushiSwap'
    },
    curve: {
        addressProvider: '0x0000000022D53366457F9d5E68Ec105046FC4383',
        name: 'Curve'
    }
};

// API endpoints
const ONE_INCH_API = 'https://api.1inch.io/v5.0/1';

// ABIs
const ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

const QUOTER_ABI = [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

interface PriceQuote {
    dex: string;
    buyPrice: number;
    sellPrice: number;
}

class ArbitrageBot {
    private provider: ethers.JsonRpcProvider;
    private isRunning: boolean;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
        this.isRunning = false;
    }

    private async getUniV2Price(router: string, dexName: string, amountIn: bigint, path: string[]): Promise<number> {
        try {
            const routerContract = new ethers.Contract(router, ROUTER_ABI, this.provider);
            const amounts = await routerContract.getAmountsOut(amountIn, path);
            return Number(amounts[1]) / 1e6; // USDC has 6 decimals
        } catch (error) {
            console.error(`${dexName} price fetch error:`, error.message);
            return 0;
        }
    }

    private async getUniV3Price(amountIn: bigint, tokenIn: string, tokenOut: string): Promise<number> {
        try {
            const quoterContract = new ethers.Contract(DEX_CONFIG.uniswapV3.quoter, QUOTER_ABI, this.provider);
            const fee = 3000; // 0.3% fee tier
            const sqrtPriceLimitX96 = 0;
            
            const amountOut = await quoterContract.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                fee,
                amountIn,
                sqrtPriceLimitX96
            );
            
            return Number(amountOut) / 1e6;
        } catch (error) {
            console.error('Uniswap V3 price fetch error:', error.message);
            return 0;
        }
    }

    private async get1InchPrice(amountIn: bigint, fromToken: string, toToken: string): Promise<number> {
        try {
            const response = await axios.get(`${ONE_INCH_API}/quote`, {
                params: {
                    fromTokenAddress: fromToken,
                    toTokenAddress: toToken,
                    amount: amountIn.toString()
                }
            });
            return Number(response.data.toTokenAmount) / 1e6;
        } catch (error) {
            console.error('1inch price fetch error:', error.message);
            return 0;
        }
    }

    private async checkArbitrage(prices: PriceQuote[]) {
        const validPrices = prices.filter(p => p.buyPrice > 0 && p.sellPrice > 0);
        
        for (const buyDex of validPrices) {
            for (const sellDex of validPrices) {
                if (buyDex === sellDex) continue;

                const profit = sellDex.sellPrice - buyDex.buyPrice;
                const profitPercent = (profit / buyDex.buyPrice) * 100;

                if (profitPercent > 0.5) { // Only log if profit > 0.5%
                    console.log('\nPotential Arbitrage Opportunity:');
                    console.log(`Buy on: ${buyDex.dex} at $${buyDex.buyPrice.toFixed(2)}`);
                    console.log(`Sell on: ${sellDex.dex} at $${sellDex.sellPrice.toFixed(2)}`);
                    console.log(`Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
                    
                    // Additional market depth check recommendation
                    if (profitPercent > 2) {
                        console.log('⚠️ High profit margin detected! Verify market depth before trading.');
                    }
                }
            }
        }
    }

    public async start() {
        if (!process.env.INFURA_KEY) {
            throw new Error('Missing INFURA_KEY in .env file');
        }

        this.isRunning = true;
        console.log('Starting Ethereum DEX arbitrage bot...');
        console.log('Monitoring major Ethereum DEXes for arbitrage opportunities...\n');

        while (this.isRunning) {
            const prices: PriceQuote[] = [];
            const testAmount = ethers.parseEther('1'); // 1 ETH
            const path = [TOKENS.WETH, TOKENS.USDC];

            // Get prices from Uniswap V2
            const uniV2Price = await this.getUniV2Price(
                DEX_CONFIG.uniswapV2.router,
                DEX_CONFIG.uniswapV2.name,
                testAmount,
                path
            );

            // Get prices from Uniswap V3
            const uniV3Price = await this.getUniV3Price(
                testAmount,
                TOKENS.WETH,
                TOKENS.USDC
            );

            // Get prices from SushiSwap
            const sushiPrice = await this.getUniV2Price(
                DEX_CONFIG.sushiswap.router,
                DEX_CONFIG.sushiswap.name,
                testAmount,
                path
            );

            // Get prices from 1inch
            const oneInchPrice = await this.get1InchPrice(
                testAmount,
                TOKENS.WETH,
                TOKENS.USDC
            );

            // Add all prices to the array
            prices.push(
                { dex: 'Uniswap V2', buyPrice: uniV2Price, sellPrice: uniV2Price },
                { dex: 'Uniswap V3', buyPrice: uniV3Price, sellPrice: uniV3Price },
                { dex: 'SushiSwap', buyPrice: sushiPrice, sellPrice: sushiPrice },
                { dex: '1inch', buyPrice: oneInchPrice, sellPrice: oneInchPrice }
            );

            // Check for arbitrage opportunities
            await this.checkArbitrage(prices);

            // Display current prices
            console.log('\nCurrent ETH/USDC Prices:');
            prices.forEach(p => {
                if (p.buyPrice > 0) {
                    console.log(`${p.dex}: $${p.buyPrice.toFixed(2)}`);
                }
            });

            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    public stop() {
        this.isRunning = false;
        console.log('Stopping arbitrage bot...');
    }
}

export { ArbitrageBot };