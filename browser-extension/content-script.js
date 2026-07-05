/**
 * X Media Collector - Content Script
 * Scans the current X/Twitter page for visible image and video media.
 * Uses DOM-only inspection and network observation for video MP4 discovery.
 */

const X_MEDIA_ORIGINS = ['https://x.com', 'https://www.x.com', 'https://twitter.com', 'https://www.twitter.com'];

const MAX_CACHED_NETWORK_VIDEOS = 200;

const discoveredNetworkVideos = new Map();

let isObserverReady = false;
let observerReadyTimestamp = null;

function injectPageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('page-script.js');
  script.onload = function() {
    script.remove();
  };
  (document.documentElement).appendChild(script);
}

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

function normalizeVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  if (rawUrl.startsWith('blob:')) {
    return null;
  }

  if (rawUrl.startsWith('data:')) {
    return null;
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') {
    return null;
  }

  if (url.hostname !== 'video.twimg.com') {
    return null;
  }

  if (url.username || url.password) {
    return null;
  }

  if (url.hash) {
    return null;
  }

  const isMp4Url = url.pathname.endsWith('.mp4') || rawUrl.includes('.mp4');

  if (!isMp4Url) {
    return null;
  }

  return rawUrl;
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

function collectArticleVideos(article, postId, postUrl, authorUsername, caption) {
  const videoPlayers = article.querySelectorAll('[data-testid="videoPlayer"]');
  const videoItems = [];
  const seenVideoUrls = new Set();
  let videoIndex = 0;

  videoPlayers.forEach((player) => {
    const video = player.querySelector('video');
    if (!video) return;

    let videoSrc = null;
    let isBlobSource = false;

    if (video.currentSrc && video.currentSrc.startsWith('https://video.twimg.com')) {
      videoSrc = video.currentSrc;
    } else if (video.src && video.src.startsWith('https://video.twimg.com')) {
      videoSrc = video.src;
    }

    const sources = video.querySelectorAll('source');
    sources.forEach((source) => {
      const src = source.getAttribute('src');
      const type = source.getAttribute('type');

      if (src) {
        if (src.startsWith('blob:')) {
          isBlobSource = true;
        } else if (src.startsWith('https://video.twimg.com')) {
          if (type === 'video/mp4' || src.includes('.mp4')) {
            videoSrc = src;
          }
        }
      }
    });

    if (!videoSrc || isBlobSource) {
      const networkVideo = findNetworkVideoForPost(postId, video.poster);
      if (networkVideo) {
        videoItems.push({
          id: `video-${Date.now()}-${videoIndex}`,
          postId: postId,
          postUrl: postUrl,
          authorUsername: authorUsername,
          caption: caption,
          mediaIndex: videoIndex,
          mediaType: 'video',
          supported: true,
          unsupportedReason: null,
          mediaUrl: networkVideo.mediaUrl,
          previewUrl: networkVideo.thumbnailUrl || video.poster || null,
          thumbnailUrl: networkVideo.thumbnailUrl || video.poster || null,
          altText: null,
          durationSeconds: networkVideo.durationSeconds || (video.duration && isFinite(video.duration) ? Math.round(video.duration) : null),
          bitrate: networkVideo.bitrate
        });
        videoIndex++;
        return;
      }

      const posterUrl = video.poster;
      let posterAccepted = false;
      if (posterUrl) {
        try {
          const parsed = new URL(posterUrl);
          if (parsed.hostname === 'pbs.twimg.com' &&
              (parsed.pathname.includes('/amplify_video_thumb/') ||
               parsed.pathname.includes('/ext_tweets_video/') ||
               parsed.pathname.includes('/video_thumb/'))) {
            posterAccepted = true;
          }
        } catch {
        }
      }

      let durationSeconds = null;
      if (video.duration && isFinite(video.duration)) {
        durationSeconds = Math.round(video.duration);
      }

      const unsupportedReason = isBlobSource ? 'BLOB_SOURCE_REQUIRES_NETWORK_DISCOVERY' : 'DIRECT_MP4_NOT_DISCOVERED';

      videoItems.push({
        id: `unsupported-video-${Date.now()}-${videoIndex}`,
        postId: postId,
        postUrl: postUrl,
        authorUsername: authorUsername,
        caption: caption,
        mediaIndex: videoIndex,
        mediaType: 'video',
        supported: false,
        unsupportedReason: unsupportedReason,
        mediaUrl: null,
        previewUrl: posterAccepted ? posterUrl : null,
        thumbnailUrl: posterAccepted ? posterUrl : null,
        altText: null,
        durationSeconds: durationSeconds
      });
      videoIndex++;
      return;
    }

    const normalizedUrl = normalizeVideoUrl(videoSrc);
    if (!normalizedUrl) {
      return;
    }

    if (seenVideoUrls.has(normalizedUrl)) {
      return;
    }
    seenVideoUrls.add(normalizedUrl);

    let durationSeconds = null;
    if (video.duration && isFinite(video.duration)) {
      durationSeconds = Math.round(video.duration);
    }

    videoItems.push({
      id: `video-${Date.now()}-${videoIndex}`,
      postId: postId,
      postUrl: postUrl,
      authorUsername: authorUsername,
      caption: caption,
      mediaIndex: videoIndex,
      mediaType: 'video',
      supported: true,
      unsupportedReason: null,
      mediaUrl: normalizedUrl,
      previewUrl: video.poster || null,
      thumbnailUrl: video.poster || null,
      altText: null,
      durationSeconds: durationSeconds
    });

    videoIndex++;
  });

  return videoItems;
}

