# ml_task_generator.py - Module isolé pour génération ML de tâches
# Génération pure ML de tâches avec prédiction priorité/catégorie multilingue
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
import random

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import SnowballStemmer
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
import warnings
warnings.filterwarnings('ignore')

try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('maxent_ne_chunker', quiet=True)
    nltk.download('words', quiet=True)
except:
    pass


class MultilingualTaskPatternAnalyzer:
    """Analyseur de patterns de tâches multilingue"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # Patterns linguistiques par langue
        self.language_patterns = {
            'french': {
                'action_verbs': [
                    'développer', 'créer', 'implémenter', 'construire', 'designer', 'optimiser',
                    'intégrer', 'analyser', 'tester', 'valider', 'sécuriser', 'configurer',
                    'déployer', 'maintenir', 'documenter', 'former', 'monitorer'
                ],
                'task_objects': [
                    'api', 'interface', 'base de données', 'système', 'module', 'service',
                    'authentification', 'dashboard', 'rapport', 'notification', 'paiement',
                    'recherche', 'chat', 'profil', 'paramètres', 'backup', 'logs'
                ],
                'domain_contexts': {
                    'Healthcare': ['patient', 'médical', 'hôpital', 'prescription', 'diagnostic'],
                    'Finance': ['paiement', 'transaction', 'portefeuille', 'trading', 'fraude'],
                    'Education': ['cours', 'étudiant', 'évaluation', 'certificat', 'apprentissage'],
                    'Technology': ['cloud', 'microservice', 'container', 'ci/cd', 'monitoring'],
                    'Retail': ['produit', 'commande', 'inventaire', 'client', 'promotion'],
                    'Media': ['contenu', 'streaming', 'publication', 'commentaire', 'partage'],
                    'Logistics': ['livraison', 'tracking', 'entrepôt', 'transport', 'route'],
                    'Energy': ['capteur', 'consommation', 'smart grid', 'maintenance', 'monitoring']
                },
                'complexity_modifiers': {
                    'simple': ['basique', 'simple', 'standard'],
                    'moyen': ['avancé', 'complet', 'robuste'],
                    'complexe': ['sophistiqué', 'haute performance', 'distribué'],
                    'expert': ['intelligent', 'prédictif', 'temps réel', 'scalable']
                }
            },
            'english': {
                'action_verbs': [
                    'develop', 'create', 'implement', 'build', 'design', 'optimize',
                    'integrate', 'analyze', 'test', 'validate', 'secure', 'configure',
                    'deploy', 'maintain', 'document', 'train', 'monitor'
                ],
                'task_objects': [
                    'api', 'interface', 'database', 'system', 'module', 'service',
                    'authentication', 'dashboard', 'report', 'notification', 'payment',
                    'search', 'chat', 'profile', 'settings', 'backup', 'logs'
                ],
                'domain_contexts': {
                    'Healthcare': ['patient', 'medical', 'hospital', 'prescription', 'diagnosis'],
                    'Finance': ['payment', 'transaction', 'portfolio', 'trading', 'fraud'],
                    'Education': ['course', 'student', 'assessment', 'certificate', 'learning'],
                    'Technology': ['cloud', 'microservice', 'container', 'ci/cd', 'monitoring'],
                    'Retail': ['product', 'order', 'inventory', 'customer', 'promotion'],
                    'Media': ['content', 'streaming', 'publication', 'comment', 'sharing'],
                    'Logistics': ['delivery', 'tracking', 'warehouse', 'transport', 'route'],
                    'Energy': ['sensor', 'consumption', 'smart grid', 'maintenance', 'monitoring']
                },
                'complexity_modifiers': {
                    'simple': ['basic', 'simple', 'standard'],
                    'moyen': ['advanced', 'complete', 'robust'],
                    'complexe': ['sophisticated', 'high performance', 'distributed'],
                    'expert': ['intelligent', 'predictive', 'real-time', 'scalable']
                }
            }
        }
        
        # Catégories de tâches techniques
        self.task_categories = {
            'backend': {
                'french': ['backend', 'serveur', 'api', 'base de données', 'logique métier'],
                'english': ['backend', 'server', 'api', 'database', 'business logic']
            },
            'frontend': {
                'french': ['frontend', 'interface', 'ui', 'ux', 'design'],
                'english': ['frontend', 'interface', 'ui', 'ux', 'design']
            },
            'security': {
                'french': ['sécurité', 'authentification', 'autorisation', 'chiffrement'],
                'english': ['security', 'authentication', 'authorization', 'encryption']
            },
            'testing': {
                'french': ['test', 'validation', 'qualité', 'bug'],
                'english': ['test', 'validation', 'quality', 'bug']
            },
            'devops': {
                'french': ['déploiement', 'ci/cd', 'infrastructure', 'monitoring'],
                'english': ['deployment', 'ci/cd', 'infrastructure', 'monitoring']
            },
            'integration': {
                'french': ['intégration', 'connecteur', 'webhook', 'synchronisation'],
                'english': ['integration', 'connector', 'webhook', 'synchronization']
            },
            'analytics': {
                'french': ['analytique', 'rapport', 'statistique', 'métriques'],
                'english': ['analytics', 'report', 'statistics', 'metrics']
            },
            'documentation': {
                'french': ['documentation', 'guide', 'manuel', 'formation'],
                'english': ['documentation', 'guide', 'manual', 'training']
            }
        }
        
        # Niveaux de priorité
        self.priority_indicators = {
            'french': {
                'HIGH': ['critique', 'urgent', 'essentiel', 'bloquant', 'sécurité'],
                'MEDIUM': ['important', 'nécessaire', 'standard', 'recommandé'],
                'LOW': ['optionnel', 'amélioration', 'bonus', 'futur', 'nice-to-have']
            },
            'english': {
                'HIGH': ['critical', 'urgent', 'essential', 'blocking', 'security'],
                'MEDIUM': ['important', 'necessary', 'standard', 'recommended'],
                'LOW': ['optional', 'improvement', 'bonus', 'future', 'nice-to-have']
            }
        }
    
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour',
            'développer', 'créer', 'système', 'application', 'interface', 'base',
            'données', 'utilisateur', 'gestion', 'sécurité'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or',
            'develop', 'create', 'system', 'application', 'interface', 'database',
            'user', 'management', 'security'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            # Vérifier les caractères accentués
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'
    
    def analyze_task_patterns(self, text: str) -> Dict[str, Any]:
        """Analyser les patterns de tâches dans le texte"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        patterns = self.language_patterns[language]
        
        # Extraire les verbes d'action
        detected_actions = [verb for verb in patterns['action_verbs'] if verb in text_lower]
        
        # Extraire les objets de tâches
        detected_objects = [obj for obj in patterns['task_objects'] if obj in text_lower]
        
        # Analyser le contexte de domaine
        domain_matches = {}
        for domain, keywords in patterns['domain_contexts'].items():
            matches = [keyword for keyword in keywords if keyword in text_lower]
            if matches:
                domain_matches[domain] = matches
        
        # Détecter la complexité
        detected_complexity = 'moyen'  # par défaut
        for complexity, modifiers in patterns['complexity_modifiers'].items():
            if any(modifier in text_lower for modifier in modifiers):
                detected_complexity = complexity
                break
        
        # Analyser les catégories de tâches
        category_scores = {}
        for category, keywords in self.task_categories.items():
            lang_keywords = keywords[language]
            score = sum(1 for keyword in lang_keywords if keyword in text_lower)
            if score > 0:
                category_scores[category] = score
        
        return {
            'language': language,
            'detected_actions': detected_actions,
            'detected_objects': detected_objects,
            'domain_matches': domain_matches,
            'detected_complexity': detected_complexity,
            'category_scores': category_scores,
            'text_length': len(text),
            'word_count': len(text.split())
        }


