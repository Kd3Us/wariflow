import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { GenerateProjectDto } from './dto/generate-project.dto';
import { ChatbotResponseDto, ProjectAnalysis, ProjectTask } from './dto/chatbot-response.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { ProjectStage } from '../common/enums/project-stage.enum';

@Injectable()
export class ChatbotService {
  private readonly techKeywords = [
    'api', 'frontend', 'backend', 'mobile', 'web', 'database', 'ui', 'ux', 
    'design', 'android', 'ios', 'react', 'angular', 'vue', 'node', 'java',
    'python', 'authentification', 'paiement', 'notification', 'chat', 
    'search', 'analytics', 'admin', 'dashboard', 'cms'
  ];

  private readonly businessKeywords = [
    'vente', 'marketing', 'client', 'utilisateur', 'business', 'revenue', 
    'profit', 'ecommerce', 'boutique', 'magasin', 'livraison', 'commande',
    'facture', 'devis', 'crm', 'erp', 'gestion', 'stock', 'inventaire'
  ];

  private readonly urgencyKeywords = [
    'urgent', 'priorité', 'important', 'critique', 'immédiat', 'asap',
    'rapidement', 'vite', 'deadline', 'échéance', 'délai'
  ];

  constructor(private readonly projectsService: ProjectsService) {}

  async generateProject(generateProjectDto: GenerateProjectDto): Promise<ChatbotResponseDto> {
    console.log('🤖 [ChatbotService] Début de génération de projet');
    
    const analysis = this.analyzeProjectDescription(generateProjectDto);
    
    if (!this.isValidProject(generateProjectDto.description)) {
      throw new BadRequestException(
        'La description fournie est trop courte ou ne contient pas assez d\'informations pour générer un projet'
      );
    }

    const projectsToCreate = this.createProjectCards(analysis, generateProjectDto);
    const createdProjects = [];

    console.log(`🔄 [ChatbotService] Création de ${projectsToCreate.length} projets`);

    for (const projectData of projectsToCreate) {
      try {
        const createdProject = this.projectsService.create(projectData);
        createdProjects.push(createdProject);
        console.log(`✅ [ChatbotService] Projet créé: ${createdProject.title}`);
      } catch (error) {
        console.error(`❌ [ChatbotService] Erreur création projet:`, error);
      }
    }

    const response = {
      success: true,
      message: `${createdProjects.length} projet(s) généré(s) avec succès à partir de votre description`,
      projects: createdProjects,
      analysis: analysis,
      suggestions: this.generateOptimizationSuggestions(analysis)
    };

    console.log('✅ [ChatbotService] Génération terminée avec succès');
    return response;
  }

  analyzeProjectDescription(generateProjectDto: GenerateProjectDto): ProjectAnalysis {
    const { description, context, targetAudience } = generateProjectDto;
    const fullText = `${description} ${context || ''} ${targetAudience || ''}`;
    
    const keywords = this.extractKeywords(fullText);
    const projectType = this.identifyProjectType(fullText, keywords);
    const complexity = this.estimateComplexity(fullText, keywords);
    const estimatedDuration = this.calculateDuration(complexity, keywords.length);
    const suggestedTags = this.generateTags(keywords, projectType);
    const suggestedPriority = this.determinePriority(fullText);
    const breakdown = this.generateTaskBreakdown(projectType, complexity, keywords);

    return {
      projectType,
      complexity,
      keywords,
      estimatedDuration,
      suggestedTags,
      suggestedPriority,
      breakdown
    };
  }

  private isValidProject(description: string): boolean {
    const wordCount = description.trim().split(/\s+/).length;
    const hasRelevantKeywords = this.extractKeywords(description).length > 0;
    
    return description.length >= 20 && wordCount >= 5 && hasRelevantKeywords;
  }

