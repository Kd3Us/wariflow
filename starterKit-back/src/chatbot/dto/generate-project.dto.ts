import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateProjectDto {
  @ApiProperty({
    description: 'Description détaillée du projet à générer',
    example: 'Je veux créer une application mobile de livraison de nourriture avec authentification, paiement et géolocalisation',
    minLength: 20
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20, { message: 'La description doit contenir au moins 20 caractères' })
  description: string;

  @ApiProperty({
    description: 'Contexte supplémentaire du projet',
    example: 'Application destinée aux restaurateurs locaux pour faciliter les commandes en ligne',
    required: false
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiProperty({
    description: 'Public cible du projet',
    example: 'Particuliers âgés de 18 à 45 ans, urbains, avec smartphones',
    required: false
  })
  @IsOptional()
  @IsString()
  targetAudience?: string;
}