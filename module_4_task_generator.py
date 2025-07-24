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
from difflib import SequenceMatcher
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
                    'Energy': ['capteur', 'consommation', 'smart grid', 'maintenance', 'monitoring'],
                    'Gaming': ['joueur', 'gameplay', 'progression', 'matchmaking', 'monétisation'],
                    'Legal Services': ['contrat', 'dossier', 'client', 'deadline', 'compliance'],
                    'Consulting': ['conseil', 'audit', 'stratégie', 'accompagnement', 'expertise'],
                    'Human Resources': ['employé', 'recrutement', 'talent', 'formation', 'paie'],
                    'Real Estate': ['propriété', 'location', 'transaction', 'estimation', 'visite'],
                    'Insurance': ['police', 'sinistre', 'souscription', 'risque', 'claim'],
                    'Automotive': ['véhicule', 'maintenance', 'diagnostic', 'flotte', 'géolocalisation'],
                    'Aerospace': ['vol', 'maintenance', 'certification', 'satellite', 'sécurité'],
                    'Construction': ['chantier', 'BIM', 'planification', 'ressources', 'sécurité'],
                    'Food & Beverage': ['restaurant', 'commande', 'livraison', 'inventaire', 'nutrition'],
                    'Textile & Fashion': ['collection', 'design', 'production', 'trend', 'vente'],
                    'Chemical': ['laboratoire', 'produit', 'qualité', 'compliance', 'sécurité'],
                    'Sports & Fitness': ['entraînement', 'performance', 'réservation', 'coaching', 'nutrition'],
                    'Travel & Tourism': ['voyage', 'réservation', 'itinéraire', 'hôtel', 'guide'],
                    'Events & Hospitality': ['événement', 'venue', 'catering', 'billetterie', 'planning'],
                    'Government': ['citoyen', 'administration', 'dématérialisation', 'transparence', 'service public'],
                    'Non-profit': ['bénévole', 'don', 'projet', 'fundraising', 'impact'],
                    'Environmental': ['monitoring', 'carbone', 'déchets', 'certification', 'durabilité'],
                    'Agriculture': ['culture', 'capteur', 'rendement', 'météo', 'traçabilité'],
                    'Biotechnology': ['échantillon', 'analyse', 'séquençage', 'génétique', 'recherche'],
                    'Research & Development': ['recherche', 'publication', 'brevet', 'collaboration', 'financement'],
                    'Pharmaceutical': ['essai clinique', 'médicament', 'compliance', 'patient', 'régulateur'],
                    'Marketing & Advertising': ['campagne', 'lead', 'ROI', 'brand', 'analytics'],
                    'Aerospace': ['maintenance', 'vol', 'certification', 'sécurité', 'télémétrie']
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
                    # 8 ORIGINALES (garder)
                    'Healthcare': ['patient', 'médical', 'hôpital', 'prescription', 'diagnostic'],
                    'Finance': ['paiement', 'transaction', 'portefeuille', 'trading', 'fraude'],
                    'Education': ['cours', 'étudiant', 'évaluation', 'certificat', 'apprentissage'],
                    'Technology': ['cloud', 'microservice', 'container', 'ci/cd', 'monitoring'],
                    'Retail': ['produit', 'commande', 'inventaire', 'client', 'promotion'],
                    'Media': ['contenu', 'streaming', 'publication', 'commentaire', 'partage'],
                    'Logistics': ['livraison', 'tracking', 'entrepôt', 'transport', 'route'],
                    'Energy': ['capteur', 'consommation', 'smart grid', 'maintenance', 'monitoring'],
                    
                    # 25 NOUVELLES À AJOUTER:
                    'Gaming': ['joueur', 'gameplay', 'progression', 'matchmaking', 'monétisation'],
                    'Legal Services': ['contrat', 'dossier', 'client', 'deadline', 'compliance'],
                    'Consulting': ['conseil', 'audit', 'stratégie', 'accompagnement', 'expertise'],
                    'Human Resources': ['employé', 'recrutement', 'talent', 'formation', 'paie'],
                    'Real Estate': ['propriété', 'location', 'transaction', 'estimation', 'visite'],
                    'Insurance': ['police', 'sinistre', 'souscription', 'risque', 'claim'],
                    'Automotive': ['véhicule', 'maintenance', 'diagnostic', 'flotte', 'géolocalisation'],
                    'Aerospace': ['vol', 'maintenance', 'certification', 'satellite', 'sécurité'],
                    'Construction': ['chantier', 'BIM', 'planification', 'ressources', 'sécurité'],
                    'Food & Beverage': ['restaurant', 'commande', 'livraison', 'inventaire', 'nutrition'],
                    'Textile & Fashion': ['collection', 'design', 'production', 'trend', 'vente'],
                    'Chemical': ['laboratoire', 'produit', 'qualité', 'compliance', 'sécurité'],
                    'Sports & Fitness': ['entraînement', 'performance', 'réservation', 'coaching', 'nutrition'],
                    'Travel & Tourism': ['voyage', 'réservation', 'itinéraire', 'hôtel', 'guide'],
                    'Events & Hospitality': ['événement', 'venue', 'catering', 'billetterie', 'planning'],
                    'Government': ['citoyen', 'administration', 'dématérialisation', 'transparence', 'service public'],
                    'Non-profit': ['bénévole', 'don', 'projet', 'fundraising', 'impact'],
                    'Environmental': ['monitoring', 'carbone', 'déchets', 'certification', 'durabilité'],
                    'Agriculture': ['culture', 'capteur', 'rendement', 'météo', 'traçabilité'],
                    'Biotechnology': ['échantillon', 'analyse', 'séquençage', 'génétique', 'recherche'],
                    'Research & Development': ['recherche', 'publication', 'brevet', 'collaboration', 'financement'],
                    'Pharmaceutical': ['essai clinique', 'médicament', 'compliance', 'patient', 'régulateur'],
                    'Marketing & Advertising': ['campagne', 'lead', 'ROI', 'brand', 'analytics'],
                    'Aerospace': ['maintenance', 'vol', 'certification', 'sécurité', 'télémétrie']
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

