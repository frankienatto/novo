import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, margin: 20 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: 8 }}>Ops! Ocorreu um erro na renderização.</h1>
          <p style={{ fontSize: '14px', marginBottom: 12 }}>{this.state.error?.message || 'Erro desconhecido'}</p>
          <pre style={{ fontSize: '12px', background: '#fff', padding: 12, borderRadius: 4, overflowX: 'auto' }}>{this.state.error?.stack}</pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 12, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