class MLTaskFeatureExtractor:
    """Extracteur de features spécialisé pour la génération de tâches ML"""
    
    def __init__(self):
        self.pattern_analyzer = MultilingualTaskPatternAnalyzer()
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 3),
            min_df=1,
            max_df=0.9
        )
        
        # Stop words multilingues
        self.stop_words = set()
        try:
            self.stop_words.update(stopwords.words('french'))
            self.stop_words.update(stopwords.words('english'))
        except:
            pass
    
    def extract_task_generation_features(self, text: str, industry: str, complexity: str) -> Dict[str, float]:
        """Extraire les features pour la génération de tâches"""
        pattern_analysis = self.pattern_analyzer.analyze_task_patterns(text)
        language = pattern_analysis['language']
        
        features = {}
        
        # 1. Features de base
        features['text_length'] = len(text)
        features['word_count'] = len(text.split())
        features['sentence_count'] = len(sent_tokenize(text))
        
        # 2. Features d'actions détectées
        action_count = len(pattern_analysis['detected_actions'])
        features['action_verb_count'] = action_count
        features['action_density'] = action_count / features['word_count'] if features['word_count'] > 0 else 0
        
        # 3. Features d'objets détectés
        object_count = len(pattern_analysis['detected_objects'])
        features['task_object_count'] = object_count
        features['object_density'] = object_count / features['word_count'] if features['word_count'] > 0 else 0
        
        # 4. Features de domaine
        domain_diversity = len(pattern_analysis['domain_matches'])
        features['domain_diversity'] = domain_diversity
        features['domain_specificity'] = 1.0 if industry in pattern_analysis['domain_matches'] else 0.0
        
        # 5. Features de complexité
        complexity_mapping = {'simple': 1, 'moyen': 2, 'complexe': 3, 'expert': 4}
        features['complexity_score'] = complexity_mapping.get(complexity, 2)
        features['detected_complexity_match'] = 1.0 if pattern_analysis['detected_complexity'] == complexity else 0.0
        
        # 6. Features de catégories
        for category in self.pattern_analyzer.task_categories.keys():
            score = pattern_analysis['category_scores'].get(category, 0)
            features[f'{category}_indicator'] = score
        
        # 7. Features linguistiques
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
        
        # 8. Features d'industrie
        industry_boost = self._get_industry_complexity_boost(industry)
        features['industry_complexity_boost'] = industry_boost
        
        return features
    
    def _get_industry_complexity_boost(self, industry: str) -> float:
        """Obtenir le boost de complexité par industrie"""
        boosts = {
            'Healthcare': 0.8,
            'Finance': 0.9,
            'Energy': 1.0,
            'Logistics': 0.6,
            'Technology': 0.4,
            'Education': 0.3,
            'Retail': 0.4,
            'Media': 0.3
        }
        return boosts.get(industry, 0.5)


