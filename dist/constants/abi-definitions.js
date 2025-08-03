"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v3PoolAbi = exports.v3FactoryAbi = exports.poolAbi = exports.factoryV2Abi = exports.erc20Abi = void 0;
exports.erc20Abi = [
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];
exports.factoryV2Abi = [
    {
        constant: true,
        inputs: [{ name: '', type: 'uint256' }],
        name: 'allPairs',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'allPairsLength',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];
exports.poolAbi = [
    {
        constant: true,
        inputs: [],
        name: 'token0',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'token1',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [],
        name: 'getReserves',
        outputs: [
            { name: '_reserve0', type: 'uint112' },
            { name: '_reserve1', type: 'uint112' },
            { name: '_blockTimestampLast', type: 'uint32' }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];
exports.v3FactoryAbi = [
    {
        inputs: [
            { name: 'tokenA', type: 'address' },
            { name: 'tokenB', type: 'address' },
            { name: 'fee', type: 'uint24' }
        ],
        name: 'getPool',
        outputs: [{ name: 'pool', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];
exports.v3PoolAbi = [
    {
        inputs: [],
        name: 'slot0',
        outputs: [
            { name: 'sqrtPriceX96', type: 'uint160' },
            { name: 'tick', type: 'int24' },
            { name: 'observationIndex', type: 'uint16' },
            { name: 'observationCardinality', type: 'uint16' },
            { name: 'observationCardinalityNext', type: 'uint16' },
            { name: 'feeProtocol', type: 'uint8' },
            { name: 'unlocked', type: 'bool' }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
];
//# sourceMappingURL=abi-definitions.js.map