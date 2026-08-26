import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface PerformancePoint {
  time: string;
  totalValue: number;
  pnl: number;
}

interface PerformanceChartProps {
  data: PerformancePoint[];
  currentNav: number;
  realizedPnl: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  currentNav,
  realizedPnl,
}) => {
  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 mb-6 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
            <TrendingUp className="w-4 h-4 text-[#D9F99D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Vault Equity Growth & PnL Curve
              </h2>
              <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
                REAL-TIME NAV
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Continuous equity trajectory reflecting take-profit gains and capital preservation defense.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] opacity-40 uppercase tracking-wider block">CURRENT NAV</span>
            <span className="font-bold text-white text-sm">${currentNav.toFixed(2)}</span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-[10px] opacity-40 uppercase tracking-wider block">ALL-TIME PnL</span>
            <span className={`font-bold text-sm ${realizedPnl >= 0 ? 'text-[#D9F99D]' : 'text-red-400'}`}>
              {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bentoNavGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D9F99D" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#D9F99D" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false} 
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={10} 
              tickLine={false} 
              domain={['auto', 'auto']}
              fontFamily="JetBrains Mono"
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as PerformancePoint;
                  return (
                    <div className="bg-[#050505] border border-[#D9F99D]/50 p-2.5 rounded-md shadow-2xl font-mono text-xs">
                      <div className="text-zinc-400 text-[10px] mb-1 uppercase tracking-wider">{item.time}</div>
                      <div className="text-white font-bold">
                        NAV: ${item.totalValue.toFixed(2)} USD
                      </div>
                      <div className={`mt-0.5 font-bold ${item.pnl >= 0 ? 'text-[#D9F99D]' : 'text-amber-400'}`}>
                        PnL: {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#D9F99D"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bentoNavGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
