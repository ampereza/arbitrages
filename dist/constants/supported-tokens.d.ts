import { Token } from '../interfaces/GraphTypes';
export declare const SUPPORTED_BASE_TOKENS: Token[];
export declare function isTokenSupported(tokenSymbol: string): boolean;
export declare function hasSufficientLiquidity(token: Token): boolean;
export declare function getTokenBySymbol(symbol: string): Token | undefined;
export declare function hasSupportedTokenInPair(token1Symbol: string, token2Symbol: string): boolean;
