# Analyse intelligente des risques et opportunités par industrie/complexité multilingue
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
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
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


class MultilingualRiskOpportunityAnalyzer:
    """Analyseur de risques et opportunités multilingue"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # Patterns de risques par industrie et langue
        self.risk_patterns = {
            'Technology': {
                'french': {
                    'technique': ['obsolescence', 'compatibilité', 'scalabilité', 'performance', 'sécurité'],
                    'marché': ['concurrence', 'disruption', 'adoption', 'changement tech'],
                    'équipe': ['compétences', 'recrutement', 'formation', 'turnover'],
                    'financier': ['budget', 'financement', 'rentabilité', 'coût développement'],
                    'réglementaire': ['rgpd', 'conformité', 'licences', 'brevets']
                },
                'english': {
                    'technical': ['obsolescence', 'compatibility', 'scalability', 'performance', 'security'],
                    'market': ['competition', 'disruption', 'adoption', 'tech change'],
                    'team': ['skills', 'recruitment', 'training', 'turnover'],
                    'financial': ['budget', 'funding', 'profitability', 'development cost'],
                    'regulatory': ['gdpr', 'compliance', 'licenses', 'patents']
                }
            },
            'Healthcare': {
                'french': {
                    'réglementaire': ['hipaa', 'rgpd santé', 'autorisation médicale', 'certification'],
                    'sécurité': ['données patients', 'chiffrement', 'accès contrôlé', 'audit'],
                    'technique': ['interopérabilité', 'standards médicaux', 'fiabilité', 'disponibilité'],
                    'adoption': ['résistance médecins', 'formation utilisateurs', 'changement workflow'],
                    'responsabilité': ['erreur diagnostic', 'responsabilité légale', 'assurance']
                },
                'english': {
                    'regulatory': ['hipaa', 'gdpr health', 'medical authorization', 'certification'],
                    'security': ['patient data', 'encryption', 'access control', 'audit'],
                    'technical': ['interoperability', 'medical standards', 'reliability', 'availability'],
                    'adoption': ['doctor resistance', 'user training', 'workflow change'],
                    'liability': ['diagnostic error', 'legal responsibility', 'insurance']
                }
            },
            'Finance': {
                'french': {
                    'réglementaire': ['pci-dss', 'mifid', 'bâle', 'anti-blanchiment', 'kyc'],
                    'sécurité': ['fraude', 'cyberattaque', 'manipulation marché', 'vol données'],
                    'technique': ['haute fréquence', 'latence', 'algorithmes', 'risque systémique'],
                    'marché': ['volatilité', 'liquidité', 'crise financière', 'taux change'],
                    'réputation': ['confiance client', 'réputation', 'transparence', 'éthique']
                },
                'english': {
                    'regulatory': ['pci-dss', 'mifid', 'basel', 'anti-money laundering', 'kyc'],
                    'security': ['fraud', 'cyberattack', 'market manipulation', 'data theft'],
                    'technical': ['high frequency', 'latency', 'algorithms', 'systemic risk'],
                    'market': ['volatility', 'liquidity', 'financial crisis', 'exchange rate'],
                    'reputation': ['client trust', 'reputation', 'transparency', 'ethics']
                }
            },
            'Education': {
                'french': {
                    'pédagogie': ['efficacité apprentissage', 'adaptation élèves', 'évaluation'],
                    'technique': ['accessibilité', 'compatibilité appareils', 'bande passante'],
                    'adoption': ['résistance enseignants', 'formation', 'changement méthodes'],
                    'contenu': ['qualité contenu', 'droits auteur', 'mise à jour'],
                    'équité': ['fracture numérique', 'accès équitable', 'discrimination']
                },
                'english': {
                    'pedagogy': ['learning effectiveness', 'student adaptation', 'assessment'],
                    'technical': ['accessibility', 'device compatibility', 'bandwidth'],
                    'adoption': ['teacher resistance', 'training', 'method change'],
                    'content': ['content quality', 'copyright', 'updates'],
                    'equity': ['digital divide', 'equitable access', 'discrimination']
                }
            },
            'Retail': {
                'french': {
                    'concurrence': ['amazon', 'marketplace', 'prix', 'différenciation'],
                    'logistique': ['livraison', 'stock', 'retours', 'supply chain'],
                    'technique': ['charge trafic', 'sécurité paiement', 'mobile first'],
                    'client': ['expérience utilisateur', 'fidélisation', 'service client'],
                    'économique': ['marge', 'coût acquisition', 'saisonnalité']
                },
                'english': {
                    'competition': ['amazon', 'marketplace', 'pricing', 'differentiation'],
                    'logistics': ['delivery', 'inventory', 'returns', 'supply chain'],
                    'technical': ['traffic load', 'payment security', 'mobile first'],
                    'customer': ['user experience', 'loyalty', 'customer service'],
                    'economic': ['margin', 'acquisition cost', 'seasonality']
                }
            },
            'Media': {
                'french': {
                    'contenu': ['droits auteur', 'modération', 'qualité', 'originalité'],
                    'technique': ['streaming', 'bande passante', 'cdn', 'scalabilité'],
                    'monétisation': ['publicité', 'abonnement', 'freemium', 'concurrence'],
                    'réglementaire': ['droit image', 'rgpd', 'modération contenu'],
                    'audience': ['engagement', 'rétention', 'croissance', 'démographie']
                },
                'english': {
                    'content': ['copyright', 'moderation', 'quality', 'originality'],
                    'technical': ['streaming', 'bandwidth', 'cdn', 'scalability'],
                    'monetization': ['advertising', 'subscription', 'freemium', 'competition'],
                    'regulatory': ['image rights', 'gdpr', 'content moderation'],
                    'audience': ['engagement', 'retention', 'growth', 'demographics']
                }
            },
            'Logistics': {
                'french': {
                    'opérationnel': ['livraison temps', 'coût transport', 'optimisation routes'],
                    'technique': ['tracking', 'iot', 'prédiction', 'automatisation'],
                    'externe': ['conditions météo', 'réglementations transport', 'carburant'],
                    'partenaires': ['transporteurs', 'entrepôts', 'douanes'],
                    'environnement': ['empreinte carbone', 'durabilité', 'réglementation verte']
                },
                'english': {
                    'operational': ['delivery time', 'transport cost', 'route optimization'],
                    'technical': ['tracking', 'iot', 'prediction', 'automation'],
                    'external': ['weather conditions', 'transport regulations', 'fuel'],
                    'partners': ['carriers', 'warehouses', 'customs'],
                    'environment': ['carbon footprint', 'sustainability', 'green regulation']
                }
            },
            'Energy': {
                'french': {
                    'technique': ['fiabilité réseau', 'maintenance', 'obsolescence', 'interopérabilité'],
                    'réglementaire': ['réglementation énergie', 'normes sécurité', 'environnement'],
                    'économique': ['prix énergie', 'retour investissement', 'subventions'],
                    'environnement': ['impact carbone', 'durabilité', 'changement climatique'],
                    'sécurité': ['cyberattaque', 'sabotage', 'sécurité physique']
                },
                'english': {
                    'technical': ['grid reliability', 'maintenance', 'obsolescence', 'interoperability'],
                    'regulatory': ['energy regulation', 'safety standards', 'environment'],
                    'economic': ['energy price', 'investment return', 'subsidies'],
                    'environment': ['carbon impact', 'sustainability', 'climate change'],
                    'security': ['cyberattack', 'sabotage', 'physical security']
                }
            }
        }
        
        # Patterns d'opportunités par industrie et langue
        self.opportunity_patterns = {
            'Technology': {
                'french': {
                    'innovation': ['ia', 'machine learning', 'blockchain', 'iot', 'quantum'],
                    'marché': ['marché émergent', 'disruption', 'nouvelle niche', 'globalisation'],
                    'partenariat': ['api', 'écosystème', 'marketplace', 'intégration'],
                    'monétisation': ['saas', 'freemium', 'api monétisée', 'données'],
                    'talent': ['remote work', 'nouveaux talents', 'formation', 'communauté']
                },
                'english': {
                    'innovation': ['ai', 'machine learning', 'blockchain', 'iot', 'quantum'],
                    'market': ['emerging market', 'disruption', 'new niche', 'globalization'],
                    'partnership': ['api', 'ecosystem', 'marketplace', 'integration'],
                    'monetization': ['saas', 'freemium', 'monetized api', 'data'],
                    'talent': ['remote work', 'new talents', 'training', 'community']
                }
            },
            'Healthcare': {
                'french': {
                    'digital': ['télémédecine', 'e-santé', 'santé mobile', 'wearables'],
                    'ia': ['diagnostic assisté', 'médecine personnalisée', 'prédiction'],
                    'démographie': ['vieillissement', 'maladies chroniques', 'prévention'],
                    'réglementaire': ['interopérabilité', 'standards', 'certification'],
                    'global': ['santé globale', 'pays émergents', 'télémédecine rurale']
                },
                'english': {
                    'digital': ['telemedicine', 'e-health', 'mobile health', 'wearables'],
                    'ai': ['assisted diagnosis', 'personalized medicine', 'prediction'],
                    'demographics': ['aging', 'chronic diseases', 'prevention'],
                    'regulatory': ['interoperability', 'standards', 'certification'],
                    'global': ['global health', 'emerging countries', 'rural telemedicine']
                }
            },
            'Finance': {
                'french': {
                    'fintech': ['néobanques', 'crypto', 'defi', 'paiement mobile'],
                    'inclusion': ['banque inclusive', 'micropaiement', 'pays émergents'],
                    'automatisation': ['robo-advisor', 'trading automatique', 'compliance'],
                    'données': ['big data', 'analyse prédictive', 'personnalisation'],
                    'réglementaire': ['open banking', 'psd2', 'régulation favorable']
                },
                'english': {
                    'fintech': ['neobanks', 'crypto', 'defi', 'mobile payment'],
                    'inclusion': ['inclusive banking', 'micropayment', 'emerging countries'],
                    'automation': ['robo-advisor', 'automated trading', 'compliance'],
                    'data': ['big data', 'predictive analytics', 'personalization'],
                    'regulatory': ['open banking', 'psd2', 'favorable regulation']
                }
            },
            'Education': {
                'french': {
                    'digital': ['e-learning', 'mooc', 'formation distance', 'réalité virtuelle'],
                    'personnalisation': ['apprentissage adaptatif', 'ia éducative', 'parcours'],
                    'global': ['éducation globale', 'langues', 'certification internationale'],
                    'professionnel': ['formation continue', 'reskilling', 'certification'],
                    'gamification': ['serious games', 'motivation', 'engagement']
                },
                'english': {
                    'digital': ['e-learning', 'mooc', 'distance learning', 'virtual reality'],
                    'personalization': ['adaptive learning', 'educational ai', 'pathways'],
                    'global': ['global education', 'languages', 'international certification'],
                    'professional': ['lifelong learning', 'reskilling', 'certification'],
                    'gamification': ['serious games', 'motivation', 'engagement']
                }
            },
            'Retail': {
                'french': {
                    'omnichannel': ['click collect', 'expérience unifiée', 'social commerce'],
                    'personnalisation': ['recommandation', 'ia', 'expérience client'],
                    'durabilité': ['commerce durable', 'local', 'seconde main'],
                    'technologie': ['ar/vr', 'voice commerce', 'iot retail'],
                    'global': ['cross-border', 'nouveaux marchés', 'marketplace']
                },
                'english': {
                    'omnichannel': ['click collect', 'unified experience', 'social commerce'],
                    'personalization': ['recommendation', 'ai', 'customer experience'],
                    'sustainability': ['sustainable commerce', 'local', 'second hand'],
                    'technology': ['ar/vr', 'voice commerce', 'iot retail'],
                    'global': ['cross-border', 'new markets', 'marketplace']
                }
            },
            'Media': {
                'french': {
                    'contenu': ['contenu généré', 'créateurs', 'live streaming', 'interactif'],
                    'technologie': ['ar/vr', 'intelligence artificielle', 'personnalisation'],
                    'monétisation': ['creator economy', 'nft', 'micropaiement', 'abonnement'],
                    'global': ['contenu global', 'localisation', 'cross-platform'],
                    'communauté': ['engagement', 'communauté', 'social features']
                },
                'english': {
                    'content': ['user generated', 'creators', 'live streaming', 'interactive'],
                    'technology': ['ar/vr', 'artificial intelligence', 'personalization'],
                    'monetization': ['creator economy', 'nft', 'micropayment', 'subscription'],
                    'global': ['global content', 'localization', 'cross-platform'],
                    'community': ['engagement', 'community', 'social features']
                }
            },
            'Logistics': {
                'french': {
                    'automatisation': ['drones', 'véhicules autonomes', 'robots', 'ia'],
                    'durabilité': ['transport vert', 'optimisation', 'empreinte carbone'],
                    'technologie': ['iot', 'blockchain', 'prédiction', 'optimisation'],
                    'ecommerce': ['last mile', 'livraison rapide', 'omnichannel'],
                    'global': ['supply chain globale', 'nouveaux marchés', 'trade']
                },
                'english': {
                    'automation': ['drones', 'autonomous vehicles', 'robots', 'ai'],
                    'sustainability': ['green transport', 'optimization', 'carbon footprint'],
                    'technology': ['iot', 'blockchain', 'prediction', 'optimization'],
                    'ecommerce': ['last mile', 'fast delivery', 'omnichannel'],
                    'global': ['global supply chain', 'new markets', 'trade']
                }
            },
            'Energy': {
                'french': {
                    'renouvelable': ['solaire', 'éolien', 'stockage', 'smart grid'],
                    'efficacité': ['optimisation', 'ia', 'prédiction', 'maintenance'],
                    'électrification': ['véhicules électriques', 'chauffage', 'industrie'],
                    'décentralisation': ['prosumer', 'micro-réseaux', 'communauté'],
                    'innovation': ['hydrogène', 'fusion', 'nouvelles technologies']
                },
                'english': {
                    'renewable': ['solar', 'wind', 'storage', 'smart grid'],
                    'efficiency': ['optimization', 'ai', 'prediction', 'maintenance'],
                    'electrification': ['electric vehicles', 'heating', 'industry'],
                    'decentralization': ['prosumer', 'micro-grids', 'community'],
                    'innovation': ['hydrogen', 'fusion', 'new technologies']
                }
            }
        }
        
        # Niveaux de gravité des risques
        self.risk_severity = {
            'CRITICAL': ['sécurité', 'security', 'réglementaire', 'regulatory', 'responsabilité', 'liability'],
            'HIGH': ['technique', 'technical', 'financier', 'financial', 'réputation', 'reputation'],
            'MEDIUM': ['marché', 'market', 'concurrence', 'competition', 'adoption'],
            'LOW': ['équipe', 'team', 'contenu', 'content', 'audience']
        }
        
        # Potentiel des opportunités
        self.opportunity_potential = {
            'HIGH': ['innovation', 'ia', 'ai', 'automatisation', 'automation'],
            'MEDIUM': ['marché', 'market', 'digital', 'technologie', 'technology'],
            'LOW': ['partenariat', 'partnership', 'communauté', 'community']
        }
    
    def detect_language(self, text: str) -> str:
        """Détecter la langue du texte"""
        text_lower = text.lower()
        
        french_indicators = [
            'le', 'la', 'les', 'du', 'de', 'des', 'un', 'une', 'avec', 'pour',
            'risque', 'opportunité', 'développement', 'projet', 'système',
            'sécurité', 'réglementaire', 'technique', 'marché'
        ]
        
        english_indicators = [
            'the', 'a', 'an', 'with', 'for', 'in', 'on', 'and', 'or',
            'risk', 'opportunity', 'development', 'project', 'system',
            'security', 'regulatory', 'technical', 'market'
        ]
        
        french_score = sum(1 for indicator in french_indicators if indicator in text_lower)
        english_score = sum(1 for indicator in english_indicators if indicator in text_lower)
        
        if french_score == english_score:
            # Vérifier les caractères accentués
            accented_chars = ['à', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç']
            if any(char in text_lower for char in accented_chars):
                return 'french'
        
        return 'french' if french_score > english_score else 'english'
    
    def analyze_project_risks(self, text: str, industry: str, complexity: str) -> Dict[str, Any]:
        """Analyser les risques d'un projet"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        if industry not in self.risk_patterns:
            industry = 'Technology'  # Fallback
        
        industry_risks = self.risk_patterns[industry][language]
        detected_risks = {}
        
        # Analyser chaque catégorie de risque
        for category, risk_keywords in industry_risks.items():
            category_score = 0
            detected_keywords = []
            
            for keyword in risk_keywords:
                if keyword in text_lower:
                    category_score += 1
                    detected_keywords.append(keyword)
            
            if category_score > 0:
                detected_risks[category] = {
                    'score': category_score,
                    'keywords': detected_keywords,
                    'severity': self._calculate_risk_severity(category, complexity)
                }
        
        return {
            'language': language,
            'detected_risks': detected_risks,
            'total_risk_score': sum(risk['score'] for risk in detected_risks.values()),
            'risk_categories': list(detected_risks.keys())
        }
    
    def analyze_project_opportunities(self, text: str, industry: str, complexity: str) -> Dict[str, Any]:
        """Analyser les opportunités d'un projet"""
        language = self.detect_language(text)
        text_lower = text.lower()
        
        if industry not in self.opportunity_patterns:
            industry = 'Technology'  # Fallback
        
        industry_opportunities = self.opportunity_patterns[industry][language]
        detected_opportunities = {}
        
        # Analyser chaque catégorie d'opportunité
        for category, opp_keywords in industry_opportunities.items():
            category_score = 0
            detected_keywords = []
            
            for keyword in opp_keywords:
                if keyword in text_lower:
                    category_score += 1
                    detected_keywords.append(keyword)
            
            if category_score > 0:
                detected_opportunities[category] = {
                    'score': category_score,
                    'keywords': detected_keywords,
                    'potential': self._calculate_opportunity_potential(category, complexity)
                }
        
        return {
            'language': language,
            'detected_opportunities': detected_opportunities,
            'total_opportunity_score': sum(opp['score'] for opp in detected_opportunities.values()),
            'opportunity_categories': list(detected_opportunities.keys())
        }
    
    def _calculate_risk_severity(self, category: str, complexity: str) -> str:
        """Calculer la gravité d'un risque"""
        for severity, keywords in self.risk_severity.items():
            if category in keywords:
                # Ajuster selon la complexité
                if complexity in ['complexe', 'expert'] and severity == 'HIGH':
                    return 'CRITICAL'
                elif complexity == 'simple' and severity == 'HIGH':
                    return 'MEDIUM'
                return severity
        
        return 'MEDIUM'  # Par défaut
    
    def _calculate_opportunity_potential(self, category: str, complexity: str) -> str:
        """Calculer le potentiel d'une opportunité"""
        for potential, keywords in self.opportunity_potential.items():
            if category in keywords:
                # Ajuster selon la complexité
                if complexity in ['complexe', 'expert'] and potential == 'MEDIUM':
                    return 'HIGH'
                elif complexity == 'simple' and potential == 'MEDIUM':
                    return 'LOW'
                return potential
        
        return 'MEDIUM'  # Par défaut


