# Génération ML des aspects business : milestones, modèle économique, marché cible, concurrence
# Compatible avec pip install mimicx

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import pickle
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, List, Any, Tuple, Optional
import hashlib
import random

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import KMeans
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import SnowballStemmer
from nltk.tag import pos_tag
import warnings
warnings.filterwarnings('ignore')

try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except:
    pass


class BusinessModelAnalyzer:
    """Analyseur de modèles économiques multilingue"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # Modèles économiques par industrie et langue
        self.business_models = {
            'french': {
                'Technology': {
                    'SaaS': 'Logiciel en tant que Service avec abonnement mensuel/annuel',
                    'Freemium': 'Version gratuite avec fonctionnalités premium payantes',
                    'Marketplace': 'Commission sur les transactions entre utilisateurs',
                    'API': 'Facturation par appel API ou volume d\'utilisation',
                    'License': 'Licence logicielle avec support et maintenance'
                },
                'Healthcare': {
                    'B2B_SaaS': 'Abonnement professionnel pour établissements de santé',
                    'Per_Patient': 'Facturation par patient suivi ou traité',
                    'Consultation': 'Frais par consultation ou téléconsultation',
                    'Insurance': 'Remboursement par assurances et mutuelles',
                    'Enterprise': 'Licence enterprise pour hôpitaux et cliniques'
                },
                'Finance': {
                    'Transaction': 'Commission sur chaque transaction financière',
                    'AUM': 'Frais sur les actifs sous gestion (% du portefeuille)',
                    'Spread': 'Marge sur les écarts de taux ou prix',
                    'Premium': 'Abonnement premium pour fonctionnalités avancées',
                    'Advisory': 'Services de conseil financier personnalisé'
                },
                'Education': {
                    'Course_Fee': 'Frais de cours et certifications',
                    'Subscription': 'Abonnement mensuel pour accès illimité',
                    'B2B_License': 'Licence institutionnelle pour écoles/entreprises',
                    'Marketplace': 'Commission sur ventes de cours par instructeurs',
                    'Certification': 'Frais de certification et validation'
                },
                'Retail': {
                    'Commission': 'Commission sur chaque vente (marketplace)',
                    'Subscription': 'Abonnement pour vendeurs premium',
                    'Advertising': 'Publicité et placement produits payants',
                    'Fulfillment': 'Frais de logistique et expédition',
                    'Data': 'Monétisation des données consommateurs'
                },
                'Media': {
                    'Subscription': 'Abonnement streaming ou contenu premium',
                    'Advertising': 'Publicité ciblée et sponsoring',
                    'Pay_Per_View': 'Paiement par contenu consommé',
                    'Creator_Economy': 'Partage revenus avec créateurs de contenu',
                    'Licensing': 'Licence de contenu à des tiers'
                },
                'Logistics': {
                    'Per_Delivery': 'Frais par livraison ou colis transporté',
                    'Route_Optimization': 'Abonnement pour optimisation de routes',
                    'Warehouse': 'Frais de stockage et gestion d\'entrepôt',
                    'B2B_Contract': 'Contrats enterprise avec volume minimum',
                    'Dynamic_Pricing': 'Tarification dynamique selon demande'
                },
                'Energy': {
                    'Energy_Saved': 'Partage des économies d\'énergie réalisées',
                    'IoT_Monitoring': 'Abonnement pour monitoring et alertes',
                    'Maintenance': 'Contrats de maintenance prédictive',
                    'Consulting': 'Services de conseil en efficacité énergétique',
                    'Carbon_Credits': 'Vente de crédits carbone générés'
                }
            },
            'english': {
                'Technology': {
                    'SaaS': 'Software as a Service with monthly/annual subscription',
                    'Freemium': 'Free version with paid premium features',
                    'Marketplace': 'Commission on transactions between users',
                    'API': 'Billing per API call or usage volume',
                    'License': 'Software license with support and maintenance'
                },
                'Healthcare': {
                    'B2B_SaaS': 'Professional subscription for healthcare institutions',
                    'Per_Patient': 'Billing per patient monitored or treated',
                    'Consultation': 'Fees per consultation or telemedicine session',
                    'Insurance': 'Reimbursement through insurance providers',
                    'Enterprise': 'Enterprise license for hospitals and clinics'
                },
                'Finance': {
                    'Transaction': 'Commission on each financial transaction',
                    'AUM': 'Fees on assets under management (% of portfolio)',
                    'Spread': 'Margin on rate or price spreads',
                    'Premium': 'Premium subscription for advanced features',
                    'Advisory': 'Personalized financial advisory services'
                },
                'Education': {
                    'Course_Fee': 'Course and certification fees',
                    'Subscription': 'Monthly subscription for unlimited access',
                    'B2B_License': 'Institutional license for schools/companies',
                    'Marketplace': 'Commission on course sales by instructors',
                    'Certification': 'Certification and validation fees'
                },
                'Retail': {
                    'Commission': 'Commission on each sale (marketplace)',
                    'Subscription': 'Subscription for premium sellers',
                    'Advertising': 'Paid advertising and product placement',
                    'Fulfillment': 'Logistics and shipping fees',
                    'Data': 'Consumer data monetization'
                },
                'Media': {
                    'Subscription': 'Streaming or premium content subscription',
                    'Advertising': 'Targeted advertising and sponsorship',
                    'Pay_Per_View': 'Payment per content consumed',
                    'Creator_Economy': 'Revenue sharing with content creators',
                    'Licensing': 'Content licensing to third parties'
                },
                'Logistics': {
                    'Per_Delivery': 'Fees per delivery or package transported',
                    'Route_Optimization': 'Subscription for route optimization',
                    'Warehouse': 'Storage and warehouse management fees',
                    'B2B_Contract': 'Enterprise contracts with minimum volume',
                    'Dynamic_Pricing': 'Dynamic pricing based on demand'
                },
                'Energy': {
                    'Energy_Saved': 'Sharing of energy savings achieved',
                    'IoT_Monitoring': 'Subscription for monitoring and alerts',
                    'Maintenance': 'Predictive maintenance contracts',
                    'Consulting': 'Energy efficiency consulting services',
                    'Carbon_Credits': 'Sale of generated carbon credits'
                }
            }
        }
        
        # Indicateurs de marché par industrie
        self.market_indicators = {
            'Technology': {
                'size': 'Large',
                'growth': 'High',
                'competition': 'Very High',
                'barriers': 'Medium',
                'scalability': 'Very High'
            },
            'Healthcare': {
                'size': 'Very Large',
                'growth': 'High',
                'competition': 'Medium',
                'barriers': 'Very High',
                'scalability': 'High'
            },
            'Finance': {
                'size': 'Very Large',
                'growth': 'Medium',
                'competition': 'Very High',
                'barriers': 'Very High',
                'scalability': 'High'
            },
            'Education': {
                'size': 'Large',
                'growth': 'High',
                'competition': 'High',
                'barriers': 'Medium',
                'scalability': 'Very High'
            },
            'Retail': {
                'size': 'Very Large',
                'growth': 'Medium',
                'competition': 'Very High',
                'barriers': 'Low',
                'scalability': 'High'
            },
            'Media': {
                'size': 'Large',
                'growth': 'Medium',
                'competition': 'Very High',
                'barriers': 'Medium',
                'scalability': 'High'
            },
            'Logistics': {
                'size': 'Large',
                'growth': 'High',
                'competition': 'High',
                'barriers': 'High',
                'scalability': 'Medium'
            },
            'Energy': {
                'size': 'Very Large',
                'growth': 'Very High',
                'competition': 'Medium',
                'barriers': 'Very High',
                'scalability': 'Medium'
            }
        }
    
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour',
            'développer', 'créer', 'système', 'application', 'plateforme', 'service',
            'utilisateur', 'client', 'marché', 'business', 'entreprise'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or',
            'develop', 'create', 'system', 'application', 'platform', 'service',
            'user', 'client', 'market', 'business', 'enterprise'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'
    
    def analyze_business_context(self, text: str, industry: str, complexity: str) -> Dict[str, Any]:
        """Analyser le contexte business d'un projet"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        # Indicateurs business détectés
        business_indicators = {
            'monetization_signals': [],
            'market_signals': [],
            'user_segments': [],
            'competitive_advantages': [],
            'revenue_potential': 'medium'
        }
        
        # Signaux de monétisation
        if language == 'french':
            monetization_keywords = {
                'subscription': ['abonnement', 'souscription', 'mensuel', 'annuel'],
                'transaction': ['transaction', 'paiement', 'commission', 'vente'],
                'freemium': ['gratuit', 'premium', 'version', 'payante'],
                'advertising': ['publicité', 'pub', 'sponsoring', 'partenariat'],
                'marketplace': ['marketplace', 'plateforme', 'vendeur', 'acheteur']
            }
        else:
            monetization_keywords = {
                'subscription': ['subscription', 'monthly', 'annual', 'recurring'],
                'transaction': ['transaction', 'payment', 'commission', 'sale'],
                'freemium': ['free', 'premium', 'version', 'paid'],
                'advertising': ['advertising', 'ads', 'sponsorship', 'partnership'],
                'marketplace': ['marketplace', 'platform', 'seller', 'buyer']
            }
        
        for model_type, keywords in monetization_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                business_indicators['monetization_signals'].append(model_type)
        
        # Signaux de marché
        if language == 'french':
            market_keywords = ['marché', 'clients', 'utilisateurs', 'demande', 'concurrence', 'niche']
        else:
            market_keywords = ['market', 'customers', 'users', 'demand', 'competition', 'niche']
        
        for keyword in market_keywords:
            if keyword in text_lower:
                business_indicators['market_signals'].append(keyword)
        
        # Segments d'utilisateurs
        if language == 'french':
            user_segments = {
                'B2B': ['entreprise', 'business', 'professionnel', 'société'],
                'B2C': ['particulier', 'consommateur', 'individuel', 'personnel'],
                'B2B2C': ['partenaire', 'revendeur', 'distributeur']
            }
        else:
            user_segments = {
                'B2B': ['business', 'enterprise', 'professional', 'company'],
                'B2C': ['consumer', 'individual', 'personal', 'user'],
                'B2B2C': ['partner', 'reseller', 'distributor']
            }
        
        for segment, keywords in user_segments.items():
            if any(keyword in text_lower for keyword in keywords):
                business_indicators['user_segments'].append(segment)
        
        # Avantages concurrentiels
        if language == 'french':
            competitive_keywords = [
                'innovation', 'unique', 'exclusif', 'propriétaire', 'breveté',
                'intelligence artificielle', 'ia', 'machine learning', 'blockchain',
                'temps réel', 'automatisation', 'optimisation'
            ]
        else:
            competitive_keywords = [
                'innovation', 'unique', 'exclusive', 'proprietary', 'patented',
                'artificial intelligence', 'ai', 'machine learning', 'blockchain',
                'real time', 'automation', 'optimization'
            ]
        
        for keyword in competitive_keywords:
            if keyword in text_lower:
                business_indicators['competitive_advantages'].append(keyword)
        
        # Potentiel de revenus basé sur complexité et industrie
        revenue_score = 0
        if complexity in ['complexe', 'expert']:
            revenue_score += 2
        elif complexity == 'moyen':
            revenue_score += 1
        
        if industry in ['Finance', 'Healthcare', 'Energy']:
            revenue_score += 2
        elif industry in ['Technology', 'Education']:
            revenue_score += 1
        
        if revenue_score >= 3:
            business_indicators['revenue_potential'] = 'high'
        elif revenue_score >= 2:
            business_indicators['revenue_potential'] = 'medium'
        else:
            business_indicators['revenue_potential'] = 'low'
        
        return {
            'language': language,
            'business_indicators': business_indicators,
            'market_context': self.market_indicators.get(industry, {}),
            'suggested_models': list(self.business_models[language].get(industry, {}).keys())
        }


