# API Documentation - Teams

Cette documentation décrit les routes API disponibles pour la gestion des équipes (teams).

## Base URL
```
/teams
```

## Authentification
Toutes les routes nécessitent un token d'authentification Bearer dans l'en-tête de la requête :
```
Authorization: Bearer <your-token>
```

## Routes disponibles

### 1. Récupérer tous les membres de l'équipe
- **Méthode** : `GET`
- **URL** : `/teams`
- **Description** : Récupère la liste de tous les membres de l'équipe
- **Réponses** :
  - `200` : Liste des membres de l'équipe
  - `401` : Token d'authentification requis

**Exemple de réponse :**
```json
[
  {
    "id": "uuid",
    "name": "Alice Martin",
    "email": "alice.martin@example.com",
    "role": "Product Manager",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### 2. Récupérer un membre spécifique
- **Méthode** : `GET`
- **URL** : `/teams/:id`
- **Description** : Récupère un membre de l'équipe par son ID
- **Paramètres** :
  - `id` (string) : ID du membre de l'équipe
- **Réponses** :
  - `200` : Membre de l'équipe trouvé
  - `401` : Token d'authentification requis
  - `404` : Membre de l'équipe non trouvé

### 3. Créer un nouveau membre
- **Méthode** : `POST`
- **URL** : `/teams`
- **Description** : Crée un nouveau membre de l'équipe
- **Body** :
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "role": "Developer",
  "avatar": "https://example.com/avatar.jpg" // optionnel
}
```
- **Réponses** :
  - `201` : Membre de l'équipe créé avec succès
  - `400` : Données invalides
  - `401` : Token d'authentification requis
  - `409` : Email déjà utilisé

### 4. Mettre à jour un membre
- **Méthode** : `PUT`
- **URL** : `/teams/:id`
- **Description** : Met à jour un membre de l'équipe existant
- **Paramètres** :
  - `id` (string) : ID du membre de l'équipe
- **Body** : (tous les champs sont optionnels)
```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "role": "Senior Developer",
  "avatar": "https://example.com/new-avatar.jpg"
}
```
- **Réponses** :
  - `200` : Membre de l'équipe mis à jour avec succès
  - `400` : Données invalides
  - `401` : Token d'authentification requis
  - `404` : Membre de l'équipe non trouvé
  - `409` : Email déjà utilisé

### 5. Supprimer un membre
- **Méthode** : `DELETE`
- **URL** : `/teams/:id`
- **Description** : Supprime un membre de l'équipe
- **Paramètres** :
  - `id` (string) : ID du membre de l'équipe
- **Réponses** :
  - `200` : Membre de l'équipe supprimé avec succès
  - `401` : Token d'authentification requis
  - `404` : Membre de l'équipe non trouvé

**Exemple de réponse :**
```json
{
  "message": "Membre de l'équipe supprimé avec succès"
}
```

## Validation des données

### CreateTeamMemberDto
- `name` (string, requis) : Nom du membre de l'équipe
- `email` (string, requis) : Email du membre (doit être unique)
- `role` (string, requis) : Rôle du membre dans l'équipe
- `avatar` (string, optionnel) : URL de l'avatar du membre

### UpdateTeamMemberDto
Tous les champs de `CreateTeamMemberDto` sont optionnels pour la mise à jour.

## Exemples d'utilisation avec curl

### Créer un membre
```bash
curl -X POST http://localhost:3000/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marie Dubois",
    "email": "marie.dubois@example.com",
    "role": "UX Designer"
  }'
```

### Récupérer tous les membres
```bash
curl -X GET http://localhost:3000/teams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mettre à jour un membre
```bash
curl -X PUT http://localhost:3000/teams/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Senior UX Designer"
  }'
```

### Supprimer un membre
```bash
curl -X DELETE http://localhost:3000/teams/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes importantes

1. **Unicité de l'email** : Chaque membre doit avoir un email unique dans le système
2. **Validation** : Tous les champs requis sont validés côté serveur
3. **Authentification** : Toutes les routes nécessitent un token d'authentification valide
4. **Relations** : Les membres d'équipe peuvent être associés à des projets via la relation Many-to-Many
