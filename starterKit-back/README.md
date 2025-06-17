# Project Lifecycle Management Backend

Une API REST NestJS pour la gestion du cycle de vie des projets avec système de stages, deadlines et rappels.

## 🚀 Fonctionnalités

### Core Features
- **CRUD complet** pour les projets
- **Gestion du cycle de vie** : Idée → MVP → Traction → Levée
- **Système de deadlines** avec alertes
- **Rappels automatiques** configurables
- **Filtrage avancé** par étape, priorité, date
- **Drag & drop** entre étapes (API)
- **Gestion d'équipes** et assignation
- **Tags et priorités** pour l'organisation

### API Endpoints

#### Projets
- `GET /projects` - Liste tous les projets avec filtres
- `GET /projects/:id` - Récupère un projet spécifique
- `POST /projects` - Crée un nouveau projet
- `PUT /projects/:id` - Met à jour un projet
- `DELETE /projects/:id` - Supprime un projet
- `PATCH /projects/:id/stage` - Change l'étape d'un projet

#### Vues spécialisées
- `GET /projects/by-stage` - Projets groupés par étape
- `GET /projects/upcoming-deadlines` - Deadlines proches
- `GET /projects/active-reminders` - Rappels actifs

#### Équipes
- `GET /teams` - Liste tous les membres
- `GET /teams/:id` - Récupère un membre spécifique

## 🛠️ Installation et utilisation

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run start:dev

# Build de production
npm run build

# Démarrage de production
npm run start:prod
```

## 📚 Documentation

- **API Documentation** : http://localhost:3001/api
- **Server** : http://localhost:3001

## 🏗️ Architecture

```
src/
├── common/
│   ├── enums/           # Énumérations (ProjectStage)
│   └── interfaces/      # Interfaces partagées
├── projects/
│   ├── dto/            # Data Transfer Objects
│   ├── entities/       # Entités du domaine
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── projects.module.ts
├── teams/
│   ├── teams.controller.ts
│   ├── teams.service.ts
│   └── teams.module.ts
└── main.ts
```

## 🔧 Filtres disponibles

- **stage** : Filtrer par étape (IDEE, MVP, TRACTION, LEVEE)
- **priority** : Filtrer par priorité (LOW, MEDIUM, HIGH)
- **search** : Recherche textuelle dans titre/description/tags
- **deadlineInDays** : Projets avec deadline dans X jours
- **hasActiveReminder** : Projets avec rappels actifs
- **sortBy** : Tri par createdAt, deadline, ou progress
- **sortOrder** : Ordre croissant (asc) ou décroissant (desc)

## 📋 Exemples d'utilisation

### Créer un projet
```bash
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouveau Projet",
    "description": "Description du projet",
    "stage": "IDEE",
    "progress": 0,
    "deadline": "2024-12-31T00:00:00.000Z",
    "teamIds": ["team-member-id-1", "team-member-id-2"],
    "priority": "HIGH",
    "tags": ["innovation", "urgence"]
  }'
```

### Filtrer les projets
```bash
# Projets en étape MVP avec deadline proche
curl "http://localhost:3001/projects?stage=MVP&deadlineInDays=7"

# Recherche textuelle
curl "http://localhost:3001/projects?search=landing"

# Projets par priorité
curl "http://localhost:3001/projects?priority=HIGH&sortBy=deadline&sortOrder=asc"
```

### Changer l'étape d'un projet (Drag & Drop)
```bash
curl -X PATCH http://localhost:3001/projects/PROJECT_ID/stage \
  -H "Content-Type: application/json" \
  -d '{"stage": "MVP"}'
```

## 🔐 Validation et sécurité

- Validation automatique des DTOs avec `class-validator`
- Transformation des données avec `class-transformer`
- CORS configuré pour les frontends (ports 3000 et 5173)
- Gestion d'erreurs standardisée

## 🚦 États des projets

Les projets suivent un workflow linéaire :
- **IDEE** → **MVP** → **TRACTION** → **LEVEE**

Les transitions ne peuvent se faire que vers l'étape suivante ou précédente pour maintenir la cohérence.