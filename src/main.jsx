import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import AppBootstrapGuard from '@/components/layout/AppBootstrapGuard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppBootstrapGuard>
        <App />
      </AppBootstrapGuard>
    </BrowserRouter>
  </React.StrictMode>
);
