/**
 * Sentry server-side wrapper. Tolerates @sentry/node not being installed yet.
 *
 * If @sentry/node is present and SENTRY_DSN is set, real Sentry initializes.
 * If the package isn't installed (e.g. Replit sandbox blocks `npm install`),
 * exports a no-op Sentry shim that satisfies the API surface we use, so the
 * server starts cleanly and we add real observability later.
 *
 * Import sites should ALWAYS import from this file — never `@sentry/node`
 * directly — so the conditional load works.
 */

type SentryShape = {
  init?: (opts: any) => void;
  setupExpressErrorHandler?: (app: any) => void;
  captureException?: (err: unknown) => void;
  // ...add new methods here as we use them.
};

let SentryModule: SentryShape;

try {
  // Use createRequire so this works in ESM and tolerates the package being absent.
  // @sentry/node ships ESM in v8+; if it's missing the require throws and we fall
  // through to the noop shim.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SentryModule = require("@sentry/node");

  if (process.env.SENTRY_DSN && SentryModule.init) {
    SentryModule.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
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
} catch {
  // Package not installed. Use a noop shim so callers don't crash.
  SentryModule = {
    init: () => undefined,
    setupExpressErrorHandler: () => undefined,
    captureException: () => undefined,
  };
}

export const Sentry = SentryModule;
