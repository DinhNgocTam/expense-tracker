/**
 * X Media Collector - Popup Script
 * Handles user interactions and communicates with the content script.
 */

(function() {
  if (!globalThis.X_MEDIA_CONFIG?.APP_BASE_URL) {
    throw new Error("X Media Collector: APP_BASE_URL is not configured in config.js");
  }

  const APP_BASE_URL = X_MEDIA_CONFIG.APP_BASE_URL;

  const connectApiUrl = new URL(X_MEDIA_CONFIG.API_CONNECT, APP_BASE_URL).toString();
  const sessionApiUrl = new URL(X_MEDIA_CONFIG.API_SESSION, APP_BASE_URL).toString();
  const importApiUrl = new URL(X_MEDIA_CONFIG.API_IMPORT, APP_BASE_URL).toString();
  const connectPageUrl = new URL("/x-media/extension-connect", APP_BASE_URL).toString();
  const galleryUrl = new URL("/x-media", APP_BASE_URL).toString();

  console.debug("[X Media Collector] App base URL:", APP_BASE_URL);
  console.debug("[X Media Collector] Connect endpoint:", connectApiUrl);
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
  let selectedItems = new Set();
  let extensionToken = null;
  let authEmail = null;

  function setStatus(message, type) {
    statusText.textContent = message;
    statusEl.className = 'status ' + (type || '');
  }

  function showError(message) {
    errorText.textContent = message;
    errorState.hidden = false;
    resultsEl.hidden = true;
    emptyState.hidden = true;
    staleWarning.hidden = true;
    archiveSection.hidden = true;
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

  function updateAuthStatus(connected, email) {
    if (connected && email) {
      authStatus.className = 'auth-status connected';
      authStatusText.textContent = email;
      connectBtn.textContent = 'Đổi tài khoản';
      collectBtn.disabled = false;
    } else {
      authStatus.className = 'auth-status disconnected';
      authStatusText.textContent = 'Chưa kết nối';
      connectBtn.textContent = 'Kết nối';
      collectBtn.disabled = true;
      extensionToken = null;
      authEmail = null;
    }
  }

  function updateSelectedCount() {
    const count = selectedItems.size;
    if (count > 0) {
      selectedCountEl.textContent = 'Đã chọn: ' + count;
      archiveBtn.disabled = !extensionToken;
    } else {
      selectedCountEl.textContent = '';
      archiveBtn.disabled = true;
    }
  }

  function showResults(data) {
    hideError();
    hideEmpty();
    resultsEl.hidden = false;
    staleWarning.hidden = false;
    importResultEl.hidden = true;

    currentResults = data;
    selectedItems.clear();
    updateSelectedCount();

    resultsSummary.textContent = 'Đã tìm thấy ' + data.count + ' ảnh';

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
    card.dataset.itemId = item.mediaUrl;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'media-checkbox';
    checkbox.checked = selectedItems.has(item.mediaUrl);
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        selectedItems.add(item.mediaUrl);
        card.classList.add('selected');
      } else {
        selectedItems.delete(item.mediaUrl);
        card.classList.remove('selected');
      }
      updateSelectedCount();
    });

    const thumbnail = document.createElement('img');
    thumbnail.className = 'media-thumbnail';
    thumbnail.src = item.previewUrl || item.mediaUrl;
    thumbnail.alt = item.altText || 'Media thumbnail';
    thumbnail.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'media-info';

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

    const imageLink = document.createElement('a');
    imageLink.className = 'media-link';
    imageLink.href = item.mediaUrl;
    imageLink.textContent = 'Mở ảnh gốc';
    imageLink.target = '_blank';
    imageLink.rel = 'noreferrer noopener';
    links.appendChild(imageLink);

    info.appendChild(links);
    card.appendChild(checkbox);
    card.appendChild(thumbnail);
    card.appendChild(info);

    return card;
  }

  function setButtonsEnabled(enabled) {
    collectBtn.disabled = !enabled || !extensionToken;
    clearBtn.disabled = !enabled;
    archiveBtn.disabled = !enabled || selectedItems.size === 0 || !extensionToken;
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
      const response = await fetch(sessionApiUrl, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user && data.user.email) {
          const storedToken = await getStoredToken();
          if (storedToken) {
            extensionToken = storedToken;
            authEmail = data.user.email;
            updateAuthStatus(true, authEmail);
            return;
          }
        }
      }
    } catch (e) {
    }
    updateAuthStatus(false);
  }

  async function getStoredToken() {
    try {
      const result = await chrome.storage.local.get(X_MEDIA_CONFIG.STORAGE_KEYS.EXTENSION_TOKEN);
      return result[X_MEDIA_CONFIG.STORAGE_KEYS.EXTENSION_TOKEN] || null;
    } catch (e) {
      return null;
    }
  }

  async function loadSavedResult() {
    try {
      const result = await chrome.storage.local.get(X_MEDIA_CONFIG.STORAGE_KEYS.LAST_RESULT);
      if (result && result[X_MEDIA_CONFIG.STORAGE_KEYS.LAST_RESULT]) {
        const data = result[X_MEDIA_CONFIG.STORAGE_KEYS.LAST_RESULT];
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
      await chrome.storage.local.remove(X_MEDIA_CONFIG.STORAGE_KEYS.LAST_RESULT);
    } catch (e) {
    }
    resultsEl.hidden = true;
    staleWarning.hidden = true;
    showEmpty();
    clearBtn.disabled = true;
    setStatus('');
    selectedItems.clear();
    currentResults = null;
    archiveSection.hidden = true;
    importResultEl.hidden = true;
    updateSelectedCount();
  }

  async function collectMedia() {
    hideError();
    importResultEl.hidden = true;
    setStatus('Đang thu thập...', 'loading');
    setButtonsEnabled(false);

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      if (!tabs || tabs.length === 0) {
        showError('Không tìm thấy tab đang hoạt động.');
        setButtonsEnabled(true);
        return;
      }

      const tab = tabs[0];

      if (!tab.url) {
        showError('Không thể đọc URL của tab.');
        setButtonsEnabled(true);
        return;
      }

      let hostname;
      try {
        hostname = new URL(tab.url).hostname;
      } catch {
        showError('URL của tab không hợp lệ.');
        setButtonsEnabled(true);
        return;
      }

      if (!isValidHostname(hostname)) {
        showError('Vui lòng mở trang X hoặc Twitter để thu thập ảnh.');
        setButtonsEnabled(true);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'COLLECT_VISIBLE_X_MEDIA'
      });

      if (!response) {
        showError('Content script chưa được tải. Vui lòng tải lại trang X.');
        setButtonsEnabled(true);
        return;
      }

      if (!response.success) {
        showError(response.error || 'Thu thập thất bại.');
        setButtonsEnabled(true);
        return;
      }

      if (response.count === 0) {
        setStatus('Không tìm thấy ảnh nào trên trang.', 'error');
        resultsEl.hidden = true;
        staleWarning.hidden = true;
        emptyState.hidden = false;
        archiveSection.hidden = true;
      } else {
        await chrome.storage.local.set({
          [X_MEDIA_CONFIG.STORAGE_KEYS.LAST_RESULT]: response
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
      setButtonsEnabled(true);
    }
  }

  async function importSelectedMedia() {
    if (!currentResults || selectedItems.size === 0 || !extensionToken) {
      return;
    }

    setStatus('Đang lưu...', 'loading');
    setButtonsEnabled(false);

    const selectedMedia = currentResults.media.filter(function(item) {
      return selectedItems.has(item.mediaUrl);
    });

    const importPayload = {
      items: selectedMedia.map(function(item) {
        return {
          postId: item.postId,
          postUrl: item.postUrl,
          authorUsername: item.authorUsername,
          caption: item.caption,
          mediaIndex: item.mediaIndex,
          mediaType: 'image',
          mediaUrl: item.mediaUrl,
          altText: item.altText
        };
      })
    };

    try {
      const response = await fetch(importApiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + extensionToken
        },
        body: JSON.stringify(importPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showError('Token hết hạn. Vui lòng kết nối lại.');
          extensionToken = null;
          updateAuthStatus(false);
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

        selectedItems.clear();
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
      setButtonsEnabled(true);
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
      const response = await fetch(connectApiUrl, {
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

      extensionToken = data.data.token;
      await chrome.storage.local.set({
        [X_MEDIA_CONFIG.STORAGE_KEYS.EXTENSION_TOKEN]: extensionToken
      });

      const sessionResponse = await fetch(sessionApiUrl, {
        credentials: 'include'
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.authenticated && sessionData.user) {
          authEmail = sessionData.user.email;
          await chrome.storage.local.set({
            [X_MEDIA_CONFIG.STORAGE_KEYS.AUTH_EMAIL]: authEmail
          });
        }
      }

      hideConnectModal();
      updateAuthStatus(true, authEmail);
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
        setButtonsEnabled(true);
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
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.checked = selectAllCheckbox.checked;
        if (selectAllCheckbox.checked) {
          selectedItems.add(card.dataset.itemId);
          card.classList.add('selected');
        } else {
          selectedItems.delete(card.dataset.itemId);
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
        setButtonsEnabled(true);
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
