// Simple test script to test the API
const https = require('https');
const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAPI() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test 1: Create a tenant
    console.log('1. Creating a tenant...');
    const createTenantResponse = await fetch(`${baseURL}/api/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Tenant',
        workers: 3
      })
    });
    
    if (!createTenantResponse.ok) {
      throw new Error(`Failed to create tenant: ${createTenantResponse.status}`);
    }
    
    const tenant = await createTenantResponse.json();
    console.log('✅ Tenant created:', tenant);
    console.log('');
    
    // Test 2: Get all tenants
    console.log('2. Getting all tenants...');
    const getTenantsResponse = await fetch(`${baseURL}/api/tenants`);
    const tenants = await getTenantsResponse.json();
    console.log('✅ Tenants:', tenants);
    console.log('');
    
    // Test 3: Publish a message
    console.log('3. Publishing a message...');
    const publishResponse = await fetch(`${baseURL}/api/tenants/${tenant.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          type: 'test',
          data: {
            message: 'Hello World',
            timestamp: new Date().toISOString()
          }
        }
      })
    });
    
    if (!publishResponse.ok) {
      throw new Error(`Failed to publish message: ${publishResponse.status}`);
    }
    
    const publishResult = await publishResponse.json();
    console.log('✅ Message published:', publishResult);
    console.log('');
    
    // Test 4: Get messages for tenant
    console.log('4. Getting messages for tenant...');
    const getMessagesResponse = await fetch(`${baseURL}/api/messages?tenant_id=${tenant.id}&limit=10`);
    const messages = await getMessagesResponse.json();
    console.log('✅ Messages:', messages);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAPI();