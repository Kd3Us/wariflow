# Middleware de Vérification de Token

Ce middleware vérifie automatiquement les tokens envoyés par le front-end en faisant un appel à l'API SpeedPresta.

## Configuration

### Variables d'environnement

Créez un fichier `.env` basé sur `.env.example` :

```bash
# SpeedPresta API Configuration
SPEEDPRESTA_API_URL=https://api.speedpresta.com/api/v1/verify/token
SPEEDPRESTA_TIMEOUT=10000
```

## Utilisation

### Route protégée

Le middleware s'applique automatiquement à la route `POST /auth/login`.

### Envoi du token

Le front-end doit envoyer le token dans le header `Authorization` :

```javascript
// Exemple avec fetch
fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({})
})
```

```javascript
// Exemple avec axios
axios.post('/auth/login', {}, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
```

## 🔄 Réutilisation du Token

### Option 1 : Guard sur contrôleurs spécifiques (Recommandé)

Utilisez le `TokenAuthGuard` pour protéger des contrôleurs ou méthodes spécifiques :

```typescript
@Controller('projects')
@UseGuards(TokenAuthGuard) // Protège toutes les routes du contrôleur
export class ProjectsController {
  @Get()
  getAllProjects(@Req() req: Request) {
    const validatedToken = req['validatedToken'];
    // Votre logique ici
  }
}
```

### Option 2 : Middleware global

Activez le middleware global en décommentant dans `common.module.ts` :

```typescript
consumer
  .apply(GlobalAuthMiddleware)
  .forRoutes('*');
```

### Option 3 : Cache de tokens

Les tokens validés sont mis en cache pendant 5 minutes pour éviter les appels répétés à l'API SpeedPresta.

## 📋 Routes disponibles

### Authentification
- `POST /auth/login` - Connexion avec vérification de token

### Routes protégées (avec Guard)

#### Projets
- `GET /projects` - Liste tous les projets avec filtres
- `GET /projects/:id` - Récupère un projet spécifique
- `POST /projects` - Crée un nouveau projet
- `PUT /projects/:id` - Met à jour un projet
- `DELETE /projects/:id` - Supprime un projet
- `PATCH /projects/:id/stage` - Change l'étape d'un projet
- `GET /projects/by-stage` - Projets groupés par étape
- `GET /projects/upcoming-deadlines` - Deadlines proches
- `GET /projects/active-reminders` - Rappels actifs

#### Équipes
- `GET /teams` - Liste des membres de l'équipe
- `GET /teams/:id` - Membre d'équipe spécifique

#### Données protégées
- `GET /protected/data` - Données protégées
- `GET /protected/profile` - Profil utilisateur

### Réponses

#### Succès (200)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "YOUR_VALIDATED_TOKEN"
}
```

#### Erreur - Token manquant (401)
```json
{
  "statusCode": 401,
  "message": "Token is required"
}
```

#### Erreur - Token invalide (401)
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

#### Erreur - Service indisponible (503)
```json
{
  "statusCode": 503,
  "message": "Token verification service unavailable"
}
```

## 🧪 Tests

### Test de réutilisation de token
```bash
node test-token-reuse.js
```

### Test du middleware
```bash
node test-middleware.js
```

### Test des routes des équipes
```bash
node test-teams-auth.js
```

### Test des routes des projets
```bash
node test-projects-auth.js
```

## Architecture

- **TokenVerificationService** : Service qui fait l'appel à l'API SpeedPresta
- **TokenCacheService** : Cache des tokens validés (5 minutes)
- **TokenVerificationMiddleware** : Middleware pour /auth/login
- **GlobalAuthMiddleware** : Middleware global pour toutes les routes
- **TokenAuthGuard** : Guard pour protéger des contrôleurs spécifiques
- **AuthController** : Contrôleur qui gère la route `/auth/login`
- **ProtectedController** : Exemple de contrôleur protégé
- **TeamsController** : Contrôleur des équipes protégé
- **ProjectsController** : Contrôleur des projets protégé
- **CommonModule** : Module qui organise tous les composants d'authentification

## Extension

Pour protéger d'autres routes, vous pouvez :

1. **Utiliser le Guard** : `@UseGuards(TokenAuthGuard)` sur vos contrôleurs
2. **Activer le middleware global** : Décommentez dans `CommonModule`
3. **Utiliser le service directement** : `TokenVerificationService` dans vos contrôleurs 