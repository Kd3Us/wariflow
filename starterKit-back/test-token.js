const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3009'; // Port correct
const TEST_TOKEN = 'your-test-token-here'; // Remplacez par un vrai token

async function testTokenVerification() {
  try {
    console.log('🧪 Testing token verification...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Test sans token
async function testWithoutToken() {
  try {
    console.log('\n🧪 Testing without token...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Starting token verification tests...\n');
  
  await testTokenVerification();
  await testWithoutToken();
  
  console.log('\n✨ Tests completed!');
}

runTests(); 