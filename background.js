const ASSET_URL = 'https://example.com';

function toSafeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function canBeVideoElement(video) {
  if (!video) return false;
  const width = Number(video.videoWidth || 0);
  const height = Number(video.videoHeight || 0);
  const isVisible = !!(video.offsetWidth || video.offsetHeight || video.getBoundingClientRect().width || video.getBoundingClientRect().height);
  return width > 120 && height > 80 && isVisible;
}

function findBestVideoCandidate() {
  const videos = Array.from(document.querySelectorAll('video')).filter(canBeVideoElement);
  if (!videos.length) return null;

  const ranked = videos
    .map((video) => {
      const rect = video.getBoundingClientRect();
      const area = (video.videoWidth || 0) * (video.videoHeight || 0);
      const isMain = !!video.currentSrc || !!video.src || area > 0;
      const score = area + (rect.width * rect.height * 0.5) + (video.muted ? 0 : 25000);
      return { score, video };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.video || null;
}

function summarizeCandidate(video) {
  const width = video.videoWidth || 0;
  const height = video.videoHeight || 0;
  return `${width}x${height} video element on ${location.hostname}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id || sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: 'Invalid sender.' });
    return;
  }

  if (message.type === 'INSPECT_PAGE') {
    const candidate = findBestVideoCandidate();
    if (!candidate) {
      sendResponse({ ok: false, error: 'No suitable main video was found.' });
      return;
    }

    sendResponse({ ok: true, summary: summarizeCandidate(candidate) });
    return;
  }

  if (message.type === 'CAPTURE_START') {
    const candidate = findBestVideoCandidate();
    if (!candidate) {
      sendResponse({ ok: false, error: 'No suitable main video was found.' });
      return;
    }

    const stream = candidate.captureStream ? candidate.captureStream() : null;
    if (!stream) {
      sendResponse({ ok: false, error: 'captureStream() is not available for this media element.' });
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({ url, filename: 'main-video-capture.webm', saveAs: true });
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 3000);

    sendResponse({ ok: true, outputPath: 'main-video-capture.webm', summary: summarizeCandidate(candidate) });
    return;
  }

  if (message.type === 'FALLBACK_CONSENT') {
    chrome.tabCapture.capture({ audio: true, video: true }, (stream) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }

      if (!stream) {
        sendResponse({ ok: false, error: 'No tab capture stream returned.' });
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({ url, filename: 'fallback-capture.webm', saveAs: true });
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000);
      sendResponse({ ok: true, outputPath: 'fallback-capture.webm' });
    });

    return true;
  }

  sendResponse({ ok: false, error: 'Unsupported message.' });
});
