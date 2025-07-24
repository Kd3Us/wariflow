# complexity_duration_predictor.py - Module isolé pour prédiction de complexité et durée
# Prédiction ML de complexité (simple/moyen/complexe/expert) et estimation de durée en jours ouvrables
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

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, mean_squared_error
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


class ComplexityIndicatorAnalyzer:
    """Analyseur d'indicateurs de complexité multilingue"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # Indicateurs de complexité par langue
        self.complexity_indicators = {
            'french': {
                'simple': [
                    'basique', 'simple', 'facile', 'léger', 'minimal', 'standard',
                    'crud', 'formulaire', 'page', 'statique', 'prototype'
                ],
                'moyen': [
                    'moyen', 'standard', 'classique', 'typique', 'habituel',
                    'api', 'base données', 'authentification', 'interface', 'responsive'
                ],
                'complexe': [
                    'complexe', 'avancé', 'sophistiqué', 'élaboré', 'approfondi',
                    'microservices', 'architecture', 'intégration', 'sécurité', 'performance',
                    'scalable', 'temps réel', 'machine learning', 'ai', 'blockchain'
                ],
                'expert': [
                    'expert', 'haute performance', 'critique', 'mission critique',
                    'haute disponibilité', 'distribué', 'kubernetes', 'serverless',
                    'intelligence artificielle', 'deep learning', 'big data',
                    'architecture distribuée', 'microservices avancés'
                ]
            },
            'english': {
                'simple': [
                    'basic', 'simple', 'easy', 'light', 'minimal', 'standard',
                    'crud', 'form', 'page', 'static', 'prototype'
                ],
                'moyen': [
                    'medium', 'standard', 'classic', 'typical', 'usual',
                    'api', 'database', 'authentication', 'interface', 'responsive'
                ],
                'complexe': [
                    'complex', 'advanced', 'sophisticated', 'elaborate', 'thorough',
                    'microservices', 'architecture', 'integration', 'security', 'performance',
                    'scalable', 'real time', 'machine learning', 'ai', 'blockchain'
                ],
                'expert': [
                    'expert', 'high performance', 'critical', 'mission critical',
                    'high availability', 'distributed', 'kubernetes', 'serverless',
                    'artificial intelligence', 'deep learning', 'big data',
                    'distributed architecture', 'advanced microservices'
                ]
            }
        }
        
        # Patterns techniques par niveau
        self.technical_patterns = {
            'simple': {
                'french': ['html', 'css', 'javascript', 'php', 'mysql', 'wordpress'],
                'english': ['html', 'css', 'javascript', 'php', 'mysql', 'wordpress']
            },
            'moyen': {
                'french': ['react', 'vue', 'angular', 'node', 'express', 'mongodb', 'postgresql'],
                'english': ['react', 'vue', 'angular', 'node', 'express', 'mongodb', 'postgresql']
            },
            'complexe': {
                'french': ['microservices', 'docker', 'redis', 'elasticsearch', 'aws', 'azure'],
                'english': ['microservices', 'docker', 'redis', 'elasticsearch', 'aws', 'azure']
            },
            'expert': {
                'french': ['kubernetes', 'tensorflow', 'pytorch', 'kafka', 'spark', 'hadoop'],
                'english': ['kubernetes', 'tensorflow', 'pytorch', 'kafka', 'spark', 'hadoop']
            }
        }
        
        # Domaines avec complexité inhérente
        self.domain_complexity = {
            'Healthcare': 'complexe',      # Réglementations strictes
            'Finance': 'complexe',         # Sécurité critique
            'Technology': 'moyen',         # Variable selon le projet
            'Education': 'moyen',          # Généralement standard
            'Retail': 'moyen',             # E-commerce classique
            'Media': 'moyen',              # Streaming/contenu
            'Logistics': 'complexe',       # Optimisation complexe
            'Energy': 'expert',            # IoT industriel complexe
            
            'Consulting': 'moyen',         # Processus métier standard
            'Legal Services': 'complexe',  # Conformité juridique
            'Marketing & Advertising': 'simple',  # Campagnes rapides
            'Human Resources': 'moyen',    # Réglementation RH
            'Real Estate': 'moyen',        # Processus établis
            'Insurance': 'complexe',       # Réglementation stricte
            
            'Automotive': 'complexe',      # Normes sécurité
            'Aerospace': 'expert',         # Certifications critiques
            'Construction': 'moyen',       # BIM et planification
            'Food & Beverage': 'moyen',    # Traçabilité HACCP
            'Textile & Fashion': 'moyen',  # Design et production
            'Chemical': 'complexe',        # REACH et sécurité
            
            'Gaming': 'moyen',             # Développement agile
            'Sports & Fitness': 'simple',  # Applications simples
            'Travel & Tourism': 'moyen',   # Booking et réservations
            'Events & Hospitality': 'moyen',  # Gestion événements
            
            'Government': 'complexe',      # Procédures strictes
            'Non-profit': 'simple',       # Ressources limitées
            'Environmental': 'moyen',      # Monitoring standard
            'Agriculture': 'moyen',        # IoT agricole
            
            'Biotechnology': 'complexe',   # Validation scientifique
            'Research & Development': 'complexe',  # Méthodologie recherche
            'Pharmaceutical': 'expert'     # FDA et essais cliniques
        }
    
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour', 'dans', 'sur',
            'développer', 'créer', 'implémenter', 'système', 'application', 'plateforme',
            'sécurité', 'performance', 'données', 'utilisateur'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or', 'of', 'to',
            'develop', 'create', 'implement', 'system', 'application', 'platform',
            'security', 'performance', 'data', 'user'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            # Vérifier les caractères accentués
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'
    
    def analyze_complexity_indicators(self, text: str, industry: str = None) -> Dict[str, Any]:
        """Analyser les indicateurs de complexité dans le texte"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        # Scores par niveau de complexité
        complexity_scores = {}
        
        for level in ['simple', 'moyen', 'complexe', 'expert']:
            keywords = self.complexity_indicators[language][level]
            tech_patterns = self.technical_patterns[level][language]
            
            keyword_count = sum(1 for keyword in keywords if keyword in text_lower)
            tech_count = sum(1 for tech in tech_patterns if tech in text_lower)
            
            complexity_scores[level] = {
                'keyword_count': keyword_count,
                'tech_count': tech_count,
                'total_score': keyword_count + tech_count * 1.5  # Tech patterns ont plus de poids
            }
        
        # Ajustement selon l'industrie
        if industry and industry in self.domain_complexity:
            industry_complexity = self.domain_complexity[industry]
            complexity_scores[industry_complexity]['total_score'] += 2
        
        return {
            'language': language,
            'complexity_scores': complexity_scores,
            'industry_boost': industry if industry else None
        }


