
const { Kafka } = require("kafkajs");
const {
  KAFKA_BROKER,
  STOCK_DATA_TOPIC,
  CONSUMER_INTERVAL_MS,
} = require("../config");

let stockBuffer = {};

async function createConsumer() {
  // TODO-1: Create, connect, and subscribe a KafkaJS consumer to STOCK_DATA_TOPIC; return it
  const kafka = new Kafka({ brokers: [KAFKA_BROKER] });
  const consumer = kafka.consumer({ groupId: "stock-consumer-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: STOCK_DATA_TOPIC });
  return consumer;
}

async function createStatsProducer() {
  // TODO-2: Create and connect a KafkaJS producer (for publishing stats); return it
  const kafka = new Kafka({ brokers: [KAFKA_BROKER] });
  const producer = kafka.producer();
  await producer.connect();
  return producer;

}

function computeStats(priceEntries) {
  // TODO-3: Compute and return { low, high, mean, opening, closing, mar } from the price entries
  //         MAR = average of |p[i]-p[i-1]| / p[i] for i = 1..n-1
  if (priceEntries.length === 0) return null;
  let low = priceEntries[0].price;
  let high = priceEntries[0].price;
  let sum = 0;
  let marSum = 0;
  for (let i = 0; i < priceEntries.length; i++) {
    const price = priceEntries[i].price;
    if (price < low) low = price;
    if (price > high) high = price;
    sum += price;
    if (i > 0) {
      marSum += Math.abs(price - priceEntries[i - 1].price) / price;
    }
  }
  const mean = sum / priceEntries.length;
  const opening = priceEntries[0].price;
  const closing = priceEntries[priceEntries.length - 1].price;
  const mar = priceEntries.length > 1 ? marSum / (priceEntries.length - 1) : 0;
  return { low, high, mean, opening, closing, mar };
}

async function processAndPublishStats(producer) {
  // TODO-4: For each stock in stockBuffer, compute stats and publish to <stock>_stats topic
  //         with key=timestamp, value=JSON stats object; then clear the buffer
  for (const stock in stockBuffer) {
    const stats = computeStats(stockBuffer[stock]);
    if (stats) {
      const timestamp = new Date().toISOString();
      await producer.send({
        topic: `${stock.toLowerCase()}_stats`,
        messages: [
          {
            key: timestamp,
            value: JSON.stringify(stats),
          },
        ],
      });
      console.log(`Published stats for ${stock} at ${timestamp}`);
    }
  }
  stockBuffer = {};
}

async function runConsumer() {
  const consumer = await createConsumer();
  const statsProducer = await createStatsProducer();

  setInterval(() => {
    processAndPublishStats(statsProducer);
  }, CONSUMER_INTERVAL_MS);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const stock = data.stock;
        const price = data.price;
        const timestamp = message.key
          ? message.key.toString()
          : new Date().toISOString();

        if (!stockBuffer[stock]) {
          stockBuffer[stock] = [];
        }
        stockBuffer[stock].push({ price, timestamp });

        console.log(`Buffered: ${stock} @ $${price}`);
      } catch (err) {
        console.error("Error processing message:", err.message);
      }
    },
  });
}

runConsumer().catch(console.error);
