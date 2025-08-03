console.log('Starting test...');

try {
    console.log('Attempting to import TokenFetcher...');
    const TokenFetcherModule = require('./dist/TokenFetcher');
    console.log('Module imported:', Object.keys(TokenFetcherModule));
    
    const { TokenFetcher } = TokenFetcherModule;
    console.log('TokenFetcher extracted successfully');
    
    const tokenFetcher = new TokenFetcher('arbitrum');
    console.log('TokenFetcher instance created');
    
    // Just test importing the tokens config directly
    const supportedTokensModule = require('./dist/constants/supported-tokens');
    console.log('Supported tokens module:', Object.keys(supportedTokensModule));
    
    const { SUPPORTED_BASE_TOKENS } = supportedTokensModule;
    console.log(`Loaded ${SUPPORTED_BASE_TOKENS.length} tokens directly from config`);
    
    // Test a few token symbols
    const symbols = SUPPORTED_BASE_TOKENS.slice(0, 5).map(t => t.symbol);
    console.log('First 5 token symbols:', symbols);
    
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}