class ComplexityFeatureExtractor:
    """Extracteur de features spécialisé pour la complexité"""
    
    def __init__(self):
        self.complexity_analyzer = ComplexityIndicatorAnalyzer()
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=300,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.8
        )
    
    def extract_complexity_features(self, text: str, industry: str = None) -> Dict[str, float]:
        """Extraire les features de complexité"""
        language = self.complexity_analyzer.detect_language(text)
        complexity_analysis = self.complexity_analyzer.analyze_complexity_indicators(text, industry)
        
        features = {}
        
        # 1. Scores de complexité par niveau
        for level, scores in complexity_analysis['complexity_scores'].items():
            features[f'{level}_keyword_score'] = scores['keyword_count']
            features[f'{level}_tech_score'] = scores['tech_count']
            features[f'{level}_total_score'] = scores['total_score']
        
        # 2. Features textuelles
        words = text.split()
        features['text_length'] = len(text)
        features['word_count'] = len(words)
        features['avg_word_length'] = np.mean([len(word) for word in words]) if words else 0
        features['sentence_count'] = len(sent_tokenize(text))
        
        # 3. Features linguistiques
        try:
            tokens = word_tokenize(text)
            pos_tags = pos_tag(tokens)
            
            noun_count = sum(1 for _, tag in pos_tags if tag.startswith('NN'))
            verb_count = sum(1 for _, tag in pos_tags if tag.startswith('VB'))
            adj_count = sum(1 for _, tag in pos_tags if tag.startswith('JJ'))
            
            features['noun_density'] = noun_count / len(tokens) if tokens else 0
            features['verb_density'] = verb_count / len(tokens) if tokens else 0
            features['adj_density'] = adj_count / len(tokens) if tokens else 0
        except:
            features['noun_density'] = 0
            features['verb_density'] = 0
            features['adj_density'] = 0
        
        # 4. Features de domaine technique
        features['tech_sophistication'] = self._calculate_tech_sophistication(text, language)
        features['integration_complexity'] = self._calculate_integration_complexity(text, language)
        features['security_complexity'] = self._calculate_security_complexity(text, language)
        features['performance_complexity'] = self._calculate_performance_complexity(text, language)
        
        # 5. Features d'industrie
        if industry:
            features['industry_complexity_boost'] = self._get_industry_boost(industry)
        else:
            features['industry_complexity_boost'] = 0
        
        # 6. NOUVEAUX PATTERNS DE COMPLEXITÉ SPÉCIALISÉS
        specialized_complexity_indicators = {
            'regulatory_high': {
                'keywords': ['hipaa', 'pci-dss', 'gdpr', 'fda', 'sox', 'iso 27001', 'reach', 'gxp'],
                'weight': 0.8
            },
            'regulatory_medium': {
                'keywords': ['compliance', 'audit', 'réglementation', 'conformité', 'certification'],
                'weight': 0.4
            },
            'real_time_processing': {
                'keywords': ['temps réel', 'real-time', 'streaming', 'live', 'instantané', 'time-critical'],
                'weight': 0.6
            },
            'ai_ml_integration': {
                'keywords': ['intelligence artificielle', 'machine learning', 'ai', 'neural', 'prédictif', 
                           'deep learning', 'computer vision', 'nlp'],
                'weight': 0.7
            },
            'high_security': {
                'keywords': ['sécurité critique', 'chiffrement', 'blockchain', 'zero-trust', 
                           'authentification forte', 'biométrie'],
                'weight': 0.6
            },
            'distributed_systems': {
                'keywords': ['microservices', 'distribuée', 'cluster', 'scalabilité', 'load balancing', 
                           'haute disponibilité'],
                'weight': 0.5
            },
            'iot_integration': {
                'keywords': ['iot', 'capteur', 'sensor', 'connected', 'telemetry', 'monitoring'],
                'weight': 0.4
            },
            'big_data': {
                'keywords': ['big data', 'data lake', 'analytics', 'data warehouse', 'business intelligence'],
                'weight': 0.5
            }
        }
        
        # Calculer le score de complexité spécialisée
        text_lower = text.lower()
        specialized_complexity_score = 0.0
        
        for category, config in specialized_complexity_indicators.items():
            keyword_matches = sum(1 for keyword in config['keywords'] if keyword in text_lower)
            if keyword_matches > 0:
                category_score = min(keyword_matches * config['weight'], config['weight'])
                specialized_complexity_score += category_score
                features[f'has_{category}'] = True
                features[f'{category}_matches'] = keyword_matches
            else:
                features[f'has_{category}'] = False
                features[f'{category}_matches'] = 0
        
        features['specialized_complexity_score'] = min(specialized_complexity_score, 3.0)
        
        # 7. Impact des nouvelles industries sur la complexité
        industry_complexity_indicators = {
            'Healthcare': ['patient', 'médical', 'clinical', 'healthcare', 'health'],
            'Finance': ['paiement', 'transaction', 'trading', 'banking', 'financial'],
            'Pharmaceutical': ['drug', 'médicament', 'clinical trial', 'essai clinique', 'pharma'],
            'Aerospace': ['flight', 'aviation', 'satellite', 'aerospace', 'aircraft'],
            'Gaming': ['game', 'player', 'gameplay', 'matchmaking', 'gaming'],
            'Legal Services': ['legal', 'juridique', 'contract', 'law', 'avocat'],
            'Automotive': ['vehicle', 'véhicule', 'automotive', 'car', 'automobile']
        }
        
        industry_context_score = 0.0
        for industry_name, keywords in industry_complexity_indicators.items():
            industry_matches = sum(1 for keyword in keywords if keyword in text_lower)
            if industry_matches >= 2:
                features[f'industry_context_{industry_name.lower()}'] = True
                industry_context_score += 0.2
            else:
                features[f'industry_context_{industry_name.lower()}'] = False
        
        features['industry_context_score'] = min(industry_context_score, 1.0)
        
        return features
    
    def _calculate_tech_sophistication(self, text: str, language: str) -> float:
        """Calculer le niveau de sophistication technique"""
        if language == 'french':
            advanced_terms = [
                'intelligence artificielle', 'machine learning', 'deep learning',
                'microservices', 'architecture distribuée', 'kubernetes', 'serverless',
                'blockchain', 'big data', 'temps réel', 'haute performance'
            ]
        else:
            advanced_terms = [
                'artificial intelligence', 'machine learning', 'deep learning',
                'microservices', 'distributed architecture', 'kubernetes', 'serverless',
                'blockchain', 'big data', 'real time', 'high performance'
            ]
        
        text_lower = text.lower()
        sophistication = sum(1 for term in advanced_terms if term in text_lower)
        return min(sophistication / 5, 1.0)
    
    def _calculate_integration_complexity(self, text: str, language: str) -> float:
        """Calculer la complexité d'intégration"""
        if language == 'french':
            integration_terms = [
                'intégration', 'api', 'service externe', 'webhook', 'synchronisation',
                'middleware', 'connecteur', 'passerelle', 'interface'
            ]
        else:
            integration_terms = [
                'integration', 'api', 'external service', 'webhook', 'synchronization',
                'middleware', 'connector', 'gateway', 'interface'
            ]
        
        text_lower = text.lower()
        integration_score = sum(1 for term in integration_terms if term in text_lower)
        return min(integration_score / 4, 1.0)
    
    def _calculate_security_complexity(self, text: str, language: str) -> float:
        """Calculer la complexité de sécurité"""
        if language == 'french':
            security_terms = [
                'sécurité', 'authentification', 'autorisation', 'chiffrement',
                'certificat', 'oauth', 'jwt', 'ssl', 'https', 'firewall'
            ]
        else:
            security_terms = [
                'security', 'authentication', 'authorization', 'encryption',
                'certificate', 'oauth', 'jwt', 'ssl', 'https', 'firewall'
            ]
        
        text_lower = text.lower()
        security_score = sum(1 for term in security_terms if term in text_lower)
        return min(security_score / 4, 1.0)
    
    def _calculate_performance_complexity(self, text: str, language: str) -> float:
        """Calculer la complexité de performance"""
        if language == 'french':
            performance_terms = [
                'performance', 'optimisation', 'cache', 'scalabilité',
                'charge', 'concurrent', 'parallèle', 'cluster'
            ]
        else:
            performance_terms = [
                'performance', 'optimization', 'cache', 'scalability',
                'load', 'concurrent', 'parallel', 'cluster'
            ]
        
        text_lower = text.lower()
        performance_score = sum(1 for term in performance_terms if term in text_lower)
        return min(performance_score / 4, 1.0)
    
    def _get_industry_boost(self, industry: str) -> float:
        """Obtenir le boost de complexité par industrie - ÉTENDU À 33 INDUSTRIES"""
        boosts = {
            # === INDUSTRIES ORIGINALES ===
            'Healthcare': 0.8,         # Réglementation médicale
            'Finance': 0.8,            # Sécurité bancaire
            'Energy': 1.0,             # IoT industriel critique
            'Logistics': 0.6,          # Optimisation transport
            'Technology': 0.4,         # Variable
            'Education': 0.2,          # Plateformes éducatives
            'Retail': 0.3,             # E-commerce standard
            'Media': 0.3,              # Publication contenu
            
            # === NOUVELLES INDUSTRIES B2B ===
            'Consulting': 0.3,         # Processus métier
            'Legal Services': 0.7,     # Conformité juridique
            'Marketing & Advertising': 0.1,  # Campagnes simples
            'Human Resources': 0.3,    # Réglementation RH
            'Real Estate': 0.2,        # Processus établis
            'Insurance': 0.7,          # Réglementation stricte
            
            # === NOUVELLES INDUSTRIES MANUFACTURING ===
            'Automotive': 0.6,         # Normes sécurité
            'Aerospace': 1.2,          # Certifications critiques
            'Construction': 0.4,       # BIM et planification
            'Food & Beverage': 0.4,    # Traçabilité alimentaire
            'Textile & Fashion': 0.2,  # Design et production
            'Chemical': 0.8,           # Sécurité et REACH
            
            # === NOUVELLES INDUSTRIES CREATIVE ===
            'Gaming': 0.3,             # Développement rapide
            'Sports & Fitness': 0.1,   # Applications simples
            'Travel & Tourism': 0.2,   # Booking standard
            'Events & Hospitality': 0.2,  # Gestion événements
            
            # === NOUVELLES INDUSTRIES PUBLIC/NON-PROFIT ===
            'Government': 0.7,         # Procédures publiques
            'Non-profit': 0.1,         # Ressources limitées
            'Environmental': 0.3,      # Monitoring écologique
            'Agriculture': 0.3,        # IoT agricole
            
            # === NOUVELLES INDUSTRIES SCIENCES ===
            'Biotechnology': 0.8,      # Validation scientifique
            'Research & Development': 0.7,  # Recherche rigoureuse
            'Pharmaceutical': 1.1      # FDA et essais cliniques
        }
        return boosts.get(industry, 0.0)