class MilestoneGenerator:
    """Générateur intelligent de jalons multilingue"""
    
    def __init__(self):
        self.milestone_templates = {
            'french': {
                'conception': [
                    'Analyse des besoins et étude de marché',
                    'Conception architecture et design système',
                    'Validation prototype et spécifications',
                    'Planification détaillée et ressources'
                ],
                'développement': [
                    'Développement MVP et fonctionnalités core',
                    'Intégration des services et APIs',
                    'Implémentation sécurité et performance',
                    'Tests et validation qualité'
                ],
                'lancement': [
                    'Déploiement environnement production',
                    'Tests utilisateurs et feedback',
                    'Lancement beta et première version',
                    'Marketing et acquisition clients'
                ],
                'croissance': [
                    'Optimisation performance et scaling',
                    'Nouvelles fonctionnalités utilisateurs',
                    'Expansion géographique ou segments',
                    'Partenariats stratégiques'
                ]
            },
            'english': {
                'conception': [
                    'Requirements analysis and market study',
                    'Architecture design and system conception',
                    'Prototype validation and specifications',
                    'Detailed planning and resource allocation'
                ],
                'développement': [
                    'MVP development and core features',
                    'Service and API integration',
                    'Security and performance implementation',
                    'Testing and quality validation'
                ],
                'lancement': [
                    'Production environment deployment',
                    'User testing and feedback collection',
                    'Beta launch and first version',
                    'Marketing and customer acquisition'
                ],
                'croissance': [
                    'Performance optimization and scaling',
                    'New user features and enhancements',
                    'Geographic or segment expansion',
                    'Strategic partnerships'
                ]
            }
        }
        
        # Durées par phase selon la complexité (en jours)
        self.phase_durations = {
            'simple': {
                'conception': 10,
                'développement': 30,
                'lancement': 15,
                'croissance': 20
            },
            'moyen': {
                'conception': 20,
                'développement': 60,
                'lancement': 25,
                'croissance': 35
            },
            'complexe': {
                'conception': 35,
                'développement': 90,
                'lancement': 40,
                'croissance': 50
            },
            'expert': {
                'conception': 50,
                'développement': 120,
                'lancement': 60,
                'croissance': 70
            }
        }
        
        # Ajustements par industrie
        self.industry_adjustments = {
            'Healthcare': {'all_phases': 1.3, 'conception': 1.5},
            'Finance': {'all_phases': 1.2, 'conception': 1.4},
            'Energy': {'all_phases': 1.1, 'développement': 1.3},
            'Education': {'all_phases': 0.9, 'lancement': 1.2},
            'Retail': {'all_phases': 0.8, 'lancement': 1.1},
            'Media': {'all_phases': 0.9, 'croissance': 1.2},
            'Logistics': {'all_phases': 1.0, 'développement': 1.1},
            'Technology': {'all_phases': 0.9, 'développement': 1.0}
        }
    
    def generate_milestones(self, project_description: str, industry: str, complexity: str, 
                          estimated_duration: int, language: str) -> List[Dict[str, Any]]:
        """Générer des jalons intelligents pour le projet"""
        
        # Durées de base par phase
        base_durations = self.phase_durations.get(complexity, self.phase_durations['moyen'])
        
        # Ajustements industrie
        industry_adj = self.industry_adjustments.get(industry, {'all_phases': 1.0})
        
        # Calculer les durées ajustées
        adjusted_durations = {}
        for phase, duration in base_durations.items():
            # Appliquer ajustement global industrie
            adjusted_duration = duration * industry_adj.get('all_phases', 1.0)
            # Appliquer ajustement spécifique à la phase
            adjusted_duration *= industry_adj.get(phase, 1.0)
            adjusted_durations[phase] = int(adjusted_duration)
        
        # Normaliser pour correspondre à la durée totale estimée
        total_base = sum(adjusted_durations.values())
        scale_factor = estimated_duration / total_base if total_base > 0 else 1.0
        
        for phase in adjusted_durations:
            adjusted_durations[phase] = max(int(adjusted_durations[phase] * scale_factor), 5)
        
        # Générer les jalons
        milestones = []
        current_date = datetime.now()
        cumulative_duration = 0
        
        templates = self.milestone_templates[language]
        
        for phase_name, phase_duration in adjusted_durations.items():
            phase_milestones = templates[phase_name]
            milestones_per_phase = len(phase_milestones)
            
            for i, milestone_template in enumerate(phase_milestones):
                # Calculer la date du jalon
                milestone_duration = phase_duration // milestones_per_phase
                if i == milestones_per_phase - 1:  # Dernier jalon de la phase
                    milestone_duration = phase_duration - (milestone_duration * i)
                
                cumulative_duration += milestone_duration
                milestone_date = self._calculate_working_date(current_date, cumulative_duration)
                
                # Personnaliser le jalon selon le projet
                customized_name = self._customize_milestone_name(
                    milestone_template, project_description, industry, language
                )
                
                # Déterminer la criticité
                criticality = self._determine_criticality(phase_name, i, milestones_per_phase)
                
                milestones.append({
                    'name': customized_name,
                    'phase': phase_name,
                    'date': milestone_date,
                    'duration_days': milestone_duration,
                    'cumulative_days': cumulative_duration,
                    'progress_percentage': int((cumulative_duration / estimated_duration) * 100),
                'criticality': criticality,
                    'description': self._generate_milestone_description(
                        milestone_template, industry, complexity, language
                    ),
                    'dependencies': self._determine_dependencies(phase_name, i, milestones),
                    'deliverables': self._generate_deliverables(
                        milestone_template, industry, language
                    )
                })
        
        return milestones
    
    def _calculate_working_date(self, start_date: datetime, duration_days: int) -> str:
        """Calculer une date en excluant les week-ends"""
        current_date = start_date
        working_days_added = 0
        
        while working_days_added < duration_days:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5:  # Lundi à vendredi
                working_days_added += 1
        
        return current_date.strftime('%Y-%m-%d')
    
    def _customize_milestone_name(self, template: str, project_description: str, 
                                 industry: str, language: str) -> str:
        """Personnaliser le nom du jalon selon le projet"""
        # Extraire des mots-clés du projet
        keywords = self._extract_project_keywords(project_description, language)
        
        # Remplacements contextuels
        customized = template
        
        if language == 'french':
            if 'mobile' in project_description.lower():
                customized = customized.replace('système', 'application mobile')
            elif 'web' in project_description.lower():
                customized = customized.replace('système', 'application web')
            elif 'api' in project_description.lower():
                customized = customized.replace('système', 'API et services')
        else:
            if 'mobile' in project_description.lower():
                customized = customized.replace('system', 'mobile application')
            elif 'web' in project_description.lower():
                customized = customized.replace('system', 'web application')
            elif 'api' in project_description.lower():
                customized = customized.replace('system', 'API and services')
        
        # Ajout du contexte industrie
        if industry in ['Healthcare', 'Finance'] and 'sécurité' in customized.lower():
            if language == 'french':
                customized += ' et conformité réglementaire'
            else:
                customized += ' and regulatory compliance'
        
        return customized
    
    def _extract_project_keywords(self, description: str, language: str) -> List[str]:
        """Extraire les mots-clés pertinents du projet"""
        tokens = word_tokenize(description.lower())
        
        # Mots-clés techniques importants
        if language == 'french':
            important_keywords = [
                'mobile', 'web', 'api', 'intelligence artificielle', 'ia',
                'machine learning', 'blockchain', 'iot', 'cloud', 'saas'
            ]
        else:
            important_keywords = [
                'mobile', 'web', 'api', 'artificial intelligence', 'ai',
                'machine learning', 'blockchain', 'iot', 'cloud', 'saas'
            ]
        
        found_keywords = []
        for keyword in important_keywords:
            if keyword in description.lower():
                found_keywords.append(keyword)
        
        return found_keywords[:3]  # Limiter à 3 mots-clés
    
    def _determine_criticality(self, phase_name: str, milestone_index: int, 
                              total_milestones: int) -> str:
        """Déterminer la criticité d'un jalon"""
        # Premiers et derniers jalons sont plus critiques
        if milestone_index == 0 or milestone_index == total_milestones - 1:
            return 'HIGH'
        
        # Jalons de développement et lancement sont critiques
        if phase_name in ['développement', 'lancement']:
            return 'HIGH'
        
        return 'MEDIUM'
    
    def _generate_milestone_description(self, template: str, industry: str, 
                                       complexity: str, language: str) -> str:
        """Générer une description détaillée du jalon"""
        if language == 'french':
            base_desc = f"Jalon important pour {industry} avec complexité {complexity}. "
            
            if 'conception' in template.lower():
                base_desc += "Définir les spécifications techniques et fonctionnelles précises."
            elif 'développement' in template.lower():
                base_desc += "Implémentation des fonctionnalités selon les standards de qualité."
            elif 'tests' in template.lower():
                base_desc += "Validation complète avec tests automatisés et manuels."
            elif 'lancement' in template.lower():
                base_desc += "Mise en production avec monitoring et support utilisateur."
            else:
                base_desc += "Étape cruciale du développement du projet."
        else:
            base_desc = f"Important milestone for {industry} with {complexity} complexity. "
            
            if 'conception' in template.lower() or 'design' in template.lower():
                base_desc += "Define precise technical and functional specifications."
            elif 'development' in template.lower():
                base_desc += "Implementation of features according to quality standards."
            elif 'testing' in template.lower():
                base_desc += "Complete validation with automated and manual tests."
            elif 'launch' in template.lower():
                base_desc += "Production deployment with monitoring and user support."
            else:
                base_desc += "Crucial step in project development."
        
        return base_desc
    
    def _determine_dependencies(self, phase_name: str, milestone_index: int, 
                               existing_milestones: List[Dict]) -> List[str]:
        """Déterminer les dépendances d'un jalon"""
        dependencies = []
        
        # Le premier jalon n'a pas de dépendances
        if milestone_index == 0 and phase_name == 'conception':
            return dependencies
        
        # Chaque jalon dépend du précédent
        if existing_milestones:
            dependencies.append(existing_milestones[-1]['name'])
        
        # Dépendances spécifiques par phase
        if phase_name == 'développement' and milestone_index == 0:
            # Premier jalon de développement dépend de la conception
            conception_milestones = [m for m in existing_milestones if m['phase'] == 'conception']
            if conception_milestones:
                dependencies.append(conception_milestones[-1]['name'])
        
        return dependencies
    
    def _generate_deliverables(self, template: str, industry: str, language: str) -> List[str]:
        """Générer les livrables attendus pour un jalon"""
        deliverables = []
        
        if language == 'french':
            if 'analyse' in template.lower():
                deliverables.extend([
                    'Document d\'analyse des besoins',
                    'Étude de marché et concurrence',
                    'Spécifications fonctionnelles'
                ])
            elif 'conception' in template.lower():
                deliverables.extend([
                    'Architecture technique',
                    'Maquettes et wireframes',
                    'Spécifications techniques'
                ])
            elif 'développement' in template.lower():
                deliverables.extend([
                    'Code source fonctionnel',
                    'Documentation technique',
                    'Tests unitaires'
                ])
            elif 'test' in template.lower():
                deliverables.extend([
                    'Plan de tests',
                    'Rapports de tests',
                    'Validation qualité'
                ])
            elif 'lancement' in template.lower():
                deliverables.extend([
                    'Version production',
                    'Documentation utilisateur',
                    'Plan de déploiement'
                ])
            else:
                deliverables.append('Livrable défini selon contexte')
        else:
            if 'analysis' in template.lower():
                deliverables.extend([
                    'Requirements analysis document',
                    'Market and competition study',
                    'Functional specifications'
                ])
            elif 'design' in template.lower():
                deliverables.extend([
                    'Technical architecture',
                    'Mockups and wireframes',
                    'Technical specifications'
                ])
            elif 'development' in template.lower():
                deliverables.extend([
                    'Functional source code',
                    'Technical documentation',
                    'Unit tests'
                ])
            elif 'testing' in template.lower():
                deliverables.extend([
                    'Test plan',
                    'Test reports',
                    'Quality validation'
                ])
            elif 'launch' in template.lower():
                deliverables.extend([
                    'Production version',
                    'User documentation',
                    'Deployment plan'
                ])
            else:
                deliverables.append('Context-defined deliverable')
        
        return deliverables[:3]  # Limiter à 3 livrables principaux


