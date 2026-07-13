'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#e9edf1] p-8">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 shadow-lg">
            <h1 className="mb-2 text-xl font-bold text-red-700">Something went wrong</h1>
            <p className="mb-4 text-sm text-gray-600">
              An unexpected error occurred. You can try to recover or reload the page.
            </p>
            <p className="mb-6 rounded bg-gray-50 p-3 font-mono text-xs text-red-600 break-all">
              {this.state.error.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.reset}
                className="rounded bg-[#5b8ab8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a738f]"
              >
                Try to recover
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
