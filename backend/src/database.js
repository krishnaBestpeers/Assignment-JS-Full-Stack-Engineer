const { MongoClient } = require('mongodb');

const database = module.exports;

database.connect = async function connect() {
  database.client = new MongoClient('mongodb://127.0.0.1:27017/');
  await database.client.connect();
};
