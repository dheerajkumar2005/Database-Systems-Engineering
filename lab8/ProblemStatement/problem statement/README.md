# Kafka Stock Market Lab

A hands-on lab for learning Apache Kafka through a streaming stock market data pipeline using Node.js and chart.js.

## Quick Start

```bash
# 1. Start Kafka (requires Docker)
docker-compose up -d

# 2. Install backend dependencies
cd backend && npm install

# 3. Start the dashboard server
cd backend && node dashboard-server.js

# 4. Open the dashboard
# Visit http://localhost:3000 in your browser
```

After implementing the Kafka functions, also run:

```bash
cd backend
node producer.js    # Terminal 2 — stock price simulator
node consumer.js    # Terminal 3 — statistics processor
```

## Project Structure

```
kafka-stock-lab/
├── problem_statement.md        ← Read this first
├── docker-compose.yml          ← Kafka + Zookeeper + UI (do not modify)
├── config.js                   ← Configuration (provided, at project root)
├── backend/
│   ├── package.json            ← Node.js dependencies
│   ├── dashboard-server.js     ← Express + WebSocket server (provided)
│   ├── producer.js             ← ★ IMPLEMENT THIS (stock simulator)
│   └── consumer.js             ← ★ IMPLEMENT THIS (stats processor)
├── frontend/
│   ├── index.html              ← Dashboard page (provided)
│   └── dashboard.js            ← ★ IMPLEMENT updateMovingAvgChart()
```

## Architecture

```
Producer (simulator) → Kafka [stock_data] → Consumer (stats) → Kafka [*_stats] → Dashboard
```

**Stocks:** Google, Microsoft, Apple, Meta

**Topics:**
- `stock_data` — raw price updates
- `google_stats`, `microsoft_stats`, `apple_stats`, `meta_stats` — per-stock statistics

