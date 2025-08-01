import { NetworkType } from './interfaces/Web3Types';
import { Token } from './interfaces/GraphTypes';
import { PriceInfo } from './interfaces/PriceInfo';
import axios from 'axios';

export class TokenFetcher {
    private web3: NetworkType;
    private graphQLEndpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/arbitrum';

    constructor(web3: NetworkType) {
        this.web3 = web3;
    }

    public async fetchTokens(options: { minLiquidity?: number } = {}): Promise<Token[]> {
        const { minLiquidity = 0 } = options;

        try {
            const testTokens: Token[] = [
                {
                    address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                    symbol: 'WETH',
                    name: 'Wrapped Ether',
                    decimals: 18
                },
                {
                    address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
                    symbol: 'USDC',
                    name: 'USD Coin',
                    decimals: 6
                }
            ];

            return testTokens;
        } catch (error) {
            console.error('Error fetching tokens:', error);
            return [];
        }
    }
}

interface TradeSizing {
    minAmount: number;
    maxAmount: number;
    recommendedAmount: number;
    profitable: boolean;
    reason: string;
}

interface ArbitrageAnalysis {
    opportunity: boolean;
    buyDEX: string;
    sellDEX: string;
    buyPrice: number;
    sellPrice: number;
    priceSpread: number;
    tradeSizing: TradeSizing;
    profitAnalysis: ArbitrageProfitDetails | null;
    estimatedROI: number;
    riskFactors: string[];
}

export class TokenFetcher {
    private readonly networkType: NetworkType;
    private readonly web3TokenFetcher: Web3TokenFetcher;
    private readonly dexAddresses: typeof DEX_ADDRESSES[NetworkType];

    constructor(networkType: NetworkType = 'arbitrum') {
        this.networkType = networkType;
        this.dexAddresses = DEX_ADDRESSES[networkType];

        const providerUrl = networkType === 'arbitrum' 
            ? `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`
            : `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`;

        this.web3TokenFetcher = new Web3TokenFetcher(providerUrl, {
            network: networkType,
            debug: true,
            maxRetries: 5,
            retryDelay: 2000,
            rateLimit: 200,
            minLiquidityUsd: 50000
        });
    }

    public async generateTradingPairs(batchSize: number = 100): Promise<Array<{baseToken: Token, quoteToken: Token}>> {
        try {
            const allPairs: Array<{baseToken: Token, quoteToken: Token}> = [];
            let startIndex = 0;
            let hasMorePairs = true;

            while (hasMorePairs) {
                const pairAddresses = await this.web3TokenFetcher.getAllPairs(startIndex, batchSize);
                
                if (pairAddresses.length === 0) {
                    hasMorePairs = false;
                    continue;
                }

                for (const pairAddress of pairAddresses) {
                    try {
                        const pairInfo = await this.web3TokenFetcher.getPairInfo(pairAddress);
                        const [token0Info, token1Info] = await Promise.all([
                            this.web3TokenFetcher.getTokenInfo(pairInfo.token0Address),
                            this.web3TokenFetcher.getTokenInfo(pairInfo.token1Address)
                        ]);

                        allPairs.push({
                            baseToken: token0Info,
                            quoteToken: token1Info
                        });
                    } catch (error) {
                        console.warn(`Failed to process pair ${pairAddress}:`, error);
                        continue;
                    }
                }

                startIndex += batchSize;
            }

            return allPairs;
        } catch (error) {
            console.error('Error generating trading pairs:', error);
            return [];
        }
    }

