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
- **Frontend**: Next.js React dashboard with Tailwind CSS
- **Blockchain**: Ethereum mainnet via Infura
- **DEX Integration**: Direct smart contract calls to Uniswap V2/V3, Sushiswap

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
cd src/frontend && npm install && cd ../..
```

3. Create environment file:
```bash
cp .env.example .env
# Add your INFURA_KEY to .env
```

4. Start the system:
```bash
# Start both backend and frontend
npm run full

# Or start individually:
npm run api      # Backend on :3001
npm run frontend # Frontend on :3000
```

## Deployment to Render

### Quick Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Create a new Blueprint and select this repository

3. **Set Environment Variables**:
   - In Render dashboard, add your `INFURA_KEY` as a secret environment variable

4. **Deploy**:
   - Render will automatically deploy both services using `render.yaml`
   - Backend will be available at: `https://arbitrage-bot-api.onrender.com`
   - Frontend will be available at: `https://arbitrage-bot-frontend.onrender.com`

### Manual Deployment

If you prefer manual setup:

#### Backend Service
1. Create a new Web Service in Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run api`
5. Add environment variables:
   - `NODE_ENV=production`
   - `INFURA_KEY=your_infura_key_here`

#### Frontend Service
1. Create another Web Service in Render
2. Set root directory: `src/frontend`
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=https://arbitrage-bot-api.onrender.com`

## Environment Variables

### Backend (.env)
```bash
INFURA_KEY=your_infura_key_here
NODE_ENV=development
PORT=3001
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001  # Development
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com  # Production
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/status` - Bot status and stats
- `GET /api/opportunities` - Current arbitrage opportunities
- `POST /api/bot/start` - Start monitoring
- `POST /api/bot/stop` - Stop monitoring

## How It Works

1. **Token Discovery**: Fetches token lists from multiple sources
2. **Pair Generation**: Creates trading pairs with major tokens (WETH, USDC, etc.)
3. **Price Fetching**: Gets real-time prices from DEX smart contracts
4. **Arbitrage Analysis**: Calculates profit potential including fees and slippage
5. **Opportunity Storage**: Maintains opportunities across scans (5-minute lifetime)
6. **Dashboard Display**: Shows live opportunities with detailed analytics

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
