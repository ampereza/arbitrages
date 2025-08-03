"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopPairsFromGraph = getTopPairsFromGraph;
const graphql_request_1 = require("graphql-request");
// Primary endpoints with fallbacks
const ENDPOINTS = {
    uniswap: {
        primary: 'https://172.64.147.225/subgraphs/name/ianlapham/arbitrum-minimal',
        backup: 'https://104.18.40.31/subgraphs/name/uniswap/uniswap-v3'
    },
    sushiswap: {
        primary: 'https://172.64.147.225/subgraphs/name/sushi-v3/arbitrum',
        backup: 'https://172.64.147.225/subgraphs/name/sushiswap/arbitrum-exchange'
    }
};
class RequestTimeoutError extends Error {
    constructor(message = 'Request timed out') {
        super(message);
        this.name = 'RequestTimeoutError';
    }
}
class EndpointError extends Error {
    constructor(message, errors) {
        super(message);
        this.name = 'EndpointError';
        this.errors = errors;
    }
}
const createGraphClient = (primaryEndpoint, backupEndpoint) => {
    const makeRequest = async (endpoint, query, variables) => {
        const client = new graphql_request_1.GraphQLClient(endpoint, {
            headers: {
                'Connection': 'close',
                'Host': 'api.thegraph.com',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, 30000);
        try {
            return await client.request(query, variables, { signal: controller.signal });
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new RequestTimeoutError();
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    };
    return {
        request: async (query, variables) => {
            const endpoints = [primaryEndpoint, backupEndpoint];
            const errors = [];
            for (const endpoint of endpoints) {
                try {
                    return await makeRequest(endpoint, query, variables);
                }
                catch (error) {
                    console.warn(`GraphQL request failed for ${endpoint}:`, error);
                    errors.push(error);
                    // Wait before trying next endpoint
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            throw new EndpointError('All GraphQL endpoints failed', errors);
        }
    };
};
const uniswapClient = createGraphClient(ENDPOINTS.uniswap.primary, ENDPOINTS.uniswap.backup);
const sushiswapClient = createGraphClient(ENDPOINTS.sushiswap.primary, ENDPOINTS.sushiswap.backup);
const TOP_PAIRS_QUERY = (0, graphql_request_1.gql) `
  query GetTopPairs($first: Int!) {
    pools(
      first: $first,
      orderBy: totalValueLockedUSD,
      orderDirection: desc,
      where: { liquidity_gt: "0" }
    ) {
      id
      token0 {
        id
        symbol
        decimals
        name
      }
      token1 {
        id
        symbol
        decimals
        name
      }
      totalValueLockedUSD
      volumeUSD
    }
  }
`;
async function getTopPairsFromGraph(limit = 100) {
    try {
        // Query both Uniswap V3 and Sushiswap with retry logic
        const [uniswapResponse, sushiResponse] = await Promise.all([
            uniswapClient.request(TOP_PAIRS_QUERY, { first: limit }),
            sushiswapClient.request(TOP_PAIRS_QUERY, { first: limit })
        ]);
        const pairs = new Map();
        // Process pools from both DEXes
        const allPools = [...(uniswapResponse?.pools || []), ...(sushiResponse?.pools || [])];
        for (const pool of allPools) {
            const token0 = {
                address: pool.token0.id,
                symbol: pool.token0.symbol,
                decimals: parseInt(pool.token0.decimals),
                name: pool.token0.name
            };
            const token1 = {
                address: pool.token1.id,
                symbol: pool.token1.symbol,
                decimals: parseInt(pool.token1.decimals),
                name: pool.token1.name
            };
            // Create a unique key for the pair to avoid duplicates
            const pairKey = [token0.address.toLowerCase(), token1.address.toLowerCase()].sort().join('-');
            // Only add if we don't have this pair yet
            if (!pairs.has(pairKey)) {
                pairs.set(pairKey, { baseToken: token0, quoteToken: token1 });
            }
        }
        return Array.from(pairs.values());
    }
    catch (error) {
        console.error('Error fetching pairs from The Graph:', error);
        return [];
    }
}
//# sourceMappingURL=graph-queries.js.map