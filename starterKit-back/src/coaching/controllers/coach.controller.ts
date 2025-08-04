import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CoachingService } from '../service/coaching.service';
import { CreateCoachDto } from '../dto/create-coach.dto';
import { TokenAuthGuard } from '../../common/guards/token-auth.guard';

@ApiTags('Coaches Management')
@Controller('coaching/coaches')
@UseGuards(TokenAuthGuard)
export class CoachController {
  constructor(private readonly coachingService: CoachingService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau coach' })
  @ApiBody({ type: CreateCoachDto })
  @ApiResponse({ status: 201, description: 'Coach créé avec succès' })
  @ApiResponse({ status: 409, description: 'Un coach avec cet email existe déjà' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  async create(@Body() createCoachDto: CreateCoachDto) {
    try {
      return await this.coachingService.createCoach(createCoachDto);
    } catch (error) {
      if (error.code === '23505') {
        throw new HttpException(
          'Un coach avec cet email existe déjà',
          HttpStatus.CONFLICT
        );
      }
      throw new HttpException(
        'Erreur lors de la création du coach',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les coaches' })
  @ApiResponse({ status: 200, description: 'Liste de tous les coaches' })
  async findAll() {
    return await this.coachingService.getAllCoaches();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un coach' })
  @ApiParam({ name: 'id', description: 'ID du coach à supprimer' })
  @ApiResponse({ status: 200, description: 'Coach supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  async delete(@Param('id') id: string) {
    return await this.coachingService.deleteCoach(id);
  }
}