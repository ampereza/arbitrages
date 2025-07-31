import { ethers } from 'ethers';

// Verification script for CRV/WETH arbitrage opportunity
async function verifyCRVArbitrage() {
    console.log('🔍 VERIFYING CRV/WETH ARBITRAGE OPPORTUNITY');
    console.log('==========================================\n');

    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
    
    // Token addresses
    const CRV = {
        address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
        symbol: 'CRV',
        decimals: 18
    };
    
    const WETH = {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        decimals: 18
    };

    // Contract addresses
    const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
    const SUSHISWAP_FACTORY = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac';

    const PAIR_ABI = [
        'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() view returns (address)',
        'function token1() view returns (address)'
    ];

    const UNIV3_FACTORY_ABI = [
        'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'
    ];

    const UNIV3_POOL_ABI = [
        'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
    ];

    const SUSHI_FACTORY_ABI = [
        'function getPair(address tokenA, address tokenB) view returns (address pair)'
    ];

    try {
        console.log('📊 Checking Uniswap V3 CRV/WETH price (0.05% fee tier)...');
        
        // Check Uniswap V3
        const uniV3Factory = new ethers.Contract(UNISWAP_V3_FACTORY, UNIV3_FACTORY_ABI, provider);
        const poolAddress = await uniV3Factory.getPool(CRV.address, WETH.address, 500); // 0.05% fee
        
        if (poolAddress === ethers.ZeroAddress) {
            console.log('❌ No Uniswap V3 pool found for CRV/WETH at 0.05% fee tier');
        } else {
            console.log(`✅ Found Uniswap V3 pool: ${poolAddress}`);
            
            const pool = new ethers.Contract(poolAddress, UNIV3_POOL_ABI, provider);
            const pair = new ethers.Contract(poolAddress, PAIR_ABI, provider);
            
            const [token0, token1] = await Promise.all([
                pair.token0(),
                pair.token1()
            ]);
            
            console.log(`Token0: ${token0}`);
            console.log(`Token1: ${token1}`);
            console.log(`CRV address: ${CRV.address}`);
            console.log(`WETH address: ${WETH.address}`);
            
            const { sqrtPriceX96 } = await pool.slot0();
            console.log(`sqrtPriceX96: ${sqrtPriceX96.toString()}`);
            
            // Calculate price
            const sqrtPrice = Number(sqrtPriceX96);
            const denominator = 2 ** 192;
            const rawPrice = (sqrtPrice * sqrtPrice) / denominator;
            
            const baseIsToken0 = CRV.address.toLowerCase() === token0.toLowerCase();
            console.log(`CRV is token0: ${baseIsToken0}`);
            
            let uniV3Price;
            if (baseIsToken0) {
                uniV3Price = rawPrice * (10 ** (CRV.decimals - WETH.decimals));
            } else {
                uniV3Price = (1 / rawPrice) * (10 ** (CRV.decimals - WETH.decimals));
            }
            
            console.log(`🦄 Uniswap V3 CRV/WETH price: ${uniV3Price.toFixed(8)}`);
        }

        console.log('\n📊 Checking Sushiswap CRV/WETH price...');
        
        // Check Sushiswap
        const sushiFactory = new ethers.Contract(SUSHISWAP_FACTORY, SUSHI_FACTORY_ABI, provider);
        const sushiPairAddress = await sushiFactory.getPair(CRV.address, WETH.address);
        
        if (sushiPairAddress === ethers.ZeroAddress) {
            console.log('❌ No Sushiswap pair found for CRV/WETH');
        } else {
            console.log(`✅ Found Sushiswap pair: ${sushiPairAddress}`);
            
            const sushiPair = new ethers.Contract(sushiPairAddress, PAIR_ABI, provider);
            const [token0, token1] = await Promise.all([
                sushiPair.token0(),
                sushiPair.token1()
            ]);
            
            const { reserve0, reserve1 } = await sushiPair.getReserves();
            console.log(`Reserve0: ${reserve0.toString()}`);
            console.log(`Reserve1: ${reserve1.toString()}`);
            
            const baseIsToken0 = CRV.address.toLowerCase() === token0.toLowerCase();
            console.log(`CRV is token0: ${baseIsToken0}`);
            
            let sushiPrice;
            if (baseIsToken0) {
                sushiPrice = (Number(reserve1) / 10 ** WETH.decimals) / (Number(reserve0) / 10 ** CRV.decimals);
            } else {
                sushiPrice = (Number(reserve0) / 10 ** WETH.decimals) / (Number(reserve1) / 10 ** CRV.decimals);
            }
            
            console.log(`🍣 Sushiswap CRV/WETH price: ${sushiPrice.toFixed(8)}`);
        }

        console.log('\n📈 VERIFICATION SUMMARY:');
        console.log('==========================================');
        console.log('Compare the above prices with the reported opportunity:');
        console.log('• Reported buy price (Uniswap V3): $0.000171');
        console.log('• Reported sell price (Sushiswap): $0.000259');
        console.log('• Reported spread: 50.82%');
        
    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

// Run verification
verifyCRVArbitrage().catch(console.error);
