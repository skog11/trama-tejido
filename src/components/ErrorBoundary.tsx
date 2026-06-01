import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted local storage and reload
    localStorage.removeItem("trama_projects");
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-heritage-cream)] text-[var(--color-heritage-charcoal)] flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-8 border-t-8 border-[var(--color-heritage-red)] shadow-2xl rounded-md">
            <h1 className="text-3xl font-serif font-bold text-[var(--color-heritage-red)] mb-4">
              ¡Ups! Se nos cayeron los puntos.
            </h1>
            <p className="text-sm font-sans mb-6 text-[var(--color-heritage-steel)]">
              Ocurrió un error inesperado. Si el problema persiste, puede deberse a datos guardados incompatibles en tu navegador.
            </p>
            <div className="bg-gray-100 p-4 rounded mb-6 font-mono text-xs overflow-auto text-red-900 border border-red-200">
              {this.state.error?.message}
            </div>
            <Button onClick={this.handleReset} className="w-full bg-[var(--color-heritage-charcoal)] text-white hover:bg-[var(--color-heritage-red)]">
              Limpiar Datos y Reiniciar App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
