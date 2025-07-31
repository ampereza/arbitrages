import { ArbitrageBot } from './arbitrage-bot.js';
async function main() {
    const bot = new ArbitrageBot();
    await bot.start();
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        bot.stop();
        process.exit(0);
    });
}
main().catch(console.error);