class MLTaskGenerator:
    """Générateur de tâches basé entièrement sur ML multilingue"""
    
    def __init__(self):
        self.pattern_analyzer = MultilingualTaskPatternAnalyzer()
        self.feature_extractor = MLTaskFeatureExtractor()
        
        # Modèles ML
        self.task_category_classifier = None
        self.task_priority_predictor = None
        self.task_complexity_estimator = None
        
        # Encodeurs
        self.category_encoder = LabelEncoder()
        self.priority_encoder = LabelEncoder()
        
        # État d'entraînement
        self.is_trained = False
        
        # Cache
        self.generation_cache = {}
        
        # Dataset d'entraînement
        self.training_data = []
    
    def load_training_dataset(self) -> pd.DataFrame:
        """Charger le dataset d'entraînement de tâches multilingues"""
        training_samples = [
            # Tâches Backend
            ("Développer API utilisateurs avec authentification JWT", "backend", "HIGH", 24, "Technology", "complexe", "french"),
            ("Créer endpoints REST pour gestion produits", "backend", "HIGH", 20, "Retail", "moyen", "french"),
            ("Implémenter service de paiement Stripe", "backend", "HIGH", 32, "Finance", "complexe", "french"),
            ("Configurer base de données PostgreSQL", "backend", "MEDIUM", 16, "Technology", "moyen", "french"),
            ("Optimiser performances API avec cache Redis", "backend", "MEDIUM", 28, "Technology", "complexe", "french"),
            ("Développer microservice de notifications", "backend", "MEDIUM", 24, "Technology", "moyen", "french"),
            ("Sécuriser API avec rate limiting", "backend", "HIGH", 20, "Technology", "moyen", "french"),
            
            ("Develop user API with JWT authentication", "backend", "HIGH", 24, "Technology", "complexe", "english"),
            ("Create REST endpoints for product management", "backend", "HIGH", 20, "Retail", "moyen", "english"),
            ("Implement Stripe payment service", "backend", "HIGH", 32, "Finance", "complexe", "english"),
            ("Configure PostgreSQL database", "backend", "MEDIUM", 16, "Technology", "moyen", "english"),
            ("Optimize API performance with Redis cache", "backend", "MEDIUM", 28, "Technology", "complexe", "english"),
            ("Develop notifications microservice", "backend", "MEDIUM", 24, "Technology", "moyen", "english"),
            ("Secure API with rate limiting", "backend", "HIGH", 20, "Technology", "moyen", "english"),
            
            # Tâches Frontend
            ("Créer interface dashboard administrateur", "frontend", "HIGH", 32, "Technology", "moyen", "french"),
            ("Développer composants React réutilisables", "frontend", "MEDIUM", 24, "Technology", "moyen", "french"),
            ("Implémenter responsive design mobile", "frontend", "MEDIUM", 28, "Technology", "moyen", "french"),
            ("Créer formulaires avec validation", "frontend", "MEDIUM", 20, "Technology", "simple", "french"),
            ("Développer interface de chat temps réel", "frontend", "HIGH", 36, "Technology", "complexe", "french"),
            ("Optimiser performance frontend avec lazy loading", "frontend", "MEDIUM", 24, "Technology", "complexe", "french"),
            ("Créer interface de profil utilisateur", "frontend", "MEDIUM", 18, "Technology", "simple", "french"),
            
            ("Create admin dashboard interface", "frontend", "HIGH", 32, "Technology", "moyen", "english"),
            ("Develop reusable React components", "frontend", "MEDIUM", 24, "Technology", "moyen", "english"),
            ("Implement responsive mobile design", "frontend", "MEDIUM", 28, "Technology", "moyen", "english"),
            ("Create forms with validation", "frontend", "MEDIUM", 20, "Technology", "simple", "english"),
            ("Develop real-time chat interface", "frontend", "HIGH", 36, "Technology", "complexe", "english"),
            ("Optimize frontend performance with lazy loading", "frontend", "MEDIUM", 24, "Technology", "complexe", "english"),
            ("Create user profile interface", "frontend", "MEDIUM", 18, "Technology", "simple", "english"),
            
            # Tâches Sécurité
            ("Implémenter authentification OAuth2", "security", "HIGH", 28, "Technology", "complexe", "french"),
            ("Configurer HTTPS et certificats SSL", "security", "HIGH", 16, "Technology", "moyen", "french"),
            ("Développer système de gestion des rôles", "security", "HIGH", 24, "Technology", "moyen", "french"),
            ("Auditer sécurité application", "security", "HIGH", 20, "Technology", "moyen", "french"),
            ("Implémenter chiffrement données sensibles", "security", "HIGH", 32, "Healthcare", "complexe", "french"),
            ("Configurer pare-feu application", "security", "HIGH", 18, "Technology", "moyen", "french"),
            ("Développer détection d'intrusion", "security", "HIGH", 40, "Finance", "expert", "french"),
            
            ("Implement OAuth2 authentication", "security", "HIGH", 28, "Technology", "complexe", "english"),
            ("Configure HTTPS and SSL certificates", "security", "HIGH", 16, "Technology", "moyen", "english"),
            ("Develop role management system", "security", "HIGH", 24, "Technology", "moyen", "english"),
            ("Security audit application", "security", "HIGH", 20, "Technology", "moyen", "english"),
            ("Implement sensitive data encryption", "security", "HIGH", 32, "Healthcare", "complexe", "english"),
            ("Configure application firewall", "security", "HIGH", 18, "Technology", "moyen", "english"),
            ("Develop intrusion detection", "security", "HIGH", 40, "Finance", "expert", "english"),
            
            # Tâches Testing
            ("Créer tests unitaires backend", "testing", "MEDIUM", 24, "Technology", "moyen", "french"),
            ("Développer tests d'intégration API", "testing", "MEDIUM", 20, "Technology", "moyen", "french"),
            ("Implémenter tests end-to-end", "testing", "MEDIUM", 32, "Technology", "complexe", "french"),
            ("Configurer tests de performance", "testing", "MEDIUM", 28, "Technology", "complexe", "french"),
            ("Créer tests de sécurité automatisés", "testing", "HIGH", 24, "Technology", "complexe", "french"),
            ("Développer tests de charge", "testing", "MEDIUM", 20, "Technology", "moyen", "french"),
            ("Implémenter tests de régression", "testing", "MEDIUM", 16, "Technology", "moyen", "french"),
            
            ("Create backend unit tests", "testing", "MEDIUM", 24, "Technology", "moyen", "english"),
            ("Develop API integration tests", "testing", "MEDIUM", 20, "Technology", "moyen", "english"),
            ("Implement end-to-end tests", "testing", "MEDIUM", 32, "Technology", "complexe", "english"),
            ("Configure performance tests", "testing", "MEDIUM", 28, "Technology", "complexe", "english"),
            ("Create automated security tests", "testing", "HIGH", 24, "Technology", "complexe", "english"),
            ("Develop load tests", "testing", "MEDIUM", 20, "Technology", "moyen", "english"),
            ("Implement regression tests", "testing", "MEDIUM", 16, "Technology", "moyen", "english"),
            
            # Tâches DevOps
            ("Configurer pipeline CI/CD", "devops", "HIGH", 32, "Technology", "complexe", "french"),
            ("Implémenter déploiement automatique", "devops", "HIGH", 28, "Technology", "complexe", "french"),
            ("Configurer monitoring application", "devops", "HIGH", 24, "Technology", "moyen", "french"),
            ("Créer infrastructure Docker", "devops", "MEDIUM", 20, "Technology", "moyen", "french"),
            ("Implémenter backup automatique", "devops", "MEDIUM", 16, "Technology", "moyen", "french"),
            ("Configurer logs centralisés", "devops", "MEDIUM", 18, "Technology", "moyen", "french"),
            ("Développer scripts de déploiement", "devops", "MEDIUM", 22, "Technology", "moyen", "french"),
            
            ("Configure CI/CD pipeline", "devops", "HIGH", 32, "Technology", "complexe", "english"),
            ("Implement automatic deployment", "devops", "HIGH", 28, "Technology", "complexe", "english"),
            ("Configure application monitoring", "devops", "HIGH", 24, "Technology", "moyen", "english"),
            ("Create Docker infrastructure", "devops", "MEDIUM", 20, "Technology", "moyen", "english"),
            ("Implement automatic backup", "devops", "MEDIUM", 16, "Technology", "moyen", "english"),
            ("Configure centralized logs", "devops", "MEDIUM", 18, "Technology", "moyen", "english"),
            ("Develop deployment scripts", "devops", "MEDIUM", 22, "Technology", "moyen", "english"),
            
            # Tâches spécifiques Healthcare
            ("Valider conformité HIPAA", "security", "HIGH", 32, "Healthcare", "complexe", "french"),
            ("Développer dossier médical électronique", "backend", "HIGH", 48, "Healthcare", "expert", "french"),
            ("Créer interface télémédecine", "frontend", "HIGH", 40, "Healthcare", "complexe", "french"),
            ("Implémenter prescription électronique", "backend", "HIGH", 36, "Healthcare", "complexe", "french"),
            ("Configurer chiffrement données patients", "security", "HIGH", 28, "Healthcare", "complexe", "french"),
            
            ("Validate HIPAA compliance", "security", "HIGH", 32, "Healthcare", "complexe", "english"),
            ("Develop electronic medical record", "backend", "HIGH", 48, "Healthcare", "expert", "english"),
            ("Create telemedicine interface", "frontend", "HIGH", 40, "Healthcare", "complexe", "english"),
            ("Implement electronic prescription", "backend", "HIGH", 36, "Healthcare", "complexe", "english"),
            ("Configure patient data encryption", "security", "HIGH", 28, "Healthcare", "complexe", "english"),
            
            # Tâches spécifiques Finance
            ("Développer algorithme trading", "backend", "HIGH", 60, "Finance", "expert", "french"),
            ("Implémenter détection fraude", "backend", "HIGH", 48, "Finance", "expert", "french"),
            ("Créer interface portefeuille", "frontend", "HIGH", 32, "Finance", "complexe", "french"),
            ("Configurer conformité PCI-DSS", "security", "HIGH", 36, "Finance", "complexe", "french"),
            ("Développer reporting financier", "analytics", "MEDIUM", 28, "Finance", "complexe", "french"),
            
            ("Develop trading algorithm", "backend", "HIGH", 60, "Finance", "expert", "english"),
            ("Implement fraud detection", "backend", "HIGH", 48, "Finance", "expert", "english"),
            ("Create portfolio interface", "frontend", "HIGH", 32, "Finance", "complexe", "english"),
            ("Configure PCI-DSS compliance", "security", "HIGH", 36, "Finance", "complexe", "english"),
            ("Develop financial reporting", "analytics", "MEDIUM", 28, "Finance", "complexe", "english"),
            
            # Tâches spécifiques Education
            ("Développer parcours adaptatif", "backend", "HIGH", 40, "Education", "expert", "french"),
            ("Créer système évaluation", "backend", "MEDIUM", 32, "Education", "complexe", "french"),
            ("Implémenter classes virtuelles", "integration", "HIGH", 36, "Education", "complexe", "french"),
            ("Développer suivi progression", "analytics", "MEDIUM", 24, "Education", "moyen", "french"),
            ("Créer certificats automatiques", "backend", "MEDIUM", 20, "Education", "moyen", "french"),
            
            ("Develop adaptive learning path", "backend", "HIGH", 40, "Education", "expert", "english"),
            ("Create evaluation system", "backend", "MEDIUM", 32, "Education", "complexe", "english"),
            ("Implement virtual classrooms", "integration", "HIGH", 36, "Education", "complexe", "english"),
            ("Develop progress tracking", "analytics", "MEDIUM", 24, "Education", "moyen", "english"),
            ("Create automatic certificates", "backend", "MEDIUM", 20, "Education", "moyen", "english")
        ]
        
        df = pd.DataFrame(training_samples, columns=[
            'task_name', 'category', 'priority', 'estimated_hours', 'industry', 'complexity', 'language'
        ])
        
        print(f"Dataset d'entraînement de tâches créé : {len(df)} échantillons")
        return df
    
    def train_models(self):
        """Entraîner les modèles ML de génération de tâches"""
        if self.is_trained:
            return
        
        print("Entraînement des modèles ML de génération de tâches...")
        
        # Charger les données
        df = self.load_training_dataset()
        
        # Extraire les features
        print("Extraction des features...")
        feature_matrix = []
        for _, row in df.iterrows():
            features = self.feature_extractor.extract_task_generation_features(
                row['task_name'], 
                row['industry'], 
                row['complexity']
            )
            feature_matrix.append(list(features.values()))
        
        X = np.array(feature_matrix)
        
        # Entraîner le classificateur de catégorie
        print("Entraînement du classificateur de catégorie...")
        y_category = self.category_encoder.fit_transform(df['category'])
        
        self.task_category_classifier = VotingClassifier([
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')),
            ('svm', SVC(probability=True, random_state=42, class_weight='balanced')),
            ('nb', MultinomialNB())
        ], voting='soft')
        
        self.task_category_classifier.fit(X, y_category)
        
        # Entraîner le prédicteur de priorité
        print("Entraînement du prédicteur de priorité...")
        y_priority = self.priority_encoder.fit_transform(df['priority'])
        
        self.task_priority_predictor = RandomForestClassifier(
            n_estimators=100, 
            random_state=42,
            class_weight='balanced'
        )
        self.task_priority_predictor.fit(X, y_priority)
        
        # Entraîner l'estimateur de complexité (heures)
        print("Entraînement de l'estimateur de complexité...")
        y_hours = df['estimated_hours'].values
        
        from sklearn.ensemble import RandomForestRegressor
        self.task_complexity_estimator = RandomForestRegressor(
            n_estimators=100,
            random_state=42
        )
        self.task_complexity_estimator.fit(X, y_hours)
        
        # Évaluation
        self._evaluate_models(X, y_category, y_priority, y_hours)
        
        self.is_trained = True
        print("Modèles ML de génération de tâches entraînés avec succès!")
    
    def _evaluate_models(self, X, y_category, y_priority, y_hours):
        """Évaluer les performances des modèles"""
        try:
            X_train, X_test, y_cat_train, y_cat_test = train_test_split(
                X, y_category, test_size=0.2, random_state=42, stratify=y_category
            )
            
            # Évaluation catégorie
            cat_pred = self.task_category_classifier.predict(X_test)
            cat_accuracy = accuracy_score(y_cat_test, cat_pred)
            
            # Évaluation priorité
            _, _, y_prio_train, y_prio_test = train_test_split(
                X, y_priority, test_size=0.2, random_state=42, stratify=y_priority
            )
            prio_pred = self.task_priority_predictor.predict(X_test)
            prio_accuracy = accuracy_score(y_prio_test, prio_pred)
            
            # Évaluation heures
            _, _, y_hours_train, y_hours_test = train_test_split(
                X, y_hours, test_size=0.2, random_state=42
            )
            hours_pred = self.task_complexity_estimator.predict(X_test)
            hours_rmse = np.sqrt(np.mean((y_hours_test - hours_pred) ** 2))
            
            print(f"Évaluation - Catégorie: {cat_accuracy:.3f}, Priorité: {prio_accuracy:.3f}, Heures RMSE: {hours_rmse:.1f}")
            
            # Distribution des prédictions
            from collections import Counter
            predicted_categories = self.category_encoder.inverse_transform(cat_pred)
            predicted_priorities = self.priority_encoder.inverse_transform(prio_pred)
            
            print(f"Distribution catégories : {Counter(predicted_categories)}")
            print(f"Distribution priorités : {Counter(predicted_priorities)}")
            
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
    
    def generate_tasks_from_description(self, project_description: str, industry: str, complexity: str, max_tasks: int = 5) -> List[Dict[str, Any]]:
        """Générer des tâches ML pure à partir de la description du projet"""
        if not self.is_trained:
            self.train_models()
        
        detected_language = self.pattern_analyzer.detect_language(project_description)
        print(f"Génération de {max_tasks} tâches en {detected_language} pour: {project_description[:50]}...")
        
        # Analyser le projet pour extraire les concepts
        project_concepts = self._extract_project_concepts(project_description, industry, detected_language)
        
        # Générer un large pool de tâches candidates
        generated_pool = self._generate_large_task_pool(project_concepts, industry, complexity, detected_language)
        
        # Sélectionner les meilleures tâches
        top_tasks = self._select_top_tasks(generated_pool, project_description, max_tasks * 3)
        
        # Finaliser la sélection
        final_tasks = self._select_final_tasks(top_tasks, project_description, max_tasks)
        
        print(f"Génération terminée: {len(final_tasks)} tâches créées en {detected_language}")
        return final_tasks
    
    def _extract_project_concepts(self, description: str, industry: str, language: str) -> Dict[str, List[str]]:
        """Extraire les concepts clés du projet"""
        tokens = word_tokenize(description.lower())
        pos_tags = pos_tag(tokens)
        
        patterns = self.pattern_analyzer.language_patterns[language]
        
        concepts = {
            'actions': [],
            'objects': [],
            'technologies': [],
            'features': [],
            'domain_specifics': []
        }
        
        # Extraire les actions
        for word in tokens:
            if word in patterns['action_verbs']:
                concepts['actions'].append(word)
        
        # Extraire les objets de tâches
        for word in tokens:
            if word in patterns['task_objects']:
                concepts['objects'].append(word)
        
        # Extraire les technologies
        if language == 'french':
            tech_keywords = ['api', 'web', 'mobile', 'base', 'données', 'ia', 'ml', 'blockchain', 'cloud', 'iot']
        else:
            tech_keywords = ['api', 'web', 'mobile', 'database', 'ai', 'ml', 'blockchain', 'cloud', 'iot']
        
        for word in tokens:
            if word in tech_keywords:
                concepts['technologies'].append(word)
        
        # Extraire les features
        if language == 'french':
            feature_keywords = ['authentification', 'paiement', 'notification', 'recherche', 'chat', 'dashboard']
        else:
            feature_keywords = ['authentication', 'payment', 'notification', 'search', 'chat', 'dashboard']
        
        for word in tokens:
            if word in feature_keywords:
                concepts['features'].append(word)
        
        # Extraire les spécificités du domaine
        if industry in patterns['domain_contexts']:
            domain_keywords = patterns['domain_contexts'][industry]
            for word in tokens:
                if word in domain_keywords:
                    concepts['domain_specifics'].append(word)
        
        return concepts
    
    def _generate_large_task_pool(self, concepts: Dict[str, List[str]], industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
        """Générer un large pool de tâches candidates"""
        task_pool = []
        patterns = self.pattern_analyzer.language_patterns[language]
        
        # Valeurs par défaut si les concepts sont vides
        if language == 'french':
            default_actions = ['développer', 'créer', 'implémenter', 'configurer']
            default_objects = ['système', 'interface', 'service', 'module']
            default_technologies = ['api', 'base de données', 'web', 'mobile']
        else:
            default_actions = ['develop', 'create', 'implement', 'configure']
            default_objects = ['system', 'interface', 'service', 'module']
            default_technologies = ['api', 'database', 'web', 'mobile']
        
        actions = concepts['actions'] if concepts['actions'] else default_actions
        objects = concepts['objects'] if concepts['objects'] else default_objects
        technologies = concepts['technologies'] if concepts['technologies'] else default_technologies
        
        # 1. Tâches basées sur actions × objets
        for action in actions[:4]:
            for obj in objects[:4]:
                task_name = f"{action.title()} {obj}"
                task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
        
        # 2. Tâches basées sur les technologies
        for tech in technologies[:5]:
            if language == 'french':
                task_name = f"Implémenter {tech}"
                task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
                task_name = f"Configurer {tech}"
                task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
            else:
                task_name = f"Implement {tech}"
                task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
                task_name = f"Configure {tech}"
                task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
        
        # 3. Tâches basées sur les features
        for feature in concepts['features'][:4]:
            if language == 'french':
                task_name = f"Développer module {feature}"
            else:
                task_name = f"Develop {feature} module"
            task_pool.append(self._create_ml_task(task_name, concepts, industry, complexity, language))
        
        # 4. Tâches spécifiques au domaine
        domain_tasks = self._generate_domain_specific_tasks(industry, complexity, language)
        task_pool.extend(domain_tasks)
        
        # 5. Tâches selon la complexité
        complexity_tasks = self._generate_complexity_based_tasks(complexity, industry, language)
        task_pool.extend(complexity_tasks)
        
        # 6. Tâches par catégorie technique
        category_tasks = self._generate_category_based_tasks(concepts, industry, complexity, language)
        task_pool.extend(category_tasks)
        
        return task_pool[:60]  # Limiter à 60 tâches candidates
    
    def _create_ml_task(self, name: str, concepts: Dict[str, List[str]], industry: str, complexity: str, language: str) -> Dict[str, Any]:
        """Créer une tâche avec prédictions ML"""
        # Extraire les features pour cette tâche
        features = self.feature_extractor.extract_task_generation_features(name, industry, complexity)
        X = np.array([list(features.values())])
        
        # Prédire la catégorie
        try:
            category_pred = self.task_category_classifier.predict(X)[0]
            category = self.category_encoder.inverse_transform([category_pred])[0]
        except:
            category = self._predict_category_fallback(name, language)
        
        # Prédire la priorité
        try:
            priority_pred = self.task_priority_predictor.predict(X)[0]
            priority = self.priority_encoder.inverse_transform([priority_pred])[0]
        except:
            priority = self._predict_priority_fallback(name, complexity, language)
        
        # Prédire les heures
        try:
            estimated_hours = max(int(self.task_complexity_estimator.predict(X)[0]), 8)
        except:
            estimated_hours = self._calculate_hours_fallback(category, complexity)
        
        # Générer la description
        description = self._generate_task_description(name, industry, concepts, language)
        
        # Calculer le score de pertinence
        relevance_score = self._calculate_relevance_score(name, concepts, industry, complexity)
        
        return {
            'name': name,
            'category': category,
            'priority': priority,
            'description': description,
            'estimatedHours': estimated_hours,
            'tags': [industry.lower(), complexity, category, language],
            'language': language,
            'relevance_score': relevance_score,
            'generated_by': 'ml_model'
        }
    
    def _generate_domain_specific_tasks(self, industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
        """Générer des tâches spécifiques au domaine"""
        domain_tasks = []
        
        if language == 'french':
            domain_patterns = {
                'Healthcare': [
                    'Valider conformité HIPAA',
                    'Sécuriser données patients',
                    'Implémenter télémédecine',
                    'Créer dossier médical électronique',
                    'Développer prescription électronique'
                ],
                'Finance': [
                    'Implémenter détection fraude',
                    'Développer algorithme trading',
                    'Sécuriser transactions',
                    'Créer rapport financier',
                    'Configurer conformité PCI-DSS'
                ],
                'Education': [
                    'Développer parcours adaptatif',
                    'Créer système évaluation',
                    'Implémenter classe virtuelle',
                    'Générer certificats',
                    'Suivre progression étudiants'
                ],
                'Technology': [
                    'Optimiser performance système',
                    'Implémenter microservices',
                    'Développer pipeline CI/CD',
                    'Créer monitoring',
                    'Configurer infrastructure cloud'
                ],
                'Retail': [
                    'Développer panier achat',
                    'Implémenter paiement',
                    'Créer gestion stock',
                    'Développer recommandations',
                    'Configurer livraison'
                ],
                'Media': [
                    'Développer streaming',
                    'Créer gestion contenu',
                    'Implémenter commentaires',
                    'Configurer CDN',
                    'Développer recommandations'
                ],
                'Logistics': [
                    'Développer tracking',
                    'Optimiser routes',
                    'Créer gestion entrepôt',
                    'Implémenter GPS',
                    'Configurer alerts'
                ],
                'Energy': [
                    'Développer monitoring IoT',
                    'Créer smart grid',
                    'Implémenter capteurs',
                    'Optimiser consommation',
                    'Configurer maintenance'
                ]
            }
        else:
            domain_patterns = {
                'Healthcare': [
                    'Validate HIPAA compliance',
                    'Secure patient data',
                    'Implement telemedicine',
                    'Create electronic medical record',
                    'Develop electronic prescription'
                ],
                'Finance': [
                    'Implement fraud detection',
                    'Develop trading algorithm',
                    'Secure transactions',
                    'Create financial report',
                    'Configure PCI-DSS compliance'
                ],
                'Education': [
                    'Develop adaptive learning',
                    'Create evaluation system',
                    'Implement virtual classroom',
                    'Generate certificates',
                    'Track student progress'
                ],
                'Technology': [
                    'Optimize system performance',
                    'Implement microservices',
                    'Develop CI/CD pipeline',
                    'Create monitoring',
                    'Configure cloud infrastructure'
                ],
                'Retail': [
                    'Develop shopping cart',
                    'Implement payment',
                    'Create inventory management',
                    'Develop recommendations',
                    'Configure delivery'
                ],
                'Media': [
                    'Develop streaming',
                    'Create content management',
                    'Implement comments',
                    'Configure CDN',
                    'Develop recommendations'
                ],
                'Logistics': [
                    'Develop tracking',
                    'Optimize routes',
                    'Create warehouse management',
                    'Implement GPS',
                    'Configure alerts'
                ],
                'Energy': [
                    'Develop IoT monitoring',
                    'Create smart grid',
                    'Implement sensors',
                    'Optimize consumption',
                    'Configure maintenance'
                ]
            }
        
        if industry in domain_patterns:
            for task_name in domain_patterns[industry][:6]:
                domain_tasks.append(self._create_ml_task(task_name, {}, industry, complexity, language))
        
        return domain_tasks
    
    def _generate_complexity_based_tasks(self, complexity: str, industry: str, language: str) -> List[Dict[str, Any]]:
        """Générer des tâches selon la complexité"""
        complexity_tasks = []
        
        if language == 'french':
            if complexity == 'expert':
                expert_tasks = [
                    'Architecturer système distribué',
                    'Implémenter machine learning',
                    'Développer intelligence artificielle',
                    'Optimiser performance avancée',
                    'Créer architecture microservices'
                ]
            elif complexity == 'complexe':
                expert_tasks = [
                    'Développer API avancée',
                    'Implémenter cache distribué',
                    'Créer monitoring avancé',
                    'Optimiser base données',
                    'Configurer haute disponibilité'
                ]
            elif complexity == 'moyen':
                expert_tasks = [
                    'Développer API REST',
                    'Implémenter authentification',
                    'Créer interface utilisateur',
                    'Configurer base données',
                    'Développer tests automatisés'
                ]
            else:  # simple
                expert_tasks = [
                    'Créer pages statiques',
                    'Implémenter CRUD basique',
                    'Configurer projet',
                    'Créer documentation',
                    'Développer formulaires'
                ]
        else:
            if complexity == 'expert':
                expert_tasks = [
                    'Architect distributed system',
                    'Implement machine learning',
                    'Develop artificial intelligence',
                    'Optimize advanced performance',
                    'Create microservices architecture'
                ]
            elif complexity == 'complexe':
                expert_tasks = [
                    'Develop advanced API',
                    'Implement distributed cache',
                    'Create advanced monitoring',
                    'Optimize database',
                    'Configure high availability'
                ]
            elif complexity == 'moyen':
                expert_tasks = [
                    'Develop REST API',
                    'Implement authentication',
                    'Create user interface',
                    'Configure database',
                    'Develop automated tests'
                ]
            else:  # simple
                expert_tasks = [
                    'Create static pages',
                    'Implement basic CRUD',
                    'Configure project',
                    'Create documentation',
                    'Develop forms'
                ]
        
        for task_name in expert_tasks:
            complexity_tasks.append(self._create_ml_task(task_name, {}, industry, complexity, language))
        
        return complexity_tasks
    
    def _generate_category_based_tasks(self, concepts: Dict[str, List[str]], industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
        """Générer des tâches par catégorie technique"""
        category_tasks = []
        
        if language == 'french':
            category_templates = {
                'backend': [
                    'Développer API REST',
                    'Créer logique métier',
                    'Configurer base données',
                    'Implémenter authentification'
                ],
                'frontend': [
                    'Créer interface utilisateur',
                    'Développer composants UI',
                    'Implémenter responsive design',
                    'Optimiser performance frontend'
                ],
                'security': [
                    'Implémenter sécurité',
                    'Configurer authentification',
                    'Sécuriser communications',
                    'Auditer sécurité'
                ],
                'testing': [
                    'Créer tests unitaires',
                    'Développer tests intégration',
                    'Implémenter tests e2e',
                    'Configurer tests automatisés'
                ],
                'devops': [
                    'Configurer CI/CD',
                    'Implémenter déploiement',
                    'Créer infrastructure',
                    'Configurer monitoring'
                ]
            }
        else:
            category_templates = {
                'backend': [
                    'Develop REST API',
                    'Create business logic',
                    'Configure database',
                    'Implement authentication'
                ],
                'frontend': [
                    'Create user interface',
                    'Develop UI components',
                    'Implement responsive design',
                    'Optimize frontend performance'
                ],
                'security': [
                    'Implement security',
                    'Configure authentication',
                    'Secure communications',
                    'Security audit'
                ],
                'testing': [
                    'Create unit tests',
                    'Develop integration tests',
                    'Implement e2e tests',
                    'Configure automated tests'
                ],
                'devops': [
                    'Configure CI/CD',
                    'Implement deployment',
                    'Create infrastructure',
                    'Configure monitoring'
                ]
            }
        
        # Générer 2 tâches par catégorie
        for category, templates in category_templates.items():
            for template in templates[:2]:
                category_tasks.append(self._create_ml_task(template, concepts, industry, complexity, language))
        
        return category_tasks
    
    def _select_top_tasks(self, task_pool: List[Dict[str, Any]], project_description: str, target_count: int) -> List[Dict[str, Any]]:
        """Sélectionner les meilleures tâches avec scoring ML"""
        # Calculer la similarité avec la description du projet
        project_words = set(project_description.lower().split())
        
        for task in task_pool:
            # Score de base (relevance_score déjà calculé)
            score = task.get('relevance_score', 0)
            
            # Bonus de similarité textuelle
            task_words = set(task['name'].lower().split())
            intersection = task_words.intersection(project_words)
            similarity = len(intersection) / len(task_words.union(project_words))
            score += similarity * 3
            
            # Bonus de priorité
            priority_bonus = {'HIGH': 2, 'MEDIUM': 1, 'LOW': 0}
            score += priority_bonus.get(task['priority'], 0)
            
            # Bonus de catégorie importante
            important_categories = ['backend', 'frontend', 'security']
            if task['category'] in important_categories:
                score += 1
            
            task['final_score'] = score
        
        # Trier par score et retourner le top
        task_pool.sort(key=lambda x: x['final_score'], reverse=True)
        return task_pool[:target_count]
    
    def _select_final_tasks(self, top_tasks: List[Dict[str, Any]], project_description: str, max_tasks: int) -> List[Dict[str, Any]]:
        """Sélection finale avec diversité"""
        final_tasks = []
        used_categories = set()
        
        # Priorité aux tâches HIGH avec diversité de catégories
        for task in top_tasks:
            if len(final_tasks) >= max_tasks:
                break
            
            if task['priority'] == 'HIGH' and task['category'] not in used_categories:
                final_tasks.append(task)
                used_categories.add(task['category'])
        
        # Compléter avec les meilleures tâches restantes
        for task in top_tasks:
            if len(final_tasks) >= max_tasks:
                break
            
            if task not in final_tasks:
                final_tasks.append(task)
        
        # Nettoyer les champs internes
        for task in final_tasks:
            task.pop('relevance_score', None)
            task.pop('final_score', None)
        
        return final_tasks[:max_tasks]
    
    def _calculate_relevance_score(self, name: str, concepts: Dict[str, List[str]], industry: str, complexity: str) -> float:
        """Calculer le score de pertinence d'une tâche"""
        score = 0.0
        name_lower = name.lower()
        
        # Score basé sur les concepts extraits
        for concept_type, concept_list in concepts.items():
            for concept in concept_list:
                if concept in name_lower:
                    score += 1.0
        
        # Score basé sur l'industrie
        patterns = self.pattern_analyzer.language_patterns['french']  # Par défaut
        if industry in patterns['domain_contexts']:
            domain_keywords = patterns['domain_contexts'][industry]
            for keyword in domain_keywords:
                if keyword in name_lower:
                    score += 1.5
        
        # Score basé sur la complexité
        complexity_keywords = patterns['complexity_modifiers'].get(complexity, [])
        for keyword in complexity_keywords:
            if keyword in name_lower:
                score += 1.0
        
        return score
    
    def _generate_task_description(self, name: str, industry: str, concepts: Dict[str, List[str]], language: str) -> str:
        """Générer une description intelligente pour la tâche"""
        name_lower = name.lower()
        
        if language == 'french':
            if any(word in name_lower for word in ['développer', 'créer']):
                return f"Développement et implémentation de {name_lower} pour le secteur {industry}"
            elif 'implémenter' in name_lower:
                return f"Implémentation technique de {name_lower} avec intégration système"
            elif 'configurer' in name_lower:
                return f"Configuration et paramétrage de {name_lower} selon les besoins"
            elif 'optimiser' in name_lower:
                return f"Optimisation et amélioration de {name_lower} pour les performances"
            elif 'tester' in name_lower:
                return f"Tests et validation de {name_lower} pour assurer la qualité"
            else:
                return f"Conception et réalisation de {name_lower} adapté au contexte {industry}"
        else:
            if any(word in name_lower for word in ['develop', 'create']):
                return f"Development and implementation of {name_lower} for {industry} sector"
            elif 'implement' in name_lower:
                return f"Technical implementation of {name_lower} with system integration"
            elif 'configure' in name_lower:
                return f"Configuration and setup of {name_lower} according to requirements"
            elif 'optimize' in name_lower:
                return f"Optimization and improvement of {name_lower} for performance"
            elif 'test' in name_lower:
                return f"Testing and validation of {name_lower} to ensure quality"
            else:
                return f"Design and implementation of {name_lower} adapted to {industry} context"
    
    def _predict_category_fallback(self, name: str, language: str) -> str:
        """Prédiction de catégorie de fallback"""
        name_lower = name.lower()
        
        if language == 'french':
            if any(word in name_lower for word in ['api', 'backend', 'serveur', 'base']):
                return 'backend'
            elif any(word in name_lower for word in ['interface', 'ui', 'frontend']):
                return 'frontend'
            elif any(word in name_lower for word in ['sécurité', 'auth', 'authentification']):
                return 'security'
            elif any(word in name_lower for word in ['test', 'validation']):
                return 'testing'
            elif any(word in name_lower for word in ['déploiement', 'ci/cd']):
                return 'devops'
            else:
                return 'backend'
        else:
            if any(word in name_lower for word in ['api', 'backend', 'server', 'database']):
                return 'backend'
            elif any(word in name_lower for word in ['interface', 'ui', 'frontend']):
                return 'frontend'
            elif any(word in name_lower for word in ['security', 'auth', 'authentication']):
                return 'security'
            elif any(word in name_lower for word in ['test', 'validation']):
                return 'testing'
            elif any(word in name_lower for word in ['deployment', 'ci/cd']):
                return 'devops'
            else:
                return 'backend'
    
    def _predict_priority_fallback(self, name: str, complexity: str, language: str) -> str:
        """Prédiction de priorité de fallback"""
        name_lower = name.lower()
        
        if language == 'french':
            high_keywords = ['sécurité', 'authentification', 'api', 'base', 'critique']
        else:
            high_keywords = ['security', 'authentication', 'api', 'database', 'critical']
        
        if any(keyword in name_lower for keyword in high_keywords):
            return 'HIGH'
        elif complexity in ['complexe', 'expert']:
            return 'HIGH'
        else:
            return 'MEDIUM'
    
    def _calculate_hours_fallback(self, category: str, complexity: str) -> int:
        """Calcul d'heures de fallback"""
        base_hours = {
            'backend': 28,
            'frontend': 24,
            'security': 32,
            'testing': 20,
            'devops': 24,
            'integration': 28,
            'analytics': 20,
            'documentation': 16
        }
        
        complexity_multipliers = {
            'simple': 0.7,
            'moyen': 1.0,
            'complexe': 1.4,
            'expert': 1.8
        }
        
        base = base_hours.get(category, 24)
        multiplier = complexity_multipliers.get(complexity, 1.0)
        
        return max(int(base * multiplier), 8)


# Application Flask
app = Flask(__name__)
CORS(app)

# Instance globale du générateur
task_generator = MLTaskGenerator()

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        expected_token = 'MLTaskGenerator2024!'
        
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
        'service': 'ML Task Generator',
        'version': '1.0.0',
        'supported_languages': ['français', 'english'],
        'supported_industries': [
            'Technology', 'Healthcare', 'Finance', 'Education',
            'Retail', 'Media', 'Logistics', 'Energy'
        ],
        'supported_complexities': ['simple', 'moyen', 'complexe', 'expert'],
        'task_categories': [
            'backend', 'frontend', 'security', 'testing', 
            'devops', 'integration', 'analytics', 'documentation'
        ],
        'features': [
            'Pure ML task generation',
            'Multilingual support (French/English)',
            'Industry-specific tasks',
            'Complexity-based generation',
            'Category and priority prediction',
            'Intelligent task description generation'
        ],
        'model_trained': task_generator.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/generate-tasks', methods=['POST'])
@authenticate
def generate_tasks():
    """Générer des tâches ML à partir d'une description de projet"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({'error': 'Description de projet requise'}), 400
        
        description = data['description']
        industry = data.get('industry', 'Technology')
        complexity = data.get('complexity', 'moyen')
        max_tasks = data.get('maxTasks', 5)
        
        # Validation
        if not description or len(description.strip()) < 10:
            return jsonify({'error': 'Description trop courte (minimum 10 caractères)'}), 400
        
        if industry not in ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Media', 'Logistics', 'Energy']:
            return jsonify({'error': 'Industrie non supportée'}), 400
        
        if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
            return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
        
        if not isinstance(max_tasks, int) or max_tasks < 1 or max_tasks > 25:
            return jsonify({'error': 'maxTasks doit être entre 1 et 25'}), 400
        
        # Génération des tâches
        tasks = task_generator.generate_tasks_from_description(
            description, industry, complexity, max_tasks
        )
        
        # Détection de langue
        detected_language = task_generator.pattern_analyzer.detect_language(description)
        
        # Statistiques
        stats = {
            'total_tasks': len(tasks),
            'by_category': {},
            'by_priority': {},
            'total_hours': sum(task['estimatedHours'] for task in tasks),
            'detected_language': detected_language
        }
        
        for task in tasks:
            category = task['category']
            priority = task['priority']
            
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
            stats['by_priority'][priority] = stats['by_priority'].get(priority, 0) + 1
        
        return jsonify({
            'success': True,
            'tasks': tasks,
            'stats': stats,
            'input_parameters': {
                'description': description[:100] + '...' if len(description) > 100 else description,
                'industry': industry,
                'complexity': complexity,
                'max_tasks': max_tasks
            },
            'generation_method': 'pure_ml_generation_multilingual',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/analyze-task-patterns', methods=['POST'])
@authenticate
def analyze_task_patterns():
    """Analyser les patterns de tâches dans un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis'}), 400
        
        text = data['text']
        
        analysis = task_generator.pattern_analyzer.analyze_task_patterns(text)
        
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

@app.route('/api/predict-task-attributes', methods=['POST'])
@authenticate
def predict_task_attributes():
    """Prédire les attributs d'une tâche (catégorie, priorité, heures)"""
    try:
        data = request.get_json()
        
        if not data or 'taskName' not in data:
            return jsonify({'error': 'Nom de tâche requis'}), 400
        
        task_name = data['taskName']
        industry = data.get('industry', 'Technology')
        complexity = data.get('complexity', 'moyen')
        
        if not task_generator.is_trained:
            task_generator.train_models()
        
        # Créer une tâche ML pour obtenir les prédictions
        ml_task = task_generator._create_ml_task(task_name, {}, industry, complexity, 'french')
        
        return jsonify({
            'success': True,
            'task_name': task_name,
            'predicted_attributes': {
                'category': ml_task['category'],
                'priority': ml_task['priority'],
                'estimated_hours': ml_task['estimatedHours'],
                'description': ml_task['description']
            },
            'input_parameters': {
                'industry': industry,
                'complexity': complexity
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/batch-generate', methods=['POST'])
@authenticate
def batch_generate():
    """Générer des tâches en batch pour plusieurs projets"""
    try:
        data = request.get_json()
        
        if not data or 'projects' not in data or not isinstance(data['projects'], list):
            return jsonify({'error': 'Liste de projets requise'}), 400
        
        projects = data['projects']
        
        if len(projects) > 10:
            return jsonify({'error': 'Maximum 10 projets par batch'}), 400
        
        results = []
        for i, project in enumerate(projects):
            if not isinstance(project, dict) or 'description' not in project:
                results.append({
                    'index': i,
                    'error': 'Chaque projet doit avoir une description'
                })
                continue
            
            description = project['description']
            industry = project.get('industry', 'Technology')
            complexity = project.get('complexity', 'moyen')
            max_tasks = project.get('maxTasks', 5)
            
            if len(description.strip()) < 10:
                results.append({
                    'index': i,
                    'error': 'Description trop courte'
                })
                continue
            
            try:
                tasks = task_generator.generate_tasks_from_description(
                    description, industry, complexity, max_tasks
                )
                
                results.append({
                    'index': i,
                    'description': description[:50] + '...' if len(description) > 50 else description,
                    'tasks': tasks,
                    'task_count': len(tasks),
                    'total_hours': sum(task['estimatedHours'] for task in tasks)
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
            'successful_generations': len([r for r in results if 'tasks' in r]),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/optimize-existing-tasks', methods=['POST'])
@authenticate
def optimize_existing_tasks():
    """Optimiser des tâches existantes avec ML"""
    try:
        data = request.get_json()
        
        if not data or 'tasks' not in data or not isinstance(data['tasks'], list):
            return jsonify({'error': 'Liste de tâches requise'}), 400
        
        tasks = data['tasks']
        project_context = data.get('projectContext', '')
        
        if len(tasks) > 50:
            return jsonify({'error': 'Maximum 50 tâches par optimisation'}), 400
        
        optimized_tasks = []
        
        for task in tasks:
            if not isinstance(task, dict) or 'name' not in task:
                optimized_tasks.append({
                    'error': 'Tâche invalide - nom requis',
                    'original': task
                })
                continue
            
            task_name = task['name']
            industry = task.get('industry', 'Technology')
            complexity = task.get('complexity', 'moyen')
            
            # Générer une version optimisée
            optimized = task_generator._create_ml_task(task_name, {}, industry, complexity, 'french')
            
            # Conserver certaines données originales si présentes
            if 'description' in task and task['description']:
                optimized['original_description'] = task['description']
            
            optimized_tasks.append(optimized)
        
        return jsonify({
            'success': True,
            'optimized_tasks': optimized_tasks,
            'optimization_count': len(optimized_tasks),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/get-task-templates', methods=['GET'])
def get_task_templates():
    """Récupérer les templates de tâches par industrie et complexité"""
    try:
        industry = request.args.get('industry', 'Technology')
        complexity = request.args.get('complexity', 'moyen')
        language = request.args.get('language', 'french')
        
        # Générer des templates
        domain_tasks = task_generator._generate_domain_specific_tasks(industry, complexity, language)
        complexity_tasks = task_generator._generate_complexity_based_tasks(complexity, industry, language)
        
        templates = {
            'domain_specific': [
                {
                    'name': task['name'],
                    'category': task['category'],
                    'priority': task['priority'],
                    'estimated_hours': task['estimatedHours']
                }
                for task in domain_tasks[:5]
            ],
            'complexity_based': [
                {
                    'name': task['name'],
                    'category': task['category'],
                    'priority': task['priority'],
                    'estimated_hours': task['estimatedHours']
                }
                for task in complexity_tasks[:5]
            ]
        }
        
        return jsonify({
            'success': True,
            'templates': templates,
            'parameters': {
                'industry': industry,
                'complexity': complexity,
                'language': language
            },
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
    """Informations sur les modèles ML"""
    return jsonify({
        'success': True,
        'model_info': {
            'is_trained': task_generator.is_trained,
            'models': {
                'task_category_classifier': 'VotingClassifier (RF + SVM + NB)',
                'task_priority_predictor': 'RandomForestClassifier',
                'task_complexity_estimator': 'RandomForestRegressor'
            },
            'training_data': {
                'total_samples': 'Dynamic multilingual dataset',
                'categories': list(task_generator.pattern_analyzer.task_categories.keys()),
                'priorities': ['HIGH', 'MEDIUM', 'LOW'],
                'languages': ['french', 'english'],
                'industries': [
                    'Technology', 'Healthcare', 'Finance', 'Education',
                    'Retail', 'Media', 'Logistics', 'Energy'
                ]
            },
            'features': [
                'text_length', 'word_count', 'action_verb_count',
                'task_object_count', 'domain_diversity', 'complexity_score',
                'category_indicators', 'linguistic_features'
            ],
            'generation_process': [
                '1. Extract project concepts',
                '2. Generate large task pool (60+ candidates)',
                '3. ML prediction of attributes',
                '4. Relevance scoring',
                '5. Diversity-based selection'
            ]
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/train-models', methods=['POST'])
@authenticate
def train_models():
    """Réentraîner les modèles ML"""
    try:
        # Réinitialiser
        task_generator.is_trained = False
        task_generator.generation_cache.clear()
        
        # Réentraîner
        task_generator.train_models()
        
        return jsonify({
            'success': True,
            'message': 'Modèles ML réentraînés avec succès',
            'model_trained': task_generator.is_trained,
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
        detected_language = task_generator.pattern_analyzer.detect_language(text)
        
        return jsonify({
            'success': True,
            'detected_language': detected_language,
            'supported_languages': task_generator.pattern_analyzer.supported_languages,
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
            'POST /api/generate-tasks',
            'POST /api/analyze-task-patterns',
            'POST /api/predict-task-attributes',
            'POST /api/batch-generate',
            'POST /api/optimize-existing-tasks',
            'GET /api/get-task-templates',
            'GET /api/model-info',
            'POST /api/train-models',
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
    
    port = int(os.environ.get('PORT', 3005))
    
    print("=" * 80)
    print("ML TASK GENERATOR - MODULE ISOLÉ")
    print("=" * 80)
    print(f"Service démarré sur le port {port}")
    print(" Génération PURE ML de tâches multilingues")
    print(" Support français/anglais")
    print(" 8 industries supportées")
    print(" 4 niveaux de complexité")
    print(" 8 catégories de tâches techniques")
    print("=" * 80)
    print("FONCTIONNALITÉS PRINCIPALES :")
    print("   Génération ML pure (pas de templates)")
    print("   Prédiction catégorie/priorité/heures")
    print("   Analyse de patterns de tâches")
    print("   Descriptions intelligentes")
    print("    Scoring de pertinence")
    print("   Sélection avec diversité")
    print("   Optimisation de tâches existantes")
    print("   Génération en batch")
    print("=" * 80)
    print("ENDPOINTS DISPONIBLES :")
    print(f"  - Health check         : http://localhost:{port}/health")
    print(f"  - Generate tasks       : POST http://localhost:{port}/api/generate-tasks")
    print(f"  - Analyze patterns     : POST http://localhost:{port}/api/analyze-task-patterns")
    print(f"  - Predict attributes   : POST http://localhost:{port}/api/predict-task-attributes")
    print(f"  - Batch generate       : POST http://localhost:{port}/api/batch-generate")
    print(f"  - Optimize tasks       : POST http://localhost:{port}/api/optimize-existing-tasks")
    print(f"  - Task templates       : GET http://localhost:{port}/api/get-task-templates")
    print(f"  - Model info          : GET http://localhost:{port}/api/model-info")
    print(f"  - Train models        : POST http://localhost:{port}/api/train-models")
    print(f"  - Detect language     : POST http://localhost:{port}/api/detect-language")
    print("=" * 80)
    print("Token d'authentification : 'MLTaskGenerator2024!'")
    print("Utilisation :")
    print("   Header: Authorization: Bearer MLTaskGenerator2024!")
    print("   Body: {")
    print("     \"description\": \"Application mobile de santé\",")
    print("     \"industry\": \"Healthcare\",")
    print("     \"complexity\": \"complexe\",")
    print("     \"maxTasks\": 8")
    print("   }")
    print("=" * 80)
    print("ALGORITHME DE GÉNÉRATION :")
    print("    Analyse des concepts du projet")
    print("    Génération d'un large pool (60+ tâches)")
    print("    Prédiction ML des attributs")
    print("    Scoring de pertinence")
    print("    Sélection avec diversité")
    print("=" * 80)
    print("MODÈLES ML :")
    print("    Catégorie: VotingClassifier (RF+SVM+NB)")
    print("   Priorité: RandomForestClassifier")
    print("    Heures: RandomForestRegressor")
    print("=" * 80)
    print("Service ML Task Generator prêt!")
    print("Génération intelligente de tâches multilingues avec ML pur 🚀")
    
    app.run(host='0.0.0.0', port=port, debug=False)