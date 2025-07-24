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
            'Technology', 'Healthcare', 'Finance', 'Education', 
            'Retail', 'Media', 'Logistics', 'Energy',
            'Consulting', 'Legal Services', 'Marketing & Advertising', 'Human Resources',
            'Real Estate', 'Insurance',
            'Automotive', 'Aerospace', 'Construction', 'Food & Beverage', 
            'Textile & Fashion', 'Chemical',
            'Gaming', 'Sports & Fitness', 'Travel & Tourism', 'Events & Hospitality',
            'Government', 'Non-profit', 'Environmental', 'Agriculture',
            'Biotechnology', 'Research & Development', 'Pharmaceutical'
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
            },

            'Consulting': {
                'french': [
                    'conseil', 'consultance', 'audit', 'stratégie', 'expertise', 'accompagnement',
                    'consultant', 'advisory', 'coaching', 'optimisation', 'transformation',
                    'analyse métier', 'conseil stratégique', 'amélioration processus'
                ],
                'english': [
                    'consulting', 'advisory', 'audit', 'strategy', 'expertise', 'guidance',
                    'consultant', 'coaching', 'optimization', 'transformation', 'analysis',
                    'business analysis', 'strategic consulting', 'process improvement'
                ]
        },
    
            'Legal Services': {
                'french': [
                    'juridique', 'droit', 'avocat', 'notaire', 'contrat', 'compliance',
                    'réglementation', 'contentieux', 'propriété intellectuelle', 'audit légal',
                    'conseil juridique', 'cabinet avocat', 'service juridique'
                ],
                'english': [
                    'legal', 'law', 'lawyer', 'attorney', 'contract', 'compliance',
                    'regulation', 'litigation', 'intellectual property', 'legal audit',
                    'legal counsel', 'law firm', 'legal services'
                ]
            },
            
            'Marketing & Advertising': {
                'french': [
                    'marketing', 'publicité', 'communication', 'brand', 'marque', 'campagne',
                    'digital marketing', 'seo', 'sem', 'social media', 'content marketing',
                    'agence communication', 'stratégie marketing', 'growth hacking'
                ],
                'english': [
                    'marketing', 'advertising', 'communication', 'brand', 'campaign', 'promotion',
                    'digital marketing', 'seo', 'sem', 'social media', 'content marketing',
                    'marketing agency', 'marketing strategy', 'growth hacking'
                ]
            },
            
            'Human Resources': {
                'french': [
                    'ressources humaines', 'rh', 'recrutement', 'talent', 'formation',
                    'paie', 'gestion personnel', 'employee', 'workforce', 'hiring',
                    'talent management', 'hr management', 'employee engagement'
                ],
                'english': [
                    'human resources', 'hr', 'recruitment', 'talent', 'training',
                    'payroll', 'personnel management', 'employee', 'workforce', 'hiring',
                    'talent management', 'hr management', 'employee engagement'
                ]
            },
            
            'Real Estate': {
                'french': [
                    'immobilier', 'real estate', 'propriété', 'location', 'vente',
                    'gestion locative', 'syndic', 'promotion immobilière', 'investissement',
                    'property management', 'asset management', 'facility management'
                ],
                'english': [
                    'real estate', 'property', 'rental', 'sales', 'leasing',
                    'property management', 'facility management', 'real estate development',
                    'investment', 'asset management', 'commercial real estate'
                ]
            },
            
            'Insurance': {
                'french': [
                    'assurance', 'insurance', 'mutuelle', 'couverture', 'sinistre',
                    'police assurance', 'actuaire', 'risk management', 'souscription',
                    'assurance vie', 'assurance auto', 'assurance santé'
                ],
                'english': [
                    'insurance', 'coverage', 'claim', 'policy', 'underwriting',
                    'actuarial', 'risk management', 'life insurance', 'auto insurance',
                    'health insurance', 'property insurance', 'liability insurance'
                ]
            },
            
            # === INDUSTRIE & MANUFACTURING ===
            'Automotive': {
                'french': [
                    'automobile', 'automotive', 'véhicule', 'transport', 'voiture',
                    'constructeur auto', 'pièces auto', 'garage', 'mécanique',
                    'électrique', 'autonome', 'connected car', 'mobility'
                ],
                'english': [
                    'automotive', 'vehicle', 'car', 'transport', 'automobile',
                    'automotive manufacturer', 'auto parts', 'garage', 'mechanical',
                    'electric vehicle', 'autonomous', 'connected car', 'mobility'
                ]
            },
            
            'Aerospace': {
                'french': [
                    'aérospatial', 'aerospace', 'aviation', 'aéronautique', 'spatial',
                    'avion', 'satellite', 'défense', 'missile', 'drone',
                    'industry aéronautique', 'space technology', 'flight systems'
                ],
                'english': [
                    'aerospace', 'aviation', 'aeronautics', 'space', 'aircraft',
                    'satellite', 'defense', 'missile', 'drone', 'flight',
                    'aerospace industry', 'space technology', 'flight systems'
                ]
            },
            
            'Construction': {
                'french': [
                    'construction', 'btp', 'bâtiment', 'travaux publics', 'génie civil',
                    'chantier', 'architecture', 'ingénierie', 'infrastructure',
                    'construction management', 'project management', 'facility'
                ],
                'english': [
                    'construction', 'building', 'civil engineering', 'infrastructure',
                    'site', 'architecture', 'engineering', 'contractor',
                    'construction management', 'project management', 'facility'
                ]
            },
            
            'Food & Beverage': {
                'french': [
                    'alimentaire', 'food', 'beverage', 'boisson', 'restaurant',
                    'cuisine', 'nutrition', 'agroalimentaire', 'food tech',
                    'delivery', 'catering', 'food service', 'restaurant management'
                ],
                'english': [
                    'food', 'beverage', 'restaurant', 'cuisine', 'nutrition',
                    'food industry', 'food tech', 'delivery', 'catering',
                    'food service', 'restaurant management', 'hospitality'
                ]
            },
            
            'Textile & Fashion': {
                'french': [
                    'textile', 'mode', 'fashion', 'vêtement', 'habillement',
                    'design', 'couture', 'stylisme', 'fashion tech', 'retail mode',
                    'luxury', 'brand management', 'fashion design'
                ],
                'english': [
                    'textile', 'fashion', 'clothing', 'apparel', 'garment',
                    'design', 'style', 'fashion tech', 'fashion retail',
                    'luxury', 'brand management', 'fashion design'
                ]
            },
            
            'Chemical': {
                'french': [
                    'chimique', 'chemical', 'pharmaceutique', 'laboratoire', 'recherche',
                    'production chimique', 'process', 'matériaux', 'innovation',
                    'chemical engineering', 'lab management', 'quality control'
                ],
                'english': [
                    'chemical', 'pharmaceutical', 'laboratory', 'research', 'lab',
                    'chemical production', 'process', 'materials', 'innovation',
                    'chemical engineering', 'lab management', 'quality control'
                ]
            },
            
            # === CREATIVE & ENTERTAINMENT ===
            'Gaming': {
                'french': [
                    'jeu', 'gaming', 'game', 'mobile game', 'console', 'pc gaming',
                    'unity', 'unreal', 'gameplay', 'game design', 'esports',
                    'game development', 'indie game', 'casual game'
                ],
                'english': [
                    'gaming', 'game', 'mobile game', 'console', 'pc gaming',
                    'unity', 'unreal', 'gameplay', 'game design', 'esports',
                    'game development', 'indie game', 'casual game'
                ]
            },
            
            'Sports & Fitness': {
                'french': [
                    'sport', 'fitness', 'entraînement', 'gym', 'coach', 'sportif',
                    'wellness', 'health', 'performance', 'athlete', 'club sport',
                    'sports management', 'fitness tracking', 'sports analytics'
                ],
                'english': [
                    'sports', 'fitness', 'training', 'gym', 'coach', 'athletic',
                    'wellness', 'health', 'performance', 'athlete', 'sports club',
                    'sports management', 'fitness tracking', 'sports analytics'
                ]
            },
            
            'Travel & Tourism': {
                'french': [
                    'voyage', 'tourism', 'tourisme', 'travel', 'hôtel', 'booking',
                    'réservation', 'destination', 'vacances', 'tour operator',
                    'travel tech', 'hospitality', 'tourism management'
                ],
                'english': [
                    'travel', 'tourism', 'hotel', 'booking', 'reservation',
                    'destination', 'vacation', 'tour operator', 'hospitality',
                    'travel tech', 'tourism management', 'travel planning'
                ]
            },
            
            'Events & Hospitality': {
                'french': [
                    'événement', 'event', 'conférence', 'meeting', 'wedding',
                    'organisation événement', 'event management', 'hospitality',
                    'venue', 'catering', 'event planning', 'event tech'
                ],
                'english': [
                    'event', 'conference', 'meeting', 'wedding', 'gathering',
                    'event management', 'hospitality', 'venue', 'catering',
                    'event planning', 'event tech', 'event organization'
                ]
            },
            
            # === PUBLIC & NON-PROFIT ===
            'Government': {
                'french': [
                    'gouvernement', 'public', 'administration', 'collectivité', 'mairie',
                    'service public', 'e-government', 'digital government', 'civic tech',
                    'gov tech', 'public service', 'government digital'
                ],
                'english': [
                    'government', 'public', 'administration', 'municipality', 'city',
                    'public service', 'e-government', 'digital government', 'civic tech',
                    'gov tech', 'public sector', 'government digital'
                ]
            },
            
            'Non-profit': {
                'french': [
                    'non-profit', 'association', 'ong', 'charity', 'fondation',
                    'social impact', 'cause', 'fundraising', 'volunteer',
                    'nonprofit management', 'social good', 'community'
                ],
                'english': [
                    'non-profit', 'nonprofit', 'ngo', 'charity', 'foundation',
                    'social impact', 'cause', 'fundraising', 'volunteer',
                    'nonprofit management', 'social good', 'community'
                ]
            },
            
            'Environmental': {
                'french': [
                    'environnement', 'environmental', 'écologie', 'sustainability',
                    'green tech', 'clean tech', 'renewable', 'carbon', 'climate',
                    'environmental management', 'eco-friendly', 'sustainable'
                ],
                'english': [
                    'environmental', 'ecology', 'sustainability', 'green tech',
                    'clean tech', 'renewable', 'carbon', 'climate', 'eco',
                    'environmental management', 'eco-friendly', 'sustainable'
                ]
            },
            
            'Agriculture': {
                'french': [
                    'agriculture', 'farm', 'farming', 'agri', 'agricole', 'élevage',
                    'agtech', 'precision agriculture', 'smart farming', 'crop',
                    'agricultural management', 'farm tech', 'agribusiness'
                ],
                'english': [
                    'agriculture', 'farm', 'farming', 'agricultural', 'livestock',
                    'agtech', 'precision agriculture', 'smart farming', 'crop',
                    'agricultural management', 'farm tech', 'agribusiness'
                ]
            },
            
            # === SCIENCES & RESEARCH ===
            'Biotechnology': {
                'french': [
                    'biotechnologie', 'biotech', 'bio', 'génétique', 'adn',
                    'bioinformatique', 'life sciences', 'molecular', 'research',
                    'biotech research', 'genetic engineering', 'biomedical'
                ],
                'english': [
                    'biotechnology', 'biotech', 'bio', 'genetic', 'dna',
                    'bioinformatics', 'life sciences', 'molecular', 'research',
                    'biotech research', 'genetic engineering', 'biomedical'
                ]
            },
            
            'Research & Development': {
                'french': [
                    'recherche', 'développement', 'r&d', 'research', 'innovation',
                    'laboratoire', 'étude', 'analyse', 'investigation', 'discovery',
                    'research management', 'scientific research', 'applied research'
                ],
                'english': [
                    'research', 'development', 'r&d', 'innovation', 'laboratory',
                    'study', 'analysis', 'investigation', 'discovery', 'science',
                    'research management', 'scientific research', 'applied research'
                ]
            },
            
            'Pharmaceutical': {
                'french': [
                    'pharmaceutique', 'pharma', 'médicament', 'drug', 'clinical',
                    'essai clinique', 'regulatory', 'fda', 'medical device',
                    'pharmaceutical research', 'drug development', 'clinical trials'
                ],
                'english': [
                    'pharmaceutical', 'pharma', 'drug', 'medicine', 'clinical',
                    'clinical trial', 'regulatory', 'fda', 'medical device',
                    'pharmaceutical research', 'drug development', 'clinical trials'
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
            },
            
            # === SERVICES B2B ===
            'Consulting': {
                'french': [
                    "Plateforme de conseil stratégique pour PME avec outils d'analyse métier",
                    "Application de coaching business en ligne avec suivi personnalisé",
                    "Système de gestion des missions de consultance avec facturation temps",
                    "Outil d'audit automatisé pour processus d'entreprise avec reporting",
                    "Plateforme d'accompagnement transformation digitale avec méthodologie agile",
                    "Solution d'optimisation des processus métier avec analytics avancées",
                    "Portail de conseil en stratégie d'innovation avec benchmarking concurrentiel"
                ],
                'english': [
                    "Strategic consulting platform for SMEs with business analysis tools",
                    "Online business coaching application with personalized tracking",
                    "Consulting mission management system with time billing",
                    "Automated audit tool for business processes with reporting",
                    "Digital transformation coaching platform with agile methodology",
                    "Business process optimization solution with advanced analytics",
                    "Innovation strategy consulting portal with competitive benchmarking"
                ]
            },
            
            'Legal Services': {
                'french': [
                    "Application de gestion de cabinet d'avocats avec facturation temps",
                    "Plateforme de suivi des contrats juridiques avec alertes deadline",
                    "Système de compliance automatisée avec veille réglementaire",
                    "Outil de recherche jurisprudentielle intelligent avec IA",
                    "Application de gestion des contentieux avec workflow automatisé",
                    "Portail client pour services juridiques avec signature électronique",
                    "Plateforme de propriété intellectuelle avec gestion brevets"
                ],
                'english': [
                    "Law firm management application with time billing system",
                    "Legal contract tracking platform with deadline alerts",
                    "Automated compliance system with regulatory monitoring",
                    "Intelligent legal research tool with AI-powered search",
                    "Litigation management application with automated workflow",
                    "Client portal for legal services with electronic signature",
                    "Intellectual property platform with patent management"
                ]
            },
            
            'Marketing & Advertising': {
                'french': [
                    "Plateforme de marketing automation multicanal avec lead scoring",
                    "Outil d'analyse des campagnes publicitaires avec ROI tracking",
                    "Application de gestion de brand management avec asset library",
                    "Système de content marketing automatisé avec planning éditorial",
                    "Dashboard d'analytics marketing avancé avec attribution modeling",
                    "Plateforme de growth hacking avec A/B testing intégré",
                    "Solution de social media management avec programmation posts"
                ],
                'english': [
                    "Multi-channel marketing automation platform with lead scoring",
                    "Advertising campaign analysis tool with ROI tracking",
                    "Brand management application with digital asset library",
                    "Automated content marketing system with editorial calendar",
                    "Advanced marketing analytics dashboard with attribution modeling",
                    "Growth hacking platform with integrated A/B testing",
                    "Social media management solution with post scheduling"
                ]
            },
            
            'Human Resources': {
                'french': [
                    "SIRH complet avec gestion des talents et évaluations performance",
                    "Plateforme de recrutement intelligent avec matching candidats",
                    "Application de gestion de la paie avec conformité sociale",
                    "Système de formation et e-learning RH avec tracking progrès",
                    "Outil d'évaluation des performances avec 360° feedback",
                    "Portail employé self-service avec demandes congés",
                    "Solution de talent management avec plans de carrière"
                ],
                'english': [
                    "Complete HRIS with talent management and performance reviews",
                    "Intelligent recruitment platform with candidate matching",
                    "Payroll management application with social compliance",
                    "HR training and e-learning system with progress tracking",
                    "Performance evaluation tool with 360-degree feedback",
                    "Employee self-service portal with leave requests",
                    "Talent management solution with career development plans"
                ]
            },
            
            'Real Estate': {
                'french': [
                    "Plateforme de gestion locative complète avec comptabilité intégrée",
                    "Application d'estimation immobilière IA avec données marché",
                    "Système de visite virtuelle 3D avec réalité augmentée",
                    "Outil de prospection immobilière avec CRM spécialisé",
                    "Portail de syndic de copropriété avec gestion charges",
                    "Application de transaction immobilière avec signature électronique",
                    "Plateforme d'investissement immobilier avec analyse rentabilité"
                ],
                'english': [
                    "Complete rental management platform with integrated accounting",
                    "AI real estate valuation app with market data integration",
                    "3D virtual tour system with augmented reality features",
                    "Real estate prospecting tool with specialized CRM",
                    "Property management portal with expense tracking",
                    "Real estate transaction application with electronic signature",
                    "Real estate investment platform with profitability analysis"
                ]
            },
            
            'Insurance': {
                'french': [
                    "Système de souscription d'assurance digital avec scoring risque",
                    "Application de déclaration sinistre mobile avec photos géolocalisées",
                    "Plateforme de courtage en assurance avec comparateur produits",
                    "Outil d'évaluation des risques avec intelligence artificielle",
                    "Système de gestion des polices avec renouvellement automatique",
                    "Application de mutuelle santé avec tiers payant intégré",
                    "Portail client assurance auto avec assistance dépannage"
                ],
                'english': [
                    "Digital insurance underwriting system with risk scoring",
                    "Mobile claim reporting application with geolocated photos",
                    "Insurance brokerage platform with product comparator",
                    "Risk assessment tool with artificial intelligence",
                    "Policy management system with automatic renewal",
                    "Health insurance application with integrated third-party payment",
                    "Auto insurance client portal with roadside assistance"
                ]
            },
            
            # === INDUSTRIE & MANUFACTURING ===
            'Automotive': {
                'french': [
                    "Système de diagnostic automobile connecté avec IoT véhicules",
                    "Application de gestion de flotte avec maintenance prédictive",
                    "Plateforme de pièces détachées auto avec catalogue interactif",
                    "Outil de maintenance prédictive véhicules avec capteurs",
                    "Application de covoiturage entreprise avec optimisation trajets",
                    "Système de géolocalisation véhicules avec alertes conducteur",
                    "Plateforme de vente automobile avec configurateur 3D"
                ],
                'english': [
                    "Connected automotive diagnostic system with vehicle IoT",
                    "Fleet management application with predictive maintenance",
                    "Auto parts platform with interactive catalog",
                    "Vehicle predictive maintenance tool with sensor integration",
                    "Corporate carpooling application with route optimization",
                    "Vehicle geolocation system with driver alerts",
                    "Automotive sales platform with 3D configurator"
                ]
            },
            
            'Aerospace': {
                'french': [
                    "Système de maintenance aéronautique avec réalité augmentée",
                    "Application de gestion de vol avec planification automatique",
                    "Plateforme de supply chain aérospatiale avec traçabilité pièces",
                    "Outil de simulation de vol avec environnement virtuel",
                    "Système de monitoring satellite avec télémétrie temps réel",
                    "Application de gestion défense avec sécurité renforcée",
                    "Plateforme de certification aéronautique avec workflow approval"
                ],
                'english': [
                    "Aeronautical maintenance system with augmented reality",
                    "Flight management application with automatic planning",
                    "Aerospace supply chain platform with parts traceability",
                    "Flight simulation tool with virtual environment",
                    "Satellite monitoring system with real-time telemetry",
                    "Defense management application with enhanced security",
                    "Aeronautical certification platform with approval workflow"
                ]
            },
            
            'Construction': {
                'french': [
                    "Plateforme de gestion de chantier avec suivi BIM intégré",
                    "Application de planification travaux avec gestion ressources",
                    "Système de sécurité chantier avec IoT et alertes temps réel",
                    "Outil d'estimation de coûts construction avec base données matériaux",
                    "Plateforme de collaboration BTP avec partage documents sécurisé",
                    "Application de gestion qualité avec check-lists digitales",
                    "Système de facility management avec maintenance préventive"
                ],
                'english': [
                    "Construction site management platform with integrated BIM tracking",
                    "Work planning application with resource management",
                    "Construction site safety system with IoT and real-time alerts",
                    "Construction cost estimation tool with materials database",
                    "BTP collaboration platform with secure document sharing",
                    "Quality management application with digital checklists",
                    "Facility management system with preventive maintenance"
                ]
            },
            
            'Food & Beverage': {
                'french': [
                    "Application de gestion restaurant avec commandes en ligne",
                    "Plateforme de livraison de repas avec tracking temps réel",
                    "Système de traçabilité alimentaire avec blockchain",
                    "Outil de gestion d'inventaire cuisine avec dates péremption",
                    "Application de réservation restaurant avec gestion tables",
                    "Plateforme de nutrition personnalisée avec IA",
                    "Système de catering événementiel avec planification menus"
                ],
                'english': [
                    "Restaurant management application with online ordering",
                    "Meal delivery platform with real-time tracking",
                    "Food traceability system with blockchain technology",
                    "Kitchen inventory management tool with expiration dates",
                    "Restaurant reservation application with table management",
                    "Personalized nutrition platform with AI recommendations",
                    "Event catering system with menu planning"
                ]
            },
            
            'Textile & Fashion': {
                'french': [
                    "Plateforme de design mode avec outils de création collaborative",
                    "Application de vente vêtements avec essayage virtuel AR",
                    "Système de gestion de production textile avec supply chain",
                    "Outil de trend forecasting mode avec intelligence artificielle",
                    "Plateforme de mode durable avec traçabilité matériaux",
                    "Application de personal shopping avec recommandations IA",
                    "Système de gestion collection mode avec planning saisonnier"
                ],
                'english': [
                    "Fashion design platform with collaborative creation tools",
                    "Clothing sales application with virtual AR try-on",
                    "Textile production management system with supply chain",
                    "Fashion trend forecasting tool with artificial intelligence",
                    "Sustainable fashion platform with materials traceability",
                    "Personal shopping application with AI recommendations",
                    "Fashion collection management system with seasonal planning"
                ]
            },
            
            'Chemical': {
                'french': [
                    "Système de gestion laboratoire avec LIMS intégré",
                    "Application de traçabilité produits chimiques avec sécurité",
                    "Plateforme de R&D chimie avec simulation moléculaire",
                    "Outil de compliance réglementaire chimique avec REACH",
                    "Système de contrôle qualité avec analyses automatisées",
                    "Application de gestion des déchets chimiques avec tracking",
                    "Plateforme d'innovation matériaux avec base données propriétés"
                ],
                'english': [
                    "Laboratory management system with integrated LIMS",
                    "Chemical product traceability application with safety features",
                    "Chemistry R&D platform with molecular simulation",
                    "Chemical regulatory compliance tool with REACH integration",
                    "Quality control system with automated analyses",
                    "Chemical waste management application with tracking",
                    "Materials innovation platform with properties database"
                ]
            },
            
            # === CREATIVE & ENTERTAINMENT ===
            'Gaming': {
                'french': [
                    "Développement de jeu mobile casual avec système de progression",
                    "Plateforme de game analytics avec métriques comportementales joueurs",
                    "Moteur de jeu 2D personnalisé avec outils de level design",
                    "Application de gestion d'équipe esports avec planning tournois",
                    "Marketplace d'assets de jeux avec système de licensing",
                    "Système de matchmaking intelligent avec équilibrage skill-based",
                    "Plateforme de streaming gaming avec interaction communauté temps réel"
                ],
                'english': [
                    "Casual mobile game development with progression system",
                    "Game analytics platform with player behavioral metrics",
                    "Custom 2D game engine with level design tools",
                    "Esports team management application with tournament scheduling",
                    "Game assets marketplace with licensing system",
                    "Intelligent matchmaking system with skill-based balancing",
                    "Gaming streaming platform with real-time community interaction"
                ]
            },
            
            'Sports & Fitness': {
                'french': [
                    "Application de coaching fitness personnalisé avec IA",
                    "Plateforme de gestion de club sportif avec réservations",
                    "Système de tracking performance athlète avec wearables",
                    "Application de réservation cours fitness avec paiement intégré",
                    "Outil d'analyse de données sportives avec visualisation",
                    "Portail de nutrition sportive avec plans personnalisés",
                    "Plateforme de coaching en ligne avec suivi vidéo"
                ],
                'english': [
                    "Personalized fitness coaching app with AI recommendations",
                    "Sports club management platform with booking system",
                    "Athlete performance tracking system with wearables integration",
                    "Fitness class booking application with integrated payment",
                    "Sports data analysis tool with advanced visualization",
                    "Sports nutrition portal with personalized meal plans",
                    "Online coaching platform with video tracking"
                ]
            },
            
            'Travel & Tourism': {
                'french': [
                    "Plateforme de réservation voyage avec recommandations IA",
                    "Application de guide touristique avec réalité augmentée",
                    "Système de gestion hôtelière avec channel manager",
                    "Outil de planification itinéraire avec optimisation coûts",
                    "Plateforme de location vacances avec système de trust",
                    "Application de traduction voyage avec reconnaissance vocale",
                    "Système de gestion tour operator avec packages dynamiques"
                ],
                'english': [
                    "Travel booking platform with AI recommendations",
                    "Tourist guide application with augmented reality",
                    "Hotel management system with channel manager",
                    "Itinerary planning tool with cost optimization",
                    "Vacation rental platform with trust system",
                    "Travel translation application with voice recognition",
                    "Tour operator management system with dynamic packages"
                ]
            },
            
            'Events & Hospitality': {
                'french': [
                    "Plateforme d'organisation événements avec gestion complète",
                    "Application de billetterie électronique avec contrôle accès",
                    "Système de gestion venue avec planning disponibilités",
                    "Outil de catering événementiel avec gestion allergies",
                    "Plateforme de networking événements avec matching participants",
                    "Application de feedback événements avec analytics temps réel",
                    "Système de gestion wedding planner avec timeline interactive"
                ],
                'english': [
                    "Event organization platform with complete management",
                    "Electronic ticketing application with access control",
                    "Venue management system with availability scheduling",
                    "Event catering tool with allergy management",
                    "Event networking platform with participant matching",
                    "Event feedback application with real-time analytics",
                    "Wedding planner management system with interactive timeline"
                ]
            },
            
            # === PUBLIC & NON-PROFIT ===
            'Government': {
                'french': [
                    "Plateforme de services publics numériques avec authentification citoyenne",
                    "Application de participation citoyenne avec votes électroniques",
                    "Système de gestion administrative avec dématérialisation documents",
                    "Outil de transparence budgétaire avec visualisation données publiques",
                    "Portail de démarches en ligne avec suivi dossiers",
                    "Application de signalement citoyen avec géolocalisation",
                    "Système d'information géographique avec données territoriales"
                ],
                'english': [
                    "Digital public services platform with citizen authentication",
                    "Citizen participation application with electronic voting",
                    "Administrative management system with document digitization",
                    "Budget transparency tool with public data visualization",
                    "Online procedures portal with case tracking",
                    "Citizen reporting application with geolocation",
                    "Geographic information system with territorial data"
                ]
            },
            
            'Non-profit': {
                'french': [
                    "Plateforme de fundraising en ligne avec campagnes crowdfunding",
                    "Application de gestion bénévoles avec planning missions",
                    "Système de suivi projets humanitaires avec impact tracking",
                    "Outil de gestion dons avec reçus fiscaux automatiques",
                    "Plateforme de matching bénévoles-associations avec skills",
                    "Application de transparence financière ONG avec reporting",
                    "Système de gestion événements caritatifs avec billetterie"
                ],
                'english': [
                    "Online fundraising platform with crowdfunding campaigns",
                    "Volunteer management application with mission scheduling",
                    "Humanitarian project tracking system with impact monitoring",
                    "Donation management tool with automatic tax receipts",
                    "Volunteer-association matching platform with skills matching",
                    "NGO financial transparency application with reporting",
                    "Charitable events management system with ticketing"
                ]
            },
            
            'Environmental': {
                'french': [
                    "Plateforme de monitoring environnemental avec capteurs IoT",
                    "Application de calcul empreinte carbone avec recommandations",
                    "Système de gestion déchets avec optimisation collecte",
                    "Outil de certification environnementale avec audit automatique",
                    "Plateforme de sensibilisation écologique avec gamification",
                    "Application de covoiturage écologique avec bonus carbone",
                    "Système de trading carbone avec blockchain"
                ],
                'english': [
                    "Environmental monitoring platform with IoT sensors",
                    "Carbon footprint calculation app with recommendations",
                    "Waste management system with collection optimization",
                    "Environmental certification tool with automatic auditing",
                    "Ecological awareness platform with gamification",
                    "Eco-friendly carpooling application with carbon rewards",
                    "Carbon trading system with blockchain technology"
                ]
            },
            
            'Agriculture': {
                'french': [
                    "Plateforme d'agriculture de précision avec drones et capteurs",
                    "Application de monitoring des cultures avec prédiction rendement",
                    "Système de gestion d'exploitation avec comptabilité agricole",
                    "Outil de traçabilité alimentaire avec QR codes produits",
                    "Application météo agricole avec alertes personnalisées",
                    "Plateforme de vente directe producteur avec e-commerce",
                    "Système d'irrigation intelligent avec optimisation eau"
                ],
                'english': [
                    "Precision agriculture platform with drones and sensors",
                    "Crop monitoring application with yield prediction",
                    "Farm management system with agricultural accounting",
                    "Food traceability tool with product QR codes",
                    "Agricultural weather application with personalized alerts",
                    "Direct farm sales platform with e-commerce integration",
                    "Smart irrigation system with water optimization"
                ]
            },
            
            # === SCIENCES & RESEARCH ===
            'Biotechnology': {
                'french': [
                    "Plateforme de bioinformatique avancée avec analyse génomique",
                    "Application de séquençage génétique avec base données mutations",
                    "Système de gestion laboratoire bio avec traçabilité échantillons",
                    "Outil d'analyse moléculaire avec visualisation 3D protéines",
                    "Plateforme de recherche biomédicale avec collaboration internationale",
                    "Application de diagnostic génétique avec recommandations thérapeutiques",
                    "Système de biobanque avec gestion cryoconservation"
                ],
                'english': [
                    "Advanced bioinformatics platform with genomic analysis",
                    "Genetic sequencing application with mutations database",
                    "Bio laboratory management system with sample traceability",
                    "Molecular analysis tool with 3D protein visualization",
                    "Biomedical research platform with international collaboration",
                    "Genetic diagnostic application with therapeutic recommendations",
                    "Biobank system with cryopreservation management"
                ]
            },
            
            'Research & Development': {
                'french': [
                    "Plateforme de gestion projets R&D avec collaboration chercheurs",
                    "Application de veille scientifique avec IA analyse publications",
                    "Système de gestion laboratoire avec équipements partagés",
                    "Outil de simulation expérimentale avec modélisation avancée",
                    "Plateforme de publication scientifique avec peer review",
                    "Application de gestion brevets avec analyse antériorité",
                    "Système de financement recherche avec matching investisseurs"
                ],
                'english': [
                    "R&D project management platform with researcher collaboration",
                    "Scientific intelligence application with AI publication analysis",
                    "Laboratory management system with shared equipment",
                    "Experimental simulation tool with advanced modeling",
                    "Scientific publication platform with peer review",
                    "Patent management application with prior art analysis",
                    "Research funding system with investor matching"
                ]
            },
            
            'Pharmaceutical': {
                'french': [
                    "Système de gestion d'essais cliniques avec conformité FDA",
                    "Application de pharmacovigilance avec détection effets indésirables",
                    "Plateforme de développement de médicaments avec pipeline management",
                    "Outil de compliance réglementaire avec audit trail complet",
                    "Système de traçabilité pharmaceutique avec blockchain sérialisation",
                    "Application de recherche clinique avec randomisation patients",
                    "Portail patient essais thérapeutiques avec consentement éclairé électronique"
                ],
                'english': [
                    "Clinical trial management system with FDA compliance",
                    "Pharmacovigilance application with adverse event detection",
                    "Drug development platform with pipeline management",
                    "Regulatory compliance tool with complete audit trail",
                    "Pharmaceutical traceability system with blockchain serialization",
                    "Clinical research application with patient randomization",
                    "Patient portal for therapeutic trials with electronic informed consent"
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
        print(f"Répartition : {len(df[df['language'] == 'french'])} français, {len(df[df['language'] == 'english'])} anglais")
        return df
    
    def train_model(self):
        """Entraîner le modèle de classification d'industrie sur 33 industries"""
        if self.is_trained:
            return
        
        print("Entraînement du classificateur d'industrie ML étendu...")
        
        # Charger les données étendues (462 échantillons)
        df = self.load_training_dataset()
        
        # Extraire les features
        print("Extraction des features pour 33 industries...")
        feature_matrix = []
        for text in df['description']:
            features = self.feature_extractor.extract_industry_features(text)
            feature_matrix.append(list(features.values()))
        
        X = np.array(feature_matrix)
        y = self.label_encoder.fit_transform(df['industry'])
        
        # Modèle optimisé pour 33 classes
        self.classifier = VotingClassifier([
            ('rf', RandomForestClassifier(
                n_estimators=200, 
                random_state=42, 
                class_weight='balanced', 
                max_depth=20,
                min_samples_split=5
            )),
            ('svm', SVC(
                probability=True, 
                random_state=42, 
                class_weight='balanced', 
                kernel='rbf',
                C=2.0,
                gamma='scale'
            )),
            ('nb', MultinomialNB(alpha=0.01))  # Alpha réduit pour plus de classes
        ], voting='soft')
    
        print(f"Entraînement sur {len(X)} échantillons, {len(np.unique(y))} industries...")
        self.classifier.fit(X, y)
        
        # Évaluation
        self._evaluate_model(X, y)
        
        self.is_trained = True
        print(f"Classificateur entraîné avec succès sur {len(self.industry_detector.industries)} industries!")
    
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
    
    def predict_industry(self, text: str, language: str = None) -> Dict[str, Any]:
        """Prédire l'industrie d'un texte"""

        if not text or len(text.strip()) < 10:
            return ({'error': 'Texte trop court (minimum 10 caractères)'}), 400

        if not self.is_trained:
            self.train_model()

        if language is None:
            language = self.detect_language(text)
        
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
            'total_training_samples': 462,
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
    print(f"Dataset : 462 echantillons d'entrainement")
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