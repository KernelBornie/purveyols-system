const { MongoDBContainer } = require('@testcontainers/mongodb');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  const container = await new MongoDBContainer('mongo:7').start();
  const uri = container.getConnectionString();

  // Persist the connection string and container details for globalTeardown
  process.env.__MONGO_URI__ = uri;
  process.env.__MONGO_HOST__ = container.getHost();
  process.env.__MONGO_PORT__ = String(container.getMappedPort(27017));

  // Write to a temp file so globalTeardown can access port info
  fs.writeFileSync(
    path.join(__dirname, '.mongo-test-state.json'),
    JSON.stringify({ uri, host: container.getHost(), port: container.getMappedPort(27017) })
  );

  // Keep the container reference in a global so teardown can stop it
  global.__MONGO_CONTAINER__ = container;
};
