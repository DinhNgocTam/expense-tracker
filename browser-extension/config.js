/**
 * X Media Collector - Configuration
 *
 * Default: Production (https://lich-su-chi-tien.vercel.app)
 *
 * For local development, uncomment and use:
 *   APP_BASE_URL: "http://localhost:3000"
 *
 * After changing, reload the extension at chrome://extensions.
 */

const X_MEDIA_CONFIG = Object.freeze({
  APP_BASE_URL: "https://lich-su-chi-tien.vercel.app",
  API_SESSION: "/api/x-media/extension/session",
  API_CONNECT: "/api/x-media/extension/connect",
  API_TOKEN: "/api/x-media/extension/token",
  API_IMPORT: "/api/x-media/extension/import",
  STORAGE_KEYS: Object.freeze({
    LAST_RESULT: "xMediaCollector:lastResult",
    EXTENSION_TOKEN: "xMediaCollector:extensionToken",
    AUTH_EMAIL: "xMediaCollector:authEmail"
  })
});
