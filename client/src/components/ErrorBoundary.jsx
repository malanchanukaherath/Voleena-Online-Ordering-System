import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for the dev server
  console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    const { hasError, error, info } = this.state;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-3xl w-full bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4 text-red-600">An error occurred</h1>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">{String(error && (error.stack || error.message || error))}</pre>
            {info && info.componentStack && (
              <details className="mt-4 text-xs text-gray-600">
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
