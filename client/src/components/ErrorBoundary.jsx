// CODEMAP: FRONTEND_COMPONENTS_ERRORBOUNDARY_JSX
// WHAT_THIS_IS: This file supports frontend behavior for ErrorBoundary.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/ErrorBoundary.jsx
// - Search text: ErrorBoundary.jsx
import React from 'react';

// This catches page errors so the app can show a helpful message.
class ErrorBoundary extends React.Component {
  // This sets up the starting state for this component.
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // This records details when part of the page crashes.
  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for the dev server
    console.error('ErrorBoundary caught:', error, info);
  }

  // This decides what this component should show on the page.
  render() {
    const { hasError, error, info } = this.state;
    const isDevelopment = import.meta.env.DEV;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
          <div className="card max-w-3xl w-full p-6">
            <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">An error occurred</h1>
            <p className="text-sm text-gray-700 dark:text-slate-300">
              Something went wrong while loading this page. Please refresh and try again.
            </p>
            {isDevelopment && (
              <pre className="mt-4 text-sm text-gray-800 dark:text-slate-300 whitespace-pre-wrap break-words">
                {String(error && (error.stack || error.message || error))}
              </pre>
            )}
            {isDevelopment && info && info.componentStack && (
              <details className="mt-4 text-xs text-gray-500 dark:text-slate-400">
                <summary>Component stack</summary>
                <pre className="whitespace-pre-wrap">{info.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

