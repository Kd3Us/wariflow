import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class GenerateProjectDto {
  @ApiProperty({ 
    description: 'Description détaillée du projet à générer',
    example: 'Je veux créer une application mobile de livraison de nourriture avec géolocalisation et paiement en ligne'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'La description doit contenir au moins 20 caractères' })
  description: string;

  @ApiProperty({ 
    description: 'Contexte ou contraintes spécifiques',
    example: 'Budget limité, deadline dans 3 mois',
    required: false
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({ 
    description: 'Public cible du projet',
    example: 'Jeunes urbains 18-35 ans',
    required: false
  })
  @IsOptional()
  @IsString()
  targetAudience?: string;
}