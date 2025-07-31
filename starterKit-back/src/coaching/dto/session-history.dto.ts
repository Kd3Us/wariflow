import { IsOptional, IsString, IsNumber, IsArray, IsDateString, IsEnum, Min, Max, IsUUID, IsBoolean, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionHistoryDto {
  @ApiProperty({ description: 'ID de la session' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'ID du coach' })
  @IsString()
  coachId: string;

  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Nom du coach' })
  @IsString()
  coachName: string;

  @ApiProperty({ description: 'Date de la séance' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Durée en minutes', minimum: 15 })
  @IsNumber()
  @Min(15)
  duration: number;

  @ApiProperty({ description: 'Sujet de la séance' })
  @IsString()
  topic: string;

  @ApiPropertyOptional({ description: 'Notes de la séance' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Objectifs de la séance' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ description: 'Tags associés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSessionHistoryDto {
  @ApiPropertyOptional({ description: 'Notes de la séance' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Objectifs de la séance' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ description: 'Résultats obtenus' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outcomes?: string[];

  @ApiPropertyOptional({ description: 'Prochaines étapes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  @ApiPropertyOptional({ description: 'Tags associés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Données de progression' })
  @IsOptional()
  progress?: {
    goalsAchieved: number;
    totalGoals: number;
    skillsImproved: string[];
    nextFocusAreas: string[];
  };
}

export class AddFeedbackDto {
  @ApiProperty({ description: 'Note de 1 à 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Commentaire de feedback' })
  @IsString()
  feedback: string;

  @ApiPropertyOptional({ description: 'Objectifs de la séance' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ description: 'Résultats obtenus' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outcomes?: string[];

  @ApiPropertyOptional({ description: 'Prochaines étapes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  @ApiPropertyOptional({ description: 'Données de progression' })
  @IsOptional()
  progress?: any;
}

export class CreateDetailedFeedbackDto {
  @ApiProperty({ description: 'ID de l\'historique de session' })
  @IsString()
  sessionHistoryId: string;

  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID du coach' })
  @IsString()
  coachId: string;

  @ApiProperty({ description: 'Note globale de 1 à 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Commentaire détaillé' })
  @IsString()
  comment: string;

  @ApiPropertyOptional({ description: 'Notes par catégories' })
  @IsOptional()
  @ValidateNested()
  categories?: {
    communication: number;
    expertise: number;
    helpfulness: number;
    clarity: number;
    preparation: number;
  };

  @ApiPropertyOptional({ description: 'Aspects positifs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positiveAspects?: string[];

  @ApiPropertyOptional({ description: 'Points d\'amélioration' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvementAreas?: string[];

  @ApiPropertyOptional({ description: 'Recommanderiez-vous ce coach ?' })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @ApiPropertyOptional({ description: 'Rendre public ce feedback' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class SessionHistoryFilterDto {
  @ApiPropertyOptional({ description: 'ID du coach' })
  @IsOptional()
  @IsString()
  coachId?: string;

  @ApiPropertyOptional({ description: 'Date de début' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sujets (séparés par virgule)' })
  @IsOptional()
  @Transform(({ value }) => value ? value.split(',').filter(Boolean) : [])
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @ApiPropertyOptional({ description: 'Tags (séparés par virgule)' })
  @IsOptional()
  @Transform(({ value }) => value ? value.split(',').filter(Boolean) : [])
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Note minimum', minimum: 1, maximum: 5 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Statut de la session', enum: ['completed', 'cancelled', 'no-show'] })
  @IsOptional()
  @IsEnum(['completed', 'cancelled', 'no-show'])
  status?: string;
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Nom du fichier' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Nom original du fichier' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'URL du fichier' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Type MIME' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Taille en octets' })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'Type de document', enum: ['presentation', 'document', 'image', 'video', 'audio', 'other'] })
  @IsEnum(['presentation', 'document', 'image', 'video', 'audio', 'other'])
  type: string;

  @ApiProperty({ description: 'Uploadé par (ID utilisateur)' })
  @IsString()
  uploadedBy: string;

  @ApiPropertyOptional({ description: 'Description du document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags du document' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class TrackProgressDto {
  @ApiProperty({ description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Nom de la compétence' })
  @IsString()
  skillName: string;

  @ApiProperty({ description: 'Niveau actuel (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  currentLevel: number;

  @ApiPropertyOptional({ description: 'Niveau précédent (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  previousLevel?: number;

  @ApiPropertyOptional({ description: 'Niveau cible (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetLevel?: number;

  @ApiPropertyOptional({ description: 'Réalisations' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];

  @ApiPropertyOptional({ description: 'Défis identifiés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  challengesIdentified?: string[];

  @ApiPropertyOptional({ description: 'Actions à mener' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionItems?: string[];

  @ApiPropertyOptional({ description: 'Date du prochain jalon' })
  @IsOptional()
  @IsDateString()
  nextMilestoneDate?: string;

  @ApiPropertyOptional({ description: 'Notes du coach' })
  @IsOptional()
  @IsString()
  coachNotes?: string;

  @ApiPropertyOptional({ description: 'Métriques de performance' })
  @IsOptional()
  @ValidateNested()
  metrics?: {
    confidenceLevel: number;
    practiceHours: number;
    applicationSuccess: number;
    peerFeedback: number;
  };
}

export class CoachResponseDto {
  @ApiProperty({ description: 'Réponse du coach au feedback' })
  @IsString()
  response: string;
}