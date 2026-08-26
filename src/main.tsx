import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MultiChainWalletProvider } from './components/WalletProviders.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MultiChainWalletProvider>
      <App />
    </MultiChainWalletProvider>
  </StrictMode>,
);