class MarketTargetAnalyzer:
    """Analyseur de marché cible multilingue"""
    
    def __init__(self):
        self.target_segments = {
            'french': {
                'B2B': {
                    'PME': 'Petites et moyennes entreprises (10-250 employés)',
                    'Enterprise': 'Grandes entreprises (+250 employés)',
                    'Startup': 'Startups et scale-ups innovantes',
                    'Institutionnel': 'Organisations gouvernementales et publiques'
                },
                'B2C': {
                    'Millennials': 'Génération Y (25-40 ans) technophile',
                    'Gen_Z': 'Génération Z (18-25 ans) digital native',
                    'Professionnels': 'Professionnels actifs (30-50 ans)',
                    'Seniors': 'Seniors adoptant le digital (50+ ans)'
                },
                'B2B2C': {
                    'Partenaires': 'Partenaires distributeurs et revendeurs',
                    'Marketplace': 'Plateformes et marketplaces existantes',
                    'Integrateurs': 'Intégrateurs et consultants'
                }
            },
            'english': {
                'B2B': {
                    'SMB': 'Small and medium businesses (10-250 employees)',
                    'Enterprise': 'Large enterprises (250+ employees)',
                    'Startup': 'Innovative startups and scale-ups',
                    'Government': 'Government and public organizations'
                },
                'B2C': {
                    'Millennials': 'Millennial generation (25-40 years) tech-savvy',
                    'Gen_Z': 'Generation Z (18-25 years) digital natives',
                    'Professionals': 'Active professionals (30-50 years)',
                    'Seniors': 'Seniors adopting digital (50+ years)'
                },
                'B2B2C': {
                    'Partners': 'Distribution and reseller partners',
                    'Marketplace': 'Existing platforms and marketplaces',
                    'Integrators': 'Integrators and consultants'
                }
            }
        }
        
        # Taille de marché par industrie (en milliards €)
        self.market_sizes = {
            'Technology': {
                'global': 5000,
                'europe': 800,
                'france': 120,
                'growth_rate': 8.5
            },
            'Healthcare': {
                'global': 2500,
                'europe': 400,
                'france': 60,
                'growth_rate': 12.0
            },
            'Finance': {
                'global': 3000,
                'europe': 500,
                'france': 80,
                'growth_rate': 6.5
            },
            'Education': {
                'global': 400,
                'europe': 60,
                'france': 10,
                'growth_rate': 15.0
            },
            'Retail': {
                'global': 8000,
                'europe': 1200,
                'france': 180,
                'growth_rate': 5.5
            },
            'Media': {
                'global': 800,
                'europe': 120,
                'france': 20,
                'growth_rate': 9.0
            },
            'Logistics': {
                'global': 1500,
                'europe': 250,
                'france': 40,
                'growth_rate': 7.0
            },
            'Energy': {
                'global': 2000,
                'europe': 300,
                'france': 50,
                'growth_rate': 20.0
            }
        }
    
    def analyze_target_market(self, project_description: str, industry: str, 
                             complexity: str, language: str) -> Dict[str, Any]:
        """Analyser le marché cible d'un projet"""
        
        # Déterminer le segment principal
        primary_segment = self._determine_primary_segment(project_description, industry, language)
        
        # Analyser la taille du marché
        market_size = self._calculate_market_size(industry, complexity, primary_segment)
        
        # Identifier les personas cibles
        personas = self._generate_target_personas(project_description, industry, primary_segment, language)
        
        # Analyser la concurrence
        competition_analysis = self._analyze_competition(industry, complexity, language)
        
        # Stratégie de pénétration du marché
        penetration_strategy = self._generate_penetration_strategy(
            primary_segment, industry, complexity, language
        )
        
        # Opportunités de croissance
        growth_opportunities = self._identify_growth_opportunities(
            industry, primary_segment, language
        )
        
        return {
            'primary_segment': primary_segment,
            'market_size': market_size,
            'target_personas': personas,
            'competition_analysis': competition_analysis,
            'penetration_strategy': penetration_strategy,
            'growth_opportunities': growth_opportunities,
            'market_trends': self._get_market_trends(industry, language),
            'regional_focus': self._determine_regional_focus(project_description, language)
        }
    
    def _determine_primary_segment(self, description: str, industry: str, language: str) -> str:
        """Déterminer le segment de marché principal"""
        desc_lower = description.lower()
        
        # Indicateurs B2B
        if language == 'french':
            b2b_indicators = [
                'entreprise', 'business', 'professionnel', 'corporate', 'société',
                'organisation', 'équipe', 'collaboration', 'workflow', 'crm'
            ]
            b2c_indicators = [
                'utilisateur', 'consommateur', 'particulier', 'personnel', 'individuel',
                'famille', 'grand public', 'mobile', 'app', 'social'
            ]
        else:
            b2b_indicators = [
                'business', 'enterprise', 'professional', 'corporate', 'company',
                'organization', 'team', 'collaboration', 'workflow', 'crm'
            ]
            b2c_indicators = [
                'user', 'consumer', 'individual', 'personal', 'family',
                'public', 'mobile', 'app', 'social', 'consumer'
            ]
        
        b2b_score = sum(1 for indicator in b2b_indicators if indicator in desc_lower)
        b2c_score = sum(1 for indicator in b2c_indicators if indicator in desc_lower)
        
        # Ajustement par industrie
        if industry in ['Healthcare', 'Finance']:
            b2b_score += 1  # Tendance B2B
        elif industry in ['Media', 'Retail']:
            b2c_score += 1  # Tendance B2C
        
        if b2b_score > b2c_score:
            return 'B2B'
        elif b2c_score > b2b_score:
            return 'B2C'
        else:
            return 'B2B2C'  # Mixte
    
    def _calculate_market_size(self, industry: str, complexity: str, segment: str) -> Dict[str, Any]:
        """Calculer la taille du marché adressable"""
        base_market = self.market_sizes.get(industry, self.market_sizes['Technology'])
        
        # Ajustement par segment
        segment_multiplier = {
            'B2B': 0.3,      # 30% du marché total
            'B2C': 0.6,      # 60% du marché total
            'B2B2C': 0.4     # 40% du marché total
        }
        
        multiplier = segment_multiplier.get(segment, 0.4)
        
        # Ajustement par complexité (projets plus complexes = marché plus spécialisé)
        complexity_multiplier = {
            'simple': 1.0,
            'moyen': 0.8,
            'complexe': 0.6,
            'expert': 0.4
        }
        
        complexity_adj = complexity_multiplier.get(complexity, 0.8)
        
        return {
            'tam_global': int(base_market['global'] * multiplier),
            'tam_europe': int(base_market['europe'] * multiplier),
            'tam_france': int(base_market['france'] * multiplier),
            'sam_estimated': int(base_market['france'] * multiplier * complexity_adj * 0.1),
            'som_target': int(base_market['france'] * multiplier * complexity_adj * 0.01),
            'growth_rate': base_market['growth_rate'],
            'currency': 'EUR',
            'timeframe': '2024-2027'
        }
    
    def _generate_target_personas(self, description: str, industry: str, 
                                 segment: str, language: str) -> List[Dict[str, Any]]:
        """Générer les personas cibles"""
        personas = []
        
        segments = self.target_segments[language][segment]
        
        # Sélectionner 2-3 personas les plus pertinents
        selected_personas = list(segments.keys())[:3]
        
        for persona_key in selected_personas:
            persona_desc = segments[persona_key]
            
            # Personnaliser selon l'industrie
            if industry == 'Healthcare':
                if segment == 'B2B':
                    if language == 'french':
                        pain_points = [
                            'Gestion complexe des dossiers patients',
                            'Conformité réglementaire stricte',
                            'Intégration systèmes existants'
                        ]
                        motivations = [
                            'Améliorer qualité des soins',
                            'Réduire erreurs médicales',
                            'Optimiser temps médecins'
                        ]
                    else:
                        pain_points = [
                            'Complex patient record management',
                            'Strict regulatory compliance',
                            'Legacy system integration'
                        ]
                        motivations = [
                            'Improve care quality',
                            'Reduce medical errors',
                            'Optimize physician time'
                        ]
                else:  # B2C
                    if language == 'french':
                        pain_points = [
                            'Accès difficile aux soins',
                            'Suivi médical fragmenté',
                            'Coût des consultations'
                        ]
                        motivations = [
                            'Meilleur suivi santé',
                            'Facilité d\'accès aux soins',
                            'Prévention et bien-être'
                        ]
                    else:
                        pain_points = [
                            'Difficult access to care',
                            'Fragmented medical follow-up',
                            'Consultation costs'
                        ]
                        motivations = [
                            'Better health tracking',
                            'Easy access to care',
                            'Prevention and wellness'
                        ]
            
            elif industry == 'Finance':
                if segment == 'B2B':
                    if language == 'french':
                        pain_points = [
                            'Gestion complexe des risques',
                            'Réglementations en évolution',
                            'Cybersécurité financière'
                        ]
                        motivations = [
                            'Réduire risques opérationnels',
                            'Améliorer conformité',
                            'Optimiser rentabilité'
                        ]
                    else:
                        pain_points = [
                            'Complex risk management',
                            'Evolving regulations',
                            'Financial cybersecurity'
                        ]
                        motivations = [
                            'Reduce operational risks',
                            'Improve compliance',
                            'Optimize profitability'
                        ]
                else:  # B2C
                    if language == 'french':
                        pain_points = [
                            'Complexité des produits financiers',
                            'Frais bancaires élevés',
                            'Manque de transparence'
                        ]
                        motivations = [
                            'Simplicité de gestion',
                            'Économies sur frais',
                            'Transparence totale'
                        ]
                    else:
                        pain_points = [
                            'Complex financial products',
                            'High banking fees',
                            'Lack of transparency'
                        ]
                        motivations = [
                            'Simple management',
                            'Fee savings',
                            'Complete transparency'
                        ]
            
            else:  # Default pour autres industries
                if language == 'french':
                    pain_points = [
                        'Processus manuels chronophages',
                        'Manque d\'intégration système',
                        'Difficulté de scaling'
                    ]
                    motivations = [
                        'Automatisation des tâches',
                        'Amélioration productivité',
                        'Croissance business'
                    ]
                else:
                    pain_points = [
                        'Time-consuming manual processes',
                        'Lack of system integration',
                        'Scaling difficulties'
                    ]
                    motivations = [
                        'Task automation',
                        'Productivity improvement',
                        'Business growth'
                    ]
            
            personas.append({
                'name': persona_key,
                'description': persona_desc,
                'pain_points': pain_points,
                'motivations': motivations,
                'budget_range': self._estimate_budget_range(persona_key, industry, segment),
                'decision_factors': self._get_decision_factors(persona_key, industry, language),
                'adoption_timeline': self._estimate_adoption_timeline(persona_key, industry, complexity)
            })
        
        return personas
    
    def _estimate_budget_range(self, persona: str, industry: str, segment: str) -> str:
        """Estimer la fourchette budgétaire par persona"""
        if segment == 'B2B':
            if persona in ['Enterprise', 'Institutionnel', 'Government']:
                if industry in ['Healthcare', 'Finance']:
                    return '50K-500K€/an'
                else:
                    return '20K-200K€/an'
            else:  # PME, SMB, Startup
                if industry in ['Healthcare', 'Finance']:
                    return '5K-50K€/an'
                else:
                    return '2K-20K€/an'
        else:  # B2C
            if industry in ['Healthcare', 'Finance']:
                return '50-500€/an'
            else:
                return '10-100€/an'
    
    def _get_decision_factors(self, persona: str, industry: str, language: str) -> List[str]:
        """Facteurs de décision par persona"""
        if language == 'french':
            if persona in ['Enterprise', 'Institutionnel']:
                return [
                    'Sécurité et conformité',
                    'Intégration existante',
                    'Support et maintenance',
                    'Retour sur investissement',
                    'Références clients'
                ]
            elif persona in ['PME', 'SMB', 'Startup']:
                return [
                    'Rapport qualité/prix',
                    'Facilité d\'implémentation',
                    'Temps de mise en œuvre',
                    'Évolutivité',
                    'Support technique'
                ]
            else:  # B2C
                return [
                    'Facilité d\'utilisation',
                    'Prix abordable',
                    'Fonctionnalités utiles',
                    'Sécurité des données',
                    'Support client'
                ]
        else:
            if persona in ['Enterprise', 'Government']:
                return [
                    'Security and compliance',
                    'Existing integration',
                    'Support and maintenance',
                    'Return on investment',
                    'Customer references'
                ]
            elif persona in ['SMB', 'Startup']:
                return [
                    'Value for money',
                    'Implementation ease',
                    'Time to deploy',
                    'Scalability',
                    'Technical support'
                ]
            else:  # B2C
                return [
                    'Ease of use',
                    'Affordable pricing',
                    'Useful features',
                    'Data security',
                    'Customer support'
                ]
    
    def _estimate_adoption_timeline(self, persona: str, industry: str, complexity: str) -> str:
        """Estimer la timeline d'adoption"""
        base_timeline = {
            'simple': 30,
            'moyen': 60,
            'complexe': 120,
            'expert': 180
        }
        
        days = base_timeline.get(complexity, 60)
        
        # Ajustement par persona
        if persona in ['Enterprise', 'Institutionnel', 'Government']:
            days *= 1.5  # Plus long pour les grandes structures
        elif persona in ['Startup']:
            days *= 0.7  # Plus rapide pour les startups
        
        # Ajustement par industrie
        if industry in ['Healthcare', 'Finance']:
            days *= 1.3  # Plus long pour les industries réglementées
        
        days = int(days)
        
        if days <= 30:
            return '1 mois'
        elif days <= 90:
            return f'{days//30} mois'
        else:
            return f'{days//30} mois'
    
    def _analyze_competition(self, industry: str, complexity: str, language: str) -> Dict[str, Any]:
        """Analyser la concurrence"""
        competition_level = {
            'Technology': 'Très élevée',
            'Healthcare': 'Modérée',
            'Finance': 'Très élevée',
            'Education': 'Élevée',
            'Retail': 'Très élevée',
            'Media': 'Élevée',
            'Logistics': 'Élevée',
            'Energy': 'Modérée'
        }
        
        if language == 'french':
            competitive_advantages = [
                'Innovation technologique',
                'Expertise métier spécialisée',
                'Intégration système unique',
                'Sécurité renforcée',
                'Support client excellent',
                'Tarification compétitive',
                'Facilité d\'adoption'
            ]
            
            threats = [
                'Nouveaux entrants tech',
                'Évolution réglementaire',
                'Changement besoins clients',
                'Guerre des prix',
                'Consolidation marché'
            ]
        else:
            competitive_advantages = [
                'Technological innovation',
                'Specialized domain expertise',
                'Unique system integration',
                'Enhanced security',
                'Excellent customer support',
                'Competitive pricing',
                'Easy adoption'
            ]
            
            threats = [
                'New tech entrants',
                'Regulatory changes',
                'Changing customer needs',
                'Price wars',
                'Market consolidation'
            ]
        
        return {
            'competition_level': competition_level.get(industry, 'Élevée'),
            'key_players': self._get_key_players(industry),
            'competitive_advantages': competitive_advantages[:4],
            'threats': threats[:3],
            'barriers_to_entry': self._get_barriers_to_entry(industry, language),
            'differentiation_strategy': self._get_differentiation_strategy(industry, complexity, language)
        }
    
    def _get_key_players(self, industry: str) -> List[str]:
        """Principaux acteurs par industrie"""
        key_players = {
            'Technology': ['Microsoft', 'Google', 'Amazon', 'Salesforce'],
            'Healthcare': ['Epic Systems', 'Cerner', 'Philips Healthcare', 'Siemens Healthineers'],
            'Finance': ['Stripe', 'Square', 'PayPal', 'Adyen'],
            'Education': ['Coursera', 'Udemy', 'Blackboard', 'Canvas'],
            'Retail': ['Shopify', 'Magento', 'WooCommerce', 'BigCommerce'],
            'Media': ['Netflix', 'Spotify', 'Adobe', 'Twilio'],
            'Logistics': ['UPS', 'FedEx', 'DHL', 'Flexport'],
            'Energy': ['Schneider Electric', 'Siemens', 'GE', 'Honeywell']
        }
        
        return key_players.get(industry, ['Leader 1', 'Leader 2', 'Leader 3'])
    
    def _get_barriers_to_entry(self, industry: str, language: str) -> List[str]:
        """Barrières à l'entrée par industrie"""
        if language == 'french':
            barriers = {
                'Healthcare': ['Réglementations strictes', 'Certifications requises', 'Investissements R&D'],
                'Finance': ['Conformité réglementaire', 'Licences bancaires', 'Sécurité extrême'],
                'Energy': ['Investissements lourds', 'Expertise technique', 'Réglementations'],
                'Technology': ['Innovation constante', 'Talent rare', 'Effet réseau'],
                'Education': ['Accréditations', 'Contenu de qualité', 'Adoption institutionnelle'],
                'Retail': ['Logistique complexe', 'Acquisition clients', 'Concurrence prix'],
                'Media': ['Droits contenus', 'Infrastructure coûteuse', 'Audience critique'],
                'Logistics': ['Infrastructure physique', 'Réseaux établis', 'Investissements lourds']
            }
        else:
            barriers = {
                'Healthcare': ['Strict regulations', 'Required certifications', 'R&D investments'],
                'Finance': ['Regulatory compliance', 'Banking licenses', 'Extreme security'],
                'Energy': ['Heavy investments', 'Technical expertise', 'Regulations'],
                'Technology': ['Constant innovation', 'Rare talent', 'Network effects'],
                'Education': ['Accreditations', 'Quality content', 'Institutional adoption'],
                'Retail': ['Complex logistics', 'Customer acquisition', 'Price competition'],
                'Media': ['Content rights', 'Expensive infrastructure', 'Critical audience'],
                'Logistics': ['Physical infrastructure', 'Established networks', 'Heavy investments']
            }
        
        return barriers.get(industry, ['Barrière 1', 'Barrière 2', 'Barrière 3'])
    
    def _get_differentiation_strategy(self, industry: str, complexity: str, language: str) -> str:
        """Stratégie de différenciation recommandée"""
        if language == 'french':
            if complexity in ['complexe', 'expert']:
                return f"Spécialisation technique pointue dans {industry} avec innovation propriétaire"
            else:
                return f"Simplicité d'usage et rapport qualité/prix dans {industry}"
        else:
            if complexity in ['complexe', 'expert']:
                return f"Sharp technical specialization in {industry} with proprietary innovation"
            else:
                return f"Ease of use and value for money in {industry}"
    
    def _generate_penetration_strategy(self, segment: str, industry: str, 
                                      complexity: str, language: str) -> Dict[str, Any]:
        """Générer une stratégie de pénétration du marché"""
        if language == 'french':
            if segment == 'B2B':
                strategy = {
                    'primary_channel': 'Vente directe et partenariats',
                    'go_to_market': [
                        'Cibler les early adopters en PME',
                        'Développer des partenariats distributeurs',
                        'Participer aux salons professionnels',
                        'Marketing de contenu B2B'
                    ],
                    'pricing_strategy': 'Freemium puis abonnement SaaS',
                    'sales_cycle': '3-6 mois',
                    'key_metrics': ['CAC', 'LTV', 'Churn', 'ARR']
                }
            else:  # B2C
                strategy = {
                    'primary_channel': 'Digital et mobile-first',
                    'go_to_market': [
                        'Campagnes réseaux sociaux ciblées',
                        'Optimisation App Store/Play Store',
                        'Influenceurs et ambassadeurs',
                        'Référencement naturel et payant'
                    ],
                    'pricing_strategy': 'Freemium avec achats in-app',
                    'sales_cycle': '1-4 semaines',
                    'key_metrics': ['CAC', 'LTV', 'Rétention', 'Virality']
                }
        else:
            if segment == 'B2B':
                strategy = {
                    'primary_channel': 'Direct sales and partnerships',
                    'go_to_market': [
                        'Target SMB early adopters',
                        'Develop distributor partnerships',
                        'Participate in trade shows',
                        'B2B content marketing'
                    ],
                    'pricing_strategy': 'Freemium then SaaS subscription',
                    'sales_cycle': '3-6 months',
                    'key_metrics': ['CAC', 'LTV', 'Churn', 'ARR']
                }
            else:  # B2C
                strategy = {
                    'primary_channel': 'Digital and mobile-first',
                    'go_to_market': [
                        'Targeted social media campaigns',
                        'App Store/Play Store optimization',
                        'Influencers and ambassadors',
                        'SEO and paid search'
                    ],
                    'pricing_strategy': 'Freemium with in-app purchases',
                    'sales_cycle': '1-4 weeks',
                    'key_metrics': ['CAC', 'LTV', 'Retention', 'Virality']
                }
        
        return strategy
    
    def _identify_growth_opportunities(self, industry: str, segment: str, language: str) -> List[Dict[str, Any]]:
        """Identifier les opportunités de croissance"""
        opportunities = []
        
        if language == 'french':
            base_opportunities = [
                {
                    'type': 'Géographique',
                    'description': 'Expansion vers nouveaux marchés européens',
                    'timeline': '12-18 mois',
                    'investment': 'Moyen'
                },
                {
                    'type': 'Produit',
                    'description': 'Nouvelles fonctionnalités et modules',
                    'timeline': '6-12 mois',
                    'investment': 'Faible'
                },
                {
                    'type': 'Segment',
                    'description': 'Extension vers nouveaux segments clients',
                    'timeline': '9-15 mois',
                    'investment': 'Moyen'
                }
            ]
            
            if industry == 'Healthcare':
                base_opportunities.append({
                    'type': 'Réglementaire',
                    'description': 'Nouvelles réglementations créent besoins',
                    'timeline': '18-24 mois',
                    'investment': 'Élevé'
                })
            elif industry == 'Finance':
                base_opportunities.append({
                    'type': 'Technologique',
                    'description': 'IA et blockchain transforment le secteur',
                    'timeline': '12-18 mois',
                    'investment': 'Élevé'
                })
            elif industry == 'Education':
                base_opportunities.append({
                    'type': 'Démographique',
                    'description': 'Boom de la formation continue',
                    'timeline': '6-12 mois',
                    'investment': 'Faible'
                })
        else:
            base_opportunities = [
                {
                    'type': 'Geographic',
                    'description': 'Expansion to new European markets',
                    'timeline': '12-18 months',
                    'investment': 'Medium'
                },
                {
                    'type': 'Product',
                    'description': 'New features and modules',
                    'timeline': '6-12 months',
                    'investment': 'Low'
                },
                {
                    'type': 'Segment',
                    'description': 'Extension to new customer segments',
                    'timeline': '9-15 months',
                    'investment': 'Medium'
                }
            ]
            
            if industry == 'Healthcare':
                base_opportunities.append({
                    'type': 'Regulatory',
                    'description': 'New regulations create needs',
                    'timeline': '18-24 months',
                    'investment': 'High'
                })
            elif industry == 'Finance':
                base_opportunities.append({
                    'type': 'Technological',
                    'description': 'AI and blockchain transform sector',
                    'timeline': '12-18 months',
                    'investment': 'High'
                })
            elif industry == 'Education':
                base_opportunities.append({
                    'type': 'Demographic',
                    'description': 'Continuous learning boom',
                    'timeline': '6-12 months',
                    'investment': 'Low'
                })
        
        return base_opportunities[:4]
    
    def _get_market_trends(self, industry: str, language: str) -> List[str]:
        """Tendances du marché par industrie"""
        if language == 'french':
            trends = {
                'Technology': [
                    'Intelligence artificielle généralisée',
                    'Cloud-first et edge computing',
                    'Cybersécurité zero-trust',
                    'Low-code/no-code platforms'
                ],
                'Healthcare': [
                    'Télémédecine et soins à distance',
                    'IA pour diagnostic médical',
                    'Médecine personnalisée',
                    'Interopérabilité des systèmes'
                ],
                'Finance': [
                    'Fintech et néobanques',
                    'Paiements instantanés',
                    'Crypto et DeFi',
                    'RegTech et conformité'
                ],
                'Education': [
                    'Apprentissage adaptatif',
                    'Micro-learning et nano-degrés',
                    'VR/AR pédagogique',
                    'Compétences numériques'
                ],
                'Retail': [
                    'Commerce omnicanal',
                    'Personnalisation IA',
                    'Durabilité et éthique',
                    'Social commerce'
                ],
                'Media': [
                    'Streaming et VOD',
                    'Contenu généré par IA',
                    'Réalité virtuelle',
                    'Creator economy'
                ],
                'Logistics': [
                    'Livraison autonome',
                    'Optimisation IA',
                    'Durabilité transport',
                    'Traçabilité blockchain'
                ],
                'Energy': [
                    'Énergies renouvelables',
                    'Smart grids intelligents',
                    'Efficacité énergétique',
                    'Stockage innovant'
                ]
            }
        else:
            trends = {
                'Technology': [
                    'Generalized artificial intelligence',
                    'Cloud-first and edge computing',
                    'Zero-trust cybersecurity',
                    'Low-code/no-code platforms'
                ],
                'Healthcare': [
                    'Telemedicine and remote care',
                    'AI for medical diagnosis',
                    'Personalized medicine',
                    'System interoperability'
                ],
                'Finance': [
                    'Fintech and neobanks',
                    'Instant payments',
                    'Crypto and DeFi',
                    'RegTech and compliance'
                ],
                'Education': [
                    'Adaptive learning',
                    'Micro-learning and nano-degrees',
                    'Educational VR/AR',
                    'Digital skills'
                ],
                'Retail': [
                    'Omnichannel commerce',
                    'AI personalization',
                    'Sustainability and ethics',
                    'Social commerce'
                ],
                'Media': [
                    'Streaming and VOD',
                    'AI-generated content',
                    'Virtual reality',
                    'Creator economy'
                ],
                'Logistics': [
                    'Autonomous delivery',
                    'AI optimization',
                    'Transport sustainability',
                    'Blockchain traceability'
                ],
                'Energy': [
                    'Renewable energies',
                    'Smart intelligent grids',
                    'Energy efficiency',
                    'Innovative storage'
                ]
            }
        
        return trends.get(industry, ['Trend 1', 'Trend 2', 'Trend 3'])[:4]
    
    def _determine_regional_focus(self, description: str, language: str) -> Dict[str, Any]:
        """Déterminer le focus géographique"""
        if language == 'french':
            return {
                'primary_market': 'France',
                'secondary_markets': ['Belgique', 'Suisse', 'Luxembourg'],
                'expansion_targets': ['Allemagne', 'Italie', 'Espagne'],
                'market_entry_strategy': 'Domestic first puis expansion européenne',
                'localization_needs': ['Langue', 'Réglementation', 'Culture business']
            }
        else:
            return {
                'primary_market': 'France',
                'secondary_markets': ['Belgium', 'Switzerland', 'Luxembourg'],
                'expansion_targets': ['Germany', 'Italy', 'Spain'],
                'market_entry_strategy': 'Domestic first then European expansion',
                'localization_needs': ['Language', 'Regulation', 'Business culture']
            }


