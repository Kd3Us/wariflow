import { IsString, IsEmail, IsNumber, IsArray, IsOptional, MinLength, Min, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoachDto {
  @ApiProperty({ description: 'Nom complet du coach' })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  name: string;

  @ApiProperty({ description: 'Adresse email du coach' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ description: 'URL de l\'avatar', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'URL d\'avatar invalide' })
  avatar?: string;

  @ApiProperty({ description: 'Spécialités du coach', type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @ApiProperty({ description: 'Tarif horaire en euros' })
  @IsNumber({}, { message: 'Le tarif doit être un nombre' })
  @Min(1, { message: 'Le tarif doit être supérieur à 0' })
  hourlyRate: number;

  @ApiProperty({ description: 'Biographie du coach' })
  @IsString()
  @MinLength(50, { message: 'La biographie doit contenir au moins 50 caractères' })
  bio: string;

  @ApiProperty({ description: 'Années d\'expérience' })
  @IsNumber({}, { message: 'L\'expérience doit être un nombre' })
  @Min(0, { message: 'L\'expérience ne peut pas être négative' })
  experience: number;

  @ApiProperty({ description: 'Certifications', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({ description: 'Langues parlées', type: [String] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({ description: 'Fuseau horaire' })
  @IsString()
  timezone: string;

  @ApiProperty({ description: 'Temps de réponse moyen' })
  @IsString()
  responseTime: string;
}