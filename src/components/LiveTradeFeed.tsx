import React, { useState } from 'react';
import { 
  Terminal, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { TradeLog, LogType } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';

interface LiveTradeFeedProps {
  logs: TradeLog[];
  onClearLogs?: () => void;
}

export const LiveTradeFeed: React.FC<LiveTradeFeedProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TP') return log.type === 'SELL_TAKE_PROFIT';
    if (filterType === 'RUG') return log.type === 'SELL_RUG_SHIELD' || log.type === 'SELL_INSIDER_ALERT';
    if (filterType === 'BUYS') return log.type === 'BUY_SNIPE';
    return true;
  });

  const getLogBadge = (type: LogType) => {
    switch (type) {
      case 'SELL_TAKE_PROFIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/40">
            <TrendingUp className="w-3 h-3 text-[#D9F99D]" />
            TAKE PROFIT HIT
          </span>
        );
      case 'SELL_RUG_SHIELD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/40">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            RUG SHIELD DUMP
          </span>
        );
      case 'SELL_INSIDER_ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            INSIDER CLUSTER EXIT
          </span>
        );
      case 'BUY_SNIPE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-[#0A0A0A] text-[#D9F99D] border border-[#D9F99D]/30">
            <Zap className="w-3 h-3 text-[#D9F99D]" />
            AUTO SNIPED
          </span>
        );
      case 'DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
            <CheckCircle2 className="w-3 h-3 text-[#D9F99D]" />
            VAULT DEPOSIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800">
            EVENT
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-5 mb-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D]">
            <Terminal className="w-4 h-4 text-[#D9F99D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Continuous Autonomous Trade Execution Feed
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-ping" />
            </div>
            <p className="text-xs text-zinc-400">
              Live immutable stream of algorithmic snipes, take-profit settlements, and emergency liquidity defenses.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#050505] p-1 rounded-md border border-white/10 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors ${
              filterType === 'ALL' 
                ? 'bg-[#D9F99D] text-black shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterType('TP')}
            className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors ${
              filterType === 'TP' 
                ? 'bg-[#D9F99D] text-black' 
                : 'text-zinc-400 hover:text-[#D9F99D]'
            }`}
          >
            Take Profits
          </button>
          <button
            onClick={() => setFilterType('RUG')}
            className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors ${
              filterType === 'RUG' 
                ? 'bg-amber-400 text-black' 
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Shield Dodges
          </button>
          <button
            onClick={() => setFilterType('BUYS')}
            className={`px-3 py-1 rounded-sm uppercase tracking-wider text-[11px] font-bold transition-colors ${
              filterType === 'BUYS' 
                ? 'bg-[#D9F99D] text-black' 
                : 'text-zinc-400 hover:text-[#D9F99D]'
            }`}
          >
            Snipes
          </button>
        </div>
      </div>

      {/* Execution Log List */}
      <div className="space-y-2 mt-4 max-h-[380px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No execution events recorded in this filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const chainConfig = CHAINS_CONFIG[log.chain];
            const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-[#050505] border border-[#D9F99D]/20 hover:border-[#D9F99D]/40 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeFormatted}
                    </span>
                    {getLogBadge(log.type)}
                    <span className="font-bold text-white">
                      {log.tokenSymbol}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-sm text-[9px] uppercase tracking-wider border border-[#D9F99D]/30 bg-[#D9F99D]/10 text-[#D9F99D]">
                      {chainConfig.name}
                    </span>
                  </div>

                  {log.pnlUsd !== undefined && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`font-bold ${
                        log.pnlUsd >= 0 ? 'text-[#D9F99D]' : 'text-amber-400'
                      }`}>
                        {log.pnlUsd >= 0 ? '+' : ''}${log.pnlUsd.toFixed(2)} USD
                      </span>
                      {log.pnlPercent !== undefined && (
                        <span className={`text-[11px] ${
                          log.pnlPercent >= 0 ? 'text-[#D9F99D]' : 'text-amber-400'
                        }`}>
                          ({log.pnlPercent >= 0 ? '+' : ''}{log.pnlPercent.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Event Details / Explanation */}
                <div className="mt-1.5 text-zinc-300 text-xs flex items-start justify-between gap-2">
                  <p className="text-zinc-300 text-[11px] sm:text-xs">
                    {log.note}
                  </p>
                  <span className="text-[10px] text-zinc-600 truncate shrink-0 max-w-[120px]">
                    tx: {log.txHash}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
