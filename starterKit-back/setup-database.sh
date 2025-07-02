#!/bin/bash

echo "🚀 Configuration de la base de données PostgreSQL pour SpeedPresta"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"

# Arrêter les conteneurs existants s'ils existent
echo "🛑 Arrêt des conteneurs existants..."
docker-compose -f docker-compose.db.yml down

# Démarrer PostgreSQL
echo "🐘 Démarrage de PostgreSQL..."
docker-compose -f docker-compose.db.yml up -d

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
sleep 10

# Vérifier la connexion à la base de données
echo "🔍 Vérification de la connexion à la base de données..."
docker exec speedpresta_postgres pg_isready -U postgres

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL est prêt!"
    echo ""
    echo "📋 Informations de connexion:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: speedpresta_db"
    echo "   Username: postgres"
    echo "   Password: ********"
    echo ""
    echo "🎯 Vous pouvez maintenant démarrer votre application NestJS avec:"
    echo "   npm run start"
else
    echo "❌ Erreur lors de la connexion à PostgreSQL"
    exit 1
fi
