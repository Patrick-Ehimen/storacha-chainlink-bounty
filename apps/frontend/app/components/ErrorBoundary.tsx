"use client";

import { Component, ErrorInfo, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  label?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", {
      label: this.props.label,
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid var(--border)",
            padding: "1.5rem",
            background: "var(--background-secondary)",
            color: "var(--foreground)",
          }}
        >
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            Something went wrong while loading this section.
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--foreground-secondary)",
              marginBottom: "1rem",
            }}
          >
            Please try again. If the problem persists, check the console for
            more details.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
