import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (!container) {
  console.error("FATAL: #root element not found in DOM");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Critical rendering error:", err);
    container.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; color: #ef4444;">
        <h1 style="font-weight: 900;">Startup Error</h1>
        <p>The application failed to start. Please check the console for details.</p>
        <pre style="background: #fee2e2; padding: 1rem; border-radius: 0.5rem; overflow: auto;">${err instanceof Error ? err.message : String(err)}</pre>
      </div>
    `;
  }
}