import { AbiItem } from 'web3-utils';

// Common token interface ABI
export const ERC20_ABI: AbiItem[] = [
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function"
    },
    {
        constant: true,
        inputs: [{ name: "", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        constant: false,
        inputs: [
            { name: "_spender", type: "address" },
            { name: "_value", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
    }
];

// DEX interfaces
export const UNISWAP_V2_PAIR_ABI: AbiItem[] = [
    {
        constant: true,
        inputs: [],
        name: "token0",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "token1",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
            { name: "reserve0", type: "uint112" },
            { name: "reserve1", type: "uint112" },
            { name: "blockTimestampLast", type: "uint32" }
        ],
        stateMutability: "view",
        type: "function"
    }
];

// Balancer constants
export const BALANCER_VAULT_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "kind", type: "uint8" },
            { 
                name: "swaps", 
                type: "tuple[]",
                components: [
                    { name: "poolId", type: "bytes32" },
                    { name: "assetInIndex", type: "uint256" },
                    { name: "assetOutIndex", type: "uint256" },
                    { name: "amount", type: "uint256" },
                    { name: "userData", type: "bytes" }
                ]
            },
            { name: "assets", type: "address[]" },
            { 
                name: "funds", 
                type: "tuple",
                components: [
                    { name: "sender", type: "address" },
                    { name: "fromInternalBalance", type: "bool" },
                    { name: "recipient", type: "address" },
                    { name: "toInternalBalance", type: "bool" }
                ]
            }
        ],
        name: "queryBatchSwap",
        outputs: [{ name: "", type: "int256[]" }],
        stateMutability: "view",
        type: "function"
    }
];

// Curve constants
export const CURVE_POOL_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "i", type: "int128" },
            { name: "j", type: "int128" },
            { name: "dx", type: "uint256" }
        ],
        name: "get_dy",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ name: "i", type: "uint256" }],
        name: "coins",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    }
];

// GMX constants
export const GMX_ROUTER_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "path", type: "address[]" },
            { name: "amountIn", type: "uint256" },
            { name: "minOut", type: "uint256" }
        ],
        name: "getAmountsOut",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    }
];

// AAVE constants
export const AAVE_LENDING_POOL_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "assets", type: "address[]" },
            { name: "amounts", type: "uint256[]" },
            { name: "premiums", type: "uint256[]" },
            { name: "initiator", type: "address" },
            { name: "params", type: "bytes" }
        ],
        name: "flashLoan",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
];

// UniswapV2 factory
export const FACTORY_V2_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "tokenA", type: "address" },
            { name: "tokenB", type: "address" }
        ],
        name: "getPair",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    }
];

// UniswapV3 factory
export const V3_FACTORY_ABI: AbiItem[] = [
    {
        inputs: [
            { name: "tokenA", type: "address" },
            { name: "tokenB", type: "address" },
            { name: "fee", type: "uint24" }
        ],
        name: "getPool",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    }
];

// UniswapV3 pool
export const POOL_ABI: AbiItem[] = [
    {
        inputs: [],
        name: "slot0",
        outputs: [
            { name: "sqrtPriceX96", type: "uint160" },
            { name: "tick", type: "int24" }
        ],
        stateMutability: "view",
        type: "function"
    }
];

// TraderJoe interface
export const TRADERJOE_PAIR_ABI: AbiItem[] = [
    {
        constant: true,
        inputs: [],
        name: "getReserves",
        outputs: [
            { name: "reserve0", type: "uint112" },
            { name: "reserve1", type: "uint112" },
            { name: "blockTimestampLast", type: "uint32" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { name: "amountIn", type: "uint256" },
            { name: "path", type: "address[]" }
        ],
        name: "getAmountsOut",
        outputs: [{ name: "amounts", type: "uint256[]" }],
        stateMutability: "view",
        type: "function"
    }
];
