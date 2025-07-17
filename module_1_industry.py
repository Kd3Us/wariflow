# industry_classifier.py - Module isolé pour la classification d'industrie
# 8 industries tech principales avec support multilingue (français/anglais)

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import pickle
from datetime import datetime
from functools import wraps
from typing import Dict, List, Any, Tuple
import hashlib

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score
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


class IndustryDetector:
    """Détecteur d'industrie multilingue pour 8 secteurs tech principaux"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        self.industries = [
            'Technology',     # Tech générale, SaaS, DevOps
            'Healthcare',     # Santé, médical, télémédecine
            'Finance',        # FinTech, banque, assurance
            'Education',      # EdTech, formation, e-learning
            'Retail',         # E-commerce, marketplace
            'Media',          # Streaming, contenu, réseaux sociaux
            'Logistics',      # Transport, livraison, supply chain
            'Energy'          # Smart grid, IoT industriel, cleantech
        ]
        
        # Patterns linguistiques par industrie et langue
        self.industry_patterns = {
            'Technology': {
                'french': [
                    'api', 'saas', 'plateforme', 'cloud', 'devops', 'microservices', 
                    'infrastructure', 'développement', 'logiciel', 'application',
                    'système', 'serveur', 'base données', 'algorithme', 'intelligence artificielle',
                    'machine learning', 'blockchain', 'cybersécurité'
                ],
                'english': [
                    'api', 'saas', 'platform', 'cloud', 'devops', 'microservices',
                    'infrastructure', 'development', 'software', 'application',
                    'system', 'server', 'database', 'algorithm', 'artificial intelligence',
                    'machine learning', 'blockchain', 'cybersecurity'
                ]
            },
            'Healthcare': {
                'french': [
                    'santé', 'médical', 'patient', 'hôpital', 'clinique', 'docteur',
                    'télémédecine', 'dossier médical', 'prescription', 'diagnostic',
                    'épidémiologie', 'pharmacie', 'thérapie', 'consultation',
                    'urgence', 'chirurgie', 'radiologie'
                ],
                'english': [
                    'health', 'medical', 'patient', 'hospital', 'clinic', 'doctor',
                    'telemedicine', 'medical record', 'prescription', 'diagnosis',
                    'epidemiology', 'pharmacy', 'therapy', 'consultation',
                    'emergency', 'surgery', 'radiology'
                ]
            },
            'Finance': {
                'french': [
                    'banque', 'finance', 'fintech', 'paiement', 'transaction', 'crédit',
                    'investissement', 'trading', 'portefeuille', 'assurance', 'prêt',
                    'comptabilité', 'facture', 'budget', 'crypto', 'blockchain',
                    'fraude', 'compliance', 'audit'
                ],
                'english': [
                    'bank', 'finance', 'fintech', 'payment', 'transaction', 'credit',
                    'investment', 'trading', 'portfolio', 'insurance', 'loan',
                    'accounting', 'invoice', 'budget', 'crypto', 'blockchain',
                    'fraud', 'compliance', 'audit'
                ]
            },
            'Education': {
                'french': [
                    'éducation', 'formation', 'école', 'université', 'étudiant', 'professeur',
                    'cours', 'apprentissage', 'elearning', 'mooc', 'certification',
                    'évaluation', 'note', 'examen', 'curriculum', 'pédagogie',
                    'tutorat', 'classe virtuelle'
                ],
                'english': [
                    'education', 'training', 'school', 'university', 'student', 'teacher',
                    'course', 'learning', 'elearning', 'mooc', 'certification',
                    'assessment', 'grade', 'exam', 'curriculum', 'pedagogy',
                    'tutoring', 'virtual classroom'
                ]
            },
            'Retail': {
                'french': [
                    'ecommerce', 'boutique', 'magasin', 'vente', 'achat', 'commerce',
                    'marketplace', 'panier', 'commande', 'livraison', 'stock',
                    'inventaire', 'client', 'produit', 'catalogue', 'promotion',
                    'réduction', 'fidélité'
                ],
                'english': [
                    'ecommerce', 'shop', 'store', 'sale', 'purchase', 'retail',
                    'marketplace', 'cart', 'order', 'delivery', 'inventory',
                    'stock', 'customer', 'product', 'catalog', 'promotion',
                    'discount', 'loyalty'
                ]
            },
            'Media': {
                'french': [
                    'média', 'contenu', 'streaming', 'vidéo', 'audio', 'podcast',
                    'réseaux sociaux', 'publication', 'article', 'blog', 'news',
                    'divertissement', 'film', 'musique', 'photo', 'créateur',
                    'influenceur', 'communauté'
                ],
                'english': [
                    'media', 'content', 'streaming', 'video', 'audio', 'podcast',
                    'social media', 'publication', 'article', 'blog', 'news',
                    'entertainment', 'movie', 'music', 'photo', 'creator',
                    'influencer', 'community'
                ]
            },
            'Logistics': {
                'french': [
                    'logistique', 'transport', 'livraison', 'expédition', 'entrepôt',
                    'supply chain', 'chaîne logistique', 'tracking', 'suivi', 'route',
                    'véhicule', 'colis', 'fret', 'distribution', 'optimisation',
                    'fleet', 'gps'
                ],
                'english': [
                    'logistics', 'transport', 'delivery', 'shipping', 'warehouse',
                    'supply chain', 'tracking', 'route', 'vehicle', 'package',
                    'freight', 'distribution', 'optimization', 'fleet', 'gps',
                    'last mile', 'fulfillment'
                ]
            },
            'Energy': {
                'french': [
                    'énergie', 'électricité', 'smart grid', 'iot industriel', 'capteur',
                    'renouvelable', 'solaire', 'éolien', 'monitoring', 'consommation',
                    'efficacité énergétique', 'réseau électrique', 'compteur intelligent',
                    'automation', 'greentech', 'cleantech'
                ],
                'english': [
                    'energy', 'electricity', 'smart grid', 'industrial iot', 'sensor',
                    'renewable', 'solar', 'wind', 'monitoring', 'consumption',
                    'energy efficiency', 'power grid', 'smart meter',
                    'automation', 'greentech', 'cleantech'
                ]
            }
        }

        
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte - Version améliorée"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour', 'dans', 'sur', 'et', 'ou',
            'développer', 'créer', 'implémenter', 'optimiser', 'gérer', 'analyser',
            'plateforme', 'gestion', 'données', 'utilisateur', 'fonctionnalité',
            'télémédecine', 'sécurité', 'efficacité', 'énergie', 'hôpital'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or', 'of', 'to',
            'develop', 'create', 'implement', 'optimize', 'manage', 'analyze',
            'platform', 'management', 'data', 'user', 'feature',
            'healthcare', 'telemedicine', 'security', 'efficiency', 'hospital'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'

    
    
class IndustryFeatureExtractor:
    """Extracteur de features spécialisé pour la classification d'industrie"""
    
    def __init__(self, industry_detector: IndustryDetector):
        self.industry_detector = industry_detector
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
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


    def extract_industry_features(self, text: str) -> Dict[str, float]:
        """Extraire les features spécifiques pour la classification d'industrie"""
        language = self.industry_detector.detect_language(text)
        text_lower = text.lower()
        
        features = {}
        
        # 1. Scores par industrie basés sur les mots-clés
        for industry in self.industry_detector.industries:
            keywords = self.industry_detector.industry_patterns[industry][language]
            industry_score = sum(1 for keyword in keywords if keyword in text_lower)
            features[f'{industry.lower()}_keyword_count'] = industry_score
            features[f'{industry.lower()}_keyword_density'] = industry_score / len(text_lower.split()) if text_lower else 0
        
        # 2. Features textuelles générales
        words = text_lower.split()
        features['text_length'] = len(text)
        features['word_count'] = len(words)
        features['unique_word_ratio'] = len(set(words)) / len(words) if words else 0
        
        # 3. Features linguistiques
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
        
        # 4. Features de domaine croisé
        features['tech_vs_business'] = self._calculate_tech_business_ratio(text_lower, language)
        features['complexity_indicator'] = self._calculate_complexity_score(text_lower, language)
        
        return features
    
    def _calculate_tech_business_ratio(self, text: str, language: str) -> float:
        """Ratio entre termes techniques et business"""
        if language == 'french':
            tech_terms = ['api', 'algorithme', 'système', 'développement', 'architecture']
            business_terms = ['client', 'utilisateur', 'marché', 'service', 'gestion']
        else:
            tech_terms = ['api', 'algorithm', 'system', 'development', 'architecture']
            business_terms = ['client', 'user', 'market', 'service', 'management']
        
        tech_count = sum(1 for term in tech_terms if term in text)
        business_count = sum(1 for term in business_terms if term in text)
        
        if tech_count + business_count == 0:
            return 0.5
        
        return tech_count / (tech_count + business_count)
    
    def _calculate_complexity_score(self, text: str, language: str) -> float:
        """Score de complexité technique"""
        if language == 'french':
            complex_terms = ['intelligence artificielle', 'blockchain', 'microservices', 'cloud', 'iot']
        else:
            complex_terms = ['artificial intelligence', 'blockchain', 'microservices', 'cloud', 'iot']
        
        return sum(1 for term in complex_terms if term in text) / 5


