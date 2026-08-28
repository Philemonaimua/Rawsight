import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import './index.css';
import { MultiChainWalletProvider } from './components/WalletProviders.tsx';

// 1. Node Buffer Polyfill & Global Availability for Solana Web3 & EVM Transactions
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }

  // 2. Graceful Reconnection Handling for Vite HMR WebSockets & Uncaught Network Interruptions
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('vite') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ECONNREFUSED')
    ) {
      // Prevent unhandled promise rejection popups in console for temporary background websocket drops
      event.preventDefault();
    }
  });
}

// Initialize Vercel Analytics
inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MultiChainWalletProvider>
      <App />
    </MultiChainWalletProvider>
  </StrictMode>,
);

