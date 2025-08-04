import { IsString, IsEmail, IsNumber, IsArray, IsOptional, MinLength, Min, IsUrl } from 'class-validator';

export class CreateCoachDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  name: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL d\'avatar invalide' })
  avatar?: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsNumber({}, { message: 'Le tarif doit être un nombre' })
  @Min(1, { message: 'Le tarif doit être supérieur à 0' })
  hourlyRate: number;

  @IsString()
  @MinLength(50, { message: 'La biographie doit contenir au moins 50 caractères' })
  bio: string;

  @IsNumber({}, { message: 'L\'expérience doit être un nombre' })
  @Min(0, { message: 'L\'expérience ne peut pas être négative' })
  experience: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsString()
  timezone: string;

  @IsString()
  responseTime: string;
}