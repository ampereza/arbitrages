import { GraphQLClient, gql } from 'graphql-request';
import { Token } from '../interfaces/GraphTypes';

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
interface GraphClientWithRetry {
    request: <T>(query: string, variables?: any) => Promise<T>;
}

class RequestTimeoutError extends Error {
    constructor(message = 'Request timed out') {
        super(message);
        this.name = 'RequestTimeoutError';
    }
}

class EndpointError extends Error {
    public errors: Error[];
    
    constructor(message: string, errors: Error[]) {
        super(message);
        this.name = 'EndpointError';
        this.errors = errors;
    }
}

const createGraphClient = (primaryEndpoint: string, backupEndpoint: string): GraphClientWithRetry => {
    const makeRequest = async <T>(endpoint: string, query: string, variables?: any): Promise<T> => {
        const client = new GraphQLClient(endpoint, {
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
            return await client.request<T>(
                query,
                variables,
                { signal: controller.signal }
            );
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new RequestTimeoutError();
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    };

    return {
        request: async <T>(query: string, variables?: any): Promise<T> => {
            const endpoints = [primaryEndpoint, backupEndpoint];
            const errors: Error[] = [];

            for (const endpoint of endpoints) {
                try {
                    return await makeRequest<T>(endpoint, query, variables);
                } catch (error) {
                    console.warn(`GraphQL request failed for ${endpoint}:`, error);
                    errors.push(error as Error);
                    
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

const TOP_PAIRS_QUERY = gql`
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

interface GraphToken {
    id: string;
    symbol: string;
    decimals: string;
    name: string;
}

interface GraphPool {
    id: string;
    token0: GraphToken;
    token1: GraphToken;
    totalValueLockedUSD: string;
    volumeUSD: string;
}

interface GraphResponse {
    pools: GraphPool[];
}

export async function getTopPairsFromGraph(limit: number = 100): Promise<Array<{baseToken: Token, quoteToken: Token}>> {
    try {
        // Query both Uniswap V3 and Sushiswap with retry logic
        const [uniswapResponse, sushiResponse] = await Promise.all([
            uniswapClient.request<GraphResponse>(TOP_PAIRS_QUERY, { first: limit }),
            sushiswapClient.request<GraphResponse>(TOP_PAIRS_QUERY, { first: limit })
        ]);

        const pairs = new Map<string, {baseToken: Token, quoteToken: Token}>();

        // Process pools from both DEXes
        const allPools = [...(uniswapResponse?.pools || []), ...(sushiResponse?.pools || [])];
        
        for (const pool of allPools) {
            const token0: Token = {
                address: pool.token0.id,
                symbol: pool.token0.symbol,
                decimals: parseInt(pool.token0.decimals),
                name: pool.token0.name
            };

            const token1: Token = {
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
    } catch (error) {
        console.error('Error fetching pairs from The Graph:', error);
        return [];
    }
}
