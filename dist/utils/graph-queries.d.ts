import { Token } from '../interfaces/GraphTypes';
export declare function getTopPairsFromGraph(limit?: number): Promise<Array<{
    baseToken: Token;
    quoteToken: Token;
}>>;
