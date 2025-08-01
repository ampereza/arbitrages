import { Token } from '../interfaces/GraphTypes';
import { NetworkType } from '../interfaces/Web3Types';
import { PriceQuote } from '../interfaces/ArbitrageTypes';
import { 
    UNISWAP_V2_PAIR_ABI,
    BALANCER_VAULT_ABI,
    CURVE_POOL_ABI,
    GMX_ROUTER_ABI
} from '../constants/abis';
import BN from 'bn.js';

export class DexPriceFetcher {
    private web3: NetworkType;
    
    constructor(web3: NetworkType) {
        this.web3 = web3;
    }

    public async getUniswapV2Price(
        pairAddress: string,
        tokenIn: Token,
        tokenOut: Token,
        amountIn: string
    ): Promise<PriceQuote> {
        const pair = new this.web3.eth.Contract(UNISWAP_V2_PAIR_ABI, pairAddress);
        
        try {
            const [token0, token1] = await Promise.all([
                pair.methods.token0().call(),
                pair.methods.token1().call()
            ]);

            const [reserve0, reserve1] = await pair.methods.getReserves().call();
            
            const isToken0 = tokenIn.address.toLowerCase() === token0.toLowerCase();
            const inputReserve = new BN(isToken0 ? reserve0 : reserve1);
            const outputReserve = new BN(isToken0 ? reserve1 : reserve0);

            // Calculate output amount using xy=k formula
            const amountInWithFee = new BN(amountIn).muln(997); // 0.3% fee
            const numerator = amountInWithFee.mul(outputReserve);
            const denominator = inputReserve.muln(1000).add(amountInWithFee);
            const amountOut = numerator.div(denominator);

            return {
                dex: 'UniswapV2',
                price: amountOut.toString(),
                gas: 150000
            };
        } catch (error) {
            console.error('Error fetching Uniswap V2 price:', error);
            throw error;
        }
    }

    public async getBalancerPrice(
        poolId: string,
        vaultAddress: string,
        tokenIn: Token,
        tokenOut: Token,
        amountIn: string
    ): Promise<PriceQuote> {
        const vault = new this.web3.eth.Contract(BALANCER_VAULT_ABI, vaultAddress);
        
        try {
            // Query swap
            const funds = {
                sender: this.web3.currentProvider.host,
                recipient: this.web3.currentProvider.host,
                fromInternalBalance: false,
                toInternalBalance: false
            };

            const swap = {
                poolId,
                assetIn: tokenIn.address,
                assetOut: tokenOut.address,
                amount: amountIn
            };

            const result = await vault.methods.queryBatchSwap(
                0, // GIVEN_IN
                [swap],
                funds
            ).call();

            // Balancer returns negative values for tokens going out
            const amountOut = new BN(result[1]).abs();

            return {
                dex: 'Balancer',
                price: amountOut.toString(),
                gas: 200000
            };
        } catch (error) {
            console.error('Error fetching Balancer price:', error);
            throw error;
        }
    }

    public async getCurvePrice(
        poolAddress: string,
        tokenIn: Token,
        tokenOut: Token,
        amountIn: string
    ): Promise<PriceQuote> {
        const pool = new this.web3.eth.Contract(CURVE_POOL_ABI, poolAddress);
        
        try {
            // Get token indices
            const coins = await Promise.all([0, 1, 2, 3].map(i => 
                pool.methods.coins(i).call().catch(() => null)
            ));
            
            const tokenInIndex = coins.findIndex(addr => 
                addr && addr.toLowerCase() === tokenIn.address.toLowerCase()
            );
            const tokenOutIndex = coins.findIndex(addr => 
                addr && addr.toLowerCase() === tokenOut.address.toLowerCase()
            );

            if (tokenInIndex === -1 || tokenOutIndex === -1) {
                throw new Error('Tokens not found in Curve pool');
            }

            // Get expected output amount
            const amountOut = await pool.methods.get_dy(
                tokenInIndex,
                tokenOutIndex,
                amountIn
            ).call();

            return {
                dex: 'Curve',
                price: amountOut.toString(),
                gas: 180000
            };
        } catch (error) {
            console.error('Error fetching Curve price:', error);
            throw error;
        }
    }

    public async getGMXPrice(
        routerAddress: string,
        tokenIn: Token,
        tokenOut: Token,
        amountIn: string
    ): Promise<PriceQuote> {
        const router = new this.web3.eth.Contract(GMX_ROUTER_ABI, routerAddress);
        
        try {
            const [amountOut, priceImpact] = await router.methods.getExpectedOut(
                tokenIn.address,
                tokenOut.address,
                amountIn
            ).call();

            // Calculate output considering price impact
            const impactBps = new BN(priceImpact);
            const baseAmount = new BN(amountOut);
            const finalAmount = baseAmount.sub(
                baseAmount.mul(impactBps).div(new BN(10000))
            );

            return {
                dex: 'GMX',
                price: finalAmount.toString(),
                gas: 250000
            };
        } catch (error) {
            console.error('Error fetching GMX price:', error);
            throw error;
        }
    }

    public async getTraderJoePrice(
        routerAddress: string,
        tokenIn: Token,
        tokenOut: Token,
        amountIn: string
    ): Promise<PriceQuote> {
        const router = new this.web3.eth.Contract(TRADERJOE_PAIR_ABI, routerAddress);
        
        try {
            const amountOut = await router.methods.getAmountOut(
                amountIn,
                tokenIn.address,
                tokenOut.address
            ).call();

            return {
                dex: 'TraderJoe',
                price: amountOut.toString(),
                gas: 160000
            };
        } catch (error) {
            console.error('Error fetching TraderJoe price:', error);
            throw error;
        }
    }
}
