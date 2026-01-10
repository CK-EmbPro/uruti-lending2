'use client';

import React, { Component, ReactNode } from 'react';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="error" title="Something went wrong">
              <div className="space-y-4">
                <p>
                  {this.state.error?.message ||
                    'An unexpected error occurred. Please try refreshing the page.'}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = '/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

