import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { clientConfig } from './clientConfig';

// Initialize dynamic page title & favicon immediately per client tenant
if (typeof document !== 'undefined') {
  const brandName = clientConfig?.brandName || 'Decantre';
  document.title = `Dashboard - ${brandName}`;

  const faviconUrl = clientConfig?.siteIconUrl || clientConfig?.logoUrl;
  if (faviconUrl) {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = faviconUrl;
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
