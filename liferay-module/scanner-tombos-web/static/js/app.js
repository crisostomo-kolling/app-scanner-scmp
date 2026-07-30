(() => {
  'use strict';

  const LS_SHEET_URL = 'scanner.sheetUrl';
  const LS_SHEET_NAME = 'scanner.sheetName';
  const LS_DEVICE_ID = 'scanner.deviceId';
  const LS_DEVICE_LABEL = 'scanner.deviceLabel';
  const LS_QUEUE = 'scanner.queue';
  const LS_HISTORY = 'scanner.history';
  const DUPLICATE_WINDOW_MS = 2500;
  const MAX_HISTORY = 30;

  const el = (id) => document.getElementById(id);

  const els = {
    sheetStatusText: el('sheetStatusText'),
    sheetDetail: el('sheetDetail'),
    btnLinkSheet: el('btnLinkSheet'),
    btnUnlinkSheet: el('btnUnlinkSheet'),
    deviceLabel: el('deviceLabel'),
    btnSaveDevice: el('btnSaveDevice'),
    btnScan: el('btnScan'),
    scanHint: el('scanHint'),
    historyList: el('historyList'),
    pendingBadge: el('pendingBadge'),
    scanOverlay: el('scanOverlay'),
    scanVideo: el('scanVideo'),
    scanFrame: document.querySelector('.scan-frame'),
    scanFeedback: el('scanFeedback'),
    scanCount: el('scanCount'),
    btnCloseScan: el('btnCloseScan'),
    modalOverlay: el('modalOverlay'),
    sheetUrlInput: el('sheetUrlInput'),
    modalError: el('modalError'),
    btnCancelLink: el('btnCancelLink'),
    btnConfirmLink: el('btnConfirmLink'),
    toast: el('toast'),
    connDot: el('connDot'),
  };

  let state = {
    sheetUrl: localStorage.getItem(LS_SHEET_URL) || '',
    sheetName: localStorage.getItem(LS_SHEET_NAME) || '',
    deviceId: localStorage.getItem(LS_DEVICE_ID) || '',
    deviceLabel: localStorage.getItem(LS_DEVICE_LABEL) || '',
    queue: loadJSON(LS_QUEUE, []),
    history: loadJSON(LS_HISTORY, []),
  };

  let stream = null;
  let detector = null;
  let rafId = null;
  let scanning = false;
  let sessionCount = 0;
  let lastCode = '';
  let lastCodeAt = 0;

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureDeviceId() {
    if (!state.deviceId) {
      state.deviceId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())).slice(0, 8);
      localStorage.setItem(LS_DEVICE_ID, state.deviceId);
    }
    if (!state.deviceLabel) {
      const ua = navigator.userAgent || '';
      const match = ua.match(/;\s*([A-Za-z0-9_\-]+)\s+Build\//);
      const model = match ? match[1] : 'Celular';
      state.deviceLabel = `${model}-${state.deviceId}`;
      localStorage.setItem(LS_DEVICE_LABEL, state.deviceLabel);
    }
    els.deviceLabel.value = state.deviceLabel;
  }

  function deviceIdentifier() {
    return state.deviceLabel || state.deviceId;
  }

  // ---------- UI: sheet link status ----------
  function refreshSheetUI() {
    const linked = !!state.sheetUrl;
    els.btnScan.disabled = !linked;
    els.scanHint.textContent = linked
      ? 'Toque para abrir a câmera e ler os códigos de barras'
      : 'Vincule uma planilha para habilitar o scanner';
    els.btnUnlinkSheet.classList.toggle('hidden', !linked);
    if (linked) {
      els.sheetStatusText.textContent = `Vinculado: ${state.sheetName || 'planilha'}`;
      els.sheetDetail.textContent = state.sheetName
        ? `Enviando leituras para "${state.sheetName}"`
        : 'Planilha vinculada';
    } else {
      els.sheetStatusText.textContent = 'Nenhuma planilha vinculada';
      els.sheetDetail.textContent = 'Vincule a planilha do Google Sheets para começar';
    }
  }

  function openModal() {
    els.sheetUrlInput.value = state.sheetUrl || '';
    els.modalError.classList.add('hidden');
    els.modalOverlay.classList.remove('hidden');
    setTimeout(() => els.sheetUrlInput.focus(), 50);
  }
  function closeModal() {
    els.modalOverlay.classList.add('hidden');
  }

  async function validateAndSaveSheet() {
    const url = els.sheetUrlInput.value.trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
      showModalError('Cole a URL completa do Web App (termina em /exec).');
      return;
    }
    els.btnConfirmLink.disabled = true;
    els.btnConfirmLink.textContent = 'Validando...';
    try {
      const res = await fetch(`${url}?action=ping`, { method: 'GET' });
      const data = await res.json();
      if (data.status !== 'ok') throw new Error(data.message || 'Resposta inválida');
      state.sheetUrl = url;
      state.sheetName = data.planilha || '';
      localStorage.setItem(LS_SHEET_URL, url);
      localStorage.setItem(LS_SHEET_NAME, state.sheetName);
      refreshSheetUI();
      closeModal();
      showToast(`Planilha vinculada: ${state.sheetName || 'ok'}`);
      flushQueue();
    } catch (err) {
      showModalError('Não foi possível validar a URL. Verifique se o Apps Script foi publicado como "Aplicativo da Web" com acesso "Qualquer pessoa".');
    } finally {
      els.btnConfirmLink.disabled = false;
      els.btnConfirmLink.textContent = 'Validar e Salvar';
    }
  }

  function showModalError(msg) {
    els.modalError.textContent = msg;
    els.modalError.classList.remove('hidden');
  }

  function unlinkSheet() {
    state.sheetUrl = '';
    state.sheetName = '';
    localStorage.removeItem(LS_SHEET_URL);
    localStorage.removeItem(LS_SHEET_NAME);
    refreshSheetUI();
    showToast('Vínculo removido');
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
  }

  // ---------- History ----------
  function renderHistory() {
    const items = state.history.slice(0, MAX_HISTORY);
    if (!items.length) {
      els.historyList.innerHTML = '<li class="history-empty">Nenhuma leitura ainda</li>';
      return;
    }
    els.historyList.innerHTML = items.map((it) => {
      const time = new Date(it.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusClass = it.status === 'ok' ? 'status-ok' : it.status === 'pending' ? 'status-pending' : 'status-error';
      const statusLabel = it.status === 'ok' ? 'Enviado' : it.status === 'pending' ? 'Pendente' : 'Erro';
      return `<li>
        <span class="history-tombo">${escapeHtml(it.tombo)}</span>
        <span class="history-meta">${time}<span class="history-status ${statusClass}">${statusLabel}</span></span>
      </li>`;
    }).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function addHistoryEntry(entry) {
    state.history.unshift(entry);
    state.history = state.history.slice(0, MAX_HISTORY);
    saveJSON(LS_HISTORY, state.history);
    renderHistory();
  }

  function updateHistoryStatus(id, status) {
    const entry = state.history.find((h) => h.id === id);
    if (entry) {
      entry.status = status;
      saveJSON(LS_HISTORY, state.history);
      renderHistory();
    }
  }

  // ---------- Queue / sending ----------
  function updatePendingBadge() {
    const n = state.queue.length;
    els.pendingBadge.classList.toggle('hidden', n === 0);
    els.pendingBadge.textContent = `${n} pendente${n === 1 ? '' : 's'}`;
  }

  async function sendTombo(tombo) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dataHora = new Date().toISOString();
    const payload = { id, tombo, dataHora, dispositivo: deviceIdentifier() };

    addHistoryEntry({ id, tombo, dataHora, status: 'pending' });
    sessionCount += 1;
    els.scanCount.textContent = `${sessionCount} lido${sessionCount === 1 ? '' : 's'} nesta sessão`;

    const ok = await trySend(payload);
    if (!ok) {
      state.queue.push(payload);
      saveJSON(LS_QUEUE, state.queue);
      updatePendingBadge();
      updateHistoryStatus(id, 'pending');
    } else {
      updateHistoryStatus(id, 'ok');
    }
  }

  async function trySend(payload) {
    if (!state.sheetUrl) return false;
    try {
      const res = await fetch(state.sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  async function flushQueue() {
    if (!state.sheetUrl || !state.queue.length || !navigator.onLine) return;
    const pending = [...state.queue];
    state.queue = [];
    for (const payload of pending) {
      const ok = await trySend(payload);
      if (ok) {
        updateHistoryStatus(payload.id, 'ok');
      } else {
        state.queue.push(payload);
        updateHistoryStatus(payload.id, 'error');
      }
    }
    saveJSON(LS_QUEUE, state.queue);
    updatePendingBadge();
  }

  function updateConnDot() {
    const online = navigator.onLine;
    els.connDot.classList.toggle('offline', !online);
    els.connDot.title = online ? 'Online' : 'Offline';
  }

  // ---------- Barcode scanning ----------
  async function openScanner() {
    if (!('BarcodeDetector' in window)) {
      showToast('Este navegador não suporta leitura de código de barras nativa.');
      return;
    }
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const wanted = ['code_128', 'code_39', 'code_93', 'codabar', 'ean_13', 'ean_8', 'itf', 'upc_a', 'upc_e', 'qr_code'];
      const formats = wanted.filter((f) => supported.includes(f));
      detector = new window.BarcodeDetector({ formats: formats.length ? formats : undefined });
    } catch {
      detector = new window.BarcodeDetector();
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (err) {
      showToast('Não foi possível acessar a câmera. Verifique as permissões.');
      return;
    }

    els.scanVideo.srcObject = stream;
    els.scanOverlay.classList.remove('hidden');
    sessionCount = 0;
    els.scanCount.textContent = '0 lidos nesta sessão';
    scanning = true;
    lastCode = '';
    lastCodeAt = 0;
    detectLoop();
  }

  function closeScanner() {
    scanning = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    els.scanOverlay.classList.add('hidden');
  }

  async function detectLoop() {
    if (!scanning) return;
    try {
      if (els.scanVideo.readyState >= 2) {
        const codes = await detector.detect(els.scanVideo);
        if (codes && codes.length) {
          handleDetected(codes[0].rawValue);
        }
      }
    } catch {
      // ignore transient detection errors
    }
    rafId = requestAnimationFrame(detectLoop);
  }

  function handleDetected(rawValue) {
    const value = (rawValue || '').trim();
    if (!value) return;
    const now = Date.now();
    if (value === lastCode && now - lastCodeAt < DUPLICATE_WINDOW_MS) return;
    lastCode = value;
    lastCodeAt = now;

    if (navigator.vibrate) navigator.vibrate(80);
    els.scanFrame.classList.add('flash');
    setTimeout(() => els.scanFrame.classList.remove('flash'), 220);
    els.scanFeedback.textContent = `Tombo lido: ${value}`;
    clearTimeout(handleDetected._t);
    handleDetected._t = setTimeout(() => { els.scanFeedback.textContent = ''; }, 1600);

    sendTombo(value);
  }

  // ---------- Wire up events ----------
  function init() {
    ensureDeviceId();
    refreshSheetUI();
    renderHistory();
    updatePendingBadge();
    updateConnDot();

    els.btnLinkSheet.addEventListener('click', openModal);
    els.btnCancelLink.addEventListener('click', closeModal);
    els.btnConfirmLink.addEventListener('click', validateAndSaveSheet);
    els.btnUnlinkSheet.addEventListener('click', unlinkSheet);

    els.btnSaveDevice.addEventListener('click', () => {
      const label = els.deviceLabel.value.trim();
      if (!label) return;
      state.deviceLabel = label;
      localStorage.setItem(LS_DEVICE_LABEL, label);
      showToast('Identificação do coletor salva');
    });

    els.btnScan.addEventListener('click', openScanner);
    els.btnCloseScan.addEventListener('click', closeScanner);

    window.addEventListener('online', () => { updateConnDot(); flushQueue(); });
    window.addEventListener('offline', updateConnDot);
    setInterval(flushQueue, 15000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
