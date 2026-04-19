// CODEMAP: FRONTEND_ENTRY
// PURPOSE: Bootstrap React and load global app wrappers.
// FLOW: main.jsx -> App.jsx -> AppRoutes.jsx -> pages.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
