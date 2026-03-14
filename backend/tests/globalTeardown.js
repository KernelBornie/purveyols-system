const fs = require('fs');
const path = require('path');
const { MongoDBContainer } = require('@testcontainers/mongodb');

const stateFile = path.join(__dirname, '.mongo-test-state.json');

module.exports = async function globalTeardown() {
  if (!fs.existsSync(stateFile)) return;

  const { host, port } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  fs.unlinkSync(stateFile);

  // Re-create a reference to the running container so we can stop it
  const { GenericContainer } = require('testcontainers');
  // Use docker to stop the container by name/port - simpler: just let Docker GC handle it
  // since we set ryuk reaper. The container will be stopped automatically.
  // But to be explicit we can use docker CLI:
  const { execSync } = require('child_process');
  try {
    // Find and stop the MongoDB container using the mapped port
    const result = execSync(
      `docker ps --filter "publish=${port}" --format "{{.ID}}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    if (result) {
      execSync(`docker stop ${result}`, { stdio: 'ignore' });
      execSync(`docker rm ${result}`, { stdio: 'ignore' });
    }
  } catch {
    // Best effort cleanup – Ryuk reaper will handle it
  }
};
