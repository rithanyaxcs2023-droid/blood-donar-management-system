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
    console.log("HemoFlow: Interface initialized.");
  } catch (err) {
    console.error("Critical rendering error:", err);
    container.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; color: #ef4444; background: white; border-radius: 20px; margin: 20px; border: 2px solid #fee2e2; max-width: 600px; margin-inline: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <h1 style="font-weight: 900; letter-spacing: -0.05em; margin-bottom: 0.5rem;">Rendering Failure</h1>
        <p style="color: #64748b; margin-bottom: 1.5rem;">The application crashed during initialization. This is likely a version mismatch in the library imports.</p>
        <pre style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; overflow: auto; font-size: 12px; color: #b91c1c; border: 1px solid #e2e8f0;">${err instanceof Error ? err.stack || err.message : String(err)}</pre>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button onclick="window.location.reload(true)" style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">Force Reload</button>
        </div>
      </div>
    `;
  }
}