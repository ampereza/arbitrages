# Arbitrage Bot - DEX Price Monitoring System

A full-stack arbitrage bot system that monitors price differences across multiple DEXs (Uniswap V2/V3, Sushiswap) and identifies profitable trading opportunities.

## Features

- 🔍 **Real-time monitoring** of 5000+ tokens across multiple DEXs
- 💰 **Profit calculation** with slippage, fees, and gas cost analysis
- 📊 **Web dashboard** with live updates and opportunity tracking
- 🔄 **Persistent storage** - opportunities don't disappear between scans
- ⚡ **Rate limiting** to prevent API throttling
- 🎯 **Trade sizing** optimization for maximum profitability

## Architecture

- **Backend**: Node.js + Express API server with TypeScript
- **Blockchain**: Arbitrum network via RPC
- **DEX Integration**: Direct smart contract calls to Uniswap V3, SushiSwap, Balancer V2, Arbswap, Wombat Exchange, Curve Finance

## Local Development

### Prerequisites
- Node.js 18+
- NPM or Yarn
- Infura API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ampereza/arbitrages.git
cd arbitrages
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
# Add your RPC provider URL to .env
```

4. Start the system:
```bash
# Start the API server
npm run api
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/opportunities` - Get current arbitrage opportunities
- `GET /api/tokens` - Get available tokens
- `POST /api/scan` - Trigger a manual scan

## Deployment to Render

### Quick Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Create a new Blueprint and select this repository

3. **Set Environment Variables**:
   - In Render dashboard, add your `PROVIDER_URL` for Arbitrum RPC

4. **Deploy**:
   - Render will automatically deploy the API service using `render.yaml`
   - Backend will be available at: `https://arbitrage-bot-api.onrender.com`

### Manual Deployment

If you prefer manual setup:

#### Backend Service
1. Create a new Web Service in Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run api`
5. Add environment variables:
   - `NODE_ENV=production`
   - `PROVIDER_URL=https://arb1.arbitrum.io/rpc`

## Environment Variables

### Backend (.env)
```bash
PROVIDER_URL=https://arb1.arbitrum.io/rpc
NODE_ENV=development
PORT=3001
PRIVATE_KEY=your_private_key_here  # Optional: for executing trades
```

## How It Works

1. **Token Discovery**: Uses predefined token list for Arbitrum network
2. **Pair Generation**: Creates trading pairs with major tokens (WETH, USDC, USDT, ARB, DAI)
3. **Multi-DEX Price Fetching**: Gets real-time prices from 6 DEXes on Arbitrum:
   - Uniswap V3 (concentrated liquidity)
   - SushiSwap (AMM)
   - Balancer V2 (multi-asset pools)
   - Arbswap (native AMM)
   - Wombat Exchange (stableswap)
   - Curve Finance (stablecoin pools)
4. **Arbitrage Analysis**: Calculates profit potential including gas costs and slippage
5. **Opportunity Detection**: Identifies price differences > 0.1% between DEXes
6. **API Access**: Provides REST endpoints for monitoring and integration

## Security Notes

- Never commit your `.env` file or API keys
- Use Render's secret environment variables for production
- The bot only monitors prices - it doesn't execute trades automatically
- All calculations include realistic fees, slippage, and gas costs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects.

## Disclaimer

This software is for educational purposes only. Cryptocurrency trading involves significant risk. Always do your own research and never invest more than you can afford to lose.
