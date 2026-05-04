// Sentry must initialize before App is loaded so it captures errors during render.
import { Sentry } from "./sentry";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={({ error }) => (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          fontFamily: "Inter, system-ui, sans-serif",
          background: "#F5EFE2",
          color: "#2A2520",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 28, marginBottom: 12 }}>
            Something went sideways.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5C5346" }}>
            We've been notified and we're looking into it. Please refresh the page to try again.
          </p>
          {import.meta.env.MODE !== "production" && (
            <pre style={{ marginTop: 16, fontSize: 12, color: "#A14A3A", whiteSpace: "pre-wrap" }}>
              {String(error)}
            </pre>
          )}
        </div>
      </div>
    )}
  >
    <App />
  </Sentry.ErrorBoundary>,
);