class WorkingDayCalculator:
    """Calculateur de jours ouvrables avec gestion des jours fériés"""
    
    def __init__(self):
        # Jours fériés français 2025
        self.french_holidays_2025 = [
            datetime(2025, 1, 1),   # Jour de l'An
            datetime(2025, 4, 21),  # Lundi de Pâques
            datetime(2025, 5, 1),   # Fête du Travail
            datetime(2025, 5, 8),   # Victoire 1945
            datetime(2025, 5, 29),  # Ascension
            datetime(2025, 6, 9),   # Lundi de Pentecôte
            datetime(2025, 7, 14),  # Fête Nationale
            datetime(2025, 8, 15),  # Assomption
            datetime(2025, 11, 1),  # Toussaint
            datetime(2025, 11, 11), # Armistice
            datetime(2025, 12, 25)  # Noël
        ]
        
        # Jours fériés français 2026 (pour les projets longs)
        self.french_holidays_2026 = [
            datetime(2026, 1, 1),   # Jour de l'An
            datetime(2026, 4, 6),   # Lundi de Pâques
            datetime(2026, 5, 1),   # Fête du Travail
            datetime(2026, 5, 8),   # Victoire 1945
            datetime(2026, 5, 14),  # Ascension
            datetime(2026, 5, 25),  # Lundi de Pentecôte
            datetime(2026, 7, 14),  # Fête Nationale
            datetime(2026, 8, 15),  # Assomption
            datetime(2026, 11, 1),  # Toussaint
            datetime(2026, 11, 11), # Armistice
            datetime(2026, 12, 25)  # Noël
        ]
        
        self.all_holidays = self.french_holidays_2025 + self.french_holidays_2026
    
    def calculate_deadline(self, duration_days: int) -> str:
        """Calculer la date de fin en jours ouvrables"""
        current_date = datetime.now()
        working_days_added = 0
        deadline_date = current_date
        
        while working_days_added < duration_days:
            deadline_date += timedelta(days=1)
            
            # Vérifier si c'est un jour ouvrable
            is_weekend = deadline_date.weekday() >= 5  # 5 = samedi, 6 = dimanche
            is_holiday = any(holiday.date() == deadline_date.date() for holiday in self.all_holidays)
            
            if not is_weekend and not is_holiday:
                working_days_added += 1
        
        return deadline_date.strftime('%Y-%m-%d')
    
    def calculate_working_days_between(self, start_date: datetime, end_date: datetime) -> int:
        """Calculer le nombre de jours ouvrables entre deux dates"""
        working_days = 0
        current_date = start_date
        
        while current_date <= end_date:
            is_weekend = current_date.weekday() >= 5
            is_holiday = any(holiday.date() == current_date.date() for holiday in self.all_holidays)
            
            if not is_weekend and not is_holiday:
                working_days += 1
            
            current_date += timedelta(days=1)
        
        return working_days


