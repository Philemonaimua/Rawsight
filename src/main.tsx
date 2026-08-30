import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App.tsx';
import './index.css';

// 1. Node Buffer Polyfill & Global Availability for Solana Web3 & EVM Transactions
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  if (!(window as any).global) {
    (window as any).global = new Proxy(window, {
      set(target, prop, value) {
        try {
          (target as any)[prop] = value;
        } catch {
          // Ignore read-only browser property assignments like fetch
        }
        return true;
      },
      get(target, prop) {
        if (prop === 'global') return (window as any).global;
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }
    });
  }
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }

  // 2. Graceful Interception for WebSocket Errors (Solana Web3 Public RPC & Vite HMR)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstArg = args[0];
    const msg = typeof firstArg === 'string' ? firstArg : (firstArg?.message || String(firstArg || ''));
    if (
      msg.includes('ws error') ||
      msg.includes('WebSocket') ||
      msg.includes('failed to connect to websocket') ||
      (args.length >= 2 && String(args[0]).includes('ws error'))
    ) {
      // Benign public RPC WebSocket drop / HMR notice - keep terminal clean
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    const msg = event?.message || String(event?.error || '');
    if (
      msg.includes('ws error') ||
      msg.includes('WebSocket') ||
      msg.includes('failed to connect to websocket')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('ws error') ||
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