class RiskOpportunityFeatureExtractor:
    """Extracteur de features pour l'analyse des risques et opportunités"""
    
    def __init__(self):
        self.analyzer = MultilingualRiskOpportunityAnalyzer()
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=400,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.8
        )
        
        # Stop words multilingues
        self.stop_words = set()
        try:
            self.stop_words.update(stopwords.words('french'))
            self.stop_words.update(stopwords.words('english'))
        except:
            pass
    
    def extract_risk_opportunity_features(self, text: str, industry: str, complexity: str) -> Dict[str, float]:
        """Extraire les features pour l'analyse des risques et opportunités"""
        language = self.analyzer.detect_language(text)
        
        # Analyses de base
        risk_analysis = self.analyzer.analyze_project_risks(text, industry, complexity)
        opportunity_analysis = self.analyzer.analyze_project_opportunities(text, industry, complexity)
        
        features = {}
        
        # 1. Features de risques
        features['total_risk_score'] = risk_analysis['total_risk_score']
        features['risk_category_count'] = len(risk_analysis['risk_categories'])
        features['risk_diversity'] = len(risk_analysis['risk_categories']) / 8  # Normaliser sur 8 catégories max
        
        # Scores par catégorie de risque
        risk_categories = ['technique', 'marché', 'équipe', 'financier', 'réglementaire', 'sécurité']
        if language == 'english':
            risk_categories = ['technical', 'market', 'team', 'financial', 'regulatory', 'security']
        
        for category in risk_categories:
            if category in risk_analysis['detected_risks']:
                features[f'risk_{category}_score'] = risk_analysis['detected_risks'][category]['score']
            else:
                features[f'risk_{category}_score'] = 0
        
        # 2. Features d'opportunités
        features['total_opportunity_score'] = opportunity_analysis['total_opportunity_score']
        features['opportunity_category_count'] = len(opportunity_analysis['opportunity_categories'])
        features['opportunity_diversity'] = len(opportunity_analysis['opportunity_categories']) / 8
        
        # Scores par catégorie d'opportunité
        opp_categories = ['innovation', 'marché', 'partenariat', 'monétisation', 'technologie']
        if language == 'english':
            opp_categories = ['innovation', 'market', 'partnership', 'monetization', 'technology']
        
        for category in opp_categories:
            if category in opportunity_analysis['detected_opportunities']:
                features[f'opportunity_{category}_score'] = opportunity_analysis['detected_opportunities'][category]['score']
            else:
                features[f'opportunity_{category}_score'] = 0
        
        # 3. Features textuelles
        words = text.split()
        features['text_length'] = len(text)
        features['word_count'] = len(words)
        features['unique_word_ratio'] = len(set(words)) / len(words) if words else 0
        
        # 4. Features de complexité et industrie
        complexity_scores = {'simple': 1, 'moyen': 2, 'complexe': 3, 'expert': 4}
        features['complexity_score'] = complexity_scores.get(complexity, 2)
        
        # Boost par industrie
        industry_risk_factors = {
            'Healthcare': 0.8,
            'Finance': 0.9,
            'Energy': 0.7,
            'Technology': 0.4,
            'Education': 0.3,
            'Retail': 0.5,
            'Media': 0.4,
            'Logistics': 0.6
        }
        features['industry_risk_factor'] = industry_risk_factors.get(industry, 0.5)
        
        # 5. Ratio risque/opportunité
        if features['total_opportunity_score'] > 0:
            features['risk_opportunity_ratio'] = features['total_risk_score'] / features['total_opportunity_score']
        else:
            features['risk_opportunity_ratio'] = features['total_risk_score']
        
        # 6. Features linguistiques
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
        
        return features


