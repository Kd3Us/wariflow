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
    """Analyseur de type de projet multilingue - AVEC TYPES SPÉCIALISÉS"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # ✅ Types spécialisés pour génération de tâches précises
        self.project_types = [
            # Types de base
            'Application Web', 'Application Mobile', 'API REST', 'SaaS',
            'E-commerce', 'CMS', 'Dashboard', 'Système',
            
            # Types spécialisés par industrie
            'Gaming Platform', 'Streaming Platform', 'Content Platform',
            'HealthTech Platform', 'MedTech System', 'Clinical Platform',
            'FinTech Platform', 'Trading System', 'Payment Gateway',
            'EdTech Platform', 'Learning Management', 'Assessment System',
            'Energy Management', 'Smart Grid System', 'IoT Platform',
            'Legal Management', 'Compliance Platform', 'Contract System',
            'Supply Chain System', 'Logistics Platform', 'Fleet Management',
            'AgTech Platform', 'Farm Management', 'Crop Monitoring',
            'PropTech Platform', 'Property Management', 'Real Estate Portal',
            'MarTech Platform', 'Campaign Management', 'Analytics Dashboard'
        ]
        
        # ✅ Mots-clés DÉTAILLÉS pour chaque type spécialisé
        self.type_keywords = {
            'french': {
                # Types de base
                'Application Web': ['site', 'web', 'portail', 'interface web', 'navigateur', 'html', 'css'],
                'Application Mobile': ['mobile', 'app', 'smartphone', 'ios', 'android', 'flutter', 'react native'],
                'API REST': ['api', 'rest', 'service', 'endpoint', 'microservice', 'json', 'graphql'],
                'SaaS': ['saas', 'plateforme', 'service', 'abonnement', 'multi-tenant', 'cloud'],
                'E-commerce': ['boutique', 'e-commerce', 'vente', 'panier', 'marketplace', 'commande'],
                'CMS': ['cms', 'contenu', 'blog', 'publication', 'éditorial', 'wordpress'],
                'Dashboard': ['dashboard', 'tableau', 'monitoring', 'kpi', 'analytics', 'métriques'],
                'Système': ['système', 'erp', 'gestion', 'enterprise', 'complexe', 'hospitalier'],
                
                # Gaming spécialisé
                'Gaming Platform': ['jeu', 'gaming', 'joueur', 'gameplay', 'multijoueur', 'esport', 'match', 'tournoi'],
                'Streaming Platform': ['streaming', 'vidéo', 'live', 'diffusion', 'broadcast', 'contenu vidéo'],
                'Content Platform': ['contenu', 'média', 'publication', 'création', 'partage', 'communauté'],
                
                # HealthTech spécialisé
                'HealthTech Platform': ['santé', 'médical', 'patient', 'télémédecine', 'diagnostic', 'thérapie', 'wellness'],
                'MedTech System': ['dispositif médical', 'équipement', 'monitoring', 'capteur', 'biométrie', 'médical'],
                'Clinical Platform': ['clinique', 'essai', 'recherche', 'protocole', 'patient', 'données cliniques'],
                
                # FinTech spécialisé
                'FinTech Platform': ['fintech', 'finance', 'paiement', 'portefeuille', 'crédit', 'investissement', 'bancaire'],
                'Trading System': ['trading', 'bourse', 'marché', 'ordre', 'portfolio', 'algorithme', 'forex'],
                'Payment Gateway': ['paiement', 'transaction', 'carte', 'wallet', 'gateway', 'pos', 'stripe'],
                
                # EdTech spécialisé
                'EdTech Platform': ['éducation', 'apprentissage', 'formation', 'cours', 'pédagogie', 'école'],
                'Learning Management': ['lms', 'e-learning', 'parcours', 'compétence', 'certification', 'moodle'],
                'Assessment System': ['évaluation', 'test', 'examen', 'notation', 'compétence', 'quiz'],
                
                # Energy spécialisé
                'Energy Management': ['énergie', 'consommation', 'efficacité', 'optimisation', 'monitoring énergétique'],
                'Smart Grid System': ['smart grid', 'réseau', 'distribution', 'compteur', 'iot énergie', 'électricité'],
                'IoT Platform': ['iot', 'capteur', 'objet connecté', 'telemetrie', 'data', 'sensor'],
                
                # Legal spécialisé
                'Legal Management': ['juridique', 'avocat', 'cabinet', 'dossier', 'procédure', 'droit'],
                'Compliance Platform': ['conformité', 'réglementation', 'audit', 'risque', 'gouvernance', 'rgpd'],
                'Contract System': ['contrat', 'accord', 'signature', 'négociation', 'clause', 'juridique'],
                
                # Supply Chain spécialisé
                'Supply Chain System': ['supply chain', 'chaîne', 'approvisionnement', 'fournisseur', 'procurement'],
                'Logistics Platform': ['logistique', 'transport', 'livraison', 'entrepôt', 'tracking', 'expedition'],
                'Fleet Management': ['flotte', 'véhicule', 'gestion parc', 'maintenance', 'géolocalisation', 'gps'],
                
                # AgTech spécialisé
                'AgTech Platform': ['agriculture', 'agtech', 'ferme', 'exploitation', 'agricole', 'farming'],
                'Farm Management': ['gestion ferme', 'parcelle', 'culture', 'élevage', 'production agricole'],
                'Crop Monitoring': ['surveillance culture', 'récolte', 'irrigation', 'pesticide', 'rendement'],
                
                # PropTech spécialisé
                'PropTech Platform': ['immobilier', 'proptech', 'propriété', 'location', 'transaction immobilière'],
                'Property Management': ['gestion immobilière', 'syndic', 'locataire', 'maintenance immobilier'],
                'Real Estate Portal': ['portail immobilier', 'annonce', 'visite', 'estimation', 'vente maison'],
                
                # MarTech spécialisé
                'MarTech Platform': ['marketing', 'martech', 'campagne', 'automation', 'lead', 'digital marketing'],
                'Campaign Management': ['gestion campagne', 'email', 'social', 'conversion', 'roi marketing'],
                'Analytics Dashboard': ['analytics', 'métriques', 'performance', 'reporting', 'kpi marketing']
            },
            'english': {
                # Types de base
                'Application Web': ['website', 'web', 'portal', 'web interface', 'browser', 'html', 'css'],
                'Application Mobile': ['mobile', 'app', 'smartphone', 'ios', 'android', 'flutter', 'react native'],
                'API REST': ['api', 'rest', 'service', 'endpoint', 'microservice', 'json', 'graphql'],
                'SaaS': ['saas', 'platform', 'service', 'subscription', 'multi-tenant', 'cloud'],
                'E-commerce': ['shop', 'e-commerce', 'sales', 'cart', 'marketplace', 'order'],
                'CMS': ['cms', 'content', 'blog', 'publishing', 'editorial', 'wordpress'],
                'Dashboard': ['dashboard', 'board', 'monitoring', 'kpi', 'analytics', 'metrics'],
                'Système': ['system', 'erp', 'management', 'enterprise', 'complex', 'hospital'],
                
                # Gaming spécialisé
                'Gaming Platform': ['game', 'gaming', 'player', 'gameplay', 'multiplayer', 'esport', 'match', 'tournament'],
                'Streaming Platform': ['streaming', 'video', 'live', 'broadcast', 'content delivery', 'twitch'],
                'Content Platform': ['content', 'media', 'publishing', 'creation', 'sharing', 'community'],
                
                # HealthTech spécialisé
                'HealthTech Platform': ['health', 'medical', 'patient', 'telemedicine', 'diagnosis', 'therapy', 'wellness'],
                'MedTech System': ['medical device', 'equipment', 'monitoring', 'sensor', 'biometric', 'medical'],
                'Clinical Platform': ['clinical', 'trial', 'research', 'protocol', 'patient data', 'clinical study'],
                
                # FinTech spécialisé
                'FinTech Platform': ['fintech', 'finance', 'payment', 'wallet', 'credit', 'investment', 'banking'],
                'Trading System': ['trading', 'exchange', 'market', 'order', 'portfolio', 'algorithm', 'forex'],
                'Payment Gateway': ['payment', 'transaction', 'card', 'wallet', 'gateway', 'pos', 'stripe'],
                
                # EdTech spécialisé
                'EdTech Platform': ['education', 'learning', 'training', 'course', 'pedagogy', 'school'],
                'Learning Management': ['lms', 'e-learning', 'curriculum', 'skill', 'certification', 'moodle'],
                'Assessment System': ['assessment', 'test', 'exam', 'grading', 'evaluation', 'quiz'],
                
                # Energy spécialisé
                'Energy Management': ['energy', 'consumption', 'efficiency', 'optimization', 'energy monitoring'],
                'Smart Grid System': ['smart grid', 'grid', 'distribution', 'meter', 'iot energy', 'electricity'],
                'IoT Platform': ['iot', 'sensor', 'connected device', 'telemetry', 'data', 'sensors'],
                
                # Legal spécialisé
                'Legal Management': ['legal', 'lawyer', 'law firm', 'case', 'procedure', 'law'],
                'Compliance Platform': ['compliance', 'regulation', 'audit', 'risk', 'governance', 'gdpr'],
                'Contract System': ['contract', 'agreement', 'signature', 'negotiation', 'clause', 'legal'],
                
                # Supply Chain spécialisé
                'Supply Chain System': ['supply chain', 'procurement', 'supplier', 'sourcing', 'supply'],
                'Logistics Platform': ['logistics', 'transport', 'delivery', 'warehouse', 'tracking', 'shipping'],
                'Fleet Management': ['fleet', 'vehicle', 'fleet management', 'maintenance', 'gps', 'fleet'],
                
                # AgTech spécialisé
                'AgTech Platform': ['agriculture', 'agtech', 'farm', 'farming', 'agricultural', 'crop'],
                'Farm Management': ['farm management', 'field', 'crop', 'livestock', 'agricultural production'],
                'Crop Monitoring': ['crop monitoring', 'harvest', 'irrigation', 'pesticide', 'yield'],
                
                # PropTech spécialisé
                'PropTech Platform': ['real estate', 'proptech', 'property', 'rental', 'real estate transaction'],
                'Property Management': ['property management', 'landlord', 'tenant', 'property maintenance'],
                'Real Estate Portal': ['real estate portal', 'listing', 'viewing', 'valuation', 'home sale'],
                
                # MarTech spécialisé
                'MarTech Platform': ['marketing', 'martech', 'campaign', 'automation', 'lead', 'digital marketing'],
                'Campaign Management': ['campaign management', 'email', 'social', 'conversion', 'marketing roi'],
                'Analytics Dashboard': ['analytics', 'metrics', 'performance', 'reporting', 'marketing kpi']
            }
        }

    def analyze_project_type_indicators(self, text: str) -> Dict[str, Any]:
        """Analyser TOUS les types y compris spécialisés"""
        
        language = self.detect_language(text)
        type_scores = {}
        keywords_lang = self.type_keywords.get(language, self.type_keywords['english'])
        
        text_lower = text.lower()
        
        # ✅ Calculer pour TOUS les types spécialisés
        for project_type in self.project_types:
            keywords = keywords_lang.get(project_type, [])
            if keywords:
                # Score basé sur les mots-clés trouvés
                matches = sum(1 for keyword in keywords if keyword in text_lower)
                base_score = matches / len(keywords) if len(keywords) > 0 else 0
                
                # Bonus si plusieurs mots-clés du même type (spécialisation)
                if matches > 1:
                    type_scores[project_type] = min(base_score * 1.3, 1.0)
                else:
                    type_scores[project_type] = min(base_score, 1.0)
            else:
                type_scores[project_type] = 0.0
        
        return {
            'type_scores': type_scores,
            'detected_technologies': self._detect_technologies(text, language),
            'language': language,
            'complexity_indicators': self._detect_complexity_indicators(text, language)
        }

    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        french_indicators = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'avec', 'pour', 'système', 'plateforme']
        english_indicators = ['the', 'a', 'an', 'with', 'for', 'system', 'application', 'platform', 'management']
        
        text_lower = text.lower()
        french_count = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_count = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        return 'french' if french_count > english_count else 'english'

    def _detect_technologies(self, text: str, language: str) -> Dict[str, List[str]]:
        """Détecter les technologies mentionnées"""
        tech_categories = {
            'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'nextjs'],
            'backend': ['node', 'python', 'java', 'php', 'django', 'flask', 'spring', 'fastapi'],
            'mobile': ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 'xamarin'],
            'database': ['mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'elasticsearch'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
            'api': ['rest', 'graphql', 'json', 'xml', 'soap', 'grpc']
        }
        
        detected = {}
        text_lower = text.lower()
        
        for category, techs in tech_categories.items():
            detected[category] = [tech for tech in techs if tech in text_lower]
        
        return detected

    def _detect_complexity_indicators(self, text: str, language: str) -> Dict[str, int]:
        """Détecter les indicateurs de complexité"""
        if language == 'french':
            indicators = {
                'simple': ['simple', 'basique', 'standard', 'minimal', 'facile'],
                'moyen': ['complet', 'avancé', 'robuste', 'professionnel', 'moderne'],
                'complexe': ['complexe', 'sophistiqué', 'enterprise', 'haute performance', 'distribué'],
                'expert': ['intelligent', 'prédictif', 'temps réel', 'scalable', 'ia', 'machine learning']
            }
        else:
            indicators = {
                'simple': ['simple', 'basic', 'standard', 'minimal', 'easy'],
                'moyen': ['complete', 'advanced', 'robust', 'professional', 'modern'],
                'complexe': ['complex', 'sophisticated', 'enterprise', 'high performance', 'distributed'],
                'expert': ['intelligent', 'predictive', 'real-time', 'scalable', 'ai', 'machine learning']
            }
        
        complexity_scores = {}
        text_lower = text.lower()
        
        for level, keywords in indicators.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            complexity_scores[level] = score
        
        return complexity_scores


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
            },
            'Gaming Platform': {
                'simple': {
                    'engine': ['Unity', 'Godot'],
                    'backend': ['Firebase', 'Node.js'],
                    'database': ['Firebase Realtime'],
                    'monetization': ['AdMob', 'Unity Ads']
                },
                'complexe': {
                    'engine': ['Unity', 'Unreal Engine'],  
                    'backend': ['Node.js', 'Java Spring'],
                    'database': ['PostgreSQL', 'Redis'],
                    'cloud': ['AWS GameLift', 'Azure PlayFab'],
                    'analytics': ['GameAnalytics', 'Unity Analytics']
                }
            },
            'Legal Management': {
                'moyen': {
                    'frontend': ['React', 'Angular'],
                    'backend': ['Java Spring Boot', '.NET Core'],
                    'database': ['PostgreSQL', 'SQL Server'],
                    'security': ['Auth0', 'KeyCloak'],
                    'integrations': ['DocuSign API', 'Calendar APIs']
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

    def predict_project_type_and_stack(self, description: str, industry: str = 'Technology', language: str = 'french'):
        """Prédire le type de projet et la stack technique - MÉTHODE MANQUANTE"""
        
        # Cache pour éviter les recalculs
        cache_key = hashlib.md5(f"{description}_{industry}_{language}".encode()).hexdigest()
        if not hasattr(self, 'prediction_cache'):
            self.prediction_cache = {}
        
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
        
        try:
            # Vérifier que le modèle est entraîné
            if not hasattr(self, 'is_trained') or not self.is_trained:
                print("Modèle non entraîné, utilisation du fallback")
                return self._fallback_project_type(description, industry)
            
            # Vérifier que les composants nécessaires existent
            if not hasattr(self, 'project_type_classifier') or self.project_type_classifier is None:
                print("Classificateur non initialisé, utilisation du fallback")
                return self._fallback_project_type(description, industry)
            
            if not hasattr(self, 'feature_extractor') or self.feature_extractor is None:
                print("Extracteur de features non initialisé, utilisation du fallback")
                return self._fallback_project_type(description, industry)
            
            # Extraire les features
            features = self.feature_extractor.extract_project_type_features(description)
            if not features or len(features) == 0:
                print("Aucune feature extraite, utilisation du fallback")
                return self._fallback_project_type(description, industry)
            
            # Convertir en array pour le modèle
            feature_values = [float(v) if v is not None else 0.0 for v in features.values()]
            X = np.array([feature_values])
            
            # Prédiction du type de projet
            prediction = self.project_type_classifier.predict(X)[0]
            prediction_proba = self.project_type_classifier.predict_proba(X)[0]
            
            # Décoder la prédiction
            if hasattr(self, 'label_encoder') and self.label_encoder is not None:
                project_type = self.label_encoder.inverse_transform([prediction])[0]
                confidence = float(np.max(prediction_proba))
            else:
                # Fallback si pas d'encoder
                project_type = self.type_analyzer.project_types[prediction] if prediction < len(self.type_analyzer.project_types) else 'Application Web'
                confidence = 0.7
            
            # Prédiction de la stack technique
            tech_stack = self._predict_tech_stack(description, project_type, industry)
            
            result = {
                'project_type': project_type,
                'tech_stack': tech_stack,
                'confidence': confidence,
                'method': 'ml_prediction',
                'industry_adjustment': industry,
                'language': language
            }
            
            # Mettre en cache
            self.prediction_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            print(f"Erreur dans predict_project_type_and_stack: {e}")
            return self._fallback_project_type(description, industry)
    
    def load_training_dataset(self) -> pd.DataFrame:
        """Dataset AVEC types spécialisés pour meilleure génération de tâches"""
        
        training_samples = [
            # === INDUSTRIES DÉJÀ PRÉSENTES (8) - Renforcées ===
            
            # Technology - Renforcé
            ("Développer une plateforme SaaS moderne", "SaaS", "Technology", "french"),
            ("API microservices avec architecture cloud", "API REST", "Technology", "french"),
            ("Site web vitrine avec blog", "Application Web", "Technology", "french"),
            ("Application mobile iOS/Android", "Application Mobile", "Technology", "french"),
            ("Build scalable web application", "Application Web", "Technology", "english"),
            ("Develop mobile app with AI features", "Application Mobile", "Technology", "english"),
            ("REST API for authentication", "API REST", "Technology", "english"),
            ("SaaS management platform", "SaaS", "Technology", "english"),
            
            # Healthcare - Renforcé
            ("Plateforme télémédecine avec IA", "HealthTech Platform", "Healthcare", "french"),
            ("Système de gestion hospitalière", "MedTech System", "Healthcare", "french"),
            ("Dispositif médical avec capteurs IoT", "MedTech System", "Healthcare", "french"),
            ("Application santé mentale travailleurs", "HealthTech Platform", "Healthcare", "french"),
            ("Clinical trial management platform", "Clinical Platform", "Healthcare", "english"),
            ("Patient monitoring IoT system", "HealthTech Platform", "Healthcare", "english"),
            ("Medical device with IoT sensors", "MedTech System", "Healthcare", "english"),
            ("Digital therapy and wellness platform", "HealthTech Platform", "Healthcare", "english"),
            
            # Finance - Renforcé
            ("Application de trading algorithmique", "Trading System", "Finance", "french"),
            ("Plateforme de paiement mobile", "Payment Gateway", "Finance", "french"),
            ("Système de crédit scoring automatisé", "FinTech Platform", "Finance", "french"),
            ("Application bancaire néobanque", "FinTech Platform", "Finance", "french"),
            ("Robo-advisor investment platform", "FinTech Platform", "Finance", "english"),
            ("Blockchain-based payment system", "Payment Gateway", "Finance", "english"),
            ("High-frequency trading system", "Trading System", "Finance", "english"),
            ("Algorithmic trading platform", "Trading System", "Finance", "english"),
            
            # Education - Renforcé
            ("Plateforme e-learning interactive", "EdTech Platform", "Education", "french"),
            ("Système de gestion d'école", "Learning Management", "Education", "french"),
            ("Plateforme d'apprentissage adaptatif", "EdTech Platform", "Education", "french"),
            ("Système LMS pour entreprise", "Learning Management", "Education", "french"),
            ("AI-powered tutoring platform", "EdTech Platform", "Education", "english"),
            ("Student assessment system", "Assessment System", "Education", "english"),
            ("Adaptive learning platform with AI", "EdTech Platform", "Education", "english"),
            ("Corporate LMS system", "Learning Management", "Education", "english"),
            
            # Retail - Renforcé
            ("Marketplace e-commerce multivendeur", "E-commerce", "Retail", "french"),
            ("Application mobile de shopping", "Application Mobile", "Retail", "french"),
            ("Boutique e-commerce avec paiement", "E-commerce", "Retail", "french"),
            ("Système de gestion inventaire", "Système", "Retail", "french"),
            ("Omnichannel retail platform", "E-commerce", "Retail", "english"),
            ("Inventory management system", "Système", "Retail", "english"),
            ("E-commerce shop with payment", "E-commerce", "Retail", "english"),
            ("Mobile shopping application", "Application Mobile", "Retail", "english"),
            
            # Media - Renforcé
            ("Plateforme de streaming vidéo", "Streaming Platform", "Media", "french"),
            ("Système de gestion de contenu", "CMS", "Media", "french"),
            ("Plateforme de streaming vidéo live", "Streaming Platform", "Media", "french"),
            ("Système de diffusion en direct", "Streaming Platform", "Media", "french"),
            ("Social media analytics platform", "Content Platform", "Media", "english"),
            ("Live streaming platform", "Streaming Platform", "Media", "english"),
            ("Live video streaming platform", "Streaming Platform", "Media", "english"),
            ("Real-time broadcast system", "Streaming Platform", "Media", "english"),
            
            # Logistics - Renforcé
            ("Système de tracking en temps réel", "Logistics Platform", "Logistics", "french"),
            ("Plateforme de gestion de flotte", "Fleet Management", "Logistics", "french"),
            ("Système de traçabilité supply chain", "Supply Chain System", "Logistics", "french"),
            ("Plateforme de gestion fournisseurs", "Supply Chain System", "Logistics", "french"),
            ("Supply chain optimization system", "Supply Chain System", "Logistics", "english"),
            ("Warehouse management platform", "Logistics Platform", "Logistics", "english"),
            ("Supply chain traceability system", "Supply Chain System", "Logistics", "english"),
            ("Supplier management platform", "Supply Chain System", "Logistics", "english"),
            
            # Energy - Renforcé
            ("Plateforme smart grid IoT", "Smart Grid System", "Energy", "french"),
            ("Système de monitoring énergétique", "Energy Management", "Energy", "french"),
            ("Système de gestion énergétique intelligent", "Energy Management", "Energy", "french"),
            ("Système smart grid avec IoT", "Smart Grid System", "Energy", "french"),
            ("Renewable energy management platform", "Energy Management", "Energy", "english"),
            ("Smart meter data analytics", "IoT Platform", "Energy", "english"),
            ("Smart energy management system", "Energy Management", "Energy", "english"),
            ("Smart grid system with IoT", "Smart Grid System", "Energy", "english"),
            
            # === NOUVELLES INDUSTRIES (23) - 8 échantillons chacune ===
            
            # 9. Consulting
            ("Plateforme de consulting digital", "Consulting Platform", "Consulting", "french"),
            ("Système de gestion projets conseil", "Project Management", "Consulting", "french"),
            ("Outil d'analyse stratégique", "Analytics Dashboard", "Consulting", "french"),
            ("Plateforme de collaboration client", "Collaboration Platform", "Consulting", "french"),
            ("Digital consulting platform", "Consulting Platform", "Consulting", "english"),
            ("Strategic analysis dashboard", "Analytics Dashboard", "Consulting", "english"),
            ("Client collaboration system", "Collaboration Platform", "Consulting", "english"),
            ("Business intelligence platform", "Analytics Dashboard", "Consulting", "english"),
            
            # 10. Legal Services
            ("Plateforme juridique en ligne", "Legal Platform", "Legal Services", "french"),
            ("Système de gestion cabinet avocat", "Legal Management", "Legal Services", "french"),
            ("Outil de rédaction de contrats", "Contract System", "Legal Services", "french"),
            ("Plateforme de conformité RGPD", "Compliance Platform", "Legal Services", "french"),
            ("Legal practice management system", "Legal Management", "Legal Services", "english"),
            ("Contract management platform", "Contract System", "Legal Services", "english"),
            ("Legal document automation", "Legal Platform", "Legal Services", "english"),
            ("Compliance monitoring system", "Compliance Platform", "Legal Services", "english"),
            
            # 11. Marketing & Advertising
            ("Plateforme marketing automation", "MarTech Platform", "Marketing & Advertising", "french"),
            ("Système de gestion campagnes", "Campaign Management", "Marketing & Advertising", "french"),
            ("Outil d'analyse de performance", "Analytics Dashboard", "Marketing & Advertising", "french"),
            ("Plateforme de création de contenu", "Content Platform", "Marketing & Advertising", "french"),
            ("Marketing automation platform", "MarTech Platform", "Marketing & Advertising", "english"),
            ("Campaign management system", "Campaign Management", "Marketing & Advertising", "english"),
            ("Social media management tool", "Content Platform", "Marketing & Advertising", "english"),
            ("Influencer marketing platform", "MarTech Platform", "Marketing & Advertising", "english"),
            
            # 12. Human Resources
            ("Plateforme RH et recrutement", "HR Platform", "Human Resources", "french"),
            ("Système de gestion des talents", "Talent Management", "Human Resources", "french"),
            ("Outil de gestion de la paie", "HR System", "Human Resources", "french"),
            ("Plateforme de formation en ligne", "Learning Management", "Human Resources", "french"),
            ("HR management platform", "HR Platform", "Human Resources", "english"),
            ("Talent acquisition system", "Talent Management", "Human Resources", "english"),
            ("Employee performance tracking", "HR System", "Human Resources", "english"),
            ("Workforce analytics dashboard", "Analytics Dashboard", "Human Resources", "english"),
            
            # 13. Real Estate
            ("Plateforme immobilière intelligente", "PropTech Platform", "Real Estate", "french"),
            ("Système de gestion locative", "Property Management", "Real Estate", "french"),
            ("Outil d'estimation immobilière IA", "Real Estate Platform", "Real Estate", "french"),
            ("Plateforme de visite virtuelle", "PropTech Platform", "Real Estate", "french"),
            ("Smart real estate platform", "PropTech Platform", "Real Estate", "english"),
            ("Property rental management", "Property Management", "Real Estate", "english"),
            ("AI property valuation system", "Real Estate Platform", "Real Estate", "english"),
            ("Real estate CRM system", "CRM", "Real Estate", "english"),
            
            # 14. Insurance
            ("Plateforme assurance digitale", "InsurTech Platform", "Insurance", "french"),
            ("Système de gestion sinistres", "Claims Management", "Insurance", "french"),
            ("Outil de souscription automatisée", "Underwriting System", "Insurance", "french"),
            ("Plateforme d'évaluation des risques", "Risk Assessment", "Insurance", "french"),
            ("Digital insurance platform", "InsurTech Platform", "Insurance", "english"),
            ("Claims management system", "Claims Management", "Insurance", "english"),
            ("Automated underwriting platform", "Underwriting System", "Insurance", "english"),
            ("Insurance policy management", "Insurance System", "Insurance", "english"),
            
            # 15. Automotive
            ("Application de gestion de flotte", "Fleet Management", "Automotive", "french"),
            ("Système de maintenance véhicules", "Vehicle System", "Automotive", "french"),
            ("Plateforme de covoiturage", "Mobility Platform", "Automotive", "french"),
            ("Outil de diagnostic automobile", "Diagnostic System", "Automotive", "french"),
            ("Connected car platform", "Automotive Platform", "Automotive", "english"),
            ("Vehicle fleet management", "Fleet Management", "Automotive", "english"),
            ("Car sharing platform", "Mobility Platform", "Automotive", "english"),
            ("Electric vehicle charging system", "Charging Platform", "Automotive", "english"),
            
            # 16. Aerospace
            ("Système de maintenance aéronautique", "Aerospace System", "Aerospace", "french"),
            ("Plateforme de gestion vol", "Flight Management", "Aerospace", "french"),
            ("Outil de planification de mission", "Mission Planning", "Aerospace", "french"),
            ("Système de contrôle satellite", "Satellite System", "Aerospace", "french"),
            ("Aircraft maintenance system", "Aerospace System", "Aerospace", "english"),
            ("Flight operations platform", "Flight Management", "Aerospace", "english"),
            ("Mission planning system", "Mission Planning", "Aerospace", "english"),
            ("Aerospace supply chain management", "Supply Chain System", "Aerospace", "english"),
            
            # 17. Construction
            ("Plateforme BTP et chantiers", "Construction Platform", "Construction", "french"),
            ("Système de gestion projet construction", "Project Management", "Construction", "french"),
            ("Outil de planification chantier", "Planning System", "Construction", "french"),
            ("Plateforme de gestion matériaux", "Materials Management", "Construction", "french"),
            ("Construction project management", "Construction Platform", "Construction", "english"),
            ("Building site management system", "Construction System", "Construction", "english"),
            ("Construction planning platform", "Planning System", "Construction", "english"),
            ("Building information modeling", "BIM Platform", "Construction", "english"),
            
            # 18. Food & Beverage
            ("Plateforme food delivery", "Food Platform", "Food & Beverage", "french"),
            ("Système de gestion restaurant", "Restaurant Management", "Food & Beverage", "french"),
            ("Outil de traçabilité alimentaire", "Traceability System", "Food & Beverage", "french"),
            ("Plateforme de réservation restaurant", "Booking Platform", "Food & Beverage", "french"),
            ("Food delivery platform", "Food Platform", "Food & Beverage", "english"),
            ("Restaurant management system", "Restaurant Management", "Food & Beverage", "english"),
            ("Food traceability platform", "Traceability System", "Food & Beverage", "english"),
            ("Kitchen operations platform", "Kitchen Management", "Food & Beverage", "english"),
            
            # 19. Textile & Fashion
            ("Plateforme mode et textile", "Fashion Platform", "Textile & Fashion", "french"),
            ("Système de gestion collection", "Fashion Management", "Textile & Fashion", "french"),
            ("Outil de design virtuel", "Design Platform", "Textile & Fashion", "french"),
            ("Plateforme de vente en ligne mode", "Fashion E-commerce", "Textile & Fashion", "french"),
            ("Fashion and textile platform", "Fashion Platform", "Textile & Fashion", "english"),
            ("Collection management system", "Fashion Management", "Textile & Fashion", "english"),
            ("Virtual fashion design tool", "Design Platform", "Textile & Fashion", "english"),
            ("Textile supply chain management", "Supply Chain System", "Textile & Fashion", "english"),
            
            # 20. Chemical
            ("Système de gestion chimique", "Chemical Management", "Chemical", "french"),
            ("Plateforme de processus industriel", "Industrial Platform", "Chemical", "french"),
            ("Outil de contrôle qualité", "Quality Control", "Chemical", "french"),
            ("Système de sécurité chimique", "Safety System", "Chemical", "french"),
            ("Chemical management system", "Chemical Management", "Chemical", "english"),
            ("Industrial process platform", "Industrial Platform", "Chemical", "english"),
            ("Chemical quality control system", "Quality Control", "Chemical", "english"),
            ("Laboratory information system", "Lab Management", "Chemical", "english"),
            
            # 21. Gaming
            ("Plateforme de jeux en ligne", "Gaming Platform", "Gaming", "french"),
            ("Système de tournois esport", "Esport Platform", "Gaming", "french"),
            ("Outil de développement de jeux", "Game Development", "Gaming", "french"),
            ("Plateforme de streaming gaming", "Gaming Streaming", "Gaming", "french"),
            ("Online gaming platform", "Gaming Platform", "Gaming", "english"),
            ("Esport tournament system", "Esport Platform", "Gaming", "english"),
            ("Game development platform", "Game Development", "Gaming", "english"),
            ("Game analytics dashboard", "Analytics Dashboard", "Gaming", "english"),
            
            # 22. Sports & Fitness
            ("Plateforme fitness connectée", "Fitness Platform", "Sports & Fitness", "french"),
            ("Système de coaching sportif", "Sports Management", "Sports & Fitness", "french"),
            ("Application de suivi performance", "Performance Tracking", "Sports & Fitness", "french"),
            ("Plateforme de réservation sport", "Sports Booking", "Sports & Fitness", "french"),
            ("Connected fitness platform", "Fitness Platform", "Sports & Fitness", "english"),
            ("Sports coaching system", "Sports Management", "Sports & Fitness", "english"),
            ("Performance tracking app", "Performance Tracking", "Sports & Fitness", "english"),
            ("Athletic performance analytics", "Analytics Dashboard", "Sports & Fitness", "english"),
            
            # 23. Travel & Tourism
            ("Plateforme de réservation voyage", "Travel Platform", "Travel & Tourism", "french"),
            ("Système de gestion hôtelière", "Hotel Management", "Travel & Tourism", "french"),
            ("Outil de planification voyage", "Trip Planning", "Travel & Tourism", "french"),
            ("Plateforme de guide touristique", "Tourism Platform", "Travel & Tourism", "french"),
            ("Travel booking platform", "Travel Platform", "Travel & Tourism", "english"),
            ("Hotel management system", "Hotel Management", "Travel & Tourism", "english"),
            ("Trip planning platform", "Trip Planning", "Travel & Tourism", "english"),
            ("Travel experience platform", "Experience Platform", "Travel & Tourism", "english"),
            
            # 24. Events & Hospitality
            ("Plateforme de gestion événements", "Event Platform", "Events & Hospitality", "french"),
            ("Système de réservation événementiel", "Event Management", "Events & Hospitality", "french"),
            ("Outil de billetterie en ligne", "Ticketing System", "Events & Hospitality", "french"),
            ("Plateforme de networking événement", "Networking Platform", "Events & Hospitality", "french"),
            ("Event management platform", "Event Platform", "Events & Hospitality", "english"),
            ("Event booking system", "Event Management", "Events & Hospitality", "english"),
            ("Online ticketing platform", "Ticketing System", "Events & Hospitality", "english"),
            ("Event networking system", "Networking Platform", "Events & Hospitality", "english"),
            
            # 25. Government
            ("Plateforme e-gouvernement", "GovTech Platform", "Government", "french"),
            ("Système administratif public", "Government System", "Government", "french"),
            ("Outil de service citoyen", "Citizen Service", "Government", "french"),
            ("Plateforme de vote électronique", "E-voting System", "Government", "french"),
            ("E-government platform", "GovTech Platform", "Government", "english"),
            ("Public administration system", "Government System", "Government", "english"),
            ("Citizen service portal", "Citizen Service", "Government", "english"),
            ("Public data management", "Data Platform", "Government", "english"),
            
            # 26. Non-profit
            ("Plateforme de dons caritatifs", "Donation Platform", "Non-profit", "french"),
            ("Système de gestion ONG", "NGO Management", "Non-profit", "french"),
            ("Outil de gestion bénévoles", "Volunteer Management", "Non-profit", "french"),
            ("Plateforme de crowdfunding social", "Crowdfunding Platform", "Non-profit", "french"),
            ("Charitable donation platform", "Donation Platform", "Non-profit", "english"),
            ("NGO management system", "NGO Management", "Non-profit", "english"),
            ("Volunteer management platform", "Volunteer Management", "Non-profit", "english"),
            ("Impact measurement platform", "Impact Platform", "Non-profit", "english"),
            
            # 27. Environmental
            ("Plateforme monitoring environnemental", "Environmental Platform", "Environmental", "french"),
            ("Système de gestion déchets", "Waste Management", "Environmental", "french"),
            ("Outil de mesure carbone", "Carbon Tracking", "Environmental", "french"),
            ("Plateforme d'énergie verte", "Green Energy Platform", "Environmental", "french"),
            ("Environmental monitoring platform", "Environmental Platform", "Environmental", "english"),
            ("Waste management system", "Waste Management", "Environmental", "english"),
            ("Carbon footprint tracker", "Carbon Tracking", "Environmental", "english"),
            ("Sustainability reporting platform", "Sustainability Platform", "Environmental", "english"),
            
            # 28. Agriculture
            ("Plateforme agriculture connectée", "AgTech Platform", "Agriculture", "french"),
            ("Système de monitoring des cultures", "Farm Management", "Agriculture", "french"),
            ("Outil de gestion d'élevage", "Livestock Management", "Agriculture", "french"),
            ("Plateforme de vente directe agricole", "Farm-to-Table Platform", "Agriculture", "french"),
            ("Smart farming platform", "AgTech Platform", "Agriculture", "english"),
            ("Crop monitoring system", "Farm Management", "Agriculture", "english"),
            ("Livestock management platform", "Livestock Management", "Agriculture", "english"),
            ("Precision agriculture system", "Precision Agriculture", "Agriculture", "english"),
            
            # 29. Biotechnology
            ("Plateforme de recherche biotech", "BioTech Platform", "Biotechnology", "french"),
            ("Système de laboratoire", "Lab Management", "Biotechnology", "french"),
            ("Outil d'analyse génétique", "Genetic Analysis", "Biotechnology", "french"),
            ("Plateforme de bioinformatique", "Bioinformatics Platform", "Biotechnology", "french"),
            ("Biotech research platform", "BioTech Platform", "Biotechnology", "english"),
            ("Laboratory management system", "Lab Management", "Biotechnology", "english"),
            ("Genetic analysis platform", "Genetic Analysis", "Biotechnology", "english"),
            ("Clinical genomics platform", "Genomics Platform", "Biotechnology", "english"),
            
            # 30. Research & Development
            ("Plateforme de recherche collaborative", "Research Platform", "Research & Development", "french"),
            ("Système de gestion R&D", "R&D Management", "Research & Development", "french"),
            ("Outil de gestion brevets", "Patent Management", "Research & Development", "french"),
            ("Plateforme d'innovation ouverte", "Innovation Platform", "Research & Development", "french"),
            ("Collaborative research platform", "Research Platform", "Research & Development", "english"),
            ("R&D management system", "R&D Management", "Research & Development", "english"),
            ("Patent management platform", "Patent Management", "Research & Development", "english"),
            ("Research data management", "Data Platform", "Research & Development", "english"),
            
            # 31. Pharmaceutical
            ("Système de recherche pharmaceutique", "Pharma Research", "Pharmaceutical", "french"),
            ("Plateforme essais cliniques", "Clinical Platform", "Pharmaceutical", "french"),
            ("Outil de développement médicament", "Drug Development", "Pharmaceutical", "french"),
            ("Système de pharmacovigilance", "Pharmacovigilance System", "Pharmaceutical", "french"),
            ("Drug research platform", "Pharma Research", "Pharmaceutical", "english"),
            ("Clinical trial platform", "Clinical Platform", "Pharmaceutical", "english"),
            ("Drug development system", "Drug Development", "Pharmaceutical", "english"),
            ("Regulatory compliance system", "Regulatory Platform", "Pharmaceutical", "english"),
        ]
        
        df = pd.DataFrame(training_samples, columns=['description', 'project_type', 'industry', 'language'])
        
        print(f"Dataset d'entraînement créé : {len(df)} échantillons pour {df['project_type'].nunique()} types de projets")
        print(f"✅ Types spécialisés inclus: {len([t for t in df['project_type'].unique() if 'Platform' in t or 'System' in t or 'Management' in t])}")
        print(f"✅ Répartition types: {dict(list(df['project_type'].value_counts().items())[:10])}")
        
        return df
    
    def train_model(self):
        """Entraîner le modèle de classification - VERSION CORRIGÉE"""
        if self.is_trained:
            return
        
        try:
            print("Entraînement du classificateur de type de projet...")
            
            # Charger les données avec validation
            df = self.load_training_dataset()
            
            if df.empty or len(df) == 0:
                raise ValueError("Dataset d'entraînement vide")
            
            # ✅ FIX: Extraction des features correcte
            print("Extraction des features...")
            feature_matrix = []
            valid_samples = []
            
            for idx, row in df.iterrows():
                try:
                    # ✅ FIX: Utiliser la bonne méthode d'extraction
                    features = self.feature_extractor.extract_project_type_features(row['description'])
                    
                    if features and isinstance(features, dict) and len(features) > 0:
                        # ✅ FIX: Convertir les features en liste de valeurs numériques
                        feature_values = []
                        for key, value in features.items():
                            if isinstance(value, (int, float)):
                                feature_values.append(float(value))
                            elif isinstance(value, bool):
                                feature_values.append(1.0 if value else 0.0)
                            else:
                                feature_values.append(0.0)
                        
                        if len(feature_values) > 0:
                            feature_matrix.append(feature_values)
                            valid_samples.append(row)
                            
                except Exception as e:
                    print(f"Erreur extraction features échantillon {idx}: {e}")
                    continue
            
            if len(feature_matrix) == 0:
                raise ValueError("Aucune feature valide extraite")
            
            # ✅ FIX: Continuer avec l'entraînement
            X = np.array(feature_matrix)
            valid_df = pd.DataFrame(valid_samples)
            
            # ✅ FIX: Encoder les labels correctement
            if not hasattr(self, 'label_encoder'):
                self.label_encoder = LabelEncoder()
            
            y = self.label_encoder.fit_transform(valid_df['project_type'])
            
            print(f"Entraînement sur {len(X)} échantillons valides pour {len(np.unique(y))} types")
            
            # ✅ FIX: Entraîner le modèle avec gestion des erreurs
            try:
                self.project_type_classifier = VotingClassifier([
                    ('rf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')),
                    ('svm', SVC(probability=True, random_state=42, class_weight='balanced', kernel='rbf')),
                    ('nb', MultinomialNB(alpha=0.1))
                ], voting='soft')
                
                self.project_type_classifier.fit(X, y)
                
            except Exception as e:
                print(f"Erreur d'entraînement VotingClassifier: {e}")
                # ✅ FALLBACK: Utiliser un modèle plus simple
                print("Utilisation d'un modèle RandomForest simple comme fallback...")
                self.project_type_classifier = RandomForestClassifier(
                    n_estimators=100, 
                    random_state=42, 
                    class_weight='balanced'
                )
                self.project_type_classifier.fit(X, y)
            
            # Évaluation
            self._evaluate_model(X, y, valid_df['project_type'])
            
            self.is_trained = True
            print("Classificateur de type de projet entraîné avec succès!")
            
        except Exception as e:
            print(f"ERREUR lors de l'entraînement du module project_type: {e}")
            # ✅ FIX: Créer un modèle fallback robuste
            self._create_fallback_model()

    
    def _evaluate_model(self, X, y, project_types):
        """Évaluer les performances du modèle - VERSION CORRIGÉE"""
        try:
            unique_classes = len(np.unique(y))
            total_samples = len(X)
            
            if total_samples < unique_classes * 2:
                print(f"Dataset trop petit ({total_samples} échantillons, {unique_classes} classes)")
                print("Évaluation sur l'ensemble complet sans split...")
                
                # Évaluation sur tout le dataset
                predictions = self.project_type_classifier.predict(X)
                accuracy = accuracy_score(y, predictions)
                
                print(f"Précision du modèle de type de projet : {accuracy:.3f}")
                
                # ✅ CORRECTION: Définir les variables pour l'affichage
                from collections import Counter
                predicted_types = self.label_encoder.inverse_transform(predictions)
                actual_types = self.label_encoder.inverse_transform(y)
                
                print(f"Distribution prédite : {Counter(predicted_types)}")
                print(f"Distribution réelle : {Counter(actual_types)}")
                
            else:
                # Calcul intelligent du test_size
                min_samples_per_class = 2
                min_test_samples_needed = unique_classes * min_samples_per_class
                
                if total_samples < min_test_samples_needed:
                    print(f"⚠️ Pas assez d'échantillons pour split stratifié ({total_samples} < {min_test_samples_needed})")
                    print("Évaluation sur l'ensemble complet...")
                    
                    predictions = self.project_type_classifier.predict(X)
                    accuracy = accuracy_score(y, predictions)
                    print(f"Précision du modèle de type de projet : {accuracy:.3f}")
                    
                    from collections import Counter
                    predicted_types = self.label_encoder.inverse_transform(predictions)
                    actual_types = self.label_encoder.inverse_transform(y) 
                    
                    print(f"Distribution prédite : {Counter(predicted_types)}")
                    print(f"Distribution réelle : {Counter(actual_types)}")
                    
                else:
                    min_test_per_class = 3
                    ideal_test_size = (unique_classes * min_test_per_class) / total_samples
                    
                    test_size = min(0.3, max(0.15, ideal_test_size))
                    
                    actual_test_samples = int(total_samples * test_size)
                    if actual_test_samples < min_test_samples_needed:
                        test_size = min_test_samples_needed / total_samples
                        
                    print(f"✅ Test size calculé: {test_size:.3f} ({int(total_samples * test_size)} échantillons)")
                    
                    X_train, X_test, y_train, y_test = train_test_split(
                        X, y, test_size=test_size, random_state=42  
                    )
                    
                    predictions = self.project_type_classifier.predict(X_test)
                    accuracy = accuracy_score(y_test, predictions)
                    print(f"Précision du modèle de type de projet : {accuracy:.3f}")
                    
                    from collections import Counter
                    predicted_types = self.label_encoder.inverse_transform(predictions)
                    actual_types = self.label_encoder.inverse_transform(y_test)
                    
                    print(f"Distribution prédite : {Counter(predicted_types)}")
                    print(f"Distribution réelle : {Counter(actual_types)}")
                    
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
            print("Évaluation ignorée, modèle entraîné avec succès")
    
    def predict_project_type_and_stack(self, description: str, industry: str = 'Technology'):
        """Prédire le type de projet et la stack technique - SANS paramètre language problématique"""
        
        # Cache pour éviter les recalculs
        cache_key = hashlib.md5(f"{description}_{industry}".encode()).hexdigest()
        if not hasattr(self, 'prediction_cache'):
            self.prediction_cache = {}
        
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
        
        try:
            # Vérifier que le modèle est entraîné
            if not hasattr(self, 'is_trained') or not self.is_trained:
                print("Modèle non entraîné, utilisation du fallback")
                return self._fallback_project_type_prediction_full(description, industry)
            
            # Vérifier que les composants nécessaires existent
            if not hasattr(self, 'project_type_classifier') or self.project_type_classifier is None:
                print("Classificateur non initialisé, utilisation du fallback")
                return self._fallback_project_type_prediction_full(description, industry)
            
            if not hasattr(self, 'feature_extractor') or self.feature_extractor is None:
                print("Extracteur de features non initialisé, utilisation du fallback")
                return self._fallback_project_type_prediction_full(description, industry)
            
            # Extraire les features
            features = self.feature_extractor.extract_project_type_features(description)
            if not features or len(features) == 0:
                print("Aucune feature extraite, utilisation du fallback")
                return self._fallback_project_type_prediction_full(description, industry)
            
            # Convertir en array pour le modèle
            feature_values = []
            for key, value in features.items():
                if isinstance(value, (int, float)):
                    feature_values.append(float(value))
                elif isinstance(value, bool):
                    feature_values.append(1.0 if value else 0.0)
                else:
                    feature_values.append(0.0)
            
            if len(feature_values) == 0:
                print("Aucune feature numérique extraite, utilisation du fallback")
                return self._fallback_project_type_prediction_full(description, industry)
            
            X = np.array([feature_values])
            
            # Prédiction du type de projet
            prediction = self.project_type_classifier.predict(X)[0]
            prediction_proba = self.project_type_classifier.predict_proba(X)[0]
            
            # Décoder la prédiction
            if hasattr(self, 'label_encoder') and self.label_encoder is not None:
                project_type = self.label_encoder.inverse_transform([prediction])[0]
                confidence = float(np.max(prediction_proba))
            else:
                project_type = self._fallback_project_type_prediction(description, industry)
                confidence = 0.5
            
            # Prédiction de la stack technique
            tech_stack = self._predict_tech_stack(description, project_type, industry)
            
            result = {
                'predicted_type': project_type,
                'tech_stack': tech_stack,
                'confidence': confidence,
                'method': 'ml_prediction',
                'industry_adjustment': industry
            }
            
            # Mettre en cache
            self.prediction_cache[cache_key] = result
            
            return result
            
        except Exception as e:
            print(f"Erreur dans predict_project_type_and_stack: {e}")
            return self._fallback_project_type_prediction_full(description, industry)


    def _fallback_project_type(self, description: str, industry: str = 'Technology'):
        """Prédiction de fallback améliorée basée sur mots-clés"""
        desc_lower = description.lower()
        
        # Classification par mots-clés avec plus de précision
        web_keywords = ['web', 'site', 'frontend', 'react', 'vue', 'angular', 'html', 'css', 'javascript']
        mobile_keywords = ['mobile', 'app', 'android', 'ios', 'flutter', 'react native', 'native']
        api_keywords = ['api', 'microservice', 'backend', 'rest', 'graphql', 'service', 'endpoint']
        desktop_keywords = ['desktop', 'electron', 'native', 'windows', 'mac', 'linux']
        ecommerce_keywords = ['boutique', 'shop', 'ecommerce', 'e-commerce', 'vente', 'commande', 'panier']
        saas_keywords = ['saas', 'plateforme', 'platform', 'service', 'abonnement', 'subscription']
        
        if any(word in desc_lower for word in ecommerce_keywords):
            project_type = 'E-commerce'
            stack = ['React', 'Node.js', 'PostgreSQL', 'Stripe']
        elif any(word in desc_lower for word in saas_keywords):
            project_type = 'SaaS'
            stack = ['React', 'Node.js', 'PostgreSQL', 'Redis']
        elif any(word in desc_lower for word in mobile_keywords):
            project_type = 'Application Mobile'
            stack = ['React Native', 'Node.js', 'MongoDB']
        elif any(word in desc_lower for word in api_keywords):
            project_type = 'API REST'
            stack = ['Node.js', 'Express', 'PostgreSQL']
        elif any(word in desc_lower for word in desktop_keywords):
            project_type = 'Application Desktop'
            stack = ['Electron', 'Node.js', 'SQLite']
        elif any(word in desc_lower for word in web_keywords):
            project_type = 'Application Web'
            stack = ['React', 'Node.js', 'PostgreSQL']
        else:
            # Fallback par défaut
            project_type = 'Application Web'
            stack = ['React', 'Node.js', 'PostgreSQL']
        
        # Ajustements par industrie
        if industry == 'Healthcare':
            stack.extend(['HIPAA Compliance', 'Encryption'])
        elif industry == 'Finance':
            stack.extend(['JWT', 'Audit Logs', 'Encryption'])
        elif industry == 'Education':
            stack.extend(['LMS Integration', 'Video Streaming'])
        
        return {
            'project_type': project_type,
            'tech_stack': stack,
            'confidence': 0.6,  # Confiance plus faible pour le fallback
            'method': 'keyword_fallback',
            'industry_adjustment': industry
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
    
    def predict_project_type_and_stack(self, description: str, industry: str = 'Technology'):
        """Prédire le type de projet et la stack technique - VERSION CORRIGÉE"""
        
        try:
            if not self.is_trained:
                self.train_model()
            
            # Si le modèle principal est disponible
            if hasattr(self, 'project_type_classifier') and self.project_type_classifier is not None:
                try:
                    # Extraire les features
                    features = self.feature_extractor.extract_project_type_features(description)
                    feature_values = []
                    
                    for key, value in features.items():
                        if isinstance(value, (int, float)):
                            feature_values.append(float(value))
                        elif isinstance(value, bool):
                            feature_values.append(1.0 if value else 0.0)
                        else:
                            feature_values.append(0.0)
                    
                    X = np.array([feature_values])
                    prediction = self.project_type_classifier.predict(X)[0]
                    confidence = max(self.project_type_classifier.predict_proba(X)[0])
                    
                    project_type = self.label_encoder.inverse_transform([prediction])[0]
                    
                except Exception as e:
                    print(f"Erreur prédiction ML: {e}")
                    project_type = self._fallback_project_type_prediction(description, industry)
                    confidence = 0.5
            else:
                # Utiliser la méthode fallback
                project_type = self._fallback_project_type_prediction(description, industry)
                confidence = 0.5
            
            # Prédiction de la stack technique
            tech_stack = self._predict_tech_stack(description, project_type, industry)
            
            return {
                'predicted_type': project_type,
                'tech_stack': tech_stack,
                'confidence': confidence,
                'method': 'ml_prediction' if hasattr(self, 'is_fallback') and not self.is_fallback else 'fallback',
                'industry_adjustment': industry
            }
            
        except Exception as e:
            print(f"Erreur dans predict_project_type_and_stack: {e}")
            return self._fallback_project_type_prediction_full(description, industry)

    def _fallback_project_type(self, description: str, industry: str):
        """Prédiction de fallback basée sur mots-clés"""
        desc_lower = description.lower()
        
        # Classification par mots-clés
        if any(word in desc_lower for word in ['web', 'site', 'frontend', 'react', 'vue']):
            project_type = 'Application Web'
            stack = ['React', 'Node.js', 'PostgreSQL']
        elif any(word in desc_lower for word in ['mobile', 'app', 'android', 'ios', 'flutter']):
            project_type = 'Application Mobile'
            stack = ['React Native', 'Node.js', 'MongoDB']
        elif any(word in desc_lower for word in ['api', 'microservice', 'backend', 'rest']):
            project_type = 'API/Backend'
            stack = ['Node.js', 'Express', 'PostgreSQL']
        elif any(word in desc_lower for word in ['desktop', 'electron', 'native']):
            project_type = 'Application Desktop'
            stack = ['Electron', 'Node.js', 'SQLite']
        else:
            project_type = 'Application Web'
            stack = ['React', 'Node.js', 'PostgreSQL']
        
        return {
            'project_type': project_type,
            'tech_stack': stack,
            'confidence': 0.6,
            'method': 'keyword_fallback'
        }

    def _predict_tech_stack(self, description: str, project_type: str, industry: str):
        """Prédire la stack technique recommandée"""
        
        # Stacks par type de projet et industrie
        stacks = {
            'Application Web': {
                'Healthcare': ['React', 'Node.js', 'PostgreSQL', 'Redis'],
                'Finance': ['React', 'Node.js', 'PostgreSQL', 'Redis', 'JWT'],
                'default': ['React', 'Node.js', 'PostgreSQL']
            },
            'Application Mobile': {
                'Healthcare': ['React Native', 'Node.js', 'PostgreSQL'],
                'Finance': ['Flutter', 'Node.js', 'PostgreSQL', 'Firebase'],
                'default': ['React Native', 'Node.js', 'MongoDB']
            },
            'API/Backend': {
                'Finance': ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'JWT'],
                'Healthcare': ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
                'default': ['Node.js', 'Express', 'MongoDB']
            }
        }
        
        return stacks.get(project_type, {}).get(industry, stacks.get(project_type, {}).get('default', ['Node.js']))
    
    def _create_fallback_model(self):
        """Créer un modèle fallback robuste"""
        print("Création d'un modèle fallback pour project_type...")
        
        # Créer un classificateur minimal
        self.project_type_classifier = None
        self.label_encoder = LabelEncoder()
        
        # Types de projets par défaut
        default_types = ['Application Web', 'Application Mobile', 'API REST', 'SaaS', 'E-commerce', 'CMS', 'Dashboard', 'Système']
        self.label_encoder.fit(default_types)
        
        # Marquer comme "entraîné" avec fallback
        self.is_trained = True
        self.is_fallback = True
        
        print("Modèle fallback project_type créé")

    def _fallback_project_type_prediction(self, description: str, industry: str) -> str:
        """Prédiction fallback basée sur des mots-clés spécialisés"""
        description_lower = description.lower()
        
        # ✅ Priorité aux types spécialisés selon l'industrie
        if industry == 'Gaming':
            if any(word in description_lower for word in ['jeu', 'game', 'gaming', 'joueur', 'player', 'esport']):
                return 'Gaming Platform'
            elif any(word in description_lower for word in ['streaming', 'live', 'vidéo', 'broadcast']):
                return 'Streaming Platform'
        
        elif industry == 'Healthcare':
            if any(word in description_lower for word in ['télémédecine', 'telemedicine', 'patient', 'médical', 'medical']):
                return 'HealthTech Platform'
            elif any(word in description_lower for word in ['dispositif', 'device', 'capteur', 'sensor', 'monitoring']):
                return 'MedTech System'
        
        elif industry == 'Finance':
            if any(word in description_lower for word in ['fintech', 'paiement', 'payment', 'wallet', 'crédit']):
                return 'FinTech Platform'
            elif any(word in description_lower for word in ['trading', 'bourse', 'exchange', 'marché']):
                return 'Trading System'
        
        elif industry == 'Education':
            if any(word in description_lower for word in ['éducation', 'education', 'apprentissage', 'learning']):
                return 'EdTech Platform'
            elif any(word in description_lower for word in ['lms', 'formation', 'training', 'cours']):
                return 'Learning Management'
        
        elif industry == 'Energy':
            if any(word in description_lower for word in ['énergie', 'energy', 'smart grid', 'énergétique']):
                return 'Energy Management'
            elif any(word in description_lower for word in ['iot', 'capteur', 'sensor', 'connecté']):
                return 'IoT Platform'
        
        elif industry == 'Logistics':
            if any(word in description_lower for word in ['supply chain', 'chaîne', 'fournisseur']):
                return 'Supply Chain System'
            elif any(word in description_lower for word in ['logistique', 'logistics', 'transport', 'livraison']):
                return 'Logistics Platform'
        
        elif industry == 'Real Estate':
            if any(word in description_lower for word in ['immobilier', 'real estate', 'proptech', 'propriété']):
                return 'PropTech Platform'
        
        elif industry == 'Marketing & Advertising':
            if any(word in description_lower for word in ['marketing', 'martech', 'campagne', 'campaign']):
                return 'MarTech Platform'
        
        elif industry == 'Legal Services':
            if any(word in description_lower for word in ['conformité', 'compliance', 'réglementation']):
                return 'Compliance Platform'
            elif any(word in description_lower for word in ['contrat', 'contract', 'juridique', 'legal']):
                return 'Legal Management'
        
        # ✅ Fallback sur les types de base
        if any(word in description_lower for word in ['mobile', 'ios', 'android', 'app']):
            return 'Application Mobile'
        elif any(word in description_lower for word in ['api', 'rest', 'microservice', 'service']):
            return 'API REST'
        elif any(word in description_lower for word in ['saas', 'plateforme', 'platform', 'subscription']):
            return 'SaaS'
        elif any(word in description_lower for word in ['e-commerce', 'boutique', 'shop', 'marketplace']):
            return 'E-commerce'
        elif any(word in description_lower for word in ['cms', 'contenu', 'content', 'blog']):
            return 'CMS'
        elif any(word in description_lower for word in ['dashboard', 'tableau', 'monitoring', 'analytics']):
            return 'Dashboard'
        elif any(word in description_lower for word in ['système', 'system', 'erp', 'gestion']):
            return 'Système'
        else:
            return 'Application Web'
        
    def _fallback_project_type_prediction_full(self, description: str, industry: str) -> dict:
        """Prédiction fallback complète avec stack technique"""
        project_type = self._fallback_project_type_prediction(description, industry)
        tech_stack = self._predict_tech_stack(description, project_type, industry)
        
        return {
            'predicted_type': project_type,
            'tech_stack': tech_stack,
            'confidence': 0.6,
            'method': 'fallback_specialized',
            'industry_adjustment': industry
        }


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