function findNetworkVideoForPost(postId, thumbnailHint) {
  if (!postId) {
    for (const [key, video] of discoveredNetworkVideos) {
      if (video.mediaUrl) {
        console.debug('[X Media Collector] Cached network video (unassociated)', {
          postId: video.postId,
          source: video.source,
          supported: true
        });
        discoveredNetworkVideos.delete(key);
        return video;
      }
    }
    return null;
  }

  const key = `${postId}`;
  const video = discoveredNetworkVideos.get(key);
  if (video && video.mediaUrl) {
    console.debug('[X Media Collector] Cached network video', {
      postId: video.postId,
      source: video.source,
      supported: true
    });
    discoveredNetworkVideos.delete(key);
    return video;
  }

  for (const [k, v] of discoveredNetworkVideos) {
    if (v.postId === postId && v.mediaUrl) {
      console.debug('[X Media Collector] Cached network video (by postId match)', {
        postId: v.postId,
        source: v.source,
        supported: true
      });
      discoveredNetworkVideos.delete(k);
      return v;
    }
  }

  return null;
}

function collectUnassociatedNetworkVideos() {
  const unassociated = [];
  for (const [key, video] of discoveredNetworkVideos) {
    if (!video.postId && video.mediaUrl) {
      console.debug('[X Media Collector] Cached unassociated network video', {
        source: video.source,
        supported: true
      });
      unassociated.push(video);
      discoveredNetworkVideos.delete(key);
    }
  }
  return unassociated;
}

function handlePageMessage(event) {
  if (!event.isTrusted) return;

  const origin = event.origin;
  if (!X_MEDIA_ORIGINS.includes(origin) && !origin.startsWith('https://x.com') && !origin.startsWith('https://twitter.com')) {
    return;
  }

  const data = event.data;
  if (!data || data.source !== 'X_MEDIA_COLLECTOR_PAGE') return;

  if (data.type === 'X_MEDIA_OBSERVER_READY') {
    isObserverReady = true;
    observerReadyTimestamp = data.payload?.timestamp || Date.now();
    console.debug('[X Media Collector] Page observer ready', { timestamp: observerReadyTimestamp });

    requestReplay();
    return;
  }

  if (data.type === 'X_VIDEO_DISCOVERED') {
    const video = data.payload;
    if (!video || !video.mediaUrl) return;

    const normalizedUrl = normalizeVideoUrl(video.mediaUrl);
    if (!normalizedUrl) return;

    const key = video.postId ? `${video.postId}` : `unassoc-${normalizedUrl}`;

    if (discoveredNetworkVideos.has(key)) return;

    if (discoveredNetworkVideos.size >= MAX_CACHED_NETWORK_VIDEOS) {
      const firstKey = discoveredNetworkVideos.keys().next().value;
      if (firstKey) discoveredNetworkVideos.delete(firstKey);
    }

    discoveredNetworkVideos.set(key, {
      postId: video.postId || null,
      mediaKey: video.mediaKey || null,
      mediaUrl: normalizedUrl,
      thumbnailUrl: video.thumbnailUrl || null,
      durationSeconds: video.durationSeconds || null,
      bitrate: video.bitrate || null,
      contentType: video.contentType || 'video/mp4',
      source: video.source || 'network'
    });

    console.debug('[X Media Collector] Received network video', {
      postId: video.postId,
      source: video.source,
      supported: true
    });
    return;
  }

  if (data.type === 'X_MEDIA_REPLAY_COMPLETE') {
    console.debug('[X Media Collector] Replay complete', {
      count: data.payload?.count || 0
    });
    return;
  }
}

