/**
 * X Media Collector - Configuration
 *
 * For local development:
 *   APP_BASE_URL: "http://localhost:3000"
 *
 * For production:
 *   APP_BASE_URL: "https://lich-su-chi-tien.vercel.app"
 *
 * Change this value before loading the extension.
 * After changing, reload the extension at chrome://extensions.
 */

const X_MEDIA_CONFIG = {
  APP_BASE_URL: "http://localhost:3000",
  API_SESSION: "/api/x-media/extension/session",
  API_CONNECT: "/api/x-media/extension/connect",
  API_TOKEN: "/api/x-media/extension/token",
  API_IMPORT: "/api/x-media/extension/import",
  STORAGE_KEYS: {
    LAST_RESULT: "xMediaCollector:lastResult",
    EXTENSION_TOKEN: "xMediaCollector:extensionToken",
    AUTH_EMAIL: "xMediaCollector:authEmail"
  }
};
