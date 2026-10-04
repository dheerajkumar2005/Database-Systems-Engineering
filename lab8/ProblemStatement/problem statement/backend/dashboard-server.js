/**
 * Dashboard Server (Provided - do not modify)
 * =============================================
 *
 * This Express + WebSocket server serves the dashboard frontend and acts as
 * a bridge between Kafka topics and the browser.
 *
 * The browser connects via WebSocket and sends a JSON message to subscribe
 * to a Kafka topic:
 *   { "action": "subscribe", "topic": "google_stats" }
 *
 * The server then consumes from that topic and forwards new messages to the
 * browser over the WebSocket connection.
 *
 *
 * Run with:   node dashboard-server.js
 */

const express = require("express");
const http = require("http");
const { WebSocket, WebSocketServer } = require("ws");
const path = require("path");
const { Kafka } = require("kafkajs");
const { KAFKA_BROKER } = require("../config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

let clientIdCounter = 0;

wss.on("connection", (ws) => {
  const clientId = ++clientIdCounter;
  console.log(`Client ${clientId} connected`);

  let activeConsumer = null;
  let isDisconnected = false;

  ws.on("message", async (rawMsg) => {
    try {
      const msg = JSON.parse(rawMsg.toString());

      if (msg.action === "subscribe" && msg.topic) {
        if (activeConsumer) {
          try {
            await activeConsumer.disconnect();
          } catch (e) {}
        }

        const topic = msg.topic;
        console.log(`Client ${clientId} subscribing to topic: ${topic}`);

        const kafka = new Kafka({
          clientId: `dashboard-${clientId}-${Date.now()}`,
          brokers: [KAFKA_BROKER],
        });

        const consumer = kafka.consumer({
          groupId: `dashboard-${clientId}-${Date.now()}`,
        });

        activeConsumer = consumer;

        try {
          await consumer.connect();
          await consumer.subscribe({ topic, fromBeginning: true });

          await consumer.run({
            eachMessage: async ({ message }) => {
              if (isDisconnected) return;
              try {
                const key = message.key ? message.key.toString() : null;
                const value = message.value
                  ? message.value.toString()
                  : null;

                const payload = {
                  topic,
                  key,
                  value: value ? JSON.parse(value) : null,
                  timestamp: message.timestamp,
                };

                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(payload));
                }
              } catch (err) {
                console.error("Error forwarding message:", err.message);
              }
            },
          });

          ws.send(
            JSON.stringify({
              type: "subscribed",
              topic,
              message: `Subscribed to ${topic}`,
            })
          );
        } catch (err) {
          console.error(`Error subscribing to ${topic}:`, err.message);
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Failed to subscribe to ${topic}: ${err.message}`,
            })
          );
        }
      }
    } catch (err) {
      console.error("Error handling WS message:", err.message);
    }
  });

  ws.on("close", async () => {
    isDisconnected = true;
    console.log(`Client ${clientId} disconnected`);
    if (activeConsumer) {
      try {
        await activeConsumer.disconnect();
      } catch (e) {}
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Dashboard server running at http://localhost:${PORT}`);
  console.log("Serving frontend from ../frontend/");
  console.log("WebSocket server ready for topic subscriptions");
});

