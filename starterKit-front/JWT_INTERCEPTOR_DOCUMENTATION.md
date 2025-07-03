# Documentation du JwtInterceptor

## Vue d'ensemble

Le `JwtInterceptor` est un interceptor HTTP Angular qui gère automatiquement l'authentification JWT et les erreurs 401 (Unauthorized) dans votre application. Il ajoute automatiquement le token JWT aux requêtes HTTP et redirige vers la page de login en cas d'erreur d'authentification.

## Fonctionnalités

### 🔐 Gestion automatique du token JWT
- Ajoute automatiquement le header `Authorization: Bearer <token>` à toutes les requêtes HTTP
- Exclut les requêtes d'authentification (`/auth/verify`, `/auth/login`, `/auth/logout`, `/auth/refresh`)

### 🚨 Gestion des erreurs 401
- Détecte automatiquement les erreurs 401 (Unauthorized)
- Supprime le token expiré du sessionStorage
- Redirige automatiquement vers la page de login
- Évite les redirections multiples avec un système de flag

### 📝 Logging détaillé
- Logs détaillés pour le debugging
- Affichage des URLs interceptées
- Messages d'erreur contextuels

## Configuration

### 1. Installation de l'interceptor

L'interceptor est déjà configuré dans `app.config.ts` :

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    // autres providers...
  ]
};
```

### 2. Dépendances requises

L'interceptor utilise le `JwtService` qui doit être disponible dans votre application :

```typescript
import { JwtService } from '../services/jwt.service';
```

## Utilisation

### Appels API automatiques

Une fois configuré, l'interceptor fonctionne automatiquement pour tous les appels HTTP :

```typescript
// Ce service utilisera automatiquement l'interceptor
@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  getData() {
    // Le token sera automatiquement ajouté
    return this.http.get('/api/data');
  }
}
```

### Gestion des erreurs 401

L'interceptor gère automatiquement les erreurs 401 :

```typescript
// Dans votre composant
this.apiService.getData().subscribe({
  next: (data) => {
    // Données reçues avec succès
    console.log(data);
  },
  error: (error) => {
    if (error.status === 401) {
      // L'interceptor a déjà géré la redirection
      console.log('Token expiré, redirection en cours...');
    }
  }
});
```

## Scénarios de fonctionnement

### ✅ Scénario 1 : Token valide
1. L'utilisateur fait un appel API
2. L'interceptor ajoute le token aux headers
3. La requête est envoyée avec succès
4. Les données sont retournées

### ❌ Scénario 2 : Token expiré (401)
1. L'utilisateur fait un appel API
2. L'interceptor ajoute le token aux headers
3. Le serveur retourne une erreur 401
4. L'interceptor détecte l'erreur 401
5. Le token est supprimé du sessionStorage
6. L'utilisateur est redirigé vers la page de login

### 🚫 Scénario 3 : Pas de token
1. L'utilisateur fait un appel API
2. L'interceptor ne trouve pas de token
3. L'utilisateur est immédiatement redirigé vers la page de login

## URLs exclues

Les URLs suivantes sont automatiquement exclues de l'interception :
- `/auth/verify`
- `/auth/login`
- `/auth/logout`
- `/auth/refresh`

## Exemple d'utilisation avec le DemoApiService

```typescript
import { DemoApiService } from './services/demo-api.service';

@Component({...})
export class MyComponent {
  constructor(private demoApi: DemoApiService) {}

  testInterceptor() {
    // Test automatique de l'interceptor
    this.demoApi.testInterceptor();
  }

  loadData() {
    this.demoApi.getProtectedData().subscribe({
      next: (data) => console.log('Données:', data),
      error: (error) => {
        if (error.status === 401) {
          console.log('Redirection automatique vers login');
        }
      }
    });
  }
}
```

## Debugging

Pour débugger l'interceptor, ouvrez la console du navigateur. Vous verrez des logs comme :

```
JwtInterceptor: Intercepting request to: /api/data
JwtInterceptor: Token found: true
JwtInterceptor: Token added to request headers
```

En cas d'erreur 401 :
```
JwtInterceptor: HTTP Error: 401 Unauthorized
JwtInterceptor: 401 Unauthorized - Token expired or invalid
JwtInterceptor: Handling 401 error
JwtInterceptor: Removing token and redirecting to login
```

## Tests

Des tests unitaires sont disponibles dans `jwt.interceptor.spec.ts` pour vérifier :
- L'ajout automatique du token
- La gestion des erreurs 401
- L'exclusion des URLs d'authentification
- La redirection en cas d'absence de token

## Bonnes pratiques

1. **Ne pas gérer manuellement les erreurs 401** : Laissez l'interceptor s'en charger
2. **Utiliser les logs** : Activez la console pour débugger
3. **Tester régulièrement** : Vérifiez que l'interceptor fonctionne avec vos APIs
4. **Gérer les autres erreurs** : L'interceptor ne gère que les 401, gérez les autres erreurs dans vos services

## Dépannage

### Problème : L'interceptor ne fonctionne pas
- Vérifiez que l'interceptor est bien configuré dans `app.config.ts`
- Assurez-vous que `JwtService` est disponible

### Problème : Redirections multiples
- L'interceptor a un système de protection contre les redirections multiples
- Vérifiez les logs pour identifier la cause

### Problème : Token non ajouté
- Vérifiez que l'URL n'est pas dans la liste des URLs exclues
- Assurez-vous que le token existe dans le sessionStorage