    public async getUniswapV3Price(baseToken: Token, quoteToken: Token): Promise<PriceInfo | null> {
        try {
            const uniV3PriceData = await this.web3TokenFetcher.getUniswapV3Price(baseToken.address, quoteToken.address);
            if (!uniV3PriceData) return null;

            return {
                price: uniV3PriceData.price,
                source: "Uniswap V3",
                baseToken: baseToken.address,
                quoteToken: quoteToken.address,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error getting Uniswap V3 price:', error);
            return null;
        }
    }

    public async getUniswapV2Price(baseToken: Token, quoteToken: Token): Promise<PriceInfo | null> {
        try {
            const uniV2PriceData = await this.web3TokenFetcher.getUniswapV2Price(baseToken.address, quoteToken.address);
            if (!uniV2PriceData) return null;

            return {
                price: uniV2PriceData.price,
                source: "Uniswap V2",
                baseToken: baseToken.address,
                quoteToken: quoteToken.address,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error getting Uniswap V2 price:', error);
            return null;
        }
    }

    public async getSushiswapPrice(baseToken: Token, quoteToken: Token): Promise<PriceInfo | null> {
        try {
            const sushiPriceData = await this.web3TokenFetcher.getSushiswapPrice(baseToken.address, quoteToken.address);
            if (!sushiPriceData) return null;

            return {
                price: sushiPriceData.price,
                source: "Sushiswap",
                baseToken: baseToken.address,
                quoteToken: quoteToken.address,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error getting Sushiswap price:', error);
            return null;
        }
    }

    public async getAllPrices(baseToken: Token, quoteToken: Token): Promise<PriceInfo[]> {
        const prices = await Promise.all([
            this.getUniswapV2Price(baseToken, quoteToken),
            this.getUniswapV3Price(baseToken, quoteToken),
            this.getSushiswapPrice(baseToken, quoteToken)
        ]);
        
        return prices.filter((price): price is PriceInfo => price !== null);
    }

    private calculateArbitrageProfit(
        buyPrice: number,
        sellPrice: number,
        buyDexFee: number,
        sellDexFee: number,
        flashLoanFee: number,
        gasFeesUSD: number,
        amount: number,
        buySlippage: number = 0.01,
        sellSlippage: number = 0.01
    ): ArbitrageProfitDetails {
        // Calculate amounts after slippage
        const effectiveBuyPrice = buyPrice * (1 + buySlippage);
        const effectiveSellPrice = sellPrice * (1 - sellSlippage);
        
        // Calculate trade amounts
        const buyAmount = amount;
        const buyTotalWithFee = buyAmount * effectiveBuyPrice * (1 + buyDexFee);
        const sellAmount = buyAmount * (1 - flashLoanFee);
        const sellTotalWithFee = sellAmount * effectiveSellPrice * (1 - sellDexFee);
        
        // Calculate fees
        const buyFees = buyAmount * effectiveBuyPrice * buyDexFee;
        const sellFees = sellAmount * effectiveSellPrice * sellDexFee;
        const flashLoanFees = buyAmount * effectiveSellPrice * flashLoanFee;
        
        // Calculate profit metrics
        const grossProfit = sellTotalWithFee - buyTotalWithFee;
        const totalFees = buyFees + sellFees + flashLoanFees + gasFeesUSD;
        const netProfit = grossProfit - totalFees;
        const totalFeesPercent = (totalFees / buyTotalWithFee) * 100;
        const profitMargin = (netProfit / buyTotalWithFee) * 100;
        
        // Calculate slippage impact
        const slippageImpact = (
            (effectiveBuyPrice - buyPrice) * buyAmount +
            (sellPrice - effectiveSellPrice) * sellAmount
        );
        
        return {
            grossProfit,
            netProfit,
            totalFees,
            totalFeesPercent,
            profitMargin,
            viable: netProfit > 0,
            slippageImpact,
            breakdown: {
                buyAmount,
                sellAmount,
                buyFees,
                sellFees,
                flashLoanFees,
                gasFees: gasFeesUSD
            }
        };
    }

    private findOptimalTradeSize(
        buyPrice: number,
        sellPrice: number,
        buyDexFee: number,
        sellDexFee: number,
        gasFeesUSD: number,
        maxSlippage: number = 0.03,
        baseTokenSymbol: string = 'TOKEN'
    ): TradeSizing {
        // Define search parameters
        const minTradeUSD = 1000; // $1,000 minimum trade size
        const maxTradeUSD = 1000000; // $1M maximum trade size
        
        const testAmounts = [
            1000,    // $1K
            5000,    // $5K
            10000,   // $10K
            25000,   // $25K
            50000,   // $50K
            100000,  // $100K
            250000,  // $250K
            500000,  // $500K
            1000000  // $1M
        ];
        
        let bestNetProfit = 0;
        let bestAmount = 0;
        let minProfitableAmount = Infinity;
        let maxProfitableAmount = 0;
        
        for (const amountUSD of testAmounts) {
            const amount = amountUSD / buyPrice;
            
            const profitDetails = this.calculateArbitrageProfit(
                buyPrice,
                sellPrice,
                buyDexFee,
                sellDexFee,
                0.001, // Flash loan fee (0.1%)
                gasFeesUSD,
                amount,
                maxSlippage,
                maxSlippage
            );
            
            if (profitDetails.netProfit > 0) {
                if (amountUSD < minProfitableAmount) minProfitableAmount = amountUSD;
                if (amountUSD > maxProfitableAmount) maxProfitableAmount = amountUSD;
                
                if (profitDetails.netProfit > bestNetProfit) {
                    bestNetProfit = profitDetails.netProfit;
                    bestAmount = amountUSD;
                }
            }
        }
        
        // Return results
        if (bestAmount === 0) {
            return {
                minAmount: 0,
                maxAmount: 0,
                recommendedAmount: 0,
                profitable: false,
                reason: `No profitable trade size found for ${baseTokenSymbol}`
            };
        }
        
        // Conservative recommendation: use the profitable amount with good risk/reward
        return {
            minAmount: minProfitableAmount,
            maxAmount: maxProfitableAmount,
            recommendedAmount: bestAmount,
            profitable: true,
            reason: `Optimal trade size identified for ${baseTokenSymbol}`
        };
    }

    public async analyzeArbitrageOpportunity(
        baseToken: Token,
        quoteToken: Token,
        minProfitUSD: number = 100
    ): Promise<ArbitrageAnalysis> {
        try {
            // Get prices from different DEXs
            const prices = await this.getAllPrices(baseToken, quoteToken);
            
            // Need at least 2 different prices for arbitrage
            if (prices.length < 2) {
                return {
                    opportunity: false,
                    buyDEX: '',
                    sellDEX: '',
                    buyPrice: 0,
                    sellPrice: 0,
                    priceSpread: 0,
                    tradeSizing: {
                        minAmount: 0,
                        maxAmount: 0,
                        recommendedAmount: 0,
                        profitable: false,
                        reason: 'Insufficient price data'
                    },
                    profitAnalysis: null,
                    estimatedROI: 0,
                    riskFactors: ['Insufficient price data']
                };
            }
            
            // Find best prices for buy and sell
            let lowestPrice = Infinity;
            let highestPrice = -Infinity;
            let bestBuyDEX = '';
            let bestSellDEX = '';
            
            prices.forEach(price => {
                if (price.price < lowestPrice) {
                    lowestPrice = price.price;
                    bestBuyDEX = price.source;
                }
                if (price.price > highestPrice) {
                    highestPrice = price.price;
                    bestSellDEX = price.source;
                }
            });
            
            // Calculate price spread
            const priceSpread = ((highestPrice - lowestPrice) / lowestPrice) * 100;
            
            // Early exit if spread is too small
            if (priceSpread < 0.5) {
                return {
                    opportunity: false,
                    buyDEX: bestBuyDEX,
                    sellDEX: bestSellDEX,
                    buyPrice: lowestPrice,
                    sellPrice: highestPrice,
                    priceSpread,
                    tradeSizing: {
                        minAmount: 0,
                        maxAmount: 0,
                        recommendedAmount: 0,
                        profitable: false,
                        reason: 'Insufficient price spread'
                    },
                    profitAnalysis: null,
                    estimatedROI: 0,
                    riskFactors: ['Price spread too small']
                };
            }
            
            // Get DEX fees based on sources
            const getBuyDexFee = (dex: string) => {
                switch (dex) {
                    case 'Uniswap V3': return 0.003; // 0.3%
                    case 'Uniswap V2': return 0.003; // 0.3%
                    case 'Sushiswap': return 0.003;  // 0.3%
                    default: return 0.003;           // Default to 0.3%
                }
            };
            
            const buyDexFee = getBuyDexFee(bestBuyDEX);
            const sellDexFee = getBuyDexFee(bestSellDEX);
            
            // Estimate gas costs (in USD)
            const estimatedGasUnits = 500000; // Rough estimate for arbitrage transaction
            const gasPrice = 0.1 * 1e-9; // 0.1 gwei
            const ethPrice = 1800; // Rough ETH price estimate
            const gasFeesUSD = estimatedGasUnits * gasPrice * ethPrice;
            
            // Find optimal trade size
            const tradeSizing = this.findOptimalTradeSize(
                lowestPrice,
                highestPrice,
                buyDexFee,
                sellDexFee,
                gasFeesUSD,
                0.01, // 1% max slippage
                baseToken.symbol
            );
            
            // Calculate profit analysis if trade size is profitable
            const profitAnalysis = tradeSizing.profitable 
                ? this.calculateArbitrageProfit(
                    lowestPrice,
                    highestPrice,
                    buyDexFee,
                    sellDexFee,
                    0.001, // Flash loan fee
                    gasFeesUSD,
                    tradeSizing.recommendedAmount / lowestPrice // Convert USD to token amount
                )
                : null;
            
            // Calculate estimated ROI
            const estimatedROI = profitAnalysis 
                ? (profitAnalysis.netProfit / (tradeSizing.recommendedAmount)) * 100 
                : 0;
            
            // Define risk factors
            const riskFactors: string[] = [];
            if (priceSpread > 5) riskFactors.push('Large price spread - high volatility risk');
            if (estimatedROI < 1) riskFactors.push('Low ROI');
            if (tradeSizing.recommendedAmount > 100000) riskFactors.push('Large trade size');
            if (profitAnalysis && profitAnalysis.slippageImpact > 100) riskFactors.push('High slippage impact');
            
            return {
                opportunity: profitAnalysis?.netProfit ? profitAnalysis.netProfit >= minProfitUSD : false,
                buyDEX: bestBuyDEX,
                sellDEX: bestSellDEX,
                buyPrice: lowestPrice,
                sellPrice: highestPrice,
                priceSpread,
                tradeSizing,
                profitAnalysis,
                estimatedROI,
                riskFactors
            };
            
        } catch (error) {
            console.error('Error analyzing arbitrage opportunity:', error);
            return {
                opportunity: false,
                buyDEX: '',
                sellDEX: '',
                buyPrice: 0,
                sellPrice: 0,
                priceSpread: 0,
                tradeSizing: {
                    minAmount: 0,
                    maxAmount: 0,
                    recommendedAmount: 0,
                    profitable: false,
                    reason: 'Error analyzing opportunity'
                },
                profitAnalysis: null,
                estimatedROI: 0,
                riskFactors: ['Error during analysis']
            };
        }
    }
}
