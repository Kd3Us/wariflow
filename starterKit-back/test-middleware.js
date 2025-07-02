const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3009'; // Port correct

async function testWithoutToken() {
  try {
    console.log('🧪 Testing /auth/login WITHOUT token...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('❌ Should have failed but got:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Correctly rejected:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

async function testWithInvalidToken() {
  try {
    console.log('\n🧪 Testing /auth/login WITH invalid token...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-123',
      },
    });

    console.log('❌ Should have failed but got:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Correctly rejected invalid token:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

async function testOtherRoute() {
  try {
    console.log('\n🧪 Testing other route (should pass through)...');
    
    const response = await axios.get(`${BASE_URL}/projects`);
    console.log('✅ Other route accessible:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('ℹ️ Other route response:', error.response.status);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Testing middleware behavior...\n');
  
  await testWithoutToken();
  await testWithInvalidToken();
  await testOtherRoute();
  
  console.log('\n✨ Tests completed!');
}

runTests(); 