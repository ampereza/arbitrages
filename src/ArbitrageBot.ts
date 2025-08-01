import Web3 from 'web3';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { TokenFetcher } from './TokenFetcher';
import { Token } from './interfaces/GraphTypes';
import { NetworkType } from './interfaces/Web3Types';
import { ArbitrageOpportunity, DexConfig, PriceQuote } from './interfaces/ArbitrageTypes';
import { FlashLoanExecutor } from './flash/FlashLoanExecutor';
import { DexPriceFetcher } from './dex/DexPriceFetcher';

// Load environment variables
dotenv.config();

export class ArbitrageBot {
    private web3: NetworkType;
    private tokenFetcher: TokenFetcher;
    private dexPriceFetcher: DexPriceFetcher;
    private flashLoanExecutor: FlashLoanExecutor;
    private isRunning: boolean;
    private tokens: Token[];
    private lastPrices: { [key: string]: number };
    private opportunities: ArbitrageOpportunity[];
    
    constructor() {
        const ARBITRUM_RPC = `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`;
        this.web3 = new Web3(ARBITRUM_RPC) as unknown as NetworkType;
        this.tokenFetcher = new TokenFetcher(this.web3);
        this.dexPriceFetcher = new DexPriceFetcher(this.web3);
        this.flashLoanExecutor = new FlashLoanExecutor(this.web3);
        this.isRunning = false;
        this.tokens = [];
        this.lastPrices = {};
        this.opportunities = [];
    }

    private static readonly API_ENDPOINTS = {
        oneInch: 'https://api.1inch.io/v5.0/42161', // Arbitrum network
        paraswap: 'https://apiv5.paraswap.io',
        openocean: 'https://arbitrum-api.openocean.finance/v3',
        kyberswap: 'https://aggregator-api.kyberswap.com/arbitrum/api/v1',
        cowswap: 'https://api.cow.fi/arbitrum'
    };

    private static readonly DEX_CONFIG: { [key: string]: DexConfig } = {
        CAMELOT: {
            name: 'Camelot',
            address: '0x6EcCab422D763aC031210895C81787E87B43A652',
            fee: 0.003,
            type: 'UniswapV2',
            factoryAddress: '0x6EcCab422D763aC031210895C81787E87B43A652',
            routerAddress: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
            estimatedGas: 150000
        },
        BALANCER: {
            name: 'Balancer',
            address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
            fee: 0.002,
            type: 'Balancer',
            estimatedGas: 200000
        },
        CURVE: {
            name: 'Curve',
            address: '0x8e9Bd30D15420bAe4B7EC0aC014B7ECeF864dd70',
            fee: 0.0004,
            type: 'Curve',
            estimatedGas: 180000
        },
        DODO: {
            name: 'DodoEX',
            address: '0x6D310348d5c12009854DFCf72e0DF9027e8cb4f4',
            fee: 0.001,
            type: 'UniswapV2',
            routerAddress: '0x6D310348d5c12009854DFCf72e0DF9027e8cb4f4',
            estimatedGas: 160000
        },
        GMX: {
            name: 'GMX',
            address: '0x489ee077994B6658eAfA855C308275EAd8097C4A',
            fee: 0.0003,
            type: 'GMX',
            estimatedGas: 250000
        },
        TRADERJOE: {
            name: 'TraderJoe',
            address: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30',
            fee: 0.003,
            type: 'TraderJoe',
            factoryAddress: '0x8e42f2F4101563bF679975178e880FD87d3eFd4e',
            routerAddress: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30',
            estimatedGas: 160000
        },
        KYBERSWAP: {
            name: 'KyberSwap',
            address: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
            fee: 0.003,
            type: 'UniswapV2',
            factoryAddress: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
            routerAddress: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
            estimatedGas: 170000
        }
    };

    private async initializeWeb3(): Promise<void> {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            console.log('Connected to Arbitrum. Current gas price:', Web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
        } catch (error) {
            console.error('Failed to initialize Web3:', error);
            throw error;
        }
    }

    private async getBalancerPoolId(tokenIn: Token, tokenOut: Token): Promise<string> {
        // Implementation for getting Balancer pool ID
        return 'pool-id'; // TODO: Implement proper pool lookup
    }

