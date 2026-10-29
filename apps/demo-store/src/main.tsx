import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Dynamically load CartX widget pointing to configured API backend
const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';
if (!document.querySelector('script[data-cartx-script]')) {
  const script = document.createElement('script');
  script.src = `${apiBase}/cartx.js`;
  script.setAttribute('data-store', 'store_aura');
  script.setAttribute('data-api', apiBase);
  script.setAttribute('data-cartx-script', 'true');
  script.async = true;
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