  private extractKeywords(text: string): string[] {
    const normalizedText = text.toLowerCase();
    const foundKeywords = new Set<string>();

    [...this.techKeywords, ...this.businessKeywords].forEach(keyword => {
      if (normalizedText.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    });

    const additionalKeywords = this.extractContextualKeywords(normalizedText);
    additionalKeywords.forEach(keyword => foundKeywords.add(keyword));

    return Array.from(foundKeywords);
  }

  private extractContextualKeywords(text: string): string[] {
    const contextualKeywords = [];
    
    if (text.includes('boutique') || text.includes('magasin') || text.includes('e-commerce')) {
      contextualKeywords.push('commerce');
    }
    
    if (text.includes('réservation') || text.includes('booking')) {
      contextualKeywords.push('réservation');
    }
    
    if (text.includes('social') || text.includes('communauté')) {
      contextualKeywords.push('social');
    }
    
    if (text.includes('formation') || text.includes('éducation')) {
      contextualKeywords.push('éducation');
    }
    
    return contextualKeywords;
  }

  private identifyProjectType(text: string, keywords: string[]): string {
    const techCount = keywords.filter(k => this.techKeywords.includes(k)).length;
    const businessCount = keywords.filter(k => this.businessKeywords.includes(k)).length;
    
    if (text.includes('mobile') || text.includes('app') || text.includes('android') || text.includes('ios')) {
      return 'Application Mobile';
    }
    
    if (text.includes('web') || text.includes('site') || text.includes('frontend')) {
      return 'Application Web';
    }
    
    if (text.includes('api') || text.includes('backend') || text.includes('serveur')) {
      return 'API/Backend';
    }
    
    if (businessCount > techCount) {
      return 'Projet Business';
    }
    
    return 'Projet Technique';
  }

  private estimateComplexity(text: string, keywords: string[]): 'simple' | 'moyen' | 'complexe' {
    let complexityScore = 0;
    
    if (keywords.length > 5) complexityScore += 2;
    if (keywords.length > 10) complexityScore += 2;
    
    if (text.includes('authentification') || text.includes('paiement')) complexityScore += 3;
    if (text.includes('admin') || text.includes('dashboard')) complexityScore += 2;
    if (text.includes('notification') || text.includes('temps réel')) complexityScore += 2;
    if (text.includes('analytics') || text.includes('reporting')) complexityScore += 2;
    
    if (complexityScore <= 3) return 'simple';
    if (complexityScore <= 7) return 'moyen';
    return 'complexe';
  }

  private calculateDuration(complexity: 'simple' | 'moyen' | 'complexe', keywordCount: number): number {
    let baseDuration = 0;
    
    switch (complexity) {
      case 'simple': baseDuration = 15; break;
      case 'moyen': baseDuration = 30; break;
      case 'complexe': baseDuration = 60; break;
    }
    
    return baseDuration + Math.floor(keywordCount / 2) * 5;
  }

  private generateTags(keywords: string[], projectType: string): string[] {
    const tags = [...keywords];
    
    if (projectType.includes('Mobile')) tags.push('mobile');
    if (projectType.includes('Web')) tags.push('web');
    if (projectType.includes('API')) tags.push('api');
    if (projectType.includes('Business')) tags.push('business');
    
    return Array.from(new Set(tags)).slice(0, 6);
  }

  private determinePriority(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const urgentCount = this.urgencyKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    if (urgentCount >= 2) return 'HIGH';
    if (urgentCount >= 1) return 'MEDIUM';
    return 'LOW';
  }

  private generateTaskBreakdown(projectType: string, complexity: 'simple' | 'moyen' | 'complexe', keywords: string[]): ProjectTask[] {
    const tasks: ProjectTask[] = [];
    
    tasks.push({
      title: 'Recherche et analyse',
      description: 'Analyser le marché et définir les besoins',
      stage: 'IDEE',
      estimatedDays: complexity === 'simple' ? 3 : complexity === 'moyen' ? 5 : 7
    });
    
    if (projectType.includes('Mobile') || projectType.includes('Web')) {
      tasks.push({
        title: 'Design UI/UX',
        description: 'Créer les maquettes et l\'expérience utilisateur',
        stage: 'IDEE',
        estimatedDays: complexity === 'simple' ? 5 : complexity === 'moyen' ? 8 : 12
      });
    }
    
    tasks.push({
      title: 'Développement MVP',
      description: 'Créer la version minimale viable',
      stage: 'MVP',
      estimatedDays: complexity === 'simple' ? 10 : complexity === 'moyen' ? 20 : 35
    });
    
    if (keywords.includes('authentification') || keywords.includes('paiement')) {
      tasks.push({
        title: 'Intégrations critiques',
        description: 'Intégrer l\'authentification et les paiements',
        stage: 'MVP',
        estimatedDays: complexity === 'simple' ? 5 : complexity === 'moyen' ? 8 : 12
      });
    }
    
    tasks.push({
      title: 'Tests et optimisation',
      description: 'Tester et optimiser les performances',
      stage: 'TRACTION',
      estimatedDays: complexity === 'simple' ? 3 : complexity === 'moyen' ? 5 : 8
    });
    
    tasks.push({
      title: 'Marketing et lancement',
      description: 'Préparer le lancement et la stratégie marketing',
      stage: 'TRACTION',
      estimatedDays: complexity === 'simple' ? 5 : complexity === 'moyen' ? 8 : 12
    });
    
    return tasks;
  }

  private createProjectCards(analysis: ProjectAnalysis, generateProjectDto: GenerateProjectDto): CreateProjectDto[] {
    const projects: CreateProjectDto[] = [];
    
    analysis.breakdown.forEach((task, index) => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + task.estimatedDays + (index * 7));
      
      projects.push({
        title: task.title,
        description: task.description,
        stage: task.stage as ProjectStage,
        priority: index === 0 ? 'HIGH' : analysis.suggestedPriority,
        deadline: deadline,
        tags: analysis.suggestedTags,
        progress: 0,
        teamIds: []
      });
    });
    
    return projects;
  }

  private generateOptimizationSuggestions(analysis: ProjectAnalysis): string[] {
    const suggestions = [];
    
    if (analysis.complexity === 'complexe') {
      suggestions.push('Considérez diviser ce projet en plusieurs phases pour réduire les risques');
    }
    
    if (analysis.keywords.includes('mobile') && analysis.keywords.includes('web')) {
      suggestions.push('Envisagez une approche Progressive Web App (PWA) pour unifier mobile et web');
    }
    
    if (analysis.keywords.includes('authentification')) {
      suggestions.push('Utilisez des solutions d\'authentification externes (OAuth, Auth0) pour accélérer le développement');
    }
    
    if (analysis.estimatedDuration > 45) {
      suggestions.push('Ce projet nécessite une équipe expérimentée. Prévoyez du temps supplémentaire pour les imprévus');
    }
    
    return suggestions;
  }
}