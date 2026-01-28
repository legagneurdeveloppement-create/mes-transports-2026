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
  console.error(info, error);
  return false;
};

// Manual SW registration removed in favor of vite-plugin-pwa auto-update
// The plugin will inject the necessary registration script
