(function () {
  const messageEl = document.getElementById('message');
  const tabNameEl = document.getElementById('tab-name');
  const videoStatusEl = document.getElementById('video-status');

  function setMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#fca5a5' : '#cbd5e1';
  }

  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  async function inspectPage() {
    const tab = await getCurrentTab();
    if (!tab?.id) {
      setMessage('No active tab available.', true);
      return;
    }

    tabNameEl.textContent = tab.title || 'Current tab';

    chrome.tabs.sendMessage(tab.id, { type: 'INSPECT_PAGE' }, (resp) => {
      if (chrome.runtime.lastError) {
        setMessage('Could not inspect the page. Please reload the tab and try again.', true);
        return;
      }

      if (resp?.ok) {
        videoStatusEl.textContent = resp.summary || 'A valid main video was detected.';
        setMessage('Inspection complete.');
      } else {
        videoStatusEl.textContent = 'No main video detected.';
        setMessage(resp?.error || 'No suitable main video detected for this page.', true);
      }
    });
  }

  async function captureCurrentTab() {
    const tab = await getCurrentTab();
    if (!tab?.id) {
      setMessage('No active tab available.', true);
      return;
    }

    setMessage('Starting capture…');
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_START',
      tabId: tab.id,
      tier: 'SOURCE_FIRST',
      quality: 'balanced'
    });

    if (!response?.ok) {
      setMessage(response?.error || 'Capture failed.', true);
      return;
    }

    videoStatusEl.textContent = response.outputPath ? `Saved: ${response.outputPath}` : 'Capture completed.';
    setMessage('Capture started successfully.');
  }

  async function triggerFallback() {
    const tab = await getCurrentTab();
    if (!tab?.id) {
      setMessage('No active tab available.', true);
      return;
    }

    const granted = await chrome.permissions.request({ permissions: ['tabCapture'] });
    if (!granted) {
      setMessage('Tab capture permission was not granted.', true);
      return;
    }

    setMessage('Fallback capture requested.');
    const response = await chrome.runtime.sendMessage({
      type: 'FALLBACK_CONSENT',
      tabId: tab.id,
      approved: true
    });

    if (!response?.ok) {
      setMessage(response?.error || 'Fallback capture failed.', true);
      return;
    }

    videoStatusEl.textContent = response.outputPath ? `Saved: ${response.outputPath}` : 'Fallback capture completed.';
    setMessage('Fallback capture completed.');
  }

  document.getElementById('inspectBtn').addEventListener('click', inspectPage);
  document.getElementById('captureBtn').addEventListener('click', captureCurrentTab);
  document.getElementById('fallbackBtn').addEventListener('click', triggerFallback);

  getCurrentTab().then((tab) => {
    tabNameEl.textContent = tab?.title || 'Current tab';
    setMessage('Ready.');
  });
})();
