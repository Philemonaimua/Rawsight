import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Rawsight Component Error Boundary Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-zinc-100 my-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {this.props.fallbackTitle || 'Component Render Interrupted'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
            {this.state.error?.message || 'A network RPC disconnect or event payload error occurred. The terminal state has been safely isolated.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors border border-zinc-700 cursor-pointer min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-lime-400" />
            Recover Component State
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
