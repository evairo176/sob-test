// Debug script untuk test tenant system
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function debugTenant() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('🔍 Debug Tenant System\n');
    
    // 1. Get all tenants
    console.log('1. Getting all tenants...');
    const tenantsResponse = await makeRequest(`${baseURL}/api/tenants`);
    console.log('Status:', tenantsResponse.status);
    console.log('Tenants:', JSON.stringify(tenantsResponse.data, null, 2));
    
    if (tenantsResponse.data.length === 0) {
      console.log('\n❌ No tenants found. Please create a tenant first.');
      return;
    }
    
    const tenantId = tenantsResponse.data[0].id;
    console.log(`\n🎯 Using tenant ID: ${tenantId}\n`);
    
    // 2. Check consumer status
    console.log('2. Checking consumer status...');
    const consumerResponse = await makeRequest(`${baseURL}/api/tenants/${tenantId}/consumer-status`);
    console.log('Status:', consumerResponse.status);
    console.log('Consumer Status:', JSON.stringify(consumerResponse.data, null, 2));
    
    // 3. Get all consumers status
    console.log('\n3. Getting all consumers status...');
    const allConsumersResponse = await makeRequest(`${baseURL}/api/tenants/debug/consumers`);
    console.log('Status:', allConsumersResponse.status);
    console.log('All Consumers:', JSON.stringify(allConsumersResponse.data, null, 2));
    
    // 4. Publish a test message
    console.log('\n4. Publishing test message...');
    const publishResponse = await makeRequest(`${baseURL}/api/tenants/${tenantId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          type: 'debug-test',
          message: 'Debug test message',
          timestamp: new Date().toISOString()
        }
      })
    });
    console.log('Status:', publishResponse.status);
    console.log('Publish Result:', JSON.stringify(publishResponse.data, null, 2));
    
    // 5. Wait a bit and check messages
    console.log('\n5. Waiting 2 seconds then checking messages...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const messagesResponse = await makeRequest(`${baseURL}/api/messages?tenant_id=${tenantId}&limit=5`);
    console.log('Status:', messagesResponse.status);
    console.log('Messages:', JSON.stringify(messagesResponse.data, null, 2));
    
    // 6. Test concurrency update
    console.log('\n6. Testing concurrency update...');
    const concurrencyResponse = await makeRequest(`${baseURL}/api/tenants/${tenantId}/config/concurrency`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workers: 5
      })
    });
    console.log('Status:', concurrencyResponse.status);
    console.log('Concurrency Update Result:', JSON.stringify(concurrencyResponse.data, null, 2));
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugTenant();