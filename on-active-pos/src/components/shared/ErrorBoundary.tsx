import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught POS Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--pos-bg)] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111111] p-8 rounded-[var(--pos-radius-lg)] border border-[var(--pos-border)] shadow-2xl text-center">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Terminal Error</h1>
            <p className="text-[10px] uppercase tracking-widest text-[var(--pos-text-secondary)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button 
              variant="primary" 
              className="w-full flex items-center justify-center space-x-2"
              onClick={() => window.location.href = '/'}
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reload Terminal</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
