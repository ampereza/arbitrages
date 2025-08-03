"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexPriceFetcher = void 0;
const web3_1 = __importDefault(require("web3"));
const abis_1 = require("../constants/abis");
const extra_abis_1 = require("../constants/extra-abis");
const bn_js_1 = __importDefault(require("bn.js"));
class DexPriceFetcher {
    constructor(provider) {
        const web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(provider));
        this.web3 = web3;
    }
    // Calculate the actual amount out in wei (for blockchain compatibility)
    // Then convert to human-readable exchange rate for display
    calculatePrice(amountIn, amountOut, tokenIn, tokenOut) {
        // amountOut is already in wei, convert to human readable for display
        const amountOutBN = new bn_js_1.default(amountOut);
        const amountInBN = new bn_js_1.default(amountIn);
        if (amountInBN.isZero()) {
            return '0.000000';
        }
        // Calculate exchange rate: amountOut (in token units) / amountIn (in token units)
        // Convert both to token units first
        const tokenInScale = new bn_js_1.default(10).pow(new bn_js_1.default(tokenIn.decimals));
        const tokenOutScale = new bn_js_1.default(10).pow(new bn_js_1.default(tokenOut.decimals));
        // Convert to human readable amounts
        const amountInHuman = amountInBN.div(tokenInScale);
        const amountOutHuman = amountOutBN.div(tokenOutScale);
        if (amountInHuman.isZero()) {
            return '0.000000';
        }
        // Calculate rate with precision
        const precision = new bn_js_1.default(1000000); // 6 decimal places
        const rate = amountOutHuman.mul(precision).div(amountInHuman);
        // Format as decimal string
        const rateStr = rate.toString();
        if (rateStr.length <= 6) {
            return '0.' + rateStr.padStart(6, '0');
        }
        else {
            const wholePart = rateStr.slice(0, -6);
            const decimalPart = rateStr.slice(-6);
            return wholePart + '.' + decimalPart;
        }
    }
    async getUniswapV2Price(factoryAddress, tokenIn, tokenOut, amountIn) {
        try {
            // First, get the pair address from the factory
            const factory = new this.web3.eth.Contract(abis_1.FACTORY_V2_ABI, factoryAddress);
            const pairAddress = await factory.methods.getPair(tokenIn.address, tokenOut.address).call();
            if (pairAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error(`No pair exists for ${tokenIn.symbol}/${tokenOut.symbol}`);
            }
            const pair = new this.web3.eth.Contract(abis_1.UNISWAP_V2_PAIR_ABI, pairAddress);
            const [token0, token1] = await Promise.all([
                pair.methods.token0().call(),
                pair.methods.token1().call()
            ]);
            const reserves = await pair.methods.getReserves().call();
            const reserve0 = reserves._reserve0 || reserves[0];
            const reserve1 = reserves._reserve1 || reserves[1];
            const isToken0 = tokenIn.address.toLowerCase() === token0.toLowerCase();
            const inputReserve = new bn_js_1.default(isToken0 ? reserve0 : reserve1);
            const outputReserve = new bn_js_1.default(isToken0 ? reserve1 : reserve0);
            if (inputReserve.isZero() || outputReserve.isZero()) {
                throw new Error(`No liquidity in pair ${tokenIn.symbol}/${tokenOut.symbol}`);
            }
            // Calculate output amount using xy=k formula
            const amountInWithFee = new bn_js_1.default(amountIn).muln(997); // 0.3% fee
            const numerator = amountInWithFee.mul(outputReserve);
            const denominator = inputReserve.muln(1000).add(amountInWithFee);
            const amountOut = numerator.div(denominator);
            // Calculate exchange rate based on token decimals
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'UniswapV2',
                price: exchangeRate,
                gas: 150000
            };
        }
        catch (error) {
            console.error('Error fetching Uniswap V2 price:', error);
            throw error;
        }
    }
    async getBalancerPrice(poolId, vaultAddress, tokenIn, tokenOut, amountIn) {
        const vault = new this.web3.eth.Contract(abis_1.BALANCER_VAULT_ABI, vaultAddress);
        try {
            // Query swap with correct parameters for Balancer V2
            const assets = [
                this.web3.utils.toChecksumAddress(tokenIn.address),
                this.web3.utils.toChecksumAddress(tokenOut.address)
            ];
            const swaps = [{
                    poolId: poolId,
                    assetInIndex: 0,
                    assetOutIndex: 1,
                    amount: amountIn,
                    userData: '0x'
                }];
            const funds = {
                sender: '0x0000000000000000000000000000000000000000',
                fromInternalBalance: false,
                recipient: '0x0000000000000000000000000000000000000000',
                toInternalBalance: false
            };
            const result = await vault.methods.queryBatchSwap(0, // GIVEN_IN as number (0 = GIVEN_IN, 1 = GIVEN_OUT)
            swaps, assets, funds).call();
            // Balancer returns negative values for tokens going out
            const amountOut = new bn_js_1.default(result[1]).abs();
            // Calculate exchange rate based on token decimals
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'Balancer',
                price: exchangeRate,
                gas: 200000
            };
        }
        catch (error) {
            console.error('Error fetching Balancer price:', error);
            throw error;
        }
    }
    async getCurvePrice(poolAddress, tokenIn, tokenOut, amountIn) {
        const pool = new this.web3.eth.Contract(abis_1.CURVE_POOL_ABI, poolAddress);
        try {
            // Get token indices
            const coins = await Promise.all([0, 1, 2, 3].map(i => pool.methods.coins(i).call().catch(() => null)));
            const tokenInIndex = coins.findIndex(addr => addr && addr.toLowerCase() === tokenIn.address.toLowerCase());
            const tokenOutIndex = coins.findIndex(addr => addr && addr.toLowerCase() === tokenOut.address.toLowerCase());
            if (tokenInIndex === -1 || tokenOutIndex === -1) {
                throw new Error('Tokens not found in Curve pool');
            }
            // Get expected output amount
            const amountOut = await pool.methods.get_dy(tokenInIndex, tokenOutIndex, amountIn).call();
            // Calculate exchange rate based on token decimals
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'Curve',
                price: exchangeRate,
                gas: 180000
            };
        }
        catch (error) {
            console.error('Error fetching Curve price:', error);
            throw error;
        }
    }
    async getGMXPrice(routerAddress, tokenIn, tokenOut, amountIn) {
        const router = new this.web3.eth.Contract(abis_1.GMX_ROUTER_ABI, routerAddress);
        try {
            const [amountOut, priceImpact] = await router.methods.getExpectedOut(tokenIn.address, tokenOut.address, amountIn).call();
            // Calculate output considering price impact
            const impactBps = new bn_js_1.default(priceImpact);
            const baseAmount = new bn_js_1.default(amountOut);
            const finalAmount = baseAmount.sub(baseAmount.mul(impactBps).div(new bn_js_1.default(10000)));
            return {
                dex: 'GMX',
                price: finalAmount.toString(),
                gas: 250000
            };
        }
        catch (error) {
            console.error('Error fetching GMX price:', error);
            throw error;
        }
    }
    async getTraderJoePrice(routerAddress, tokenIn, tokenOut, amountIn) {
        const router = new this.web3.eth.Contract(abis_1.TRADERJOE_PAIR_ABI, routerAddress);
        try {
            const amountOut = await router.methods.getAmountOut(amountIn, tokenIn.address, tokenOut.address).call();
            return {
                dex: 'TraderJoe',
                price: amountOut.toString(),
                gas: 160000
            };
        }
        catch (error) {
            console.error('Error fetching TraderJoe price:', error);
            throw error;
        }
    }
    async getArbswapPrice(factoryAddress, tokenIn, tokenOut, amountIn) {
        // Arbswap uses AMM similar to Uniswap V2
        const result = await this.getUniswapV2Price(factoryAddress, tokenIn, tokenOut, amountIn);
        return {
            ...result,
            dex: 'Arbswap'
        };
    }
    async getWombatPrice(poolAddress, tokenIn, tokenOut, amountIn) {
        // Wombat Exchange uses quotePotentialSwap for price queries
        const poolContract = new this.web3.eth.Contract(extra_abis_1.WOMBAT_POOL_ABI, poolAddress);
        try {
            // Use the quotePotentialSwap method for price estimation
            const result = await poolContract.methods.quotePotentialSwap(this.web3.utils.toChecksumAddress(tokenIn.address), this.web3.utils.toChecksumAddress(tokenOut.address), amountIn).call();
            // result returns [potentialOutcome, haircut]
            const amountOut = result.potentialOutcome || result[0];
            // Calculate exchange rate based on token decimals
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'WombatExchange',
                price: exchangeRate,
                gas: 120000
            };
        }
        catch (error) {
            console.error('Error fetching Wombat price:', error);
            throw error;
        }
    }
    async getUniswapV3Price(quoterAddress, tokenIn, tokenOut, amountIn, fee = 3000 // 0.3% fee tier
    ) {
        const quoter = new this.web3.eth.Contract([
            {
                "inputs": [
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint24", "name": "fee", "type": "uint24" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
                ],
                "name": "quoteExactInputSingle",
                "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ], quoterAddress);
        try {
            const amountOut = await quoter.methods.quoteExactInputSingle(tokenIn.address, tokenOut.address, fee, amountIn, 0 // No price limit
            ).call();
            // Calculate exchange rate based on token decimals
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'UniswapV3',
                price: exchangeRate,
                gas: 100000
            };
        }
        catch (error) {
            console.error('Error fetching Uniswap V3 price:', error);
            throw error;
        }
    }
    // Add methods for new DEXes using proper ABIs
    async getCamelotPrice(factoryAddress, routerAddress, tokenIn, tokenOut, amountIn) {
        const factory = new this.web3.eth.Contract(abis_1.FACTORY_V2_ABI, factoryAddress);
        try {
            // Get pair address (Camelot uses same interface as UniswapV2)
            const pairAddress = await factory.methods.getPair(tokenIn.address, tokenOut.address).call();
            if (pairAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error(`No Camelot pair found for ${tokenIn.symbol}/${tokenOut.symbol}`);
            }
            // Use the pair directly to get reserves and calculate price
            const pair = new this.web3.eth.Contract(abis_1.UNISWAP_V2_PAIR_ABI, pairAddress);
            const reserves = await pair.methods.getReserves().call();
            const token0 = await pair.methods.token0().call();
            let reserve0, reserve1;
            if (token0.toLowerCase() === tokenIn.address.toLowerCase()) {
                reserve0 = reserves.reserve0;
                reserve1 = reserves.reserve1;
            }
            else {
                reserve0 = reserves.reserve1;
                reserve1 = reserves.reserve0;
            }
            // Calculate amount out using x*y=k formula
            const amountInBN = new bn_js_1.default(amountIn);
            const reserve0BN = new bn_js_1.default(reserve0);
            const reserve1BN = new bn_js_1.default(reserve1);
            const amountInWithFee = amountInBN.mul(new bn_js_1.default(997)); // 0.3% fee
            const numerator = amountInWithFee.mul(reserve1BN);
            const denominator = reserve0BN.mul(new bn_js_1.default(1000)).add(amountInWithFee);
            const amountOut = numerator.div(denominator);
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'Camelot',
                price: exchangeRate,
                gas: 140000
            };
        }
        catch (error) {
            console.error('Error fetching Camelot price:', error);
            throw error;
        }
    }
    async getRamsesPrice(factoryAddress, routerAddress, tokenIn, tokenOut, amountIn) {
        const factory = new this.web3.eth.Contract(abis_1.FACTORY_V2_ABI, factoryAddress);
        try {
            // Ramses uses similar interface to Solidly/Velodrome, try volatile pair first
            let pairAddress;
            try {
                // Try volatile pair first (stable=false)
                pairAddress = await factory.methods.getPair(tokenIn.address, tokenOut.address, false).call();
            }
            catch {
                // Fallback to standard getPair
                pairAddress = await factory.methods.getPair(tokenIn.address, tokenOut.address).call();
            }
            if (pairAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error(`No Ramses pair found for ${tokenIn.symbol}/${tokenOut.symbol}`);
            }
            // Use the pair to get reserves
            const pair = new this.web3.eth.Contract(abis_1.UNISWAP_V2_PAIR_ABI, pairAddress);
            const reserves = await pair.methods.getReserves().call();
            const token0 = await pair.methods.token0().call();
            let reserve0, reserve1;
            if (token0.toLowerCase() === tokenIn.address.toLowerCase()) {
                reserve0 = reserves.reserve0;
                reserve1 = reserves.reserve1;
            }
            else {
                reserve0 = reserves.reserve1;
                reserve1 = reserves.reserve0;
            }
            // Calculate amount out using x*y=k formula with dynamic fees
            const amountInBN = new bn_js_1.default(amountIn);
            const reserve0BN = new bn_js_1.default(reserve0);
            const reserve1BN = new bn_js_1.default(reserve1);
            const amountInWithFee = amountInBN.mul(new bn_js_1.default(997)); // Approximate fee
            const numerator = amountInWithFee.mul(reserve1BN);
            const denominator = reserve0BN.mul(new bn_js_1.default(1000)).add(amountInWithFee);
            const amountOut = numerator.div(denominator);
            const exchangeRate = this.calculatePrice(amountIn, amountOut.toString(), tokenIn, tokenOut);
            return {
                dex: 'Ramses',
                price: exchangeRate,
                gas: 160000
            };
        }
        catch (error) {
            console.error('Error fetching Ramses price:', error);
            throw error;
        }
    }
}
exports.DexPriceFetcher = DexPriceFetcher;
//# sourceMappingURL=DexPriceFetcher.js.map