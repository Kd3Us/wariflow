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

  constructor(private readonly projectsService: ProjectsService) {
    console.log('🤖 ChatbotService initialized');
  }

  async generateProject(generateProjectDto: GenerateProjectDto): Promise<ChatbotResponseDto> {
    console.log('🤖 [ChatbotService] Début de génération de projet');
    console.log('📝 [ChatbotService] Description reçue:', generateProjectDto.description);
    
    try {
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
          const createdProject = await this.projectsService.create(projectData);
          createdProjects.push(createdProject);
          console.log(`✅ [ChatbotService] Projet créé: ${createdProject.title}`);
        } catch (error) {
          console.error(`❌ [ChatbotService] Erreur création projet:`, error);
          throw new BadRequestException(`Erreur lors de la création du projet: ${error.message}`);
        }
      }

      const suggestions = this.generateSuggestions(analysis);

      console.log('🎉 [ChatbotService] Génération terminée avec succès');

      return {
        success: true,
        message: `${createdProjects.length} projet(s) généré(s) avec succès`,
        projects: createdProjects,
        analysis,
        suggestions
      };
    } catch (error) {
      console.error('❌ [ChatbotService] Erreur globale:', error);
      throw error;
    }
  }

  analyzeProjectDescription(generateProjectDto: GenerateProjectDto): ProjectAnalysis {
    console.log('🔍 [ChatbotService] Analyse de la description du projet');
    
    const { description, context, targetAudience } = generateProjectDto;
    const fullText = `${description} ${context || ''} ${targetAudience || ''}`;
    
    const keywords = this.extractKeywords(fullText);
    const projectType = this.determineProjectType(keywords, fullText);
    const complexity = this.assessComplexity(fullText, keywords);
    const estimatedDuration = this.calculateDuration(complexity, keywords.length);
    const suggestedTags = this.generateTags(keywords, projectType);
    const suggestedPriority = this.determinePriority(fullText);
    const breakdown = this.generateTaskBreakdown(projectType, complexity, keywords);

    console.log(`📊 [ChatbotService] Analyse terminée - Type: ${projectType}, Complexité: ${complexity}`);

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
    if (!description || description.length < 20) return false;
    
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 5) return false;
    
    const keywords = this.extractKeywords(description);
    return keywords.length > 0 || wordCount >= 10;
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const foundKeywords = new Set<string>();
    
    [...this.techKeywords, ...this.businessKeywords].forEach(keyword => {
      if (lowerText.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    });
    
    return Array.from(foundKeywords);
  }

  private determineProjectType(keywords: string[], text: string): string {
    const lowerText = text.toLowerCase();
    
    if (keywords.some(k => ['android', 'ios', 'mobile'].includes(k)) || lowerText.includes('application mobile')) {
      return 'Application Mobile';
    }
    
    if (keywords.some(k => ['web', 'frontend', 'backend', 'react', 'angular', 'vue'].includes(k)) || lowerText.includes('site web')) {
      return 'Application Web';
    }
    
    if (keywords.some(k => ['api', 'backend', 'database'].includes(k))) {
      return 'API/Backend';
    }
    
    if (keywords.some(k => ['ecommerce', 'boutique', 'magasin', 'vente'].includes(k))) {
      return 'E-commerce';
    }
    
    if (keywords.some(k => ['crm', 'erp', 'gestion'].includes(k))) {
      return 'Système de Gestion';
    }
    
    return 'Projet Business';
  }

  private assessComplexity(text: string, keywords: string[]): 'simple' | 'moyen' | 'complexe' {
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
    
    if (keywords.includes('analytics') || keywords.includes('dashboard')) {
      tasks.push({
        title: 'Analytics et reporting',
        description: 'Mettre en place les outils d\'analyse',
        stage: 'TRACTION',
        estimatedDays: complexity === 'simple' ? 5 : complexity === 'moyen' ? 10 : 15
      });
    }
    
    tasks.push({
      title: 'Tests et optimisation',
      description: 'Tests utilisateurs et optimisation des performances',
      stage: 'TRACTION',
      estimatedDays: complexity === 'simple' ? 7 : complexity === 'moyen' ? 14 : 21
    });
    
    tasks.push({
      title: 'Préparation levée de fonds',
      description: 'Finaliser le pitch et les métriques pour les investisseurs',
      stage: 'LEVEE',
      estimatedDays: complexity === 'simple' ? 10 : complexity === 'moyen' ? 15 : 25
    });
    
    return tasks;
  }

  private createProjectCards(analysis: ProjectAnalysis, generateProjectDto: GenerateProjectDto): CreateProjectDto[] {
    const { breakdown, suggestedTags, suggestedPriority } = analysis;
    const projects: CreateProjectDto[] = [];

    breakdown.forEach((task, index) => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + task.estimatedDays);

      const reminderDate = new Date(deadline.getTime() - 2 * 24 * 60 * 60 * 1000);

      projects.push({
        title: task.title,
        description: task.description,
        stage: task.stage as ProjectStage,
        progress: 0,
        deadline: deadline,
        teamIds: [],
        priority: suggestedPriority,
        tags: suggestedTags,
        reminderDate: reminderDate
      });
    });

    return projects;
  }

  private generateSuggestions(analysis: ProjectAnalysis): string[] {
    const suggestions: string[] = [];
    
    if (analysis.complexity === 'complexe') {
      suggestions.push('Considérez de diviser ce projet en plusieurs phases plus petites');
      suggestions.push('Prévoyez du temps supplémentaire pour les tests et l\'intégration');
    }
    
    if (analysis.keywords.includes('paiement')) {
      suggestions.push('N\'oubliez pas de prévoir la conformité PCI DSS pour les paiements');
    }
    
    if (analysis.keywords.includes('mobile')) {
      suggestions.push('Testez sur différents appareils et versions d\'OS');
    }
    
    if (analysis.suggestedPriority === 'HIGH') {
      suggestions.push('Ce projet semble urgent, assurez-vous d\'avoir les ressources nécessaires');
    }
    
    if (analysis.estimatedDuration > 45) {
      suggestions.push('Pour un projet de cette envergure, considérez une approche agile avec des livraisons régulières');
    }
    
    return suggestions;
  }
}