    private async getPriceQuote(dex: string, tokenIn: Token, tokenOut: Token, amount: string): Promise<PriceQuote> {
        const config = ArbitrageBot.DEX_CONFIG[dex];
        if (!config) throw new Error(`DEX ${dex} not supported`);

        try {
            switch (config.type) {
                case 'UniswapV2':
                    return await this.dexPriceFetcher.getUniswapV2Price(
                        config.factoryAddress!,
                        tokenIn,
                        tokenOut,
                        amount
                    );
                case 'Curve':
                    return await this.dexPriceFetcher.getCurvePrice(
                        config.address,
                        tokenIn,
                        tokenOut,
                        amount
                    );
                case 'Balancer':
                    const poolId = await this.getBalancerPoolId(tokenIn, tokenOut);
                    return await this.dexPriceFetcher.getBalancerPrice(
                        poolId,
                        config.address,
                        tokenIn,
                        tokenOut,
                        amount
                    );
                case 'GMX':
                    return await this.dexPriceFetcher.getGMXPrice(
                        config.address,
                        tokenIn,
                        tokenOut,
                        amount
                    );
                case 'TraderJoe':
                    return await this.dexPriceFetcher.getTraderJoePrice(
                        config.routerAddress!,
                        tokenIn,
                        tokenOut,
                        amount
                    );
                default:
                    throw new Error(`Unsupported DEX type: ${config.type}`);
            }
        } catch (error) {
            console.error(`Error getting price from ${dex}:`, error);
            throw error;
        }
    }

