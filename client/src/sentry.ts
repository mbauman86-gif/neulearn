/**
 * Sentry client-side wrapper. Tolerates @sentry/react not being installed yet.
 *
 * If the package is present and VITE_SENTRY_DSN is set, real Sentry initializes
 * and Sentry.ErrorBoundary is the real React component. Otherwise this exports
 * a passthrough ErrorBoundary that just renders its children, plus noop init.
 *
 * Import sites should ALWAYS import from this file — never `@sentry/react`
 * directly — so the conditional load works in sandboxes that can't run npm install.
 */
import { Component, type ReactNode } from "react";

type SentryReactShape = {
  init?: (opts: any) => void;
  ErrorBoundary?: any;
  browserTracingIntegration?: () => any;
};

let SentryModule: SentryReactShape;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const real = require("@sentry/react");

  if (import.meta.env.VITE_SENTRY_DSN && real.init) {
    real.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
      integrations: real.browserTracingIntegration ? [real.browserTracingIntegration()] : [],
      sendDefaultPii: false,
      beforeSend(event: any) {
        if (event.request?.cookies) delete event.request.cookies;
        if (event.request?.headers) {
          delete event.request.headers["cookie"];
          delete event.request.headers["authorization"];
        }
        return event;
      },
    });
  }

  SentryModule = real;
} catch {
  // Package not installed — provide a passthrough ErrorBoundary that just renders
  // children. Errors will bubble to the React default; we'll wire real Sentry once
  // the package is installed.
  class PassthroughBoundary extends Component<{
    fallback?: ((info: { error: unknown }) => ReactNode) | ReactNode;
    children?: ReactNode;
  }> {
    render() {
      return this.props.children;
    }
  }

  SentryModule = {
    init: () => undefined,
    ErrorBoundary: PassthroughBoundary,
    browserTracingIntegration: () => undefined,
  };
}

export const Sentry = SentryModule;
