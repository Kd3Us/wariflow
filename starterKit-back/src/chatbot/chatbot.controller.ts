import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
import { ChatbotResponseDto, ProjectAnalysis } from './dto/chatbot-response.dto';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { Request } from 'express';

@ApiTags('chatbot')
@Controller('chatbot')
@UseGuards(TokenAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test de connexion' })
  @ApiResponse({ status: 200, description: 'Service chatbot opérationnel' })
  test(): any {
    return { 
      status: 'ok', 
      message: 'Service chatbot opérationnel', 
      timestamp: new Date().toISOString() 
    };
  }

  @Post('generate-project')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
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
    @Body() generateProjectDto: GenerateProjectDto,
    @Req() req: Request
  ): Promise<ChatbotResponseDto> {
    console.log('[ChatbotController] generateProject appelé');
    console.log('[ChatbotController] Données reçues:', JSON.stringify(generateProjectDto, null, 2));
    
    try {
      const organization = req['userInfo']?.['organization'];
      console.log('[ChatbotController] Organisation du token:', organization);
      
      const result = await this.chatbotService.generateProject(generateProjectDto, organization);
      console.log('[ChatbotController] Projets générés avec succès:', result.projects.length, 'projets');
      return result;
    } catch (error) {
      console.error('[ChatbotController] Erreur lors de la génération:', error.message);
      console.error('[ChatbotController] Stack trace:', error.stack);
      throw error;
    }
  }

  @Post('analyze-only')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
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
    console.log('[ChatbotController] analyzeProject appelé');
    console.log('[ChatbotController] Données reçues:', JSON.stringify(generateProjectDto, null, 2));
    
    try {
      const result = this.chatbotService.analyzeProjectDescription(generateProjectDto);
      console.log('[ChatbotController] Analyse terminée avec succès');
      return result;
    } catch (error) {
      console.error('[ChatbotController] Erreur lors de l\'analyse:', error.message);
      console.error('[ChatbotController] Stack trace:', error.stack);
      throw error;
    }
  }
}