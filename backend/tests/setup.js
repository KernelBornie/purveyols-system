const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const getMongoUri = () => {
  const stateFile = path.join(__dirname, '.mongo-test-state.json');
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8')).uri;
  }
  throw new Error('MongoDB test container not started. Run globalSetup first.');
};

const connect = async () => {
  // Reuse existing connection when running tests in-band
  if (mongoose.connection.readyState === 1) return;
  const uri = getMongoUri();
  await mongoose.connect(uri, { directConnection: true });
};

// No-op: the shared connection is closed after all suites complete
const disconnect = async () => {};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clearCollections };
