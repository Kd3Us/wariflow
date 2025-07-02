-- Migration pour ajouter la colonne userEmail à la table workspaces
-- Date: 2025-01-26

-- Ajouter la colonne userEmail
ALTER TABLE workspaces ADD COLUMN userEmail VARCHAR(255);

-- Mettre à jour les enregistrements existants avec une valeur par défaut
-- (vous devrez adapter cette partie selon vos besoins)
UPDATE workspaces SET userEmail = 'default@example.com' WHERE userEmail IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les données existantes
ALTER TABLE workspaces ALTER COLUMN userEmail SET NOT NULL;

-- Optionnel: Ajouter un index sur userEmail pour améliorer les performances
CREATE INDEX idx_workspaces_user_email ON workspaces(userEmail);
