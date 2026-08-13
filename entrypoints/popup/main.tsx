import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './lib/ErrorBoundary';
import './style.css';

const fallback = (
  <div className="w-[360px] min-h-[400px] bg-white text-gray-900 font-sans">
    <p className="text-sm text-gray-400 py-8 text-center">Something went wrong.</p>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={fallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
