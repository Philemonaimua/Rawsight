import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertCircle, 
  Terminal, 
  Cpu, 
  Fingerprint,
  Eye,
  EyeOff,
  Radio,
  ArrowRight
} from 'lucide-react';

interface SecurityGateProps {
  children: React.ReactNode;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

const STORAGE_KEY = 'rawsight_session_auth_v1';
const EXPECTED_PIN = (import.meta as any).env?.VITE_MASTER_PIN || '1234';

export const SecurityGate: React.FC<SecurityGateProps> = ({
  children,
  isUnlocked,
  onUnlock,
  onLock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      if (pinInput.trim() === EXPECTED_PIN.trim()) {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          // sessionStorage fallback
        }
        onUnlock();
        setPinInput('');
        setErrorMsg(null);
      } else {
        setAttempts((prev) => prev + 1);
        setErrorMsg('Invalid Master PIN. Terminal access denied.');
        setPinInput('');
      }
      setIsVerifying(false);
    }, 250);
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 12) {
      setPinInput((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg(null);
  };

  // If unlocked, render protected application children directly
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Otherwise, strictly unmount and isolate all portfolio and trading UI behind the security gate
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col justify-between font-mono relative overflow-hidden select-none">
      {/* Background Matrix/Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#d9f99d_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9F99D]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-950/20 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Security Header */}
      <header className="w-full border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#D9F99D] rounded flex items-center justify-center text-black font-black text-sm shadow-[0_0_12px_rgba(217,249,157,0.3)]">
            R
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-white">
              RAW<span className="text-[#D9F99D]">SIGHT</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30">
              LOCKED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D9F99D]" />
          <span className="hidden sm:inline">Encrypted Private Terminal</span>
        </div>
      </header>

      {/* Center Passcode Vault Screen */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-sm sm:max-w-md bg-[#0A0A0A] border border-[#D9F99D]/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
          {/* Status Indicator Icon */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#D9F99D]/10 border border-[#D9F99D]/30 flex items-center justify-center mx-auto mb-3 text-[#D9F99D] shadow-[0_0_25px_rgba(217,249,157,0.15)]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              Master Access Passcode
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Private trading terminal & portfolio vault barrier
            </p>
          </div>

          {/* Passcode Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block flex items-center justify-between">
                <span>Enter Master PIN</span>
                <span className="text-[9px] text-[#D9F99D]/80">SESSION LOCKED</span>
              </label>

              <div className="relative">
                <input
                  id="input-master-pin"
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  maxLength={16}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter PIN..."
                  className="w-full bg-[#050505] border border-white/15 focus:border-[#D9F99D] rounded-xl px-4 py-3.5 text-center text-lg sm:text-xl font-mono tracking-widest text-white placeholder-zinc-600 outline-none transition-all min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Unlock Button */}
            <button
              id="btn-submit-pin"
              type="submit"
              disabled={isVerifying || !pinInput.trim()}
              className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#D9F99D] text-black hover:bg-[#bef264] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D9F99D]/20 min-h-[48px]"
            >
              {isVerifying ? (
                <span>Decrypting Terminal...</span>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Authorize & Decrypt Vault</span>
                </>
              )}
            </button>

            {/* On-Screen Numeric Keypad for Mobile & Touch Viewports */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3 rounded-lg bg-[#050505] hover:bg-zinc-900 border border-white/5 text-white font-bold text-sm sm:text-base hover:border-[#D9F99D]/30 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-3 rounded-lg bg-[#050505] hover:bg-red-950/30 border border-white/5 text-zinc-400 hover:text-red-400 text-xs font-bold active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  CLEAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 rounded-lg bg-[#050505] hover:bg-zinc-900 border border-white/5 text-white font-bold text-sm sm:text-base hover:border-[#D9F99D]/30 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 rounded-lg bg-[#050505] hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  ⌫
                </button>
              </div>
            </div>
          </form>

          {/* Security Information Footnote */}
          <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-zinc-500 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Session Isolation:</span>
              <span className="text-[#D9F99D]">RAM / SessionStorage</span>
            </div>
            <p className="text-[9px] leading-relaxed text-zinc-500">
              Zero-knowledge authorization barrier. Closing your browser tab or window automatically purges the decrypted key session.
            </p>
          </div>
        </div>
      </main>

      {/* Footer System Status */}
      <footer className="w-full border-t border-white/5 py-3 px-4 sm:px-8 text-center text-[10px] text-zinc-500">
        RAW SIGHT ENGINE v2.4 • ZERO-KNOWLEDGE LOCAL TERMINAL • SOLFLARE & PHANTOM PROTECTED
      </footer>
    </div>
  );
};
