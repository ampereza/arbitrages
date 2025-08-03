import { NetworkType } from './interfaces/Web3Types';
import { Token } from './interfaces/GraphTypes';
import { ArbitrageOpportunity, ArbitrageProfitDetails } from './interfaces/ArbitrageTypes';
import { DEX_ADDRESSES } from './constants/addresses';
import { SUPPORTED_BASE_TOKENS } from './constants/supported-tokens';
import { Web3TokenFetcher } from './utils/Web3TokenFetcher';
import BN from 'bn.js';

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

interface PriceInfo {
    source: string;
    baseToken: Token;
    quoteToken: Token;
    price: string;
    timestamp: number;
}

export class TokenFetcher {
    private readonly networkType: NetworkType;
    private readonly web3TokenFetcher: Web3TokenFetcher;
    private readonly dexAddresses: typeof DEX_ADDRESSES[NetworkType];

    constructor(networkType: NetworkType = 'arbitrum') {
        this.networkType = networkType;
        this.dexAddresses = DEX_ADDRESSES[networkType];
        
        const defaultUrl = networkType === 'arbitrum'
            ? 'https://arb1.arbitrum.io/rpc'
            : 'https://mainnet.infura.io/v3/your-project-id';
            
        const providerUrl = process.env.PROVIDER_URL || defaultUrl;

        this.web3TokenFetcher = new Web3TokenFetcher(providerUrl, {
            factoryAddress: this.dexAddresses.UNISWAP_V2_FACTORY,
            baseTokens: [
                '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
                '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC (Native)
                '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
                this.dexAddresses.WETH, // Keep WETH for compatibility
            ],
            supportedTokens: SUPPORTED_BASE_TOKENS.map(token => token.address),
            excludedTokens: []
        });
    }

    public async fetchTokens(options: { minLiquidity?: number } = {}): Promise<Token[]> {
        const { minLiquidity = 0 } = options;

        try {
            // Filter tokens by minimum liquidity score if specified
            const filteredTokens = SUPPORTED_BASE_TOKENS.filter(token => 
                (token.liquidityScore || 0) >= minLiquidity
            );

            console.log(`Fetched ${filteredTokens.length} tokens for arbitrage scanning (min liquidity: ${minLiquidity})`);
            return filteredTokens;
        } catch (error) {
            console.error('Error fetching tokens:', error);
            return [];
        }
    }

    public async generateTradingPairs(): Promise<Token[]> {
        const tokens = await this.fetchTokens();
        return tokens;
    }

    public async analyzeArbitrageOpportunity(
        tokenIn: string,
        tokenOut: string,
        amount: string
    ): Promise<ArbitrageOpportunity> {
        const buyPrice = 1000; // Example price
        const sellPrice = 1010; // Example price
        const gasCost = 50; // Example gas cost in USD
        
        const profitDetails = this.calculateProfitability(amount, buyPrice, sellPrice, gasCost);

        return {
            buyDEX: 'UniswapV2',
            sellDEX: 'SushiSwap',
            buyPrice,
            sellPrice,
            priceSpread: ((sellPrice - buyPrice) / buyPrice) * 100,
            estimatedROI: (Number(profitDetails.netProfit) / Number(amount)) * 100,
            profitAnalysis: {
                netProfit: Number(profitDetails.netProfit),
                grossProfit: Number(profitDetails.profit),
                gasCost: Number(profitDetails.gasCost)
            },
            tradeSizing: {
                recommendedAmount: Number(amount),
                maxAmount: Number(amount) * 2,
                minAmount: Number(amount) * 0.5
            },
            riskFactors: [],
            tokenIn: { address: tokenIn } as Token,
            tokenOut: { address: tokenOut } as Token,
            timestamp: Date.now()
        };
    }

    private calculateProfitability(
        inputAmount: string,
        buyPrice: number,
        sellPrice: number,
        gasCost: number,
        dexFees: number = 0.003 // 0.3% standard fee
    ): ArbitrageProfitDetails {
        const inputAmountBN = new BN(inputAmount);
        const grossProfit = new BN((sellPrice - buyPrice).toString()).mul(inputAmountBN);
        const totalFees = new BN(Math.floor(dexFees * Number(grossProfit))).toString();
        const gasCostBN = new BN(gasCost.toString());
        const netProfit = grossProfit.sub(new BN(totalFees)).sub(gasCostBN);

        return {
            profit: grossProfit.toString(),
            gasCost: gasCostBN.toString(),
            estimatedNet: netProfit.toString(),
            tokenAmountIn: inputAmount,
            tokenAmountOut: new BN(Math.floor(Number(inputAmount) * sellPrice).toString()).toString(),
            path: [],
            network: this.networkType,
            timestamp: Date.now(),
            netProfit: netProfit.toString(),
            grossProfit: grossProfit.toString(),
            totalFees,
            totalFeesPercent: ((Number(totalFees) / Number(grossProfit)) * 100).toString(),
            profitMargin: ((Number(netProfit) / Number(inputAmount)) * 100).toString(),
            viable: netProfit.gt(new BN(0)),
            breakdown: {
                route: `UniswapV2 -> SushiSwap`,
                gasUsed: gasCostBN.toString(),
                fees: totalFees,
                profit: grossProfit.toString(),
                tokens: [],
                amounts: []
            }
        };
    }
}
