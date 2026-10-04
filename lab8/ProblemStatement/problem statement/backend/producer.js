const { Kafka } = require("kafkajs");
const {
  KAFKA_BROKER,
  STOCK_DATA_TOPIC,
  INITIAL_STOCK_PRICES,
  JUMP_SIZE,
  TIME_INTERVAL_MS,
} = require("../config");

async function createProducer() {
  // TODO-1: Create and connect a KafkaJS producer, return it
  const kafka = new Kafka({ brokers: [KAFKA_BROKER] });
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

function generateNewPrice(currentPrice, jumpSize) {
  // TODO-2: Return a new price using a uniform random walk in [-jumpSize, +jumpSize];
  //         if the result is negative, return the original price unchanged
  const randomChange = (Math.random() * 2 - 1) * jumpSize;
  const newPrice = currentPrice + randomChange;
  return newPrice < 0 ? currentPrice : newPrice;
} 

async function runProducer() {
  // TODO-3: Every TIME_INTERVAL_MS, pick a random stock, update its price,
  //         and publish { stock, price } to STOCK_DATA_TOPIC with the timestamp as the message key
  const producer = await createProducer();
  const stocks = Object.keys(INITIAL_STOCK_PRICES);
  const prices = { ...INITIAL_STOCK_PRICES };

  setInterval(async () => {
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    prices[randomStock] = generateNewPrice(prices[randomStock], JUMP_SIZE[randomStock]);

    await producer.send({
      topic: STOCK_DATA_TOPIC,
      messages: [
        {
          key: Date.now().toString(),
          value: JSON.stringify({ stock: randomStock, price: prices[randomStock] }),
        },
      ],
    });

    console.log(`Published: ${randomStock} - $${prices[randomStock].toFixed(2)}`);
  }, TIME_INTERVAL_MS);
}

runProducer().catch(console.error);
