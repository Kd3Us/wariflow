const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3009';
const TEST_TOKEN = 'your-valid-token-here'; // Remplacez par un vrai token

async function testTeamsAuthentication() {
  console.log('🚀 Testing teams routes authentication...\n');

  try {
    // 1. Test sans token (devrait échouer)
    console.log('1️⃣ Testing /teams WITHOUT token (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/teams`);
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    }

    // 2. Test avec token invalide (devrait échouer)
    console.log('\n2️⃣ Testing /teams WITH invalid token (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/teams`, {
        headers: {
          'Authorization': 'Bearer invalid-token-123',
        },
      });
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected invalid token:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    }

    // 3. Test avec token valide (devrait réussir)
    console.log('\n3️⃣ Testing /teams WITH valid token (should succeed)...');
    const teamsResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Teams accessed successfully:', {
      status: teamsResponse.status,
      data: teamsResponse.data,
    });

    // 4. Test route spécifique avec token valide
    console.log('\n4️⃣ Testing /teams/:id WITH valid token...');
    const teamResponse = await axios.get(`${BASE_URL}/teams/team-1`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Specific team accessed:', {
      status: teamResponse.status,
      data: teamResponse.data,
    });

    // 5. Test route spécifique sans token (devrait échouer)
    console.log('\n5️⃣ Testing /teams/:id WITHOUT token (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/teams/team-1`);
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    }

    console.log('\n✨ Teams authentication test completed successfully!');

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

testTeamsAuthentication(); 