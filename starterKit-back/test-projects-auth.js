const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3009';
const TEST_TOKEN = 'your-valid-token-here'; // Remplacez par un vrai token

async function testProjectsAuthentication() {
  console.log('🚀 Testing projects routes authentication...\n');

  try {
    // 1. Test GET /projects sans token (devrait échouer)
    console.log('1️⃣ Testing GET /projects WITHOUT token (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/projects`);
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    }

    // 2. Test GET /projects avec token valide (devrait réussir)
    console.log('\n2️⃣ Testing GET /projects WITH valid token (should succeed)...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Projects accessed successfully:', {
      status: projectsResponse.status,
      dataLength: projectsResponse.data.length,
    });

    // 3. Test GET /projects/by-stage avec token valide
    console.log('\n3️⃣ Testing GET /projects/by-stage WITH valid token...');
    const byStageResponse = await axios.get(`${BASE_URL}/projects/by-stage`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Projects by stage accessed:', {
      status: byStageResponse.status,
      stages: Object.keys(byStageResponse.data),
    });

    // 4. Test GET /projects/upcoming-deadlines avec token valide
    console.log('\n4️⃣ Testing GET /projects/upcoming-deadlines WITH valid token...');
    const deadlinesResponse = await axios.get(`${BASE_URL}/projects/upcoming-deadlines`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Upcoming deadlines accessed:', {
      status: deadlinesResponse.status,
      dataLength: deadlinesResponse.data.length,
    });

    // 5. Test GET /projects/active-reminders avec token valide
    console.log('\n5️⃣ Testing GET /projects/active-reminders WITH valid token...');
    const remindersResponse = await axios.get(`${BASE_URL}/projects/active-reminders`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Active reminders accessed:', {
      status: remindersResponse.status,
      dataLength: remindersResponse.data.length,
    });

    // 6. Test POST /projects avec token valide
    console.log('\n6️⃣ Testing POST /projects WITH valid token...');
    const newProject = {
      title: 'Test Project',
      description: 'Test project description',
      stage: 'IDEE',
      progress: 0,
      deadline: '2024-12-31T00:00:00.000Z',
      priority: 'MEDIUM',
      tags: ['test', 'auth'],
    };
    
    const createResponse = await axios.post(`${BASE_URL}/projects`, newProject, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Project created:', {
      status: createResponse.status,
      projectId: createResponse.data.id,
    });

    // 7. Test GET /projects/:id avec token valide
    console.log('\n7️⃣ Testing GET /projects/:id WITH valid token...');
    const projectId = createResponse.data.id;
    const singleProjectResponse = await axios.get(`${BASE_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Single project accessed:', {
      status: singleProjectResponse.status,
      projectTitle: singleProjectResponse.data.title,
    });

    // 8. Test PUT /projects/:id avec token valide
    console.log('\n8️⃣ Testing PUT /projects/:id WITH valid token...');
    const updateData = {
      title: 'Updated Test Project',
      description: 'Updated description',
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/projects/${projectId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Project updated:', {
      status: updateResponse.status,
      newTitle: updateResponse.data.title,
    });

    // 9. Test PATCH /projects/:id/stage avec token valide
    console.log('\n9️⃣ Testing PATCH /projects/:id/stage WITH valid token...');
    const stageUpdateResponse = await axios.patch(`${BASE_URL}/projects/${projectId}/stage`, {
      stage: 'MVP',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Project stage updated:', {
      status: stageUpdateResponse.status,
      newStage: stageUpdateResponse.data.stage,
    });

    // 10. Test DELETE /projects/:id avec token valide
    console.log('\n🔟 Testing DELETE /projects/:id WITH valid token...');
    const deleteResponse = await axios.delete(`${BASE_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    });
    console.log('✅ Project deleted:', {
      status: deleteResponse.status,
    });

    // 11. Test sans token sur une route protégée (devrait échouer)
    console.log('\n1️⃣1️⃣ Testing protected route WITHOUT token (should fail)...');
    try {
      const response = await axios.get(`${BASE_URL}/projects/by-stage`);
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      console.log('✅ Correctly rejected:', {
        status: error.response.status,
        message: error.response.data.message,
      });
    }

    console.log('\n✨ Projects authentication test completed successfully!');

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

testProjectsAuthentication(); 