import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Get } from '@nestjs/common';
import { CoachingService } from '../service/coaching.service';
import { CreateCoachDto } from '../dto/create-coach.dto';
import { TokenAuthGuard } from '../../common/guards/token-auth.guard';

@Controller('coaching/coaches')
@UseGuards(TokenAuthGuard)
export class CoachController {
  constructor(private readonly coachingService: CoachingService) {}

  @Post()
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
  async findAll() {
    return await this.coachingService.getAllCoaches();
  }
}