class MLBusinessProjectGenerator:
    """Générateur principal de projets business multilingue"""
    
    def __init__(self):
        self.business_analyzer = BusinessModelAnalyzer()
        self.milestone_generator = MilestoneGenerator()
        self.market_analyzer = MarketTargetAnalyzer()
        
        # Cache pour optimiser les performances
        self.generation_cache = {}
    
    def generate_complete_business_project(self, project_description: str, industry: str,
                                            complexity: str, estimated_duration: int,
                                            project_type: str = None, language: str = None) -> Dict[str, Any]:
        """Générer un projet business complet"""
        
        # Détecter la langue
        if language is None:
            detected_language = self.business_analyzer.detect_language(project_description)
        else:
            detected_language = language
        
        # Cache key
        cache_key = hashlib.md5(
            f"{project_description}_{industry}_{complexity}_{estimated_duration}".encode()
        ).hexdigest()
        
        if cache_key in self.generation_cache:
            return self.generation_cache[cache_key]
        
        # Analyser le contexte business
        business_context = self.business_analyzer.analyze_business_context(
            project_description, industry, complexity
        )
        
        # Générer les jalons
        milestones = self.milestone_generator.generate_milestones(
            project_description, industry, complexity, estimated_duration, language
        )
        
        # Analyser le marché cible
        market_analysis = self.market_analyzer.analyze_target_market(
            project_description, industry, complexity, language
        )
        
        # Recommander le modèle économique
        business_model = self._recommend_business_model(
            business_context, market_analysis, industry, complexity, language
        )
        
        # Calculer les projections financières
        financial_projections = self._calculate_financial_projections(
            business_model, market_analysis, complexity, language
        )
        
        # Identifier les risques business
        business_risks = self._identify_business_risks(
            industry, complexity, market_analysis, language
        )
        
        # Stratégie de financement
        funding_strategy = self._generate_funding_strategy(
            financial_projections, complexity, industry, language
        )
        
        # Roadmap produit
        product_roadmap = self._generate_product_roadmap(
            milestones, market_analysis, complexity, language
        )
        
        # Métriques de succès
        success_metrics = self._define_success_metrics(
            business_model, market_analysis, industry, language
        )
        
        result = {
            'project_overview': {
                'description': project_description,
                'industry': industry,
                'complexity': complexity,
                'estimated_duration': estimated_duration,
                'language': language,
                'project_type': project_type
            },
            'business_context': business_context,
            'milestones': milestones,
            'market_analysis': market_analysis,
            'business_model': business_model,
            'financial_projections': financial_projections,
            'business_risks': business_risks,
            'funding_strategy': funding_strategy,
            'product_roadmap': product_roadmap,
            'success_metrics': success_metrics,
            'generated_at': datetime.now().isoformat(),
            'generation_method': 'ml_business_generator_v1'
        }
        
        self.generation_cache[cache_key] = result
        return result
    
    def _recommend_business_model(self, business_context: Dict, market_analysis: Dict, 
                                 industry: str, complexity: str, language: str) -> Dict[str, Any]:
        """Recommander le modèle économique optimal"""
        
        # Récupérer les modèles disponibles
        available_models = self.business_analyzer.business_models[language][industry]
        
        # Sélectionner le modèle principal basé sur les signaux détectés
        monetization_signals = business_context['business_indicators']['monetization_signals']
        primary_segment = market_analysis['primary_segment']
        
        # Logique de sélection
        if 'subscription' in monetization_signals or primary_segment == 'B2B':
            if 'SaaS' in available_models:
                recommended_model = 'SaaS'
            elif 'B2B_SaaS' in available_models:
                recommended_model = 'B2B_SaaS'
            else:
                recommended_model = list(available_models.keys())[0]
        elif 'transaction' in monetization_signals:
            if 'Transaction' in available_models:
                recommended_model = 'Transaction'
            elif 'Commission' in available_models:
                recommended_model = 'Commission'
            else:
                recommended_model = list(available_models.keys())[0]
        elif 'freemium' in monetization_signals:
            if 'Freemium' in available_models:
                recommended_model = 'Freemium'
            else:
                recommended_model = 'SaaS'
        else:
            # Modèle par défaut selon l'industrie
            recommended_model = list(available_models.keys())[0]
        
        # Modèles alternatifs
        alternative_models = [k for k in available_models.keys() if k != recommended_model][:2]
        
        # Stratégie de pricing
        pricing_strategy = self._generate_pricing_strategy(
            recommended_model, complexity, primary_segment, language
        )
        
        # Revenus potentiels
        revenue_streams = self._identify_revenue_streams(
            recommended_model, industry, language
        )
        
        return {
            'recommended_model': recommended_model,
            'model_description': available_models[recommended_model],
            'alternative_models': [
                {'name': model, 'description': available_models[model]} 
                for model in alternative_models
            ],
            'pricing_strategy': pricing_strategy,
            'revenue_streams': revenue_streams,
            'monetization_timeline': self._estimate_monetization_timeline(
                recommended_model, complexity, language
            ),
            'scalability_potential': self._assess_scalability_potential(
                recommended_model, industry, complexity
            )
        }
    
    def _generate_pricing_strategy(self, model: str, complexity: str, segment: str, language: str) -> Dict[str, Any]:
        """Générer une stratégie de pricing"""
        
        # Prix de base selon la complexité
        base_prices = {
            'simple': {'B2B': 50, 'B2C': 10, 'B2B2C': 30},
            'moyen': {'B2B': 200, 'B2C': 25, 'B2B2C': 100},
            'complexe': {'B2B': 500, 'B2C': 50, 'B2B2C': 250},
            'expert': {'B2B': 1000, 'B2C': 100, 'B2B2C': 500}
        }
        
        base_price = base_prices.get(complexity, base_prices['moyen']).get(segment, 100)
        
        if language == 'french':
            if model in ['SaaS', 'B2B_SaaS']:
                return {
                    'model': 'Abonnement mensuel/annuel',
                    'starter_price': f"{base_price}€/mois",
                    'professional_price': f"{base_price * 3}€/mois",
                    'enterprise_price': f"{base_price * 8}€/mois",
                    'free_trial': '14 jours gratuits',
                    'annual_discount': '20% de réduction',
                    'value_proposition': 'Pas de frais cachés, annulation à tout moment'
                }
            elif model == 'Transaction':
                return {
                    'model': 'Commission par transaction',
                    'commission_rate': '2.5% + 0.30€',
                    'volume_discounts': 'Dégressif selon volume',
                    'minimum_fee': '0€/mois',
                    'value_proposition': 'Payez seulement ce que vous utilisez'
                }
            elif model == 'Freemium':
                return {
                    'model': 'Gratuit avec options premium',
                    'free_features': 'Fonctionnalités de base',
                    'premium_price': f"{base_price}€/mois",
                    'conversion_target': '5-10% freemium vers premium',
                    'value_proposition': 'Essayez gratuitement, payez pour plus'
                }
        else:
            if model in ['SaaS', 'B2B_SaaS']:
                return {
                    'model': 'Monthly/annual subscription',
                    'starter_price': f"€{base_price}/month",
                    'professional_price': f"€{base_price * 3}/month",
                    'enterprise_price': f"€{base_price * 8}/month",
                    'free_trial': '14 days free',
                    'annual_discount': '20% discount',
                    'value_proposition': 'No hidden fees, cancel anytime'
                }
            elif model == 'Transaction':
                return {
                    'model': 'Commission per transaction',
                    'commission_rate': '2.5% + €0.30',
                    'volume_discounts': 'Degressive by volume',
                    'minimum_fee': '€0/month',
                    'value_proposition': 'Pay only what you use'
                }
            elif model == 'Freemium':
                return {
                    'model': 'Free with premium options',
                    'free_features': 'Basic features',
                    'premium_price': f"€{base_price}/month",
                    'conversion_target': '5-10% freemium to premium',
                    'value_proposition': 'Try free, pay for more'
                }
        
        # Fallback
        return {
            'model': 'Custom pricing',
            'contact_sales': True,
            'value_proposition': 'Tailored to your needs'
        }
    
    def _identify_revenue_streams(self, model: str, industry: str, language: str) -> List[Dict[str, Any]]:
        """Identifier les flux de revenus"""
        streams = []
        
        if language == 'french':
            if model in ['SaaS', 'B2B_SaaS']:
                streams = [
                    {'name': 'Abonnements récurrents', 'percentage': 80, 'predictability': 'Élevée'},
                    {'name': 'Services professionnels', 'percentage': 15, 'predictability': 'Moyenne'},
                    {'name': 'Formation et support', 'percentage': 5, 'predictability': 'Faible'}
                ]
            elif model == 'Transaction':
                streams = [
                    {'name': 'Commissions transactions', 'percentage': 85, 'predictability': 'Moyenne'},
                    {'name': 'Frais premium', 'percentage': 10, 'predictability': 'Élevée'},
                    {'name': 'Services additionnels', 'percentage': 5, 'predictability': 'Faible'}
                ]
            elif model == 'Freemium':
                streams = [
                    {'name': 'Abonnements premium', 'percentage': 70, 'predictability': 'Élevée'},
                    {'name': 'Achats in-app', 'percentage': 20, 'predictability': 'Moyenne'},
                    {'name': 'Publicité', 'percentage': 10, 'predictability': 'Faible'}
                ]
        else:
            if model in ['SaaS', 'B2B_SaaS']:
                streams = [
                    {'name': 'Recurring subscriptions', 'percentage': 80, 'predictability': 'High'},
                    {'name': 'Professional services', 'percentage': 15, 'predictability': 'Medium'},
                    {'name': 'Training and support', 'percentage': 5, 'predictability': 'Low'}
                ]
            elif model == 'Transaction':
                streams = [
                    {'name': 'Transaction commissions', 'percentage': 85, 'predictability': 'Medium'},
                    {'name': 'Premium fees', 'percentage': 10, 'predictability': 'High'},
                    {'name': 'Additional services', 'percentage': 5, 'predictability': 'Low'}
                ]
            elif model == 'Freemium':
                streams = [
                    {'name': 'Premium subscriptions', 'percentage': 70, 'predictability': 'High'},
                    {'name': 'In-app purchases', 'percentage': 20, 'predictability': 'Medium'},
                    {'name': 'Advertising', 'percentage': 10, 'predictability': 'Low'}
                ]
        
        return streams
    
    def _estimate_monetization_timeline(self, model: str, complexity: str, language: str) -> Dict[str, str]:
        """Estimer la timeline de monétisation"""
        base_timeline = {
            'simple': 3,
            'moyen': 6,
            'complexe': 12,
            'expert': 18
        }
        
        months = base_timeline.get(complexity, 6)
        
        if language == 'french':
            return {
                'first_revenue': f"{months} mois",
                'break_even': f"{months * 2} mois",
                'profitability': f"{months * 3} mois",
                'scale_revenue': f"{months * 4} mois"
            }
        else:
            return {
                'first_revenue': f"{months} months",
                'break_even': f"{months * 2} months",
                'profitability': f"{months * 3} months",
                'scale_revenue': f"{months * 4} months"
            }
    
    def _assess_scalability_potential(self, model: str, industry: str, complexity: str) -> str:
        """Évaluer le potentiel de scalabilité"""
        scalability_scores = {
            'SaaS': 9,
            'API': 8,
            'Marketplace': 8,
            'Freemium': 7,
            'Transaction': 6,
            'Consulting': 3
        }
        
        base_score = scalability_scores.get(model, 5)
        
        # Ajustement par industrie
        if industry in ['Technology', 'Media']:
            base_score += 1
        elif industry in ['Healthcare', 'Finance']:
            base_score -= 1
        
        # Ajustement par complexité
        if complexity == 'expert':
            base_score -= 1
        elif complexity == 'simple':
            base_score += 1
        
        if base_score >= 8:
            return 'Très élevé'
        elif base_score >= 6:
            return 'Élevé'
        elif base_score >= 4:
            return 'Moyen'
        else:
            return 'Faible'
    
    def _calculate_financial_projections(self, business_model: Dict, market_analysis: Dict, 
                                       complexity: str, language: str) -> Dict[str, Any]:
        """Calculer les projections financières"""
        
        # Paramètres de base
        base_metrics = {
            'simple': {'customers_y1': 100, 'arpu': 500, 'growth_rate': 15},
            'moyen': {'customers_y1': 250, 'arpu': 1200, 'growth_rate': 25},
            'complexe': {'customers_y1': 500, 'arpu': 2500, 'growth_rate': 35},
            'expert': {'customers_y1': 1000, 'arpu': 5000, 'growth_rate': 50}
        }
        
        metrics = base_metrics.get(complexity, base_metrics['moyen'])
        
        # Projections sur 3 ans
        projections = []
        customers = metrics['customers_y1']
        arpu = metrics['arpu']
        
        for year in range(1, 4):
            revenue = customers * arpu
            # Coûts approximatifs
            cogs = int(revenue * 0.25)  # 25% COGS
            opex = int(revenue * 0.60)  # 60% OPEX
            gross_profit = revenue - cogs
            net_profit = gross_profit - opex
            
            projections.append({
                'year': year,
                'customers': customers,
                'revenue': revenue,
                'cogs': cogs,
                'gross_profit': gross_profit,
                'opex': opex,
                'net_profit': net_profit,
                'margin': round((net_profit / revenue) * 100, 1) if revenue > 0 else 0
            })
            
            # Croissance pour année suivante
            customers = int(customers * (1 + metrics['growth_rate'] / 100))
            arpu = int(arpu * 1.1)  # 10% d'augmentation ARPU par an
        
        # Métriques importantes
        key_metrics = self._calculate_key_metrics(projections, language)
        
        # Besoins de financement
        funding_needs = self._calculate_funding_needs(projections, complexity, language)
        
        return {
            'projections': projections,
            'key_metrics': key_metrics,
            'funding_needs': funding_needs,
            'assumptions': self._generate_assumptions(complexity, language),
            'currency': 'EUR',
            'period': '3 ans'
        }
    
    def _calculate_key_metrics(self, projections: List[Dict], language: str) -> Dict[str, Any]:
        """Calculer les métriques clés"""
        if not projections:
            return {}
        
        total_revenue_3y = sum(p['revenue'] for p in projections)
        avg_margin = sum(p['margin'] for p in projections) / len(projections)
        
        if language == 'french':
            return {
                'revenue_3_ans': f"{total_revenue_3y:,}€",
                'marge_moyenne': f"{avg_margin:.1f}%",
                'croissance_an3': f"{((projections[-1]['revenue'] / projections[0]['revenue']) - 1) * 100:.1f}%",
                'rentabilite_an3': 'Positive' if projections[-1]['net_profit'] > 0 else 'Négative',
                'payback_period': '18-24 mois',
                'ltv_cac_ratio': '3.2:1'
            }
        else:
            return {
                'revenue_3_years': f"€{total_revenue_3y:,}",
                'average_margin': f"{avg_margin:.1f}%",
                'growth_year3': f"{((projections[-1]['revenue'] / projections[0]['revenue']) - 1) * 100:.1f}%",
                'profitability_year3': 'Positive' if projections[-1]['net_profit'] > 0 else 'Negative',
                'payback_period': '18-24 months',
                'ltv_cac_ratio': '3.2:1'
            }
    
    def _calculate_funding_needs(self, projections: List[Dict], complexity: str, language: str) -> Dict[str, Any]:
        """Calculer les besoins de financement"""
        
        # Besoins selon la complexité
        funding_amounts = {
            'simple': 50000,
            'moyen': 200000,
            'complexe': 500000,
            'expert': 1000000
        }
        
        amount = funding_amounts.get(complexity, 200000)
        
        if language == 'french':
            return {
                'initial_amount': f"{amount:,}€",
                'usage': {
                    'Développement': '50%',
                    'Marketing': '25%',
                    'Équipe': '20%',
                    'Autres': '5%'
                },
                'timeline': '12-18 mois',
                'milestones': [
                    'MVP fonctionnel',
                    'Premiers clients payants',
                    'Product-market fit',
                    'Croissance récurrente'
                ]
            }
        else:
            return {
                'initial_amount': f"€{amount:,}",
                'usage': {
                    'Development': '50%',
                    'Marketing': '25%',
                    'Team': '20%',
                    'Other': '5%'
                },
                'timeline': '12-18 months',
                'milestones': [
                    'Functional MVP',
                    'First paying customers',
                    'Product-market fit',
                    'Recurring growth'
                ]
            }
    
    def _generate_assumptions(self, complexity: str, language: str) -> List[str]:
        """Générer les hypothèses des projections"""
        if language == 'french':
            return [
                'Croissance mensuelle constante des utilisateurs',
                'Taux de churn stable à 5% mensuel',
                'Augmentation ARPU de 10% par an',
                'Coûts opérationnels proportionnels au CA',
                'Pas de facteurs externes majeurs',
                'Financement suffisant pour 18 mois'
            ]
        else:
            return [
                'Constant monthly user growth',
                'Stable churn rate at 5% monthly',
                'ARPU increase of 10% per year',
                'Operating costs proportional to revenue',
                'No major external factors',
                'Sufficient funding for 18 months'
            ]
    
    def _identify_business_risks(self, industry: str, complexity: str, 
                               market_analysis: Dict, language: str) -> List[Dict[str, Any]]:
        """Identifier les risques business"""
        risks = []
        
        if language == 'french':
            # Risques communs
            common_risks = [
                {
                    'type': 'Marché',
                    'description': 'Adoption plus lente que prévue',
                    'probability': 'Moyenne',
                    'impact': 'Élevé',
                    'mitigation': 'Validation continue avec clients'
                },
                {
                    'type': 'Concurrence',
                    'description': 'Nouveaux entrants ou pivots concurrents',
                    'probability': 'Élevée',
                    'impact': 'Moyen',
                    'mitigation': 'Différenciation forte et innovation'
                },
                {
                    'type': 'Technique',
                    'description': 'Difficultés de développement ou scalabilité',
                    'probability': 'Moyenne',
                    'impact': 'Élevé',
                    'mitigation': 'Architecture robuste et tests'
                },
                {
                    'type': 'Financement',
                    'description': 'Difficulté à lever des fonds',
                    'probability': 'Moyenne',
                    'impact': 'Critique',
                    'mitigation': 'Diversification sources de financement'
                }
            ]
            
            # Risques spécifiques par industrie
            if industry == 'Healthcare':
                common_risks.append({
                    'type': 'Réglementaire',
                    'description': 'Changements réglementaires HIPAA/GDPR',
                    'probability': 'Élevée',
                    'impact': 'Critique',
                    'mitigation': 'Veille réglementaire et conformité'
                })
            elif industry == 'Finance':
                common_risks.append({
                    'type': 'Réglementaire',
                    'description': 'Nouvelles réglementations financières',
                    'probability': 'Élevée',
                    'impact': 'Critique',
                    'mitigation': 'Conformité anticipée et adaptabilité'
                })
            elif industry == 'Technology':
                common_risks.append({
                    'type': 'Technologique',
                    'description': 'Évolution rapide des technologies',
                    'probability': 'Très élevée',
                    'impact': 'Moyen',
                    'mitigation': 'Veille technologique et adaptabilité'
                })
        else:
            # Risques communs
            common_risks = [
                {
                    'type': 'Market',
                    'description': 'Slower adoption than expected',
                    'probability': 'Medium',
                    'impact': 'High',
                    'mitigation': 'Continuous customer validation'
                },
                {
                    'type': 'Competition',
                    'description': 'New entrants or competitor pivots',
                    'probability': 'High',
                    'impact': 'Medium',
                    'mitigation': 'Strong differentiation and innovation'
                },
                {
                    'type': 'Technical',
                    'description': 'Development or scalability difficulties',
                    'probability': 'Medium',
                    'impact': 'High',
                    'mitigation': 'Robust architecture and testing'
                },
                {
                    'type': 'Funding',
                    'description': 'Difficulty raising funds',
                    'probability': 'Medium',
                    'impact': 'Critical',
                    'mitigation': 'Diversify funding sources'
                }
            ]
            
            # Risques spécifiques par industrie
            if industry == 'Healthcare':
                common_risks.append({
                    'type': 'Regulatory',
                    'description': 'HIPAA/GDPR regulatory changes',
                    'probability': 'High',
                    'impact': 'Critical',
                    'mitigation': 'Regulatory monitoring and compliance'
                })
            elif industry == 'Finance':
                common_risks.append({
                    'type': 'Regulatory',
                    'description': 'New financial regulations',
                    'probability': 'High',
                    'impact': 'Critical',
                    'mitigation': 'Anticipate compliance and adaptability'
                })
            elif industry == 'Technology':
                common_risks.append({
                    'type': 'Technological',
                    'description': 'Rapid technology evolution',
                    'probability': 'Very High',
                    'impact': 'Medium',
                    'mitigation': 'Technology monitoring and adaptability'
                })
        
        return common_risks[:5]  # Limiter à 5 risques principaux
    
    def _generate_funding_strategy(self, financial_projections: Dict, complexity: str, 
                                 industry: str, language: str) -> Dict[str, Any]:
        """Générer une stratégie de financement"""
        
        funding_amount = financial_projections['funding_needs']['initial_amount']
        
        if language == 'french':
            if complexity in ['simple', 'moyen']:
                return {
                    'recommended_round': 'Seed',
                    'amount': funding_amount,
                    'investors': [
                        'Business Angels',
                        'Fonds d\'amorçage',
                        'Incubateurs/Accélérateurs',
                        'Financement participatif'
                    ],
                    'timeline': '6-12 mois',
                    'equity_dilution': '15-25%',
                    'use_of_funds': financial_projections['funding_needs']['usage'],
                    'milestones_next_round': [
                        'Traction utilisateurs démontrée',
                        'Revenus récurrents établis',
                        'Équipe complète constituée',
                        'Expansion géographique'
                    ],
                    'alternative_funding': [
                        'Subventions publiques',
                        'Concours innovation',
                        'Bootstrapping',
                        'Revenue-based financing'
                    ]
                }
            else:  # complexe, expert
                return {
                    'recommended_round': 'Series A',
                    'amount': funding_amount,
                    'investors': [
                        'VCs spécialisés',
                        'Corporate Ventures',
                        'Fonds sectoriels',
                        'Family Offices'
                    ],
                    'timeline': '12-18 mois',
                    'equity_dilution': '20-30%',
                    'use_of_funds': financial_projections['funding_needs']['usage'],
                    'milestones_next_round': [
                        'Product-market fit prouvé',
                        'Croissance ARR soutenue',
                        'Expansion internationale',
                        'Partenariats stratégiques'
                    ],
                    'alternative_funding': [
                        'Financement bancaire',
                        'Debt funding',
                        'Partenariats stratégiques',
                        'Government grants'
                    ]
                }
        else:
            if complexity in ['simple', 'moyen']:
                return {
                    'recommended_round': 'Seed',
                    'amount': funding_amount,
                    'investors': [
                        'Business Angels',
                        'Seed funds',
                        'Incubators/Accelerators',
                        'Crowdfunding'
                    ],
                    'timeline': '6-12 months',
                    'equity_dilution': '15-25%',
                    'use_of_funds': financial_projections['funding_needs']['usage'],
                    'milestones_next_round': [
                        'Demonstrated user traction',
                        'Established recurring revenue',
                        'Complete team assembled',
                        'Geographic expansion'
                    ],
                    'alternative_funding': [
                        'Public grants',
                        'Innovation contests',
                        'Bootstrapping',
                        'Revenue-based financing'
                    ]
                }
            else:  # complexe, expert
                return {
                    'recommended_round': 'Series A',
                    'amount': funding_amount,
                    'investors': [
                        'Specialized VCs',
                        'Corporate Ventures',
                        'Sector funds',
                        'Family Offices'
                    ],
                    'timeline': '12-18 months',
                    'equity_dilution': '20-30%',
                    'use_of_funds': financial_projections['funding_needs']['usage'],
                    'milestones_next_round': [
                        'Proven product-market fit',
                        'Sustained ARR growth',
                        'International expansion',
                        'Strategic partnerships'
                    ],
                    'alternative_funding': [
                        'Bank financing',
                        'Debt funding',
                        'Strategic partnerships',
                        'Government grants'
                    ]
                }
    
    def _generate_product_roadmap(self, milestones: List[Dict], market_analysis: Dict, 
                                 complexity: str, language: str) -> Dict[str, Any]:
        """Générer une roadmap produit"""
        
        # Phases de développement produit
        if language == 'french':
            phases = [
                {
                    'name': 'MVP - Minimum Viable Product',
                    'duration': '3-6 mois',
                    'objectives': [
                        'Valider concept avec utilisateurs',
                        'Fonctionnalités core uniquement',
                        'Première version fonctionnelle',
                        'Feedback utilisateurs initial'
                    ],
                    'features': [
                        'Authentification utilisateur',
                        'Interface de base',
                        'Fonctionnalité principale',
                        'Système de paiement basique'
                    ]
                },
                {
                    'name': 'Version 1.0 - Lancement Public',
                    'duration': '6-12 mois',
                    'objectives': [
                        'Lancement commercial officiel',
                        'Acquisition premiers clients',
                        'Optimisation UX/UI',
                        'Stabilité et performance'
                    ],
                    'features': [
                        'Interface utilisateur complète',
                        'Fonctionnalités avancées',
                        'Intégrations tierces',
                        'Support client intégré'
                    ]
                },
                {
                    'name': 'Version 2.0 - Expansion',
                    'duration': '12-18 mois',
                    'objectives': [
                        'Nouvelles fonctionnalités demandées',
                        'Expansion géographique',
                        'Optimisation performance',
                        'Partenariats stratégiques'
                    ],
                    'features': [
                        'Fonctionnalités IA/ML',
                        'Application mobile',
                        'APIs ouvertes',
                        'Analytics avancées'
                    ]
                },
                {
                    'name': 'Version 3.0 - Innovation',
                    'duration': '18-24 mois',
                    'objectives': [
                        'Innovation produit majeure',
                        'Nouveaux segments marché',
                        'Technologie différenciante',
                        'Leadership marché'
                    ],
                    'features': [
                        'IA prédictive',
                        'Automatisation avancée',
                        'Écosystème partenaires',
                        'Nouvelles plateformes'
                    ]
                }
            ]
        else:
            phases = [
                {
                    'name': 'MVP - Minimum Viable Product',
                    'duration': '3-6 months',
                    'objectives': [
                        'Validate concept with users',
                        'Core features only',
                        'First functional version',
                        'Initial user feedback'
                    ],
                    'features': [
                        'User authentication',
                        'Basic interface',
                        'Main functionality',
                        'Basic payment system'
                    ]
                },
                {
                    'name': 'Version 1.0 - Public Launch',
                    'duration': '6-12 months',
                    'objectives': [
                        'Official commercial launch',
                        'First customer acquisition',
                        'UX/UI optimization',
                        'Stability and performance'
                    ],
                    'features': [
                        'Complete user interface',
                        'Advanced features',
                        'Third-party integrations',
                        'Integrated customer support'
                    ]
                },
                {
                    'name': 'Version 2.0 - Expansion',
                    'duration': '12-18 months',
                    'objectives': [
                        'New requested features',
                        'Geographic expansion',
                        'Performance optimization',
                        'Strategic partnerships'
                    ],
                    'features': [
                        'AI/ML features',
                        'Mobile application',
                        'Open APIs',
                        'Advanced analytics'
                    ]
                },
                {
                    'name': 'Version 3.0 - Innovation',
                    'duration': '18-24 months',
                    'objectives': [
                        'Major product innovation',
                        'New market segments',
                        'Differentiating technology',
                        'Market leadership'
                    ],
                    'features': [
                        'Predictive AI',
                        'Advanced automation',
                        'Partner ecosystem',
                        'New platforms'
                    ]
                }
            ]
        
        # Ajuster selon la complexité
        if complexity == 'simple':
            phases = phases[:2]  # Seulement MVP et V1.0
        elif complexity == 'moyen':
            phases = phases[:3]  # Jusqu'à V2.0
        
        # Priorités de développement
        development_priorities = self._get_development_priorities(
            market_analysis, complexity, language
        )
        
        return {
            'phases': phases,
            'development_priorities': development_priorities,
            'release_strategy': self._get_release_strategy(complexity, language),
            'innovation_areas': self._identify_innovation_areas(
                market_analysis, language
            )
        }
    
    def _get_development_priorities(self, market_analysis: Dict, complexity: str, language: str) -> List[str]:
        """Déterminer les priorités de développement"""
        if language == 'french':
            base_priorities = [
                'Expérience utilisateur optimale',
                'Performance et fiabilité',
                'Sécurité et confidentialité',
                'Scalabilité technique',
                'Intégrations ecosystem'
            ]
        else:
            base_priorities = [
                'Optimal user experience',
                'Performance and reliability',
                'Security and privacy',
                'Technical scalability',
                'Ecosystem integrations'
            ]
        
        # Ajuster selon le segment de marché
        primary_segment = market_analysis.get('primary_segment', 'B2B')
        
        if primary_segment == 'B2B':
            if language == 'french':
                base_priorities.insert(1, 'Intégrations entreprise')
            else:
                base_priorities.insert(1, 'Enterprise integrations')
        elif primary_segment == 'B2C':
            if language == 'french':
                base_priorities.insert(1, 'Interface mobile-first')
            else:
                base_priorities.insert(1, 'Mobile-first interface')
        
        return base_priorities[:5]
    
    def _get_release_strategy(self, complexity: str, language: str) -> Dict[str, str]:
        """Stratégie de release"""
        if language == 'french':
            if complexity in ['simple', 'moyen']:
                return {
                    'strategy': 'Itératif rapide',
                    'frequency': 'Releases bi-mensuelles',
                    'approach': 'Continuous deployment',
                    'testing': 'Automated testing + Beta users'
                }
            else:
                return {
                    'strategy': 'Releases planifiées',
                    'frequency': 'Releases mensuelles',
                    'approach': 'Staged rollout',
                    'testing': 'Extensive QA + User acceptance'
                }
        else:
            if complexity in ['simple', 'moyen']:
                return {
                    'strategy': 'Rapid iterative',
                    'frequency': 'Bi-weekly releases',
                    'approach': 'Continuous deployment',
                    'testing': 'Automated testing + Beta users'
                }
            else:
                return {
                    'strategy': 'Planned releases',
                    'frequency': 'Monthly releases',
                    'approach': 'Staged rollout',
                    'testing': 'Extensive QA + User acceptance'
                }
    
    def _identify_innovation_areas(self, market_analysis: Dict, language: str) -> List[str]:
        """Identifier les zones d'innovation"""
        trends = market_analysis.get('market_trends', [])
        
        if language == 'french':
            innovation_areas = [
                'Intelligence artificielle intégrée',
                'Automatisation des processus',
                'Analyses prédictives',
                'Interface conversationnelle',
                'Intégration IoT'
            ]
        else:
            innovation_areas = [
                'Integrated artificial intelligence',
                'Process automation',
                'Predictive analytics',
                'Conversational interface',
                'IoT integration'
            ]
        
        # Prioriser selon les tendances du marché
        prioritized = []
        for area in innovation_areas:
            if any(trend.lower() in area.lower() for trend in trends):
                prioritized.insert(0, area)
            else:
                prioritized.append(area)
        
        return prioritized[:4]
    
    def _define_success_metrics(self, business_model: Dict, market_analysis: Dict, 
                               industry: str, language: str) -> Dict[str, Any]:
        """Définir les métriques de succès"""
        
        primary_segment = market_analysis.get('primary_segment', 'B2B')
        
        if language == 'french':
            if primary_segment == 'B2B':
                metrics = {
                    'acquisition': {
                        'CAC': 'Coût d\'acquisition client < 1/3 LTV',
                        'conversion_rate': 'Taux de conversion leads > 5%',
                        'sales_cycle': 'Cycle de vente < 90 jours',
                        'pipeline_velocity': 'Vélocité pipeline en croissance'
                    },
                    'retention': {
                        'churn_rate': 'Taux de désabonnement < 5%/mois',
                        'nps_score': 'Net Promoter Score > 50',
                        'expansion_revenue': 'Upsell/cross-sell > 20% ARR',
                        'customer_lifetime': 'Durée de vie client > 24 mois'
                    },
                    'financial': {
                        'arr_growth': 'Croissance ARR > 100%/an',
                        'gross_margin': 'Marge brute > 75%',
                        'burn_rate': 'Burn rate décroissant',
                        'runway': 'Runway > 18 mois'
                    },
                    'product': {
                        'feature_adoption': 'Adoption nouvelles features > 30%',
                        'time_to_value': 'Time-to-value < 30 jours',
                        'support_tickets': 'Tickets support en baisse',
                        'uptime': 'Uptime > 99.5%'
                    }
                }
            else:  # B2C
                metrics = {
                    'acquisition': {
                        'cac_payback': 'Retour sur CAC < 6 mois',
                        'organic_growth': 'Croissance organique > 40%',
                        'viral_coefficient': 'Coefficient viral > 1.2',
                        'app_store_rating': 'Note App Store > 4.5'
                    },
                    'engagement': {
                        'dau_mau': 'Ratio DAU/MAU > 20%',
                        'session_duration': 'Durée session > 5 min',
                        'retention_d7': 'Rétention J7 > 25%',
                        'retention_d30': 'Rétention J30 > 10%'
                    },
                    'monetization': {
                        'arpu': 'ARPU en croissance mensuelle',
                        'conversion_paid': 'Conversion payant > 5%',
                        'ltv_cac': 'Ratio LTV/CAC > 3:1',
                        'revenue_per_user': 'Revenus par utilisateur croissants'
                    },
                    'product': {
                        'feature_usage': 'Utilisation features core > 60%',
                        'crash_rate': 'Taux de crash < 0.1%',
                        'load_time': 'Temps de chargement < 3s',
                        'user_satisfaction': 'Satisfaction utilisateur > 4/5'
                    }
                }
        else:
            if primary_segment == 'B2B':
                metrics = {
                    'acquisition': {
                        'CAC': 'Customer acquisition cost < 1/3 LTV',
                        'conversion_rate': 'Lead conversion rate > 5%',
                        'sales_cycle': 'Sales cycle < 90 days',
                        'pipeline_velocity': 'Growing pipeline velocity'
                    },
                    'retention': {
                        'churn_rate': 'Churn rate < 5%/month',
                        'nps_score': 'Net Promoter Score > 50',
                        'expansion_revenue': 'Upsell/cross-sell > 20% ARR',
                        'customer_lifetime': 'Customer lifetime > 24 months'
                    },
                    'financial': {
                        'arr_growth': 'ARR growth > 100%/year',
                        'gross_margin': 'Gross margin > 75%',
                        'burn_rate': 'Decreasing burn rate',
                        'runway': 'Runway > 18 months'
                    },
                    'product': {
                        'feature_adoption': 'New feature adoption > 30%',
                        'time_to_value': 'Time-to-value < 30 days',
                        'support_tickets': 'Decreasing support tickets',
                        'uptime': 'Uptime > 99.5%'
                    }
                }
            else:  # B2C
                metrics = {
                    'acquisition': {
                        'cac_payback': 'CAC payback < 6 months',
                        'organic_growth': 'Organic growth > 40%',
                        'viral_coefficient': 'Viral coefficient > 1.2',
                        'app_store_rating': 'App Store rating > 4.5'
                    },
                    'engagement': {
                        'dau_mau': 'DAU/MAU ratio > 20%',
                        'session_duration': 'Session duration > 5 min',
                        'retention_d7': 'Day 7 retention > 25%',
                        'retention_d30': 'Day 30 retention > 10%'
                    },
                    'monetization': {
                        'arpu': 'Monthly ARPU growth',
                        'conversion_paid': 'Paid conversion > 5%',
                        'ltv_cac': 'LTV/CAC ratio > 3:1',
                        'revenue_per_user': 'Growing revenue per user'
                    },
                    'product': {
                        'feature_usage': 'Core feature usage > 60%',
                        'crash_rate': 'Crash rate < 0.1%',
                        'load_time': 'Load time < 3s',
                        'user_satisfaction': 'User satisfaction > 4/5'
                    }
                }
        
        # Objectifs trimestriels
        quarterly_goals = self._generate_quarterly_goals(metrics, language)
        
        return {
            'key_metrics': metrics,
            'quarterly_goals': quarterly_goals,
            'monitoring_tools': self._recommend_monitoring_tools(language),
            'reporting_frequency': 'Hebdomadaire' if language == 'french' else 'Weekly'
        }
    
    def _generate_quarterly_goals(self, metrics: Dict, language: str) -> List[Dict[str, Any]]:
        """Générer des objectifs trimestriels"""
        if language == 'french':
            return [
                {
                    'quarter': 'Q1',
                    'focus': 'Validation produit-marché',
                    'primary_metrics': ['Taux de conversion', 'Rétention J7', 'NPS'],
                    'targets': ['Conv. rate > 2%', 'Rétention > 15%', 'NPS > 30']
                },
                {
                    'quarter': 'Q2',
                    'focus': 'Acquisition et croissance',
                    'primary_metrics': ['CAC', 'Croissance utilisateurs', 'ARR'],
                    'targets': ['CAC < 200€', 'Croissance > 50%', 'ARR > 50k€']
                },
                {
                    'quarter': 'Q3',
                    'focus': 'Optimisation et rétention',
                    'primary_metrics': ['Churn rate', 'LTV', 'Marge brute'],
                    'targets': ['Churn < 7%', 'LTV > 600€', 'Marge > 70%']
                },
                {
                    'quarter': 'Q4',
                    'focus': 'Scalabilité et expansion',
                    'primary_metrics': ['Efficiency metrics', 'Expansion', 'Profitabilité'],
                    'targets': ['LTV/CAC > 3:1', 'Nouveaux marchés', 'Break-even']
                }
            ]
        else:
            return [
                {
                    'quarter': 'Q1',
                    'focus': 'Product-market validation',
                    'primary_metrics': ['Conversion rate', 'Day 7 retention', 'NPS'],
                    'targets': ['Conv. rate > 2%', 'Retention > 15%', 'NPS > 30']
                },
                {
                    'quarter': 'Q2',
                    'focus': 'Acquisition and growth',
                    'primary_metrics': ['CAC', 'User growth', 'ARR'],
                    'targets': ['CAC < €200', 'Growth > 50%', 'ARR > €50k']
                },
                {
                    'quarter': 'Q3',
                    'focus': 'Optimization and retention',
                    'primary_metrics': ['Churn rate', 'LTV', 'Gross margin'],
                    'targets': ['Churn < 7%', 'LTV > €600', 'Margin > 70%']
                },
                {
                    'quarter': 'Q4',
                    'focus': 'Scalability and expansion',
                    'primary_metrics': ['Efficiency metrics', 'Expansion', 'Profitability'],
                    'targets': ['LTV/CAC > 3:1', 'New markets', 'Break-even']
                }
            ]
    
    def _recommend_monitoring_tools(self, language: str) -> List[str]:
        """Recommander des outils de monitoring"""
        if language == 'french':
            return [
                'Google Analytics - Analyse web',
                'Mixpanel - Analytics produit',
                'Amplitude - Analyse comportementale',
                'ChartMogul - Métriques SaaS',
                'Hotjar - UX et heatmaps',
                'Zendesk - Support client'
            ]
        else:
            return [
                'Google Analytics - Web analysis',
                'Mixpanel - Product analytics',
                'Amplitude - Behavioral analysis',
                'ChartMogul - SaaS metrics',
                'Hotjar - UX and heatmaps',
                'Zendesk - Customer support'
            ]
    
    def _get_model_recommendation(self, model: str, industry: str, language: str) -> str:
        """Obtenir une recommandation pour un modèle"""
        if language == 'french':
            recommendations = {
                'SaaS': 'Idéal pour solutions B2B récurrentes',
                'Transaction': 'Parfait pour marketplaces et paiements',
                'Freemium': 'Excellent pour acquisition B2C',
                'Subscription': 'Optimal pour contenu premium',
                'Commission': 'Adapté aux plateformes intermédiaires'
            }
        else:
            recommendations = {
                'SaaS': 'Ideal for recurring B2B solutions',
                'Transaction': 'Perfect for marketplaces and payments',
                'Freemium': 'Excellent for B2C acquisition',
                'Subscription': 'Optimal for premium content',
                'Commission': 'Suitable for intermediary platforms'
            }
        
        return recommendations.get(model, 'Modèle spécialisé' if language == 'french' else 'Specialized model')


