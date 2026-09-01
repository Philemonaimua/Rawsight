import React, { useState } from 'react';
import { 
  Terminal, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Filter,
  Trash2,
  Download,
  FileSpreadsheet,
  Radio
} from 'lucide-react';
import { TradeLog, LogType } from '../types';
import { CHAINS_CONFIG } from '../data/mockTokens';
import { getBlockExplorerTxUrl } from '../lib/web3Service';

interface LiveTradeFeedProps {
  logs: TradeLog[];
  onClearLogs?: () => void;
}

export const LiveTradeFeed: React.FC<LiveTradeFeedProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TP') return log.type === 'SELL_TAKE_PROFIT';
    if (filterType === 'RUG') return log.type === 'SELL_RUG_SHIELD' || log.type === 'SELL_INSIDER_ALERT';
    if (filterType === 'BUYS') return log.type === 'BUY_SNIPE';
    return true;
  });

  const handleDownloadCsv = () => {
    if (logs.length === 0) {
      alert('No trade logs recorded to export.');
      return;
    }

    setIsExporting(true);

    try {
      // Calculate session totals for accounting
      const totalRealizedPnl = logs.reduce((acc, l) => acc + (l.pnlUsd || 0), 0);
      const profitableTrades = logs.filter(l => (l.pnlUsd || 0) > 0).length;
      const lossTrades = logs.filter(l => (l.pnlUsd || 0) < 0).length;
      const totalVolumeUsd = logs.reduce((acc, l) => acc + (l.amountUsd || 0), 0);

      // Construct standard CSV header and rows compliant with tax reporting tools (CoinTracker, Koinly, TurboTax)
      const headers = [
        'Timestamp (UTC)',
        'Local Date Time',
        'Transaction ID',
        'Type',
        'Token Symbol',
        'Token Name',
        'Blockchain Network',
        'Trade Volume (USD)',
        'Realized PnL (USD)',
        'Return (%)',
        'Transaction Hash',
        'Explorer Receipt URL',
        'Execution Note'
      ];

      const escapeCsv = (str: string | number | undefined | null) => {
        if (str === undefined || str === null) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const rows = logs.map(log => {
        const d = new Date(log.timestamp);
        const iso = d.toISOString();
        const local = d.toLocaleString();
        const chainName = CHAINS_CONFIG[log.chain]?.name || log.chain;
        const txUrl = log.txHash ? getBlockExplorerTxUrl(log.chain, log.txHash) : '';

        return [
          escapeCsv(iso),
          escapeCsv(local),
          escapeCsv(log.id),
          escapeCsv(log.type),
          escapeCsv(log.tokenSymbol),
          escapeCsv(log.tokenName || log.tokenSymbol),
          escapeCsv(chainName),
          escapeCsv(log.amountUsd ? log.amountUsd.toFixed(2) : '0.00'),
          escapeCsv(log.pnlUsd !== undefined ? log.pnlUsd.toFixed(2) : '0.00'),
          escapeCsv(log.pnlPercent !== undefined ? `${log.pnlPercent.toFixed(2)}%` : '0.00%'),
          escapeCsv(log.txHash || ''),
          escapeCsv(txUrl),
          escapeCsv(log.note)
        ].join(',');
      });

      // Summary Header Block
      const summaryHeader = [
        `# RAWSIGHT AUTONOMOUS VAULT - TRADE AUDIT & TAX LOG`,
        `# Generated At (UTC): ${new Date().toISOString()}`,
        `# Total Realized PnL (USD): $${totalRealizedPnl.toFixed(2)}`,
        `# Total Gross Volume (USD): $${totalVolumeUsd.toFixed(2)}`,
        `# Total Logged Events: ${logs.length}`,
        `# Winning Trades: ${profitableTrades} | Loss Trades: ${lossTrades}`,
        ``
      ].join('\n');

      // Summary Footer Row
      const summaryFooter = [
        `"TOTAL SUMMARY"`,
        `"${new Date().toLocaleString()}"`,
        `"ALL_SESSION_EVENTS"`,
        `"AGGREGATE"`,
        `"ALL"`,
        `"ALL"`,
        `"MULTI-CHAIN"`,
        `"${totalVolumeUsd.toFixed(2)}"`,
        `"${totalRealizedPnl.toFixed(2)}"`,
        `"${logs.length > 0 ? ((profitableTrades / logs.length) * 100).toFixed(1) + '%' : '0%'}"`,
        `"SESSION_AGGREGATE"`,
        `""`,
        `"Verified on-chain Rawsight execution logs for tax and accounting compliance."`
      ].join(',');

      const csvContent = `${summaryHeader}\n${headers.join(',')}\n${rows.join('\n')}\n${summaryFooter}`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `rawsight_trade_logs_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV logs:', err);
      alert('Error generating CSV export file.');
    } finally {
      setIsExporting(false);
    }
  };

  const getLogBadge = (type: LogType) => {
    switch (type) {
      case 'SELL_TAKE_PROFIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/40">
            <TrendingUp className="w-3 h-3 text-[#D9F99D]" />
            TAKE PROFIT HIT
          </span>
        );
      case 'SELL_RUG_SHIELD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            RUG SHIELD DUMP
          </span>
        );
      case 'SELL_INSIDER_ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            INSIDER CLUSTER EXIT
          </span>
        );
      case 'BUY_SNIPE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#D9F99D]/10 text-[#D9F99D] border border-[#D9F99D]/30">
            <Zap className="w-3 h-3 text-[#D9F99D]" />
            AUTO SNIPED
          </span>
        );
      case 'DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#D9F99D]/15 text-[#D9F99D] border border-[#D9F99D]/30">
            <CheckCircle2 className="w-3 h-3 text-[#D9F99D]" />
            VAULT DEPOSIT
          </span>
        );
      case 'DISCOVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-950/60 text-blue-300 border border-blue-500/40">
            <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
            TOKEN DISCOVERED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800">
            EVENT
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-xl p-4 sm:p-5 mb-6 font-mono shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#D9F99D]/10 border border-[#D9F99D]/30 text-[#D9F99D] shrink-0">
            <Terminal className="w-4 h-4 text-[#D9F99D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                TRANSACTION RECEIPT LOGS & AUDIT TRAIL
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#D9F99D] animate-ping" />
            </div>
            <p className="text-xs text-zinc-400">
              Live immutable stream of algorithmic snipes, take-profit settlements, and emergency liquidity defenses.
            </p>
          </div>
        </div>

        {/* Filter Pills & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-lg border border-white/10 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                filterType === 'ALL' 
                  ? 'bg-[#D9F99D] text-black shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilterType('TP')}
              className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                filterType === 'TP' 
                  ? 'bg-[#D9F99D] text-black' 
                  : 'text-zinc-400 hover:text-[#D9F99D]'
              }`}
            >
              Take Profits
            </button>
            <button
              onClick={() => setFilterType('RUG')}
              className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                filterType === 'RUG' 
                  ? 'bg-amber-400 text-black' 
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              Shield Dodges
            </button>
            <button
              onClick={() => setFilterType('BUYS')}
              className={`px-3 py-1.5 min-h-[44px] rounded-md uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer ${
                filterType === 'BUYS' 
                  ? 'bg-[#D9F99D] text-black' 
                  : 'text-zinc-400 hover:text-[#D9F99D]'
              }`}
            >
              Snipes
            </button>
          </div>

          {/* Download CSV for Accounting & Taxes */}
          <button
            onClick={handleDownloadCsv}
            disabled={isExporting || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg bg-[#D9F99D]/15 border border-[#D9F99D]/40 text-[#D9F99D] hover:bg-[#D9F99D] hover:text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            title="Download CSV for tax and accounting compliance"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Execution Log List */}
      <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No execution events recorded in this filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const chainConfig = CHAINS_CONFIG[log.chain] || CHAINS_CONFIG['solana'];
            const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const txUrl = log.txHash ? getBlockExplorerTxUrl(log.chain, log.txHash) : null;

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-lg bg-[#050505] border border-white/10 hover:border-[#D9F99D]/40 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeFormatted}
                    </span>
                    {getLogBadge(log.type)}
                    <span className="font-black text-white">
                      {log.tokenSymbol}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-[#D9F99D]/30 bg-[#D9F99D]/10 text-[#D9F99D]">
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

                {/* Event Details & Explorer Transaction Receipt Link */}
                <div className="mt-2 text-zinc-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/5">
                  <p className="text-zinc-300 text-[11px] sm:text-xs">
                    {log.note}
                  </p>
                  
                    {log.txHash && (
                    <a
                      href={txUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#D9F99D] hover:underline shrink-0 min-h-[32px]"
                      title="View Transaction on Explorer"
                    >
                      <span className="font-mono">{log.txHash.slice(0, 10)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

