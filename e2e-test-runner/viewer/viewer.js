/**
 * E2E Test Dashboard - WebSocket Client
 * 集約サーバーからフレームとステータスを受信してUIを更新
 */

const WS_URL = 'ws://localhost:8080';
const RECONNECT_INTERVAL = 3000;

let ws = null;
let reconnectTimer = null;
const scenarioNames = {};

/**
 * WebSocket接続を確立
 */
function connect() {
  updateConnectionStatus('connecting');

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('Connected to aggregator');
    updateConnectionStatus('connected');
    clearReconnectTimer();
  };

  ws.onmessage = event => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from aggregator');
    updateConnectionStatus('disconnected');
    scheduleReconnect();
  };

  ws.onerror = error => {
    console.error('WebSocket error:', error);
    updateConnectionStatus('disconnected');
  };
}

/**
 * 再接続をスケジュール
 */
function scheduleReconnect() {
  if (!reconnectTimer) {
    reconnectTimer = setInterval(() => {
      console.log('Attempting to reconnect...');
      connect();
    }, RECONNECT_INTERVAL);
  }
}

/**
 * 再接続タイマーをクリア
 */
function clearReconnectTimer() {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * 接続状態を更新
 */
function updateConnectionStatus(status) {
  const el = document.getElementById('connection-status');
  el.className = status;

  switch (status) {
    case 'connected':
      el.textContent = 'Connected';
      break;
    case 'disconnected':
      el.textContent = 'Disconnected';
      break;
    case 'connecting':
      el.textContent = 'Connecting...';
      break;
  }
}

/**
 * メッセージを処理
 */
function handleMessage(message) {
  const { type, sessionId } = message;

  switch (type) {
    case 'frame':
      updateFrame(sessionId, message.data);
      break;
    case 'status':
      updateStatus(sessionId, message.status);
      break;
    case 'error':
      showError(sessionId, message.error);
      break;
  }
}

/**
 * フレーム画像を更新
 */
function updateFrame(sessionId, base64Data) {
  const img = document.getElementById(`frame-${sessionId}`);
  const noFrame = document.getElementById(`noframe-${sessionId}`);
  const panel = document.getElementById(`panel-${sessionId}`);

  if (img && noFrame) {
    img.src = `data:image/jpeg;base64,${base64Data}`;
    img.style.display = 'block';
    noFrame.style.display = 'none';

    // パネルをアクティブに
    if (panel && !panel.classList.contains('completed') && !panel.classList.contains('failed')) {
      panel.classList.add('active');
    }
  }
}

/**
 * セッション状態を更新
 */
function updateStatus(sessionId, status) {
  const statusEl = document.getElementById(`status-${sessionId}`);
  const progressEl = document.getElementById(`progress-${sessionId}`);
  const scenarioEl = document.getElementById(`scenario-${sessionId}`);
  const panel = document.getElementById(`panel-${sessionId}`);
  const errorEl = document.getElementById(`error-${sessionId}`);

  // ステータスバッジを更新
  if (statusEl) {
    statusEl.textContent = capitalizeFirst(status.status);
    statusEl.className = `session-status ${status.status}`;
  }

  // 進捗を更新
  if (progressEl) {
    if (status.status === 'running') {
      progressEl.textContent = `Step ${status.currentStep} / ${status.totalSteps}`;
    } else if (status.status === 'completed') {
      progressEl.textContent = `${status.totalSteps} steps completed`;
    } else if (status.status === 'failed') {
      progressEl.textContent = `Failed at step ${status.currentStep}`;
    } else {
      progressEl.textContent = `${status.totalSteps} steps`;
    }
  }

  // シナリオ名を保存・表示
  if (status.scenarioName) {
    scenarioNames[sessionId] = status.scenarioName;
  }
  if (scenarioEl && scenarioNames[sessionId]) {
    scenarioEl.textContent = scenarioNames[sessionId];
  }

  // パネルのスタイルを更新
  if (panel) {
    panel.classList.remove('active', 'completed', 'failed');
    if (status.status === 'running') {
      panel.classList.add('active');
    } else if (status.status === 'completed') {
      panel.classList.add('completed');
    } else if (status.status === 'failed') {
      panel.classList.add('failed');
    }
  }

  // エラー表示
  if (errorEl) {
    if (status.error) {
      errorEl.textContent = status.error;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }
}

/**
 * エラーを表示
 */
function showError(sessionId, error) {
  const errorEl = document.getElementById(`error-${sessionId}`);
  const panel = document.getElementById(`panel-${sessionId}`);

  if (errorEl) {
    errorEl.textContent = error;
    errorEl.style.display = 'block';
  }

  if (panel) {
    panel.classList.add('failed');
  }

  console.error(`[${sessionId}] Error:`, error);
}

/**
 * 文字列の先頭を大文字に
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 接続開始
connect();