class TaskDeduplicator:
    """Classe pour éliminer les doublons de tâches"""
    
    def __init__(self):
        self.similarity_threshold = 0.90
        self.name_similarity_threshold = 0.85

    def is_too_generic(self, task_name: str) -> bool:
        """Détecter les tâches trop génériques"""
        generic_patterns = [
            r'^(développer|créer|implémenter|configurer)\s+(interface|service|module|système)$',
            r'^(develop|create|implement|configure)\s+(interface|service|module|system)$'
        ]
        
        for pattern in generic_patterns:
            if re.match(pattern, task_name.lower().strip()):
                return True
        
        return False
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité entre deux textes"""
        if not text1 or not text2:
            return 0.0
        
        text1_clean = self._clean_text(text1)
        text2_clean = self._clean_text(text2)
        
        return SequenceMatcher(None, text1_clean, text2_clean).ratio()
    
    def _clean_text(self, text: str) -> str:
        """Nettoie le texte pour la comparaison"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def are_tasks_duplicate(self, task1: Dict[str, Any], task2: Dict[str, Any]) -> bool:
        """Vérifie si deux tâches sont des doublons"""
        name1 = task1.get('name', '')
        name2 = task2.get('name', '')
        desc1 = task1.get('description', '')
        desc2 = task2.get('description', '')
        
        name_similarity = self.calculate_similarity(name1, name2)
        desc_similarity = self.calculate_similarity(desc1, desc2)
        
        if name_similarity >= self.name_similarity_threshold:
            return True
        
        if name_similarity >= 0.6 and desc_similarity >= self.similarity_threshold:
            return True
        
        return False
    
    def deduplicate_tasks(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Élimine les doublons d'une liste de tâches"""
        if not tasks:
            return []
        
        unique_tasks = []
        seen_tasks = []
        
        for task in tasks:
            
            if self.is_too_generic(task.get('name', '')):
                print(f"Tâche générique rejetée : '{task.get('name', 'Sans nom')}'")
                continue

            is_duplicate = False
            
            for existing_task in seen_tasks:
                if self.are_tasks_duplicate(task, existing_task):
                    print(f"Tâche dupliquée détectée : '{task.get('name', 'Sans nom')}'")
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_tasks.append(task)
                seen_tasks.append(task)
        
        print(f"Déduplication terminée : {len(tasks)} -> {len(unique_tasks)} tâches uniques")
        return unique_tasks

class TaskNameValidator:
    """Classe pour valider et améliorer les noms de tâches"""
    
    def __init__(self):
        self.forbidden_patterns = [
            r'tâche\s*\d+',
            r'task\s*\d+',
            r'étape\s*\d+',
            r'phase\s*\d+',
            r'sans\s*nom',
            r'unnamed',
            r'untitled'
        ]
        
        self.generic_names = {
            'développement', 'implementation', 'coding', 'programming',
            'test', 'testing', 'debug', 'debugging', 'fix', 'correction',
            'design', 'conception', 'analyse', 'analysis', 'research',
            'documentation', 'doc', 'planning', 'planification'
        }
    
    def is_valid_name(self, name: str) -> bool:
        """Vérifie si un nom de tâche est valide avec critères stricts"""
        if not name or len(name.strip()) < 5:  # Minimum 5 caractères
            return False
        
        name_lower = name.lower().strip()
        
        # Vérifier les patterns interdits
        for pattern in self.forbidden_patterns:
            if re.search(pattern, name_lower):
                return False
        
        words = name.split()
        if len(words) < 1:
            return False
        if len(words) == 1 and len(name) < 6:  # Mot unique doit être assez long
            return False

        # Rejeter seulement les très génériques
        very_generic = {'test', 'dev', 'config', 'setup', 'task', 'tâche'}
        if name_lower in very_generic:
            return False
        
        # Rejeter les tâches avec des mots répétés
        words = name_lower.split()
        if len(words) != len(set(words)):  # Mots dupliqués
            return False
        
        return True
    
    def improve_task_name(self, name: str, context: str = "") -> str:
        """Améliore le nom d'une tâche"""
        if not name:
            return "Tâche à définir"
        
        name = name.strip()
        
        # Si le nom est trop générique, ajouter du contexte
        if name.lower() in self.generic_names and context:
            name = f"{name} {context}"
        
        # Capitaliser proprement
        if name and not name[0].isupper():
            name = name[0].upper() + name[1:]
        
        return name

class MLTaskGenerator:
    """Générateur de tâches basé entièrement sur ML multilingue"""
    
    def __init__(self):
        self.pattern_analyzer = MultilingualTaskPatternAnalyzer()
        self.feature_extractor = MLTaskFeatureExtractor()
        self.task_validator = TaskNameValidator() 
        self.task_deduplicator = TaskDeduplicator()
        
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
    
    def train_model(self):
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
    
    def generate_tasks_from_description(self, project_description: str, industry: str, complexity: str, max_tasks: int = 5, language: str = None) -> List[Dict[str, Any]]:
        """Générer des tâches ML pure à partir de la description du projet"""
        if not self.is_trained:
            self.train_models()
        
        if language is None:
            detected_language = self.pattern_analyzer.detect_language(project_description)
        else:
            detected_language = language
            
        print(f"Génération de {max_tasks} tâches en {detected_language} pour: {project_description[:50]}...")
        
        # Analyser le projet pour extraire les concepts
        project_concepts = self._extract_project_concepts(project_description, industry, detected_language)
        
        # Générer un large pool de tâches candidates
        generated_pool = self._generate_large_task_pool(project_concepts, industry, complexity, detected_language)
        
        # ÉTAPE CRUCIALE : Déduplication et validation
        print(f"Pool initial : {len(generated_pool)} tâches")
        
        # 1. Valider et améliorer les noms des tâches
        validated_pool = []
        for task in generated_pool:
            if self.task_validator.is_valid_name(task['name']):
                task['name'] = self.task_validator.improve_task_name(task['name'], industry)
                validated_pool.append(task)
            else:
                print(f"Tâche rejetée (nom invalide) : '{task['name']}'")
        
        print(f"Après validation : {len(validated_pool)} tâches")
        
        # 2. Déduplication des tâches
        unique_tasks = self.task_deduplicator.deduplicate_tasks(validated_pool)
        
        # 3. Assurer la diversité
        diverse_tasks = self._ensure_task_diversity(unique_tasks)
        
        # 4. Sélectionner les meilleures tâches
        candidate_count = max(max_tasks * 3, 25)  # Au moins 25 candidats
        top_tasks = self._select_top_tasks(diverse_tasks, project_description, candidate_count)
        
        # 5. Finaliser la sélection avec garantie du nombre
        final_tasks = self._select_final_tasks(top_tasks, project_description, max_tasks)

        # 6. Si pas assez, compléter avec les meilleures restantes
        if len(final_tasks) < max_tasks and len(diverse_tasks) > len(final_tasks):
            remaining = [t for t in diverse_tasks if t not in final_tasks]
            remaining.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            needed = max_tasks - len(final_tasks)
            final_tasks.extend(remaining[:needed])
                
        print(f"Génération terminée : {len(final_tasks)} tâches créées en {detected_language}")
        return final_tasks
    
    def _extract_project_concepts(self, description: str, industry: str, language: str) -> Dict[str, List[str]]:
        """Extraire les concepts clés du projet avec analyse contextuelle améliorée"""
        tokens = word_tokenize(description.lower())
        
        concepts = {
            'actions': [],
            'objects': [],
            'technologies': [],
            'features': [],
            'domain_specifics': [],
            'main_keywords': []  # NOUVEAU
        }
        
        # NOUVEAU: Dictionnaires contextuels spécifiques
        if language == 'french':
            context_mappings = {
                'calories': ['nutrition', 'alimentation', 'santé', 'fitness', 'régime'],
                'rpg': ['personnage', 'quête', 'combat', 'niveau', 'inventaire', 'sorts'],
                'médiéval': ['château', 'chevalier', 'magie', 'dragon', 'royaume'],
                'mobile': ['application', 'smartphone', 'interface', 'utilisateur'],
                'jeu': ['gameplay', 'joueur', 'score', 'niveau', 'progression']
            }
            
            # Extraire les mots-clés principaux du projet
            for keyword, related in context_mappings.items():
                if keyword in description.lower():
                    concepts['main_keywords'].append(keyword)
                    concepts['domain_specifics'].extend(related[:3])  # Limiter à 3
        
        # Analyser le type de projet basé sur les mots-clés
        project_indicators = {
            'french': {
                'mobile_app': ['application', 'mobile', 'smartphone', 'app'],
                'web_platform': ['site', 'web', 'plateforme', 'navigateur'],
                'game': ['jeu', 'gaming', 'rpg', 'joueur'],
                'health_app': ['santé', 'médical', 'calories', 'fitness', 'nutrition'],
                'business_tool': ['gestion', 'entreprise', 'professionnel', 'outil']
            }
        }
        
        # NOUVEAU: Détecter le type de projet
        for project_type, keywords in project_indicators.get(language, {}).items():
            if any(kw in description.lower() for kw in keywords):
                concepts['project_type'] = project_type
                break
        
        # Extraction des technologies basée sur le contexte
        tech_detection = {
            'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ionic'],
            'web': ['react', 'vue', 'angular', 'html', 'css', 'javascript'],
            'backend': ['node.js', 'python', 'java', 'php', 'api', 'base de données'],
            'game': ['unity', 'unreal', 'c#', 'c++', 'game engine']
        }
        
        for tech_category, tech_list in tech_detection.items():
            if any(tech in description.lower() for tech in tech_list):
                concepts['technologies'].append(tech_category)
        
        # Extraction des actions contextuelles
        action_patterns = {
            'french': {
                'développer': ['créer', 'construire', 'programmer'],
                'concevoir': ['designer', 'architecturer', 'planifier'],
                'implémenter': ['intégrer', 'configurer', 'déployer'],
                'optimiser': ['améliorer', 'accélérer', 'optimiser']
            }
        }
        
        for base_action, variations in action_patterns.get(language, {}).items():
            if any(action in description.lower() for action in [base_action] + variations):
                concepts['actions'].append(base_action)
        
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
        
        print(f"Pool généré : {len(task_pool)} tâches brutes")
        return task_pool[:80]
    
    def _optimize_task_pool(self, task_pool: List[Dict[str, Any]], concepts: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """Optimiser le pool de tâches pour éviter les doublons dès la génération"""
        optimized_pool = []
        seen_names = set()
        
        # Priorités selon le contexte du projet
        priority_categories = ['architecture', 'development', 'ui_ux', 'testing', 'deployment', 
                      'security', 'integration', 'backend', 'frontend', 'devops', 
                      'analytics', 'documentation', 'other']
        category_counts = {cat: 0 for cat in priority_categories}
        max_per_category = 3  
        
        # Trier par score de pertinence
        sorted_tasks = sorted(task_pool, key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        for task in sorted_tasks:
            task_name = task['name'].lower().strip()
            
            # Éviter les doublons exacts
            if task_name in seen_names:
                continue
            
            # Éviter les noms trop génériques
            if len(task_name.split()) < 2:
                continue
            
            # Limiter par catégorie
            task_category = task.get('category', 'other')
            if len(optimized_pool) >= 15 and category_counts.get(task_category, 0) >= max_per_category:
                continue
            
            # Vérifier la pertinence contextuelle
            if self._is_contextually_relevant(task, concepts):
                optimized_pool.append(task)
                seen_names.add(task_name)
                category_counts[task_category] = category_counts.get(task_category, 0) + 1
        
        return optimized_pool

    def _is_contextually_relevant(self, task: Dict[str, Any], concepts: Dict[str, List[str]]) -> bool:
        """Vérifier si une tâche est contextuellemen pertinente"""
        task_name = task['name'].lower()
        
        # Vérifier la présence de mots-clés du projet
        main_keywords = concepts.get('main_keywords', [])
        domain_specifics = concepts.get('domain_specifics', [])
        
        # Score de pertinence basé sur les mots-clés
        relevance_score = 0
        
        for keyword in main_keywords:
            if keyword in task_name:
                relevance_score += 3
        
        for domain_word in domain_specifics:
            if domain_word in task_name:
                relevance_score += 2
        
        # Les tâches génériques ont un score minimum
        generic_tasks = ['api', 'base de données', 'interface', 'test', 'déploiement']
        if any(generic in task_name for generic in generic_tasks):
            relevance_score += 1
        
        return relevance_score > 0
    
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
        """Générer des tâches spécifiques au domaine avec templates étendus pour 33 industries"""
        domain_tasks = []
        patterns = self.pattern_analyzer.language_patterns.get(language, {})
        domain_context = patterns.get('domain_contexts', {}).get(industry, [])
        
        # Templates dynamiques COMPLETS pour les 33 industries
        industry_templates = {
            # === TECH & DIGITAL ===
            'Technology': {
                'french': [
                    'Développer architecture {concept} scalable',
                    'Implémenter système {concept} haute performance',
                    'Créer API RESTful pour {concept}',
                    'Configurer infrastructure {concept} cloud',
                    'Optimiser algorithmes {concept}',
                    'Intégrer service {concept} tiers',
                    'Développer SDK {concept}',
                    'Implémenter cache distribué {concept}',
                    'Créer monitoring {concept} temps réel',
                    'Configurer CI/CD pour {concept}',
                    'Développer interface admin {concept}',
                    'Implémenter sécurité {concept} avancée',
                    'Créer documentation technique {concept}',
                    'Optimiser performance {concept}',
                    'Développer tests automatisés {concept}'
                ],
                'english': [
                    'Develop scalable {concept} architecture',
                    'Implement high-performance {concept} system',
                    'Create RESTful API for {concept}',
                    'Configure cloud {concept} infrastructure',
                    'Optimize {concept} algorithms',
                    'Integrate third-party {concept} service',
                    'Develop {concept} SDK',
                    'Implement distributed {concept} cache',
                    'Create real-time {concept} monitoring',
                    'Configure CI/CD for {concept}',
                    'Develop {concept} admin interface',
                    'Implement advanced {concept} security',
                    'Create {concept} technical documentation',
                    'Optimize {concept} performance',
                    'Develop automated {concept} tests'
                ]
            },
            
            # === SANTÉ ===
            'Healthcare': {
                'french': [
                    'Développer système suivi {concept} patient',
                    'Implémenter calcul automatique {concept}',
                    'Créer interface saisie {concept} médecin',
                    'Configurer base données {concept} sécurisée',
                    'Développer recommandations {concept}',
                    'Implémenter alertes {concept} médicales',
                    'Créer rapport {concept} personnalisé',
                    'Développer synchronisation {concept}',
                    'Implémenter historique {concept} patient',
                    'Créer dashboard {concept} professionnel',
                    'Développer export {concept} format standard',
                    'Implémenter validation {concept} médicale',
                    'Créer système notification {concept}',
                    'Développer analytics {concept} santé',
                    'Implémenter conformité RGPD {concept}'
                ],
                'english': [
                    'Develop patient {concept} tracking system',
                    'Implement automatic {concept} calculation',
                    'Create doctor {concept} input interface',
                    'Configure secure {concept} database',
                    'Develop {concept} recommendations',
                    'Implement medical {concept} alerts',
                    'Create personalized {concept} reports',
                    'Develop {concept} synchronization',
                    'Implement patient {concept} history',
                    'Create professional {concept} dashboard',
                    'Develop standard format {concept} export',
                    'Implement medical {concept} validation',
                    'Create {concept} notification system',
                    'Develop health {concept} analytics',
                    'Implement GDPR compliant {concept}'
                ]
            },
            
            # === GAMING ===
            'Gaming': {
                'french': [
                    'Concevoir système {concept} équilibré',
                    'Implémenter mécaniques {concept} innovantes',
                    'Développer interface {concept} intuitive',
                    'Créer progression {concept} engageante',
                    'Optimiser rendu {concept} temps réel',
                    'Implémenter sauvegarde {concept} cloud',
                    'Développer système {concept} multijoueur',
                    'Créer économie {concept} virtuelle',
                    'Implémenter intelligence artificielle {concept}',
                    'Développer système quête {concept}',
                    'Créer interface inventaire {concept}',
                    'Implémenter système combat {concept}',
                    'Développer générateur {concept} procédural',
                    'Créer système classement {concept}',
                    'Implémenter analytics {concept} joueur'
                ],
                'english': [
                    'Design balanced {concept} system',
                    'Implement innovative {concept} mechanics',
                    'Develop intuitive {concept} interface',
                    'Create engaging {concept} progression',
                    'Optimize real-time {concept} rendering',
                    'Implement cloud {concept} save system',
                    'Develop multiplayer {concept} system',
                    'Create virtual {concept} economy',
                    'Implement {concept} artificial intelligence',
                    'Develop {concept} quest system',
                    'Create {concept} inventory interface',
                    'Implement {concept} combat system',
                    'Develop procedural {concept} generator',
                    'Create {concept} leaderboard system',
                    'Implement player {concept} analytics'
                ]
            },
            
            # === FINANCE ===
            'Finance': {
                'french': [
                    'Développer système {concept} sécurisé PCI-DSS',
                    'Implémenter détection fraude {concept}',
                    'Créer interface {concept} trading',
                    'Configurer chiffrement {concept} bout-en-bout',
                    'Développer analyse risque {concept}',
                    'Implémenter conformité {concept} réglementaire',
                    'Créer rapport {concept} financier',
                    'Développer API {concept} bancaire',
                    'Implémenter audit trail {concept}',
                    'Créer dashboard {concept} temps réel',
                    'Développer système {concept} haute fréquence',
                    'Implémenter validation {concept} KYC',
                    'Créer alertes {concept} automatiques',
                    'Développer backup {concept} sécurisé',
                    'Implémenter réconciliation {concept}'
                ],
                'english': [
                    'Develop PCI-DSS secure {concept} system',
                    'Implement {concept} fraud detection',
                    'Create {concept} trading interface',
                    'Configure end-to-end {concept} encryption',
                    'Develop {concept} risk analysis',
                    'Implement regulatory {concept} compliance',
                    'Create financial {concept} reports',
                    'Develop banking {concept} API',
                    'Implement {concept} audit trail',
                    'Create real-time {concept} dashboard',
                    'Develop high-frequency {concept} system',
                    'Implement KYC {concept} validation',
                    'Create automatic {concept} alerts',
                    'Develop secure {concept} backup',
                    'Implement {concept} reconciliation'
                ]
            },
            
            # === EDUCATION ===
            'Education': {
                'french': [
                    'Développer plateforme {concept} adaptive',
                    'Implémenter {concept} avec gamification',
                    'Créer système évaluation {concept}',
                    'Configurer {concept} collaboratif',
                    'Développer suivi progression {concept}',
                    'Implémenter recommandations {concept}',
                    'Créer contenu interactif {concept}',
                    'Développer certification {concept}',
                    'Implémenter forum discussion {concept}',
                    'Créer analytics apprentissage {concept}',
                    'Développer mobile learning {concept}',
                    'Implémenter accessibilité {concept}',
                    'Créer système notation {concept}',
                    'Développer calendrier {concept}',
                    'Implémenter vidéo conférence {concept}'
                ],
                'english': [
                    'Develop adaptive {concept} platform',
                    'Implement {concept} with gamification',
                    'Create {concept} assessment system',
                    'Configure collaborative {concept}',
                    'Develop {concept} progress tracking',
                    'Implement {concept} recommendations',
                    'Create interactive {concept} content',
                    'Develop {concept} certification',
                    'Implement {concept} discussion forum',
                    'Create learning {concept} analytics',
                    'Develop mobile {concept} learning',
                    'Implement {concept} accessibility',
                    'Create {concept} grading system',
                    'Develop {concept} calendar',
                    'Implement video conference {concept}'
                ]
            },
            
            # === E-COMMERCE ===
            'Retail': {
                'french': [
                    'Développer catalogue {concept} dynamique',
                    'Implémenter moteur recherche {concept}',
                    'Créer panier {concept} intelligent',
                    'Configurer paiement {concept} sécurisé',
                    'Développer gestion stock {concept}',
                    'Implémenter recommandations {concept}',
                    'Créer interface admin {concept}',
                    'Développer système livraison {concept}',
                    'Implémenter programme fidélité {concept}',
                    'Créer analytics vente {concept}',
                    'Développer app mobile {concept}',
                    'Implémenter avis client {concept}',
                    'Créer système promotion {concept}',
                    'Développer chat support {concept}',
                    'Implémenter retour produit {concept}'
                ],
                'english': [
                    'Develop dynamic {concept} catalog',
                    'Implement {concept} search engine',
                    'Create intelligent {concept} cart',
                    'Configure secure {concept} payment',
                    'Develop {concept} inventory management',
                    'Implement {concept} recommendations',
                    'Create {concept} admin interface',
                    'Develop {concept} delivery system',
                    'Implement {concept} loyalty program',
                    'Create sales {concept} analytics',
                    'Develop mobile {concept} app',
                    'Implement customer {concept} reviews',
                    'Create {concept} promotion system',
                    'Develop {concept} support chat',
                    'Implement product {concept} returns'
                ]
            },
            
            # === MEDIA ===
            'Media': {
                'french': [
                    'Développer plateforme {concept} streaming',
                    'Implémenter système {concept} publication',
                    'Créer éditeur {concept} collaboratif',
                    'Configurer CDN {concept} global',
                    'Développer système {concept} modération',
                    'Implémenter analytics {concept} contenu',
                    'Créer workflow {concept} éditorial',
                    'Développer app mobile {concept}',
                    'Implémenter live streaming {concept}',
                    'Créer système monétisation {concept}',
                    'Développer CMS {concept} avancé',
                    'Implémenter SEO {concept} automatique',
                    'Créer système commentaires {concept}',
                    'Développer newsletter {concept}',
                    'Implémenter partage social {concept}'
                ],
                'english': [
                    'Develop {concept} streaming platform',
                    'Implement {concept} publishing system',
                    'Create collaborative {concept} editor',
                    'Configure global {concept} CDN',
                    'Develop {concept} moderation system',
                    'Implement {concept} content analytics',
                    'Create editorial {concept} workflow',
                    'Develop mobile {concept} app',
                    'Implement {concept} live streaming',
                    'Create {concept} monetization system',
                    'Develop advanced {concept} CMS',
                    'Implement automatic {concept} SEO',
                    'Create {concept} comment system',
                    'Develop {concept} newsletter',
                    'Implement social {concept} sharing'
                ]
            },
            
            # === LOGISTICS ===
            'Logistics': {
                'french': [
                    'Développer système {concept} tracking',
                    'Implémenter optimisation {concept} route',
                    'Créer interface {concept} transport',
                    'Configurer API {concept} livraison',
                    'Développer gestion {concept} entrepôt',
                    'Implémenter prédiction {concept} délais',
                    'Créer dashboard {concept} logistique',
                    'Développer app {concept} chauffeur',
                    'Implémenter géolocalisation {concept}',
                    'Créer système {concept} facturation',
                    'Développer planning {concept} automatique',
                    'Implémenter IoT {concept} fleet',
                    'Créer rapport {concept} performance',
                    'Développer intégration {concept} ERP',
                    'Implémenter maintenance {concept} prédictive'
                ],
                'english': [
                    'Develop {concept} tracking system',
                    'Implement {concept} route optimization',
                    'Create {concept} transport interface',
                    'Configure {concept} delivery API',
                    'Develop {concept} warehouse management',
                    'Implement {concept} delay prediction',
                    'Create logistics {concept} dashboard',
                    'Develop {concept} driver app',
                    'Implement {concept} geolocation',
                    'Create {concept} billing system',
                    'Develop automatic {concept} planning',
                    'Implement {concept} fleet IoT',
                    'Create {concept} performance reports',
                    'Develop {concept} ERP integration',
                    'Implement predictive {concept} maintenance'
                ]
            },
            
            # === ENERGY ===
            'Energy': {
                'french': [
                    'Développer monitoring {concept} intelligent',
                    'Implémenter IoT {concept} capteurs',
                    'Créer dashboard {concept} énergétique',
                    'Configurer smart grid {concept}',
                    'Développer prédiction {concept} consommation',
                    'Implémenter optimisation {concept} réseau',
                    'Créer système {concept} maintenance',
                    'Développer app {concept} gestionnaire',
                    'Implémenter analytics {concept} usage',
                    'Créer interface {concept} renouvelable',
                    'Développer stockage {concept} données',
                    'Implémenter alertes {concept} anomalies',
                    'Créer rapport {concept} efficacité',
                    'Développer API {concept} tarification',
                    'Implémenter blockchain {concept} trading'
                ],
                'english': [
                    'Develop intelligent {concept} monitoring',
                    'Implement {concept} sensor IoT',
                    'Create energy {concept} dashboard',
                    'Configure {concept} smart grid',
                    'Develop {concept} consumption prediction',
                    'Implement {concept} network optimization',
                    'Create {concept} maintenance system',
                    'Develop {concept} manager app',
                    'Implement {concept} usage analytics',
                    'Create renewable {concept} interface',
                    'Develop {concept} data storage',
                    'Implement {concept} anomaly alerts',
                    'Create {concept} efficiency reports',
                    'Develop {concept} pricing API',
                    'Implement {concept} blockchain trading'
                ]
            },
            
            # === LEGAL SERVICES ===
            'Legal Services': {
                'french': [
                    'Développer gestion {concept} dossier',
                    'Implémenter recherche {concept} jurisprudence',
                    'Créer workflow {concept} validation',
                    'Configurer signature {concept} électronique',
                    'Développer calendrier {concept} échéances',
                    'Implémenter facturation {concept} automatique',
                    'Créer base {concept} documents',
                    'Développer CRM {concept} clients',
                    'Implémenter conformité {concept} RGPD',
                    'Créer système {concept} archivage',
                    'Développer timesheet {concept} avocats',
                    'Implémenter collaboration {concept} équipe',
                    'Créer reporting {concept} activité',
                    'Développer app mobile {concept}',
                    'Implémenter sécurité {concept} renforcée'
                ],
                'english': [
                    'Develop {concept} case management',
                    'Implement {concept} legal research',
                    'Create {concept} validation workflow',
                    'Configure electronic {concept} signature',
                    'Develop {concept} deadline calendar',
                    'Implement automatic {concept} billing',
                    'Create {concept} document database',
                    'Develop {concept} client CRM',
                    'Implement {concept} GDPR compliance',
                    'Create {concept} archiving system',
                    'Develop lawyer {concept} timesheet',
                    'Implement team {concept} collaboration',
                    'Create {concept} activity reporting',
                    'Develop mobile {concept} app',
                    'Implement enhanced {concept} security'
                ]
            },
            
            # === CONSULTING ===
            'Consulting': {
                'french': [
                    'Développer CRM {concept} consulting',
                    'Implémenter gestion {concept} projets',
                    'Créer système {concept} facturation',
                    'Configurer planning {concept} consultants',
                    'Développer knowledge base {concept}',
                    'Implémenter timetracking {concept}',
                    'Créer dashboard {concept} performance',
                    'Développer proposition {concept} automatique',
                    'Implémenter collaboration {concept} client',
                    'Créer système {concept} reporting',
                    'Développer app mobile {concept}',
                    'Implémenter analytics {concept} business',
                    'Créer workflow {concept} validation',
                    'Développer intégration {concept} ERP',
                    'Implémenter sécurité {concept} données'
                ],
                'english': [
                    'Develop consulting {concept} CRM',
                    'Implement {concept} project management',
                    'Create {concept} billing system',
                    'Configure consultant {concept} planning',
                    'Develop {concept} knowledge base',
                    'Implement {concept} timetracking',
                    'Create {concept} performance dashboard',
                    'Develop automatic {concept} proposals',
                    'Implement client {concept} collaboration',
                    'Create {concept} reporting system',
                    'Develop mobile {concept} app',
                    'Implement business {concept} analytics',
                    'Create {concept} validation workflow',
                    'Develop {concept} ERP integration',
                    'Implement {concept} data security'
                ]
            },
            
            # === HUMAN RESOURCES ===
            'Human Resources': {
                'french': [
                    'Développer SIRH {concept} complet',
                    'Implémenter recrutement {concept} intelligent',
                    'Créer évaluation {concept} performance',
                    'Configurer paie {concept} automatique',
                    'Développer formation {concept} en ligne',
                    'Implémenter gestion {concept} talents',
                    'Créer onboarding {concept} digital',
                    'Développer analytics {concept} RH',
                    'Implémenter self-service {concept}',
                    'Créer planning {concept} congés',
                    'Développer app mobile {concept} RH',
                    'Implémenter signature {concept} numérique',
                    'Créer dashboard {concept} management',
                    'Développer enquête {concept} satisfaction',
                    'Implémenter conformité {concept} sociale'
                ],
                'english': [
                    'Develop complete {concept} HRIS',
                    'Implement intelligent {concept} recruitment',
                    'Create {concept} performance evaluation',
                    'Configure automatic {concept} payroll',
                    'Develop online {concept} training',
                    'Implement {concept} talent management',
                    'Create digital {concept} onboarding',
                    'Develop HR {concept} analytics',
                    'Implement {concept} self-service',
                    'Create {concept} leave planning',
                    'Develop mobile HR {concept} app',
                    'Implement digital {concept} signature',
                    'Create {concept} management dashboard',
                    'Develop {concept} satisfaction survey',
                    'Implement social {concept} compliance'
                ]
            },
            
            # === REAL ESTATE ===
            'Real Estate': {
                'french': [
                    'Développer plateforme {concept} immobilier',
                    'Implémenter recherche {concept} avancée',
                    'Créer visite {concept} virtuelle',
                    'Configurer estimation {concept} automatique',
                    'Développer CRM {concept} agents',
                    'Implémenter géolocalisation {concept}',
                    'Créer système {concept} mandats',
                    'Développer app mobile {concept}',
                    'Implémenter signature {concept} électronique',
                    'Créer analytics {concept} marché',
                    'Développer portail {concept} client',
                    'Implémenter facturation {concept}',
                    'Créer alerte {concept} biens',
                    'Développer rapport {concept} expertise',
                    'Implémenter blockchain {concept} transaction'
                ],
                'english': [
                    'Develop real estate {concept} platform',
                    'Implement advanced {concept} search',
                    'Create virtual {concept} tour',
                    'Configure automatic {concept} valuation',
                    'Develop {concept} agent CRM',
                    'Implement {concept} geolocation',
                    'Create {concept} mandate system',
                    'Develop mobile {concept} app',
                    'Implement electronic {concept} signature',
                    'Create market {concept} analytics',
                    'Develop {concept} client portal',
                    'Implement {concept} billing',
                    'Create {concept} property alerts',
                    'Develop {concept} expertise reports',
                    'Implement {concept} blockchain transaction'
                ]
            },
            
            # === INSURANCE ===
            'Insurance': {
                'french': [
                    'Développer souscription {concept} digitale',
                    'Implémenter gestion {concept} sinistres',
                    'Créer tarification {concept} dynamique',
                    'Configurer fraude {concept} détection',
                    'Développer app mobile {concept}',
                    'Implémenter télémétrie {concept}',
                    'Créer dashboard {concept} courtier',
                    'Développer API {concept} partenaires',
                    'Implémenter analytics {concept} risque',
                    'Créer workflow {concept} validation',
                    'Développer chatbot {concept} service',
                    'Implémenter signature {concept} numérique',
                    'Créer rapport {concept} actuariel',
                    'Développer conformité {concept} Solvency',
                    'Implémenter blockchain {concept} claims'
                ],
                'english': [
                    'Develop digital {concept} underwriting',
                    'Implement {concept} claims management',
                    'Create dynamic {concept} pricing',
                    'Configure {concept} fraud detection',
                    'Develop mobile {concept} app',
                    'Implement {concept} telematics',
                    'Create broker {concept} dashboard',
                    'Develop partner {concept} API',
                    'Implement {concept} risk analytics',
                    'Create {concept} validation workflow',
                    'Develop {concept} service chatbot',
                    'Implement digital {concept} signature',
                    'Create actuarial {concept} reports',
                    'Develop Solvency {concept} compliance',
                    'Implement {concept} blockchain claims'
                ]
            },
            
            # === AUTOMOTIVE ===
            'Automotive': {
                'french': [
                    'Développer diagnostic {concept} connecté',
                    'Implémenter maintenance {concept} prédictive',
                    'Créer configurateur {concept} véhicule',
                    'Configurer télématique {concept} flotte',
                    'Développer app {concept} conducteur',
                    'Implémenter IoT {concept} véhicule',
                    'Créer marketplace {concept} pièces',
                    'Développer géolocalisation {concept}',
                    'Implémenter covoiturage {concept}',
                    'Créer système {concept} leasing',
                    'Développer e-commerce {concept} auto',
                    'Implémenter réalité {concept} augmentée',
                    'Créer analytics {concept} usage',
                    'Développer blockchain {concept} historique',
                    'Implémenter assistant {concept} vocal'
                ],
                'english': [
                    'Develop connected {concept} diagnostics',
                    'Implement predictive {concept} maintenance',
                    'Create vehicle {concept} configurator',
                    'Configure fleet {concept} telematics',
                    'Develop {concept} driver app',
                    'Implement vehicle {concept} IoT',
                    'Create {concept} parts marketplace',
                    'Develop {concept} geolocation',
                    'Implement {concept} carpooling',
                    'Create {concept} leasing system',
                    'Develop automotive {concept} e-commerce',
                    'Implement augmented {concept} reality',
                    'Create {concept} usage analytics',
                    'Develop {concept} blockchain history',
                    'Implement voice {concept} assistant'
                ]
            },
            
            # === AEROSPACE ===
            'Aerospace': {
                'french': [
                    'Développer maintenance {concept} aéronautique',
                    'Implémenter simulation {concept} vol',
                    'Créer gestion {concept} flotte',
                    'Configurer IoT {concept} satellite',
                    'Développer planification {concept} vol',
                    'Implémenter traçabilité {concept} pièces',
                    'Créer système {concept} navigation',
                    'Développer monitoring {concept} moteur',
                    'Implémenter réalité {concept} augmentée',
                    'Créer certification {concept} process',
                    'Développer app {concept} pilote',
                    'Implémenter télémétrie {concept}',
                    'Créer supply chain {concept}',
                    'Développer cybersécurité {concept}',
                    'Implémenter blockchain {concept} parts'
                ],
                'english': [
                    'Develop aeronautical {concept} maintenance',
                    'Implement {concept} flight simulation',
                    'Create {concept} fleet management',
                    'Configure satellite {concept} IoT',
                    'Develop {concept} flight planning',
                    'Implement {concept} parts traceability',
                    'Create {concept} navigation system',
                    'Develop {concept} engine monitoring',
                    'Implement augmented {concept} reality',
                    'Create {concept} certification process',
                    'Develop {concept} pilot app',
                    'Implement {concept} telemetry',
                    'Create {concept} supply chain',
                    'Develop {concept} cybersecurity',
                    'Implement {concept} blockchain parts'
                ]
            },
            
            # === CONSTRUCTION ===
            'Construction': {
                'french': [
                    'Développer gestion {concept} chantier',
                    'Implémenter BIM {concept} collaboratif',
                    'Créer planification {concept} travaux',
                    'Configurer IoT {concept} sécurité',
                    'Développer estimation {concept} coûts',
                    'Implémenter drone {concept} inspection',
                    'Créer app mobile {concept} terrain',
                    'Développer réalité {concept} augmentée',
                    'Implémenter gestion {concept} ressources',
                    'Créer qualité {concept} contrôle',
                    'Développer facility {concept} management',
                    'Implémenter analytics {concept} performance',
                    'Créer workflow {concept} validation',
                    'Développer maintenance {concept} prédictive',
                    'Implémenter blockchain {concept} contrats'
                ],
                'english': [
                    'Develop {concept} site management',
                    'Implement collaborative {concept} BIM',
                    'Create {concept} work planning',
                    'Configure {concept} safety IoT',
                    'Develop {concept} cost estimation',
                    'Implement {concept} drone inspection',
                    'Create mobile {concept} field app',
                    'Develop augmented {concept} reality',
                    'Implement {concept} resource management',
                    'Create {concept} quality control',
                    'Develop {concept} facility management',
                    'Implement {concept} performance analytics',
                    'Create {concept} validation workflow',
                    'Develop predictive {concept} maintenance',
                    'Implement {concept} blockchain contracts'
                ]
            },
            
            # === FOOD & BEVERAGE ===
            'Food & Beverage': {
                'french': [
                    'Développer plateforme {concept} livraison',
                    'Implémenter gestion {concept} restaurant',
                    'Créer système {concept} commande',
                    'Configurer paiement {concept} mobile',
                    'Développer gestion {concept} inventaire',
                    'Implémenter traçabilité {concept} aliments',
                    'Créer app {concept} loyalty',
                    'Développer menu {concept} digital',
                    'Implémenter nutrition {concept} tracking',
                    'Créer réservation {concept} table',
                    'Développer caisse {concept} intelligente',
                    'Implémenter analytics {concept} vente',
                    'Créer système {concept} franchise',
                    'Développer formation {concept} personnel',
                    'Implémenter IoT {concept} cuisine'
                ],
                'english': [
                    'Develop {concept} delivery platform',
                    'Implement {concept} restaurant management',
                    'Create {concept} ordering system',
                    'Configure mobile {concept} payment',
                    'Develop {concept} inventory management',
                    'Implement {concept} food traceability',
                    'Create {concept} loyalty app',
                    'Develop digital {concept} menu',
                    'Implement {concept} nutrition tracking',
                    'Create {concept} table reservation',
                    'Develop intelligent {concept} POS',
                    'Implement {concept} sales analytics',
                    'Create {concept} franchise system',
                    'Develop {concept} staff training',
                    'Implement kitchen {concept} IoT'
                ]
            },
            
            # === TEXTILE & FASHION ===
            'Textile & Fashion': {
                'french': [
                    'Développer e-commerce {concept} mode',
                    'Implémenter try-on {concept} virtuel',
                    'Créer gestion {concept} collection',
                    'Configurer supply chain {concept}',
                    'Développer app {concept} styliste',
                    'Implémenter recommandation {concept} IA',
                    'Créer système {concept} tailles',
                    'Développer marketplace {concept}',
                    'Implémenter traçabilité {concept} éthique',
                    'Créer design {concept} collaboratif',
                    'Développer analytics {concept} trends',
                    'Implémenter réalité {concept} augmentée',
                    'Créer planning {concept} production',
                    'Développer loyalty {concept} program',
                    'Implémenter blockchain {concept} authenticité'
                ],
                'english': [
                    'Develop fashion {concept} e-commerce',
                    'Implement virtual {concept} try-on',
                    'Create {concept} collection management',
                    'Configure {concept} supply chain',
                    'Develop {concept} stylist app',
                    'Implement AI {concept} recommendation',
                    'Create {concept} sizing system',
                    'Develop {concept} marketplace',
                    'Implement ethical {concept} traceability',
                    'Create collaborative {concept} design',
                    'Develop {concept} trends analytics',
                    'Implement augmented {concept} reality',
                    'Create {concept} production planning',
                    'Develop {concept} loyalty program',
                    'Implement {concept} authenticity blockchain'
                ]
            },
            
                # === CHEMICAL (suite) ===
            'Chemical': {
                'french': [
                    'Développer LIMS {concept} laboratoire',
                    'Implémenter contrôle {concept} qualité',
                    'Créer gestion {concept} formules',
                    'Configurer traçabilité {concept} batch',
                    'Développer sécurité {concept} chimique',
                    'Implémenter conformité {concept} REACH',
                    'Créer système {concept} R&D',
                    'Développer monitoring {concept} process',
                    'Implémenter gestion {concept} déchets',
                    'Créer documentation {concept} technique',
                    'Développer app mobile {concept} terrain',
                    'Implémenter analytics {concept} production',
                    'Créer workflow {concept} validation',
                    'Développer maintenance {concept} équipements',
                    'Implémenter blockchain {concept} traçabilité'
                ],
                'english': [
                    'Develop laboratory {concept} LIMS',
                    'Implement {concept} quality control',
                    'Create {concept} formula management',
                    'Configure {concept} batch traceability',
                    'Develop chemical {concept} safety',
                    'Implement {concept} REACH compliance',
                    'Create {concept} R&D system',
                    'Develop {concept} process monitoring',
                    'Implement {concept} waste management',
                    'Create technical {concept} documentation',
                    'Develop mobile {concept} field app',
                    'Implement {concept} production analytics',
                    'Create {concept} validation workflow',
                    'Develop {concept} equipment maintenance',
                    'Implement {concept} traceability blockchain'
                ]
            },
            
            # === SPORTS & FITNESS ===
            'Sports & Fitness': {
                'french': [
                    'Développer app {concept} fitness',
                    'Implémenter tracking {concept} performance',
                    'Créer réservation {concept} cours',
                    'Configurer wearables {concept} IoT',
                    'Développer coaching {concept} virtuel',
                    'Implémenter nutrition {concept} planning',
                    'Créer communauté {concept} sportive',
                    'Développer gestion {concept} salle',
                    'Implémenter analytics {concept} santé',
                    'Créer programme {concept} personnalisé',
                    'Développer streaming {concept} cours',
                    'Implémenter gamification {concept}',
                    'Créer marketplace {concept} équipements',
                    'Développer événements {concept} sportifs',
                    'Implémenter blockchain {concept} records'
                ],
                'english': [
                    'Develop fitness {concept} app',
                    'Implement {concept} performance tracking',
                    'Create {concept} class booking',
                    'Configure {concept} wearables IoT',
                    'Develop virtual {concept} coaching',
                    'Implement {concept} nutrition planning',
                    'Create sports {concept} community',
                    'Develop {concept} gym management',
                    'Implement health {concept} analytics',
                    'Create personalized {concept} program',
                    'Develop {concept} class streaming',
                    'Implement {concept} gamification',
                    'Create {concept} equipment marketplace',
                    'Develop sports {concept} events',
                    'Implement {concept} blockchain records'
                ]
            },
            
            # === TRAVEL & TOURISM ===
            'Travel & Tourism': {
                'french': [
                    'Développer plateforme {concept} voyage',
                    'Implémenter réservation {concept} multi-services',
                    'Créer guide {concept} interactif',
                    'Configurer paiement {concept} multi-devises',
                    'Développer app mobile {concept} voyage',
                    'Implémenter recommandation {concept} IA',
                    'Créer gestion {concept} itinéraires',
                    'Développer check-in {concept} digital',
                    'Implémenter géolocalisation {concept}',
                    'Créer système {concept} avis',
                    'Développer chat {concept} support',
                    'Implémenter réalité {concept} virtuelle',
                    'Créer marketplace {concept} activités',
                    'Développer loyalty {concept} program',
                    'Implémenter blockchain {concept} booking'
                ],
                'english': [
                    'Develop travel {concept} platform',
                    'Implement multi-service {concept} booking',
                    'Create interactive {concept} guide',
                    'Configure multi-currency {concept} payment',
                    'Develop mobile travel {concept} app',
                    'Implement AI {concept} recommendation',
                    'Create {concept} itinerary management',
                    'Develop digital {concept} check-in',
                    'Implement {concept} geolocation',
                    'Create {concept} review system',
                    'Develop {concept} support chat',
                    'Implement virtual {concept} reality',
                    'Create {concept} activities marketplace',
                    'Develop {concept} loyalty program',
                    'Implement {concept} blockchain booking'
                ]
            },
            
            # === EVENTS & HOSPITALITY ===
            'Events & Hospitality': {
                'french': [
                    'Développer gestion {concept} événements',
                    'Implémenter billetterie {concept} digitale',
                    'Créer planning {concept} venues',
                    'Configurer paiement {concept} sécurisé',
                    'Développer app {concept} participants',
                    'Implémenter check-in {concept} NFC',
                    'Créer gestion {concept} catering',
                    'Développer streaming {concept} live',
                    'Implémenter networking {concept} app',
                    'Créer analytics {concept} événement',
                    'Développer CRM {concept} exposants',
                    'Implémenter réalité {concept} augmentée',
                    'Créer système {concept} feedback',
                    'Développer marketplace {concept} services',
                    'Implémenter blockchain {concept} tickets'
                ],
                'english': [
                    'Develop {concept} event management',
                    'Implement digital {concept} ticketing',
                    'Create {concept} venue planning',
                    'Configure secure {concept} payment',
                    'Develop {concept} attendee app',
                    'Implement NFC {concept} check-in',
                    'Create {concept} catering management',
                    'Develop live {concept} streaming',
                    'Implement {concept} networking app',
                    'Create {concept} event analytics',
                    'Develop {concept} exhibitor CRM',
                    'Implement augmented {concept} reality',
                    'Create {concept} feedback system',
                    'Develop {concept} services marketplace',
                    'Implement {concept} blockchain tickets'
                ]
            },
            
            # === GOVERNMENT ===
            'Government': {
                'french': [
                    'Développer portail citoyen {concept}',
                    'Implémenter dématérialisation {concept}',
                    'Créer interface agent {concept}',
                    'Configurer authentification {concept} forte',
                    'Développer workflow {concept} administratif',
                    'Implémenter transparence {concept} données',
                    'Créer système notification {concept}',
                    'Développer tableau bord {concept}',
                    'Implémenter archivage {concept} légal',
                    'Créer API {concept} interopérable',
                    'Développer mobile gov {concept}',
                    'Implémenter signature électronique {concept}',
                    'Créer système rendez-vous {concept}',
                    'Développer reporting {concept} réglementaire',
                    'Implémenter accessibilité {concept} numérique'
                ],
                'english': [
                    'Develop citizen {concept} portal',
                    'Implement {concept} digitalization',
                    'Create agent {concept} interface',
                    'Configure strong {concept} authentication',
                    'Develop administrative {concept} workflow',
                    'Implement {concept} data transparency',
                    'Create {concept} notification system',
                    'Develop {concept} dashboard',
                    'Implement legal {concept} archiving',
                    'Create interoperable {concept} API',
                    'Develop mobile gov {concept}',
                    'Implement electronic {concept} signature',
                    'Create {concept} appointment system',
                    'Develop regulatory {concept} reporting',
                    'Implement digital {concept} accessibility'
                ]
            },
            
            # === NON-PROFIT ===
            'Non-profit': {
                'french': [
                    'Développer plateforme {concept} dons',
                    'Implémenter gestion {concept} bénévoles',
                    'Créer CRM {concept} donateurs',
                    'Configurer campagne {concept} fundraising',
                    'Développer app mobile {concept} engagement',
                    'Implémenter transparence {concept} financière',
                    'Créer système {concept} événements',
                    'Développer communication {concept} impact',
                    'Implémenter gestion {concept} projets',
                    'Créer marketplace {concept} services',
                    'Développer analytics {concept} social',
                    'Implémenter blockchain {concept} traçabilité',
                    'Créer système {concept} partenariats',
                    'Développer formation {concept} bénévoles',
                    'Implémenter conformité {concept} légale'
                ],
                'english': [
                    'Develop {concept} donation platform',
                    'Implement {concept} volunteer management',
                    'Create {concept} donor CRM',
                    'Configure {concept} fundraising campaign',
                    'Develop mobile {concept} engagement app',
                    'Implement financial {concept} transparency',
                    'Create {concept} events system',
                    'Develop {concept} impact communication',
                    'Implement {concept} project management',
                    'Create {concept} services marketplace',
                    'Develop social {concept} analytics',
                    'Implement {concept} traceability blockchain',
                    'Create {concept} partnerships system',
                    'Develop {concept} volunteer training',
                    'Implement legal {concept} compliance'
                ]
            },
            
            # === ENVIRONMENTAL ===
            'Environmental': {
                'french': [
                    'Développer monitoring {concept} environnemental',
                    'Implémenter IoT {concept} capteurs',
                    'Créer système {concept} alertes',
                    'Configurer analytics {concept} données',
                    'Développer app mobile {concept} terrain',
                    'Implémenter prédiction {concept} modèles',
                    'Créer dashboard {concept} impact',
                    'Développer reporting {concept} carbone',
                    'Implémenter traçabilité {concept} déchets',
                    'Créer marketplace {concept} vert',
                    'Développer certification {concept} écologique',
                    'Implémenter blockchain {concept} crédits',
                    'Créer système {concept} compliance',
                    'Développer éducation {concept} environnementale',
                    'Implémenter API {concept} satellite'
                ],
                'english': [
                    'Develop environmental {concept} monitoring',
                    'Implement {concept} sensor IoT',
                    'Create {concept} alert system',
                    'Configure {concept} data analytics',
                    'Develop mobile {concept} field app',
                    'Implement {concept} prediction models',
                    'Create {concept} impact dashboard',
                    'Develop {concept} carbon reporting',
                    'Implement {concept} waste traceability',
                    'Create green {concept} marketplace',
                    'Develop ecological {concept} certification',
                    'Implement {concept} credits blockchain',
                    'Create {concept} compliance system',
                    'Develop environmental {concept} education',
                    'Implement satellite {concept} API'
                ]
            },
            
            # === AGRICULTURE ===
            'Agriculture': {
                'french': [
                    'Développer agriculture {concept} précision',
                    'Implémenter IoT {concept} capteurs',
                    'Créer gestion {concept} exploitations',
                    'Configurer irrigation {concept} intelligente',
                    'Développer app mobile {concept} agriculteur',
                    'Implémenter prédiction {concept} récoltes',
                    'Créer marketplace {concept} produits',
                    'Développer traçabilité {concept} alimentaire',
                    'Implémenter drone {concept} surveillance',
                    'Créer système {concept} météo',
                    'Développer analytics {concept} sol',
                    'Implémenter blockchain {concept} supply',
                    'Créer gestion {concept} bétail',
                    'Développer formation {concept} agriculteurs',
                    'Implémenter certification {concept} bio'
                ],
                'english': [
                    'Develop precision {concept} agriculture',
                    'Implement {concept} sensor IoT',
                    'Create {concept} farm management',
                    'Configure smart {concept} irrigation',
                    'Develop {concept} farmer mobile app',
                    'Implement {concept} crop prediction',
                    'Create {concept} products marketplace',
                    'Develop food {concept} traceability',
                    'Implement {concept} drone surveillance',
                    'Create {concept} weather system',
                    'Develop {concept} soil analytics',
                    'Implement {concept} supply blockchain',
                    'Create {concept} livestock management',
                    'Develop {concept} farmer training',
                    'Implement organic {concept} certification'
                ]
            },
            
            # === BIOTECHNOLOGY ===
            'Biotechnology': {
                'french': [
                    'Développer LIMS {concept} biotechnologie',
                    'Implémenter gestion {concept} échantillons',
                    'Créer workflow {concept} recherche',
                    'Configurer séquençage {concept} données',
                    'Développer analyse {concept} génomique',
                    'Implémenter compliance {concept} GMP',
                    'Créer système {concept} essais',
                    'Développer collaboration {concept} recherche',
                    'Implémenter analytics {concept} biomarqueurs',
                    'Créer gestion {concept} propriété',
                    'Développer app mobile {concept} clinique',
                    'Implémenter blockchain {concept} données',
                    'Créer système {concept} publication',
                    'Développer formation {concept} personnel',
                    'Implémenter sécurité {concept} laboratoire'
                ],
                'english': [
                    'Develop biotechnology {concept} LIMS',
                    'Implement {concept} sample management',
                    'Create {concept} research workflow',
                    'Configure {concept} sequencing data',
                    'Develop {concept} genomic analysis',
                    'Implement {concept} GMP compliance',
                    'Create {concept} trials system',
                    'Develop {concept} research collaboration',
                    'Implement {concept} biomarkers analytics',
                    'Create {concept} IP management',
                    'Develop mobile {concept} clinical app',
                    'Implement {concept} data blockchain',
                    'Create {concept} publication system',
                    'Develop {concept} staff training',
                    'Implement {concept} lab security'
                ]
            },
            
            # === RESEARCH & DEVELOPMENT ===
            'Research & Development': {
                'french': [
                    'Développer gestion {concept} projets R&D',
                    'Implémenter collaboration {concept} recherche',
                    'Créer base {concept} connaissances',
                    'Configurer publication {concept} scientifique',
                    'Développer analytics {concept} innovation',
                    'Implémenter propriété {concept} intellectuelle',
                    'Créer workflow {concept} validation',
                    'Développer lab {concept} management',
                    'Implémenter grant {concept} management',
                    'Créer système {concept} peer-review',
                    'Développer app mobile {concept} chercheur',
                    'Implémenter blockchain {concept} publications',
                    'Créer réseau {concept} collaboration',
                    'Développer formation {concept} recherche',
                    'Implémenter compliance {concept} éthique'
                ],
                'english': [
                    'Develop R&D {concept} project management',
                    'Implement {concept} research collaboration',
                    'Create {concept} knowledge base',
                    'Configure scientific {concept} publishing',
                    'Develop {concept} innovation analytics',
                    'Implement intellectual {concept} property',
                    'Create {concept} validation workflow',
                    'Develop {concept} lab management',
                    'Implement {concept} grant management',
                    'Create {concept} peer-review system',
                    'Develop {concept} researcher mobile app',
                    'Implement {concept} publications blockchain',
                    'Create {concept} collaboration network',
                    'Develop {concept} research training',
                    'Implement ethical {concept} compliance'
                ]
            },
            
            # === PHARMACEUTICAL ===
            'Pharmaceutical': {
                'french': [
                    'Développer gestion {concept} essais cliniques',
                    'Implémenter pharmacovigilance {concept}',
                    'Créer système {concept} regulatory',
                    'Configurer traçabilité {concept} médicaments',
                    'Développer LIMS {concept} pharma',
                    'Implémenter compliance {concept} FDA',
                    'Créer workflow {concept} validation',
                    'Développer supply chain {concept}',
                    'Implémenter analytics {concept} effets',
                    'Créer gestion {concept} brevets',
                    'Développer app mobile {concept} patients',
                    'Implémenter blockchain {concept} supply',
                    'Créer système {concept} adverse events',
                    'Développer formation {concept} personnel',
                    'Implémenter sécurité {concept} données'
                ],
                'english': [
                    'Develop clinical {concept} trials management',
                    'Implement {concept} pharmacovigilance',
                    'Create regulatory {concept} system',
                    'Configure {concept} drug traceability',
                    'Develop pharma {concept} LIMS',
                    'Implement {concept} FDA compliance',
                    'Create {concept} validation workflow',
                    'Develop {concept} supply chain',
                    'Implement {concept} effects analytics',
                    'Create {concept} patent management',
                    'Develop mobile {concept} patient app',
                    'Implement {concept} supply blockchain',
                    'Create {concept} adverse events system',
                    'Develop {concept} staff training',
                    'Implement {concept} data security'
                ]
            },
            
            # === MARKETING & ADVERTISING ===
            'Marketing & Advertising': {
                'french': [
                    'Développer plateforme {concept} marketing',
                    'Implémenter automation {concept} campaigns',
                    'Créer analytics {concept} performance',
                    'Configurer attribution {concept} multi-touch',
                    'Développer CRM {concept} prospects',
                    'Implémenter personnalisation {concept} IA',
                    'Créer système {concept} A/B testing',
                    'Développer social media {concept}',
                    'Implémenter SEO {concept} automatique',
                    'Créer dashboard {concept} ROI',
                    'Développer app mobile {concept} marketeur',
                    'Implémenter programmatic {concept} advertising',
                    'Créer système {concept} lead scoring',
                    'Développer content {concept} management',
                    'Implémenter blockchain {concept} attribution'
                ],
                'english': [
                    'Develop marketing {concept} platform',
                    'Implement {concept} campaign automation',
                    'Create {concept} performance analytics',
                    'Configure multi-touch {concept} attribution',
                    'Develop {concept} prospect CRM',
                    'Implement AI {concept} personalization',
                    'Create {concept} A/B testing system',
                    'Develop social media {concept}',
                    'Implement automatic {concept} SEO',
                    'Create {concept} ROI dashboard',
                    'Develop mobile {concept} marketer app',
                    'Implement programmatic {concept} advertising',
                    'Create {concept} lead scoring system',
                    'Develop {concept} content management',
                    'Implement {concept} attribution blockchain'
                ]
            },
            
            # === PUBLIC RELATIONS ===
            'Public Relations': {
                'french': [
                    'Développer gestion {concept} médias',
                    'Implémenter monitoring {concept} réputation',
                    'Créer système {concept} communiqués',
                    'Configurer analytics {concept} mention',
                    'Développer CRM {concept} journalistes',
                    'Implémenter gestion {concept} crise',
                    'Créer calendrier {concept} éditorial',
                    'Développer app mobile {concept} PR',
                    'Implémenter sentiment {concept} analysis',
                    'Créer dashboard {concept} influence',
                    'Développer workflow {concept} approbation',
                    'Implémenter social {concept} listening',
                    'Créer système {concept} événements',
                    'Développer reporting {concept} impact',
                    'Implémenter blockchain {concept} authentification'
                ],
                'english': [
                    'Develop {concept} media management',
                    'Implement {concept} reputation monitoring',
                    'Create {concept} press release system',
                    'Configure {concept} mention analytics',
                    'Develop {concept} journalist CRM',
                    'Implement {concept} crisis management',
                    'Create editorial {concept} calendar',
                    'Develop mobile {concept} PR app',
                    'Implement {concept} sentiment analysis',
                    'Create {concept} influence dashboard',
                    'Develop {concept} approval workflow',
                    'Implement social {concept} listening',
                    'Create {concept} events system',
                    'Develop {concept} impact reporting',
                    'Implement {concept} authentication blockchain'
                ]
            },
            
            # === CREATIVE & ENTERTAINMENT ===
            'Creative & Entertainment': {
                'french': [
                    'Développer plateforme {concept} créative',
                    'Implémenter collaboration {concept} artistique',
                    'Créer gestion {concept} projets créatifs',
                    'Configurer streaming {concept} contenu',
                    'Développer marketplace {concept} talents',
                    'Implémenter droits {concept} auteur',
                    'Créer système {concept} production',
                    'Développer app mobile {concept} créateur',
                    'Implémenter analytics {concept} audience',
                    'Créer monétisation {concept} contenu',
                    'Développer workflow {concept} post-production',
                    'Implémenter NFT {concept} créations',
                    'Créer système {concept} feedback',
                    'Développer formation {concept} créative',
                    'Implémenter blockchain {concept} royalties'
                ],
                'english': [
                    'Develop creative {concept} platform',
                    'Implement artistic {concept} collaboration',
                    'Create creative {concept} project management',
                    'Configure {concept} content streaming',
                    'Develop {concept} talent marketplace',
                    'Implement {concept} copyright management',
                    'Create {concept} production system',
                    'Develop mobile {concept} creator app',
                    'Implement {concept} audience analytics',
                    'Create {concept} content monetization',
                    'Develop {concept} post-production workflow',
                    'Implement {concept} NFT creations',
                    'Create {concept} feedback system',
                    'Develop creative {concept} training',
                    'Implement {concept} royalties blockchain'
                ]
            }
        }
        
        # Sélection des templates selon l'industrie
        templates = industry_templates.get(industry, {}).get(language, [])
        
        if templates and domain_context:
            # Générer jusqu'à 15 tâches (8 templates × 2 concepts max)
            used_templates = set()
            for template in templates[:8]:  # Prendre 8 templates
                for concept in domain_context[:2]:  # 2 concepts par template
                    if template not in used_templates:
                        task_name = template.format(concept=concept)
                        domain_tasks.append(self._create_ml_task(task_name, {}, industry, complexity, language))
                        used_templates.add(template)
                        if len(domain_tasks) >= 15:  # Limite à 15 tâches
                            break
                if len(domain_tasks) >= 15:
                    break
        elif not domain_context:
            # Fallback générique si pas de contexte spécifique
            fallback_templates = templates[:5] if templates else []
            for template in fallback_templates:
                generic_concept = industry.lower()
                task_name = template.format(concept=generic_concept)
                domain_tasks.append(self._create_ml_task(task_name, {}, industry, complexity, language))
        
        return domain_tasks[:15]  # Garantir max 15 tâches
    
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
    
    def _eliminate_similar_tasks(self, tasks: List[Dict[str, Any]], similarity_threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Éliminer les tâches trop similaires avec analyse sémantique"""
        unique_tasks = []
        
        for task in tasks:
            is_similar = False
            task_words = set(task['name'].lower().split())
            
            for existing_task in unique_tasks:
                existing_words = set(existing_task['name'].lower().split())
                
                # Calcul de similarité Jaccard
                intersection = task_words.intersection(existing_words)
                union = task_words.union(existing_words)
                similarity = len(intersection) / len(union) if union else 0
                
                if similarity > similarity_threshold:
                    # Garder la tâche avec le meilleur score
                    if task.get('final_score', 0) <= existing_task.get('final_score', 0):
                        is_similar = True
                        break
                    else:
                        # Remplacer la tâche existante
                        unique_tasks.remove(existing_task)
                        break
            
            if not is_similar:
                unique_tasks.append(task)
        
        return unique_tasks
    
    def _select_final_tasks(self, top_tasks: List[Dict[str, Any]], project_description: str, max_tasks: int) -> List[Dict[str, Any]]:
        """Sélection finale garantissant le nombre demandé de tâches logiques"""
        if len(top_tasks) <= max_tasks:
            return top_tasks
        
        # Étape 1: Éliminer seulement les vrais doublons (seuil très strict)
        unique_tasks = []
        seen_names = set()
        
        for task in sorted(top_tasks, key=lambda x: x.get('final_score', 0), reverse=True):
            task_name_clean = task['name'].lower().strip()
            
            # Vérifier les doublons exacts seulement
            is_exact_duplicate = False
            for seen_name in seen_names:
                similarity = self._calculate_exact_similarity(task_name_clean, seen_name)
                if similarity > 0.95:  # Seulement les quasi-identiques
                    is_exact_duplicate = True
                    break
            
            if not is_exact_duplicate:
                unique_tasks.append(task)
                seen_names.add(task_name_clean)
        
        # Étape 2: Si on a encore trop, diversifier intelligemment
        if len(unique_tasks) > max_tasks:
            return self._smart_diversification(unique_tasks, max_tasks)
        
        return unique_tasks

    def _calculate_exact_similarity(self, name1: str, name2: str) -> float:
        """Calculer similarité exacte entre deux noms"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, name1, name2).ratio()

    def _smart_diversification(self, tasks: List[Dict[str, Any]], max_tasks: int) -> List[Dict[str, Any]]:
        """Diversification intelligente garantissant max_tasks"""
        # Grouper par catégorie
        by_category = {}
        for task in tasks:
            category = task.get('category', 'other')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(task)
        
        # Trier chaque catégorie par score
        for category in by_category:
            by_category[category].sort(key=lambda x: x.get('final_score', 0), reverse=True)
        
        selected = []
        categories = list(by_category.keys())
        
        # Distribution en rond-robin pour garantir la diversité
        while len(selected) < max_tasks and any(by_category.values()):
            for category in categories:
                if len(selected) >= max_tasks:
                    break
                if by_category[category]:  # Si il reste des tâches dans cette catégorie
                    selected.append(by_category[category].pop(0))
        
        return selected[:max_tasks]
    
    def _ensure_task_diversity(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Assurer la diversité des tâches en évitant les doublons conceptuels"""
        if not tasks:
            return tasks
        
        diverse_tasks = []
        used_concepts = set()
        
        for task in tasks:
            # Extraire les concepts clés du nom de la tâche
            task_concepts = set(task['name'].lower().split())
            
            # Vérifier si cette tâche apporte de nouveaux concepts
            new_concepts = task_concepts - used_concepts
            
            if new_concepts or len(diverse_tasks) < 3:  # Garder au moins 3 tâches
                diverse_tasks.append(task)
                used_concepts.update(task_concepts)
        
        return diverse_tasks
    
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
            'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Media', 'Logistics', 'Energy',
            'Gaming', 'Legal Services', 'Consulting', 'Human Resources', 'Real Estate', 'Insurance',
            'Automotive', 'Aerospace', 'Construction', 'Food & Beverage', 'Textile & Fashion', 'Chemical',
            'Sports & Fitness', 'Travel & Tourism', 'Events & Hospitality', 'Government', 'Non-profit',
            'Environmental', 'Agriculture', 'Biotechnology', 'Research & Development', 'Pharmaceutical',
            'Marketing & Advertising', 'Public Relations', 'Creative & Entertainment'
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
        
        if industry not in ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Media', 'Logistics', 'Energy',
                            'Gaming', 'Legal Services', 'Consulting', 'Human Resources', 'Real Estate', 'Insurance',
                            'Automotive', 'Aerospace', 'Construction', 'Food & Beverage', 'Textile & Fashion', 'Chemical',
                            'Sports & Fitness', 'Travel & Tourism', 'Events & Hospitality', 'Government', 'Non-profit',
                            'Environmental', 'Agriculture', 'Biotechnology', 'Research & Development', 'Pharmaceutical',
                            'Marketing & Advertising']:
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