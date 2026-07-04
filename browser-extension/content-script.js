/**
 * X Media Collector - Content Script
 * Scans the current X/Twitter page for visible image media.
 * Uses DOM-only inspection - no fetch patching or network inspection.
 */

function normalizeImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.hostname !== 'pbs.twimg.com') {
    return null;
  }

  if (!url.pathname.startsWith('/media/')) {
    return null;
  }

  url.searchParams.set('name', 'orig');

  return url.toString();
}

function getPostUrl(article) {
  if (!article) return null;

  const statusLinks = article.querySelectorAll('a[href*="/status/"]');
  let bestHref = null;

  for (const link of statusLinks) {
    const href = link.getAttribute('href');
    if (!href) continue;

    const pathParts = href.split('/').filter(Boolean);
    if (pathParts.length >= 3 && pathParts[pathParts.length - 2] === 'status') {
      const potentialUsername = pathParts[pathParts.length - 3];
      if (potentialUsername && !potentialUsername.includes('?') && !potentialUsername.includes('photo')) {
        bestHref = href.startsWith('http') ? href : `https://x.com${href}`;
        break;
      }
    }
  }

  if (bestHref) return bestHref;

  const currentPage = window.location.href;
  const pagePath = window.location.pathname;
  const pagePathParts = pagePath.split('/').filter(Boolean);

  if (pagePathParts.length >= 3 && pagePathParts[pagePathParts.length - 2] === 'status') {
    const pageUsername = pagePathParts[pagePathParts.length - 3];
    if (pageUsername && !pageUsername.includes('?')) {
      return currentPage.split('?')[0];
    }
  }

  return null;
}

function getPostId(postUrl) {
  if (!postUrl || typeof postUrl !== 'string') return null;

  try {
    const url = new URL(postUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (pathParts[i] === 'status' && pathParts[i + 1]) {
        const potentialId = pathParts[i + 1];
        if (/^\d+$/.test(potentialId)) {
          return potentialId;
        }
      }
    }
  } catch {
  }

  return null;
}

function getAuthorUsername(postUrl) {
  if (!postUrl || typeof postUrl !== 'string') return null;

  try {
    const url = new URL(postUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (pathParts[i] === 'status' && i > 0) {
        const potentialUsername = pathParts[i - 1];
        if (potentialUsername && !potentialUsername.includes('?')) {
          return potentialUsername;
        }
      }
    }
  } catch {
  }

  return null;
}

function getCaption(article) {
  if (!article) return null;

  const tweetTextEl = article.querySelector('[data-testid="tweetText"]');

  if (tweetTextEl) {
    const text = tweetTextEl.textContent?.trim();
    return text || null;
  }

  const allTextEls = article.querySelectorAll('div[lang]');
  for (const el of allTextEls) {
    const text = el.textContent?.trim();
    if (text && text.length > 10) {
      return text;
    }
  }

  return null;
}

function collectVisibleMedia() {
  try {
    const articles = document.querySelectorAll('article');

    if (!articles || articles.length === 0) {
      return {
        success: false,
        error: 'Không tìm thấy bài viết nào trên trang.'
      };
    }

    const seenMedia = new Map();
    const mediaItems = [];
    let mediaIndex = 0;

    articles.forEach((article) => {
      const postUrl = getPostUrl(article);
      const postId = postUrl ? getPostId(postUrl) : null;
      const authorUsername = postUrl ? getAuthorUsername(postUrl) : null;
      const caption = getCaption(article);

      const images = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');

      images.forEach((img) => {
        const rawUrl = img.currentSrc || img.src;

        if (!rawUrl || typeof rawUrl !== 'string') return;
        if (!rawUrl.includes('/media/')) return;

        const profileAvatars = img.closest('[data-testid="avatar"]') ||
                               img.closest('.avatar') ||
                               img.closest('[aria-label*="avatar" i]') ||
                               img.closest('[aria-label*="hồ sơ" i]');
        if (profileAvatars) return;

        const xLogos = img.closest('.x-logo') || img.closest('[aria-label*="X" i]') || img.closest('[aria-label*="Twitter" i]');
        if (xLogos) return;

        const emojiImgs = img.closest('.emoji') || img.closest('[data-testid="icon"]');
        if (emojiImgs) return;

        const normalizedUrl = normalizeImageUrl(rawUrl);
        if (!normalizedUrl) return;

        const dedupeKey = `${postId || 'unknown'}-${normalizedUrl}`;

        if (seenMedia.has(dedupeKey)) {
          return;
        }

        seenMedia.set(dedupeKey, true);

        const previewUrl = normalizedUrl.replace('name=orig', 'name=small');
        const altText = img.getAttribute('alt') ||
                       img.getAttribute('aria-label') ||
                       (img.getAttribute('title') && img.getAttribute('title').length < 200 ? img.getAttribute('title') : null);

        mediaItems.push({
          id: `media-${Date.now()}-${mediaIndex}`,
          postId: postId,
          postUrl: postUrl,
          authorUsername: authorUsername,
          caption: caption,
          mediaIndex: mediaIndex,
          mediaType: 'image',
          mediaUrl: normalizedUrl,
          previewUrl: previewUrl,
          altText: altText || null
        });

        mediaIndex++;
      });
    });

    return {
      success: true,
      pageUrl: window.location.href,
      count: mediaItems.length,
      media: mediaItems
    };
  } catch (error) {
    return {
      success: false,
      error: `Lỗi khi thu thập: ${error.message}`
    };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COLLECT_VISIBLE_X_MEDIA') {
    const result = collectVisibleMedia();
    sendResponse(result);
  }
  return true;
});
