const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://purveyols-backend.onrender.com';
const TEST_EMAIL = 'accountant@example.com';
const TEST_PASSWORD = '123456';

let token = '';

// Simple HTTP request function
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

console.log('========================================');
console.log('  PURVEYOLS API TEST SUITE');
console.log('========================================');
console.log(`🔗 Backend: ${BACKEND_URL}\n`);

// Test 1: Health Check
async function testHealth() {
  console.log('📋 Test 1: Health Check');
  try {
    const res = await request(`${BACKEND_URL}/api/health`);
    if (res.status === 200) {
      console.log(`   ✅ Backend is healthy: ${res.data.status || 'OK'}`);
      return true;
    } else {
      console.log(`   ❌ Health check failed: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Health check error: ${err.message}`);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  console.log('\n📋 Test 2: Login');
  try {
    const res = await request(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    if (res.status === 200 && res.data.token) {
      token = res.data.token;
      console.log(`   ✅ Login successful`);
      console.log(`   👤 User: ${res.data.user.name} (${res.data.user.role})`);
      return true;
    } else {
      console.log(`   ❌ Login failed: ${res.status} - ${res.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Login error: ${err.message}`);
    return false;
  }
}

// Test 3: Get Workers
async function testGetWorkers() {
  console.log('\n📋 Test 3: Get Workers');
  try {
    const res = await request(`${BACKEND_URL}/api/workers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 200) {
      console.log(`   ✅ Workers fetched: ${Array.isArray(res.data) ? res.data.length : 0}`);
      return true;
    } else {
      console.log(`   ❌ Failed: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Test 4: Get Projects
async function testGetProjects() {
  console.log('\n📋 Test 4: Get Projects');
  try {
    const res = await request(`${BACKEND_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 200) {
      console.log(`   ✅ Projects fetched: ${Array.isArray(res.data) ? res.data.length : 0}`);
      return true;
    } else {
      console.log(`   ❌ Failed: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Test 5: Get Funding Requests
async function testGetFunding() {
  console.log('\n📋 Test 5: Get Funding Requests');
  try {
    const res = await request(`${BACKEND_URL}/api/funding-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 200) {
      console.log(`   ✅ Funding requests fetched: ${Array.isArray(res.data) ? res.data.length : 0}`);
      return true;
    } else {
      console.log(`   ❌ Failed: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Test 6: Get Payments
async function testGetPayments() {
  console.log('\n📋 Test 6: Get Payments');
  try {
    const res = await request(`${BACKEND_URL}/api/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 200) {
      console.log(`   ✅ Payments fetched: ${Array.isArray(res.data) ? res.data.length : 0}`);
      return true;
    } else {
      console.log(`   ❌ Failed: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  const results = [];
  
  results.push(await testHealth());
  const loginOk = await testLogin();
  results.push(loginOk);
  
  if (!loginOk) {
    console.log('\n❌ Cannot continue without login');
    console.log('\n========================================');
    console.log(`📊 Test Summary: ${results.filter(r => r).length}/${results.length} passed`);
    console.log('========================================');
    return;
  }
  
  results.push(await testGetWorkers());
  results.push(await testGetProjects());
  results.push(await testGetFunding());
  results.push(await testGetPayments());
  
  console.log('\n========================================');
  console.log(`📊 Test Summary: ${results.filter(r => r).length}/${results.length} passed`);
  console.log('========================================');
}

runTests();
