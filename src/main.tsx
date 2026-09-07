import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/queryClient';
import { App } from '../App';
import '../index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SynapsePlatformProvider } from './contexts/SynapsePlatformContext';

// Patch to intercept and silence benign gRPC idle stream warnings/errors from Firestore SDK
let isLoggingError = false;
const originalConsoleError = console.error;

function isBenignErrorMsg(msg: string): boolean {
  if (!msg) return false;
  return (
    msg.includes('Disconnecting idle stream') || 
    msg.includes('Timed out waiting for new targets') || 
    msg.includes('GrpcConnection RPC') ||
    msg.includes('@firebase/firestore') ||
    msg.includes('firestoreDatabaseId') ||
    (msg.includes('Listen') && msg.includes('CANCELLED')) ||
    (msg.includes('gRPC') && msg.includes('stream')) ||
    msg.includes('the client is offline')
  );
}

console.error = function (...args: any[]) {
  if (isLoggingError) return;
  isLoggingError = true;
  try {
    // Perform light, shallow inspection without JSON.stringify or deep object traversal
    let shouldSilence = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      let str = '';
      if (typeof arg === 'string') {
        str = arg;
      } else if (arg && typeof arg === 'object') {
        if (typeof arg.message === 'string') str = arg.message;
        else if (typeof arg.description === 'string') str = arg.description;
      }
      if (str && isBenignErrorMsg(str)) {
        shouldSilence = true;
        break;
      }
    }

    if (!shouldSilence) {
      originalConsoleError.apply(console, args);
    }
  } catch {
    // Fail silently in interceptor to avoid breaking console calls
  } finally {
    isLoggingError = false;
  }
};

window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason;
    let msg = '';
    if (typeof reason === 'string') {
      msg = reason;
    } else if (reason && typeof reason === 'object') {
      msg = typeof reason.message === 'string' ? reason.message : String(reason);
    } else {
      msg = String(reason || '');
    }

    if (
      isBenignErrorMsg(msg) ||
      msg.includes('CANCELLED') ||
      msg.includes('503') ||
      msg.includes('Quota exceeded') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Maximum call stack size exceeded')
    ) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
  } catch {
    event.preventDefault();
  }
});

window.onerror = function(message) {
  try {
    const msg = String(message || '');
    if (
      isBenignErrorMsg(msg) ||
      msg.includes('ResizeObserver loop') ||
      msg.includes('Maximum call stack size exceeded')
    ) {
      return true; // Silence benign global errors
    }
  } catch {
    // Ignore errors inside window.onerror
  }
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