    private async scanArbitrageOpportunities(baseToken: Token, options: {
        originDEX?: string;
        excludeDEXs?: string[];
        minProfitPercent?: number;
        maxSlippage?: number;
    }): Promise<void> {
        const {
            originDEX,
            excludeDEXs = [],
            minProfitPercent = 0.5,
            maxSlippage = 1
        } = options;

        try {
            for (const token of this.tokens) {
                if (token.address === baseToken.address) continue;

                const availableDexes = Object.keys(ArbitrageBot.DEX_CONFIG)
                    .filter(dex => !excludeDEXs.includes(dex));

                for (const buyDex of availableDexes) {
                    if (originDEX && buyDex !== originDEX) continue;

                    for (const sellDex of availableDexes) {
                        if (buyDex === sellDex) continue;

                        try {
                            // Get flash loan quote first
                            const flashLoanQuote = await this.flashLoanExecutor.getFlashLoanQuote(
                                baseToken,
                                '1000000000000000000' // Start with 1 token
                            );

                            // Calculate optimal amount considering flash loan fees
                            const optimalAmount = await this.calculateOptimalTradeSize(
                                buyDex,
                                sellDex,
                                baseToken,
                                token,
                                flashLoanQuote.premium,
                                maxSlippage
                            );

                            // Get quotes for the optimal amount
                            const buyQuote = await this.getPriceQuote(buyDex, baseToken, token, optimalAmount);
                            const sellQuote = await this.getPriceQuote(sellDex, token, baseToken, buyQuote.price);

                            const buyPrice = parseFloat(buyQuote.price);
                            const sellPrice = parseFloat(sellQuote.price);
                            
                            if (sellPrice > buyPrice) {
                                // Calculate all costs
                                const gasPrice = await this.web3.eth.getGasPrice();
                                const totalGas = buyQuote.gas + sellQuote.gas + flashLoanQuote.estimatedGas;
                                const gasCost = totalGas * parseFloat(gasPrice);
                                const flashLoanCost = parseFloat(optimalAmount) * (flashLoanQuote.premium / 100);
                                const totalCost = gasCost + flashLoanCost;

                                // Calculate profit after all costs
                                const grossProfit = sellPrice - buyPrice;
                                const netProfit = grossProfit - totalCost;
                                const profitPercent = (netProfit / buyPrice) * 100;

                                // Check if profitable after all costs
                                if (profitPercent > minProfitPercent && netProfit > 0) {
                                    this.opportunities.push({
                                        fromDex: buyDex,
                                        toDex: sellDex,
                                        tokenIn: baseToken,
                                        tokenOut: token,
                                        amountIn: optimalAmount,
                                        expectedProfit: grossProfit,
                                        profitPercent,
                                        gasCost,
                                        netProfit
                                    });
                                }
                            }
                        } catch (error) {
                            console.error(`Error checking arbitrage between ${buyDex} and ${sellDex}:`, error);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in arbitrage scan:', error);
        }
    }

    private async calculateOptimalTradeSize(
        buyDex: string,
        sellDex: string,
        tokenIn: Token,
        tokenOut: Token,
        flashLoanPremium: number,
        maxSlippage: number
    ): Promise<string> {
        // Start with base amounts
        const amounts = [
            '1000000000000000000', // 1 token
            '10000000000000000000', // 10 tokens
            '100000000000000000000' // 100 tokens
        ];

        let bestAmount = amounts[0];
        let bestProfit = 0;

        for (const amount of amounts) {
            try {
                // Get quotes for this amount
                const buyQuote = await this.getPriceQuote(buyDex, tokenIn, tokenOut, amount);
                const sellQuote = await this.getPriceQuote(sellDex, tokenOut, tokenIn, buyQuote.price);

                // Calculate costs
                const flashLoanFee = parseFloat(amount) * (flashLoanPremium / 100);
                const slippageCost = (parseFloat(amount) * maxSlippage) / 100;
                const totalCost = flashLoanFee + slippageCost;

                // Calculate profit
                const profit = parseFloat(sellQuote.price) - parseFloat(amount) - totalCost;

                if (profit > bestProfit) {
                    bestAmount = amount;
                    bestProfit = profit;
                }
            } catch (error) {
                console.error(`Error calculating optimal size for amount ${amount}:`, error);
                continue;
            }
        }

        return bestAmount;
    }

    public async start(options: {
        originDEX?: string;
        excludeDEXs?: string[];
        minProfitPercent?: number;
        maxSlippage?: number;
        minLiquidity?: number;
        maxGasPrice?: number;
        scanInterval?: number;
    } = {}): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        const {
            minLiquidity = 10000,
            maxGasPrice = 100,
            scanInterval = 10000
        } = options;

        try {
            await this.initializeWeb3();
            this.tokens = await this.tokenFetcher.fetchTokens({ minLiquidity });
            
            while (this.isRunning) {
                const gasPrice = await this.web3.eth.getGasPrice();
                if (Number(Web3.utils.fromWei(gasPrice, 'gwei')) > maxGasPrice) {
                    console.log('Gas price too high, skipping scan');
                    await new Promise(resolve => setTimeout(resolve, scanInterval));
                    continue;
                }

                for (const token of this.tokens) {
                    await this.scanArbitrageOpportunities(token, options);
                }

                await new Promise(resolve => setTimeout(resolve, scanInterval));
            }
        } catch (error) {
            console.error('Error in arbitrage bot:', error);
            this.stop();
        }
    }

    public stop(): void {
        this.isRunning = false;
        console.log('Arbitrage bot stopped');
    }

    public getOpportunities(): ArbitrageOpportunity[] {
        return this.opportunities;
    }

    public async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<boolean> {
        try {
            // Get flash loan parameters
            const buyDex = ArbitrageBot.DEX_CONFIG[opportunity.fromDex];
            const sellDex = ArbitrageBot.DEX_CONFIG[opportunity.toDex];

            if (!buyDex || !sellDex) {
                throw new Error('Invalid DEX configuration');
            }

            // Prepare transaction data for flash loan
            const buyData = this.encodeBuyTransaction(buyDex, opportunity);
            const sellData = this.encodeSellTransaction(sellDex, opportunity);

            // Execute flash loan
            const result = await this.flashLoanExecutor.executeFlashLoan({
                token: opportunity.tokenIn,
                amount: opportunity.amountIn,
                targets: [buyDex.address, sellDex.address],
                data: [buyData, sellData]
            });

            if (!result.success) {
                console.error('Flash loan execution failed:', result.error);
                return false;
            }

            // Verify profit
            if (parseFloat(result.profitOrLoss) <= 0) {
                console.error('Arbitrage resulted in loss:', result.profitOrLoss);
                return false;
            }

            console.log('Arbitrage executed successfully:', {
                profit: result.profitOrLoss,
                gasCost: result.gasCost
            });

            return true;

        } catch (error) {
            console.error('Error executing arbitrage:', error);
            return false;
        }
    }

    private encodeBuyTransaction(dex: DexConfig, opportunity: ArbitrageOpportunity): string {
        switch (dex.type) {
            case 'UniswapV2':
                return this.encodeUniswapV2Swap(
                    dex.routerAddress!,
                    opportunity.amountIn,
                    opportunity.tokenIn.address,
                    opportunity.tokenOut.address
                );
            case 'Curve':
                return this.encodeCurveSwap(
                    dex.address,
                    opportunity.amountIn,
                    opportunity.tokenIn.address,
                    opportunity.tokenOut.address
                );
            case 'Balancer':
                return this.encodeBalancerSwap(
                    dex.address,
                    opportunity.amountIn,
                    opportunity.tokenIn.address,
                    opportunity.tokenOut.address
                );
            case 'GMX':
                return this.encodeGMXSwap(
                    dex.address,
                    opportunity.amountIn,
                    opportunity.tokenIn.address,
                    opportunity.tokenOut.address
                );
            case 'TraderJoe':
                return this.encodeTraderJoeSwap(
                    dex.routerAddress!,
                    opportunity.amountIn,
                    opportunity.tokenIn.address,
                    opportunity.tokenOut.address
                );
            default:
                throw new Error(`Unsupported DEX type: ${dex.type}`);
        }
    }

    private encodeSellTransaction(dex: DexConfig, opportunity: ArbitrageOpportunity): string {
        // Similar to encodeBuyTransaction but with tokenIn/tokenOut swapped
        // and using the output amount from the buy transaction
        return this.encodeBuyTransaction(dex, {
            ...opportunity,
            tokenIn: opportunity.tokenOut,
            tokenOut: opportunity.tokenIn
        });
    }

    private encodeUniswapV2Swap(
        router: string,
        amountIn: string,
        tokenIn: string,
        tokenOut: string
    ): string {
        const path = [tokenIn, tokenOut];
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swapExactTokensForTokens',
            type: 'function',
            inputs: [
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'amountOutMin' },
                { type: 'address[]', name: 'path' },
                { type: 'address', name: 'to' },
                { type: 'uint256', name: 'deadline' }
            ]
        }, [
            amountIn,
            '0', // No slippage check for atomic transaction
            path,
            this.web3.currentProvider.host,
            deadline.toString()
        ]);
    }

