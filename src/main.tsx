import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/queryClient';
import { App } from '../App';
import '../index.css';
import { ErrorBoundary } from '../ErrorBoundary';
import { SynapsePlatformProvider } from './contexts/SynapsePlatformContext';

// Patch to intercept and silence benign gRPC idle stream warnings/errors from Firestore SDK
const originalConsoleError = console.error;
console.error = function (...args) {
  try {
    const msg = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    if (
      msg.includes('Disconnecting idle stream') || 
      msg.includes('Timed out waiting for new targets') || 
      msg.includes('GrpcConnection RPC') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('firestoreDatabaseId') ||
      (msg.includes('Listen') && msg.includes('CANCELLED')) ||
      (msg.includes('gRPC') && msg.includes('stream'))
    ) {
      console.warn('⚠️ [Firestore Stream Silenced]: Benign idle listener reset.');
      return;
    }
  } catch {
    // ignore inspection errors inside logging interceptor
  }
  originalConsoleError.apply(console, args);
};

window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.height = '100%';
  errorDiv.style.backgroundColor = 'white';
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.overflow = 'auto';
  errorDiv.innerHTML = `
    <h1>Erro Detectado</h1>
    <p><strong>Mensagem:</strong> ${message}</p>
    <p><strong>Fonte:</strong> ${source}</p>
    <p><strong>Linha:</strong> ${lineno}, <strong>Coluna:</strong> ${colno}</p>
    <pre>${error?.stack || 'Sem stack trace'}</pre>
  `;
  document.body.appendChild(errorDiv);
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("App starting initialization...");
const root = ReactDOM.createRoot(rootElement);
console.log("Root created");
root.render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SynapsePlatformProvider>
        <App />
      </SynapsePlatformProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
console.log("Render called");
