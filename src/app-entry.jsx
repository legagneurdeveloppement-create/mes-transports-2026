import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Global Error Interceptor for Mobile Debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const info = `Error: ${msg}\nLine: ${lineNo}\nFile: ${url}`;
  alert(info);
  console.error(info, error);
  return false;
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (window.confirm("Nouvelle mise à jour disponible ! Actualiser maintenant ?")) {
              window.location.reload();
            }
          }
        };
      };
    }).catch(err => console.log('SW registration failed: ', err));
  });
}
