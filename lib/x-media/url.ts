import { X_HOSTNAMES, type XHostname } from "./types";
import { STATUS_PATH_REGEX } from "./validators";

export function extractPostId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(STATUS_PATH_REGEX);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeXUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (!X_HOSTNAMES.includes(parsed.hostname as XHostname)) {
      return null;
    }

    let normalizedHostname = parsed.hostname;
    normalizedHostname = normalizedHostname.replace(/^twitter\.com$/i, "x.com");
    normalizedHostname = normalizedHostname.replace(/^www\.twitter\.com$/i, "www.x.com");
    normalizedHostname = normalizedHostname.replace(/^www\.x\.com$/i, "x.com");

    const match = parsed.pathname.match(STATUS_PATH_REGEX);
    if (!match) {
      return null;
    }

    const postId = match[1];

    parsed.hostname = normalizedHostname;
    parsed.pathname = `/${parsed.pathname.split("/")[1]}/status/${postId}`;
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return null;
  }
}

export function getMediaDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}
