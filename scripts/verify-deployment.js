#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = 10000;

console.log('🔍 Verifying Material Management API Deployment...');
console.log(`📍 Base URL: ${API_BASE_URL}`);
console.log('');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TIMEOUT);

    const req = client.request(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    url: `${API_BASE_URL}/health`,
    expectedStatus: 200,
    validate: (data) => data.status === 'healthy' && data.database === 'connected'
  },
  {
    name: 'API Documentation',
    url: `${API_BASE_URL}/api`,
    expectedStatus: 200,
    validate: (data) => data.name === 'Material Management API'
  },
  {
    name: 'Login Endpoint',
    url: `${API_BASE_URL}/api/auth/login`,
    method: 'POST',
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    expectedStatus: 200,
    validate: (data) => data.token && data.user && data.user.role === 'Director'
  },
  {
    name: 'Materials Endpoint (requires auth)',
    url: `${API_BASE_URL}/api/materials`,
    expectedStatus: 401, // Should fail without auth token
    validate: (data) => data.error === 'No token provided' || data.error === 'Unauthorized'
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const options = {
        method: test.method || 'GET',
        headers: test.headers || {},
        body: test.body
      };

      const result = await makeRequest(test.url, options);
      
      if (result.status === test.expectedStatus) {
        if (test.validate && !test.validate(result.data)) {
          console.log(`❌ ${test.name}: Validation failed`);
          console.log(`   Response:`, JSON.stringify(result.data, null, 2));
          failed++;
        } else {
          console.log(`✅ ${test.name}: PASSED`);
          passed++;
        }
      } else {
        console.log(`❌ ${test.name}: Expected status ${test.expectedStatus}, got ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! Your API is ready for production.');
    console.log('');
    console.log('📱 Next steps:');
    console.log('1. Update your mobile app.json with the correct API_BASE_URL');
    console.log('2. Test the mobile app with Expo Go');
    console.log('3. Change default passwords in production');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Please check the logs and fix issues before deploying.');
    process.exit(1);
  }
}

runTests().catch(console.error);
