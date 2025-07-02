-- Migration pour ajouter la colonne personFormData à la table workspaces
-- Date: 2025-01-27
-- Description: Ajoute une nouvelle colonne JSONB pour stocker les données de plusieurs personas

-- Ajouter la colonne personFormData avec une valeur par défaut
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS "personFormData" jsonb DEFAULT '{
  "personForms": [],
  "currentPersonForm": {
    "nom": "",
    "prenom": "",
    "sexe": "",
    "age": null,
    "nationalite": "",
    "origine": "",
    "description": "",
    "parcoursUtilisateur": ""
  }
}'::jsonb;

-- Mettre à jour les enregistrements existants pour s'assurer qu'ils ont la structure par défaut
UPDATE workspaces 
SET "personFormData" = '{
  "personForms": [],
  "currentPersonForm": {
    "nom": "",
    "prenom": "",
    "sexe": "",
    "age": null,
    "nationalite": "",
    "origine": "",
    "description": "",
    "parcoursUtilisateur": ""
  }
}'::jsonb
WHERE "personFormData" IS NULL;

-- Ajouter une contrainte pour s'assurer que personFormData n'est jamais NULL
ALTER TABLE workspaces 
ALTER COLUMN "personFormData" SET NOT NULL;

-- Créer un index sur la colonne personFormData pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_workspaces_person_form_data 
ON workspaces USING gin ("personFormData");

-- Commentaire sur la colonne
COMMENT ON COLUMN workspaces."personFormData" IS 'Données JSON contenant la collection de fiches personas et le formulaire actuel';
