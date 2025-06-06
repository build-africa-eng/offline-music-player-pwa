import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something Went Wrong</h2>
            <p className="mb-4">We encountered an error: {this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-secondary text-white py-2 px-4 rounded-lg transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;