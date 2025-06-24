import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
import { ChatbotResponseDto, ProjectAnalysis } from './dto/chatbot-response.dto';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('generate-project')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Générer automatiquement des cartes de projet via chatbot',
    description: 'Analyse une description de projet et génère automatiquement les cartes correspondantes'
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
    @Body() generateProjectDto: GenerateProjectDto
  ): Promise<ChatbotResponseDto> {
    console.log('🤖 [ChatbotController] generateProject appelé');
    console.log('📝 [ChatbotController] Données reçues:', generateProjectDto);
    
    try {
      const result = await this.chatbotService.generateProject(generateProjectDto);
      console.log('✅ [ChatbotController] Projets générés avec succès');
      return result;
    } catch (error) {
      console.error('❌ [ChatbotController] Erreur lors de la génération:', error);
      throw error;
    }
  }

  @Post('analyze-only')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Analyser une description de projet sans créer les cartes',
    description: 'Analyse seulement la description pour fournir des insights'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse du projet réalisée', 
    type: ProjectAnalysis 
  })
  async analyzeProject(
    @Body() generateProjectDto: GenerateProjectDto
  ): Promise<ProjectAnalysis> {
    console.log('🔍 [ChatbotController] analyzeProject appelé');
    
    try {
      const result = this.chatbotService.analyzeProjectDescription(generateProjectDto);
      console.log('✅ [ChatbotController] Analyse terminée avec succès');
      return result;
    } catch (error) {
      console.error('❌ [ChatbotController] Erreur lors de l\'analyse:', error);
      throw error;
    }
  }
}