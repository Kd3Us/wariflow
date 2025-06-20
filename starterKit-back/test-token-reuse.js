const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3009';
const TEST_TOKEN = 'your-valid-token-here'; // Remplacez par un vrai token

async function testTokenReuse() {
  console.log('🚀 Testing token reuse across multiple requests...\n');

  try {
    // 1. Première connexion pour valider le token
    console.log('1️⃣ First login to validate token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Login successful:', loginResponse.data.message);

    // 2. Utiliser le même token pour accéder aux données protégées
    console.log('\n2️⃣ Using same token for protected data...');
    const protectedResponse = await axios.get(`${BASE_URL}/protected/data`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Protected data accessed:', protectedResponse.data.message);

    // 3. Utiliser le même token pour le profil
    console.log('\n3️⃣ Using same token for profile...');
    const profileResponse = await axios.get(`${BASE_URL}/protected/profile`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Profile accessed:', profileResponse.data.message);

    // 4. Tester sans token (devrait échouer)
    console.log('\n4️⃣ Testing without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/protected/data`);
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly rejected:', error.response.data.message);
    }

    console.log('\n✨ Token reuse test completed successfully!');

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

testTokenReuse(); 