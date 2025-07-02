# Exemples Swagger pour l'API Workspaces

## Vue d'ensemble

Cette documentation présente les exemples Swagger configurés pour l'API des workspaces, incluant des exemples détaillés pour la création de workspaces.

## Endpoint POST /workspaces

### Description
Crée un nouveau workspace lié à l'utilisateur authentifié. Le workspace sera automatiquement associé à l'email de l'utilisateur récupéré depuis le token d'authentification.

### Authentification
- **Type** : Bearer Token
- **Requis** : Oui
- **Description** : Token d'authentification SpeedPresta valide

### Exemples de requêtes

#### 1. Workspace minimal
```json
{
  "projectId": "project-uuid-123",
  "currentStep": 1
}
```

**Description** : Création d'un workspace avec seulement les informations de base. Tous les formulaires seront initialisés avec des valeurs par défaut.

#### 2. Workspace complet
```json
{
  "projectId": "project-uuid-123",
  "currentStep": 2,
  "personForm": {
    "nom": "Dupont",
    "prenom": "Jean",
    "sexe": "Homme",
    "age": 35,
    "nationalite": "Française",
    "origine": "Paris",
    "description": "Entrepreneur passionné par la technologie",
    "parcoursUtilisateur": "Ingénieur informatique avec 10 ans d'expérience"
  },
  "visualIdentityForm": {
    "slogan": "Innovation et Excellence",
    "typography": "Moderne et épurée",
    "valeurs": "Innovation, Qualité, Proximité client",
    "tonMessage": "Professionnel mais accessible",
    "experienceUtilisateur": "Intuitive et engageante"
  }
}
```

**Description** : Création d'un workspace avec les informations personnelles et d'identité visuelle remplies.

#### 3. Workspace avec storytelling
```json
{
  "currentStep": 4,
  "storytellingForm": {
    "archetypes": ["Le Créateur", "L'Explorateur"],
    "structureNarrative": "Histoire de transformation digitale",
    "pitch": "Nous aidons les entreprises à se digitaliser avec des solutions innovantes et sur-mesure."
  },
  "businessModelForm": {
    "market": "B2B - PME et ETI",
    "pricing": "Freemium avec abonnements premium"
  }
}
```

**Description** : Exemple incluant les éléments de storytelling et business model pour un workspace avancé.

#### 4. Workspace avec logo
```json
{
  "projectId": "project-uuid-123",
  "currentStep": 2,
  "visualIdentityForm": {
    "logoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "logoMimeType": "image/png",
    "slogan": "Innovation et Excellence",
    "typography": "Moderne et épurée",
    "valeurs": "Innovation, Qualité, Proximité client",
    "tonMessage": "Professionnel mais accessible",
    "experienceUtilisateur": "Intuitive et engageante"
  }
}
```

**Description** : Exemple avec upload de logo en base64.

### Exemple de réponse (201 Created)
```json
{
  "id": "workspace-uuid-456",
  "projectId": "project-uuid-123",
  "userEmail": "user@example.com",
  "currentStep": 1,
  "personForm": {
    "nom": "Dupont",
    "prenom": "Jean",
    "sexe": "Homme",
    "age": 35,
    "nationalite": "Française",
    "origine": "Paris",
    "description": "Entrepreneur passionné par la technologie",
    "parcoursUtilisateur": "Ingénieur informatique avec 10 ans d'expérience"
  },
  "visualIdentityForm": {
    "logoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "logoMimeType": "image/png",
    "slogan": "Innovation et Excellence",
    "typography": "Moderne et épurée",
    "valeurs": "Innovation, Qualité, Proximité client",
    "tonMessage": "Professionnel mais accessible",
    "experienceUtilisateur": "Intuitive et engageante"
  },
  "storytellingForm": {
    "archetypes": ["Le Créateur", "L'Explorateur"],
    "structureNarrative": "Histoire de transformation digitale",
    "pitch": "Nous aidons les entreprises à se digitaliser avec des solutions innovantes et sur-mesure."
  },
  "businessModelForm": {
    "market": "B2B - PME et ETI",
    "pricing": "Freemium avec abonnements premium"
  },
  "createdAt": "2025-01-26T20:30:00.000Z",
  "updatedAt": "2025-01-26T20:30:00.000Z"
}
```

### Codes de réponse

| Code | Description |
|------|-------------|
| 201 | Workspace créé avec succès |
| 401 | Token d'authentification manquant ou invalide |
| 404 | Email utilisateur non trouvé dans le token |
| 400 | Données de requête invalides |

## Structure des données

### PersonForm
```typescript
{
  nom?: string;           // Nom de famille
  prenom?: string;        // Prénom
  sexe?: string;          // Genre (Homme/Femme/Autre)
  age?: number | null;    // Âge (peut être null)
  nationalite?: string;   // Nationalité
  origine?: string;       // Lieu d'origine
  description?: string;   // Description personnelle
  parcoursUtilisateur?: string; // Parcours professionnel
}
```

### VisualIdentityForm
```typescript
{
  logoBase64?: string;    // Logo encodé en base64
  logoMimeType?: string;  // Type MIME du logo (image/png, image/jpeg, etc.)
  slogan?: string;        // Slogan de la marque
  typography?: string;    // Style typographique
  valeurs?: string;       // Valeurs de l'entreprise
  tonMessage?: string;    // Ton de communication
  experienceUtilisateur?: string; // Description de l'expérience utilisateur
}
```

### StorytellingForm
```typescript
{
  archetypes?: string[];     // Liste des archétypes de marque
  structureNarrative?: string; // Structure narrative choisie
  pitch?: string;            // Pitch de l'entreprise
}
```

### BusinessModelForm
```typescript
{
  market?: string;    // Marché cible
  pricing?: string;   // Stratégie de prix
}
```

## Notes importantes

1. **Authentification obligatoire** : Toutes les requêtes nécessitent un token Bearer valide
2. **Email automatique** : L'email utilisateur est automatiquement récupéré du token, pas besoin de le fournir
3. **Champs optionnels** : Tous les champs sont optionnels, permettant une création progressive
4. **Valeurs par défaut** : Les formulaires non renseignés sont initialisés avec des valeurs par défaut
5. **Sécurité** : Chaque utilisateur ne peut accéder qu'à ses propres workspaces

## Test avec curl

```bash
# Exemple de création d'un workspace minimal
curl -X POST "http://localhost:3000/workspaces" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid-123",
    "currentStep": 1
  }'
```

## Accès à la documentation Swagger

Une fois le serveur démarré, la documentation Swagger interactive est disponible à l'adresse :
- **URL** : `http://localhost:3000/api`
- **Description** : Interface interactive pour tester l'API avec les exemples pré-configurés
