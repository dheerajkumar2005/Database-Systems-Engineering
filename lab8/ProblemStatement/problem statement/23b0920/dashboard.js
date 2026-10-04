// ============================================================================
// Global state
// ============================================================================
let ws = null;
let allStatsData = [];
let movingAvgChart = null;
let candleChart = null;
let updateInterval = null;

const MOVING_AVG_WINDOW_SEC = 25;
const UPDATE_INTERVAL_MS = 20000;

// ============================================================================
// WebSocket connection
// ============================================================================
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    setStatus(true);
    addLog("Connected to dashboard server", "info");
  };

  ws.onclose = () => {
    setStatus(false);
    addLog("Disconnected from server", "error");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => {
    addLog("WebSocket error", "error");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "subscribed") {
        addLog(data.message, "info");
        return;
      }
      if (data.type === "error") {
        addLog(data.message, "error");
        return;
      }

      handleTopicMessage(data);
    } catch (err) {
      addLog("Error parsing message: " + err.message, "error");
    }
  };
}

function setStatus(connected) {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  if (connected) {
    dot.classList.add("connected");
    text.textContent = "Connected";
  } else {
    dot.classList.remove("connected");
    text.textContent = "Disconnected";
  }
}

// ============================================================================
// Topic subscription
// ============================================================================
function subscribeTopic() {
  const topic = document.getElementById("topicSelect").value;
  if (!topic) {
    addLog("Please select a topic first", "error");
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog("Not connected to server", "error");
    return;
  }

  allStatsData = [];
  resetCharts();

  ws.send(JSON.stringify({ action: "subscribe", topic }));
  addLog(`Subscribing to topic: ${topic}`, "info");

  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    refreshCharts();
  }, UPDATE_INTERVAL_MS);
}

// ============================================================================
// Message handler
// ============================================================================
function handleTopicMessage(data) {
  const topic = data.topic || "";
  const value = data.value;
  const key = data.key;

  if (topic === "stock_data") {
    addLog(`${value.stock}: $${value.price}`, "stat");
    return;
  }

  if (topic.endsWith("_stats") && value) {
    const timestamp = key || new Date().toISOString();
    const entry = {
      time: new Date(timestamp),
      low: value.low,
      high: value.high,
      mean: value.mean,
      opening: value.opening,
      closing: value.closing,
      mar: value.mar,
    };
    allStatsData.push(entry);

    updateStatsBar(entry);
    addLog(
      `Stats: O=${entry.opening} H=${entry.high} L=${entry.low} C=${entry.closing} MAR=${entry.mar}`,
      "stat"
    );

    refreshCharts();
  }
}

// ============================================================================
// Stats bar
// ============================================================================
function updateStatsBar(entry) {
  document.getElementById("statLow").textContent = "$" + entry.low.toFixed(2);
  document.getElementById("statHigh").textContent =
    "$" + entry.high.toFixed(2);
  document.getElementById("statMean").textContent =
    "$" + entry.mean.toFixed(2);
  document.getElementById("statOpening").textContent =
    "$" + entry.opening.toFixed(2);
  document.getElementById("statClosing").textContent =
    "$" + entry.closing.toFixed(2);
  document.getElementById("statMAR").textContent = entry.mar.toFixed(4);
}

// ============================================================================
// Charts initialization
// ============================================================================
function initCharts() {
  const movingAvgCtx = document
    .getElementById("movingAvgChart")
    .getContext("2d");
  movingAvgChart = new Chart(movingAvgCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Moving Avg (mean)",
          data: [],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#38bdf8",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#94a3b8", maxTicksLimit: 10 },
          grid: { color: "#1e293b" },
        },
        y: {
          ticks: { color: "#94a3b8" },
          grid: { color: "#1e293b" },
          title: { display: true, text: "Price ($)", color: "#94a3b8" },
        },
      },
      plugins: {
        legend: { labels: { color: "#e2e8f0" } },
      },
    },
  });

  const candleCtx = document.getElementById("candleChart").getContext("2d");
  candleChart = new Chart(candleCtx, {
    type: "candlestick",
    data: {
      datasets: [
        {
          label: "OHLC",
          data: [],
          color: {
            up: "#22c55e",
            down: "#ef4444",
            unchanged: "#94a3b8",
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "timeseries",
          ticks: { color: "#94a3b8" },
          grid: { color: "#1e293b" },
        },
        y: {
          ticks: { color: "#94a3b8" },
          grid: { color: "#1e293b" },
          title: { display: true, text: "Price ($)", color: "#94a3b8" },
        },
      },
      plugins: {
        legend: { labels: { color: "#e2e8f0" } },
      },
    },
  });
}

function resetCharts() {
  if (movingAvgChart) {
    movingAvgChart.data.labels = [];
    movingAvgChart.data.datasets[0].data = [];
    movingAvgChart.update();
  }
  if (candleChart) {
    candleChart.data.datasets[0].data = [];
    candleChart.update();
  }
  document.getElementById("statLow").textContent = "--";
  document.getElementById("statHigh").textContent = "--";
  document.getElementById("statMean").textContent = "--";
  document.getElementById("statOpening").textContent = "--";
  document.getElementById("statClosing").textContent = "--";
  document.getElementById("statMAR").textContent = "--";
}

// ============================================================================
// Chart refresh (called every UPDATE_INTERVAL_MS = 20 seconds)
// ============================================================================
function refreshCharts() {
  updateMovingAvgChart();
  updateCandleChart();
}

// ============================================================================
// SOLUTION: Moving Average Plot update
// ============================================================================
function updateMovingAvgChart() {
  if (!movingAvgChart || allStatsData.length === 0) return;

  const cutoff = new Date(Date.now() - MOVING_AVG_WINDOW_SEC * 1000);
  const recent = allStatsData.filter((e) => e.time >= cutoff);
  if (recent.length === 0) return;

  const labels = [];
  const avgValues = [];
  let sum = 0;

  for (let i = 0; i < recent.length; i++) {
    sum += recent[i].mean;
    labels.push(recent[i].time.toLocaleTimeString());
    avgValues.push(sum / (i + 1));
  }

  movingAvgChart.data.labels = labels;
  movingAvgChart.data.datasets[0].data = avgValues;
  movingAvgChart.update();
}

// ============================================================================
// Candlestick Chart update (provided - do not modify)
// ============================================================================
function updateCandleChart() {
  if (!candleChart || allStatsData.length === 0) return;

  const candleData = allStatsData.map((entry) => ({
    x: entry.time.getTime(),
    o: entry.opening,
    h: entry.high,
    l: entry.low,
    c: entry.closing,
  }));

  candleChart.data.datasets[0].data = candleData;
  candleChart.update();
}

// ============================================================================
// Logging
// ============================================================================
function addLog(message, type = "") {
  const logDiv = document.getElementById("log");
  const entry = document.createElement("div");
  entry.className = "log-entry" + (type ? " " + type : "");
  const time = new Date().toLocaleTimeString();
  entry.textContent = `[${time}] ${message}`;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;

  while (logDiv.children.length > 200) {
    logDiv.removeChild(logDiv.firstChild);
  }
}

// ============================================================================
// Initialization
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  initCharts();
  connectWebSocket();
});