function requestReplay() {
  try {
    window.postMessage({
      source: 'X_MEDIA_COLLECTOR_CONTENT',
      type: 'X_MEDIA_REPLAY_VIDEOS'
    }, window.location.origin);
  } catch (e) {
  }
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
    let imageIndex = 0;
    let videoIndex = 0;

    let graphQlVideoCount = 0;
    let performanceVideoCount = 0;
    let associatedVideoCount = 0;
    let unassociatedVideoCount = 0;

    for (const [key, video] of discoveredNetworkVideos) {
      if (video.source === 'graphql') graphQlVideoCount++;
      else if (video.source === 'performance') performanceVideoCount++;
      if (video.postId) associatedVideoCount++;
      else unassociatedVideoCount++;
    }

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

        const dedupeKey = `${postId || 'unknown'}-image-${normalizedUrl}`;

        if (seenMedia.has(dedupeKey)) {
          return;
        }

        seenMedia.set(dedupeKey, true);

        const previewUrl = normalizedUrl.replace('name=orig', 'name=small');
        const altText = img.getAttribute('alt') ||
                       img.getAttribute('aria-label') ||
                       (img.getAttribute('title') && img.getAttribute('title').length < 200 ? img.getAttribute('title') : null);

        mediaItems.push({
          id: `image-${Date.now()}-${imageIndex}`,
          postId: postId,
          postUrl: postUrl,
          authorUsername: authorUsername,
          caption: caption,
          mediaIndex: imageIndex,
          mediaType: 'image',
          supported: true,
          unsupportedReason: null,
          mediaUrl: normalizedUrl,
          previewUrl: previewUrl,
          thumbnailUrl: null,
          altText: altText || null,
          durationSeconds: null
        });

        imageIndex++;
      });

      const articleVideos = collectArticleVideos(article, postId, postUrl, authorUsername, caption);
      articleVideos.forEach((video) => {
        const dedupeKey = `${postId || 'unknown'}-video-${video.mediaUrl || video.id}`;

        if (seenMedia.has(dedupeKey)) {
          return;
        }
        seenMedia.set(dedupeKey, true);

        mediaItems.push(video);
        if (video.supported) {
          videoIndex++;
        }
      });
    });

    const unassociatedVideos = collectUnassociatedNetworkVideos();
    for (const video of unassociatedVideos) {
      const dedupeKey = `unassociated-video-${video.mediaUrl}`;
      if (seenMedia.has(dedupeKey)) {
        continue;
      }
      seenMedia.set(dedupeKey, true);

      mediaItems.push({
        id: `video-${Date.now()}-${videoIndex}`,
        postId: null,
        postUrl: null,
        authorUsername: null,
        caption: null,
        mediaIndex: videoIndex,
        mediaType: 'video',
        supported: true,
        unsupportedReason: null,
        mediaUrl: video.mediaUrl,
        previewUrl: video.thumbnailUrl || null,
        thumbnailUrl: video.thumbnailUrl || null,
        altText: null,
        durationSeconds: video.durationSeconds,
        bitrate: video.bitrate
      });
      videoIndex++;
    }

    let graphQlCount = 0;
    let perfCount = 0;
    let assocCount = 0;
    let unassocCount = 0;
    for (const [key, video] of discoveredNetworkVideos) {
      if (video.source === 'graphql') graphQlCount++;
      else if (video.source === 'performance') perfCount++;
      if (video.postId) assocCount++;
      else unassocCount++;
    }

    return {
      success: true,
      pageUrl: window.location.href,
      count: mediaItems.length,
      media: mediaItems,
      diagnostics: {
        observerReady: isObserverReady,
        observerReadyTimestamp: observerReadyTimestamp,
        graphQlVideoCount: graphQlCount,
        performanceVideoCount: perfCount,
        associatedVideoCount: assocCount,
        unassociatedVideoCount: unassocCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Lỗi khi thu thập: ${error.message}`
    };
  }
}

window.addEventListener('message', handlePageMessage);

injectPageScript();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COLLECT_VISIBLE_X_MEDIA') {
    const result = collectVisibleMedia();
    sendResponse(result);
  }
  return true;
});
