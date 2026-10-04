const KAFKA_BROKER = "localhost:9092";

const STOCK_DATA_TOPIC = "stock_data";

const INITIAL_STOCK_PRICES = {
  Google: 180.25,
  Microsoft: 420.50,
  Apple: 195.75,
  Meta: 510.30,
};

const JUMP_SIZE = {
  Google: 2.5,
  Microsoft: 3.0,
  Apple: 2.0,
  Meta: 4.0,
};

const TIME_INTERVAL_MS = 10;

const CONSUMER_INTERVAL_MS = 5 * 1000;

module.exports = {
  KAFKA_BROKER,
  STOCK_DATA_TOPIC,
  INITIAL_STOCK_PRICES,
  JUMP_SIZE,
  TIME_INTERVAL_MS,
  CONSUMER_INTERVAL_MS,
};
