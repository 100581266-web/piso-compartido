import * as Sentry from "@sentry/nextjs";

// Sin NEXT_PUBLIC_SENTRY_DSN configurado, el SDK simplemente no envía nada
// (no rompe nada en local ni antes de crear la cuenta de Sentry).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
