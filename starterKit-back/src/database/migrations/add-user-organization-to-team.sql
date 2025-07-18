-- Migration pour ajouter la colonne organisation à la table team_members
-- Date: 2025-01-26

-- Ajouter la colonne organisation
ALTER TABLE team_members ADD COLUMN organisation VARCHAR(255);

-- Mettre à jour les enregistrements existants avec une valeur par défaut
-- (vous devrez adapter cette partie selon vos besoins)
UPDATE team_members SET organisation = 'default' WHERE organisation IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les données existantes
ALTER TABLE team_members ALTER COLUMN organisation SET NOT NULL;

-- Optionnel: Ajouter un index sur organisation pour améliorer les performances
CREATE INDEX idx_team_members_user_email ON team_members(organisation);
