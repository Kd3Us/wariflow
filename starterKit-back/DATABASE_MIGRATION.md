# Migration vers une Base de Données Réelle

Ce document explique comment migrer de données mockées vers une vraie base de données PostgreSQL avec TypeORM.

## 🎯 Objectif

Remplacer les données stockées en mémoire par une base de données PostgreSQL persistante pour :
- **Projects** (Projets)
- **TeamMembers** (Membres d'équipe)
- **ProjectManagementTasks** (Tâches de gestion de projet)
- **Workspaces** (Espaces de travail)

## 🚀 Installation et Configuration

### 1. Prérequis

- Docker et Docker Compose installés
- Node.js et npm

### 2. Configuration de la Base de Données

```bash
# Démarrer PostgreSQL avec Docker
npm run db:setup

# Ou manuellement :
npm run db:start
```

### 3. Variables d'Environnement

Le fichier `.env` contient :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=speedpresta_db
NODE_ENV=development
PORT=3000
```

### 4. Démarrer l'Application

```bash
npm run start:dev
```

## 📊 Structure de la Base de Données

### Tables Créées

1. **team_members** - Membres d'équipe
2. **projects** - Projets avec relations vers team_members
3. **project_management_tasks** - Tâches liées aux projets
4. **workspaces** - Espaces de travail méthodologiques
5. **project_team_members** - Table de liaison (Many-to-Many)
6. **task_assigned_members** - Table de liaison pour les tâches

### Relations

- **Project ↔ TeamMember** : Many-to-Many
- **Project → ProjectManagementTask** : One-to-Many
- **ProjectManagementTask ↔ TeamMember** : Many-to-Many
- **Workspace → Project** : One-to-One (optionnel)

## 🔄 Changements Effectués

### Entités TypeORM

- ✅ `Project` : Transformée en entité TypeORM
- ✅ `TeamMember` : Nouvelle entité TypeORM
- ✅ `ProjectManagementTask` : Transformée en entité TypeORM
- ✅ `Workspace` : Transformée en entité TypeORM

### Services

- ✅ `ProjectsService` : Utilise Repository TypeORM
- ✅ `TeamsService` : Utilise Repository TypeORM avec données initiales
- ✅ `ProjectManagementService` : Utilise Repository TypeORM
- ✅ `WorkspacesService` : Utilise Repository TypeORM

### Modules

- ✅ Ajout de `DatabaseModule`
- ✅ Configuration TypeORM dans tous les modules
- ✅ Import des repositories dans les modules

## 🛠️ Scripts Disponibles

```bash
# Base de données
npm run db:setup    # Configuration initiale
npm run db:start    # Démarrer PostgreSQL
npm run db:stop     # Arrêter PostgreSQL
npm run db:reset    # Réinitialiser (supprime les données)

# Migrations TypeORM
npm run migration:generate -- NomDeLaMigration
npm run migration:run
npm run migration:revert

# Application
npm run start:dev   # Démarrer en mode développement
```

## 📝 Données Initiales

Le service `TeamsService` initialise automatiquement 5 membres d'équipe au premier démarrage :
- Alice Martin (Product Manager)
- Thomas Dubois (Frontend Developer)
- Sophie Leclerc (UX Designer)
- Marc Rousseau (Backend Developer)
- Emma Bernard (Data Analyst)

## 🔍 Vérification

1. **PostgreSQL** : `docker ps` pour vérifier que le conteneur fonctionne
2. **Connexion** : L'application se connecte automatiquement au démarrage
3. **Tables** : Les tables sont créées automatiquement (synchronize: true en dev)
4. **Données** : Les membres d'équipe sont créés au premier lancement

## 🚨 Points d'Attention

- **Synchronize** : Activé uniquement en développement
- **Logging** : Activé en développement pour debug
- **Relations** : Eager loading configuré pour les relations importantes
- **Validation** : Les DTOs existants restent inchangés

## 🎉 Avantages

- ✅ Persistance des données
- ✅ Relations complexes gérées par la DB
- ✅ Requêtes optimisées avec QueryBuilder
- ✅ Transactions automatiques
- ✅ Migrations pour la production
- ✅ Backup et restauration possibles
