import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip anything that looks like a child username, PIN, or session token from
      // breadcrumbs and request data. Defense-in-depth — Sentry should never see PII.
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
}