class MLIndustryClassifier:
    """Classificateur ML pour identifier l'industrie"""
    
    def __init__(self):
        self.industry_detector = IndustryDetector()
        self.feature_extractor = IndustryFeatureExtractor(self.industry_detector)
        self.classifier = None
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Cache des prédictions
        self.prediction_cache = {}

    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte - Version améliorée"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour', 'dans', 'sur', 'et', 'ou',
            'développer', 'créer', 'implémenter', 'optimiser', 'gérer', 'analyser',
            'plateforme', 'gestion', 'données', 'utilisateur', 'fonctionnalité',
            'télémédecine', 'sécurité', 'efficacité', 'énergie', 'hôpital'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or', 'of', 'to',
            'develop', 'create', 'implement', 'optimize', 'manage', 'analyze',
            'platform', 'management', 'data', 'user', 'feature',
            'healthcare', 'telemedicine', 'security', 'efficiency', 'hospital'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'

    
    def load_training_dataset(self) -> pd.DataFrame:
        """Charger ou générer le dataset d'entraînement"""
        training_data = []
        
        # Données d'entraînement pour chaque industrie en français et anglais
        training_samples = {
            'Technology': {
                'french': [
                    "Développement d'une plateforme SaaS avec API REST et microservices",
                    "Création d'une infrastructure cloud avec DevOps et monitoring",
                    "Application web avec React, Node.js et base de données PostgreSQL",
                    "Système de machine learning pour analyse de données en temps réel",
                    "Plateforme de cybersécurité avec détection automatique des menaces",
                    "Solution blockchain pour la traçabilité des données",
                    "Architecture distribuée avec conteneurs Docker et Kubernetes"
                ],
                'english': [
                    "Development of SaaS platform with REST API and microservices",
                    "Creating cloud infrastructure with DevOps and monitoring",
                    "Web application with React, Node.js and PostgreSQL database",
                    "Machine learning system for real-time data analysis",
                    "Cybersecurity platform with automatic threat detection",
                    "Blockchain solution for data traceability",
                    "Distributed architecture with Docker containers and Kubernetes"
                ]
            },
            'Healthcare': {
                'french': [
                    "Système de gestion des dossiers médicaux électroniques",
                    "Application de télémédecine avec consultations vidéo",
                    "Plateforme de suivi des patients avec IoT médical",
                    "Solution de prescription électronique sécurisée",
                    "Application mobile de suivi santé avec wearables",
                    "Système d'aide au diagnostic médical avec IA",
                    "Plateforme de gestion hospitalière intégrée"
                ],
                'english': [
                    "Electronic medical records management system",
                    "Telemedicine application with video consultations",
                    "Patient tracking platform with medical IoT",
                    "Secure electronic prescription solution",
                    "Mobile health tracking app with wearables",
                    "AI-powered medical diagnosis assistance system",
                    "Integrated hospital management platform"
                ]
            },
            'Finance': {
                'french': [
                    "Application de trading algorithmique en temps réel",
                    "Plateforme bancaire mobile avec authentification biométrique",
                    "Système de détection de fraude avec intelligence artificielle",
                    "Application de paiement peer-to-peer avec blockchain",
                    "Plateforme de gestion de portefeuille automatisée",
                    "Solution de crédit scoring avec machine learning",
                    "Système de conformité réglementaire financière"
                ],
                'english': [
                    "Real-time algorithmic trading application",
                    "Mobile banking platform with biometric authentication",
                    "AI-powered fraud detection system",
                    "Peer-to-peer payment app with blockchain",
                    "Automated portfolio management platform",
                    "Credit scoring solution with machine learning",
                    "Financial regulatory compliance system"
                ]
            },
            'Education': {
                'french': [
                    "Plateforme d'apprentissage en ligne avec parcours adaptatifs",
                    "Application mobile de gamification pour l'apprentissage des langues",
                    "Système de gestion scolaire avec suivi des élèves",
                    "Plateforme de formation VR pour les sciences",
                    "Application de collaboration étudiante avec outils pédagogiques",
                    "Système d'évaluation automatique avec IA",
                    "Plateforme MOOC avec certification en ligne"
                ],
                'english': [
                    "Online learning platform with adaptive learning paths",
                    "Mobile gamification app for language learning",
                    "School management system with student tracking",
                    "VR training platform for sciences",
                    "Student collaboration app with pedagogical tools",
                    "AI-powered automatic assessment system",
                    "MOOC platform with online certification"
                ]
            },
            'Retail': {
                'french': [
                    "Plateforme e-commerce avec marketplace intégrée",
                    "Application mobile de shopping avec réalité augmentée",
                    "Système de gestion d'inventaire intelligent",
                    "Solution de recommandation produits avec IA",
                    "Plateforme omnicanal pour retailer",
                    "Application de fidélité client avec gamification",
                    "Système de prévision de demande avec machine learning"
                ],
                'english': [
                    "E-commerce platform with integrated marketplace",
                    "Mobile shopping app with augmented reality",
                    "Intelligent inventory management system",
                    "AI-powered product recommendation solution",
                    "Omnichannel platform for retailers",
                    "Customer loyalty app with gamification",
                    "Demand forecasting system with machine learning"
                ]
            },
            'Media': {
                'french': [
                    "Plateforme de streaming vidéo avec recommendation personnalisée",
                    "Application de réseau social avec création de contenu",
                    "Système de gestion de contenu multimédia",
                    "Plateforme de podcast avec monétisation",
                    "Application d'édition vidéo collaborative",
                    "Système de diffusion en direct avec chat intégré",
                    "Plateforme d'influenceur marketing"
                ],
                'english': [
                    "Video streaming platform with personalized recommendations",
                    "Social media app with content creation tools",
                    "Multimedia content management system",
                    "Podcast platform with monetization features",
                    "Collaborative video editing application",
                    "Live streaming system with integrated chat",
                    "Influencer marketing platform"
                ]
            },
            'Logistics': {
                'french': [
                    "Système de gestion de chaîne logistique avec IoT",
                    "Application de suivi de livraison en temps réel",
                    "Plateforme d'optimisation de routes pour transporteurs",
                    "Système de gestion d'entrepôt automatisé",
                    "Application de gestion de flotte avec géolocalisation",
                    "Solution de last mile delivery avec IA",
                    "Plateforme de marketplace logistique"
                ],
                'english': [
                    "Supply chain management system with IoT",
                    "Real-time delivery tracking application",
                    "Route optimization platform for carriers",
                    "Automated warehouse management system",
                    "Fleet management app with geolocation",
                    "AI-powered last mile delivery solution",
                    "Logistics marketplace platform"
                ]
            },
            'Energy': {
                'french': [
                    "Système de smart grid avec monitoring intelligent",
                    "Application de gestion de consommation énergétique",
                    "Plateforme IoT pour l'efficacité énergétique industrielle",
                    "Système de prédiction de production d'énergie renouvelable",
                    "Application de compteur intelligent connecté",
                    "Solution d'optimisation énergétique avec IA",
                    "Plateforme de trading d'énergie verte"
                ],
                'english': [
                    "Smart grid system with intelligent monitoring",
                    "Energy consumption management application",
                    "IoT platform for industrial energy efficiency",
                    "Renewable energy production prediction system",
                    "Connected smart meter application",
                    "AI-powered energy optimization solution",
                    "Green energy trading platform"
                ]
            }
        }
        
        # Convertir en dataset
        for industry, language_data in training_samples.items():
            for language, descriptions in language_data.items():
                for description in descriptions:
                    training_data.append({
                        'description': description,
                        'industry': industry,
                        'language': language
                    })
        
        df = pd.DataFrame(training_data)
        print(f"Dataset d'entraînement créé : {len(df)} échantillons pour {len(self.industry_detector.industries)} industries")
        return df
    
    def train_model(self):
        """Entraîner le modèle de classification d'industrie"""
        if self.is_trained:
            return
        
        print("Entraînement du classificateur d'industrie ML...")
        
        # Charger les données
        df = self.load_training_dataset()
        
        # Extraire les features
        print("Extraction des features...")
        feature_matrix = []
        for text in df['description']:
            features = self.feature_extractor.extract_industry_features(text)
            feature_matrix.append(list(features.values()))
        
        X = np.array(feature_matrix)
        y = self.label_encoder.fit_transform(df['industry'])
        
        # Entraîner le modèle ensemble
        self.classifier = VotingClassifier([
            ('rf', RandomForestClassifier(n_estimators=150, random_state=42, class_weight='balanced')),
            ('svm', SVC(probability=True, random_state=42, class_weight='balanced', kernel='rbf')),
            ('nb', MultinomialNB(alpha=0.1))
        ], voting='soft')
        
        self.classifier.fit(X, y)
        
        # Évaluation
        self._evaluate_model(X, y)
        
        self.is_trained = True
        print("Classificateur d'industrie entraîné avec succès!")
    
    def _evaluate_model(self, X, y):
        """Évaluer les performances du modèle"""
        try:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
            
            predictions = self.classifier.predict(X_test)
            accuracy = accuracy_score(y_test, predictions)
            
            print(f"Précision du modèle d'industrie : {accuracy:.3f}")
            
            # Matrice de confusion simplifiée
            from collections import Counter
            predicted_industries = self.label_encoder.inverse_transform(predictions)
            actual_industries = self.label_encoder.inverse_transform(y_test)
            
            print(f"Prédictions par industrie : {Counter(predicted_industries)}")
            
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
    
    def predict_industry(self, text: str) -> Dict[str, Any]:
        """Prédire l'industrie d'un texte"""

        if not text or len(text.strip()) < 10:
            return ({'error': 'Texte trop court (minimum 10 caractères)'}), 400

        if not self.is_trained:
            self.train_model()
        
        # Cache
        text_hash = hashlib.md5(text.encode()).hexdigest()
        if text_hash in self.prediction_cache:
            return self.prediction_cache[text_hash]
        
        try:
            # Extraire les features
            features = self.feature_extractor.extract_industry_features(text)
            X = np.array([list(features.values())])
            
            # Prédiction
            prediction = self.classifier.predict(X)[0]
            probabilities = self.classifier.predict_proba(X)[0]
            
            # Résultats
            predicted_industry = self.label_encoder.inverse_transform([prediction])[0]
            confidence = float(np.max(probabilities))
            
            # Détails sur les probabilités par industrie
            industry_probabilities = {}
            for i, industry in enumerate(self.label_encoder.classes_):
                industry_name = self.label_encoder.inverse_transform([i])[0]
                industry_probabilities[industry_name] = float(probabilities[i])
            
            result = {
                'industry': predicted_industry,
                'confidence': confidence,
                'language': self.detect_language(text),
                'all_probabilities': industry_probabilities,
                'top_3_industries': self._get_top_industries(industry_probabilities, 3),
                'method': 'ml_voting_classifier'
            }
            
            self.prediction_cache[text_hash] = result
            return result
            
        except Exception as e:
            print(f"Erreur lors de la prédiction : {e}")
            return {
                'industry': 'Technology',
                'confidence': 0.5,
                'language': 'unknown',
                'error': str(e),
                'method': 'fallback'
            }
    
    def _get_top_industries(self, probabilities: Dict[str, float], top_n: int) -> List[Dict[str, Any]]:
        """Récupérer le top N des industries par probabilité"""
        sorted_industries = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
        return [
            {'industry': industry, 'probability': prob}
            for industry, prob in sorted_industries[:top_n]
        ]


