'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Square, TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, Settings } from 'lucide-react';
export default function ArbitrageDashboard() {
    const [botStatus, setBotStatus] = useState({
        running: false,
        lastUpdate: 0,
        totalProfitToday: 0,
        totalTrades: 0,
        successRate: 0
    });
    const [opportunities, setOpportunities] = useState([]);
    const [mounted, setMounted] = useState(false);
    // Mock data for demonstration
    useEffect(() => {
        setMounted(true);
        const now = Date.now();
        const mockOpportunities = [
            {
                id: '1',
                pair: 'ETH/USDC',
                buyDEX: 'Uniswap V2',
                sellDEX: 'Sushiswap',
                buyPrice: 2341.50,
                sellPrice: 2348.75,
                priceSpread: 0.31,
                recommendedAmount: 5.0,
                netProfit: 32.15,
                roi: 2.74,
                riskFactors: ['Low liquidity on Sushiswap'],
                timestamp: now - 30000
            },
            {
                id: '2',
                pair: 'WBTC/USDC',
                buyDEX: 'Uniswap V3',
                sellDEX: 'Uniswap V2',
                buyPrice: 43250.00,
                sellPrice: 43387.50,
                priceSpread: 0.32,
                recommendedAmount: 0.5,
                netProfit: 68.75,
                roi: 1.59,
                riskFactors: ['High gas fees', 'Medium slippage risk'],
                timestamp: now - 45000
            },
            {
                id: '3',
                pair: 'USDC/DAI',
                buyDEX: 'Sushiswap',
                sellDEX: 'Uniswap V3',
                buyPrice: 0.9998,
                sellPrice: 1.0012,
                priceSpread: 0.14,
                recommendedAmount: 10000,
                netProfit: 14.00,
                roi: 0.14,
                riskFactors: ['Low profit margin'],
                timestamp: now - 60000
            }
        ];
        setOpportunities(mockOpportunities);
        // Mock bot status updates
        setBotStatus({
            running: true,
            lastUpdate: now,
            totalProfitToday: 247.83,
            totalTrades: 12,
            successRate: 91.7
        });
    }, []);
    const toggleBot = () => {
        setBotStatus(prev => ({
            ...prev,
            running: !prev.running,
            lastUpdate: Date.now()
        }));
    };
    const formatTimeAgo = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60)
            return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };
    const getRiskBadgeVariant = (riskFactors) => {
        if (riskFactors.length === 0)
            return 'default';
        if (riskFactors.length === 1)
            return 'secondary';
        return 'destructive';
    };
    return (<div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arbitrage Trading Dashboard</h1>
            <p className="text-muted-foreground">Monitor and control your DEX arbitrage bot</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2"/>
              Settings
            </Button>
            <Badge variant={botStatus.running ? "default" : "secondary"} className="px-3 py-1">
              {botStatus.running ? "Bot Running" : "Bot Stopped"}
            </Badge>
          </div>
        </div>

        {/* Bot Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5"/>
              Bot Control & Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Control</div>
                <Button onClick={toggleBot} variant={botStatus.running ? "destructive" : "default"} className="w-full">
                  {botStatus.running ? (<>
                      <Square className="h-4 w-4 mr-2"/>
                      Stop Bot
                    </>) : (<>
                      <Play className="h-4 w-4 mr-2"/>
                      Start Bot
                    </>)}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Today's Profit</div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600"/>
                  <span className="text-2xl font-bold text-green-600">
                    ${botStatus.totalProfitToday.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Trades</div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600"/>
                  <span className="text-2xl font-bold">{botStatus.totalTrades}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600"/>
                  <span className="text-2xl font-bold">{botStatus.successRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arbitrage Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5"/>
                Current Arbitrage Opportunities
              </div>
              <Badge variant="secondary">{opportunities.length} opportunities</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                <p>No arbitrage opportunities found at the moment.</p>
                <p className="text-sm">The bot is monitoring for profitable trades...</p>
              </div>) : (<div className="space-y-4">
                {opportunities.map((opp) => (<div key={opp.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Trading Pair */}
                      <div className="space-y-1">
                        <div className="font-semibold">{opp.pair}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(opp.timestamp)}
                        </div>
                      </div>
                      
                      {/* Buy/Sell Info */}
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-green-600">Buy:</span> {opp.buyDEX}
                        </div>
                        <div className="text-sm">
                          <span className="text-red-600">Sell:</span> {opp.sellDEX}
                        </div>
                      </div>
                      
                      {/* Prices */}
                      <div className="space-y-1">
                        <div className="text-sm">
                          Buy: ${opp.buyPrice.toLocaleString()}
                        </div>
                        <div className="text-sm">
                          Sell: ${opp.sellPrice.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Spread & ROI */}
                      <div className="space-y-1">
                        <div className="text-sm">
                          Spread: <span className="font-semibold">{opp.priceSpread.toFixed(2)}%</span>
                        </div>
                        <div className="text-sm">
                          ROI: <span className="font-semibold text-green-600">{opp.roi.toFixed(2)}%</span>
                        </div>
                      </div>
                      
                      {/* Profit */}
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-green-600">
                          +${opp.netProfit.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opp.recommendedAmount} {opp.pair.split('/')[0]}
                        </div>
                      </div>
                      
                      {/* Risk & Action */}
                      <div className="space-y-2">
                        {opp.riskFactors.length > 0 && (<Badge variant={getRiskBadgeVariant(opp.riskFactors)} className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1"/>
                            {opp.riskFactors.length} risk{opp.riskFactors.length > 1 ? 's' : ''}
                          </Badge>)}
                        <Button size="sm" className="w-full" disabled={!botStatus.running}>
                          Execute Trade
                        </Button>
                      </div>
                    </div>
                    
                    {/* Risk Details */}
                    {opp.riskFactors.length > 0 && (<div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Risk factors:</span> {opp.riskFactors.join(', ')}
                        </div>
                      </div>)}
                  </div>))}
              </div>)}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Last updated: {new Date(botStatus.lastUpdate).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>);
}
