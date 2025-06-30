const https = require('https');
const fs = require('fs');

// Configuration pour ignorer les certificats auto-signés en développement
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE_URL = 'https://localhost:3009';
const TEST_TOKEN = 'your-test-token-here'; // Remplacez par un token valide

// Fonction utilitaire pour faire des requêtes HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3009,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Tests des routes Teams
async function testTeamsAPI() {
  console.log('🚀 Début des tests de l\'API Teams\n');

  try {
    // 1. Test GET /teams - Récupérer tous les membres
    console.log('1. Test GET /teams - Récupérer tous les membres');
    const getAllResponse = await makeRequest('GET', '/teams');
    console.log(`   Status: ${getAllResponse.statusCode}`);
    console.log(`   Nombre de membres: ${getAllResponse.data.length || 0}`);
    console.log(`   Premiers membres:`, getAllResponse.data.slice(0, 2));
    console.log('');

    // 2. Test POST /teams - Créer un nouveau membre
    console.log('2. Test POST /teams - Créer un nouveau membre');
    const newMember = {
      name: 'Test User',
      email: `test.user.${Date.now()}@example.com`,
      role: 'Test Developer',
      avatar: 'https://via.placeholder.com/150'
    };
    
    const createResponse = await makeRequest('POST', '/teams', newMember);
    console.log(`   Status: ${createResponse.statusCode}`);
    console.log(`   Membre créé:`, createResponse.data);
    console.log('');

    let createdMemberId = null;
    if (createResponse.statusCode === 201 && createResponse.data.id) {
      createdMemberId = createResponse.data.id;

      // 3. Test GET /teams/:id - Récupérer un membre spécifique
      console.log('3. Test GET /teams/:id - Récupérer un membre spécifique');
      const getOneResponse = await makeRequest('GET', `/teams/${createdMemberId}`);
      console.log(`   Status: ${getOneResponse.statusCode}`);
      console.log(`   Membre récupéré:`, getOneResponse.data);
      console.log('');

      // 4. Test PUT /teams/:id - Mettre à jour un membre
      console.log('4. Test PUT /teams/:id - Mettre à jour un membre');
      const updateData = {
        role: 'Senior Test Developer',
        name: 'Updated Test User'
      };
      
      const updateResponse = await makeRequest('PUT', `/teams/${createdMemberId}`, updateData);
      console.log(`   Status: ${updateResponse.statusCode}`);
      console.log(`   Membre mis à jour:`, updateResponse.data);
      console.log('');

      // 5. Test DELETE /teams/:id - Supprimer un membre
      console.log('5. Test DELETE /teams/:id - Supprimer un membre');
      const deleteResponse = await makeRequest('DELETE', `/teams/${createdMemberId}`);
      console.log(`   Status: ${deleteResponse.statusCode}`);
      console.log(`   Réponse:`, deleteResponse.data);
      console.log('');

      // 6. Vérifier que le membre a été supprimé
      console.log('6. Vérification de la suppression');
      const getDeletedResponse = await makeRequest('GET', `/teams/${createdMemberId}`);
      console.log(`   Status: ${getDeletedResponse.statusCode}`);
      console.log(`   Réponse:`, getDeletedResponse.data);
      console.log('');
    }

    // 7. Test d'erreur - Créer un membre avec un email invalide
    console.log('7. Test d\'erreur - Email invalide');
    const invalidMember = {
      name: 'Invalid User',
      email: 'invalid-email',
      role: 'Test Role'
    };
    
    const invalidResponse = await makeRequest('POST', '/teams', invalidMember);
    console.log(`   Status: ${invalidResponse.statusCode}`);
    console.log(`   Erreur:`, invalidResponse.data);
    console.log('');

    // 8. Test d'erreur - Récupérer un membre inexistant
    console.log('8. Test d\'erreur - Membre inexistant');
    const notFoundResponse = await makeRequest('GET', '/teams/00000000-0000-0000-0000-000000000000');
    console.log(`   Status: ${notFoundResponse.statusCode}`);
    console.log(`   Erreur:`, notFoundResponse.data);
    console.log('');

    console.log('✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script de test:');
console.log('1. Assurez-vous que le serveur backend est démarré (npm run start:dev)');
console.log('2. Remplacez TEST_TOKEN par un token d\'authentification valide');
console.log('3. Exécutez: node test-teams-crud.js');
console.log('');

// Vérifier si un token est fourni
if (TEST_TOKEN === 'your-test-token-here') {
  console.log('⚠️  ATTENTION: Vous devez remplacer TEST_TOKEN par un token valide avant d\'exécuter les tests.');
  console.log('   Vous pouvez obtenir un token en vous connectant via l\'API d\'authentification.');
} else {
  // Exécuter les tests
  testTeamsAPI();
}