# Application Flask
app = Flask(__name__)
CORS(app)

# Instance globale du classificateur
industry_classifier = MLIndustryClassifier()

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        expected_token = 'IndustryClassifier2024!'
        
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
        'service': 'Industry Classifier - ML',
        'version': '1.0.0',
        'supported_industries': industry_classifier.industry_detector.industries,
        'supported_languages': ['français', 'english'],
        'model_trained': industry_classifier.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/classify-industry', methods=['POST'])
@authenticate
def classify_industry():
    """Classifier l'industrie d'un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        if not text or len(text.strip()) < 10:
            return jsonify({'error': 'Texte trop court (minimum 10 caractères)'}), 400
        
        # Classification
        result = industry_classifier.predict_industry(text)
        
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

@app.route('/api/supported-industries', methods=['GET'])
def get_supported_industries():
    """Récupérer la liste des industries supportées"""
    return jsonify({
        'success': True,
        'industries': industry_classifier.industry_detector.industries,
        'total_count': len(industry_classifier.industry_detector.industries),
        'descriptions': {
            'Technology': 'Tech générale, SaaS, DevOps, Infrastructure',
            'Healthcare': 'Santé, médical, télémédecine, e-santé',
            'Finance': 'FinTech, banque, assurance, trading',
            'Education': 'EdTech, formation, e-learning, MOOC',
            'Retail': 'E-commerce, marketplace, retail tech',
            'Media': 'Streaming, contenu, réseaux sociaux',
            'Logistics': 'Transport, livraison, supply chain',
            'Energy': 'Smart grid, IoT industriel, cleantech'
        }
    })

@app.route('/api/batch-classify', methods=['POST'])
@authenticate
def batch_classify():
    """Classifier plusieurs textes en batch"""
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data or not isinstance(data['texts'], list):
            return jsonify({'error': 'Liste de textes requise dans le champ "texts"'}), 400
        
        texts = data['texts']
        if len(texts) > 50:
            return jsonify({'error': 'Maximum 50 textes par batch'}), 400
        
        results = []
        for i, text in enumerate(texts):
            if text and len(text.strip()) >= 10:
                result = industry_classifier.predict_industry(text)
                results.append({
                    'index': i,
                    'text': text[:100] + '...' if len(text) > 100 else text,
                    'classification': result
                })
            else:
                results.append({
                    'index': i,
                    'text': text,
                    'error': 'Texte trop court (minimum 10 caractères)'
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

@app.route('/api/detect-language', methods=['POST'])
def detect_language():
    """Détecter la langue d'un texte"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Texte requis dans le champ "text"'}), 400
        
        text = data['text']
        detected_language = industry_classifier.industry_detector.detect_language(text)
        
        return jsonify({
            'success': True,
            'detected_language': detected_language,
            'supported_languages': industry_classifier.industry_detector.supported_languages,
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
            'is_trained': industry_classifier.is_trained,
            'algorithm': 'Voting Classifier (Random Forest + SVM + Naive Bayes)',
            'supported_industries': industry_classifier.industry_detector.industries,
            'supported_languages': industry_classifier.industry_detector.supported_languages,
            'training_samples_per_industry': 14,  # 7 français + 7 anglais
            'total_training_samples': 112,  # 8 industries × 14 échantillons
            'feature_types': [
                'keyword_density_per_industry',
                'linguistic_features',
                'text_statistics',
                'tech_business_ratio',
                'complexity_indicators'
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
        industry_classifier.is_trained = False
        industry_classifier.prediction_cache.clear()
        
        # Réentraîner
        industry_classifier.train_model()
        
        return jsonify({
            'success': True,
            'message': 'Modèle réentraîné avec succès',
            'model_trained': industry_classifier.is_trained,
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
            'POST /api/classify-industry',
            'GET /api/supported-industries',
            'POST /api/batch-classify',
            'POST /api/detect-language',
            'GET /api/model-info',
            'POST /api/train-model'
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
    
    port = int(os.environ.get('PORT', 3002))
    
    print("=" * 60)
    print("INDUSTRY CLASSIFIER - MODULE ISOLE")
    print("=" * 60)
    print(f"Service demarre sur le port {port}")
    print(f"Industries supportees : {len(industry_classifier.industry_detector.industries)}")
    print(f"Langues supportees : {industry_classifier.industry_detector.supported_languages}")
    print(f"Algorithme : Voting Classifier (RF + SVM + NB)")
    print(f"Dataset : 112 echantillons d'entrainement")
    print("=" * 60)
    print("ENDPOINTS DISPONIBLES :")
    print(f"  - Health check    : http://localhost:{port}/health")
    print(f"  - Classification  : POST http://localhost:{port}/api/classify-industry")
    print(f"  - Industries      : GET http://localhost:{port}/api/supported-industries")
    print(f"  - Batch          : POST http://localhost:{port}/api/batch-classify")
    print(f"  - Langue         : POST http://localhost:{port}/api/detect-language")
    print(f"  - Info modele    : GET http://localhost:{port}/api/model-info")
    print("=" * 60)
    print("Token d'authentification : 'IndustryClassifier2024!'")
    print("Utilisation :")
    print("   Header: Authorization: Bearer IndustryClassifier2024!")
    print("   Body: {\"text\": \"Votre description de projet...\"}")
    print("=" * 60)
    print("Service pret - En attente de requetes...")
    
    app.run(host='0.0.0.0', port=port, debug=False)