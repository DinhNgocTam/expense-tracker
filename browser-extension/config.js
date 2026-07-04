/**
 * X Media Collector - Configuration
 *
 * Default: Production (https://lich-su-chi-tien.vercel.app)
 *
 * For local development, change APP_BASE_URL to:
 *   "http://localhost:3000"
 *
 * After changing, reload the extension at chrome://extensions.
 */

globalThis.X_MEDIA_CONFIG = Object.freeze({
  APP_BASE_URL: "https://lich-su-chi-tien.vercel.app",
  API_SESSION: "/api/x-media/extension/session",
  API_CONNECT: "/api/x-media/extension/connect",
  API_TOKEN: "/api/x-media/extension/token",
  API_IMPORT: "/api/x-media/extension/import",
  CONNECT_PAGE: "/x-media/extension-connect",
  GALLERY_PAGE: "/x-media",
  STORAGE_KEYS: Object.freeze({
    LAST_RESULT: "xMediaCollector:lastResult",
    EXTENSION_TOKEN: "xMediaCollector:extensionToken",
    AUTH_EMAIL: "xMediaCollector:authEmail"
  })
});
