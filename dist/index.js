"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArbitrageBot_1 = require("./ArbitrageBot");
async function main() {
    const bot = new ArbitrageBot_1.ArbitrageBot();
    await bot.start();
    process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        bot.stop();
        process.exit(0);
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map