import { IsOptional, IsNumber, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'ID du projet associé au workspace',
    example: 'project-uuid-123',
    required: false
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Étape actuelle du processus de création',
    example: 1,
    minimum: 1,
    maximum: 4,
    required: false
  })
  @IsOptional()
  @IsNumber()
  currentStep?: number;

  @ApiProperty({
    description: 'Informations personnelles du créateur',
    example: {
      nom: 'Dupont',
      prenom: 'Jean',
      sexe: 'Homme',
      age: 35,
      nationalite: 'Française',
      origine: 'Paris',
      description: 'Entrepreneur passionné par la technologie',
      parcoursUtilisateur: 'Ingénieur informatique avec 10 ans d\'expérience'
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  personForm?: {
    nom?: string;
    prenom?: string;
    sexe?: string;
    age?: number | null;
    nationalite?: string;
    origine?: string;
    description?: string;
    parcoursUtilisateur?: string;
  };

  @ApiProperty({
    description: 'Collection de fiches personas avec formulaire actuel',
    example: {
      personForms: [
        {
          id: 'persona-1',
          nom: 'Dupont',
          prenom: 'Jean',
          sexe: 'Homme',
          age: 35,
          nationalite: 'Française',
          origine: 'Paris',
          description: 'Entrepreneur passionné par la technologie',
          parcoursUtilisateur: 'Ingénieur informatique avec 10 ans d\'expérience',
          dateCreation: '2024-01-15T10:30:00Z'
        }
      ],
      currentPersonForm: {
        nom: '',
        prenom: '',
        sexe: '',
        age: null,
        nationalite: '',
        origine: '',
        description: '',
        parcoursUtilisateur: ''
      }
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  personFormData?: {
    personForms?: Array<{
      id: string;
      nom: string;
      prenom: string;
      sexe: string;
      age: number | null;
      nationalite: string;
      origine: string;
      description: string;
      parcoursUtilisateur: string;
      dateCreation: Date;
    }>;
    currentPersonForm?: {
      nom: string;
      prenom: string;
      sexe: string;
      age: number | null;
      nationalite: string;
      origine: string;
      description: string;
      parcoursUtilisateur: string;
    };
  };

  @ApiProperty({
    description: 'Éléments d\'identité visuelle de la marque',
    example: {
      logoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      logoMimeType: 'image/png',
      slogan: 'Innovation et Excellence',
      typography: 'Moderne et épurée',
      valeurs: 'Innovation, Qualité, Proximité client',
      tonMessage: 'Professionnel mais accessible',
      experienceUtilisateur: 'Intuitive et engageante'
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  visualIdentityForm?: {
    logoBase64?: string;
    logoMimeType?: string;
    slogan?: string;
    typography?: string;
    valeurs?: string;
    tonMessage?: string;
    experienceUtilisateur?: string;
  };

  @ApiProperty({
    description: 'Éléments de storytelling et positionnement',
    example: {
      archetypes: ['Le Créateur', 'L\'Explorateur'],
      structureNarrative: 'Histoire de transformation digitale',
      pitch: 'Nous aidons les entreprises à se digitaliser avec des solutions innovantes et sur-mesure.'
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  storytellingForm?: {
    archetypes?: string[];
    structureNarrative?: string;
    pitch?: string;
  };

  @ApiProperty({
    description: 'Modèle économique et stratégie commerciale',
    example: {
      market: 'B2B - PME et ETI',
      pricing: 'Freemium avec abonnements premium'
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  businessModelForm?: {
    market?: string;
    pricing?: string;
  };

}
