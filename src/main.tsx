import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/* Si algo falla durante el renderizado, mostramos un aviso en lugar de una pantalla en blanco. */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f1f2ec",
            color: "#1a201d",
            fontFamily: "Georgia, serif",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Trebuchet MS', sans-serif",
                fontWeight: 800,
                fontSize: "1.4rem",
                margin: "0 0 .5rem",
              }}
            >
              Algo se atascó en la imprenta
            </p>
            <p style={{ fontSize: ".95rem", lineHeight: 1.6, color: "#57615b" }}>
              La aplicación no pudo dibujarse. Detalle técnico:{" "}
              <code style={{ fontSize: ".8rem" }}>{String(this.state.error.message || this.state.error)}</code>
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1rem",
                border: "none",
                borderRadius: 999,
                background: "#0d6f53",
                color: "#e9efe8",
                padding: ".65rem 1.4rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recargar la página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