    private encodeCurveSwap(
        pool: string,
        amountIn: string,
        tokenIn: string,
        tokenOut: string
    ): string {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'exchange',
            type: 'function',
            inputs: [
                { type: 'int128', name: 'i' },
                { type: 'int128', name: 'j' },
                { type: 'uint256', name: 'dx' },
                { type: 'uint256', name: 'min_dy' }
            ]
        }, [
            '0', // Token indices need to be determined
            '1',
            amountIn,
            '0' // No slippage check
        ]);
    }

    private encodeBalancerSwap(
        vault: string,
        amountIn: string,
        tokenIn: string,
        tokenOut: string
    ): string {
        const poolId = '0x...'; // Need to get pool ID
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swap',
            type: 'function',
            inputs: [
                { type: 'bytes32', name: 'poolId' },
                { type: 'uint256', name: 'amountIn' },
                { type: 'address', name: 'tokenIn' },
                { type: 'address', name: 'tokenOut' },
                { type: 'uint256', name: 'minAmountOut' }
            ]
        }, [
            poolId,
            amountIn,
            tokenIn,
            tokenOut,
            '0' // No slippage check
        ]);
    }

    private encodeGMXSwap(
        router: string,
        amountIn: string,
        tokenIn: string,
        tokenOut: string
    ): string {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swap',
            type: 'function',
            inputs: [
                { type: 'address', name: 'tokenIn' },
                { type: 'address', name: 'tokenOut' },
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'minOut' }
            ]
        }, [
            tokenIn,
            tokenOut,
            amountIn,
            '0' // No slippage check
        ]);
    }

    private encodeTraderJoeSwap(
        router: string,
        amountIn: string,
        tokenIn: string,
        tokenOut: string
    ): string {
        return this.web3.eth.abi.encodeFunctionCall({
            name: 'swapExactTokensForTokens',
            type: 'function',
            inputs: [
                { type: 'uint256', name: 'amountIn' },
                { type: 'uint256', name: 'amountOutMin' },
                { type: 'address[]', name: 'path' },
                { type: 'address', name: 'to' },
                { type: 'uint256', name: 'deadline' }
            ]
        }, [
            amountIn,
            '0', // No slippage check
            [tokenIn, tokenOut],
            this.web3.currentProvider.host,
            Math.floor(Date.now() / 1000) + 300 // 5 minutes
        ]);
    }
}
