import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, HttpException, HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamMember } from './entities/team-member.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { Request } from 'express';

@ApiTags('teams')
@Controller('teams')
@UseGuards(TokenAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les membres de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Liste des membres de l\'équipe' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  async findAll(@Req() req: Request): Promise<TeamMember[]> {
    const validatedToken = req['validatedToken'];
    console.log('Accessing teams with token:', validatedToken);

    const organization = req['userInfo']?.['organization'];
    if (!organization) {
      throw new Error('Organisation non trouvée dans le token');
    }
    
    return this.teamsService.findByOrganisation(organization);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un membre de l\'équipe spécifique' })
  @ApiResponse({ status: 200, description: 'Membre de l\'équipe trouvé' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Membre de l\'équipe non trouvé' })
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<TeamMember> {
    const validatedToken = req['validatedToken'];
    console.log('Accessing team member with token:', validatedToken);
    
    const member = await this.teamsService.findOne(id);
    if (!member) {
      throw new NotFoundException('Membre de l\'équipe non trouvé');
    }
    return member;
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau membre de l\'équipe' })
  @ApiResponse({ status: 201, description: 'Membre de l\'équipe créé avec succès', type: TeamMember })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async create(@Body() createTeamMemberDto: CreateTeamMemberDto, @Req() req: Request): Promise<TeamMember> {
    const validatedToken = req['validatedToken'];
    console.log('Creating team member with token:', validatedToken);
    
    try {
      // Récupérer les informations utilisateur depuis le token
      const organization = req['userInfo']?.['organization'] || null;
      console.log('Organization from token:', organization);
      return await this.teamsService.create(createTeamMemberDto, organization);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new ConflictException('Un membre avec cet email existe déjà');
      }
      console.error('Error creating team member:', error);
      throw error;
    }
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un membre de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Membre de l\'équipe mis à jour avec succès', type: TeamMember })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Membre de l\'équipe non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async update(@Param('id') id: string, @Body() updateTeamMemberDto: UpdateTeamMemberDto, @Req() req: Request): Promise<TeamMember> {
    const validatedToken = req['validatedToken'];
    console.log('Updating team member with token:', validatedToken);
    
    try {
      const updatedMember = await this.teamsService.update(id, updateTeamMemberDto);
      if (!updatedMember) {
        throw new NotFoundException('Membre de l\'équipe non trouvé');
      }
      return updatedMember;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new ConflictException('Un membre avec cet email existe déjà');
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un membre de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Membre de l\'équipe supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Membre de l\'équipe non trouvé' })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<{ message: string }> {
    const validatedToken = req['validatedToken'];
    console.log('Deleting team member with token:', validatedToken);
    
    const member = await this.teamsService.findOne(id);
    if (!member) {
      throw new NotFoundException('Membre de l\'équipe non trouvé');
    }
    
    await this.teamsService.remove(id);
    return { message: 'Membre de l\'équipe supprimé avec succès' };
  }
}
