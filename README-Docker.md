# SpeedPresta - Configuration Docker

Ce projet utilise Docker pour containeriser l'application frontend Angular et backend NestJS.

## Structure des projets

- `starterKit-front/` : Application Angular avec Nginx
- `starterKit-back/` : API NestJS avec PostgreSQL

## Configuration Docker

### Option 1 : Déploiement complet (recommandé)

Pour déployer l'ensemble de l'application (frontend + backend + base de données) :

```bash
# Depuis le répertoire racine
docker-compose up -d
```

### Option 2 : Déploiement séparé

#### Frontend uniquement
```bash
cd starterKit-front
docker-compose up -d
```

#### Backend uniquement
```bash
cd starterKit-back
docker-compose up -d
```

## Services disponibles

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Nginx) | 80 | Application Angular |
| Backend (NestJS) | 3000 | API REST |
| PostgreSQL | 5432 | Base de données |
| PgAdmin | 5050 | Interface d'administration PostgreSQL |

## Accès aux services

- **Frontend** : http://localhost
- **Backend API** : http://localhost:3000
- **PgAdmin** : http://localhost:5050
  - Email : admin@example.com
  - Mot de passe : admin

## Commandes utiles

### Démarrer les services
```bash
docker-compose up -d
```

### Arrêter les services
```bash
docker-compose down
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Reconstruire les images
```bash
docker-compose up -d --build
```

### Nettoyer les volumes
```bash
docker-compose down -v
```

## Configuration de l'environnement

### Variables d'environnement Backend

Les variables d'environnement suivantes sont configurées automatiquement :

- `DATABASE_HOST=postgres`
- `DATABASE_PORT=5432`
- `DATABASE_NAME=project_lifecycle`
- `DATABASE_USER=postgres`
- `DATABASE_PASSWORD=postgres`

### Personnalisation

Pour modifier la configuration, vous pouvez :

1. Créer un fichier `.env` dans le répertoire racine
2. Modifier les variables dans le `docker-compose.yml`
3. Redémarrer les services avec `docker-compose up -d`

## Dépannage

### Problèmes courants

1. **Port déjà utilisé** : Vérifiez qu'aucun service n'utilise les ports 80, 3000, 5432, ou 5050
2. **Erreur de build** : Vérifiez que tous les fichiers de dépendances sont présents
3. **Connexion à la base de données** : Attendez que PostgreSQL soit complètement démarré

### Logs de débogage

```bash
# Voir les logs détaillés
docker-compose logs -f --tail=100

# Vérifier l'état des conteneurs
docker-compose ps
```

## Développement

Pour le développement, vous pouvez utiliser les commandes suivantes :

```bash
# Mode développement avec rebuild automatique
docker-compose up -d --build

# Suivre les logs en temps réel
docker-compose logs -f
``` 