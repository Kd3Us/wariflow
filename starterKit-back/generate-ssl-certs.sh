#!/bin/bash

# Script pour générer les certificats SSL pour le développement local

echo "🔐 Génération des certificats SSL pour le développement local..."

# Créer le dossier secrets s'il n'existe pas
mkdir -p secrets

# Générer la clé privée
echo "📝 Génération de la clé privée..."
openssl genrsa -out secrets/private-key.pem 2048

# Générer le certificat auto-signé
echo "📜 Génération du certificat auto-signé..."
openssl req -new -x509 -key secrets/private-key.pem -out secrets/public-certificate.pem -days 365 -subj "/C=FR/ST=France/L=Paris/O=Development/OU=IT/CN=startup-kit.speedpresta.com"

# Vérifier que les fichiers ont été créés
if [ -f "secrets/private-key.pem" ] && [ -f "secrets/public-certificate.pem" ]; then
    echo "✅ Certificats SSL générés avec succès !"
    echo "📁 Fichiers créés :"
    echo "   - secrets/private-key.pem"
    echo "   - secrets/public-certificate.pem"
    echo ""
    echo "🚀 Vous pouvez maintenant lancer votre application en HTTPS"
    echo "   URL: https://localhost:3009"
else
    echo "❌ Erreur lors de la génération des certificats"
    exit 1
fi