class MLRiskOpportunityAnalyzer:
    """Prédicteur ML de risques et opportunités"""
    
    def __init__(self):
        self.analyzer = MultilingualRiskOpportunityAnalyzer()
        self.feature_extractor = RiskOpportunityFeatureExtractor()
        
        # Modèles ML
        self.risk_level_classifier = None
        self.opportunity_level_classifier = None
        self.mitigation_strategy_predictor = None
        
        # Encodeurs
        self.risk_encoder = LabelEncoder()
        self.opportunity_encoder = LabelEncoder()
        self.strategy_encoder = LabelEncoder()
        
        # État d'entraînement
        self.is_trained = False
        
        # Cache
        self.prediction_cache = {}
    
    def load_training_dataset(self) -> pd.DataFrame:
        """Charger le dataset d'entraînement des risques et opportunités"""
        training_samples = [
            # Technology - Risques et opportunités
            ("Développement d'une plateforme SaaS avec API REST", "Technology", "moyen", "MEDIUM", "HIGH", "Diversification tech", "french"),
            ("Application web React avec base de données", "Technology", "simple", "LOW", "MEDIUM", "Formation équipe", "french"),
            ("Système distribué avec microservices", "Technology", "complexe", "HIGH", "HIGH", "Architecture experte", "french"),
            ("Intelligence artificielle pour analyse données", "Technology", "expert", "HIGH", "HIGH", "Innovation IA", "french"),
            ("Site web vitrine avec CMS", "Technology", "simple", "LOW", "LOW", "Solution standard", "french"),
            ("Plateforme cloud native avec Kubernetes", "Technology", "expert", "HIGH", "HIGH", "Expertise DevOps", "french"),
            ("Application mobile cross-platform", "Technology", "moyen", "MEDIUM", "MEDIUM", "Développement mobile", "french"),
            
            ("SaaS platform development with REST API", "Technology", "moyen", "MEDIUM", "HIGH", "Tech diversification", "english"),
            ("React web application with database", "Technology", "simple", "LOW", "MEDIUM", "Team training", "english"),
            ("Distributed system with microservices", "Technology", "complexe", "HIGH", "HIGH", "Expert architecture", "english"),
            ("Artificial intelligence for data analysis", "Technology", "expert", "HIGH", "HIGH", "AI innovation", "english"),
            ("Showcase website with CMS", "Technology", "simple", "LOW", "LOW", "Standard solution", "english"),
            ("Cloud native platform with Kubernetes", "Technology", "expert", "HIGH", "HIGH", "DevOps expertise", "english"),
            ("Cross-platform mobile application", "Technology", "moyen", "MEDIUM", "MEDIUM", "Mobile development", "english"),
            
            # Healthcare - Risques élevés, opportunités spécifiques
            ("Système de gestion des dossiers médicaux", "Healthcare", "complexe", "CRITICAL", "HIGH", "Conformité HIPAA", "french"),
            ("Application de télémédecine", "Healthcare", "moyen", "HIGH", "HIGH", "Certification médicale", "french"),
            ("Plateforme de suivi des patients avec IoT", "Healthcare", "expert", "CRITICAL", "HIGH", "Sécurité données", "french"),
            ("Application mobile de santé", "Healthcare", "simple", "MEDIUM", "MEDIUM", "Validation médicale", "french"),
            ("Système de prescription électronique", "Healthcare", "complexe", "CRITICAL", "MEDIUM", "Audit sécurité", "french"),
            ("IA pour diagnostic médical", "Healthcare", "expert", "CRITICAL", "HIGH", "Expertise médicale", "french"),
            ("Portail patient avec rendez-vous", "Healthcare", "moyen", "HIGH", "MEDIUM", "Formation utilisateurs", "french"),
            
            ("Electronic medical records system", "Healthcare", "complexe", "CRITICAL", "HIGH", "HIPAA compliance", "english"),
            ("Telemedicine application", "Healthcare", "moyen", "HIGH", "HIGH", "Medical certification", "english"),
            ("Patient tracking platform with IoT", "Healthcare", "expert", "CRITICAL", "HIGH", "Data security", "english"),
            ("Mobile health application", "Healthcare", "simple", "MEDIUM", "MEDIUM", "Medical validation", "english"),
            ("Electronic prescription system", "Healthcare", "complexe", "CRITICAL", "MEDIUM", "Security audit", "english"),
            ("AI for medical diagnosis", "Healthcare", "expert", "CRITICAL", "HIGH", "Medical expertise", "english"),
            ("Patient portal with appointments", "Healthcare", "moyen", "HIGH", "MEDIUM", "User training", "english"),
            
            # Finance - Risques critiques, conformité
            ("Plateforme de trading algorithmique", "Finance", "expert", "CRITICAL", "HIGH", "Conformité financière", "french"),
            ("Application bancaire mobile", "Finance", "complexe", "CRITICAL", "HIGH", "Sécurité PCI-DSS", "french"),
            ("Système de détection de fraude", "Finance", "expert", "CRITICAL", "MEDIUM", "Audit sécurité", "french"),
            ("Application de paiement P2P", "Finance", "moyen", "HIGH", "HIGH", "Réglementation paiement", "french"),
            ("Plateforme de gestion de portefeuille", "Finance", "complexe", "HIGH", "MEDIUM", "Conformité MiFID", "french"),
            ("Système de crédit scoring", "Finance", "expert", "CRITICAL", "HIGH", "Algorithme responsable", "french"),
            ("Application de budget personnel", "Finance", "simple", "MEDIUM", "MEDIUM", "Sécurité données", "french"),
            
            ("Algorithmic trading platform", "Finance", "expert", "CRITICAL", "HIGH", "Financial compliance", "english"),
            ("Mobile banking application", "Finance", "complexe", "CRITICAL", "HIGH", "PCI-DSS security", "english"),
            ("Fraud detection system", "Finance", "expert", "CRITICAL", "MEDIUM", "Security audit", "english"),
            ("P2P payment application", "Finance", "moyen", "HIGH", "HIGH", "Payment regulation", "english"),
            ("Portfolio management platform", "Finance", "complexe", "HIGH", "MEDIUM", "MiFID compliance", "english"),
            ("Credit scoring system", "Finance", "expert", "CRITICAL", "HIGH", "Responsible algorithm", "english"),
            ("Personal budget application", "Finance", "simple", "MEDIUM", "MEDIUM", "Data security", "english"),
            
            # Education - Risques modérés, opportunités pédagogiques
            ("Plateforme d'apprentissage en ligne", "Education", "moyen", "MEDIUM", "HIGH", "Pédagogie digitale", "french"),
            ("Application mobile d'apprentissage", "Education", "simple", "LOW", "HIGH", "Engagement utilisateur", "french"),
            ("Système de gestion scolaire", "Education", "complexe", "MEDIUM", "MEDIUM", "Formation enseignants", "french"),
            ("Plateforme MOOC avec certification", "Education", "moyen", "MEDIUM", "HIGH", "Certification qualité", "french"),
            ("Application de réalité virtuelle éducative", "Education", "expert", "HIGH", "HIGH", "Innovation pédagogique", "french"),
            ("Système d'évaluation automatique", "Education", "complexe", "MEDIUM", "MEDIUM", "Algorithme équitable", "french"),
            ("Plateforme de collaboration étudiante", "Education", "simple", "LOW", "MEDIUM", "Communauté étudiante", "french"),
            
            ("Online learning platform", "Education", "moyen", "MEDIUM", "HIGH", "Digital pedagogy", "english"),
            ("Mobile learning application", "Education", "simple", "LOW", "HIGH", "User engagement", "english"),
            ("School management system", "Education", "complexe", "MEDIUM", "MEDIUM", "Teacher training", "english"),
            ("MOOC platform with certification", "Education", "moyen", "MEDIUM", "HIGH", "Quality certification", "english"),
            ("Educational virtual reality application", "Education", "expert", "HIGH", "HIGH", "Pedagogical innovation", "english"),
            ("Automated assessment system", "Education", "complexe", "MEDIUM", "MEDIUM", "Fair algorithm", "english"),
            ("Student collaboration platform", "Education", "simple", "LOW", "MEDIUM", "Student community", "english"),
            
            # Retail - Concurrence élevée, opportunités commerciales
            ("Plateforme e-commerce avec marketplace", "Retail", "moyen", "MEDIUM", "HIGH", "Différenciation marché", "french"),
            ("Application mobile de shopping", "Retail", "simple", "LOW", "HIGH", "Expérience mobile", "french"),
            ("Système de gestion d'inventaire", "Retail", "complexe", "MEDIUM", "MEDIUM", "Optimisation logistique", "french"),
            ("Plateforme omnicanal", "Retail", "expert", "HIGH", "HIGH", "Intégration systèmes", "french"),
            ("Application de recommandation produits", "Retail", "complexe", "MEDIUM", "HIGH", "Personnalisation IA", "french"),
            ("Système de fidélité client", "Retail", "moyen", "LOW", "MEDIUM", "Engagement client", "french"),
            ("Plateforme de vente sociale", "Retail", "moyen", "MEDIUM", "HIGH", "Social commerce", "french"),
            
            ("E-commerce platform with marketplace", "Retail", "moyen", "MEDIUM", "HIGH", "Market differentiation", "english"),
            ("Mobile shopping application", "Retail", "simple", "LOW", "HIGH", "Mobile experience", "english"),
            ("Inventory management system", "Retail", "complexe", "MEDIUM", "MEDIUM", "Logistics optimization", "english"),
            ("Omnichannel platform", "Retail", "expert", "HIGH", "HIGH", "Systems integration", "english"),
            ("Product recommendation application", "Retail", "complexe", "MEDIUM", "HIGH", "AI personalization", "english"),
            ("Customer loyalty system", "Retail", "moyen", "LOW", "MEDIUM", "Customer engagement", "english"),
            ("Social selling platform", "Retail", "moyen", "MEDIUM", "HIGH", "Social commerce", "english"),
            
            # Media - Droits d'auteur, engagement
            ("Plateforme de streaming vidéo", "Media", "complexe", "HIGH", "HIGH", "Droits contenu", "french"),
            ("Application de réseau social", "Media", "moyen", "MEDIUM", "HIGH", "Modération contenu", "french"),
            ("Système de gestion de contenu", "Media", "simple", "LOW", "MEDIUM", "Workflow éditorial", "french"),
            ("Plateforme de podcast", "Media", "moyen", "MEDIUM", "HIGH", "Monétisation contenu", "french"),
            ("Application de création vidéo", "Media", "complexe", "MEDIUM", "HIGH", "Outils créatifs", "french"),
            ("Système de diffusion en direct", "Media", "expert", "HIGH", "HIGH", "Scalabilité streaming", "french"),
            ("Plateforme de blog collaboratif", "Media", "simple", "LOW", "MEDIUM", "Communauté auteurs", "french"),
            
            ("Video streaming platform", "Media", "complexe", "HIGH", "HIGH", "Content rights", "english"),
            ("Social media application", "Media", "moyen", "MEDIUM", "HIGH", "Content moderation", "english"),
            ("Content management system", "Media", "simple", "LOW", "MEDIUM", "Editorial workflow", "english"),
            ("Podcast platform", "Media", "moyen", "MEDIUM", "HIGH", "Content monetization", "english"),
            ("Video creation application", "Media", "complexe", "MEDIUM", "HIGH", "Creative tools", "english"),
            ("Live streaming system", "Media", "expert", "HIGH", "HIGH", "Streaming scalability", "english"),
            ("Collaborative blog platform", "Media", "simple", "LOW", "MEDIUM", "Author community", "english"),
            
            # Logistics - Optimisation, partenaires
            ("Système de gestion de chaîne logistique", "Logistics", "expert", "HIGH", "HIGH", "Optimisation routes", "french"),
            ("Application de suivi de livraison", "Logistics", "moyen", "MEDIUM", "MEDIUM", "Tracking temps réel", "french"),
            ("Plateforme d'optimisation de routes", "Logistics", "complexe", "MEDIUM", "HIGH", "Algorithme optimisation", "french"),
            ("Système de gestion d'entrepôt", "Logistics", "complexe", "MEDIUM", "MEDIUM", "Automatisation stock", "french"),
            ("Application de gestion de flotte", "Logistics", "moyen", "MEDIUM", "MEDIUM", "Gestion véhicules", "french"),
            ("Plateforme marketplace logistique", "Logistics", "expert", "HIGH", "HIGH", "Écosystème partenaires", "french"),
            ("Système de prédiction de demande", "Logistics", "expert", "MEDIUM", "HIGH", "IA prédictive", "french"),
            
            ("Supply chain management system", "Logistics", "expert", "HIGH", "HIGH", "Route optimization", "english"),
            ("Delivery tracking application", "Logistics", "moyen", "MEDIUM", "MEDIUM", "Real-time tracking", "english"),
            ("Route optimization platform", "Logistics", "complexe", "MEDIUM", "HIGH", "Optimization algorithm", "english"),
            ("Warehouse management system", "Logistics", "complexe", "MEDIUM", "MEDIUM", "Inventory automation", "english"),
            ("Fleet management application", "Logistics", "moyen", "MEDIUM", "MEDIUM", "Vehicle management", "english"),
            ("Logistics marketplace platform", "Logistics", "expert", "HIGH", "HIGH", "Partner ecosystem", "english"),
            ("Demand prediction system", "Logistics", "expert", "MEDIUM", "HIGH", "Predictive AI", "english"),
            
            # Energy - Réglementation, innovation
            ("Système de smart grid", "Energy", "expert", "HIGH", "HIGH", "Réglementation énergie", "french"),
            ("Application de gestion énergétique", "Energy", "moyen", "MEDIUM", "HIGH", "Efficacité énergétique", "french"),
            ("Plateforme IoT pour industrie", "Energy", "complexe", "HIGH", "HIGH", "Sécurité industrielle", "french"),
            ("Système de prédiction énergétique", "Energy", "expert", "MEDIUM", "HIGH", "IA énergétique", "french"),
            ("Application de compteur intelligent", "Energy", "moyen", "MEDIUM", "MEDIUM", "Standards IoT", "french"),
            ("Plateforme de trading d'énergie", "Energy", "expert", "HIGH", "HIGH", "Réglementation marché", "french"),
            ("Système de maintenance prédictive", "Energy", "complexe", "MEDIUM", "HIGH", "Maintenance 4.0", "french"),
            
            ("Smart grid system", "Energy", "expert", "HIGH", "HIGH", "Energy regulation", "english"),
            ("Energy management application", "Energy", "moyen", "MEDIUM", "HIGH", "Energy efficiency", "english"),
            ("IoT platform for industry", "Energy", "complexe", "HIGH", "HIGH", "Industrial security", "english"),
            ("Energy prediction system", "Energy", "expert", "MEDIUM", "HIGH", "Energy AI", "english"),
            ("Smart meter application", "Energy", "moyen", "MEDIUM", "MEDIUM", "IoT standards", "english"),
            ("Energy trading platform", "Energy", "expert", "HIGH", "HIGH", "Market regulation", "english"),
            ("Predictive maintenance system", "Energy", "complexe", "MEDIUM", "HIGH", "Maintenance 4.0", "english")
        ]
        
        df = pd.DataFrame(training_samples, columns=[
            'project_description', 'industry', 'complexity', 'risk_level', 'opportunity_level', 'mitigation_strategy', 'language'
        ])
        
        print(f"Dataset d'entraînement créé : {len(df)} échantillons")
        return df
    
    def train_models(self):
        """Entraîner les modèles ML de risques et opportunités - VERSION CORRIGÉE"""
        if self.is_trained:
            return
    
        print("Entraînement des modèles ML de risques et opportunités...")
    
        df = self.load_training_dataset()
    
        print(f"Colonnes du DataFrame: {df.columns.tolist()}")
        
        if 'project_description' in df.columns:
            description_col = 'project_description'
        elif 'description' in df.columns:
            description_col = 'description'
        else:
            print("Structure de colonnes non standard détectée...")
            if len(df.columns) >= 7:
                df.columns = ['project_description', 'industry', 'complexity', 'risk_level', 'opportunity_level', 'mitigation_strategy', 'language']
                description_col = 'project_description'
                print("✅ Colonnes renommées automatiquement")
            else:
                raise ValueError(f"Structure de dataset incorrecte. Colonnes trouvées: {df.columns.tolist()}")
    
        print("Extraction des features...")
        feature_matrix = []
        valid_rows = []
        
        for idx, row in df.iterrows():
            try:
                features = self.feature_extractor.extract_risk_opportunity_features(
                    row[description_col],  
                    row['industry'], 
                    row['complexity']
                )
                feature_matrix.append(list(features.values()))
                valid_rows.append(row)
            except Exception as e:
                print(f"Erreur extraction features ligne {idx}: {e}")
                continue
        
        if len(feature_matrix) == 0:
            print(" Aucune feature extraite, impossible d'entraîner les modèles")
            return
        
        print(f"{len(feature_matrix)} échantillons valides pour l'entraînement")
    
        X = np.array(feature_matrix)
        valid_df = pd.DataFrame(valid_rows)
    
        try:
            print("Entraînement du classificateur de niveau de risque...")
            y_risk = self.risk_encoder.fit_transform(valid_df['risk_level'])
        
            self.risk_level_classifier = VotingClassifier([
                ('rf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')),
                ('svm', SVC(probability=True, random_state=42, class_weight='balanced')),
                ('nb', MultinomialNB())
            ], voting='soft')
        
            self.risk_level_classifier.fit(X, y_risk)
            print(" Classificateur de risque entraîné")
        except Exception as e:
            print(f" Erreur entraînement classificateur risque: {e}")
            return
    
        try:
            print("Entraînement du classificateur de niveau d'opportunité...")
            y_opportunity = self.opportunity_encoder.fit_transform(valid_df['opportunity_level'])
        
            self.opportunity_level_classifier = VotingClassifier([
                ('rf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')),
                ('svm', SVC(probability=True, random_state=42, class_weight='balanced')),
                ('nb', MultinomialNB())
            ], voting='soft')
        
            self.opportunity_level_classifier.fit(X, y_opportunity)
            print(" Classificateur d'opportunité entraîné")
        except Exception as e:
            print(f" Erreur entraînement classificateur opportunité: {e}")
            return
    
        try:
            print("Entraînement du prédicteur de stratégie...")
            y_strategy = self.strategy_encoder.fit_transform(valid_df['mitigation_strategy'])
        
            self.mitigation_strategy_predictor = RandomForestClassifier(
                n_estimators=100,
                random_state=42,
                class_weight='balanced'
            )
            self.mitigation_strategy_predictor.fit(X, y_strategy)
            print(" Prédicteur de stratégie entraîné")
        except Exception as e:
            print(f" Erreur entraînement prédicteur stratégie: {e}")
            return
    
        try:
            self._evaluate_models(X, y_risk, y_opportunity, y_strategy)
        except Exception as e:
            print(f" Erreur lors de l'évaluation (non bloquante): {e}")
    
        self.is_trained = True
        print(" Modèles ML de risques et opportunités entraînés avec succès!")

    def train_model(self):
        """Alias pour train_models pour compatibilité"""
        return self.train_models()
    
    def _evaluate_models(self, X, y_risk, y_opportunity, y_strategy):
        """Évaluer les performances des modèles"""
        try:
            X_train, X_test, y_risk_train, y_risk_test = train_test_split(
                X, y_risk, test_size=0.2, random_state=42, stratify=y_risk
            )
            
            # Évaluation risque
            risk_pred = self.risk_level_classifier.predict(X_test)
            risk_accuracy = accuracy_score(y_risk_test, risk_pred)
            
            # Évaluation opportunité
            _, _, y_opp_train, y_opp_test = train_test_split(
                X, y_opportunity, test_size=0.2, random_state=42, stratify=y_opportunity
            )
            opp_pred = self.opportunity_level_classifier.predict(X_test)
            opp_accuracy = accuracy_score(y_opp_test, opp_pred)
            
            # Évaluation stratégie
            _, _, y_strat_train, y_strat_test = train_test_split(
                X, y_strategy, test_size=0.2, random_state=42, stratify=y_strategy
            )
            strat_pred = self.mitigation_strategy_predictor.predict(X_test)
            strat_accuracy = accuracy_score(y_strat_test, strat_pred)
            
            print(f"Évaluation - Risque: {risk_accuracy:.3f}, Opportunité: {opp_accuracy:.3f}, Stratégie: {strat_accuracy:.3f}")
            
            # Distribution des prédictions
            from collections import Counter
            predicted_risks = self.risk_encoder.inverse_transform(risk_pred)
            predicted_opportunities = self.opportunity_encoder.inverse_transform(opp_pred)
            
            print(f"Distribution risques : {Counter(predicted_risks)}")
            print(f"Distribution opportunités : {Counter(predicted_opportunities)}")
            
        except Exception as e:
            print(f"Erreur lors de l'évaluation : {e}")
    
    def analyze_project_risks_opportunities(self, description: str, industry: str, complexity: str, language: str = 'french') -> Dict[str, Any]:
        """Analyser les risques et opportunités d'un projet avec ML"""
        if not self.is_trained:
            self.train_models()
        
        if language is None:
            detected_language = self.analyzer.detect_language(description)  # ✅ Changer 'text' en 'description'
        else:
            detected_language = language
   
        # Cache 
        cache_key = hashlib.md5(f"{description}_{industry}_{complexity}_{detected_language}".encode()).hexdigest()
        if cache_key in self.prediction_cache:
            return self.prediction_cache[cache_key]
        
        try:
            # Analyses de base
            risk_analysis = self.analyzer.analyze_project_risks(description, industry, complexity)
            opportunity_analysis = self.analyzer.analyze_project_opportunities(description, industry, complexity)
            
            # Extraire les features
            features = self.feature_extractor.extract_risk_opportunity_features(
                description, industry, complexity
            )
            X = np.array([list(features.values())])
            
            # Prédictions ML
            risk_pred = self.risk_level_classifier.predict(X)[0]
            risk_proba = self.risk_level_classifier.predict_proba(X)[0]
            predicted_risk_level = self.risk_encoder.inverse_transform([risk_pred])[0]
            risk_confidence = float(np.max(risk_proba))
            
            opportunity_pred = self.opportunity_level_classifier.predict(X)[0]
            opportunity_proba = self.opportunity_level_classifier.predict_proba(X)[0]
            predicted_opportunity_level = self.opportunity_encoder.inverse_transform([opportunity_pred])[0]
            opportunity_confidence = float(np.max(opportunity_proba))
            
            strategy_pred = self.mitigation_strategy_predictor.predict(X)[0]
            predicted_strategy = self.strategy_encoder.inverse_transform([strategy_pred])[0]
            
            # Générer les risques détaillés
            detailed_risks = self._generate_detailed_risks(
                risk_analysis, predicted_risk_level, industry, complexity, detected_language
            )
            
            # Générer les opportunités détaillées
            detailed_opportunities = self._generate_detailed_opportunities(
                opportunity_analysis, predicted_opportunity_level, industry, complexity, detected_language
            )
            
            # Générer les stratégies de mitigation
            mitigation_strategies = self._generate_mitigation_strategies(
                detailed_risks, predicted_strategy, industry, detected_language
            )
            
            # Calcul du score global
            global_risk_score = self._calculate_global_risk_score(risk_analysis, predicted_risk_level)
            global_opportunity_score = self._calculate_global_opportunity_score(opportunity_analysis, predicted_opportunity_level)
            
            result = {
                'project_description': description[:100] + '...' if len(description) > 100 else description,
                'industry': industry,
                'complexity': complexity,
                'language': detected_language,
                
                # Risques
                'risk_analysis': {
                    'overall_level': predicted_risk_level,
                    'confidence': risk_confidence,
                    'global_score': global_risk_score,
                    'detailed_risks': detailed_risks,
                    'risk_categories': risk_analysis['risk_categories'],
                    'total_detected': len(detailed_risks)
                },
                
                # Opportunités
                'opportunity_analysis': {
                    'overall_level': predicted_opportunity_level,
                    'confidence': opportunity_confidence,
                    'global_score': global_opportunity_score,
                    'detailed_opportunities': detailed_opportunities,
                    'opportunity_categories': opportunity_analysis['opportunity_categories'],
                    'total_detected': len(detailed_opportunities)
                },
                
                # Stratégies
                'mitigation_strategies': mitigation_strategies,
                'recommended_strategy': predicted_strategy,
                
                # Analyse croisée
                'risk_opportunity_balance': self._analyze_balance(global_risk_score, global_opportunity_score, detected_language),
                'project_viability': self._assess_viability(global_risk_score, global_opportunity_score, predicted_risk_level, predicted_opportunity_level),
                
                # Méthode
                'method': 'ml_risk_opportunity_analysis',
                'timestamp': datetime.now().isoformat()
            }
            
            self.prediction_cache[cache_key] = result
            return result
            
        except Exception as e:
            print(f"Erreur lors de l'analyse : {e}")
            return {
                'error': str(e),
                'method': 'fallback'
            }
    
    # Méthodes helper pour la génération de contenu détaillé
    def _generate_detailed_risks(self, risk_analysis: Dict, risk_level: str, industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
        """Générer des risques détaillés avec recommandations"""
        detailed_risks = []
        
        # Risques détectés par l'analyse
        for category, risk_data in risk_analysis['detected_risks'].items():
            severity = risk_data['severity']
            keywords = risk_data['keywords']
            
            # Générer description et mitigation
            description = self._generate_risk_description(category, industry, keywords, language)
            mitigation = self._generate_risk_mitigation(category, severity, language)
            
            detailed_risks.append({
                'category': category,
                'severity': severity,
                'description': description,
                'keywords_detected': keywords,
                'mitigation_actions': mitigation,
                'probability': self._estimate_risk_probability(category, complexity, industry),
                'impact': self._estimate_risk_impact(category, severity, industry)
            })
        
        # Ajouter des risques génériques par industrie si peu détectés
        if len(detailed_risks) < 3:
            generic_risks = self._get_generic_industry_risks(industry, complexity, language)
            detailed_risks.extend(generic_risks[:3-len(detailed_risks)])
        
        return detailed_risks
    
    def _generate_detailed_opportunities(self, opportunity_analysis: Dict, opportunity_level: str, industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
        """Générer des opportunités détaillées avec stratégies"""
        detailed_opportunities = []
        
        # Opportunités détectées par l'analyse
        for category, opp_data in opportunity_analysis['detected_opportunities'].items():
            potential = opp_data['potential']
            keywords = opp_data['keywords']
            
            # Générer description et stratégie
            description = self._generate_opportunity_description(category, industry, keywords, language)
            strategy = self._generate_opportunity_strategy(category, potential, language)
            
            detailed_opportunities.append({
                'category': category,
                'potential': potential,
                'description': description,
                'keywords_detected': keywords,
                'exploitation_strategy': strategy,
                'feasibility': self._estimate_opportunity_feasibility(category, complexity, industry),
                'timeframe': self._estimate_opportunity_timeframe(category, potential, complexity)
            })
        
        # Ajouter des opportunités génériques par industrie si peu détectées
        if len(detailed_opportunities) < 3:
            generic_opportunities = self._get_generic_industry_opportunities(industry, complexity, language)
            detailed_opportunities.extend(generic_opportunities[:3-len(detailed_opportunities)])
        
        return detailed_opportunities
    
    # Toutes les autres méthodes helper...
    def _generate_mitigation_strategies(self, risks: List[Dict], strategy_type: str, industry: str, language: str) -> List[Dict[str, Any]]:
        """Générer des stratégies de mitigation complètes"""
        strategies = []
        
        # Stratégies spécifiques par risque
        for risk in risks:
            if risk['severity'] in ['CRITICAL', 'HIGH']:
                strategy = {
                    'risk_category': risk['category'],
                    'strategy_type': strategy_type,
                    'actions': risk['mitigation_actions'],
                    'priority': 'HIGH' if risk['severity'] == 'CRITICAL' else 'MEDIUM',
                    'timeline': '1-2 semaines' if language == 'french' else '1-2 weeks',
                    'resources_needed': self._estimate_mitigation_resources(risk['category'], risk['severity'], language)
                }
                strategies.append(strategy)
        
        # Stratégies générales par industrie
        general_strategy = self._get_general_industry_strategy(industry, strategy_type, language)
        if general_strategy:
            strategies.append(general_strategy)
        
        return strategies
    
    def _generate_risk_description(self, category: str, industry: str, keywords: List[str], language: str) -> str:
        """Générer une description de risque intelligent"""
        if language == 'french':
            templates = {
                'technique': f"Risques techniques identifiés dans {industry}: {', '.join(keywords)}. Impact potentiel sur la performance et la fiabilité.",
                'sécurité': f"Vulnérabilités sécuritaires détectées: {', '.join(keywords)}. Exposition aux cybermenaces et violations de données.",
                'réglementaire': f"Défis réglementaires pour {industry}: {', '.join(keywords)}. Conformité aux standards et réglementations.",
                'marché': f"Risques concurrentiels et de marché: {', '.join(keywords)}. Volatilité et pression concurrentielle.",
                'financier': f"Risques financiers identifiés: {', '.join(keywords)}. Impact sur la rentabilité et le financement."
            }
        else:
            templates = {
                'technical': f"Technical risks identified in {industry}: {', '.join(keywords)}. Potential impact on performance and reliability.",
                'security': f"Security vulnerabilities detected: {', '.join(keywords)}. Exposure to cyber threats and data breaches.",
                'regulatory': f"Regulatory challenges for {industry}: {', '.join(keywords)}. Compliance with standards and regulations.",
                'market': f"Market and competitive risks: {', '.join(keywords)}. Volatility and competitive pressure.",
                'financial': f"Financial risks identified: {', '.join(keywords)}. Impact on profitability and funding."
            }
        
        return templates.get(category, f"Risque {category} détecté avec mots-clés: {', '.join(keywords)}")
    
    def _generate_opportunity_description(self, category: str, industry: str, keywords: List[str], language: str) -> str:
        """Générer une description d'opportunité intelligente"""
    def _generate_opportunity_description(self, category: str, industry: str, keywords: List[str], language: str) -> str:
            """Générer une description d'opportunité intelligente"""
            if language == 'french':
                templates = {
                    'innovation': f"Opportunités d'innovation dans {industry}: {', '.join(keywords)}. Potentiel de différenciation technologique.",
                    'marché': f"Opportunités de marché identifiées: {', '.join(keywords)}. Nouveaux segments et géographies.",
                    'partenariat': f"Opportunités de partenariat: {', '.join(keywords)}. Écosystème et collaborations stratégiques.",
                    'monétisation': f"Nouvelles sources de revenus: {', '.join(keywords)}. Modèles économiques innovants.",
                    'technologie': f"Avantages technologiques: {', '.join(keywords)}. Innovation et leadership technique."
                }
            else:
                templates = {
                    'innovation': f"Innovation opportunities in {industry}: {', '.join(keywords)}. Technological differentiation potential.",
                    'market': f"Market opportunities identified: {', '.join(keywords)}. New segments and geographies.",
                    'partnership': f"Partnership opportunities: {', '.join(keywords)}. Ecosystem and strategic collaborations.",
                    'monetization': f"New revenue sources: {', '.join(keywords)}. Innovative business models.",
                    'technology': f"Technology advantages: {', '.join(keywords)}. Innovation and technical leadership."
                }
            
            return templates.get(category, f"Opportunité {category} détectée avec mots-clés: {', '.join(keywords)}")
        
    def _generate_risk_mitigation(self, category: str, severity: str, language: str) -> List[str]:
            """Générer des actions de mitigation spécifiques"""
            if language == 'french':
                mitigations = {
                    'technique': [
                        'Audit technique approfondi',
                        'Tests de performance et charge',
                        'Mise en place monitoring',
                        'Plan de sauvegarde et récupération'
                    ],
                    'sécurité': [
                        'Audit sécurité par expert',
                        'Implémentation standards sécurité',
                        'Formation équipe sécurité',
                        'Tests de pénétration réguliers'
                    ],
                    'réglementaire': [
                        'Consultation juridique spécialisée',
                        'Audit conformité',
                        'Documentation procédures',
                        'Formation équipe réglementation'
                    ],
                    'marché': [
                        'Étude marché approfondie',
                        'Veille concurrentielle',
                        'Stratégie différenciation',
                        'Plan marketing adaptatif'
                    ],
                    'financier': [
                        'Analyse financière détaillée',
                        'Diversification sources financement',
                        'Contrôle coûts strict',
                        'Plan contingence financier'
                    ]
                }
            else:
                mitigations = {
                    'technical': [
                        'Comprehensive technical audit',
                        'Performance and load testing',
                        'Monitoring implementation',
                        'Backup and recovery plan'
                    ],
                    'security': [
                        'Expert security audit',
                        'Security standards implementation',
                        'Security team training',
                        'Regular penetration testing'
                    ],
                    'regulatory': [
                        'Specialized legal consultation',
                        'Compliance audit',
                        'Procedures documentation',
                        'Regulatory team training'
                    ],
                    'market': [
                        'Comprehensive market study',
                        'Competitive intelligence',
                        'Differentiation strategy',
                        'Adaptive marketing plan'
                    ],
                    'financial': [
                        'Detailed financial analysis',
                        'Funding sources diversification',
                        'Strict cost control',
                        'Financial contingency plan'
                    ]
                }
            
            base_actions = mitigations.get(category, ['Analyse approfondie', 'Plan d\'action', 'Suivi régulier'])
            
            # Ajuster selon la gravité
            if severity == 'CRITICAL':
                if language == 'french':
                    base_actions.insert(0, 'Action immédiate requise')
                else:
                    base_actions.insert(0, 'Immediate action required')
            
            return base_actions[:4]  # Limiter à 4 actions
        
    def _generate_opportunity_strategy(self, category: str, potential: str, language: str) -> List[str]:
            """Générer des stratégies d'exploitation d'opportunités"""
            if language == 'french':
                strategies = {
                    'innovation': [
                        'Recherche et développement',
                        'Prototypage rapide',
                        'Partenariats technologiques',
                        'Veille innovation continue'
                    ],
                    'marché': [
                        'Analyse segmentation marché',
                        'Stratégie go-to-market',
                        'Tests marchés pilotes',
                        'Expansion géographique'
                    ],
                    'partenariat': [
                        'Identification partenaires clés',
                        'Négociation accords',
                        'Intégration écosystème',
                        'Co-création valeur'
                    ],
                    'monétisation': [
                        'Modèles économiques tests',
                        'Pricing stratégique',
                        'Canaux distribution',
                        'Optimisation revenus'
                    ],
                    'technologie': [
                        'Roadmap technologique',
                        'Investissement R&D',
                        'Acquisition talents',
                        'Propriété intellectuelle'
                    ]
                }
            else:
                strategies = {
                    'innovation': [
                        'Research and development',
                        'Rapid prototyping',
                        'Technology partnerships',
                        'Continuous innovation watch'
                    ],
                    'market': [
                        'Market segmentation analysis',
                        'Go-to-market strategy',
                        'Pilot market testing',
                        'Geographic expansion'
                    ],
                    'partnership': [
                        'Key partners identification',
                        'Agreement negotiation',
                        'Ecosystem integration',
                        'Value co-creation'
                    ],
                    'monetization': [
                        'Business model testing',
                        'Strategic pricing',
                        'Distribution channels',
                        'Revenue optimization'
                    ],
                    'technology': [
                        'Technology roadmap',
                        'R&D investment',
                        'Talent acquisition',
                        'Intellectual property'
                    ]
                }
            
            base_strategies = strategies.get(category, ['Analyse opportunité', 'Plan exploitation', 'Mise en œuvre'])
            
            # Ajuster selon le potentiel
            if potential == 'HIGH':
                if language == 'french':
                    base_strategies.insert(0, 'Priorisation maximale')
                else:
                    base_strategies.insert(0, 'Maximum prioritization')
            
            return base_strategies[:4]  # Limiter à 4 stratégies
        
        # Autres méthodes d'estimation...
    def _estimate_risk_probability(self, category: str, complexity: str, industry: str) -> str:
            """Estimer la probabilité d'un risque"""
            base_probabilities = {
                'technique': 0.6, 'technical': 0.6,
                'sécurité': 0.7, 'security': 0.7,
                'réglementaire': 0.4, 'regulatory': 0.4,
                'marché': 0.8, 'market': 0.8,
                'financier': 0.5, 'financial': 0.5
            }
            
            prob = base_probabilities.get(category, 0.5)
            
            if complexity in ['complexe', 'expert']:
                prob += 0.2
            if industry in ['Healthcare', 'Finance']:
                prob += 0.1
            
            prob = min(prob, 0.9)
            
            if prob >= 0.7:
                return 'Élevée'
            elif prob >= 0.4:
                return 'Moyenne'
            else:
                return 'Faible'
        
    def _estimate_risk_impact(self, category: str, severity: str, industry: str) -> str:
            """Estimer l'impact d'un risque"""
            if severity == 'CRITICAL':
                return 'Très élevé'
            elif severity == 'HIGH':
                return 'Élevé'
            elif severity == 'MEDIUM':
                return 'Modéré'
            else:
                return 'Faible'
        
    def _estimate_opportunity_feasibility(self, category: str, complexity: str, industry: str) -> str:
            """Estimer la faisabilité d'une opportunité"""
            base_feasibility = {
                'innovation': 0.6, 'marché': 0.7, 'market': 0.7,
                'partenariat': 0.8, 'partnership': 0.8,
                'monétisation': 0.7, 'monetization': 0.7,
                'technologie': 0.5, 'technology': 0.5
            }
            
            feasibility = base_feasibility.get(category, 0.6)
            
            if complexity == 'simple':
                feasibility += 0.2
            elif complexity == 'expert':
                feasibility -= 0.2
            
            feasibility = max(0.1, min(feasibility, 0.9))
            
            if feasibility >= 0.7:
                return 'Élevée'
            elif feasibility >= 0.4:
                return 'Moyenne'
            else:
                return 'Faible'
        
    def _estimate_opportunity_timeframe(self, category: str, potential: str, complexity: str) -> str:
            """Estimer le délai de réalisation d'une opportunité"""
            base_timeframes = {
                'innovation': 12, 'marché': 6, 'market': 6,
                'partenariat': 4, 'partnership': 4,
                'monétisation': 8, 'monetization': 8,
                'technologie': 18, 'technology': 18
            }
            
            months = base_timeframes.get(category, 6)
            
            if complexity == 'expert':
                months += 6
            elif complexity == 'simple':
                months -= 2
            
            if potential == 'HIGH':
                months -= 2
            elif potential == 'LOW':
                months += 3
            
            months = max(2, months)
            
            if months <= 6:
                return 'Court terme (< 6 mois)'
            elif months <= 12:
                return 'Moyen terme (6-12 mois)'
            else:
                return 'Long terme (> 12 mois)'
        
    def _estimate_mitigation_resources(self, category: str, severity: str, language: str) -> List[str]:
            """Estimer les ressources nécessaires pour la mitigation"""
            if language == 'french':
                resources = {
                    'technique': ['Expert technique senior', 'Outils monitoring', 'Infrastructure test'],
                    'sécurité': ['Expert cybersécurité', 'Outils sécurité', 'Formation équipe'],
                    'réglementaire': ['Consultant juridique', 'Documentation', 'Formation compliance'],
                    'marché': ['Analyste marché', 'Outils veille', 'Budget marketing'],
                    'financier': ['Analyste financier', 'Outils gestion', 'Réserves financières']
                }
            else:
                resources = {
                    'technical': ['Senior technical expert', 'Monitoring tools', 'Test infrastructure'],
                    'security': ['Cybersecurity expert', 'Security tools', 'Team training'],
                    'regulatory': ['Legal consultant', 'Documentation', 'Compliance training'],
                    'market': ['Market analyst', 'Intelligence tools', 'Marketing budget'],
                    'financial': ['Financial analyst', 'Management tools', 'Financial reserves']
                }
            
            base_resources = resources.get(category, ['Expert spécialisé', 'Outils', 'Budget'])
            
            if severity == 'CRITICAL':
                if language == 'french':
                    base_resources.append('Équipe dédiée')
                else:
                    base_resources.append('Dedicated team')
            
            return base_resources
        
    def _get_generic_industry_risks(self, industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
            """Obtenir des risques génériques par industrie"""
            if language == 'french':
                generic_risks = {
                    'Technology': [
                        {'category': 'technique', 'severity': 'MEDIUM', 'description': 'Obsolescence technologique rapide', 'mitigation_actions': ['Veille technologique', 'Architecture modulaire']},
                        {'category': 'marché', 'severity': 'HIGH', 'description': 'Concurrence intense et innovation rapide', 'mitigation_actions': ['Différenciation produit', 'Innovation continue']}
                    ],
                    'Healthcare': [
                        {'category': 'réglementaire', 'severity': 'CRITICAL', 'description': 'Conformité réglementaire stricte', 'mitigation_actions': ['Audit conformité', 'Expertise juridique']},
                        {'category': 'sécurité', 'severity': 'CRITICAL', 'description': 'Protection données patients sensibles', 'mitigation_actions': ['Chiffrement avancé', 'Audit sécurité']}
                    ],
                    'Finance': [
                        {'category': 'sécurité', 'severity': 'CRITICAL', 'description': 'Risques de fraude et cyberattaques', 'mitigation_actions': ['Sécurité multicouches', 'Monitoring 24/7']},
                        {'category': 'réglementaire', 'severity': 'CRITICAL', 'description': 'Réglementations financières complexes', 'mitigation_actions': ['Expertise réglementaire', 'Audit compliance']}
                    ]
                }
            else:
                generic_risks = {
                    'Technology': [
                        {'category': 'technical', 'severity': 'MEDIUM', 'description': 'Rapid technology obsolescence', 'mitigation_actions': ['Technology watch', 'Modular architecture']},
                        {'category': 'market', 'severity': 'HIGH', 'description': 'Intense competition and rapid innovation', 'mitigation_actions': ['Product differentiation', 'Continuous innovation']}
                    ],
                    'Healthcare': [
                        {'category': 'regulatory', 'severity': 'CRITICAL', 'description': 'Strict regulatory compliance', 'mitigation_actions': ['Compliance audit', 'Legal expertise']},
                        {'category': 'security', 'severity': 'CRITICAL', 'description': 'Sensitive patient data protection', 'mitigation_actions': ['Advanced encryption', 'Security audit']}
                    ],
                    'Finance': [
                        {'category': 'security', 'severity': 'CRITICAL', 'description': 'Fraud and cyberattack risks', 'mitigation_actions': ['Multi-layer security', '24/7 monitoring']},
                        {'category': 'regulatory', 'severity': 'CRITICAL', 'description': 'Complex financial regulations', 'mitigation_actions': ['Regulatory expertise', 'Compliance audit']}
                    ]
                }
            
            return generic_risks.get(industry, generic_risks['Technology'])
        
    def _get_generic_industry_opportunities(self, industry: str, complexity: str, language: str) -> List[Dict[str, Any]]:
            """Obtenir des opportunités génériques par industrie"""
            if language == 'french':
                generic_opportunities = {
                    'Technology': [
                        {'category': 'innovation', 'potential': 'HIGH', 'description': 'Innovation technologique continue', 'exploitation_strategy': ['R&D', 'Partenariats tech']},
                        {'category': 'marché', 'potential': 'HIGH', 'description': 'Marchés émergents et globalisation', 'exploitation_strategy': ['Expansion géographique', 'Nouveaux segments']}
                    ],
                    'Healthcare': [
                        {'category': 'digital', 'potential': 'HIGH', 'description': 'Transformation digitale santé', 'exploitation_strategy': ['Télémédecine', 'IA médicale']},
                        {'category': 'démographie', 'potential': 'HIGH', 'description': 'Vieillissement population', 'exploitation_strategy': ['Solutions seniors', 'Prévention']}
                    ],
                    'Finance': [
                        {'category': 'fintech', 'potential': 'HIGH', 'description': 'Innovation fintech', 'exploitation_strategy': ['Services digitaux', 'Néobanque']},
                        {'category': 'inclusion', 'potential': 'MEDIUM', 'description': 'Inclusion financière', 'exploitation_strategy': ['Micropaiement', 'Pays émergents']}
                    ]
                }
            else:
                generic_opportunities = {
                    'Technology': [
                        {'category': 'innovation', 'potential': 'HIGH', 'description': 'Continuous technological innovation', 'exploitation_strategy': ['R&D', 'Tech partnerships']},
                        {'category': 'market', 'potential': 'HIGH', 'description': 'Emerging markets and globalization', 'exploitation_strategy': ['Geographic expansion', 'New segments']}
                    ],
                    'Healthcare': [
                        {'category': 'digital', 'potential': 'HIGH', 'description': 'Healthcare digital transformation', 'exploitation_strategy': ['Telemedicine', 'Medical AI']},
                        {'category': 'demographics', 'potential': 'HIGH', 'description': 'Population aging', 'exploitation_strategy': ['Senior solutions', 'Prevention']}
                    ],
                    'Finance': [
                        {'category': 'fintech', 'potential': 'HIGH', 'description': 'Fintech innovation', 'exploitation_strategy': ['Digital services', 'Neobank']},
                        {'category': 'inclusion', 'potential': 'MEDIUM', 'description': 'Financial inclusion', 'exploitation_strategy': ['Micropayment', 'Emerging countries']}
                    ]
                }
            
            return generic_opportunities.get(industry, generic_opportunities['Technology'])
        
    def _get_general_industry_strategy(self, industry: str, strategy_type: str, language: str) -> Dict[str, Any]:
            """Obtenir une stratégie générale par industrie"""
            if language == 'french':
                strategies = {
                    'Healthcare': {
                        'strategy_type': 'Conformité et sécurité',
                        'actions': ['Audit conformité HIPAA', 'Sécurisation données', 'Formation équipe'],
                        'priority': 'HIGH',
                        'timeline': '2-4 semaines',
                        'resources_needed': ['Expert conformité', 'Audit sécurité', 'Formation']
                    },
                    'Finance': {
                        'strategy_type': 'Sécurité financière',
                        'actions': ['Conformité PCI-DSS', 'Détection fraude', 'Audit sécurité'],
                        'priority': 'HIGH',
                        'timeline': '3-6 semaines',
                        'resources_needed': ['Expert sécurité', 'Outils détection', 'Audit']
                    },
                    'Technology': {
                        'strategy_type': 'Innovation technique',
                        'actions': ['Veille technologique', 'Architecture robuste', 'Tests performance'],
                        'priority': 'MEDIUM',
                        'timeline': '2-3 semaines',
                        'resources_needed': ['Architecte', 'Outils test', 'Monitoring']
                    }
                }
            else:
                strategies = {
                    'Healthcare': {
                        'strategy_type': 'Compliance and security',
                        'actions': ['HIPAA compliance audit', 'Data security', 'Team training'],
                        'priority': 'HIGH',
                        'timeline': '2-4 weeks',
                        'resources_needed': ['Compliance expert', 'Security audit', 'Training']
                    },
                    'Finance': {
                        'strategy_type': 'Financial security',
                        'actions': ['PCI-DSS compliance', 'Fraud detection', 'Security audit'],
                        'priority': 'HIGH',
                        'timeline': '3-6 weeks',
                        'resources_needed': ['Security expert', 'Detection tools', 'Audit']
                    },
                    'Technology': {
                        'strategy_type': 'Technical innovation',
                        'actions': ['Technology watch', 'Robust architecture', 'Performance testing'],
                        'priority': 'MEDIUM',
                        'timeline': '2-3 weeks',
                        'resources_needed': ['Architect', 'Test tools', 'Monitoring']
                    }
                }
            
            return strategies.get(industry, strategies['Technology'])
        
    def _calculate_global_risk_score(self, risk_analysis: Dict, risk_level: str) -> float:
            """Calculer un score global de risque"""
            base_score = risk_analysis['total_risk_score']
            
            level_multipliers = {
                'LOW': 0.5, 'MEDIUM': 1.0, 'HIGH': 1.5, 'CRITICAL': 2.0
            }
            
            multiplier = level_multipliers.get(risk_level, 1.0)
            global_score = min(base_score * multiplier, 10.0)
            
            return round(global_score, 1)
        
    def _calculate_global_opportunity_score(self, opportunity_analysis: Dict, opportunity_level: str) -> float:
            """Calculer un score global d'opportunité"""
            base_score = opportunity_analysis['total_opportunity_score']
            
            level_multipliers = {
                'LOW': 0.5, 'MEDIUM': 1.0, 'HIGH': 1.5
            }
            
            multiplier = level_multipliers.get(opportunity_level, 1.0)
            global_score = min(base_score * multiplier, 10.0)
            
            return round(global_score, 1)
        
    def _analyze_balance(self, risk_score: float, opportunity_score: float, language: str) -> Dict[str, Any]:
            """Analyser l'équilibre risque/opportunité"""
            ratio = risk_score / opportunity_score if opportunity_score > 0 else risk_score
            
            if language == 'french':
                if ratio < 0.5:
                    assessment = "Très favorable - Opportunités dominent"
                    recommendation = "Procéder avec confiance"
                elif ratio < 1.0:
                    assessment = "Favorable - Plus d'opportunités que de risques"
                    recommendation = "Procéder avec planification"
                elif ratio < 1.5:
                    assessment = "Équilibré - Risques et opportunités comparables"
                    recommendation = "Évaluation approfondie requise"
                else:
                    assessment = "Défavorable - Risques dominent"
                    recommendation = "Mitigation extensive nécessaire"
            else:
                if ratio < 0.5:
                    assessment = "Very favorable - Opportunities dominate"
                    recommendation = "Proceed with confidence"
                elif ratio < 1.0:
                    assessment = "Favorable - More opportunities than risks"
                    recommendation = "Proceed with planning"
                elif ratio < 1.5:
                    assessment = "Balanced - Comparable risks and opportunities"
                    recommendation = "Thorough evaluation required"
                else:
                    assessment = "Unfavorable - Risks dominate"
                    recommendation = "Extensive mitigation needed"
            
            return {
                'risk_score': risk_score,
                'opportunity_score': opportunity_score,
                'ratio': round(ratio, 2),
                'assessment': assessment,
                'recommendation': recommendation
            }
        
    def _assess_viability(self, risk_score: float, opportunity_score: float, risk_level: str, opportunity_level: str) -> Dict[str, Any]:
            """Évaluer la viabilité globale du projet"""
            # Calcul du score de viabilité
            viability_score = (opportunity_score * 0.6) - (risk_score * 0.4)
            viability_score = max(0, min(viability_score, 10))
            
            # Ajustements selon les niveaux
            if risk_level == 'CRITICAL':
                viability_score -= 2
            elif risk_level == 'HIGH':
                viability_score -= 1
            
            if opportunity_level == 'HIGH':
                viability_score += 1.5
            elif opportunity_level == 'LOW':
                viability_score -= 1
            
            viability_score = max(0, min(viability_score, 10))
            
            # Classification
            if viability_score >= 7:
                viability_level = 'Élevée'
                recommendation = 'Projet très viable - Recommandé'
            elif viability_score >= 5:
                viability_level = 'Moyenne'
                recommendation = 'Projet viable avec précautions'
            elif viability_score >= 3:
                viability_level = 'Faible'
                recommendation = 'Projet risqué - Mitigation requise'
            else:
                viability_level = 'Très faible'
                recommendation = 'Projet non recommandé'
            
            return {
                'score': round(viability_score, 1),
                'level': viability_level,
                'recommendation': recommendation,
                'confidence': min(0.9, viability_score / 10)
            }


    # Application Flask
app = Flask(__name__)
CORS(app)

    # Instance globale du prédicteur
risk_opportunity_predictor = MLRiskOpportunityAnalyzer()

def authenticate(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            expected_token = 'RiskOpportunityAnalyzer2024!'
            
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
            'service': 'Risk & Opportunity Analyzer - ML',
            'version': '1.0.0',
            'supported_languages': ['français', 'english'],
            'supported_industries': [
                'Technology', 'Healthcare', 'Finance', 'Education',
                'Retail', 'Media', 'Logistics', 'Energy'
            ],
            'supported_complexities': ['simple', 'moyen', 'complexe', 'expert'],
            'risk_levels': ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            'opportunity_levels': ['LOW', 'MEDIUM', 'HIGH'],
            'features': [
                'ML risk level prediction',
                'ML opportunity level prediction',
                'Detailed risk analysis',
                'Detailed opportunity analysis',
                'Mitigation strategies generation',
                'Project viability assessment',
                'Risk/opportunity balance analysis',
                'Multilingual support'
            ],
            'model_trained': risk_opportunity_predictor.is_trained,
            'timestamp': datetime.now().isoformat()
        })

@app.route('/api/analyze-risks-opportunities', methods=['POST'])
@authenticate
def analyze_risks_opportunities():
        """Analyser les risques et opportunités d'un projet"""
        try:
            data = request.get_json()
            
            if not data or 'description' not in data:
                return jsonify({'error': 'Description de projet requise'}), 400
            
            description = data['description']
            industry = data.get('industry', 'Technology')
            complexity = data.get('complexity', 'moyen')
            
            # Validation
            if not description or len(description.strip()) < 10:
                return jsonify({'error': 'Description trop courte (minimum 10 caractères)'}), 400
            
            if industry not in ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Media', 'Logistics', 'Energy']:
                return jsonify({'error': 'Industrie non supportée'}), 400
            
            if complexity not in ['simple', 'moyen', 'complexe', 'expert']:
                return jsonify({'error': 'Complexité doit être: simple, moyen, complexe, ou expert'}), 400
            
            # Analyse complète
            analysis = risk_opportunity_predictor.analyze_project_risks_opportunities(
                description, industry, complexity
            )
            
            if 'error' in analysis:
                return jsonify(analysis), 400
            
            return jsonify({
                'success': True,
                'analysis': analysis,
                'input_parameters': {
                    'description': description[:100] + '...' if len(description) > 100 else description,
                    'industry': industry,
                    'complexity': complexity
                },
                'analysis_method': 'ml_risk_opportunity_multilingual',
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500


# Tous les autres endpoints Flask...
@app.route('/api/analyze-risks-only', methods=['POST'])
@authenticate  
def analyze_risks_only():
        """Analyser seulement les risques d'un projet"""
        try:
            data = request.get_json()
            
            if not data or 'description' not in data:
                return jsonify({'error': 'Description de projet requise'}), 400
            
            description = data['description']
            industry = data.get('industry', 'Technology')
            complexity = data.get('complexity', 'moyen')
            
            # Analyse des risques uniquement
            risk_analysis = risk_opportunity_predictor.analyzer.analyze_project_risks(
                description, industry, complexity
            )
            
            return jsonify({
                'success': True,
                'risk_analysis': risk_analysis,
                'input_parameters': {
                    'description': description[:100] + '...' if len(description) > 100 else description,
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

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
        """Informations détaillées sur les modèles ML"""
        return jsonify({
            'success': True,
            'model_info': {
                'is_trained': risk_opportunity_predictor.is_trained,
                'models': {
                    'risk_level_classifier': 'VotingClassifier (RF + SVM + NB)',
                    'opportunity_level_classifier': 'VotingClassifier (RF + SVM + NB)',
                    'mitigation_strategy_predictor': 'RandomForestClassifier'
                },
                'training_data': {
                    'total_samples': 'Multilingual dataset with industry-specific examples',
                    'risk_levels': ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    'opportunity_levels': ['LOW', 'MEDIUM', 'HIGH'],
                    'languages': ['french', 'english'],
                    'industries': [
                        'Technology', 'Healthcare', 'Finance', 'Education',
                        'Retail', 'Media', 'Logistics', 'Energy'
                    ]
                },
                'analysis_features': [
                    'Pattern-based risk detection',
                    'Pattern-based opportunity detection',
                    'ML-based level prediction',
                    'Intelligent mitigation strategies',
                    'Project viability assessment',
                    'Risk/opportunity balance analysis'
                ],
                'supported_patterns': {
                    'risk_categories_per_industry': 5,
                    'opportunity_categories_per_industry': 5,
                    'total_risk_patterns': len(risk_opportunity_predictor.analyzer.risk_patterns) * 5,
                    'total_opportunity_patterns': len(risk_opportunity_predictor.analyzer.opportunity_patterns) * 5
                }
            },
            'timestamp': datetime.now().isoformat()
        })

@app.route('/api/train-models', methods=['POST'])
@authenticate
def train_models():
        """Réentraîner les modèles ML"""
        try:
            # Réinitialiser
            risk_opportunity_predictor.is_trained = False
            risk_opportunity_predictor.prediction_cache.clear()
            
            # Réentraîner
            risk_opportunity_predictor.train_models()
            
            return jsonify({
                'success': True,
                'message': 'Modèles ML réentraînés avec succès',
                'model_trained': risk_opportunity_predictor.is_trained,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

@app.route('/api/analyze-opportunities-only', methods=['POST'])
@authenticate
def analyze_opportunities_only():
        """Analyser seulement les opportunités d'un projet"""
        try:
            data = request.get_json()
            
            if not data or 'description' not in data:
                return jsonify({'error': 'Description de projet requise'}), 400
            
            description = data['description']
            industry = data.get('industry', 'Technology')
            complexity = data.get('complexity', 'moyen')
            
            # Analyse des opportunités uniquement
            opportunity_analysis = risk_opportunity_predictor.analyzer.analyze_project_opportunities(
                description, industry, complexity
            )
            
            return jsonify({
                'success': True,
                'opportunity_analysis': opportunity_analysis,
                'input_parameters': {
                    'description': description[:100] + '...' if len(description) > 100 else description,
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

@app.route('/api/generate-mitigation-strategies', methods=['POST'])
@authenticate
def generate_mitigation_strategies():
        """Générer des stratégies de mitigation pour des risques spécifiques"""
        try:
            data = request.get_json()
            
            if not data or 'risks' not in data or not isinstance(data['risks'], list):
                return jsonify({'error': 'Liste de risques requise'}), 400
            
            risks = data['risks']
            industry = data.get('industry', 'Technology')
            language = data.get('language', 'french')
            
            if len(risks) > 10:
                return jsonify({'error': 'Maximum 10 risques par requête'}), 400
            
            # Générer des stratégies pour chaque risque
            mitigation_strategies = []
            for risk in risks:
                if not isinstance(risk, dict) or 'category' not in risk:
                    continue
                
                category = risk['category']
                severity = risk.get('severity', 'MEDIUM')
                
                strategy = {
                    'risk_category': category,
                    'severity': severity,
                    'mitigation_actions': risk_opportunity_predictor._generate_risk_mitigation(category, severity, language),
                    'resources_needed': risk_opportunity_predictor._estimate_mitigation_resources(category, severity, language),
                    'priority': 'HIGH' if severity in ['CRITICAL', 'HIGH'] else 'MEDIUM',
                    'timeline': '1-2 semaines' if language == 'french' else '1-2 weeks'
                }
                mitigation_strategies.append(strategy)
            
            return jsonify({
                'success': True,
                'mitigation_strategies': mitigation_strategies,
                'total_strategies': len(mitigation_strategies),
                'industry': industry,
                'language': language,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

@app.route('/api/assess-project-viability', methods=['POST'])
@authenticate
def assess_project_viability():
        """Évaluer la viabilité globale d'un projet"""
        try:
            data = request.get_json()
            
            if not data or 'description' not in data:
                return jsonify({'error': 'Description de projet requise'}), 400
            
            description = data['description']
            industry = data.get('industry', 'Technology')
            complexity = data.get('complexity', 'moyen')
            
            # Analyse complète pour évaluation
            analysis = risk_opportunity_predictor.analyze_project_risks_opportunities(
                description, industry, complexity
            )
            
            if 'error' in analysis:
                return jsonify(analysis), 400
            
            # Extraire les données de viabilité
            viability_data = {
                'risk_analysis': analysis['risk_analysis'],
                'opportunity_analysis': analysis['opportunity_analysis'],
                'balance': analysis['risk_opportunity_balance'],
                'viability': analysis['project_viability']
            }
            
            return jsonify({
                'success': True,
                'viability_assessment': viability_data,
                'summary': {
                    'overall_score': analysis['project_viability']['score'],
                    'recommendation': analysis['project_viability']['recommendation'],
                    'key_risks': len(analysis['risk_analysis']['detailed_risks']),
                    'key_opportunities': len(analysis['opportunity_analysis']['detailed_opportunities'])
                },
                'input_parameters': {
                    'description': description[:100] + '...' if len(description) > 100 else description,
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

@app.route('/api/batch-analyze', methods=['POST'])
@authenticate
def batch_analyze():
        """Analyser les risques et opportunités en batch pour plusieurs projets"""
        try:
            data = request.get_json()
            
            if not data or 'projects' not in data or not isinstance(data['projects'], list):
                return jsonify({'error': 'Liste de projets requise'}), 400
            
            projects = data['projects']
            
            if len(projects) > 5:
                return jsonify({'error': 'Maximum 5 projets par batch'}), 400
            
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
                
                if len(description.strip()) < 10:
                    results.append({
                        'index': i,
                        'error': 'Description trop courte'
                    })
                    continue
                
                try:
                    analysis = risk_opportunity_predictor.analyze_project_risks_opportunities(
                        description, industry, complexity
                    )
                    
                    results.append({
                        'index': i,
                        'description': description[:50] + '...' if len(description) > 50 else description,
                        'analysis': analysis,
                        'summary': {
                            'risk_level': analysis['risk_analysis']['overall_level'],
                            'opportunity_level': analysis['opportunity_analysis']['overall_level'],
                            'viability_score': analysis['project_viability']['score']
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
                'successful_analyses': len([r for r in results if 'analysis' in r]),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

@app.route('/api/compare-projects', methods=['POST'])
@authenticate
def compare_projects():
        """Comparer les risques et opportunités de plusieurs projets"""
        try:
            data = request.get_json()
            
            if not data or 'projects' not in data or not isinstance(data['projects'], list):
                return jsonify({'error': 'Liste de projets requise pour comparaison'}), 400
            
            projects = data['projects']
            
            if len(projects) < 2 or len(projects) > 4:
                return jsonify({'error': 'Entre 2 et 4 projets requis pour comparaison'}), 400
            
            comparisons = []
            for i, project in enumerate(projects):
                if not isinstance(project, dict) or 'description' not in project:
                    continue
                
                description = project['description']
                industry = project.get('industry', 'Technology')
                complexity = project.get('complexity', 'moyen')
                
                analysis = risk_opportunity_predictor.analyze_project_risks_opportunities(
                    description, industry, complexity
                )
                
                comparisons.append({
                    'project_index': i,
                    'project_name': project.get('name', f'Projet {i+1}'),
                    'description': description[:100] + '...' if len(description) > 100 else description,
                    'risk_score': analysis['risk_analysis']['global_score'],
                    'opportunity_score': analysis['opportunity_analysis']['global_score'],
                    'viability_score': analysis['project_viability']['score'],
                    'risk_level': analysis['risk_analysis']['overall_level'],
                    'opportunity_level': analysis['opportunity_analysis']['overall_level'],
                    'recommendation': analysis['project_viability']['recommendation']
                })
            
            # Classement par viabilité
            comparisons.sort(key=lambda x: x['viability_score'], reverse=True)
            
            # Analyse comparative
            comparison_analysis = {
                'best_project': comparisons[0]['project_name'],
                'highest_opportunity': max(comparisons, key=lambda x: x['opportunity_score'])['project_name'],
                'lowest_risk': min(comparisons, key=lambda x: x['risk_score'])['project_name'],
                'recommended_order': [p['project_name'] for p in comparisons]
            }
            
            return jsonify({
                'success': True,
                'comparison_results': comparisons,
                'comparative_analysis': comparison_analysis,
                'total_compared': len(comparisons),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500

@app.route('/api/get-industry-patterns', methods=['GET'])
def get_industry_patterns():
        """Récupérer les patterns de risques et opportunités par industrie"""
        try:
            industry = request.args.get('industry', 'Technology')
            language = request.args.get('language', 'french')
            
            if industry not in risk_opportunity_predictor.analyzer.risk_patterns:
                return jsonify({'error': 'Industrie non supportée'}), 400
            
            risk_patterns = risk_opportunity_predictor.analyzer.risk_patterns[industry][language]
            opportunity_patterns = risk_opportunity_predictor.analyzer.opportunity_patterns[industry][language]
            
            return jsonify({
                'success': True,
                'industry': industry,
                'language': language,
                'risk_patterns': risk_patterns,
                'opportunity_patterns': opportunity_patterns,
                'risk_categories': list(risk_patterns.keys()),
                'opportunity_categories': list(opportunity_patterns.keys()),
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
            
            detected_language = risk_opportunity_predictor.analyzer.detect_language(text)
            
            return jsonify({
                'success': True,
                'detected_language': detected_language,
                'supported_languages': risk_opportunity_predictor.analyzer.supported_languages,
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
                'POST /api/analyze-risks-opportunities',
                'POST /api/analyze-risks-only',
                'POST /api/analyze-opportunities-only',
                'POST /api/generate-mitigation-strategies',
                'POST /api/assess-project-viability',
                'POST /api/batch-analyze',
                'POST /api/compare-projects',
                'GET /api/get-industry-patterns',
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
        
        port = int(os.environ.get('PORT', 3006))
        
        print("=" * 90)
        print("RISK & OPPORTUNITY ANALYZER - MODULE ISOLÉ ML")
        print("=" * 90)
        print(f"Service démarré sur le port {port}")
        print(" Analyse intelligente des risques et opportunités")
        print(" Support multilingue (français/anglais)")
        print(" 8 industries avec patterns spécifiques")
        print(" 4 niveaux de complexité")
        print(" 4 niveaux de risque (LOW/MEDIUM/HIGH/CRITICAL)")
        print(" 3 niveaux d'opportunité (LOW/MEDIUM/HIGH)")
        print("=" * 90)
        print("FONCTIONNALITÉS PRINCIPALES :")
        print("   Analyse ML des risques et opportunités")
        print("   Détection de patterns par industrie")
        print("   Évaluation de viabilité de projet")
        print("    Stratégies de mitigation intelligentes")
        print("    Analyse d'équilibre risque/opportunité")
        print("   Scoring global et recommandations")
        print("   Comparaison de projets multiples")
        print("   Analyse en batch")
        print("=" * 90)
        print("INDUSTRIES SUPPORTÉES :")
        print("   Healthcare - Conformité HIPAA, sécurité patients")
        print("   Finance - PCI-DSS, détection fraude, réglementation")
        print("   Technology - Innovation, concurrence, obsolescence")
        print("   Education - Pédagogie, adoption, équité numérique")
        print("   Retail - Concurrence, logistique, expérience client")
        print("   Media - Droits d'auteur, monétisation, engagement")
        print("   Logistics - Optimisation, partenaires, durabilité")
        print("   Energy - Réglementation, innovation, sécurité")
        print("=" * 90)
        print("ENDPOINTS DISPONIBLES :")
        print(f"  - Health check              : http://localhost:{port}/health")
        print(f"  - Analyze full              : POST http://localhost:{port}/api/analyze-risks-opportunities")
        print(f"  - Analyze risks only        : POST http://localhost:{port}/api/analyze-risks-only")
        print(f"  - Analyze opportunities     : POST http://localhost:{port}/api/analyze-opportunities-only")
        print(f"  - Generate strategies       : POST http://localhost:{port}/api/generate-mitigation-strategies")
        print(f"  - Assess viability          : POST http://localhost:{port}/api/assess-project-viability")
        print(f"  - Batch analyze             : POST http://localhost:{port}/api/batch-analyze")
        print(f"  - Compare projects          : POST http://localhost:{port}/api/compare-projects")
        print(f"  - Industry patterns         : GET http://localhost:{port}/api/get-industry-patterns")
        print(f"  - Model info               : GET http://localhost:{port}/api/model-info")
        print(f"  - Train models             : POST http://localhost:{port}/api/train-models")
        print(f"  - Detect language          : POST http://localhost:{port}/api/detect-language")
        print("=" * 90)
        print("Token d'authentification : 'RiskOpportunityAnalyzer2024!'")
        print("Utilisation :")
        print("   Header: Authorization: Bearer RiskOpportunityAnalyzer2024!")
        print("   Body: {")
        print("     \"description\": \"Plateforme bancaire mobile avec IA\",")
        print("     \"industry\": \"Finance\",")
        print("     \"complexity\": \"expert\"")
        print("   }")
        print("=" * 90)
        print("EXEMPLE DE RÉPONSE :")
        print("  ✓ Niveau de risque: HIGH (Confiance: 0.89)")
        print("  ✓ Niveau d'opportunité: HIGH (Confiance: 0.91)")
        print("  ✓ Score viabilité: 7.2/10 (Projet viable)")
        print("  ✓ Risques détectés: sécurité, réglementaire, technique")
        print("  ✓ Opportunités: fintech, innovation, inclusion")
        print("  ✓ Stratégies mitigation: audit sécurité, conformité PCI-DSS")
        print("  ✓ Recommandation: Procéder avec planification extensive")
        print("=" * 90)
        print("MODÈLES ML :")
        print("   Risques: VotingClassifier (RF+SVM+NB)")
        print("   Opportunités: VotingClassifier (RF+SVM+NB)")
        print("    Stratégies: RandomForestClassifier")
        print("   Features: 25+ indicateurs par analyse")
        print("=" * 90)
        print("Service Risk & Opportunity Analyzer prêt!")
        print("Analyse intelligente des risques et opportunités avec ML 🚀")
        
        app.run(host='0.0.0.0', port=port, debug=False)# risk_opportunity_analyzer.py - Module isolé pour analyse ML des risques et opportunités
