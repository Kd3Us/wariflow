import { IsOptional, IsNumber, IsString, IsObject, IsArray } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsNumber()
  currentStep?: number;

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

  @IsOptional()
  @IsObject()
  storytellingForm?: {
    archetypes?: string[];
    structureNarrative?: string;
    pitch?: string;
  };

  @IsOptional()
  @IsObject()
  businessModelForm?: {
    market?: string;
    pricing?: string;
  };
}
