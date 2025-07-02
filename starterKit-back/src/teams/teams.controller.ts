import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamMember } from '../common/interfaces/team-member.interface';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les membres de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Liste des membres de l\'équipe' })
  findAll(): TeamMember[] {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un membre de l\'équipe spécifique' })
  @ApiResponse({ status: 200, description: 'Membre de l\'équipe trouvé' })
  @ApiResponse({ status: 404, description: 'Membre de l\'équipe non trouvé' })
  findOne(@Param('id') id: string): TeamMember | undefined {
    return this.teamsService.findOne(id);
  }
}