class MLComplexityDurationPredictor:
    """Prédicteur ML de complexité et durée"""
    
    def __init__(self):
        self.complexity_analyzer = ComplexityIndicatorAnalyzer()
        self.feature_extractor = ComplexityFeatureExtractor()
        self.working_day_calculator = WorkingDayCalculator()
        
        # Modèles ML
        self.complexity_classifier = None
        self.duration_estimator = None
        
        # Encodeurs
        self.complexity_encoder = LabelEncoder()
        
        # État d'entraînement
        self.is_trained = False
        
        # Cache
        self.prediction_cache = {}
    
    def load_training_dataset(self) -> pd.DataFrame:
        """Charger ou générer le dataset d'entraînement - VERSION CORRIGÉE"""
        
        training_data = []
        
        # Dataset d'entraînement avec complexité et durée réelles
        training_samples = [
            # Projets simples (7-30 jours)
            ("Site web vitrine avec HTML/CSS", "simple", 12, "Technology", "french"),
            ("Page d'accueil responsive", "simple", 8, "Technology", "french"),
            ("Formulaire de contact PHP", "simple", 10, "Technology", "french"),
            ("Blog WordPress basique", "simple", 15, "Technology", "french"),
            ("Application CRUD simple", "simple", 20, "Technology", "french"),
            ("Portfolio personnel", "simple", 14, "Technology", "french"),
            ("Landing page marketing", "simple", 18, "Technology", "french"),
            
            ("Static website with HTML/CSS", "simple", 12, "Technology", "english"),
            ("Responsive homepage", "simple", 8, "Technology", "english"),
            ("Contact form with PHP", "simple", 10, "Technology", "english"),
            ("Basic WordPress blog", "simple", 15, "Technology", "english"),
            ("Simple CRUD application", "simple", 20, "Technology", "english"),
            ("Personal portfolio", "simple", 14, "Technology", "english"),
            ("Marketing landing page", "simple", 18, "Technology", "english"),
            
            # Projets moyens (30-70 jours)
            ("Application web React avec API", "moyen", 45, "Technology", "french"),
            ("Système de gestion d'inventaire", "moyen", 55, "Technology", "french"),
            ("Plateforme e-commerce Shopify", "moyen", 60, "Retail", "french"),
            ("Application mobile Flutter", "moyen", 50, "Technology", "french"),
            ("Dashboard analytique", "moyen", 40, "Technology", "french"),
            ("Système de réservation", "moyen", 48, "Technology", "french"),
            ("API REST avec authentification", "moyen", 35, "Technology", "french"),
            ("Plateforme collaborative", "moyen", 52, "Technology", "french"),
            
            ("React web app with API", "moyen", 45, "Technology", "english"),
            ("Inventory management system", "moyen", 55, "Technology", "english"),
            ("Shopify e-commerce platform", "moyen", 60, "Retail", "english"),
            ("Flutter mobile application", "moyen", 50, "Technology", "english"),
            ("Analytics dashboard", "moyen", 40, "Technology", "english"),
            ("Booking system", "moyen", 48, "Technology", "english"),
            ("REST API with auth", "moyen", 35, "Technology", "english"),
            ("Collaborative platform", "moyen", 52, "Technology", "english"),
            
            # Projets complexes (70-120 jours)
            ("Plateforme blockchain avec smart contracts", "complexe", 90, "Finance", "french"),
            ("Système ERP sur mesure", "complexe", 110, "Technology", "french"),
            ("Application IoT avec ML", "complexe", 85, "Technology", "french"),
            ("Plateforme trading haute fréquence", "complexe", 95, "Finance", "french"),
            ("Système de santé interopérable", "complexe", 100, "Healthcare", "french"),
            ("Plateforme de streaming vidéo", "complexe", 88, "Media", "french"),
            ("Système de gestion hospitalière", "complexe", 105, "Healthcare", "french"),
            
            ("Blockchain platform with smart contracts", "complexe", 90, "Finance", "english"),
            ("Custom ERP system", "complexe", 110, "Technology", "english"),
            ("IoT application with ML", "complexe", 85, "Technology", "english"),
            ("High frequency trading platform", "complexe", 95, "Finance", "english"),
            ("Interoperable health system", "complexe", 100, "Healthcare", "english"),
            ("Video streaming platform", "complexe", 88, "Media", "english"),
            ("Hospital management system", "complexe", 105, "Healthcare", "english"),
            
            # Projets experts (120+ jours)
            ("Intelligence artificielle conversationnelle", "expert", 150, "Technology", "french"),
            ("Plateforme quantique de simulation", "expert", 180, "Research & Development", "french"),
            ("Système autonome de trading crypto", "expert", 140, "Finance", "french"),
            ("Plateforme de diagnostic médical IA", "expert", 160, "Healthcare", "french"),
            ("Système de pilotage automatique", "expert", 200, "Automotive", "french"),
            ("Plateforme de réalité virtuelle immersive", "expert", 135, "Gaming", "french"),
            
            ("Conversational AI platform", "expert", 150, "Technology", "english"),
            ("Quantum simulation platform", "expert", 180, "Research & Development", "english"),
            ("Autonomous crypto trading system", "expert", 140, "Finance", "english"),
            ("AI medical diagnosis platform", "expert", 160, "Healthcare", "english"),
            ("Autonomous driving system", "expert", 200, "Automotive", "english"),
            ("Immersive VR platform", "expert", 135, "Gaming", "english"),
            
            # Secteurs spécialisés
            # Healthcare (réglementation stricte)
            ("Dossier médical électronique", "complexe", 80, "Healthcare", "french"),
            ("Système de télémédecine", "moyen", 65, "Healthcare", "french"),
            ("Plateforme de recherche clinique", "expert", 120, "Healthcare", "french"),
            ("Electronic health record", "complexe", 85, "Healthcare", "english"),
            ("Telemedicine system", "moyen", 70, "Healthcare", "english"),
            ("Clinical research platform", "expert", 125, "Healthcare", "english"),
            
            # Finance (haute sécurité)
            ("Application bancaire mobile", "complexe", 75, "Finance", "french"),
            ("Système de paiement en ligne", "moyen", 55, "Finance", "french"),
            ("Plateforme de crédit scoring", "complexe", 85, "Finance", "french"),
            ("Mobile banking application", "complexe", 80, "Finance", "english"),
            ("Online payment system", "moyen", 60, "Finance", "english"),
            ("Credit scoring platform", "complexe", 90, "Finance", "english"),
            
            # Education (pédagogie)
            ("Plateforme e-learning interactive", "moyen", 50, "Education", "french"),
            ("Système de gestion scolaire", "moyen", 45, "Education", "french"),
            ("Application d'apprentissage adaptatif", "complexe", 75, "Education", "french"),
            ("Interactive e-learning platform", "moyen", 55, "Education", "english"),
            ("School management system", "moyen", 50, "Education", "english"),
            ("Adaptive learning application", "complexe", 80, "Education", "english"),
            
            # Retail (expérience client)
            ("Marketplace multi-vendeurs", "complexe", 90, "Retail", "french"),
            ("Application de fidélité client", "moyen", 40, "Retail", "french"),
            ("Système de recommandation IA", "complexe", 70, "Retail", "french"),
            ("Multi-vendor marketplace", "complexe", 95, "Retail", "english"),
            ("Customer loyalty application", "moyen", 45, "Retail", "english"),
            ("AI recommendation system", "complexe", 75, "Retail", "english"),
            
            # Logistics (optimisation)
            ("Système de suivi logistique", "moyen", 55, "Logistics", "french"),
            ("Plateforme d'optimisation de routes", "complexe", 85, "Logistics", "french"),
            ("Application de gestion d'entrepôt", "moyen", 50, "Logistics", "french"),
            ("Logistics tracking system", "moyen", 60, "Logistics", "english"),
            ("Route optimization platform", "complexe", 90, "Logistics", "english"),
            ("Warehouse management application", "moyen", 55, "Logistics", "english"),
            
            # Aerospace (haute précision)
            ("Système de maintenance aéronautique", "expert", 140, "Aerospace", "french"),
            ("Plateforme de simulation de vol", "expert", 160, "Aerospace", "french"),
            ("Aircraft maintenance system", "expert", 145, "Aerospace", "english"),
            ("Flight simulation platform", "expert", 165, "Aerospace", "english"),
            
            # Energy (smart grid)
            ("Système de gestion énergétique", "complexe", 95, "Energy", "french"),
            ("Plateforme IoT énergétique", "complexe", 85, "Energy", "french"),
            ("Energy management system", "complexe", 100, "Energy", "english"),
            ("Energy IoT platform", "complexe", 90, "Energy", "english"),
            
            # Gaming (performance)
            ("Jeu mobile multijoueur", "complexe", 80, "Gaming", "french"),
            ("Moteur de jeu 3D", "expert", 120, "Gaming", "french"),
            ("Multiplayer mobile game", "complexe", 85, "Gaming", "english"),
            ("3D game engine", "expert", 125, "Gaming", "english"),
            
            # Legal Services (conformité)
            ("Système de gestion juridique", "moyen", 60, "Legal Services", "french"),
            ("Plateforme de conformité réglementaire", "complexe", 85, "Legal Services", "french"),
            ("Legal management system", "moyen", 65, "Legal Services", "english"),
            ("Regulatory compliance platform", "complexe", 90, "Legal Services", "english")
        ]
        
        training_data = list(training_samples)  # Convertir tuple en liste
        
        if len(training_data) == 0:
            raise ValueError("Dataset d'entraînement vide ! Impossible d'entraîner le modèle.")
        
        df = pd.DataFrame(training_data, columns=['description', 'complexity', 'duration', 'industry', 'language'])
        print(f"Dataset d'entraînement créé : {len(df)} échantillons")
        
        if df.empty:
            raise ValueError("DataFrame vide après création !")
        
        required_columns = ['description', 'complexity', 'duration', 'industry', 'language']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Colonnes manquantes dans le dataset: {missing_columns}")
        
        if df['description'].isnull().any():
            raise ValueError("Descriptions manquantes dans le dataset")
        if df['complexity'].isnull().any():
            raise ValueError("Niveaux de complexité manquants dans le dataset")
        if df['duration'].isnull().any():
            raise ValueError("Durées manquantes dans le dataset")
        
        print(f" Dataset validé: {len(df)} échantillons avec {df['complexity'].nunique()} niveaux de complexité")
        print(f" Répartition complexité: {df['complexity'].value_counts().to_dict()}")
        print(f" Répartition langues: {df['language'].value_counts().to_dict()}")
        
        return df
        
    def train_model(self):
        """Entraîner les modèles de complexité et durée"""
        if self.is_trained:
            return
        
        print("Entraînement des modèles de complexité et durée...")
        
        # Charger les données
        df = self.load_training_dataset()
        
        # Extraire les features
        print("Extraction des features...")
        feature_matrix = []
        for _, row in df.iterrows():
            features = self.feature_extractor.extract_complexity_features(
                row['description'], 
                row['industry']
            )
            feature_matrix.append(list(features.values()))
        
        X = np.array(feature_matrix)
        
        # Entraîner le classificateur de complexité
        print("Entraînement du classificateur de complexité...")
        y_complexity = self.complexity_encoder.fit_transform(df['complexity'])
        
        self.complexity_classifier = RandomForestClassifier(
            n_estimators=150,
            random_state=42,
            class_weight='balanced',
            max_depth=10
        )
        self.complexity_classifier.fit(X, y_complexity)
        
        # Entraîner l'estimateur de durée
        print("Entraînement de l'estimateur de durée...")
        y_duration = df['duration'].values
        
        self.duration_estimator = RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            max_depth=15
        )
        self.duration_estimator.fit(X, y_duration)
        
        # Évaluation
        self._evaluate_models(X, y_complexity, y_duration)
        
        self.is_trained = True
        print("Modèles entraînés avec succès!")
    
    def _evaluate_models(self, X, y_complexity, y_duration):
        """Évaluer les performances des modèles"""
        try:
            # Évaluation complexité
            X_train, X_test, y_comp_train, y_comp_test = train_test_split(
                X, y_complexity, test_size=0.2, random_state=42, stratify=y_complexity
            )
            
            comp_pred = self.complexity_classifier.predict(X_test)
            comp_accuracy = accuracy_score(y_comp_test, comp_pred)
            
            # Évaluation durée
            _, _, y_dur_train, y_dur_test = train_test_split(
                X, y_duration, test_size=0.2, random_state=42
            )
            
            dur_pred = self.duration_estimator.predict(X_test)
            dur_rmse = np.sqrt(mean_squared_error(y_dur_test, dur_pred))
            dur_mae = np.mean(np.abs(y_dur_test - dur_pred))
            
            print(f"Évaluation - Complexité: {comp_accuracy:.3f}, Durée RMSE: {dur_rmse:.1f}, MAE: {dur_mae:.1f}")
            
            # Distribution des prédictions
            from collections import Counter
            predicted_complexity = self.complexity_encoder.inverse_transform(comp_pred)
            actual_complexity = self.complexity_encoder.inverse_transform(y_comp_test)
            
            print(f"Distribution prédite: {Counter(predicted_complexity)}")
            print(f"Distribution réelle: {Counter(actual_complexity)}")
            
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
    
    def predict_complexity_and_duration(self, text: str, industry: str = None, language: str = None) -> Dict[str, Any]:
        """Prédire la complexité et la durée d'un projet"""
        if not text or len(text.strip()) < 10:
            return {'error': 'Texte trop court (minimum 10 caractères)'}
    
        if not self.is_trained:
            self.train_models()
        if language is None:
            language = self.detect_language(text)  
    
        # Cache
        cache_key = hashlib.md5(f"{text}_{industry}".encode()).hexdigest()
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
    
        try:
            # Analyser les indicateurs
            complexity_analysis = self.complexity_analyzer.analyze_complexity_indicators(text, industry)
        
            # Extraire les features
            features = self.feature_extractor.extract_complexity_features(text, industry)
            
            # *** AJOUTER CETTE VALIDATION ***
            if not features or len(features) == 0:
                raise ValueError("Aucune feature extraite du texte")
            
            feature_values = list(features.values())
            if len(feature_values) == 0:
                raise ValueError("Liste de features vide")
            
            # Convertir en valeurs numériques et gérer les valeurs None
            try:
                feature_values = [float(v) if v is not None else 0.0 for v in feature_values]
            except (ValueError, TypeError):
                raise ValueError("Features non numériques détectées")
            
            X = np.array([feature_values])
            
            # Vérifier que l'array n'est pas vide
            if X.size == 0:
                raise ValueError("Array de features vide après conversion")
            # *** FIN DE LA VALIDATION ***
        
            # Prédire la complexité
            complexity_pred = self.complexity_classifier.predict(X)[0]
            complexity_proba = self.complexity_classifier.predict_proba(X)[0]
            predicted_complexity = self.complexity_encoder.inverse_transform([complexity_pred])[0]
            complexity_confidence = float(np.max(complexity_proba))
        
            # Prédire la durée
            predicted_duration = self.duration_estimator.predict(X)[0]
            predicted_duration = max(int(predicted_duration), 7)  # Minimum 7 jours
        
            # Calculer la deadline
            deadline = self.working_day_calculator.calculate_deadline(predicted_duration)
        
            # Analyser les contributeurs à la complexité
            complexity_contributors = self._analyze_complexity_contributors(
                complexity_analysis, features, predicted_complexity
            )
        
            # Probabilités par niveau de complexité
            complexity_probabilities = {}
            for i, label in enumerate(self.complexity_encoder.classes_):
                complexity_name = self.complexity_encoder.inverse_transform([i])[0]
                complexity_probabilities[complexity_name] = float(complexity_proba[i])
        
            result = {
                'complexity': predicted_complexity,
                'complexity_confidence': complexity_confidence,
                'estimated_duration_days': predicted_duration,
                'estimated_deadline': deadline,
                'language': complexity_analysis['language'],
                'industry': industry,
                'complexity_analysis': complexity_contributors,
                'complexity_probabilities': complexity_probabilities,
                'duration_factors': self._analyze_duration_factors(features, predicted_duration),
                'recommendations': self._generate_recommendations(predicted_complexity, predicted_duration, complexity_analysis['language']),
                'method': 'ml_random_forest'
            }
        
            self.prediction_cache[cache_key] = result
            return result
        
        except Exception as e:
            print(f"Erreur lors de la prédiction : {e}")
            
            # *** AMÉLIORER LE FALLBACK ***
            return {
                'complexity': 'moyen',
                'complexity_confidence': 0.5,
                'estimated_duration_days': 45,
                'estimated_deadline': self.working_day_calculator.calculate_deadline(45),
                'language': language or 'french',
                'industry': industry or 'Technology',
                'complexity_analysis': {'main_factors': ['Estimation par défaut'], 'complexity_score': 0.5},
                'complexity_probabilities': {'simple': 0.2, 'moyen': 0.6, 'complexe': 0.2},
                'duration_factors': ['Estimation basée sur la complexité par défaut'],
                'recommendations': ['Prévoir une planification détaillée', 'Organiser des revues régulières'],
                'error': str(e),
                'method': 'fallback'
            }
    
    def _analyze_complexity_contributors(self, complexity_analysis: Dict, features: Dict, predicted_complexity: str) -> Dict[str, Any]:
        """Analyser les contributeurs à la complexité"""
        contributors = []
        
        # Analyser les scores par niveau
        scores = complexity_analysis['complexity_scores']
        
        # Identifier les contributeurs principaux
        for level, score_data in scores.items():
            if score_data['total_score'] > 0:
                contributors.append({
                    'level': level,
                    'score': score_data['total_score'],
                    'keyword_count': score_data['keyword_count'],
                    'tech_count': score_data['tech_count']
                })
        
        # Trier par score
        contributors.sort(key=lambda x: x['score'], reverse=True)
        
        # Analyser les aspects techniques
        technical_aspects = []
        if features.get('tech_sophistication', 0) > 0.3:
            technical_aspects.append('Technologies avancées détectées')
        if features.get('integration_complexity', 0) > 0.3:
            technical_aspects.append('Intégrations complexes requises')
        if features.get('security_complexity', 0) > 0.3:
            technical_aspects.append('Exigences de sécurité élevées')
        if features.get('performance_complexity', 0) > 0.3:
            technical_aspects.append('Optimisations de performance nécessaires')
        
        return {
            'predicted_level': predicted_complexity,
            'main_contributors': contributors[:3],
            'technical_aspects': technical_aspects,
            'industry_impact': complexity_analysis.get('industry_boost') is not None
        }
    
    def _analyze_duration_factors(self, features: Dict, predicted_duration: int) -> Dict[str, Any]:
        """Analyser les facteurs influençant la durée"""
        factors = []
        
        # Facteurs basés sur les features
        if features.get('complexe_total_score', 0) > 2:
            factors.append('Complexité technique élevée (+20-30 jours)')
        if features.get('expert_total_score', 0) > 1:
            factors.append('Technologies expertes (+40-60 jours)')
        if features.get('integration_complexity', 0) > 0.5:
            factors.append('Intégrations multiples (+10-20 jours)')
        if features.get('security_complexity', 0) > 0.5:
            factors.append('Sécurité avancée (+15-25 jours)')
        if features.get('industry_complexity_boost', 0) > 0.5:
            factors.append('Industrie réglementée (+10-15 jours)')
        
        # Estimation par phases
        phases = self._estimate_project_phases(predicted_duration)
        
        return {
            'total_duration': predicted_duration,
            'duration_factors': factors,
            'estimated_phases': phases,
            'working_days_only': True
        }
    
    def _estimate_project_phases(self, total_duration: int) -> List[Dict[str, Any]]:
        """Estimer les phases du projet"""
        phases = [
            {'name': 'Analyse et conception', 'percentage': 0.15},
            {'name': 'Développement', 'percentage': 0.55},
            {'name': 'Tests et intégration', 'percentage': 0.20},
            {'name': 'Déploiement', 'percentage': 0.10}
        ]
        
        phase_details = []
        for phase in phases:
            phase_duration = int(total_duration * phase['percentage'])
            phase_details.append({
                'name': phase['name'],
                'duration': max(phase_duration, 1),
                'percentage': phase['percentage'] * 100
            })
        
        return phase_details
    
    def _generate_recommendations(self, complexity: str, duration: int, language: str) -> List[str]:
        """Générer des recommandations basées sur la complexité et durée"""
        recommendations = []
        
        if language == 'french':
            if complexity == 'expert':
                recommendations.append('Projet très complexe : équipe senior recommandée')
                recommendations.append('Planification détaillée et architecture robuste requises')
                recommendations.append('Tests approfondis et validation par phases')
            elif complexity == 'complexe':
                recommendations.append('Complexité élevée : prévoir une phase de conception approfondie')
                recommendations.append('Intégrations multiples : tester chaque composant séparément')
            elif complexity == 'moyen':
                recommendations.append('Projet standard : méthodologie agile recommandée')
                recommendations.append('Tests réguliers et livraisons itératives')
            else:  # simple
                recommendations.append('Projet simple : développement rapide possible')
                recommendations.append('Idéal pour débuter ou prototyper')
            
            if duration > 150:
                recommendations.append('Projet long : diviser en phases de 6-8 semaines')
            elif duration > 90:
                recommendations.append('Durée importante : jalons intermédiaires conseillés')
            
        else:  # english
            if complexity == 'expert':
                recommendations.append('Very complex project: senior team recommended')
                recommendations.append('Detailed planning and robust architecture required')
                recommendations.append('Thorough testing and phased validation')
            elif complexity == 'complexe':
                recommendations.append('High complexity: plan thorough design phase')
                recommendations.append('Multiple integrations: test each component separately')
            elif complexity == 'moyen':
                recommendations.append('Standard project: agile methodology recommended')
                recommendations.append('Regular testing and iterative delivery')
            else:  # simple
                recommendations.append('Simple project: rapid development possible')
                recommendations.append('Ideal for starting or prototyping')
            
            if duration > 150:
                recommendations.append('Long project: divide into 6-8 week phases')
            elif duration > 90:
                recommendations.append('Significant duration: intermediate milestones advised')
        
        return recommendations
    
    def predict_project_type_and_stack(self, description: str, industry: str = 'Technology'):
        """Méthode de prédiction manquante"""
        try:
            if not hasattr(self, 'is_trained') or not self.is_trained:
                return self._fallback_project_type(description, industry)
                
            # Vectoriser la description
            X = self.vectorizer.transform([description])
            
            # Prédiction type de projet
            project_type = self.project_type_classifier.predict(X)[0]
            
            # Prédiction stack technique
            stack = self._predict_tech_stack(description, project_type, industry)
            
            return {
                'project_type': project_type,
                'tech_stack': stack,
                'confidence': 0.8,
                'method': 'ml_prediction'
            }
            
        except Exception as e:
            return self._fallback_project_type(description, industry)

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


