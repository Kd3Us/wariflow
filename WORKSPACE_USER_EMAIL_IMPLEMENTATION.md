# Implémentation de la liaison Workspace-Email Utilisateur

## Vue d'ensemble

Cette implémentation lie chaque workspace à l'email de l'utilisateur récupéré depuis le token d'authentification. Cela permet d'assurer que chaque utilisateur ne peut accéder qu'à ses propres workspaces.

## Modifications apportées

### 1. Entité Workspace (`starterKit-back/src/workspaces/entities/workspace.entity.ts`)

- **Ajout du champ `userEmail`** : Colonne obligatoire qui stocke l'email de l'utilisateur propriétaire du workspace
```typescript
@Column({ nullable: false })
userEmail: string;
```

### 2. Guard d'authentification (`starterKit-back/src/common/guards/token-auth.guard.ts`)

- **Récupération des informations utilisateur** : Le guard récupère maintenant les informations utilisateur complètes depuis le token
- **Stockage dans la requête** : Les informations utilisateur sont stockées dans `request['userInfo']` pour être utilisées dans les contrôleurs

### 3. Service Workspaces (`starterKit-back/src/workspaces/workspaces.service.ts`)

- **Méthode `create` modifiée** : Accepte maintenant un paramètre `userEmail` obligatoire
- **Nouvelle méthode `findByUserEmail`** : Permet de récupérer tous les workspaces d'un utilisateur spécifique

### 4. Contrôleur Workspaces (`starterKit-back/src/workspaces/workspaces.controller.ts`)

- **Activation du guard** : `@UseGuards(TokenAuthGuard)` activé sur toutes les routes
- **Sécurisation de toutes les méthodes** : Chaque méthode vérifie l'email utilisateur et s'assure que l'utilisateur ne peut accéder qu'à ses propres workspaces

#### Routes sécurisées :

- **POST `/workspaces`** : Crée un workspace lié à l'email utilisateur du token
- **GET `/workspaces`** : Retourne uniquement les workspaces de l'utilisateur connecté
- **GET `/workspaces/user/me`** : Route explicite pour récupérer les workspaces de l'utilisateur
- **GET `/workspaces/:id`** : Vérifie que le workspace appartient à l'utilisateur
- **GET `/workspaces/project/:projectId`** : Vérifie que le workspace appartient à l'utilisateur
- **PATCH `/workspaces/:id`** : Vérifie que le workspace appartient à l'utilisateur
- **DELETE `/workspaces/:id`** : Vérifie que le workspace appartient à l'utilisateur

## Migration de base de données

Un fichier de migration SQL a été créé : `starterKit-back/src/database/migrations/add-user-email-to-workspaces.sql`

### Étapes de migration :

1. Ajouter la colonne `userEmail` à la table `workspaces`
2. Mettre à jour les enregistrements existants avec une valeur par défaut
3. Rendre la colonne `NOT NULL`
4. Ajouter un index pour améliorer les performances

### Commandes à exécuter :

```bash
# Se connecter à la base de données PostgreSQL
psql -h localhost -U your_username -d your_database

# Exécuter la migration
\i starterKit-back/src/database/migrations/add-user-email-to-workspaces.sql
```

## Sécurité

### Contrôles d'accès implémentés :

1. **Authentification obligatoire** : Toutes les routes nécessitent un token valide
2. **Isolation des données** : Chaque utilisateur ne peut accéder qu'à ses propres workspaces
3. **Vérification de propriété** : Avant toute opération (lecture, modification, suppression), le système vérifie que le workspace appartient à l'utilisateur
4. **Messages d'erreur uniformes** : Les erreurs retournent toujours "not found" pour éviter la divulgation d'informations

### Flux d'authentification :

1. L'utilisateur envoie une requête avec un token Bearer
2. Le `TokenAuthGuard` vérifie le token auprès de l'API SpeedPresta
3. Les informations utilisateur (incluant l'email) sont récupérées et stockées dans la requête
4. Le contrôleur utilise l'email pour filtrer/sécuriser l'accès aux workspaces

## Structure du token

Le token doit contenir les informations utilisateur dans le format suivant :
```typescript
{
  msg: 'Verified',
  userInfo: {
    email: 'user@example.com',
    // autres informations utilisateur...
  },
  activation: { ... }
}
```

## Tests recommandés

1. **Test de création** : Vérifier qu'un workspace est bien lié à l'email utilisateur
2. **Test d'isolation** : Vérifier qu'un utilisateur ne peut pas accéder aux workspaces d'un autre utilisateur
3. **Test de modification** : Vérifier qu'un utilisateur ne peut modifier que ses propres workspaces
4. **Test de suppression** : Vérifier qu'un utilisateur ne peut supprimer que ses propres workspaces
5. **Test sans token** : Vérifier que les routes sont protégées
6. **Test avec token invalide** : Vérifier la gestion des erreurs d'authentification

## Notes importantes

- **Migration nécessaire** : La migration de base de données doit être exécutée avant de déployer ces modifications
- **Données existantes** : Les workspaces existants devront être associés à des utilisateurs (voir la migration SQL)
- **Performance** : Un index a été ajouté sur la colonne `userEmail` pour optimiser les requêtes
- **Compatibilité** : Cette modification change l'API des workspaces, les clients devront être mis à jour si nécessaire
