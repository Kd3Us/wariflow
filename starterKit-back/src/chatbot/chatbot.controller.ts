import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
import { ChatbotResponseDto, ProjectAnalysis } from './dto/chatbot-response.dto';
import { Request } from 'express';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('generate-project')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Générer automatiquement des cartes de projet via chatbot',
    description: 'Analyse une description de projet et génère automatiquement les cartes correspondantes avec estimation des délais et répartition des tâches'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Projets générés avec succès', 
    type: ChatbotResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Description du projet insuffisante ou invalide' 
  })
  async generateProject(
    @Body() generateProjectDto: GenerateProjectDto,
    @Req() req: Request
  ): Promise<ChatbotResponseDto> {
    console.log('Generating project cards with chatbot analysis (auth bypassed)');
    return this.chatbotService.generateProject(generateProjectDto);
  }

  @Post('analyze-only')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analyser une description de projet sans créer les cartes',
    description: 'Analyse seulement la description pour fournir des insights sans créer de projets'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse du projet réalisée', 
    type: ProjectAnalysis 
  })
  async analyzeProject(
    @Body() generateProjectDto: GenerateProjectDto,
    @Req() req: Request
  ): Promise<ProjectAnalysis> {
    console.log('Analyzing project description (auth bypassed)');
    return this.chatbotService.analyzeProjectDescription(generateProjectDto);
  }
}