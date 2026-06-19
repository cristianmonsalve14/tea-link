import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(_error: unknown, _errorInfo: unknown) {
    // Puedes loguear el error aquí si lo deseas
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red', background: '#fffbe9', borderRadius: 12, margin: 32 }}>
          <h2>Ocurrió un error en el dashboard.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{String(this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: 8, background: '#eee', borderRadius: 6 }}>Recargar página</button>
        </div>
      );
    }
    return this.props.children;
  }
}
