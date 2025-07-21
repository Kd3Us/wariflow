# project_type_stack_predictor.py - Module isolé pour prédiction de type de projet et tech stack
# Prédiction ML du type de projet et recommandation intelligente de stack technique
# Compatible avec pip install mimicx

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import pickle
from datetime import datetime
from functools import wraps
from typing import Dict, List, Any, Tuple, Optional
import hashlib

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
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


class ProjectTypeAnalyzer:
    """Analyseur de type de projet multilingue"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # Types de projets supportés
        self.project_types = [
            'Application Web',
            'Application Mobile',
            'API REST',
            'SaaS',
            'E-commerce',
            'CMS',
            'Dashboard',
            'Système'
        ]
        
        # Patterns de détection par type et langue
        self.type_patterns = {
            'french': {
                'Application Web': [
                    'site web', 'application web', 'plateforme web', 'portail web',
                    'interface web', 'webapp', 'site internet', 'application en ligne',
                    'react', 'vue', 'angular', 'frontend', 'backend', 'fullstack'
                ],
                'Application Mobile': [
                    'application mobile', 'app mobile', 'mobile app', 'smartphone',
                    'tablette', 'ios', 'android', 'react native', 'flutter',
                    'cordova', 'ionic', 'xamarin', 'app store', 'play store'
                ],
                'API REST': [
                    'api', 'rest', 'restful', 'microservice', 'service web',
                    'endpoint', 'json', 'xml', 'graphql', 'oauth',
                    'authentification api', 'documentation api'
                ],
                'SaaS': [
                    'saas', 'software as a service', 'plateforme saas',
                    'multi-tenant', 'abonnement', 'subscription', 'cloud',
                    'scalable', 'tenant', 'saas platform'
                ],
                'E-commerce': [
                    'e-commerce', 'ecommerce', 'boutique en ligne', 'magasin',
                    'vente en ligne', 'panier', 'commande', 'paiement',
                    'shopify', 'woocommerce', 'prestashop', 'marketplace'
                ],
                'CMS': [
                    'cms', 'content management', 'gestion de contenu',
                    'blog', 'article', 'publication', 'éditeur',
                    'wordpress', 'drupal', 'joomla', 'strapi'
                ],
                'Dashboard': [
                    'dashboard', 'tableau de bord', 'reporting', 'analytique',
                    'monitoring', 'métriques', 'kpi', 'visualisation',
                    'graphique', 'chart', 'statistiques'
                ],
                'Système': [
                    'système', 'logiciel', 'application métier', 'erp',
                    'crm', 'gestion', 'base de données', 'architecture',
                    'infrastructure', 'serveur', 'réseau'
                ]
            },
            'english': {
                'Application Web': [
                    'web application', 'web app', 'web platform', 'web portal',
                    'web interface', 'webapp', 'website', 'online application',
                    'react', 'vue', 'angular', 'frontend', 'backend', 'fullstack'
                ],
                'Application Mobile': [
                    'mobile application', 'mobile app', 'smartphone app',
                    'tablet app', 'ios', 'android', 'react native', 'flutter',
                    'cordova', 'ionic', 'xamarin', 'app store', 'play store'
                ],
                'API REST': [
                    'api', 'rest', 'restful', 'microservice', 'web service',
                    'endpoint', 'json', 'xml', 'graphql', 'oauth',
                    'api authentication', 'api documentation'
                ],
                'SaaS': [
                    'saas', 'software as a service', 'saas platform',
                    'multi-tenant', 'subscription', 'cloud platform',
                    'scalable platform', 'tenant', 'cloud software'
                ],
                'E-commerce': [
                    'e-commerce', 'ecommerce', 'online store', 'shop',
                    'online sales', 'cart', 'order', 'payment',
                    'shopify', 'woocommerce', 'prestashop', 'marketplace'
                ],
                'CMS': [
                    'cms', 'content management', 'content system',
                    'blog', 'article', 'publication', 'editor',
                    'wordpress', 'drupal', 'joomla', 'strapi'
                ],
                'Dashboard': [
                    'dashboard', 'reporting', 'analytics',
                    'monitoring', 'metrics', 'kpi', 'visualization',
                    'chart', 'graph', 'statistics'
                ],
                'Système': [
                    'system', 'software', 'business application', 'erp',
                    'crm', 'management', 'database', 'architecture',
                    'infrastructure', 'server', 'network'
                ]
            }
        }
        
        # Patterns technologiques spécifiques
        self.tech_indicators = {
            'frontend': ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'],
            'backend': ['node', 'django', 'flask', 'spring', 'laravel', 'rails'],
            'mobile': ['react native', 'flutter', 'ionic', 'xamarin', 'swift', 'kotlin'],
            'database': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch'],
            'cloud': ['aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify'],
            'api': ['rest', 'graphql', 'grpc', 'swagger', 'postman']
        }
    
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour',
            'développer', 'créer', 'application', 'plateforme', 'système',
            'boutique', 'gestion', 'tableau', 'bord', 'service'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or',
            'develop', 'create', 'application', 'platform', 'system',
            'store', 'management', 'dashboard', 'service'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'
    
    def analyze_project_type_indicators(self, text: str) -> Dict[str, Any]:
        """Analyser les indicateurs de type de projet"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        type_scores = {}
        
        # Calculer le score pour chaque type de projet
        for project_type in self.project_types:
            patterns = self.type_patterns[language][project_type]
            score = sum(1 for pattern in patterns if pattern in text_lower)
            
            # Bonus si le pattern est mentionné explicitement
            if project_type.lower() in text_lower:
                score += 3
            
            type_scores[project_type] = score
        
        # Détecter les technologies mentionnées
        detected_technologies = {}
        for tech_category, techs in self.tech_indicators.items():
            detected_techs = [tech for tech in techs if tech in text_lower]
            if detected_techs:
                detected_technologies[tech_category] = detected_techs
        
        return {
            'language': language,
            'type_scores': type_scores,
            'detected_technologies': detected_technologies,
            'top_candidates': sorted(type_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        }


class TechStackRecommendationEngine:
    """Moteur de recommandation de stack technique"""
    
    def __init__(self):
        # Stacks par défaut par type de projet
        self.default_stacks = {
            'Application Web': {
                'simple': {
                    'frontend': ['HTML/CSS/JS', 'Bootstrap'],
                    'backend': ['PHP', 'Node.js'],
                    'database': ['MySQL', 'PostgreSQL'],
                    'hosting': ['Shared hosting', 'Netlify']
                },
                'moyen': {
                    'frontend': ['React', 'Vue.js'],
                    'backend': ['Node.js', 'Django'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'hosting': ['Vercel', 'Heroku'],
                    'tools': ['Git', 'Docker']
                },
                'complexe': {
                    'frontend': ['React', 'TypeScript', 'Next.js'],
                    'backend': ['Node.js', 'Django', 'FastAPI'],
                    'database': ['PostgreSQL', 'Redis'],
                    'hosting': ['AWS', 'Azure'],
                    'tools': ['Docker', 'Kubernetes', 'CI/CD']
                },
                'expert': {
                    'frontend': ['React', 'TypeScript', 'Next.js'],
                    'backend': ['Microservices', 'GraphQL'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'hosting': ['AWS', 'Kubernetes'],
                    'tools': ['Docker', 'Terraform', 'Monitoring']
                }
            },
            'Application Mobile': {
                'simple': {
                    'framework': ['Flutter', 'React Native'],
                    'backend': ['Firebase', 'Supabase'],
                    'database': ['SQLite', 'Firebase'],
                    'services': ['Push notifications']
                },
                'moyen': {
                    'framework': ['React Native', 'Flutter'],
                    'backend': ['Node.js', 'Django'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'services': ['Auth0', 'Stripe'],
                    'tools': ['Expo', 'Fastlane']
                },
                'complexe': {
                    'framework': ['React Native', 'Flutter'],
                    'backend': ['Node.js', 'Django', 'GraphQL'],
                    'database': ['PostgreSQL', 'Redis'],
                    'services': ['AWS Cognito', 'AWS S3'],
                    'tools': ['CodePush', 'Crashlytics']
                },
                'expert': {
                    'framework': ['Native iOS/Android', 'React Native'],
                    'backend': ['Microservices', 'GraphQL'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'services': ['AWS', 'Firebase'],
                    'tools': ['CI/CD', 'Performance monitoring']
                }
            },
            'API REST': {
                'simple': {
                    'framework': ['Flask', 'Express.js'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'auth': ['JWT'],
                    'docs': ['Swagger']
                },
                'moyen': {
                    'framework': ['Django REST', 'FastAPI'],
                    'database': ['PostgreSQL', 'Redis'],
                    'auth': ['OAuth2', 'JWT'],
                    'docs': ['OpenAPI', 'Swagger'],
                    'tools': ['Postman', 'Docker']
                },
                'complexe': {
                    'framework': ['Django REST', 'FastAPI', 'Spring Boot'],
                    'database': ['PostgreSQL', 'Redis', 'MongoDB'],
                    'auth': ['OAuth2', 'Auth0'],
                    'docs': ['OpenAPI', 'Swagger'],
                    'tools': ['Docker', 'API Gateway']
                },
                'expert': {
                    'framework': ['GraphQL', 'gRPC', 'Microservices'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'auth': ['OAuth2', 'Auth0', 'Keycloak'],
                    'docs': ['OpenAPI', 'GraphQL Schema'],
                    'tools': ['Kubernetes', 'API Gateway', 'Monitoring']
                }
            },
            'SaaS': {
                'simple': {
                    'frontend': ['React', 'Vue.js'],
                    'backend': ['Node.js', 'Django'],
                    'database': ['PostgreSQL'],
                    'auth': ['Auth0'],
                    'payment': ['Stripe']
                },
                'moyen': {
                    'frontend': ['React', 'TypeScript'],
                    'backend': ['Node.js', 'Django'],
                    'database': ['PostgreSQL', 'Redis'],
                    'auth': ['Auth0', 'AWS Cognito'],
                    'payment': ['Stripe', 'PayPal'],
                    'tools': ['Docker', 'CI/CD']
                },
                'complexe': {
                    'frontend': ['React', 'TypeScript', 'Next.js'],
                    'backend': ['Microservices', 'GraphQL'],
                    'database': ['PostgreSQL', 'Redis'],
                    'auth': ['Auth0', 'Keycloak'],
                    'payment': ['Stripe', 'Multi-currency'],
                    'tools': ['Docker', 'Kubernetes', 'Monitoring']
                },
                'expert': {
                    'frontend': ['React', 'TypeScript', 'Micro-frontends'],
                    'backend': ['Microservices', 'Event-driven'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'auth': ['Multi-tenant auth', 'SSO'],
                    'payment': ['Multi-gateway', 'Billing'],
                    'tools': ['Kubernetes', 'Service mesh', 'Observability']
                }
            },
            'E-commerce': {
                'simple': {
                    'platform': ['Shopify', 'WooCommerce'],
                    'frontend': ['Liquid', 'PHP'],
                    'payment': ['Stripe', 'PayPal'],
                    'hosting': ['Shopify', 'WordPress']
                },
                'moyen': {
                    'frontend': ['React', 'Vue.js'],
                    'backend': ['Node.js', 'Django'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'payment': ['Stripe', 'PayPal'],
                    'search': ['Elasticsearch', 'Algolia']
                },
                'complexe': {
                    'frontend': ['React', 'TypeScript', 'Next.js'],
                    'backend': ['Microservices', 'GraphQL'],
                    'database': ['PostgreSQL', 'Redis'],
                    'payment': ['Multi-gateway'],
                    'search': ['Elasticsearch'],
                    'tools': ['Docker', 'CDN']
                },
                'expert': {
                    'frontend': ['React', 'TypeScript', 'PWA'],
                    'backend': ['Microservices', 'Event-driven'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'payment': ['Multi-gateway', 'Fraud detection'],
                    'search': ['Elasticsearch', 'Recommendations'],
                    'tools': ['Kubernetes', 'Real-time inventory']
                }
            },
            'CMS': {
                'simple': {
                    'platform': ['WordPress', 'Ghost'],
                    'frontend': ['PHP', 'Handlebars'],
                    'database': ['MySQL', 'SQLite'],
                    'hosting': ['Shared hosting']
                },
                'moyen': {
                    'platform': ['Strapi', 'Contentful'],
                    'frontend': ['React', 'Vue.js'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'hosting': ['Vercel', 'Netlify']
                },
                'complexe': {
                    'platform': ['Headless CMS', 'Custom'],
                    'frontend': ['React', 'TypeScript', 'Next.js'],
                    'backend': ['Node.js', 'GraphQL'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'hosting': ['AWS', 'Vercel']
                },
                'expert': {
                    'platform': ['Custom headless', 'Multi-site'],
                    'frontend': ['React', 'TypeScript', 'Static generation'],
                    'backend': ['Microservices', 'GraphQL'],
                    'database': ['PostgreSQL', 'Elasticsearch'],
                    'hosting': ['AWS', 'CDN', 'Multi-region']
                }
            },
            'Dashboard': {
                'simple': {
                    'frontend': ['Chart.js', 'D3.js'],
                    'backend': ['Flask', 'Express.js'],
                    'database': ['PostgreSQL', 'MySQL'],
                    'visualization': ['Chart.js', 'Google Charts']
                },
                'moyen': {
                    'frontend': ['React', 'Vue.js', 'D3.js'],
                    'backend': ['Django', 'FastAPI'],
                    'database': ['PostgreSQL', 'InfluxDB'],
                    'visualization': ['Recharts', 'Chart.js']
                },
                'complexe': {
                    'frontend': ['React', 'TypeScript', 'D3.js'],
                    'backend': ['Django', 'FastAPI', 'GraphQL'],
                    'database': ['PostgreSQL', 'InfluxDB', 'Redis'],
                    'visualization': ['Custom charts', 'Real-time']
                },
                'expert': {
                    'frontend': ['React', 'TypeScript', 'WebGL'],
                    'backend': ['Microservices', 'Stream processing'],
                    'database': ['PostgreSQL', 'InfluxDB', 'Elasticsearch'],
                    'visualization': ['Custom WebGL', 'Real-time streaming']
                }
            },
            'Système': {
                'simple': {
                    'backend': ['Django', 'Laravel'],
                    'database': ['PostgreSQL', 'MySQL'],
                    'frontend': ['Bootstrap', 'Vue.js'],
                    'hosting': ['VPS', 'Heroku']
                },
                'moyen': {
                    'backend': ['Django', 'Spring Boot'],
                    'database': ['PostgreSQL', 'MongoDB'],
                    'frontend': ['React', 'Angular'],
                    'hosting': ['AWS', 'Docker']
                },
                'complexe': {
                    'backend': ['Microservices', 'Spring Boot'],
                    'database': ['PostgreSQL', 'Redis', 'MongoDB'],
                    'frontend': ['React', 'TypeScript'],
                    'hosting': ['AWS', 'Kubernetes']
                },
                'expert': {
                    'backend': ['Microservices', 'Event-driven'],
                    'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                    'frontend': ['React', 'TypeScript', 'Micro-frontends'],
                    'hosting': ['Kubernetes', 'Multi-cloud']
                }
            }
        }
        
        # Ajustements par industrie
        self.industry_adjustments = {
            'Healthcare': {
                'security': ['HIPAA compliance', 'End-to-end encryption'],
                'database': ['Encrypted storage', 'Audit logs'],
                'hosting': ['HIPAA-compliant cloud']
            },
            'Finance': {
                'security': ['PCI-DSS compliance', 'Multi-factor auth'],
                'database': ['Encrypted storage', 'ACID compliance'],
                'hosting': ['Financial-grade security']
            },
            'Education': {
                'features': ['LMS integration', 'Video streaming'],
                'database': ['Student data protection'],
                'hosting': ['Scalable for peak usage']
            },
            'Energy': {
                'features': ['IoT integration', 'Real-time monitoring'],
                'database': ['Time-series data'],
                'hosting': ['Edge computing']
            }
        }
    
    def recommend_tech_stack(self, project_type: str, complexity: str, industry: str = None, detected_techs: Dict = None) -> Dict[str, Any]:
        """Recommander une stack technique complète"""
        # Stack de base selon le type et complexité
        base_stack = self.default_stacks.get(project_type, {}).get(complexity, {})
        
        if not base_stack:
            # Fallback pour les cas non couverts
            base_stack = self.default_stacks['Application Web']['moyen']
        
        # Copier la stack de base
        recommended_stack = dict(base_stack)
        
        # Ajustements selon l'industrie
        if industry and industry in self.industry_adjustments:
            industry_adjustments = self.industry_adjustments[industry]
            for category, additions in industry_adjustments.items():
                if category in recommended_stack:
                    recommended_stack[category].extend(additions)
                else:
                    recommended_stack[category] = additions
        
        # Intégrer les technologies détectées
        if detected_techs:
            for tech_category, techs in detected_techs.items():
                if tech_category in recommended_stack:
                    # Prioriser les technologies mentionnées
                    for tech in techs:
                        if tech not in recommended_stack[tech_category]:
                            recommended_stack[tech_category].insert(0, tech)
                else:
                    recommended_stack[tech_category] = techs
        
        # Générer des alternatives
        alternatives = self._generate_alternatives(project_type, complexity, recommended_stack)
        
        return {
            'project_type': project_type,
            'complexity': complexity,
            'industry': industry,
            'recommended_stack': recommended_stack,
            'alternatives': alternatives,
            'explanation': self._generate_stack_explanation(project_type, complexity, industry),
            'estimated_cost': self._estimate_tech_cost(recommended_stack, complexity),
            'development_time_impact': self._estimate_time_impact(recommended_stack, complexity)
        }
    
    def _generate_alternatives(self, project_type: str, complexity: str, current_stack: Dict) -> Dict[str, List[str]]:
        """Générer des alternatives technologiques"""
        alternatives = {}
        
        # Alternatives par catégorie
        alternative_map = {
            'frontend': {
                'React': ['Vue.js', 'Angular', 'Svelte'],
                'Vue.js': ['React', 'Angular'],
                'Angular': ['React', 'Vue.js']
            },
            'backend': {
                'Node.js': ['Django', 'FastAPI', 'Spring Boot'],
                'Django': ['FastAPI', 'Flask', 'Laravel'],
                'FastAPI': ['Django', 'Flask']
            },
            'database': {
                'PostgreSQL': ['MySQL', 'MongoDB'],
                'MySQL': ['PostgreSQL', 'MongoDB'],
                'MongoDB': ['PostgreSQL', 'CouchDB']
            }
        }
        
        for category, techs in current_stack.items():
            if category in alternative_map:
                alternatives[category] = []
                for tech in techs:
                    if tech in alternative_map[category]:
                        alternatives[category].extend(alternative_map[category][tech])
                
                # Supprimer les doublons
                alternatives[category] = list(set(alternatives[category]))
        
        return alternatives
    
    def _generate_stack_explanation(self, project_type: str, complexity: str, industry: str) -> str:
        """Générer une explication de la stack recommandée"""
        explanations = {
            'Application Web': {
                'simple': "Stack classique pour développement web rapide et efficace",
                'moyen': "Stack moderne avec framework frontend et backend robuste",
                'complexe': "Stack avancée avec TypeScript et outils de développement",
                'expert': "Stack enterprise avec microservices et architecture distribuée"
            },
            'Application Mobile': {
                'simple': "Framework cross-platform pour développement rapide",
                'moyen': "Stack hybride avec backend personnalisé",
                'complexe': "Architecture native avec services cloud",
                'expert': "Stack native haute performance avec infrastructure scalable"
            },
            'API REST': {
                'simple': "API simple avec documentation automatique",
                'moyen': "API robuste avec authentification et cache",
                'complexe': "API enterprise avec gateway et monitoring",
                'expert': "Architecture microservices avec GraphQL et observabilité"
            },
            'SaaS': {
                'simple': "MVP SaaS avec authentification et paiement",
                'moyen': "Plateforme SaaS avec multi-tenancy basique",
                'complexe': "SaaS enterprise avec architecture scalable",
                'expert': "Plateforme SaaS distribuée avec micro-frontends"
            }
        }
        
        base_explanation = explanations.get(project_type, {}).get(complexity, "Stack recommandée selon les besoins")
        
        if industry:
            industry_notes = {
                'Healthcare': " avec conformité HIPAA et sécurité renforcée",
                'Finance': " avec conformité PCI-DSS et sécurité financière",
                'Education': " avec intégrations LMS et scalabilité",
                'Energy': " avec support IoT et monitoring temps réel"
            }
            base_explanation += industry_notes.get(industry, "")
        
        return base_explanation
    
    def _estimate_tech_cost(self, stack: Dict, complexity: str) -> Dict[str, str]:
        """Estimer le coût de la stack technologique"""
        cost_multipliers = {
            'simple': 1.0,
            'moyen': 1.5,
            'complexe': 2.5,
            'expert': 4.0
        }
        
        base_cost = 500  # Coût de base mensuel en €
        multiplier = cost_multipliers.get(complexity, 1.5)
        estimated_monthly = int(base_cost * multiplier)
        
        return {
            'monthly_estimate': f"{estimated_monthly}€/mois",
            'yearly_estimate': f"{estimated_monthly * 12}€/an",
            'initial_setup': f"{estimated_monthly * 2}€",
            'note': "Estimation basée sur l'hébergement et services cloud"
        }
    
    def _estimate_time_impact(self, stack: Dict, complexity: str) -> Dict[str, str]:
        """Estimer l'impact sur le temps de développement"""
        time_impacts = {
            'simple': {
                'setup_time': '1-2 jours',
                'learning_curve': 'Faible',
                'development_speed': 'Rapide'
            },
            'moyen': {
                'setup_time': '3-5 jours',
                'learning_curve': 'Modérée',
                'development_speed': 'Normale'
            },
            'complexe': {
                'setup_time': '1-2 semaines',
                'learning_curve': 'Élevée',
                'development_speed': 'Lente mais robuste'
            },
            'expert': {
                'setup_time': '2-3 semaines',
                'learning_curve': 'Très élevée',
                'development_speed': 'Lente mais enterprise-grade'
            }
        }
        
        return time_impacts.get(complexity, time_impacts['moyen'])


class ProjectTypeFeatureExtractor:
    """Extracteur de features pour la classification de type de projet"""
    
    def __init__(self):
        self.type_analyzer = ProjectTypeAnalyzer()
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=400,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.9
        )
    
    def extract_project_type_features(self, text: str) -> Dict[str, float]:
        """Extraire les features pour classification de type de projet"""
        analysis = self.type_analyzer.analyze_project_type_indicators(text)
        
        features = {}
        
        # 1. Scores par type de projet
        for project_type, score in analysis['type_scores'].items():
            clean_type = project_type.replace(' ', '_').lower()
            features[f'{clean_type}_score'] = score
        
        # 2. Features technologiques
        tech_features = {
            'has_frontend_tech': 0,
            'has_backend_tech': 0,
            'has_mobile_tech': 0,
            'has_database_tech': 0,
            'has_cloud_tech': 0,
            'has_api_tech': 0
        }
        
        for tech_category, techs in analysis['detected_technologies'].items():
            if techs:
                tech_features[f'has_{tech_category}_tech'] = len(techs)
        
        features.update(tech_features)
        
        # 3. Features textuelles
        words = text.split()
        features['text_length'] = len(text)
        features['word_count'] = len(words)
        features['unique_word_ratio'] = len(set(words)) / len(words) if words else 0
        
        # 4. Features linguistiques
        try:
            tokens = word_tokenize(text)
            pos_tags = pos_tag(tokens)
            
            noun_count = sum(1 for _, tag in pos_tags if tag.startswith('NN'))
            verb_count = sum(1 for _, tag in pos_tags if tag.startswith('VB'))
            
            features['noun_ratio'] = noun_count / len(tokens) if tokens else 0
            features['verb_ratio'] = verb_count / len(tokens) if tokens else 0
        except:
            features['noun_ratio'] = 0
            features['verb_ratio'] = 0
        
        # 5. Features spécifiques par domaine
        features['web_indicators'] = self._count_web_indicators(text, analysis['language'])
        features['mobile_indicators'] = self._count_mobile_indicators(text, analysis['language'])
        features['api_indicators'] = self._count_api_indicators(text, analysis['language'])
        features['ecommerce_indicators'] = self._count_ecommerce_indicators(text, analysis['language'])
        
        return features
    
    def _count_web_indicators(self, text: str, language: str) -> float:
        """Compter les indicateurs web"""
        if language == 'french':
            indicators = ['site', 'web', 'internet', 'navigateur', 'html', 'css', 'javascript']
        else:
            indicators = ['website', 'web', 'internet', 'browser', 'html', 'css', 'javascript']
        
        text_lower = text.lower()
        return sum(1 for indicator in indicators if indicator in text_lower)
    
    def _count_mobile_indicators(self, text: str, language: str) -> float:
        """Compter les indicateurs mobile"""
        if language == 'french':
            indicators = ['mobile', 'smartphone', 'tablette', 'ios', 'android', 'app']
        else:
            indicators = ['mobile', 'smartphone', 'tablet', 'ios', 'android', 'app']
        
        text_lower = text.lower()
        return sum(1 for indicator in indicators if indicator in text_lower)
    
    def _count_api_indicators(self, text: str, language: str) -> float:
        """Compter les indicateurs API"""
        indicators = ['api', 'rest', 'json', 'xml', 'endpoint', 'microservice', 'graphql']
        text_lower = text.lower()
        return sum(1 for indicator in indicators if indicator in text_lower)
    
    def _count_ecommerce_indicators(self, text: str, language: str) -> float:
        """Compter les indicateurs e-commerce"""
        if language == 'french':
            indicators = ['boutique', 'magasin', 'vente', 'panier', 'commande', 'paiement', 'ecommerce']
        else:
            indicators = ['shop', 'store', 'sales', 'cart', 'order', 'payment', 'ecommerce']
        
        text_lower = text.lower()
        return sum(1 for indicator in indicators if indicator in text_lower)


class MLProjectTypeStackPredictor:
    """Prédicteur ML de type de projet et recommandation de stack"""
    
    def __init__(self):
        self.type_analyzer = ProjectTypeAnalyzer()
        self.feature_extractor = ProjectTypeFeatureExtractor()
        self.stack_engine = TechStackRecommendationEngine()
        
        # Modèles ML
        self.project_type_classifier = None
        self.label_encoder = LabelEncoder()
        
        # État d'entraînement
        self.is_trained = False
        
        # Cache
        self.prediction_cache = {}
    
    def load_training_dataset(self) -> pd.DataFrame:
        """Charger ou générer le dataset d'entraînement"""
        training_data = []
        
        # Dataset d'entraînement avec exemples réels par type de projet
        training_samples = [
            # Application Web
            ("Site web vitrine pour entreprise avec contact", "Application Web", "Technology", "french"),
            ("Plateforme web React avec authentification utilisateurs", "Application Web", "Technology", "french"),
            ("Application web de gestion d'inventaire", "Application Web", "Technology", "french"),
            ("Portail web avec dashboard administrateur", "Application Web", "Technology", "french"),
            ("Site internet responsive avec blog intégré", "Application Web", "Technology", "french"),
            ("Interface web pour système de réservation", "Application Web", "Technology", "french"),
            ("Plateforme collaborative avec chat temps réel", "Application Web", "Technology", "french"),
            
            ("Company website with contact form", "Application Web", "Technology", "english"),
            ("React web platform with user authentication", "Application Web", "Technology", "english"),
            ("Web application for inventory management", "Application Web", "Technology", "english"),
            ("Web portal with admin dashboard", "Application Web", "Technology", "english"),
            ("Responsive website with integrated blog", "Application Web", "Technology", "english"),
            ("Web interface for booking system", "Application Web", "Technology", "english"),
            ("Collaborative web platform with real-time chat", "Application Web", "Technology", "english"),
            
            # Application Mobile
            ("Application mobile iOS et Android avec géolocalisation", "Application Mobile", "Technology", "french"),
            ("App mobile Flutter pour suivi fitness", "Application Mobile", "Healthcare", "french"),
            ("Application smartphone avec notifications push", "Application Mobile", "Technology", "french"),
            ("App mobile React Native pour e-commerce", "Application Mobile", "Retail", "french"),
            ("Application mobile de réseautage social", "Application Mobile", "Media", "french"),
            ("App mobile pour commande de nourriture", "Application Mobile", "Retail", "french"),
            ("Application mobile de gestion de tâches", "Application Mobile", "Technology", "french"),
            
            ("iOS and Android mobile app with geolocation", "Application Mobile", "Technology", "english"),
            ("Flutter mobile app for fitness tracking", "Application Mobile", "Healthcare", "english"),
            ("Smartphone app with push notifications", "Application Mobile", "Technology", "english"),
            ("React Native mobile app for e-commerce", "Application Mobile", "Retail", "english"),
            ("Mobile social networking application", "Application Mobile", "Media", "english"),
            ("Mobile app for food ordering", "Application Mobile", "Retail", "english"),
            ("Mobile task management application", "Application Mobile", "Technology", "english"),
            
            # API REST
            ("API REST pour gestion des utilisateurs avec JWT", "API REST", "Technology", "french"),
            ("Service web RESTful avec documentation Swagger", "API REST", "Technology", "french"),
            ("API GraphQL pour plateforme e-commerce", "API REST", "Retail", "french"),
            ("Microservice avec authentification OAuth2", "API REST", "Technology", "french"),
            ("API REST pour système de paiement", "API REST", "Finance", "french"),
            ("Service web avec endpoints CRUD", "API REST", "Technology", "french"),
            ("API REST avec rate limiting et cache", "API REST", "Technology", "french"),
            
            ("REST API for user management with JWT", "API REST", "Technology", "english"),
            ("RESTful web service with Swagger documentation", "API REST", "Technology", "english"),
            ("GraphQL API for e-commerce platform", "API REST", "Retail", "english"),
            ("Microservice with OAuth2 authentication", "API REST", "Technology", "english"),
            ("REST API for payment system", "API REST", "Finance", "english"),
            ("Web service with CRUD endpoints", "API REST", "Technology", "english"),
            ("REST API with rate limiting and cache", "API REST", "Technology", "english"),
            
            # SaaS
            ("Plateforme SaaS multi-tenant avec abonnements", "SaaS", "Technology", "french"),
            ("Software as a Service pour gestion de projets", "SaaS", "Technology", "french"),
            ("Plateforme SaaS de facturation automatisée", "SaaS", "Finance", "french"),
            ("SaaS de gestion de relation client (CRM)", "SaaS", "Technology", "french"),
            ("Plateforme cloud avec API et webhooks", "SaaS", "Technology", "french"),
            ("SaaS de monitoring et alertes", "SaaS", "Technology", "french"),
            ("Plateforme SaaS pour formation en ligne", "SaaS", "Education", "french"),
            
            ("Multi-tenant SaaS platform with subscriptions", "SaaS", "Technology", "english"),
            ("Software as a Service for project management", "SaaS", "Technology", "english"),
            ("SaaS platform for automated billing", "SaaS", "Finance", "english"),
            ("Customer relationship management SaaS", "SaaS", "Technology", "english"),
            ("Cloud platform with API and webhooks", "SaaS", "Technology", "english"),
            ("SaaS for monitoring and alerts", "SaaS", "Technology", "english"),
            ("SaaS platform for online training", "SaaS", "Education", "english"),
            
            # E-commerce
            ("Boutique en ligne avec panier et paiement Stripe", "E-commerce", "Retail", "french"),
            ("Marketplace multi-vendeurs avec commissions", "E-commerce", "Retail", "french"),
            ("Site e-commerce avec gestion stock", "E-commerce", "Retail", "french"),
            ("Plateforme de vente en ligne B2B", "E-commerce", "Retail", "french"),
            ("E-commerce avec recherche et filtres avancés", "E-commerce", "Retail", "french"),
            ("Boutique en ligne avec abonnements", "E-commerce", "Retail", "french"),
            ("E-commerce mobile-first avec PWA", "E-commerce", "Retail", "french"),
            
            ("Online store with cart and Stripe payment", "E-commerce", "Retail", "english"),
            ("Multi-vendor marketplace with commissions", "E-commerce", "Retail", "english"),
            ("E-commerce site with inventory management", "E-commerce", "Retail", "english"),
            ("B2B online sales platform", "E-commerce", "Retail", "english"),
            ("E-commerce with advanced search and filters", "E-commerce", "Retail", "english"),
            ("Online store with subscriptions", "E-commerce", "Retail", "english"),
            ("Mobile-first e-commerce with PWA", "E-commerce", "Retail", "english"),
            
            # CMS
            ("CMS pour blog avec éditeur WYSIWYG", "CMS", "Media", "french"),
            ("Système de gestion de contenu headless", "CMS", "Technology", "french"),
            ("CMS multi-site avec workflow de publication", "CMS", "Media", "french"),
            ("Gestionnaire de contenu avec API", "CMS", "Technology", "french"),
            ("CMS pour site vitrine avec SEO", "CMS", "Technology", "french"),
            ("Système de publication d'articles", "CMS", "Media", "french"),
            ("CMS avec gestion des médias", "CMS", "Media", "french"),
            
            ("CMS for blog with WYSIWYG editor", "CMS", "Media", "english"),
            ("Headless content management system", "CMS", "Technology", "english"),
            ("Multi-site CMS with publishing workflow", "CMS", "Media", "english"),
            ("Content manager with API", "CMS", "Technology", "english"),
            ("CMS for showcase website with SEO", "CMS", "Technology", "english"),
            ("Article publishing system", "CMS", "Media", "english"),
            ("CMS with media management", "CMS", "Media", "english"),
            
            # Dashboard
            ("Dashboard analytique avec graphiques temps réel", "Dashboard", "Technology", "french"),
            ("Tableau de bord KPI pour direction", "Dashboard", "Technology", "french"),
            ("Dashboard de monitoring serveurs", "Dashboard", "Technology", "french"),
            ("Interface de reporting avec exports", "Dashboard", "Technology", "french"),
            ("Dashboard financier avec métriques", "Dashboard", "Finance", "french"),
            ("Tableau de bord commercial avec CRM", "Dashboard", "Technology", "french"),
            ("Dashboard IoT avec visualisation capteurs", "Dashboard", "Energy", "french"),
            
            ("Analytics dashboard with real-time charts", "Dashboard", "Technology", "english"),
            ("KPI dashboard for management", "Dashboard", "Technology", "english"),
            ("Server monitoring dashboard", "Dashboard", "Technology", "english"),
            ("Reporting interface with exports", "Dashboard", "Technology", "english"),
            ("Financial dashboard with metrics", "Dashboard", "Finance", "english"),
            ("Sales dashboard with CRM", "Dashboard", "Technology", "english"),
            ("IoT dashboard with sensor visualization", "Dashboard", "Energy", "english"),
            
            # Système
            ("Système de gestion d'entreprise (ERP)", "Système", "Technology", "french"),
            ("Logiciel de gestion de stocks", "Système", "Technology", "french"),
            ("Système de gestion hospitalière", "Système", "Healthcare", "french"),
            ("Application métier avec workflow", "Système", "Technology", "french"),
            ("Système de gestion documentaire", "Système", "Technology", "french"),
            ("Logiciel de comptabilité", "Système", "Finance", "french"),
            ("Système de gestion des ressources humaines", "Système", "Technology", "french"),
            
            ("Enterprise resource planning system", "Système", "Technology", "english"),
            ("Inventory management software", "Système", "Technology", "english"),
            ("Hospital management system", "Système", "Healthcare", "english"),
            ("Business application with workflow", "Système", "Technology", "english"),
            ("Document management system", "Système", "Technology", "english"),
            ("Accounting software", "Système", "Finance", "english"),
            ("Human resources management system", "Système", "Technology", "english")
        ]
        
        df = pd.DataFrame(training_samples, columns=['description', 'project_type', 'industry', 'language'])
        print(f"Dataset d'entraînement créé : {len(df)} échantillons pour {len(self.type_analyzer.project_types)} types de projets")
        return df
    
    def train_model(self):
        """Entraîner le modèle de classification de type de projet"""
        if self.is_trained:
            return
        
        print("Entraînement du classificateur de type de projet...")
        
        # Charger les données
        df = self.load_training_dataset()
        
        # Extraire les features
        print("Extraction des features...")
        feature_matrix = []
        for text in df['description']:
            features = self.feature_extractor.extract_project_type_features(text)
            feature_matrix.append(list(features.values()))
        
        X = np.array(feature_matrix)
        y = self.label_encoder.fit_transform(df['project_type'])
        
        # Entraîner le modèle ensemble
        self.project_type_classifier = VotingClassifier([
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')),
            ('svm', SVC(probability=True, random_state=42, class_weight='balanced', kernel='rbf')),
            ('nb', MultinomialNB(alpha=0.1))
        ], voting='soft')
        
        self.project_type_classifier.fit(X, y)
        
        # Évaluation
        self._evaluate_model(X, y, df['project_type'])
        
        self.is_trained = True
        print("Classificateur de type de projet entraîné avec succès!")
    
    def _evaluate_model(self, X, y, project_types):
        """Évaluer les performances du modèle"""
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            predictions = self.project_type_classifier.predict(X_test)
            accuracy = accuracy_score(y_test, predictions)
            
            print(f"Précision du modèle de type de projet : {accuracy:.3f}")
            
            # Distribution des prédictions
            from collections import Counter
            predicted_types = self.label_encoder.inverse_transform(predictions)
            actual_types = self.label_encoder.inverse_transform(y_test)
            
            print(f"Distribution prédite : {Counter(predicted_types)}")
            print(f"Distribution réelle : {Counter(actual_types)}")
            
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
    
    def predict_project_type_and_stack(self, text: str, complexity: str = "moyen", industry: str = None, language: str = None) -> Dict[str, Any]:
        """Prédire le type de projet et recommander une stack technique"""
        if not text or len(text.strip()) < 10:
            return {'error': 'Texte trop court (minimum 10 caractères)'}
        
        if not self.is_trained:
            self.train_model()

        if language is None:
            language = self.detect_language(text)
        
        # Cache
        cache_key = hashlib.md5(f"{text}_{complexity}_{industry}".encode()).hexdigest()
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
        
        try:
            # Analyser les indicateurs
            type_analysis = self.type_analyzer.analyze_project_type_indicators(text)
            
            # Extraire les features
            features = self.feature_extractor.extract_project_type_features(text)
            X = np.array([list(features.values())])
            
            # Prédire le type de projet
            prediction = self.project_type_classifier.predict(X)[0]
            probabilities = self.project_type_classifier.predict_proba(X)[0]
            
            predicted_type = self.label_encoder.inverse_transform([prediction])[0]
            confidence = float(np.max(probabilities))
            
            # Probabilités par type de projet
            type_probabilities = {}
            for i, project_type in enumerate(self.label_encoder.classes_):
                type_name = self.label_encoder.inverse_transform([i])[0]
                type_probabilities[type_name] = float(probabilities[i])
            
            # Recommander la stack technique
            stack_recommendation = self.stack_engine.recommend_tech_stack(
                predicted_type, 
                complexity, 
                industry, 
                type_analysis['detected_technologies']
            )
            
            result = {
                'project_type': predicted_type,
                'confidence': confidence,
                'language': type_analysis['language'],
                'type_probabilities': type_probabilities,
                'top_3_types': self._get_top_types(type_probabilities, 3),
                'detected_technologies': type_analysis['detected_technologies'],
                'tech_stack_recommendation': stack_recommendation,
                'type_analysis': {
                    'main_indicators': type_analysis['top_candidates'][:3],
                    'detected_patterns': self._analyze_detected_patterns(type_analysis, predicted_type)
                },
                'method': 'ml_voting_classifier'
            }
            
            self.prediction_cache[cache_key] = result
            return result
            
        except Exception as e:
            print(f"Erreur lors de la prédiction : {e}")
            return {
                'project_type': 'Application Web',
                'confidence': 0.5,
                'error': str(e),
                'method': 'fallback'
            }
    
    def _get_top_types(self, probabilities: Dict[str, float], top_n: int) -> List[Dict[str, Any]]:
        """Récupérer le top N des types de projets par probabilité"""
        sorted_types = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
        return [
            {'project_type': ptype, 'probability': prob}
            for ptype, prob in sorted_types[:top_n]
        ]
    
    def _analyze_detected_patterns(self, type_analysis: Dict, predicted_type: str) -> List[str]:
        """Analyser les patterns détectés qui ont mené à la prédiction"""
        patterns = []
        
        # Analyser les scores élevés
        type_scores = type_analysis['type_scores']
        for ptype, score in type_scores.items():
            if score > 0 and ptype == predicted_type:
                patterns.append(f"Forte correspondance avec {ptype} (score: {score})")
        
        # Analyser les technologies détectées
        detected_techs = type_analysis['detected_technologies']
        if detected_techs:
            for tech_category, techs in detected_techs.items():
                if techs:
                    patterns.append(f"Technologies {tech_category} détectées: {', '.join(techs)}")
        
        return patterns[:5]  # Limiter à 5 patterns


# Application Flask
app = Flask(__name__)
CORS(app)

# Instance globale du prédicteur
predictor = MLProjectTypeStackPredictor()

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        expected_token = 'ProjectTypeStackPredictor2024!'
        
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
        'service': 'Project Type & Tech Stack Predictor - ML',
        'version': '1.0.0',
        'project_types': predictor.type_analyzer.project_types,
        'supported_languages': ['français', 'english'],
        'supported_complexities': ['simple', 'moyen', 'complexe', 'expert'],
        'supported_industries': [
            'Technology', 'Healthcare', 'Finance', 'Education',
            'Retail', 'Media', 'Logistics', 'Energy'
        ],
        'features': [
            'ML project type classification',
            'Intelligent tech stack recommendation',
            'Industry-specific adjustments',
            'Technology detection',
            'Cost and time estimation',
            'Alternative suggestions'
        ],
        'model_trained': predictor.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict-project-type-stack', methods=['POST'])
@authenticate
def predict_project_type_stack():
    """Prédire le type de projet et recommander une stack technique"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        complexity = data.get('complexity', 'moyen')
        industry = data.get('industry')
        
        if not text or len(text.strip()) < 10:
            return jsonify({'error': 'Texte trop court (minimum 10 caractères)'}), 400
        
        if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
            return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
        
        # Prédiction
        result = predictor.predict_project_type_and_stack(text, complexity, industry)
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify({
            'success': True,
            'result': result,
            'input_text_length': len(text),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/predict-project-type', methods=['POST'])
@authenticate
def predict_project_type():
    """Prédire seulement le type de projet"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        
        result = predictor.predict_project_type_and_stack(text)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Retourner seulement les infos de type de projet
        type_result = {
            'project_type': result['project_type'],
            'confidence': result['confidence'],
            'type_probabilities': result['type_probabilities'],
            'top_3_types': result['top_3_types'],
            'detected_technologies': result['detected_technologies'],
            'type_analysis': result['type_analysis'],
            'language': result['language']
        }
        
        return jsonify({
            'success': True,
            'result': type_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/recommend-tech-stack', methods=['POST'])
@authenticate
def recommend_tech_stack():
    """Recommander une stack technique pour un type de projet donné"""
    try:
        data = request.get_json()
        
        required_fields = ['project_type', 'complexity']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Champs requis: project_type, complexity'}), 400
        
        project_type = data['project_type']
        complexity = data['complexity']
        industry = data.get('industry')
        detected_techs = data.get('detected_technologies', {})
        
        if project_type not in predictor.type_analyzer.project_types:
            return jsonify({'error': f'Type de projet invalide. Types supportés: {predictor.type_analyzer.project_types}'}), 400
        
        if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
            return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
        
        # Recommandation de stack
        stack_recommendation = predictor.stack_engine.recommend_tech_stack(
            project_type, complexity, industry, detected_techs
        )
        
        return jsonify({
            'success': True,
            'result': stack_recommendation,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/analyze-project-indicators', methods=['POST'])
def analyze_project_indicators():
    """Analyser les indicateurs de type de projet dans un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        
        analysis = predictor.type_analyzer.analyze_project_type_indicators(text)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/get-available-stacks', methods=['GET'])
def get_available_stacks():
    """Récupérer toutes les stacks disponibles par type et complexité"""
    try:
        available_stacks = {}
        
        for project_type in predictor.type_analyzer.project_types:
            available_stacks[project_type] = {}
            for complexity in ['simple', 'moyen', 'complexe', 'expert']:
                stack = predictor.stack_engine.default_stacks.get(project_type, {}).get(complexity, {})
                if stack:
                    available_stacks[project_type][complexity] = stack
        
        return jsonify({
            'success': True,
            'available_stacks': available_stacks,
            'project_types': predictor.type_analyzer.project_types,
            'complexities': ['simple', 'moyen', 'complexe', 'expert'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/batch-predict-types', methods=['POST'])
@authenticate
def batch_predict_types():
    """Prédire les types en batch pour plusieurs projets"""
    try:
        data = request.get_json()
        
        if not data or 'projects' not in data or not isinstance(data['projects'], list):
            return jsonify({'error': 'Liste de projets requise dans le champ "projects"'}), 400
        
        projects = data['projects']
        
        if len(projects) > 15:
            return jsonify({'error': 'Maximum 15 projets par batch'}), 400
        
        results = []
        for i, project in enumerate(projects):
            if not isinstance(project, dict) or 'text' not in project:
                results.append({
                    'index': i,
                    'error': 'Chaque projet doit avoir un champ "text"'
                })
                continue
            
            text = project['text']
            complexity = project.get('complexity', 'moyen')
            industry = project.get('industry')
            
            if len(text.strip()) < 10:
                results.append({
                    'index': i,
                    'text': text[:50] + '...' if len(text) > 50 else text,
                    'error': 'Texte trop court (minimum 10 caractères)'
                })
                continue
            
            prediction = predictor.predict_project_type_and_stack(text, complexity, industry)
            results.append({
                'index': i,
                'text': text[:100] + '...' if len(text) > 100 else text,
                'prediction': prediction
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/compare-stacks', methods=['POST'])
def compare_stacks():
    """Comparer plusieurs stacks techniques"""
    try:
        data = request.get_json()
        
        if not data or 'stacks' not in data or not isinstance(data['stacks'], list):
            return jsonify({'error': 'Liste de stacks requise dans le champ "stacks"'}), 400
        
        stacks = data['stacks']
        
        if len(stacks) > 5:
            return jsonify({'error': 'Maximum 5 stacks à comparer'}), 400
        
        comparisons = []
        for i, stack_info in enumerate(stacks):
            if not isinstance(stack_info, dict) or 'project_type' not in stack_info or 'complexity' not in stack_info:
                comparisons.append({
                    'index': i,
                    'error': 'Chaque stack doit avoir "project_type" et "complexity"'
                })
                continue
            
            project_type = stack_info['project_type']
            complexity = stack_info['complexity']
            industry = stack_info.get('industry')
            
            stack_recommendation = predictor.stack_engine.recommend_tech_stack(
                project_type, complexity, industry
            )
            
            comparisons.append({
                'index': i,
                'project_type': project_type,
                'complexity': complexity,
                'industry': industry,
                'stack': stack_recommendation
            })
        
        return jsonify({
            'success': True,
            'comparisons': comparisons,
            'total_compared': len(comparisons),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Informations détaillées sur le modèle"""
    return jsonify({
        'success': True,
        'model_info': {
            'is_trained': predictor.is_trained,
            'algorithm': 'Voting Classifier (Random Forest + SVM + Naive Bayes)',
            'project_types': predictor.type_analyzer.project_types,
            'supported_complexities': ['simple', 'moyen', 'complexe', 'expert'],
            'supported_languages': ['français', 'english'],
            'supported_industries': [
                'Technology', 'Healthcare', 'Finance', 'Education',
                'Retail', 'Media', 'Logistics', 'Energy'
            ],
            'training_samples_per_type': 14,  # 7 français + 7 anglais
            'total_training_samples': 112,  # 8 types × 14 échantillons
            'feature_types': [
                'project_type_scores',
                'technology_indicators',
                'linguistic_features',
                'domain_specific_patterns'
            ],
            'stack_recommendation_features': [
                'default_stacks_by_type_complexity',
                'industry_specific_adjustments',
                'detected_technology_integration',
                'alternative_suggestions',
                'cost_estimation',
                'time_impact_analysis'
            ],
            'cache_enabled': True,
            'version': '1.0.0'
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/train-model', methods=['POST'])
@authenticate
def train_model():
    """Réentraîner le modèle (utile pour le développement)"""
    try:
        # Réinitialiser le modèle
        predictor.is_trained = False
        predictor.prediction_cache.clear()
        
        # Réentraîner
        predictor.train_model()
        
        return jsonify({
            'success': True,
            'message': 'Modèle réentraîné avec succès',
            'model_trained': predictor.is_trained,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/get-industry-adjustments', methods=['GET'])
def get_industry_adjustments():
    """Récupérer les ajustements spécifiques par industrie"""
    return jsonify({
        'success': True,
        'industry_adjustments': predictor.stack_engine.industry_adjustments,
        'available_industries': list(predictor.stack_engine.industry_adjustments.keys()),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/estimate-costs', methods=['POST'])
def estimate_costs():
    """Estimer les coûts pour une stack donnée"""
    try:
        data = request.get_json()
        
        if not data or 'complexity' not in data:
            return jsonify({'error': 'Complexité requise dans le champ "complexity"'}), 400
        
        complexity = data['complexity']
        stack = data.get('stack', {})
        
        if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
            return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
        
        cost_estimation = predictor.stack_engine._estimate_tech_cost(stack, complexity)
        time_impact = predictor.stack_engine._estimate_time_impact(stack, complexity)
        
        return jsonify({
            'success': True,
            'cost_estimation': cost_estimation,
            'time_impact': time_impact,
            'complexity': complexity,
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
            'POST /api/predict-project-type-stack',
            'POST /api/predict-project-type',
            'POST /api/recommend-tech-stack',
            'POST /api/analyze-project-indicators',
            'GET /api/get-available-stacks',
            'POST /api/batch-predict-types',
            'POST /api/compare-stacks',
            'GET /api/model-info',
            'POST /api/train-model',
            'GET /api/get-industry-adjustments',
            'POST /api/estimate-costs'
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
    
    port = int(os.environ.get('PORT', 3004))
    
    print("=" * 80)
    print("PROJECT TYPE & TECH STACK PREDICTOR - MODULE ISOLÉ")
    print("=" * 80)
    print(f"Service démarré sur le port {port}")
    print(f"Types de projets : {', '.join(predictor.type_analyzer.project_types)}")
    print(f"Complexités supportées : simple, moyen, complexe, expert")
    print(f"Langues supportées : français, anglais")
    print(f"Industries supportées : 8 secteurs avec ajustements spécifiques")
    print("=" * 80)
    print("FONCTIONNALITÉS PRINCIPALES :")
    print("   Classification ML de type de projet (8 types)")
    print("   Recommandation intelligente de stack technique")
    print("   Ajustements spécifiques par industrie")
    print("   Détection automatique des technologies mentionnées")
    print("   Estimation des coûts d'infrastructure")
    print("   Impact sur le temps de développement")
    print("   Suggestions d'alternatives technologiques")
    print("   Traitement en batch et comparaisons")
    print("=" * 80)
    print("ENDPOINTS DISPONIBLES :")
    print(f"  - Health check               : http://localhost:{port}/health")
    print(f"  - Predict type + stack       : POST http://localhost:{port}/api/predict-project-type-stack")
    print(f"  - Predict type only          : POST http://localhost:{port}/api/predict-project-type")
    print(f"  - Recommend stack            : POST http://localhost:{port}/api/recommend-tech-stack")
    print(f"  - Analyze indicators         : POST http://localhost:{port}/api/analyze-project-indicators")
    print(f"  - Available stacks           : GET http://localhost:{port}/api/get-available-stacks")
    print(f"  - Batch predict              : POST http://localhost:{port}/api/batch-predict-types")
    print(f"  - Compare stacks             : POST http://localhost:{port}/api/compare-stacks")
    print(f"  - Model info                 : GET http://localhost:{port}/api/model-info")
    print(f"  - Industry adjustments       : GET http://localhost:{port}/api/get-industry-adjustments")
    print(f"  - Estimate costs             : POST http://localhost:{port}/api/estimate-costs")
    print("=" * 80)
    print("Token d'authentification : 'ProjectTypeStackPredictor2024!'")
    print("Utilisation :")
    print("   Header: Authorization: Bearer ProjectTypeStackPredictor2024!")
    print("   Body: {")
    print("     \"text\": \"Application mobile React Native avec API\",")
    print("     \"complexity\": \"moyen\",")
    print("     \"industry\": \"Technology\"")
    print("   }")
    print("=" * 80)
    print("EXEMPLES DE RÉPONSE :")
    print("  ✓ Type de projet: Application Mobile (confiance: 0.89)")
    print("  ✓ Stack recommandée: React Native + Node.js + PostgreSQL")
    print("  ✓ Alternatives: Flutter, Ionic")
    print("  ✓ Coût estimé: 750€/mois")
    print("  ✓ Temps setup: 3-5 jours")
    print("  ✓ Ajustements industrie: sécurité renforcée si Healthcare/Finance")
    print("=" * 80)
    print("Service prêt - En attente de requêtes...")
    
    app.run(host='0.0.0.0', port=port, debug=False)