(function() {
  'use strict';

  const X_DOMAINS = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'api.x.com', 'api.twitter.com'];

  const MAX_DEPTH = 20;
  const MAX_VISITED_NODES = 20000;
  const MAX_CACHED_VIDEOS = 200;
  const MAX_REPLAY_CACHE = 500;
  const MAX_RESPONSE_URL_CACHE = 1000;

  const discoveredVideos = new Map();
  const seenResponseUrls = new Set();
  const replayCache = [];
  let isObserverReady = false;
  let isContentScriptConnected = false;

  function isXDomain(url) {
    try {
      const parsed = new URL(url);
      return X_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
    } catch {
      return false;
    }
  }

  function looksLikeJson(contentType) {
    if (!contentType) return false;
    return contentType.includes('application/json') || contentType.includes('text/json');
  }

  function isValidMp4Url(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('blob:')) return false;
    if (url.startsWith('data:')) return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      if (parsed.hostname !== 'video.twimg.com') return false;
      if (url.includes('.m3u8') || url.includes('application/x-mpegURL')) return false;
      return true;
    } catch {
      return false;
    }
  }

  function selectHighestBitrateMp4(variants) {
    if (!variants || !Array.isArray(variants)) return null;

    let best = null;
    let highestBitrate = -1;

    for (const variant of variants) {
      if (!variant || typeof variant !== 'object') continue;

      const url = variant.url;
      const contentType = variant.content_type || variant.contentType;

      if (!url || typeof url !== 'string') continue;

      if (!isValidMp4Url(url)) continue;

      if (contentType && contentType !== 'video/mp4' && !contentType.includes('mp4')) continue;

      const bitrate = variant.bitrate || variant.bit_rate || variant.bitrate_bps || 0;

      if (bitrate > highestBitrate) {
        highestBitrate = bitrate;
        best = { url, bitrate, contentType: 'video/mp4' };
      }
    }

    if (best) return best;

    for (const variant of variants) {
      if (!variant || !variant.url || typeof variant.url !== 'string') continue;
      const contentType = variant.content_type || variant.contentType;
      if (contentType && (contentType === 'video/mp4' || contentType.includes('mp4'))) {
        if (isValidMp4Url(variant.url)) {
          return {
            url: variant.url,
            bitrate: variant.bitrate || variant.bit_rate || variant.bitrate_bps || null,
            contentType: 'video/mp4'
          };
        }
      }
    }

    return null;
  }

  function normalizePosterUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'pbs.twimg.com' &&
          (parsed.pathname.includes('/amplify_video_thumb/') ||
           parsed.pathname.includes('/ext_tweets_video/') ||
           parsed.pathname.includes('/video_thumb/'))) {
        return url;
      }
    } catch {
    }
    return null;
  }

  function traverseForVideos(obj, currentDepth, visitedCount, postId, mediaKey, foundInGraphQl) {
    if (currentDepth > MAX_DEPTH || visitedCount > MAX_VISITED_NODES) {
      return { videos: [], visitedCount };
    }

    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return { videos: [], visitedCount };
    }

    if (Array.isArray(obj)) {
      let count = visitedCount;
      for (const item of obj) {
        if (count > MAX_VISITED_NODES) break;
        const result = traverseForVideos(item, currentDepth + 1, count, postId, mediaKey, foundInGraphQl);
        count = result.visitedCount;
      }
      return { videos: [], visitedCount: count };
    }

    visitedCount++;
    const videos = [];

    if (obj.video_info && obj.video_info.variants) {
      const best = selectHighestBitrateMp4(obj.video_info.variants);
      if (best) {
        const thumbnailUrl = obj.video_info.poster ||
          (mediaKey ? `https://pbs.twimg.com/media/${mediaKey.split(':')[0]}?format=jpg&name=large` : null);

        videos.push({
          postId: postId,
          mediaKey: mediaKey,
          mediaUrl: best.url,
          thumbnailUrl: thumbnailUrl,
          durationSeconds: obj.video_info.duration_millis ? Math.round(obj.video_info.duration_millis / 1000) : null,
          bitrate: best.bitrate,
          contentType: 'video/mp4',
          source: foundInGraphQl ? 'graphql' : 'network'
        });
      }
    }

    if (obj.extended_entities && Array.isArray(obj.extended_entities.media)) {
      for (const media of obj.extended_entities.media) {
        if (media.type === 'video' && media.video_info && media.video_info.variants) {
          const best = selectHighestBitrateMp4(media.video_info.variants);
          if (best) {
            const foundPostId = obj.rest_id || obj.id_str || postId;
            const foundMediaKey = media.media_key || mediaKey;
            const foundGraphQl = foundInGraphQl || !!(obj.rest_id || obj.id_str);

            videos.push({
              postId: foundPostId,
              mediaKey: foundMediaKey,
              mediaUrl: best.url,
              thumbnailUrl: media.media_url_https || media.poster || null,
              durationSeconds: media.video_info.duration_millis ? Math.round(media.video_info.duration_millis / 1000) : null,
              bitrate: best.bitrate,
              contentType: 'video/mp4',
              source: foundGraphQl ? 'graphql' : 'network'
            });
          }
        }
      }
    }

    if (obj.legacy && obj.legacy.extended_entities && Array.isArray(obj.legacy.extended_entities.media)) {
      for (const media of obj.legacy.extended_entities.media) {
        if (media.type === 'video' && media.video_info && media.video_info.variants) {
          const best = selectHighestBitrateMp4(media.video_info.variants);
          if (best) {
            const foundPostId = obj.rest_id || obj.legacy.id_str || postId;
            const foundMediaKey = media.media_key || mediaKey;
            const foundGraphQl = foundInGraphQl || !!(obj.rest_id || obj.legacy.id_str);

            videos.push({
              postId: foundPostId,
              mediaKey: foundMediaKey,
              mediaUrl: best.url,
              thumbnailUrl: media.media_url_https || media.poster || null,
              durationSeconds: media.video_info.duration_millis ? Math.round(media.video_info.duration_millis / 1000) : null,
              bitrate: best.bitrate,
              contentType: 'video/mp4',
              source: foundGraphQl ? 'graphql' : 'network'
            });
          }
        }
      }
    }

    if (obj.tweet_results && obj.tweet_results.result) {
      const result = obj.tweet_results.result;
      const foundPostId = result.rest_id || result.id_str || postId;
      const foundGraphQl = foundInGraphQl || !!(result.rest_id || result.id_str);

      if (result.legacy && result.legacy.extended_entities) {
        const nested = traverseForVideos(result.legacy.extended_entities, currentDepth + 1, visitedCount, foundPostId, mediaKey, foundGraphQl);
        videos.push(...nested.videos);
        visitedCount = nested.visitedCount;
      }

      if (result.video_info && result.video_info.variants) {
        const best = selectHighestBitrateMp4(result.video_info.variants);
        if (best) {
          videos.push({
            postId: foundPostId,
            mediaKey: mediaKey,
            mediaUrl: best.url,
            thumbnailUrl: result.poster || null,
            durationSeconds: result.video_info.duration_millis ? Math.round(result.video_info.duration_millis / 1000) : null,
            bitrate: best.bitrate,
            contentType: 'video/mp4',
            source: foundGraphQl ? 'graphql' : 'network'
          });
        }
      }
    }

    if (obj.data && typeof obj.data === 'object') {
      const nested = traverseForVideos(obj.data, currentDepth + 1, visitedCount, postId, mediaKey, foundInGraphQl);
      videos.push(...nested.videos);
      visitedCount = nested.visitedCount;
    }

    const keys = Object.keys(obj);
    for (const key of keys) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      const value = obj[key];
      if (value && typeof value === 'object') {
        const foundPostId = obj.rest_id || obj.id_str || postId;
        const foundGraphQl = foundInGraphQl || !!(obj.rest_id || obj.id_str);
        const nested = traverseForVideos(value, currentDepth + 1, visitedCount, foundPostId, mediaKey, foundGraphQl);
        videos.push(...nested.videos);
        visitedCount = nested.visitedCount;
        if (visitedCount > MAX_VISITED_NODES) break;
      }
    }

    return { videos, visitedCount };
  }

  function processJsonResponse(jsonText, url) {
    try {
      const json = JSON.parse(jsonText);
      const { videos } = traverseForVideos(json, 0, 0, null, null, false);

      for (const video of videos) {
        const key = video.postId ? `${video.postId}-${video.mediaUrl}` : `unassoc-${video.mediaUrl}`;

        if (!discoveredVideos.has(key)) {
          if (discoveredVideos.size >= MAX_CACHED_VIDEOS) {
            const firstKey = discoveredVideos.keys().next().value;
            if (firstKey) discoveredVideos.delete(firstKey);
          }
          discoveredVideos.set(key, video);

          const logInfo = {
            postId: video.postId,
            bitrate: video.bitrate,
            source: video.source,
            host: video.mediaUrl ? new URL(video.mediaUrl).hostname : 'unknown'
          };

          if (video.source === 'graphql') {
            console.debug('[X Media Collector] GraphQL video discovered', logInfo);
          } else {
            console.debug('[X Media Collector] Network video discovered', logInfo);
          }

          if (isContentScriptConnected) {
            publishVideo(video);
          } else {
            if (replayCache.length < MAX_REPLAY_CACHE) {
              replayCache.push(video);
            }
          }
        }
      }
    } catch (e) {
    }
  }

  function publishVideo(video) {
    try {
      window.postMessage({
        source: 'X_MEDIA_COLLECTOR_PAGE',
        type: 'X_VIDEO_DISCOVERED',
        payload: video
      }, window.location.origin);
    } catch (e) {
    }
  }

  function publishObserverReady() {
    isObserverReady = true;
    try {
      window.postMessage({
        source: 'X_MEDIA_COLLECTOR_PAGE',
        type: 'X_MEDIA_OBSERVER_READY',
        payload: {
          timestamp: Date.now()
        }
      }, window.location.origin);
    } catch (e) {
    }
  }

  function handleIncomingMessage(event) {
    if (!event.isTrusted) return;

    const data = event.data;
    if (!data || data.source !== 'X_MEDIA_COLLECTOR_CONTENT') return;

    if (data.type === 'X_MEDIA_REPLAY_VIDEOS') {
      isContentScriptConnected = true;

      for (const video of replayCache) {
        publishVideo(video);
      }

      window.postMessage({
        source: 'X_MEDIA_COLLECTOR_PAGE',
        type: 'X_MEDIA_REPLAY_COMPLETE',
        payload: {
          count: replayCache.length,
          timestamp: Date.now()
        }
      }, window.location.origin);
    }
  }

  function installPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType !== 'video') continue;

          let resourceUrl = null;

          if (entry.name && isValidMp4Url(entry.name)) {
            resourceUrl = entry.name;
          }

          if (!resourceUrl && entry.responseStart && entry.transferSize > 0) {
            try {
              const entries = performance.getEntriesByName(entry.name);
              if (entries.length > 0) {
                const match = entries[0];
                if (match.name && isValidMp4Url(match.name)) {
                  resourceUrl = match.name;
                }
              }
            } catch (e) {
            }
          }

          if (resourceUrl) {
            const key = `perf-${resourceUrl}`;
            if (!discoveredVideos.has(key)) {
              if (discoveredVideos.size >= MAX_CACHED_VIDEOS) {
                const firstKey = discoveredVideos.keys().next().value;
                if (firstKey) discoveredVideos.delete(firstKey);
              }

              const video = {
                postId: null,
                mediaKey: null,
                mediaUrl: resourceUrl,
                thumbnailUrl: null,
                durationSeconds: null,
                bitrate: null,
                contentType: 'video/mp4',
                source: 'performance'
              };

              discoveredVideos.set(key, video);

              console.debug('[X Media Collector] PerformanceObserver video discovered', {
                host: new URL(resourceUrl).hostname
              });

              if (isContentScriptConnected) {
                publishVideo(video);
              } else {
                if (replayCache.length < MAX_REPLAY_CACHE) {
                  replayCache.push(video);
                }
              }
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'], buffered: true });
    } catch (e) {
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = args[0] instanceof Request ? args[0].url : args[0];
      if (typeof url !== 'string') return response;
      if (!isXDomain(url)) return response;

      const contentType = response.headers.get('content-type');
      if (!looksLikeJson(contentType)) return response;

      const responseUrl = response.url || url;
      if (seenResponseUrls.has(responseUrl)) {
        return response;
      }
      seenResponseUrls.add(responseUrl);
      if (seenResponseUrls.size > MAX_RESPONSE_URL_CACHE) {
        const iter = seenResponseUrls.keys();
        for (let i = 0; i < Math.floor(MAX_RESPONSE_URL_CACHE / 2); i++) {
          seenResponseUrls.delete(iter.next().value);
        }
      }

      const cloned = response.clone();

      cloned.text().then(text => {
        if (text.length > 50 * 1024 * 1024) return;
        processJsonResponse(text, responseUrl);
      }).catch(() => {});

    } catch (e) {
    }

    return response;
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._xMediaUrl = url;
    this._xMediaMethod = method;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (!this._xMediaHeaders) this._xMediaHeaders = {};
    this._xMediaHeaders[name.toLowerCase()] = value;
    return originalXHRSetHeader.apply(this, [name, value]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this;

    function handleReadyStateChange() {
      if (xhr.readyState !== 4) return;

      try {
        const url = xhr._xMediaUrl;
        if (typeof url !== 'string') return;
        if (!isXDomain(url)) return;

        const contentType = xhr.getResponseHeader('content-type');
        if (!looksLikeJson(contentType)) return;

        const responseUrl = xhr.responseURL || url;
        if (seenResponseUrls.has(responseUrl)) return;
        seenResponseUrls.add(responseUrl);
        if (seenResponseUrls.size > MAX_RESPONSE_URL_CACHE) {
          const iter = seenResponseUrls.keys();
          for (let i = 0; i < Math.floor(MAX_RESPONSE_URL_CACHE / 2); i++) {
            seenResponseUrls.delete(iter.next().value);
          }
        }

        let responseText;
        try {
          responseText = typeof xhr.response === 'string' ? xhr.responseText : JSON.stringify(xhr.response);
        } catch {
          return;
        }

        if (!responseText || responseText.length > 50 * 1024 * 1024) return;

        processJsonResponse(responseText, responseUrl);
      } catch (e) {
      }
    }

    if (xhr.addEventListener) {
      xhr.addEventListener('readystatechange', handleReadyStateChange);
    } else {
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function() {
        handleReadyStateChange();
        if (originalOnReadyStateChange) originalOnReadyStateChange.apply(this, arguments);
      };
    }

    return originalXHRSend.apply(this, args);
  };

  window.addEventListener('message', handleIncomingMessage);

  installPerformanceObserver();
  publishObserverReady();

  console.debug('[X Media Collector] Page script initialized');
})();
