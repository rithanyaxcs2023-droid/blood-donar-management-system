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
    console.log("HemoFlow: Root mounted successfully.");
  } catch (err) {
    console.error("Critical rendering error:", err);
    container.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; color: #ef4444; background: white; border-radius: 20px; margin: 20px; border: 2px solid #fee2e2;">
        <h1 style="font-weight: 900; letter-spacing: -0.05em;">Startup Failure</h1>
        <p>The application failed to render. This is usually due to a version mismatch in the browser cache.</p>
        <pre style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; overflow: auto; font-size: 12px; color: #64748b; border: 1px solid #e2e8f0;">${err instanceof Error ? err.stack || err.message : String(err)}</pre>
        <button onclick="window.location.reload(true)" style="margin-top: 20px; padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Force Reload App</button>
      </div>
    `;
  }
}