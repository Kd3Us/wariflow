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
            'Healthcare': 'complexe',  # Réglementations strictes
            'Finance': 'complexe',     # Sécurité critique
            'Technology': 'moyen',     # Variable selon le projet
            'Education': 'moyen',      # Généralement standard
            'Retail': 'moyen',         # E-commerce classique
            'Media': 'moyen',          # Streaming/contenu
            'Logistics': 'complexe',   # Optimisation complexe
            'Energy': 'expert'         # IoT industriel complexe
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
        """Obtenir le boost de complexité par industrie"""
        boosts = {
            'Healthcare': 0.8,
            'Finance': 0.8,
            'Energy': 1.0,
            'Logistics': 0.6,
            'Technology': 0.4,
            'Education': 0.2,
            'Retail': 0.3,
            'Media': 0.3
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
        """Charger ou générer le dataset d'entraînement"""
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
            ("Plateforme de formation en ligne", "moyen", 65, "Education", "french"),
            
            ("React web app with API", "moyen", 45, "Technology", "english"),
            ("Inventory management system", "moyen", 55, "Technology", "english"),
            ("E-commerce platform Shopify", "moyen", 60, "Retail", "english"),
            ("Flutter mobile application", "moyen", 50, "Technology", "english"),
            ("Analytics dashboard", "moyen", 40, "Technology", "english"),
            ("Booking system", "moyen", 48, "Technology", "english"),
            ("REST API with authentication", "moyen", 35, "Technology", "english"),
            ("Online learning platform", "moyen", 65, "Education", "english"),
            
            # Projets complexes (70-120 jours)
            ("Plateforme SaaS multi-tenant", "complexe", 95, "Technology", "french"),
            ("Système de télémédecine sécurisé", "complexe", 110, "Healthcare", "french"),
            ("Application fintech avec blockchain", "complexe", 120, "Finance", "french"),
            ("Architecture microservices", "complexe", 90, "Technology", "french"),
            ("Plateforme IoT industrielle", "complexe", 105, "Energy", "french"),
            ("Système de gestion hospitalière", "complexe", 115, "Healthcare", "french"),
            ("Trading algorithmique temps réel", "complexe", 100, "Finance", "french"),
            ("Supply chain management", "complexe", 85, "Logistics", "french"),
            
            ("Multi-tenant SaaS platform", "complexe", 95, "Technology", "english"),
            ("Secure telemedicine system", "complexe", 110, "Healthcare", "english"),
            ("Fintech app with blockchain", "complexe", 120, "Finance", "english"),
            ("Microservices architecture", "complexe", 90, "Technology", "english"),
            ("Industrial IoT platform", "complexe", 105, "Energy", "english"),
            ("Hospital management system", "complexe", 115, "Healthcare", "english"),
            ("Real-time algorithmic trading", "complexe", 100, "Finance", "english"),
            ("Supply chain management", "complexe", 85, "Logistics", "english"),
            
            # Projets experts (120+ jours)
            ("Intelligence artificielle médicale", "expert", 180, "Healthcare", "french"),
            ("Système bancaire haute fréquence", "expert", 200, "Finance", "french"),
            ("Plateforme big data temps réel", "expert", 160, "Technology", "french"),
            ("Smart grid avec IoT massif", "expert", 220, "Energy", "french"),
            ("Système de paiement cryptographique", "expert", 190, "Finance", "french"),
            ("Architecture cloud native Kubernetes", "expert", 150, "Technology", "french"),
            ("Machine learning prédictif", "expert", 140, "Technology", "french"),
            ("Blockchain enterprise privée", "expert", 170, "Finance", "french"),
            
            ("Medical artificial intelligence", "expert", 180, "Healthcare", "english"),
            ("High-frequency banking system", "expert", 200, "Finance", "english"),
            ("Real-time big data platform", "expert", 160, "Technology", "english"),
            ("Smart grid with massive IoT", "expert", 220, "Energy", "english"),
            ("Cryptographic payment system", "expert", 190, "Finance", "english"),
            ("Cloud native Kubernetes architecture", "expert", 150, "Technology", "english"),
            ("Predictive machine learning", "expert", 140, "Technology", "english"),
            ("Private enterprise blockchain", "expert", 170, "Finance", "english")
        ]
        
        df = pd.DataFrame(training_data, columns=['description', 'complexity', 'duration', 'industry', 'language'])
        print(f"Dataset d'entraînement créé : {len(df)} échantillons")
        return df
    
    def train_models(self):
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
    
    def predict_complexity_and_duration(self, text: str, industry: str = None) -> Dict[str, Any]:
        """Prédire la complexité et la durée d'un projet"""
        if not text or len(text.strip()) < 10:
            return {'error': 'Texte trop court (minimum 10 caractères)'}
        
        if not self.is_trained:
            self.train_models()
        
        # Cache
        cache_key = hashlib.md5(f"{text}_{industry}".encode()).hexdigest()
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
        
        try:
            # Analyser les indicateurs
            complexity_analysis = self.complexity_analyzer.analyze_complexity_indicators(text, industry)
            
            # Extraire les features
            features = self.feature_extractor.extract_complexity_features(text, industry)
            X = np.array([list(features.values())])
            
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
            return {
                'complexity': 'moyen',
                'complexity_confidence': 0.5,
                'estimated_duration_days': 45,
                'estimated_deadline': self.working_day_calculator.calculate_deadline(45),
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
        industry = data.get('industry')
        
        if not text or len(text.strip()) < 10:
            return jsonify({'error': 'Texte trop court (minimum 10 caractères)'}), 400
        
        # Prédiction
        result = predictor.predict_complexity_and_duration(text, industry)
        
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