# Application Flask
app = Flask(__name__)
CORS(app)

# Instance globale du prédicteur
predictor = MLComplexityDurationPredictor()

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        expected_token = 'ComplexityDurationPredictor2024!'
        
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
        'service': 'Complexity & Duration Predictor - ML',
        'version': '1.0.0',
        'complexity_levels': ['simple', 'moyen', 'complexe', 'expert'],
        'supported_languages': ['français', 'english'],
        'features': [
            'ML complexity classification',
            'Duration estimation with working days',
            'French holidays support',
            'Industry-specific adjustments',
            'Multilingual text analysis'
        ],
        'model_trained': predictor.is_trained,
        'working_day_calculator': 'French holidays 2025-2026',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict-complexity-duration', methods=['POST'])
@authenticate
def predict_complexity_duration():
    """Prédire la complexité et la durée d'un projet"""
    try:
        data = request.get_json()
       
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
       
        text = data['text']
        industry = data.get('industry', 'Technology')  # Valeur par défaut
        language = data.get('language', 'french')  # Ajouter support langue
       
        if not text or len(text.strip()) < 10:
            return jsonify({'error': 'Texte trop court (minimum 10 caractères)'}), 400
       
        # Validation et extraction des features AVANT la prédiction
        try:
            features = predictor.feature_extractor.extract_complexity_features(text, industry)
            
            # Vérifier si des features ont été extraites
            if not features or len(features) == 0:
                # Retourner un résultat de fallback
                fallback_result = {
                    'predicted_complexity': 'moyen',
                    'predicted_duration': 45,
                    'working_days': 32,
                    'confidence': 0.5,
                    'method': 'fallback_no_features',
                    'message': 'Features insuffisantes, utilisation de valeurs par défaut'
                }
                
                return jsonify({
                    'success': True,
                    'result': fallback_result,
                    'input_text_length': len(text),
                    'timestamp': datetime.now().isoformat()
                })
            
            # Convertir features en array et vérifier dimensions
            feature_values = list(features.values())
            if len(feature_values) == 0:
                raise ValueError("Aucune feature extraite")
                
        except Exception as feature_error:
            # En cas d'erreur d'extraction de features
            fallback_result = {
                'predicted_complexity': 'moyen',
                'predicted_duration': 45,
                'working_days': 32,
                'confidence': 0.4,
                'method': 'fallback_feature_error',
                'message': f'Erreur extraction features: {str(feature_error)}'
            }
            
            return jsonify({
                'success': True,
                'result': fallback_result,
                'input_text_length': len(text),
                'timestamp': datetime.now().isoformat()
            })
       
        # Prédiction avec gestion d'erreurs
        try:
            result = predictor.predict_complexity_and_duration(text, industry, language)
        except Exception as prediction_error:
            # Fallback en cas d'erreur de prédiction
            result = {
                'predicted_complexity': 'moyen',
                'predicted_duration': 45,
                'working_days': 32,
                'confidence': 0.3,
                'method': 'fallback_prediction_error',
                'error': str(prediction_error)
            }
       
        if 'error' in result:
            return jsonify(result), 400
       
        return jsonify({
            'success': True,
            'result': result,
            'input_text_length': len(text),
            'features_extracted': len(feature_values) if 'feature_values' in locals() else 0,
            'timestamp': datetime.now().isoformat()
        })
       
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/predict-complexity', methods=['POST'])
@authenticate
def predict_complexity():
    """Prédire seulement la complexité d'un projet"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        industry = data.get('industry')
        
        result = predictor.predict_complexity_and_duration(text, industry)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Retourner seulement les infos de complexité
        complexity_result = {
            'complexity': result['complexity'],
            'complexity_confidence': result['complexity_confidence'],
            'complexity_probabilities': result['complexity_probabilities'],
            'complexity_analysis': result['complexity_analysis'],
            'language': result['language'],
            'recommendations': [r for r in result['recommendations'] if 'complexité' in r.lower() or 'complexity' in r.lower()]
        }
        
        return jsonify({
            'success': True,
            'result': complexity_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/predict-duration', methods=['POST'])
@authenticate
def predict_duration():
    """Prédire seulement la durée d'un projet"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        industry = data.get('industry')
        
        result = predictor.predict_complexity_and_duration(text, industry)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Retourner seulement les infos de durée
        duration_result = {
            'estimated_duration_days': result['estimated_duration_days'],
            'estimated_deadline': result['estimated_deadline'],
            'duration_factors': result['duration_factors'],
            'language': result['language'],
            'recommendations': [r for r in result['recommendations'] if 'durée' in r.lower() or 'duration' in r.lower() or 'phase' in r.lower()]
        }
        
        return jsonify({
            'success': True,
            'result': duration_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/calculate-deadline', methods=['POST'])
def calculate_deadline():
    """Calculer une deadline à partir d'une durée en jours"""
    try:
        data = request.get_json()
        
        if not data or 'duration_days' not in data:
            return jsonify({'error': 'Durée en jours requise dans le champ "duration_days"'}), 400
        
        duration_days = data['duration_days']
        
        if not isinstance(duration_days, int) or duration_days <= 0:
            return jsonify({'error': 'La durée doit être un nombre entier positif'}), 400
        
        deadline = predictor.working_day_calculator.calculate_deadline(duration_days)
        
        return jsonify({
            'success': True,
            'duration_days': duration_days,
            'deadline': deadline,
            'working_days_only': True,
            'excludes_weekends_and_holidays': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/analyze-complexity-indicators', methods=['POST'])
def analyze_complexity_indicators():
    """Analyser les indicateurs de complexité dans un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        industry = data.get('industry')
        
        analysis = predictor.complexity_analyzer.analyze_complexity_indicators(text, industry)
        
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

@app.route('/api/batch-predict', methods=['POST'])
@authenticate
def batch_predict():
    """Prédire en batch pour plusieurs projets"""
    try:
        data = request.get_json()
        
        if not data or 'projects' not in data or not isinstance(data['projects'], list):
            return jsonify({'error': 'Liste de projets requise dans le champ "projects"'}), 400
        
        projects = data['projects']
        
        if len(projects) > 20:
            return jsonify({'error': 'Maximum 20 projets par batch'}), 400
        
        results = []
        for i, project in enumerate(projects):
            if not isinstance(project, dict) or 'text' not in project:
                results.append({
                    'index': i,
                    'error': 'Chaque projet doit avoir un champ "text"'
                })
                continue
            
            text = project['text']
            industry = project.get('industry')
            
            if len(text.strip()) < 10:
                results.append({
                    'index': i,
                    'text': text[:50] + '...' if len(text) > 50 else text,
                    'error': 'Texte trop court (minimum 10 caractères)'
                })
                continue
            
            prediction = predictor.predict_complexity_and_duration(text, industry)
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

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Informations détaillées sur les modèles"""
    return jsonify({
        'success': True,
        'model_info': {
            'is_trained': predictor.is_trained,
            'complexity_algorithm': 'RandomForestClassifier',
            'duration_algorithm': 'RandomForestRegressor',
            'complexity_levels': ['simple', 'moyen', 'complexe', 'expert'],
            'duration_range': '7-250 jours ouvrables',
            'supported_languages': ['français', 'english'],
            'supported_industries': [
                'Technology', 'Healthcare', 'Finance', 'Education',
                'Retail', 'Media', 'Logistics', 'Energy'
            ],
            'training_samples': 64,
            'feature_types': [
                'complexity_indicators_by_level',
                'technical_sophistication',
                'integration_complexity',
                'security_complexity',
                'performance_complexity',
                'linguistic_features',
                'industry_adjustments'
            ],
            'working_day_calculator': 'French holidays 2025-2026',
            'cache_enabled': True,
            'version': '1.0.0'
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/train-models', methods=['POST'])
@authenticate
def train_models():
    """Réentraîner les modèles (utile pour le développement)"""
    try:
        # Réinitialiser les modèles
        predictor.is_trained = False
        predictor.prediction_cache.clear()
        
        # Réentraîner
        predictor.train_models()
        
        return jsonify({
            'success': True,
            'message': 'Modèles réentraînés avec succès',
            'model_trained': predictor.is_trained,
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
            'POST /api/predict-complexity-duration',
            'POST /api/predict-complexity',
            'POST /api/predict-duration',
            'POST /api/calculate-deadline',
            'POST /api/analyze-complexity-indicators',
            'POST /api/batch-predict',
            'GET /api/model-info',
            'POST /api/train-models'
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
    
    port = int(os.environ.get('PORT', 3003))
    
    print("=" * 70)
    print("COMPLEXITY & DURATION PREDICTOR - MODULE ISOLÉ")
    print("=" * 70)
    print(f"Service démarré sur le port {port}")
    print(f"Niveaux de complexité : simple, moyen, complexe, expert")
    print(f"Estimation de durée : 7-250 jours ouvrables")
    print(f"Langues supportées : français, anglais")
    print(f"Industries supportées : 8 secteurs")
    print(f"Calculateur : jours fériés français 2025-2026")
    print("=" * 70)
    print("ENDPOINTS DISPONIBLES :")
    print(f"  - Health check          : http://localhost:{port}/health")
    print(f"  - Predict both          : POST http://localhost:{port}/api/predict-complexity-duration")
    print(f"  - Predict complexity    : POST http://localhost:{port}/api/predict-complexity")
    print(f"  - Predict duration      : POST http://localhost:{port}/api/predict-duration")
    print(f"  - Calculate deadline    : POST http://localhost:{port}/api/calculate-deadline")
    print(f"  - Analyze indicators    : POST http://localhost:{port}/api/analyze-complexity-indicators")
    print(f"  - Batch predict         : POST http://localhost:{port}/api/batch-predict")
    print(f"  - Model info           : GET http://localhost:{port}/api/model-info")
    print("=" * 70)
    print("Token d'authentification : 'ComplexityDurationPredictor2024!'")
    print("Utilisation :")
    print("   Header: Authorization: Bearer ComplexityDurationPredictor2024!")
    print("   Body: {\"text\": \"Description du projet...\", \"industry\": \"Technology\"}")
    print("=" * 70)
    print("Fonctionnalités :")
    print("  ✓ Prédiction ML de complexité (4 niveaux)")
    print("  ✓ Estimation de durée en jours ouvrables")
    print("  ✓ Calcul de deadline avec jours fériés français")
    print("  ✓ Analyse des indicateurs de complexité")
    print("  ✓ Recommandations personnalisées")
    print("  ✓ Support multilingue (français/anglais)")
    print("  ✓ Ajustements par industrie")
    print("  ✓ Traitement en batch")
    print("=" * 70)
    print("Service prêt - En attente de requêtes...")
    
    app.run(host='0.0.0.0', port=port, debug=False)