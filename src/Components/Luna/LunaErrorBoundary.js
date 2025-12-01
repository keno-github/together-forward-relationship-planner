import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

/**
 * LunaErrorBoundary
 *
 * FAANG-level error boundary for Luna components.
 * Catches JavaScript errors anywhere in the Luna component tree,
 * logs them, and displays a fallback UI instead of crashing.
 *
 * Features:
 * - Catches render errors, lifecycle errors, and errors in constructors
 * - Provides user-friendly error message
 * - Retry/reload functionality
 * - Error logging for debugging
 * - Graceful degradation
 */
class LunaErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (could send to error tracking service)
    console.error('🚨 Luna Error Boundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // In production, you could send to error tracking service:
    // sendToErrorTracking({ error, errorInfo, component: 'Luna' });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const { maxRetries = 3 } = this.props;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
    }
  };

  handleReload = () => {
    // Full page reload as last resort
    window.location.reload();
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, maxRetries = 3, variant = 'panel' } = this.props;

    if (hasError) {
      // Compact variant for embedded components
      if (variant === 'compact') {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Luna encountered an issue</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {retryCount < maxRetries ? 'Click retry to try again' : 'Please refresh the page'}
                </p>
              </div>
              {retryCount < maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              ) : (
                <button
                  onClick={this.handleReload}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
        );
      }

      // Full panel variant for floating Luna
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 min-h-[300px]">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Luna needs a moment
          </h3>

          <p className="text-sm text-red-600 text-center mb-6 max-w-xs">
            {error?.message || 'Something unexpected happened. Luna will be back shortly.'}
          </p>

          <div className="flex gap-3">
            {retryCount < maxRetries ? (
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again ({maxRetries - retryCount} left)
              </button>
            ) : (
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            )}
          </div>

          {/* Debug info (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 w-full max-w-md">
              <summary className="text-xs text-red-400 cursor-pointer hover:text-red-500">
                Technical details (dev only)
              </summary>
              <pre className="mt-2 p-3 bg-red-900/10 rounded-lg text-xs text-red-700 overflow-auto max-h-32">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default LunaErrorBoundary;
