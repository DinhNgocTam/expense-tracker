/**
 * X Media Collector - Popup Script
 * Handles user interactions and communicates with the content script.
 */

(function() {
  const config = globalThis.X_MEDIA_CONFIG;

  if (!config?.APP_BASE_URL) {
    throw new Error("X Media Collector: APP_BASE_URL is not configured in config.js");
  }

  const APP_BASE_URL = config.APP_BASE_URL;

  const connectApiUrl = new URL(config.API_CONNECT, APP_BASE_URL).toString();
  const tokenApiUrl = new URL(config.API_TOKEN, APP_BASE_URL).toString();
  const sessionApiUrl = new URL(config.API_SESSION, APP_BASE_URL).toString();
  const importApiUrl = new URL(config.API_IMPORT, APP_BASE_URL).toString();
  const connectPageUrl = new URL(config.CONNECT_PAGE, APP_BASE_URL).toString();
  const galleryUrl = new URL(config.GALLERY_PAGE, APP_BASE_URL).toString();

  console.debug("[X Media Collector] APP_BASE_URL:", APP_BASE_URL);
  console.debug("[X Media Collector] Token endpoint:", tokenApiUrl);
  console.debug("[X Media Collector] Session endpoint:", sessionApiUrl);
  console.debug("[X Media Collector] Import endpoint:", importApiUrl);

  const VALID_HOSTNAMES = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']);

  const collectBtn = document.getElementById('collectBtn');
  const clearBtn = document.getElementById('clearBtn');
  const connectBtn = document.getElementById('connectBtn');
  const authStatus = document.getElementById('authStatus');
  const authStatusText = document.getElementById('authStatusText');
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const staleWarning = document.getElementById('staleWarning');
  const resultsEl = document.getElementById('results');
  const resultsSummary = document.getElementById('resultsSummary');
  const pageUrlEl = document.getElementById('pageUrl');
  const resultsList = document.getElementById('resultsList');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const errorText = document.getElementById('errorText');
  const selectAllCheckbox = document.getElementById('selectAll');
  const selectedCountEl = document.getElementById('selectedCount');
  const archiveSection = document.getElementById('archiveSection');
  const archiveBtn = document.getElementById('archiveBtn');
  const openGalleryLink = document.getElementById('openGallery');
  const importResultEl = document.getElementById('importResult');
  const importResultSummary = document.getElementById('importResultSummary');
  const importResultDetails = document.getElementById('importResultDetails');
  const closeImportResultBtn = document.getElementById('closeImportResult');
  const connectModal = document.getElementById('connectModal');
  const openConnectPageLink = document.getElementById('openConnectPage');
  const connectCodeInput = document.getElementById('connectCode');
  const submitConnectBtn = document.getElementById('submitConnect');
  const cancelConnectBtn = document.getElementById('cancelConnect');
  const connectErrorEl = document.getElementById('connectError');
  const envLabel = document.getElementById('envLabel');

  let currentResults = null;
  let selectedMediaIds = new Set();
  let isArchiving = false;
  let isCollecting = false;

  const connectionState = {
    connected: false,
    token: null,
    tokenValid: false,
    email: null
  };

  function updateArchiveButtonState() {
    archiveBtn.disabled = !connectionState.connected || !connectionState.tokenValid || selectedMediaIds.size === 0 || isArchiving;
    console.debug("[X Media Collector] Archive button state", {
      connected: connectionState.connected,
      tokenValid: connectionState.tokenValid,
      selectedCount: selectedMediaIds.size,
      isArchiving: isArchiving,
      disabled: archiveBtn.disabled
    });
  }

  function updateCollectButtonState() {
    collectBtn.disabled = isCollecting;
  }

  function updateSelectedCount() {
    const count = selectedMediaIds.size;
    if (count > 0) {
      selectedCountEl.textContent = 'Đã chọn: ' + count;
    } else {
      selectedCountEl.textContent = '';
    }
    updateArchiveButtonState();
  }

  function setStatus(message, type) {
    statusText.textContent = message;
    statusEl.className = 'status ' + (type || '');
  }

  function showError(message) {
    errorText.textContent = message;
    errorState.hidden = false;
    staleWarning.hidden = true;
    importResultEl.hidden = true;
  }

  function hideError() {
    errorState.hidden = true;
  }

  function showEmpty() {
    emptyState.hidden = false;
    resultsEl.hidden = true;
    staleWarning.hidden = true;
    archiveSection.hidden = true;
    importResultEl.hidden = true;
  }

  function hideEmpty() {
    emptyState.hidden = true;
  }

  function updateAuthStatus(connected, email, tokenValid) {
    connectionState.connected = connected;
    connectionState.tokenValid = tokenValid || false;
    connectionState.email = email || null;
    if (connected && email) {
      authStatus.className = 'auth-status connected';
      authStatusText.textContent = email;
      connectBtn.textContent = 'Đổi tài khoản';
    } else {
      authStatus.className = 'auth-status disconnected';
      authStatusText.textContent = 'Chưa kết nối';
      connectBtn.textContent = 'Kết nối';
      connectionState.token = null;
    }
    updateCollectButtonState();
    updateArchiveButtonState();
  }

  function updateSelectedCount() {
    const count = selectedMediaIds.size;
    if (count > 0) {
      selectedCountEl.textContent = 'Đã chọn: ' + count;
    } else {
      selectedCountEl.textContent = '';
    }
    updateArchiveButtonState();
  }

  function showResults(data) {
    hideError();
    hideEmpty();
    resultsEl.hidden = false;
    staleWarning.hidden = false;
    importResultEl.hidden = true;

    currentResults = data;
    selectedMediaIds.clear();
    updateSelectedCount();

    const imageCount = data.media.filter(function(m) { return m.mediaType === 'image'; }).length;
    const videoCount = data.media.filter(function(m) { return m.mediaType === 'video'; }).length;
    const supportedVideoCount = data.media.filter(function(m) { return m.mediaType === 'video' && m.supported !== false; }).length;
    const unsupportedVideoCount = videoCount - supportedVideoCount;

    let summaryText = '';
    if (imageCount > 0) {
      summaryText += imageCount + ' ảnh';
    }
    if (videoCount > 0) {
      if (summaryText) summaryText += ' và ';
      summaryText += supportedVideoCount + ' video';
      if (unsupportedVideoCount > 0) {
        summaryText += ' ('
        + supportedVideoCount + ' hỗ trợ';
        if (unsupportedVideoCount > 0) {
          summaryText += ', ' + unsupportedVideoCount + ' không hỗ trợ';
        }
        summaryText += ')';
      }
    }
    if (!summaryText) {
      summaryText = 'Không có media nào';
    }
    resultsSummary.textContent = summaryText;

    const hostname = new URL(data.pageUrl).hostname;
    pageUrlEl.textContent = hostname + new URL(data.pageUrl).pathname;

    resultsList.replaceChildren();

    data.media.forEach(function(item) {
      const card = createMediaCard(item);
      resultsList.appendChild(card);
    });

    selectAllCheckbox.checked = false;

    archiveSection.hidden = false;
    openGalleryLink.href = galleryUrl;
  }

  function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    if (item.supported === false) {
      card.classList.add('unsupported');
    }
    card.dataset.itemId = item.mediaUrl;
    card.dataset.mediaType = item.mediaType;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'media-checkbox';
    checkbox.checked = selectedMediaIds.has(item.mediaUrl);
    checkbox.disabled = item.supported === false;

    if (item.supported !== false) {
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedMediaIds.add(item.mediaUrl);
          card.classList.add('selected');
        } else {
          selectedMediaIds.delete(item.mediaUrl);
          card.classList.remove('selected');
        }
        updateSelectedCount();
      });
    }

    const thumbnail = document.createElement('div');
    thumbnail.className = 'media-thumbnail-wrapper';

    if (item.mediaType === 'video' && item.thumbnailUrl) {
      const videoThumbnail = document.createElement('img');
      videoThumbnail.className = 'media-thumbnail';
      videoThumbnail.src = item.thumbnailUrl;
      videoThumbnail.alt = item.altText || 'Video thumbnail';
      videoThumbnail.loading = 'lazy';
      thumbnail.appendChild(videoThumbnail);

      const videoBadge = document.createElement('span');
      videoBadge.className = 'media-type-badge video-badge';
      videoBadge.textContent = 'Video';
      thumbnail.appendChild(videoBadge);

      if (item.durationSeconds) {
        const durationBadge = document.createElement('span');
        durationBadge.className = 'duration-badge';
        durationBadge.textContent = formatDuration(item.durationSeconds);
        thumbnail.appendChild(durationBadge);
      }
    } else if (item.mediaType === 'video' && !item.thumbnailUrl) {
      const placeholder = document.createElement('div');
      placeholder.className = 'media-placeholder video-placeholder';
      placeholder.textContent = '🎬';
      thumbnail.appendChild(placeholder);

      const videoBadge = document.createElement('span');
      videoBadge.className = 'media-type-badge video-badge';
      videoBadge.textContent = 'Video';
      thumbnail.appendChild(videoBadge);
    } else {
      const img = document.createElement('img');
      img.className = 'media-thumbnail';
      img.src = item.previewUrl || item.mediaUrl;
      img.alt = item.altText || 'Image thumbnail';
      img.loading = 'lazy';
      thumbnail.appendChild(img);

      const imageBadge = document.createElement('span');
      imageBadge.className = 'media-type-badge image-badge';
      imageBadge.textContent = 'Ảnh';
      thumbnail.appendChild(imageBadge);
    }

    const info = document.createElement('div');
    info.className = 'media-info';

    if (item.unsupportedReason) {
      const unsupportedMsg = document.createElement('div');
      unsupportedMsg.className = 'unsupported-message';
      if (item.unsupportedReason === 'BLOB_SOURCE_REQUIRES_NETWORK_DISCOVERY') {
        unsupportedMsg.textContent = 'X đang phát video bằng blob URL nhưng chưa tìm thấy nguồn MP4. Hãy phát video vài giây rồi thu thập lại.';
      } else if (item.unsupportedReason === 'DIRECT_MP4_NOT_DISCOVERED') {
        unsupportedMsg.textContent = 'Chưa tìm thấy URL MP4 trực tiếp. Hãy phát video hoặc chờ trang tải xong rồi thu thập lại.';
      } else if (item.unsupportedReason === 'OBSERVER_NOT_READY') {
        unsupportedMsg.textContent = 'Trình quan sát video chưa hoạt động. Hãy tải lại tab X.';
      } else if (item.unsupportedReason === 'UNASSOCIATED_VIDEO') {
        unsupportedMsg.textContent = 'Đã tìm thấy nguồn MP4 nhưng chưa liên kết được với bài viết.';
      } else {
        unsupportedMsg.textContent = 'Video này chưa được hỗ trợ';
      }
      info.appendChild(unsupportedMsg);
    }

    if (item.authorUsername) {
      const author = document.createElement('div');
      author.className = 'media-author';
      author.textContent = '@' + item.authorUsername;
      info.appendChild(author);
    }

    if (item.postId) {
      const postId = document.createElement('div');
      postId.className = 'media-post-id';
      postId.textContent = 'ID: ' + item.postId;
      info.appendChild(postId);
    }

    if (item.caption) {
      const caption = document.createElement('div');
      caption.className = 'media-caption';
      caption.textContent = item.caption;
      caption.title = item.caption;
      info.appendChild(caption);
    }

    const links = document.createElement('div');
    links.className = 'media-links';

    if (item.postUrl) {
      const postLink = document.createElement('a');
      postLink.className = 'media-link';
      postLink.href = item.postUrl;
      postLink.textContent = 'Mở bài viết';
      postLink.target = '_blank';
      postLink.rel = 'noreferrer noopener';
      links.appendChild(postLink);
    }

    if (item.supported !== false) {
      const mediaLink = document.createElement('a');
      mediaLink.className = 'media-link';
      mediaLink.href = item.mediaUrl;
      mediaLink.textContent = item.mediaType === 'video' ? 'Mở video gốc' : 'Mở ảnh gốc';
      mediaLink.target = '_blank';
      mediaLink.rel = 'noreferrer noopener';
      links.appendChild(mediaLink);
    }

    info.appendChild(links);
    card.appendChild(checkbox);
    card.appendChild(thumbnail);
    card.appendChild(info);

    return card;
  }

  function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function setButtonsEnabled(enabled) {
    isArchiving = !enabled;
    updateCollectButtonState();
    clearBtn.disabled = !enabled;
    updateArchiveButtonState();
  }

  function isValidHostname(hostname) {
    return VALID_HOSTNAMES.has(hostname);
  }

  function showConnectModal() {
    connectModal.hidden = false;
    connectCodeInput.value = '';
    connectErrorEl.hidden = true;
    submitConnectBtn.disabled = true;
    openConnectPageLink.href = connectPageUrl;
  }

  function hideConnectModal() {
    connectModal.hidden = true;
    connectCodeInput.value = '';
    connectErrorEl.hidden = true;
  }

  async function checkSession() {
    try {
      const storedToken = await getStoredToken();

      const headers = {
        credentials: 'include'
      };
      if (storedToken) {
        headers['Authorization'] = 'Bearer ' + storedToken;
      }

      const response = await fetch(sessionApiUrl, headers);

      if (response.ok) {
        const data = await response.json();

        if (data.authenticated && data.user && data.user.email) {
          if (data.extensionTokenValid === false) {
            console.debug('[X Media Collector] Extension token invalid:', data.extensionTokenError);
            if (storedToken) {
              await chrome.storage.local.remove(config.STORAGE_KEYS.EXTENSION_TOKEN);
            }
            connectionState.token = null;
            connectionState.email = data.user.email;
            connectionState.connected = false;
            connectionState.tokenValid = false;
            updateAuthStatus(false, data.user.email, false);
            return;
          }

          if (storedToken) {
            connectionState.token = storedToken;
            connectionState.email = data.user.email;
            connectionState.connected = true;
            connectionState.tokenValid = true;
            updateAuthStatus(true, connectionState.email, true);
            console.debug('[X Media Collector] Session restored', {
              email: connectionState.email,
              hasToken: true,
              extensionTokenValid: data.extensionTokenValid
            });
            return;
          }
          console.debug('[X Media Collector] Session valid but no token stored');
          connectionState.connected = true;
          connectionState.tokenValid = false;
          updateAuthStatus(true, data.user.email, false);
          return;
        }
      }
    } catch (e) {
      console.debug('[X Media Collector] Session check failed:', e.message);
    }
    connectionState.connected = false;
    connectionState.token = null;
    connectionState.tokenValid = false;
    updateAuthStatus(false, null, false);
  }

  async function getStoredToken() {
    try {
      const result = await chrome.storage.local.get(config.STORAGE_KEYS.EXTENSION_TOKEN);
      return result[config.STORAGE_KEYS.EXTENSION_TOKEN] || null;
    } catch (e) {
      return null;
    }
  }

  async function loadSavedResult() {
    try {
      const result = await chrome.storage.local.get(config.STORAGE_KEYS.LAST_RESULT);
      if (result && result[config.STORAGE_KEYS.LAST_RESULT]) {
        const data = result[config.STORAGE_KEYS.LAST_RESULT];
        if (data && data.success && data.media && data.media.length > 0) {
          showResults(data);
          staleWarning.hidden = false;
          clearBtn.disabled = false;
          return true;
        }
      }
    } catch (e) {
    }
    return false;
  }

  async function clearResults() {
    try {
      await chrome.storage.local.remove(config.STORAGE_KEYS.LAST_RESULT);
    } catch (e) {
    }
    resultsEl.hidden = true;
    staleWarning.hidden = true;
    showEmpty();
    clearBtn.disabled = true;
    setStatus('');
    selectedMediaIds.clear();
    currentResults = null;
    archiveSection.hidden = true;
    importResultEl.hidden = true;
    updateSelectedCount();
  }

  async function collectMedia() {
    hideError();
    importResultEl.hidden = true;
    isCollecting = true;
    setStatus('Đang thu thập...', 'loading');
    updateCollectButtonState();
    clearBtn.disabled = true;

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tabs || tabs.length === 0) {
        showError('Không tìm thấy tab đang hoạt động.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      const tab = tabs[0];

      if (!tab.url) {
        showError('Không thể đọc URL của tab.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      let hostname;
      try {
        hostname = new URL(tab.url).hostname;
      } catch {
        showError('URL của tab không hợp lệ.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      if (!isValidHostname(hostname)) {
        showError('Vui lòng mở trang X hoặc Twitter để thu thập ảnh.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'COLLECT_VISIBLE_X_MEDIA'
      });

      if (!response) {
        showError('Content script chưa được tải. Vui lòng tải lại trang X.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      if (!response.success) {
        showError(response.error || 'Thu thập thất bại.');
        isCollecting = false;
        updateCollectButtonState();
        clearBtn.disabled = false;
        return;
      }

      if (response.count === 0) {
        setStatus('Không tìm thấy ảnh nào trên trang.', 'error');
        resultsEl.hidden = true;
        staleWarning.hidden = true;
        emptyState.hidden = false;
        archiveSection.hidden = true;
        currentResults = null;
        selectedMediaIds.clear();
      } else {
        await chrome.storage.local.set({
          [config.STORAGE_KEYS.LAST_RESULT]: response
        });
        showResults(response);
        setStatus('Đã tìm thấy ' + response.count + ' ảnh', 'success');
      }
    } catch (error) {
      if (error.message && error.message.includes('No tab with id')) {
        showError('Tab không tồn tại. Vui lòng tải lại trang X.');
      } else if (error.message && error.message.includes('Receiving end does not exist')) {
        showError('Content script chưa được tải. Vui lòng tải lại trang X.');
      } else {
        showError('Lỗi: ' + (error.message || 'Không xác định'));
      }
    } finally {
      isCollecting = false;
      updateCollectButtonState();
      clearBtn.disabled = false;
      updateArchiveButtonState();
    }
  }

  async function importSelectedMedia() {
    console.debug('[X Media Collector] Archive button clicked', {
      hasCurrentResults: !!currentResults,
      selectedCount: selectedMediaIds.size,
      connected: connectionState.connected,
      tokenValid: connectionState.tokenValid,
      endpointHostname: new URL(importApiUrl).hostname
    });

    if (!currentResults) {
      showError('Không có dữ liệu để lưu. Vui lòng thu thập ảnh trước.');
      return;
    }

    if (selectedMediaIds.size === 0) {
      showError('Vui lòng chọn ít nhất một ảnh để lưu.');
      return;
    }

    if (!connectionState.connected || !connectionState.tokenValid) {
      showError('Phiên kết nối đã hết hạn. Vui lòng kết nối lại.');
      connectionState.tokenValid = false;
      updateArchiveButtonState();
      return;
    }

    setStatus('Đang lưu...', 'loading');
    isArchiving = true;
    updateArchiveButtonState();
    clearBtn.disabled = true;

    const selectedMedia = currentResults.media.filter(function(item) {
      return selectedMediaIds.has(item.mediaUrl);
    });

    const videoCount = selectedMedia.filter(function(item) {
      return item.mediaType === 'video';
    }).length;

    if (videoCount > 5) {
      showError('Mỗi lần chỉ có thể lưu tối đa 5 video.');
      isArchiving = false;
      clearBtn.disabled = false;
      updateArchiveButtonState();
      return;
    }

    const importPayload = {
      items: selectedMedia.map(function(item) {
        if (item.mediaType === 'video') {
          return {
            postId: item.postId,
            postUrl: item.postUrl,
            authorUsername: item.authorUsername,
            caption: item.caption,
            mediaIndex: item.mediaIndex,
            mediaType: 'video',
            mediaUrl: item.mediaUrl,
            altText: item.altText,
            thumbnailUrl: item.thumbnailUrl || null,
            durationSeconds: item.durationSeconds || null,
            bitrate: item.bitrate || null,
            contentType: 'video/mp4'
          };
        }
        return {
          postId: item.postId,
          postUrl: item.postUrl,
          authorUsername: item.authorUsername,
          caption: item.caption,
          mediaIndex: item.mediaIndex,
          mediaType: 'image',
          mediaUrl: item.mediaUrl,
          altText: item.altText,
          thumbnailUrl: null,
          durationSeconds: null,
          bitrate: null,
          contentType: null
        };
      })
    };

    try {
      const response = await fetch(importApiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + connectionState.token
        },
        body: JSON.stringify(importPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const errorCode = data.error?.code || 'EXTENSION_TOKEN_INVALID';
          const errorMessages = {
            EXTENSION_TOKEN_MISSING: 'Phiên kết nối không tồn tại. Vui lòng kết nối lại.',
            EXTENSION_TOKEN_NOT_FOUND: 'Phiên kết nối không tồn tại. Vui lòng kết nối lại.',
            EXTENSION_TOKEN_INVALID: 'Phiên kết nối không hợp lệ. Vui lòng kết nối lại.',
            EXTENSION_TOKEN_REVOKED: 'Phiên kết nối đã bị thu hồi. Vui lòng kết nối lại.',
            EXTENSION_TOKEN_EXPIRED: 'Phiên kết nối đã hết hạn. Vui lòng kết nối lại.',
          };

          showError(errorMessages[errorCode] || 'Phiên kết nối đã hết hạn. Vui lòng kết nối lại.');

          await chrome.storage.local.remove(config.STORAGE_KEYS.EXTENSION_TOKEN);
          connectionState.token = null;
          connectionState.tokenValid = false;
          connectionState.connected = false;
          updateAuthStatus(false, connectionState.email, false);
          updateArchiveButtonState();
          return;
        }
        showError(data.error?.message || 'Lưu thất bại.');
        return;
      }

      if (data.success) {
        const summary = data.data.summary;
        let summaryText = '';
        if (summary.archived > 0) {
          summaryText += 'Đã lưu ' + summary.archived + ' ảnh. ';
        }
        if (summary.skipped > 0) {
          summaryText += 'Bỏ qua ' + summary.skipped + ' ảnh trùng. ';
        }
        if (summary.failed > 0) {
          summaryText += 'Thất bại ' + summary.failed + ' ảnh.';
        }

        importResultSummary.textContent = summaryText.trim();

        const details = [];
        data.data.results.forEach(function(r) {
          const icon = r.status === 'archived' ? '✓' : r.status === 'skipped' ? '○' : '✗';
          const text = r.status === 'archived'
            ? 'Đã lưu ảnh #' + r.mediaIndex + ' từ post ' + r.postId
            : r.status === 'skipped'
            ? 'Trùng lặp: ảnh #' + r.mediaIndex + ' từ post ' + r.postId
            : 'Thất bại: ảnh #' + r.mediaIndex + ' từ post ' + r.postId;
          details.push({ icon: icon, text: text, status: r.status });
        });

        importResultDetails.replaceChildren();
        details.forEach(function(d) {
          const div = document.createElement('div');
          div.className = 'import-result-item status-' + d.status;
          div.textContent = d.icon + ' ' + d.text;
          importResultDetails.appendChild(div);
        });

        importResultEl.hidden = false;
        resultsEl.hidden = true;
        archiveSection.hidden = true;

        selectedMediaIds.clear();
        setStatus('Hoàn tất!', 'success');
      } else {
        showError(data.error?.message || 'Lưu thất bại.');
      }
    } catch (error) {
      if (error.message && error.message.includes('Failed to fetch')) {
        showError('Không thể kết nối tới ứng dụng.');
      } else {
        showError('Lỗi: ' + (error.message || 'Không xác định'));
      }
    } finally {
      isArchiving = false;
      clearBtn.disabled = false;
      updateArchiveButtonState();
    }
  }

  async function submitConnection() {
    const code = connectCodeInput.value.trim().toUpperCase();
    if (code.length !== 12) {
      connectErrorEl.textContent = 'Mã phải có 12 ký tự.';
      connectErrorEl.hidden = false;
      return;
    }

    submitConnectBtn.disabled = true;

    try {
      const response = await fetch(tokenApiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code })
      });

      const data = await response.json();

      if (!data.success) {
        connectErrorEl.textContent = data.error?.message || 'Mã không hợp lệ hoặc đã hết hạn.';
        connectErrorEl.hidden = false;
        return;
      }

      if (!data.data?.token || typeof data.data.token !== 'string' || data.data.token.length < 10) {
        connectErrorEl.textContent = 'Phản hồi không hợp lệ từ máy chủ.';
        connectErrorEl.hidden = false;
        return;
      }

      connectionState.token = data.data.token;
      connectionState.tokenValid = true;
      await chrome.storage.local.set({
        [config.STORAGE_KEYS.EXTENSION_TOKEN]: connectionState.token
      });

      const sessionResponse = await fetch(sessionApiUrl, {
        credentials: 'include'
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.authenticated && sessionData.user) {
          connectionState.email = sessionData.user.email;
          await chrome.storage.local.set({
            [config.STORAGE_KEYS.AUTH_EMAIL]: connectionState.email
          });
        }
      }

      hideConnectModal();
      updateAuthStatus(true, connectionState.email, true);
      updateSelectedCount();
      setStatus('Đã kết nối thành công!', 'success');

    } catch (error) {
      connectErrorEl.textContent = 'Lỗi kết nối. Vui lòng thử lại.';
      connectErrorEl.hidden = false;
    } finally {
      submitConnectBtn.disabled = !connectCodeInput.value.trim();
    }
  }

  function initEventListeners() {
    collectBtn.addEventListener('click', function() {
      try {
        collectMedia();
      } catch (error) {
        showError('Lỗi khi xử lý: ' + (error.message || 'Không xác định'));
        isCollecting = false;
        updateCollectButtonState();
      }
    });

    clearBtn.addEventListener('click', function() {
      try {
        clearResults();
      } catch (error) {
      }
    });

    connectBtn.addEventListener('click', function() {
      showConnectModal();
    });

    cancelConnectBtn.addEventListener('click', function() {
      hideConnectModal();
    });

    connectCodeInput.addEventListener('input', function() {
      const value = this.value.trim().toUpperCase();
      submitConnectBtn.disabled = value.length !== 12;
      connectErrorEl.hidden = true;
    });

    submitConnectBtn.addEventListener('click', function() {
      try {
        submitConnection();
      } catch (error) {
        connectErrorEl.textContent = 'Lỗi: ' + (error.message || 'Không xác định');
        connectErrorEl.hidden = false;
      }
    });

    selectAllCheckbox.addEventListener('change', function() {
      const cards = resultsList.querySelectorAll('.media-card');
      cards.forEach(function(card) {
        if (card.classList.contains('unsupported')) {
          return;
        }
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.checked = selectAllCheckbox.checked;
        if (selectAllCheckbox.checked) {
          selectedMediaIds.add(card.dataset.itemId);
          card.classList.add('selected');
        } else {
          selectedMediaIds.delete(card.dataset.itemId);
          card.classList.remove('selected');
        }
      });
      updateSelectedCount();
    });

    archiveBtn.addEventListener('click', function() {
      try {
        importSelectedMedia();
      } catch (error) {
        showError('Lỗi khi xử lý: ' + (error.message || 'Không xác định'));
        isArchiving = false;
        clearBtn.disabled = false;
        updateArchiveButtonState();
      }
    });

    closeImportResultBtn.addEventListener('click', function() {
      importResultEl.hidden = true;
      if (currentResults) {
        showResults(currentResults);
      }
    });
  }

  async function init() {
    const hostname = new URL(APP_BASE_URL).hostname;
    envLabel.textContent = 'Ứng dụng: ' + hostname;
    initEventListeners();
    await checkSession();
    const hasResults = await loadSavedResult();
    if (!hasResults) {
      showEmpty();
    }
  }

  init();
})();
