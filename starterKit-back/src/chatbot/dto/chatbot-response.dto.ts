import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../projects/entities/project.entity';

export class ProjectAnalysis {
  @ApiProperty({ description: 'Type de projet identifié' })
  projectType: string;

  @ApiProperty({ description: 'Niveau de complexité estimé' })
  complexity: 'simple' | 'moyen' | 'complexe';

  @ApiProperty({ description: 'Mots-clés extraits', type: [String] })
  keywords: string[];

  @ApiProperty({ description: 'Durée estimée en jours' })
  estimatedDuration: number;

  @ApiProperty({ description: 'Tags suggérés', type: [String] })
  suggestedTags: string[];

  @ApiProperty({ description: 'Priorité suggérée' })
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ description: 'Décomposition du projet en tâches' })
  breakdown: ProjectTask[];
}

export class ProjectTask {
  @ApiProperty({ description: 'Titre de la tâche' })
  title: string;

  @ApiProperty({ description: 'Description de la tâche' })
  description: string;

  @ApiProperty({ description: 'Étape du projet' })
  stage: string;

  @ApiProperty({ description: 'Nombre de jours estimés' })
  estimatedDays: number;
}

export class ChatbotResponseDto {
  @ApiProperty({ description: 'Statut de la génération' })
  success: boolean;

  @ApiProperty({ description: 'Message de retour' })
  message: string;

  @ApiProperty({ description: 'Projets générés', type: [Project] })
  projects: Project[];

  @ApiProperty({ description: 'Analyse du projet', type: ProjectAnalysis })
  analysis: ProjectAnalysis;

  @ApiProperty({ description: 'Suggestions d\'amélioration', type: [String] })
  suggestions: string[];
}