# Application Flask
app = Flask(__name__)
CORS(app)

# Instance globale du générateur
business_generator = MLBusinessProjectGenerator()

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        expected_token = 'BusinessProjectGenerator2024!'
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token d\'authentification requis'}), 401
        
        token = auth_header[7:]
        if token != expected_token:
            return jsonify({'error': 'Token d\'authentification invalide'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'service': 'Business Project Generator',
        'version': '1.0.0',
        'supported_languages': ['français', 'english'],
        'supported_industries': [
            'Technology', 'Healthcare', 'Finance', 'Education',
            'Retail', 'Media', 'Logistics', 'Energy'
        ],
        'features': [
            'Intelligent milestone generation',
            'Business model recommendation',
            'Market analysis and targeting',
            'Financial projections',
            'Risk assessment',
            'Funding strategy',
            'Product roadmap',
            'Success metrics definition'
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/generate-business-project', methods=['POST'])
@authenticate
def generate_business_project():
    """Générer un projet business complet"""
    try:
        data = request.get_json()
        
        # Validation des données requises
        required_fields = ['description', 'industry', 'complexity', 'estimated_duration']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: description, industry, complexity, estimated_duration'}), 400
        
        description = data['description']
        industry = data['industry']
        complexity = data['complexity']
        estimated_duration = data['estimated_duration']
        project_type = data.get('project_type')
        
        # Validation des valeurs
        if not description or len(description.strip()) < 10:
            return jsonify({'error': 'Description trop courte (minimum 10 caractères)'}), 400
        
        if industry not in ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Media', 'Logistics', 'Energy']:
            return jsonify({'error': 'Industrie non supportée'}), 400
        
        if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
            return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
        
        if not isinstance(estimated_duration, int) or estimated_duration < 7 or estimated_duration > 365:
            return jsonify({'error': 'Durée estimée doit être entre 7 et 365 jours'}), 400
        
        # Générer le projet business
        business_project = business_generator.generate_complete_business_project(
            description, industry, complexity, estimated_duration, project_type
        )
        
        # Statistiques
        stats = {
            'milestones_count': len(business_project['milestones']),
            'business_risks_count': len(business_project['business_risks']),
            'market_opportunities_count': len(business_project['market_analysis']['growth_opportunities']),
            'revenue_streams_count': len(business_project['business_model']['revenue_streams']),
            'target_personas_count': len(business_project['market_analysis']['target_personas']),
            'roadmap_phases_count': len(business_project['product_roadmap']['phases']),
            'detected_language': business_project['project_overview']['language']
        }
        
        return jsonify({
            'success': True,
            'business_project': business_project,
            'stats': stats,
            'generation_method': 'complete_business_ml_generator',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/generate-milestones', methods=['POST'])
@authenticate
def generate_milestones():
    """Générer uniquement les jalons d'un projet"""
    try:
        data = request.get_json()
        
        required_fields = ['description', 'industry', 'complexity', 'estimated_duration']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: description, industry, complexity, estimated_duration'}), 400
        
        description = data['description']
        industry = data['industry']
        complexity = data['complexity']
        estimated_duration = data['estimated_duration']
        language = data.get('language', 'french')
        
        # Générer les jalons
        milestones = business_generator.milestone_generator.generate_milestones(
            description, industry, complexity, estimated_duration, language
        )
        
        return jsonify({
            'success': True,
            'milestones': milestones,
            'count': len(milestones),
            'total_duration': estimated_duration,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/analyze-market', methods=['POST'])
@authenticate
def analyze_market():
    """Analyser le marché cible d'un projet"""
    try:
        data = request.get_json()
        
        required_fields = ['description', 'industry', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: description, industry, complexity'}), 400
        
        description = data['description']
        industry = data['industry']
        complexity = data['complexity']
        language = data.get('language', 'french')
        
        # Analyser le marché
        market_analysis = business_generator.market_analyzer.analyze_target_market(
            description, industry, complexity, language
        )
        
        return jsonify({
            'success': True,
            'market_analysis': market_analysis,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/recommend-business-model', methods=['POST'])
@authenticate
def recommend_business_model():
    """Recommander un modèle économique"""
    try:
        data = request.get_json()
        
        required_fields = ['description', 'industry', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: description, industry, complexity'}), 400
        
        description = data['description']
        industry = data['industry']
        complexity = data['complexity']
        language = data.get('language', 'french')
        
        # Analyser le contexte business
        business_context = business_generator.business_analyzer.analyze_business_context(
            description, industry, complexity
        )
        
        # Analyser le marché pour les recommandations
        market_analysis = business_generator.market_analyzer.analyze_target_market(
            description, industry, complexity, language
        )
        
        # Recommander le modèle économique
        business_model = business_generator._recommend_business_model(
            business_context, market_analysis, industry, complexity, language
        )
        
        return jsonify({
            'success': True,
            'business_model': business_model,
            'business_context': business_context,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/calculate-financial-projections', methods=['POST'])
@authenticate
def calculate_financial_projections():
    """Calculer les projections financières"""
    try:
        data = request.get_json()
        
        required_fields = ['business_model', 'market_analysis', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: business_model, market_analysis, complexity'}), 400
        
        business_model = data['business_model']
        market_analysis = data['market_analysis']
        complexity = data['complexity']
        language = data.get('language', 'french')
        
        # Calculer les projections
        financial_projections = business_generator._calculate_financial_projections(
            business_model, market_analysis, complexity, language
        )
        
        return jsonify({
            'success': True,
            'financial_projections': financial_projections,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/generate-product-roadmap', methods=['POST'])
@authenticate
def generate_product_roadmap():
    """Générer une roadmap produit"""
    try:
        data = request.get_json()
        
        required_fields = ['milestones', 'market_analysis', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: milestones, market_analysis, complexity'}), 400
        
        milestones = data['milestones']
        market_analysis = data['market_analysis']
        complexity = data['complexity']
        language = data.get('language', 'french')
        
        # Générer la roadmap
        product_roadmap = business_generator._generate_product_roadmap(
            milestones, market_analysis, complexity, language
        )
        
        return jsonify({
            'success': True,
            'product_roadmap': product_roadmap,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/assess-business-risks', methods=['POST'])
@authenticate
def assess_business_risks():
    """Évaluer les risques business"""
    try:
        data = request.get_json()
        
        required_fields = ['industry', 'complexity', 'market_analysis']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: industry, complexity, market_analysis'}), 400
        
        industry = data['industry']
        complexity = data['complexity']
        market_analysis = data['market_analysis']
        language = data.get('language', 'french')
        
        # Identifier les risques
        business_risks = business_generator._identify_business_risks(
            industry, complexity, market_analysis, language
        )
        
        return jsonify({
            'success': True,
            'business_risks': business_risks,
            'risk_count': len(business_risks),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/generate-funding-strategy', methods=['POST'])
@authenticate
def generate_funding_strategy():
    """Générer une stratégie de financement"""
    try:
        data = request.get_json()
        
        required_fields = ['financial_projections', 'complexity', 'industry']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: financial_projections, complexity, industry'}), 400
        
        financial_projections = data['financial_projections']
        complexity = data['complexity']
        industry = data['industry']
        language = data.get('language', 'french')
        
        # Générer la stratégie
        funding_strategy = business_generator._generate_funding_strategy(
            financial_projections, complexity, industry, language
        )
        
        return jsonify({
            'success': True,
            'funding_strategy': funding_strategy,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/define-success-metrics', methods=['POST'])
@authenticate
def define_success_metrics():
    """Définir les métriques de succès"""
    try:
        data = request.get_json()
        
        required_fields = ['business_model', 'market_analysis', 'industry']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: business_model, market_analysis, industry'}), 400
        
        business_model = data['business_model']
        market_analysis = data['market_analysis']
        industry = data['industry']
        language = data.get('language', 'french')
        
        # Définir les métriques
        success_metrics = business_generator._define_success_metrics(
            business_model, market_analysis, industry, language
        )
        
        return jsonify({
            'success': True,
            'success_metrics': success_metrics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/get-business-models', methods=['GET'])
def get_business_models():
    """Récupérer les modèles économiques par industrie"""
    try:
        industry = request.args.get('industry', 'Technology')
        language = request.args.get('language', 'french')
        
        if industry not in business_generator.business_analyzer.business_models[language]:
            return jsonify({'error': 'Industrie non supportée'}), 400
        
        models = business_generator.business_analyzer.business_models[language][industry]
        market_info = business_generator.business_analyzer.market_indicators.get(industry, {})
        
        return jsonify({
            'success': True,
            'industry': industry,
            'language': language,
            'business_models': models,
            'market_indicators': market_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/estimate-market-size', methods=['POST'])
@authenticate
def estimate_market_size():
    """Estimer la taille du marché"""
    try:
        data = request.get_json()
        
        required_fields = ['industry', 'complexity', 'segment']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: industry, complexity, segment'}), 400
        
        industry = data['industry']
        complexity = data['complexity']
        segment = data['segment']
        
        # Calculer la taille du marché
        market_size = business_generator.market_analyzer._calculate_market_size(
            industry, complexity, segment
        )
        
        return jsonify({
            'success': True,
            'market_size': market_size,
            'industry': industry,
            'segment': segment,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/batch-analyze', methods=['POST'])
@authenticate
def batch_analyze():
    """Analyser plusieurs projets en batch"""
    try:
        data = request.get_json()
        
        if not data or 'projects' not in data or not isinstance(data['projects'], list):
            return jsonify({'error': 'Liste de projets requise'}), 400
        
        projects = data['projects']
        
        if len(projects) > 5:
            return jsonify({'error': 'Maximum 5 projets par batch'}), 400
        
        results = []
        for i, project in enumerate(projects):
            if not isinstance(project, dict):
                results.append({
                    'index': i,
                    'error': 'Projet invalide'
                })
                continue
            
            required_fields = ['description', 'industry', 'complexity', 'estimated_duration']
            if not all(field in project for field in required_fields):
                results.append({
                    'index': i,
                    'error': 'Champs requis manquants'
                })
                continue
            
            try:
                business_project = business_generator.generate_complete_business_project(
                    project['description'],
                    project['industry'],
                    project['complexity'],
                    project['estimated_duration'],
                    project.get('project_type')
                )
                
                results.append({
                    'index': i,
                    'description': project['description'][:50] + '...' if len(project['description']) > 50 else project['description'],
                    'business_project': business_project,
                    'summary': {
                        'milestones': len(business_project['milestones']),
                        'business_model': business_project['business_model']['recommended_model'],
                        'market_size': business_project['market_analysis']['market_size']['tam_france'],
                        'funding_needed': business_project['funding_strategy']['amount']
                    }
                })
                
            except Exception as e:
                results.append({
                    'index': i,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_projects': len(projects),
            'successful_analyses': len([r for r in results if 'business_project' in r]),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/compare-business-models', methods=['POST'])
@authenticate
def compare_business_models():
    """Comparer plusieurs modèles économiques"""
    try:
        data = request.get_json()
        
        required_fields = ['models', 'industry', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: models, industry, complexity'}), 400
        
        models = data['models']
        industry = data['industry']
        complexity = data['complexity']
        language = data.get('language', 'french')
        
        if not isinstance(models, list) or len(models) < 2:
            return jsonify({'error': 'Au moins 2 modèles requis pour comparaison'}), 400
        
        available_models = business_generator.business_analyzer.business_models[language].get(industry, {})
        
        comparisons = []
        for model in models:
            if model not in available_models:
                comparisons.append({
                    'model': model,
                    'error': 'Modèle non disponible pour cette industrie'
                })
                continue
            
            # Simuler une analyse pour chaque modèle
            pricing = business_generator._generate_pricing_strategy(model, complexity, 'B2B', language)
            revenue_streams = business_generator._identify_revenue_streams(model, industry, language)
            scalability = business_generator._assess_scalability_potential(model, industry, complexity)
            
            comparisons.append({
                'model': model,
                'description': available_models[model],
                'pricing_strategy': pricing,
                'revenue_streams': revenue_streams,
                'scalability_potential': scalability,
                'recommended_for': business_generator._get_model_recommendation(model, industry, language)
            })
        
        return jsonify({
            'success': True,
            'comparisons': comparisons,
            'industry': industry,
            'complexity': complexity,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/detect-language', methods=['POST'])
def detect_language():
    """Détecter la langue d'un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis'}), 400
        
        text = data['text']
        detected_language = business_generator.business_analyzer.detect_language(text)
        
        return jsonify({
            'success': True,
            'detected_language': detected_language,
            'supported_languages': business_generator.business_analyzer.supported_languages,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'available_endpoints': [
            'GET /health',
            'POST /api/generate-business-project',
            'POST /api/generate-milestones',
            'POST /api/analyze-market',
            'POST /api/recommend-business-model',
            'POST /api/calculate-financial-projections',
            'POST /api/generate-product-roadmap',
            'POST /api/assess-business-risks',
            'POST /api/generate-funding-strategy',
            'POST /api/define-success-metrics',
            'GET /api/get-business-models',
            'POST /api/estimate-market-size',
            'POST /api/batch-analyze',
            'POST /api/compare-business-models',
            'POST /api/detect-language'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Erreur interne du serveur',
        'message': str(error),
        'timestamp': datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    import os
    
    port = int(os.environ.get('PORT', 3006))
    
    print("=" * 90)
    print("BUSINESS PROJECT GENERATOR - MODULE 5")
    print("=" * 90)
    print(f" Service démarré sur le port {port}")
    print(" Générateur de projets business multilingue")
    print(" Support français/anglais")
    print(" 8 industries avec modèles économiques spécialisés")
    print(" Analyse de marché et projections financières")
    print("=" * 90)
    print("FONCTIONNALITÉS PRINCIPALES :")
    print("   Génération complète de projets business")
    print("   Jalons intelligents avec dépendances")
    print("   Modèles économiques recommandés")
    print("   Projections financières sur 3 ans")
    print("   Analyse de marché et personas")
    print("    Évaluation des risques business")
    print("   Stratégies de financement")
    print("    Roadmap produit par phases")
    print("   Métriques de succès KPI")
    print("   Analyses en batch")
    print("=" * 90)
    print("COMPOSANTS INTÉGRÉS :")
    print("   BusinessModelAnalyzer - Modèles économiques")
    print("   MilestoneGenerator - Jalons intelligents")
    print("   MarketTargetAnalyzer - Analyse de marché")
    print("   FinancialProjections - Projections financières")
    print("    RiskAssessment - Évaluation des risques")
    print("   FundingStrategy - Stratégies de financement")
    print("=" * 90)
    print("ENDPOINTS DISPONIBLES :")
    print(f"  - Health check            : http://localhost:{port}/health")
    print(f"  - Complete business gen   : POST http://localhost:{port}/api/generate-business-project")
    print(f"  - Generate milestones     : POST http://localhost:{port}/api/generate-milestones")
    print(f"  - Analyze market          : POST http://localhost:{port}/api/analyze-market")
    print(f"  - Recommend business model: POST http://localhost:{port}/api/recommend-business-model")
    print(f"  - Financial projections   : POST http://localhost:{port}/api/calculate-financial-projections")
    print(f"  - Product roadmap         : POST http://localhost:{port}/api/generate-product-roadmap")
    print(f"  - Assess risks           : POST http://localhost:{port}/api/assess-business-risks")
    print(f"  - Funding strategy        : POST http://localhost:{port}/api/generate-funding-strategy")
    print(f"  - Success metrics         : POST http://localhost:{port}/api/define-success-metrics")
    print(f"  - Business models         : GET http://localhost:{port}/api/get-business-models")
    print(f"  - Market size             : POST http://localhost:{port}/api/estimate-market-size")
    print(f"  - Batch analyze           : POST http://localhost:{port}/api/batch-analyze")
    print(f"  - Compare models          : POST http://localhost:{port}/api/compare-business-models")
    print(f"  - Detect language         : POST http://localhost:{port}/api/detect-language")
    print("=" * 90)
    print("Token d'authentification : 'BusinessProjectGenerator2024!'")
    print("Utilisation complète :")
    print("   Header: Authorization: Bearer BusinessProjectGenerator2024!")
    print("   Body: {")
    print("     \"description\": \"Plateforme SaaS de gestion médicale\",")
    print("     \"industry\": \"Healthcare\",")
    print("     \"complexity\": \"complexe\",")
    print("     \"estimated_duration\": 120,")
    print("     \"project_type\": \"SaaS\"")
    print("   }")
    print("=" * 90)
    print("MODÈLES ÉCONOMIQUES SUPPORTÉS :")
    print("   SaaS/B2B_SaaS - Abonnement récurrent")
    print("   Freemium - Gratuit + Premium")
    print("   Transaction - Commission par transaction")
    print("   Marketplace - Commission plateforme")
    print("   Subscription - Abonnement contenu")
    print("   Per_Usage - Facturation à l'usage")
    print("   Consulting - Services professionnels")
    print("=" * 90)
    print("PROJECTIONS FINANCIÈRES :")
    print("   Revenus sur 3 ans")
    print("   COGS et marges")
    print("   Métriques clés (CAC, LTV, Churn)")
    print("   Besoins de financement")
    print("   Jalons de rentabilité")
    print("=" * 90)
    print("Service Business Project Generator prêt!")
    print("Génération complète de projets business avec ML ")
    
    app.run(host='0.0.0.0', port=port, debug=False)# business_project_generator.py - Module isolé pour génération business de projets
# Génération ML des aspects business : milestones, modèle économique, marché cible, concurrence
# Compatible avec pip install mimicx