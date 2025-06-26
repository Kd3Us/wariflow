import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamMember } from './entities/team-member.entity';
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
    
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un membre de l\'équipe spécifique' })
  @ApiResponse({ status: 200, description: 'Membre de l\'équipe trouvé' })
  @ApiResponse({ status: 401, description: 'Token d\'authentification requis' })
  @ApiResponse({ status: 404, description: 'Membre de l\'équipe non trouvé' })
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<TeamMember | null> {
    const validatedToken = req['validatedToken'];
    console.log('Accessing team member with token:', validatedToken);
    
    return this.teamsService.findOne(id);
  }
}
