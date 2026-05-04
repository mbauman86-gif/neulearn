import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
}

export { Sentry };
