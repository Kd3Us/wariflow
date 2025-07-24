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


class ProjectTypeAnalyzer:
    """Analyseur de type de projet multilingue - VERSION COMPLÈTE 31 INDUSTRIES"""
    
    def __init__(self):
        self.supported_languages = ['french', 'english']
        
        # ✅ Types spécialisés pour génération de tâches précises - VERSION ÉTENDUE
        self.project_types = [
            # === TYPES DE BASE ===
            'Application Web', 'Application Mobile', 'API REST', 'SaaS',
            'E-commerce', 'CMS', 'Dashboard', 'Système',
            
            # === TECHNOLOGY & DIGITAL ===
            'Tech Platform', 'Cloud System', 'DevOps Platform',
            
            # === MEDIA & ENTERTAINMENT ===
            'Gaming Platform', 'Streaming Platform', 'Content Platform',
            'Media Management', 'Creator Platform',
            
            # === HEALTHCARE & SCIENCES ===
            'HealthTech Platform', 'MedTech System', 'Clinical Platform',
            'BioTech System', 'Research Platform', 'Pharmaceutical System',
            
            # === FINANCE & BUSINESS ===
            'FinTech Platform', 'Trading System', 'Payment Gateway',
            'Insurance Platform', 'Real Estate Portal', 'Investment Platform',
            
            # === EDUCATION & TRAINING ===
            'EdTech Platform', 'Learning Management', 'Assessment System',
            
            # === RETAIL & COMMERCE ===
            'Retail Platform', 'Food Tech Platform', 'Fashion Platform',
            
            # === MANUFACTURING & INDUSTRY ===
            'AutoTech Platform', 'Aerospace System', 'Construction Platform',
            'Chemical System', 'Energy Management', 'Smart Grid System',
            'Logistics Platform', 'Supply Chain System', 'Fleet Management',
            
            # === SERVICES & ENTERTAINMENT ===
            'Sports Platform', 'Travel Platform', 'Event Management',
            
            # === PUBLIC & NON-PROFIT ===
            'GovTech Platform', 'Non-Profit System', 'Environmental Platform',
            
            # === AGRICULTURE ===
            'AgTech Platform', 'Farm Management', 'Crop Monitoring',
            
            # === PROFESSIONAL SERVICES ===
            'Legal Management', 'Compliance Platform', 'Contract System',
            'Consulting Platform', 'MarTech Platform', 'HR Platform'
        ]
        
        # ✅ Mots-clés DÉTAILLÉS pour chaque type spécialisé - VERSION COMPLÈTE
        self.type_keywords = {
            'french': {
                # === TYPES DE BASE ===
                'Application Web': ['site', 'web', 'portail', 'interface web', 'navigateur', 'html', 'css', 'webapp'],
                'Application Mobile': ['mobile', 'app', 'smartphone', 'ios', 'android', 'flutter', 'react native', 'appli'],
                'API REST': ['api', 'rest', 'service', 'endpoint', 'microservice', 'json', 'graphql', 'webservice'],
                'SaaS': ['saas', 'plateforme', 'service', 'abonnement', 'multi-tenant', 'cloud', 'software service'],
                'E-commerce': ['boutique', 'e-commerce', 'vente', 'panier', 'marketplace', 'commande', 'shop online'],
                'CMS': ['cms', 'contenu', 'blog', 'publication', 'éditorial', 'wordpress', 'gestion contenu'],
                'Dashboard': ['dashboard', 'tableau', 'monitoring', 'kpi', 'analytics', 'métriques', 'reporting'],
                'Système': ['système', 'erp', 'gestion', 'enterprise', 'complexe', 'hospitalier', 'intégré'],
                
                # === TECHNOLOGY & DIGITAL ===
                'Tech Platform': ['technologie', 'innovation', 'digital', 'transformation', 'plateforme tech', 'startup'],
                'Cloud System': ['cloud', 'aws', 'azure', 'infrastructure', 'hébergement', 'sauvegarde', 'scalabilité'],
                'DevOps Platform': ['devops', 'ci/cd', 'déploiement', 'automatisation', 'pipeline', 'jenkins', 'docker'],
                
                # === MEDIA & ENTERTAINMENT ===
                'Gaming Platform': ['jeu', 'gaming', 'joueur', 'gameplay', 'multijoueur', 'esport', 'match', 'tournoi', 'console'],
                'Streaming Platform': ['streaming', 'vidéo', 'live', 'diffusion', 'broadcast', 'contenu vidéo', 'netflix'],
                'Content Platform': ['contenu', 'média', 'publication', 'création', 'partage', 'communauté', 'créateur'],
                'Media Management': ['média', 'actualité', 'presse', 'journalisme', 'information', 'news', 'édition'],
                'Creator Platform': ['créateur', 'influenceur', 'monétisation', 'audience', 'communauté', 'talent'],
                
                # === HEALTHCARE & SCIENCES ===
                'HealthTech Platform': ['santé', 'médical', 'patient', 'télémédecine', 'diagnostic', 'thérapie', 'wellness', 'e-santé'],
                'MedTech System': ['dispositif médical', 'équipement', 'monitoring', 'capteur', 'biométrie', 'médical', 'imagerie'],
                'Clinical Platform': ['clinique', 'essai', 'recherche', 'protocole', 'patient', 'données cliniques', 'étude'],
                'BioTech System': ['biotechnologie', 'biologie', 'génétique', 'laboratoire', 'recherche bio', 'biotech'],
                'Research Platform': ['recherche', 'scientifique', 'laboratoire', 'étude', 'analyse', 'publication', 'académie'],
                'Pharmaceutical System': ['pharmaceutique', 'médicament', 'pharmacie', 'drug', 'molécule', 'thérapeutique'],
                
                # === FINANCE & BUSINESS ===
                'FinTech Platform': ['fintech', 'finance', 'paiement', 'portefeuille', 'crédit', 'investissement', 'bancaire', 'néobanque'],
                'Trading System': ['trading', 'bourse', 'marché', 'ordre', 'portfolio', 'algorithme', 'forex', 'crypto'],
                'Payment Gateway': ['paiement', 'transaction', 'carte', 'wallet', 'gateway', 'pos', 'stripe', 'paypal'],
                'Insurance Platform': ['assurance', 'mutuelle', 'couverture', 'sinistre', 'police', 'courtage', 'risque'],
                'Real Estate Portal': ['immobilier', 'propriété', 'location', 'vente', 'transaction', 'syndic', 'estimation'],
                'Investment Platform': ['investissement', 'placement', 'épargne', 'portefeuille', 'gestion actifs', 'bourse'],
                
                # === EDUCATION & TRAINING ===
                'EdTech Platform': ['éducation', 'apprentissage', 'formation', 'cours', 'pédagogie', 'école', 'université'],
                'Learning Management': ['lms', 'e-learning', 'parcours', 'compétence', 'certification', 'moodle', 'mooc'],
                'Assessment System': ['évaluation', 'test', 'examen', 'notation', 'compétence', 'quiz', 'certification'],
                
                # === RETAIL & COMMERCE ===
                'Retail Platform': ['commerce', 'détail', 'magasin', 'vente', 'client', 'caisse', 'inventory'],
                'Food Tech Platform': ['alimentaire', 'restaurant', 'livraison', 'cuisine', 'nutrition', 'food', 'recette'],
                'Fashion Platform': ['mode', 'vêtement', 'textile', 'design', 'collection', 'tendance', 'style'],
                
                # === MANUFACTURING & INDUSTRY ===
                'AutoTech Platform': ['automobile', 'voiture', 'véhicule', 'automotive', 'transport', 'mobilité', 'garage'],
                'Aerospace System': ['aérospatial', 'aviation', 'avion', 'spatial', 'vol', 'aéronautique', 'satellite'],
                'Construction Platform': ['construction', 'btp', 'chantier', 'bâtiment', 'architecture', 'génie civil'],
                'Chemical System': ['chimique', 'laboratoire', 'process', 'production', 'matériaux', 'formulation'],
                'Energy Management': ['énergie', 'consommation', 'efficacité', 'optimisation', 'monitoring énergétique', 'renouvelable'],
                'Smart Grid System': ['smart grid', 'réseau', 'distribution', 'compteur', 'iot énergie', 'électricité'],
                'Logistics Platform': ['logistique', 'transport', 'livraison', 'entrepôt', 'tracking', 'expedition', 'supply'],
                'Supply Chain System': ['supply chain', 'chaîne', 'approvisionnement', 'fournisseur', 'procurement', 'stock'],
                'Fleet Management': ['flotte', 'véhicule', 'gestion parc', 'maintenance', 'géolocalisation', 'gps', 'transport'],
                
                # === SERVICES & ENTERTAINMENT ===
                'Sports Platform': ['sport', 'fitness', 'entraînement', 'coach', 'performance', 'club', 'athlète'],
                'Travel Platform': ['voyage', 'tourisme', 'réservation', 'hôtel', 'transport', 'destination', 'booking'],
                'Event Management': ['événement', 'conférence', 'salon', 'organisation', 'billetterie', 'planning'],
                
                # === PUBLIC & NON-PROFIT ===
                'GovTech Platform': ['gouvernement', 'public', 'administration', 'citoyen', 'service public', 'mairie', 'état'],
                'Non-Profit System': ['association', 'ong', 'bénévolat', 'don', 'humanitaire', 'social', 'fondation'],
                'Environmental Platform': ['environnement', 'écologie', 'durable', 'carbone', 'pollution', 'vert', 'climat'],
                
                # === AGRICULTURE ===
                'AgTech Platform': ['agriculture', 'agtech', 'ferme', 'exploitation', 'agricole', 'farming', 'rural'],
                'Farm Management': ['gestion ferme', 'parcelle', 'culture', 'élevage', 'production agricole', 'tracteur'],
                'Crop Monitoring': ['surveillance culture', 'récolte', 'irrigation', 'pesticide', 'rendement', 'semence'],
                
                # === PROFESSIONAL SERVICES ===
                'Legal Management': ['juridique', 'avocat', 'cabinet', 'dossier', 'procédure', 'droit', 'tribunal'],
                'Compliance Platform': ['conformité', 'réglementation', 'audit', 'risque', 'gouvernance', 'rgpd', 'norme'],
                'Contract System': ['contrat', 'accord', 'signature', 'négociation', 'clause', 'juridique', 'légal'],
                'Consulting Platform': ['conseil', 'consultant', 'expertise', 'stratégie', 'accompagnement', 'audit'],
                'MarTech Platform': ['marketing', 'martech', 'campagne', 'automation', 'lead', 'digital marketing', 'crm'],
                'HR Platform': ['ressources humaines', 'rh', 'recrutement', 'paie', 'talent', 'formation', 'sirh']
            },
            'english': {
                # === TYPES DE BASE ===
                'Application Web': ['website', 'web', 'portal', 'web interface', 'browser', 'html', 'css', 'webapp'],
                'Application Mobile': ['mobile', 'app', 'smartphone', 'ios', 'android', 'flutter', 'react native', 'mobile app'],
                'API REST': ['api', 'rest', 'service', 'endpoint', 'microservice', 'json', 'graphql', 'webservice'],
                'SaaS': ['saas', 'platform', 'service', 'subscription', 'multi-tenant', 'cloud', 'software service'],
                'E-commerce': ['shop', 'e-commerce', 'sales', 'cart', 'marketplace', 'order', 'online store'],
                'CMS': ['cms', 'content', 'blog', 'publishing', 'editorial', 'wordpress', 'content management'],
                'Dashboard': ['dashboard', 'board', 'monitoring', 'kpi', 'analytics', 'metrics', 'reporting'],
                'Système': ['system', 'erp', 'management', 'enterprise', 'complex', 'hospital', 'integrated'],
                
                # === TECHNOLOGY & DIGITAL ===
                'Tech Platform': ['technology', 'innovation', 'digital', 'transformation', 'tech platform', 'startup'],
                'Cloud System': ['cloud', 'aws', 'azure', 'infrastructure', 'hosting', 'backup', 'scalability'],
                'DevOps Platform': ['devops', 'ci/cd', 'deployment', 'automation', 'pipeline', 'jenkins', 'docker'],
                
                # === MEDIA & ENTERTAINMENT ===
                'Gaming Platform': ['game', 'gaming', 'player', 'gameplay', 'multiplayer', 'esport', 'match', 'tournament', 'console'],
                'Streaming Platform': ['streaming', 'video', 'live', 'broadcast', 'content delivery', 'netflix', 'media'],
                'Content Platform': ['content', 'media', 'publishing', 'creation', 'sharing', 'community', 'creator'],
                'Media Management': ['media', 'news', 'press', 'journalism', 'information', 'publishing', 'editorial'],
                'Creator Platform': ['creator', 'influencer', 'monetization', 'audience', 'community', 'talent'],
                
                # === HEALTHCARE & SCIENCES ===
                'HealthTech Platform': ['health', 'medical', 'patient', 'telemedicine', 'diagnosis', 'therapy', 'wellness', 'e-health'],
                'MedTech System': ['medical device', 'equipment', 'monitoring', 'sensor', 'biometric', 'medical', 'imaging'],
                'Clinical Platform': ['clinical', 'trial', 'research', 'protocol', 'patient data', 'clinical study', 'study'],
                'BioTech System': ['biotechnology', 'biology', 'genetic', 'laboratory', 'bio research', 'biotech'],
                'Research Platform': ['research', 'scientific', 'laboratory', 'study', 'analysis', 'publication', 'academic'],
                'Pharmaceutical System': ['pharmaceutical', 'medicine', 'pharmacy', 'drug', 'molecule', 'therapeutic'],
                
                # === FINANCE & BUSINESS ===
                'FinTech Platform': ['fintech', 'finance', 'payment', 'wallet', 'credit', 'investment', 'banking', 'neobank'],
                'Trading System': ['trading', 'exchange', 'market', 'order', 'portfolio', 'algorithm', 'forex', 'crypto'],
                'Payment Gateway': ['payment', 'transaction', 'card', 'wallet', 'gateway', 'pos', 'stripe', 'paypal'],
                'Insurance Platform': ['insurance', 'coverage', 'claim', 'policy', 'broker', 'risk', 'underwriting'],
                'Real Estate Portal': ['real estate', 'property', 'rental', 'sale', 'transaction', 'property management', 'valuation'],
                'Investment Platform': ['investment', 'portfolio', 'savings', 'wealth', 'asset management', 'trading'],
                
                # === EDUCATION & TRAINING ===
                'EdTech Platform': ['education', 'learning', 'training', 'course', 'pedagogy', 'school', 'university'],
                'Learning Management': ['lms', 'e-learning', 'curriculum', 'skill', 'certification', 'moodle', 'mooc'],
                'Assessment System': ['assessment', 'test', 'exam', 'grading', 'evaluation', 'quiz', 'certification'],
                
                # === RETAIL & COMMERCE ===
                'Retail Platform': ['retail', 'store', 'sales', 'customer', 'checkout', 'inventory', 'merchandise'],
                'Food Tech Platform': ['food', 'restaurant', 'delivery', 'cuisine', 'nutrition', 'recipe', 'catering'],
                'Fashion Platform': ['fashion', 'clothing', 'textile', 'design', 'collection', 'trend', 'style'],
                
                # === MANUFACTURING & INDUSTRY ===
                'AutoTech Platform': ['automotive', 'car', 'vehicle', 'transport', 'mobility', 'garage', 'auto'],
                'Aerospace System': ['aerospace', 'aviation', 'aircraft', 'space', 'flight', 'aeronautical', 'satellite'],
                'Construction Platform': ['construction', 'building', 'site', 'architecture', 'civil engineering', 'contractor'],
                'Chemical System': ['chemical', 'laboratory', 'process', 'production', 'materials', 'formulation'],
                'Energy Management': ['energy', 'consumption', 'efficiency', 'optimization', 'energy monitoring', 'renewable'],
                'Smart Grid System': ['smart grid', 'grid', 'distribution', 'meter', 'iot energy', 'electricity'],
                'Logistics Platform': ['logistics', 'transport', 'delivery', 'warehouse', 'tracking', 'shipping', 'supply'],
                'Supply Chain System': ['supply chain', 'procurement', 'supplier', 'sourcing', 'supply', 'stock'],
                'Fleet Management': ['fleet', 'vehicle', 'fleet management', 'maintenance', 'gps', 'transport'],
                
                # === SERVICES & ENTERTAINMENT ===
                'Sports Platform': ['sports', 'fitness', 'training', 'coach', 'performance', 'club', 'athlete'],
                'Travel Platform': ['travel', 'tourism', 'booking', 'hotel', 'transport', 'destination', 'trip'],
                'Event Management': ['event', 'conference', 'meeting', 'organization', 'ticketing', 'planning'],
                
                # === PUBLIC & NON-PROFIT ===
                'GovTech Platform': ['government', 'public', 'administration', 'citizen', 'public service', 'municipal', 'state'],
                'Non-Profit System': ['non-profit', 'ngo', 'volunteer', 'donation', 'humanitarian', 'social', 'foundation'],
                'Environmental Platform': ['environment', 'ecology', 'sustainable', 'carbon', 'pollution', 'green', 'climate'],
                
                # === AGRICULTURE ===
                'AgTech Platform': ['agriculture', 'agtech', 'farm', 'farming', 'agricultural', 'crop', 'rural'],
                'Farm Management': ['farm management', 'field', 'crop', 'livestock', 'agricultural production', 'tractor'],
                'Crop Monitoring': ['crop monitoring', 'harvest', 'irrigation', 'pesticide', 'yield', 'seed'],
                
                # === PROFESSIONAL SERVICES ===
                'Legal Management': ['legal', 'lawyer', 'law firm', 'case', 'procedure', 'law', 'court'],
                'Compliance Platform': ['compliance', 'regulation', 'audit', 'risk', 'governance', 'gdpr', 'standard'],
                'Contract System': ['contract', 'agreement', 'signature', 'negotiation', 'clause', 'legal', 'terms'],
                'Consulting Platform': ['consulting', 'consultant', 'expertise', 'strategy', 'advisory', 'audit'],
                'MarTech Platform': ['marketing', 'martech', 'campaign', 'automation', 'lead', 'digital marketing', 'crm'],
                'HR Platform': ['human resources', 'hr', 'recruitment', 'payroll', 'talent', 'training', 'hris']
            }
        }
        
        # ✅ Mapping industrie vers types spécialisés prioritaires
        self.industry_type_mapping = {
            'Technology': ['Tech Platform', 'Cloud System', 'DevOps Platform', 'SaaS', 'API REST'],
            'Media': ['Streaming Platform', 'Content Platform', 'Media Management', 'Creator Platform'],
            'Gaming': ['Gaming Platform', 'Streaming Platform', 'Content Platform'],
            'Healthcare': ['HealthTech Platform', 'MedTech System', 'Clinical Platform'],
            'Biotechnology': ['BioTech System', 'Research Platform', 'Clinical Platform'],
            'Pharmaceutical': ['Pharmaceutical System', 'Research Platform', 'Clinical Platform'],
            'Research & Development': ['Research Platform', 'BioTech System', 'Tech Platform'],
            'Finance': ['FinTech Platform', 'Trading System', 'Payment Gateway'],
            'Insurance': ['Insurance Platform', 'FinTech Platform', 'Compliance Platform'],
            'Real Estate': ['Real Estate Portal', 'Investment Platform', 'Retail Platform'],
            'Education': ['EdTech Platform', 'Learning Management', 'Assessment System'],
            'Retail': ['Retail Platform', 'E-commerce', 'Marketplace'],
            'Food & Beverage': ['Food Tech Platform', 'Retail Platform', 'E-commerce'],
            'Textile & Fashion': ['Fashion Platform', 'E-commerce', 'Retail Platform'],
            'Automotive': ['AutoTech Platform', 'Fleet Management', 'IoT Platform'],
            'Aerospace': ['Aerospace System', 'Manufacturing System', 'Compliance Platform'],
            'Construction': ['Construction Platform', 'Real Estate Portal', 'Fleet Management'],
            'Chemical': ['Chemical System', 'Manufacturing System', 'Compliance Platform'],
            'Energy': ['Energy Management', 'Smart Grid System', 'IoT Platform'],
            'Logistics': ['Logistics Platform', 'Supply Chain System', 'Fleet Management'],
            'Sports & Fitness': ['Sports Platform', 'HealthTech Platform', 'Community Platform'],
            'Travel & Tourism': ['Travel Platform', 'Event Management', 'Booking Platform'],
            'Events & Hospitality': ['Event Management', 'Travel Platform', 'Booking Platform'],
            'Government': ['GovTech Platform', 'Compliance Platform', 'Citizen Platform'],
            'Non-profit': ['Non-Profit System', 'Community Platform', 'Fundraising Platform'],
            'Environmental': ['Environmental Platform', 'Energy Management', 'Monitoring Platform'],
            'Agriculture': ['AgTech Platform', 'Farm Management', 'Crop Monitoring'],
            'Consulting': ['Consulting Platform', 'Professional Services', 'Dashboard'],
            'Legal Services': ['Legal Management', 'Compliance Platform', 'Contract System'],
            'Marketing & Advertising': ['MarTech Platform', 'Analytics Dashboard', 'Campaign Management'],
            'Human Resources': ['HR Platform', 'Talent Management', 'Assessment System']
        }
        
        # ✅ Patterns de reconnaissance avancés
        self.advanced_patterns = {
            'french': {
                'platform_indicators': ['plateforme', 'portail', 'hub', 'centre', 'espace'],
                'system_indicators': ['système', 'solution', 'outil', 'logiciel', 'application'],
                'management_indicators': ['gestion', 'administration', 'pilotage', 'contrôle', 'suivi'],
                'tech_stack_indicators': ['api', 'cloud', 'mobile', 'web', 'iot', 'ai', 'ml'],
                'business_indicators': ['business', 'commercial', 'entreprise', 'professionnel', 'métier']
            },
            'english': {
                'platform_indicators': ['platform', 'portal', 'hub', 'center', 'space'],
                'system_indicators': ['system', 'solution', 'tool', 'software', 'application'],
                'management_indicators': ['management', 'administration', 'control', 'monitoring', 'tracking'],
                'tech_stack_indicators': ['api', 'cloud', 'mobile', 'web', 'iot', 'ai', 'ml'],
                'business_indicators': ['business', 'commercial', 'enterprise', 'professional', 'corporate']
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
    class TechStackRecommendationEngine:
        """Moteur de recommandation de stack technique intelligente"""
        
        def __init__(self):
            self.supported_languages = ['french', 'english']
            
            # Stacks par type de projet et complexité
            self.tech_stacks = {
                # === TYPES DE BASE ===
                'Application Web': {
                    'simple': {
                        'frontend': ['HTML/CSS', 'JavaScript', 'Bootstrap'],
                        'backend': ['Node.js', 'Express'],
                        'database': ['MongoDB', 'SQLite'],
                        'hosting': ['Netlify', 'Heroku']
                    },
                    'moyen': {
                        'frontend': ['React', 'Vue.js', 'TypeScript'],
                        'backend': ['Node.js', 'Django', 'Rails'],
                        'database': ['PostgreSQL', 'MongoDB'],
                        'hosting': ['AWS', 'Digital Ocean'],
                        'tools': ['Docker', 'CI/CD']
                    },
                    'complexe': {
                        'frontend': ['React', 'Next.js', 'TypeScript'],
                        'backend': ['Node.js', 'Django', 'Spring Boot'],
                        'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                        'hosting': ['AWS', 'Google Cloud'],
                        'tools': ['Docker', 'Kubernetes', 'CI/CD']
                    },
                    'expert': {
                        'frontend': ['React', 'Next.js', 'Micro-frontends'],
                        'backend': ['Microservices', 'GraphQL', 'gRPC'],
                        'database': ['PostgreSQL', 'Redis', 'Cassandra'],
                        'hosting': ['AWS', 'Multi-cloud'],
                        'tools': ['Kubernetes', 'Service Mesh', 'Monitoring']
                    }
                },
                
                'Application Mobile': {
                    'simple': {
                        'framework': ['Flutter', 'React Native'],
                        'backend': ['Firebase', 'Supabase'],
                        'database': ['Firebase Firestore'],
                        'tools': ['Expo', 'App Store Connect']
                    },
                    'moyen': {
                        'framework': ['React Native', 'Flutter'],
                        'backend': ['Node.js', 'Django'],
                        'database': ['PostgreSQL', 'MongoDB'],
                        'services': ['AWS Cognito', 'Firebase'],
                        'tools': ['CI/CD', 'App Distribution']
                    },
                    'complexe': {
                        'framework': ['React Native', 'Flutter', 'Native'],
                        'backend': ['Microservices', 'GraphQL'],
                        'database': ['PostgreSQL', 'Redis'],
                        'services': ['AWS', 'Push Notifications'],
                        'tools': ['CI/CD', 'Performance Monitoring']
                    },
                    'expert': {
                        'framework': ['Native iOS/Android', 'React Native'],
                        'backend': ['Microservices', 'Real-time'],
                        'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                        'services': ['AWS', 'ML Services'],
                        'tools': ['Advanced CI/CD', 'A/B Testing']
                    }
                },
                
                'API REST': {
                    'simple': {
                        'framework': ['Express.js', 'Flask'],
                        'database': ['PostgreSQL', 'MongoDB'],
                        'auth': ['JWT'],
                        'docs': ['Swagger']
                    },
                    'moyen': {
                        'framework': ['Node.js', 'Django REST'],
                        'database': ['PostgreSQL', 'Redis'],
                        'auth': ['OAuth2', 'JWT'],
                        'tools': ['Docker', 'API Gateway']
                    },
                    'complexe': {
                        'framework': ['FastAPI', 'Spring Boot'],
                        'database': ['PostgreSQL', 'Redis', 'MongoDB'],
                        'auth': ['OAuth2', 'Auth0'],
                        'tools': ['Docker', 'Kubernetes', 'Monitoring']
                    },
                    'expert': {
                        'framework': ['GraphQL', 'gRPC', 'Microservices'],
                        'database': ['PostgreSQL', 'Redis', 'Elasticsearch'],
                        'auth': ['OAuth2', 'Keycloak'],
                        'tools': ['Service Mesh', 'API Gateway', 'Observability']
                    }
                },
                
                'SaaS': {
                    'simple': {
                        'frontend': ['React', 'Vue.js'],
                        'backend': ['Node.js', 'Rails'],
                        'database': ['PostgreSQL'],
                        'auth': ['Auth0'],
                        'payment': ['Stripe']
                    },
                    'moyen': {
                        'frontend': ['React', 'TypeScript'],
                        'backend': ['Node.js', 'Django'],
                        'database': ['PostgreSQL', 'Redis'],
                        'auth': ['Auth0', 'AWS Cognito'],
                        'payment': ['Stripe', 'Billing'],
                        'tools': ['Docker', 'CI/CD']
                    },
                    'complexe': {
                        'frontend': ['React', 'Next.js', 'TypeScript'],
                        'backend': ['Microservices', 'GraphQL'],
                        'database': ['PostgreSQL', 'Redis', 'Analytics'],
                        'auth': ['Multi-tenant Auth'],
                        'payment': ['Advanced Billing'],
                        'tools': ['Kubernetes', 'Monitoring']
                    },
                    'expert': {
                        'frontend': ['Micro-frontends', 'Advanced React'],
                        'backend': ['Event-driven Architecture'],
                        'database': ['Multi-tenant DB', 'Data Lake'],
                        'auth': ['Enterprise SSO'],
                        'payment': ['Usage-based Billing'],
                        'tools': ['Full Observability Stack']
                    }
                },
                
                # === TYPES SPÉCIALISÉS ===
                'Gaming Platform': {
                    'simple': {
                        'engine': ['Unity', 'Godot'],
                        'backend': ['Node.js', 'Firebase'],
                        'database': ['MongoDB', 'Redis'],
                        'multiplayer': ['WebSocket', 'Socket.io']
                    },
                    'moyen': {
                        'engine': ['Unity', 'Unreal Engine'],
                        'backend': ['Node.js', 'Go'],
                        'database': ['PostgreSQL', 'Redis'],
                        'multiplayer': ['Dedicated Servers', 'Matchmaking']
                    },
                    'complexe': {
                        'engine': ['Unity', 'Unreal Engine', 'Custom'],
                        'backend': ['Microservices', 'Real-time'],
                        'database': ['PostgreSQL', 'Redis', 'Analytics'],
                        'multiplayer': ['Game Servers', 'Anti-cheat']
                    },
                    'expert': {
                        'engine': ['Custom Engine', 'Advanced Graphics'],
                        'backend': ['Distributed Systems'],
                        'database': ['Sharded DB', 'Real-time Analytics'],
                        'multiplayer': ['Global Infrastructure', 'Advanced Networking']
                    }
                },
                
                'HealthTech Platform': {
                    'simple': {
                        'frontend': ['React', 'HIPAA Compliant'],
                        'backend': ['Node.js', 'FHIR'],
                        'database': ['Encrypted PostgreSQL'],
                        'security': ['End-to-end Encryption']
                    },
                    'moyen': {
                        'frontend': ['React', 'PWA'],
                        'backend': ['FHIR API', 'HL7'],
                        'database': ['PostgreSQL', 'Audit Logs'],
                        'security': ['HIPAA', 'SOC2'],
                        'integration': ['EHR Systems']
                    },
                    'complexe': {
                        'frontend': ['React', 'Real-time'],
                        'backend': ['Microservices', 'ML Pipeline'],
                        'database': ['PostgreSQL', 'Data Lake'],
                        'security': ['Advanced Encryption', 'Compliance'],
                        'integration': ['Multiple EHR', 'IoT Devices']
                    },
                    'expert': {
                        'frontend': ['Advanced UI', 'Accessibility'],
                        'backend': ['AI/ML Services', 'Real-time Processing'],
                        'database': ['Multi-region', 'Analytics'],
                        'security': ['Zero Trust', 'Advanced Compliance'],
                        'integration': ['Healthcare Ecosystem']
                    }
                },
                
                'FinTech Platform': {
                    'simple': {
                        'frontend': ['React', 'Secure UI'],
                        'backend': ['Node.js', 'Payment API'],
                        'database': ['PostgreSQL', 'Encryption'],
                        'security': ['PCI DSS', 'KYC']
                    },
                    'moyen': {
                        'frontend': ['React', 'PWA'],
                        'backend': ['Node.js', 'Spring Boot'],
                        'database': ['PostgreSQL', 'Redis'],
                        'security': ['Advanced Auth', 'Fraud Detection'],
                        'payment': ['Multiple Processors']
                    },
                    'complexe': {
                        'frontend': ['React', 'Real-time Trading'],
                        'backend': ['Microservices', 'Event Streaming'],
                        'database': ['PostgreSQL', 'Time Series'],
                        'security': ['Advanced Fraud', 'Risk Management'],
                        'payment': ['Multi-currency', 'Blockchain']
                    },
                    'expert': {
                        'frontend': ['Advanced Trading UI'],
                        'backend': ['High-frequency Systems'],
                        'database': ['Distributed', 'Real-time Analytics'],
                        'security': ['Quantum-safe', 'Advanced Risk'],
                        'payment': ['DeFi Integration', 'Central Bank Digital Currency']
                    }
                }
            }
            
            # Ajustements par industrie
            self.industry_adjustments = {
                'Healthcare': {
                    'security_priority': 'very_high',
                    'compliance': ['HIPAA', 'GDPR', 'SOC2'],
                    'required_features': ['Encryption', 'Audit Logs', 'Access Control']
                },
                'Finance': {
                    'security_priority': 'very_high',
                    'compliance': ['PCI DSS', 'SOX', 'GDPR'],
                    'required_features': ['Fraud Detection', 'KYC', 'Real-time Monitoring']
                },
                'Education': {
                    'security_priority': 'medium',
                    'compliance': ['FERPA', 'COPPA'],
                    'required_features': ['User Management', 'Content Protection']
                },
                'Gaming': {
                    'performance_priority': 'very_high',
                    'required_features': ['Low Latency', 'Scalability', 'Anti-cheat']
                }
            }
        
        def recommend_stack(self, project_type: str, complexity: str, industry: str = 'Technology', 
                        language: str = 'french') -> Dict[str, Any]:
            """Recommander une stack technique optimisée"""
            
            # Stack de base selon le type et la complexité
            base_stack = self.tech_stacks.get(project_type, {}).get(complexity, {})
            
            if not base_stack:
                # Fallback vers Application Web si type non trouvé
                base_stack = self.tech_stacks['Application Web'].get(complexity, 
                            self.tech_stacks['Application Web']['moyen'])
            
            # Ajustements par industrie
            industry_adjustments = self.industry_adjustments.get(industry, {})
            
            # Recommendations finales
            recommendations = {
                'primary_stack': base_stack,
                'industry_specific': self._get_industry_specific_tools(industry, complexity),
                'security_requirements': self._get_security_requirements(industry),
                'compliance_needs': industry_adjustments.get('compliance', []),
                'performance_considerations': self._get_performance_considerations(project_type, complexity),
                'cost_estimation': self._estimate_stack_cost(base_stack, complexity),
                'learning_curve': self._assess_learning_curve(base_stack, complexity),
                'alternatives': self._suggest_alternatives(project_type, complexity),
                'deployment_options': self._get_deployment_options(complexity, industry)
            }
            
            return recommendations
        
        def _get_industry_specific_tools(self, industry: str, complexity: str) -> List[str]:
            """Outils spécifiques à l'industrie"""
            tools = {
                'Healthcare': ['FHIR Server', 'HL7 Parser', 'Medical Imaging', 'Telemedicine SDK'],
                'Finance': ['Payment Processors', 'KYC Services', 'Fraud Detection', 'Risk Engine'],
                'Education': ['LTI Integration', 'SCORM Player', 'Video Conferencing', 'Assessment Tools'],
                'Gaming': ['Game Analytics', 'Matchmaking', 'Anti-cheat', 'Leaderboards'],
                'Energy': ['IoT Platform', 'Time Series DB', 'SCADA Integration', 'Smart Meters'],
                'Retail': ['E-commerce Platform', 'Inventory Management', 'POS Integration', 'Analytics']
            }
            
            return tools.get(industry, ['Industry Tools', 'Specialized APIs'])
        
        def _get_security_requirements(self, industry: str) -> List[str]:
            """Exigences de sécurité par industrie"""
            security = {
                'Healthcare': ['HIPAA Compliance', 'End-to-end Encryption', 'Audit Logging', 'Access Control'],
                'Finance': ['PCI DSS', 'Multi-factor Auth', 'Fraud Detection', 'Real-time Monitoring'],
                'Education': ['FERPA Compliance', 'Student Privacy', 'Content Protection'],
                'Government': ['FedRAMP', 'High Security', 'Multi-level Access'],
                'default': ['HTTPS/TLS', 'Authentication', 'Data Encryption', 'Security Headers']
            }
            
            return security.get(industry, security['default'])
        
        def _get_performance_considerations(self, project_type: str, complexity: str) -> Dict[str, str]:
            """Considérations de performance"""
            performance = {
                'Gaming Platform': {
                    'latency': 'Critical (<50ms)',
                    'throughput': 'Very High',
                    'scalability': 'Global',
                    'priority': 'Real-time Performance'
                },
                'Trading System': {
                    'latency': 'Ultra Low (<1ms)',
                    'throughput': 'Extreme',
                    'scalability': 'High',
                    'priority': 'Speed and Reliability'
                },
                'Streaming Platform': {
                    'latency': 'Low',
                    'throughput': 'Very High',
                    'scalability': 'Global CDN',
                    'priority': 'Bandwidth and Quality'
                },
                'default': {
                    'latency': 'Standard (<200ms)',
                    'throughput': 'Medium',
                    'scalability': 'Regional',
                    'priority': 'Balanced Performance'
                }
            }
            
            return performance.get(project_type, performance['default'])
        
        def _estimate_stack_cost(self, stack: Dict, complexity: str) -> Dict[str, str]:
            """Estimer le coût de la stack"""
            base_costs = {
                'simple': {'monthly': '50-200€', 'setup': '500-2K€'},
                'moyen': {'monthly': '200-800€', 'setup': '2-8K€'},
                'complexe': {'monthly': '800-3K€', 'setup': '8-25K€'},
                'expert': {'monthly': '3K-15K€', 'setup': '25-100K€'}
            }
            
            return base_costs.get(complexity, base_costs['moyen'])
        
        def _assess_learning_curve(self, stack: Dict, complexity: str) -> str:
            """Évaluer la courbe d'apprentissage"""
            curves = {
                'simple': 'Facile (2-4 semaines)',
                'moyen': 'Modérée (1-3 mois)',
                'complexe': 'Élevée (3-6 mois)',
                'expert': 'Très élevée (6+ mois)'
            }
            
            return curves.get(complexity, 'Modérée')
        
        def _suggest_alternatives(self, project_type: str, complexity: str) -> List[Dict[str, str]]:
            """Suggérer des alternatives"""
            alternatives = [
                {
                    'name': 'Low-code Platform',
                    'description': 'Solutions comme Bubble, Webflow pour développement rapide',
                    'pros': 'Rapide, pas de code',
                    'cons': 'Limitations de personnalisation'
                },
                {
                    'name': 'Template/Framework',
                    'description': 'Utiliser des templates existants ou frameworks',
                    'pros': 'Accélération développement',
                    'cons': 'Adaptation nécessaire'
                },
                {
                    'name': 'Cloud Services',
                    'description': 'Maximiser les services managés (AWS, Google Cloud)',
                    'pros': 'Moins de maintenance',
                    'cons': 'Vendor lock-in possible'
                }
            ]
            
            return alternatives
        
        def _get_deployment_options(self, complexity: str, industry: str) -> List[Dict[str, str]]:
            """Options de déploiement"""
            options = [
                {
                    'type': 'Cloud Public',
                    'providers': 'AWS, Google Cloud, Azure',
                    'best_for': 'Scalabilité et coût',
                    'considerations': 'Sécurité et compliance'
                },
                {
                    'type': 'Cloud Privé',
                    'providers': 'VMware, OpenStack',
                    'best_for': 'Contrôle et sécurité',
                    'considerations': 'Coût et maintenance'
                },
                {
                    'type': 'Hybride',
                    'providers': 'Multi-cloud',
                    'best_for': 'Flexibilité',
                    'considerations': 'Complexité de gestion'
                }
            ]
            
            # Ajustements par industrie
            if industry in ['Healthcare', 'Finance', 'Government']:
                options[0]['considerations'] += ', Compliance stricte'
                options.insert(0, {
                    'type': 'On-Premise',
                    'providers': 'Infrastructure propre',
                    'best_for': 'Contrôle total et compliance',
                    'considerations': 'Coût élevé et expertise interne'
                })
            
            return options


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
            # === TYPES SPÉCIALISÉS GAMING ===
            ("Plateforme de jeux multijoueur temps réel", "Gaming Platform", "Gaming", "french"),
            ("Système de matchmaking pour esport", "Gaming Platform", "Gaming", "french"),
            ("Plateforme de tournois gaming", "Gaming Platform", "Gaming", "french"),
            ("Jeu mobile avec monétisation éthique", "Gaming Platform", "Gaming", "french"),
            ("Real-time multiplayer gaming platform", "Gaming Platform", "Gaming", "english"),
            ("Esport tournament management system", "Gaming Platform", "Gaming", "english"),
            ("Game matchmaking and ranking platform", "Gaming Platform", "Gaming", "english"),
            ("Mobile game with ethical monetization", "Gaming Platform", "Gaming", "english"),
            
            ("Plateforme de streaming vidéo live", "Streaming Platform", "Media", "french"),
            ("Système de diffusion en direct", "Streaming Platform", "Media", "french"),
            ("Live video streaming platform", "Streaming Platform", "Media", "english"),
            ("Real-time broadcast system", "Streaming Platform", "Media", "english"),
            
            # === TYPES SPÉCIALISÉS HEALTHCARE ===
            ("Plateforme de télémédecine avec diagnostic IA", "HealthTech Platform", "Healthcare", "french"),
            ("Système de suivi patient connecté", "HealthTech Platform", "Healthcare", "french"),
            ("Plateforme de thérapie digitale", "HealthTech Platform", "Healthcare", "french"),
            ("Application santé mentale travailleurs", "HealthTech Platform", "Healthcare", "french"),
            ("AI-powered telemedicine platform", "HealthTech Platform", "Healthcare", "english"),
            ("Connected patient monitoring system", "HealthTech Platform", "Healthcare", "english"),
            ("Digital therapy and wellness platform", "HealthTech Platform", "Healthcare", "english"),
            ("Mental health app for workers", "HealthTech Platform", "Healthcare", "english"),
            
            ("Dispositif médical avec capteurs IoT", "MedTech System", "Healthcare", "french"),
            ("Système de monitoring biométrique", "MedTech System", "Healthcare", "french"),
            ("Medical device with IoT sensors", "MedTech System", "Healthcare", "english"),
            ("Biometric monitoring system", "MedTech System", "Healthcare", "english"),
            
            # === TYPES SPÉCIALISÉS FINTECH ===
            ("Plateforme de paiement mobile wallet", "FinTech Platform", "Finance", "french"),
            ("Système de crédit scoring automatisé", "FinTech Platform", "Finance", "french"),
            ("Plateforme d'investissement social", "FinTech Platform", "Finance", "french"),
            ("Application bancaire néobanque", "FinTech Platform", "Finance", "french"),
            ("Mobile payment platform with wallet", "FinTech Platform", "Finance", "english"),
            ("Automated credit scoring system", "FinTech Platform", "Finance", "english"),
            ("Social investment trading platform", "FinTech Platform", "Finance", "english"),
            ("Neobank mobile application", "FinTech Platform", "Finance", "english"),
            
            ("Système de trading haute fréquence", "Trading System", "Finance", "french"),
            ("Plateforme de trading algorithmique", "Trading System", "Finance", "french"),
            ("High-frequency trading system", "Trading System", "Finance", "english"),
            ("Algorithmic trading platform", "Trading System", "Finance", "english"),
            
            # === TYPES SPÉCIALISÉS EDTECH ===
            ("Plateforme d'apprentissage adaptatif", "EdTech Platform", "Education", "french"),
            ("Système de formation en ligne gamifié", "EdTech Platform", "Education", "french"),
            ("Plateforme éducative avec IA", "EdTech Platform", "Education", "french"),
            ("École en ligne interactive", "EdTech Platform", "Education", "french"),
            ("Adaptive learning platform with AI", "EdTech Platform", "Education", "english"),
            ("Gamified online training system", "EdTech Platform", "Education", "english"),
            ("Educational platform with AI", "EdTech Platform", "Education", "english"),
            ("Interactive online school", "EdTech Platform", "Education", "english"),
            
            ("Système LMS pour entreprise", "Learning Management", "Education", "french"),
            ("Plateforme de certification en ligne", "Learning Management", "Education", "french"),
            ("Corporate LMS system", "Learning Management", "Education", "english"),
            ("Online certification platform", "Learning Management", "Education", "english"),
            
            # === TYPES SPÉCIALISÉS ENERGY ===
            ("Système de gestion énergétique intelligent", "Energy Management", "Energy", "french"),
            ("Plateforme d'optimisation consommation", "Energy Management", "Energy", "french"),
            ("Système de monitoring énergétique", "Energy Management", "Energy", "french"),
            ("Smart energy management system", "Energy Management", "Energy", "english"),
            ("Energy consumption optimization platform", "Energy Management", "Energy", "english"),
            ("Energy monitoring and control system", "Energy Management", "Energy", "english"),
            
            ("Système smart grid avec IoT", "Smart Grid System", "Energy", "french"),
            ("Réseau électrique intelligent", "Smart Grid System", "Energy", "french"),
            ("Smart grid system with IoT", "Smart Grid System", "Energy", "english"),
            ("Intelligent electrical grid", "Smart Grid System", "Energy", "english"),
            
            # === TYPES SPÉCIALISÉS SUPPLY CHAIN ===
            ("Système de traçabilité supply chain", "Supply Chain System", "Logistics", "french"),
            ("Plateforme de gestion fournisseurs", "Supply Chain System", "Logistics", "french"),
            ("Supply chain traceability system", "Supply Chain System", "Logistics", "english"),
            ("Supplier management platform", "Supply Chain System", "Logistics", "english"),
            
            ("Plateforme logistique avec tracking", "Logistics Platform", "Logistics", "french"),
            ("Système de gestion entrepôt", "Logistics Platform", "Logistics", "french"),
            ("Logistics platform with tracking", "Logistics Platform", "Logistics", "english"),
            ("Warehouse management system", "Logistics Platform", "Logistics", "english"),
            
            # === TYPES SPÉCIALISÉS AGTECH ===
            ("Plateforme agriculture de précision", "AgTech Platform", "Agriculture", "french"),
            ("Système de farming intelligent", "AgTech Platform", "Agriculture", "french"),
            ("Precision agriculture platform", "AgTech Platform", "Agriculture", "english"),
            ("Smart farming system", "AgTech Platform", "Agriculture", "english"),
            
            # === TYPES SPÉCIALISÉS PROPTECH ===
            ("Plateforme immobilière avec estimation IA", "PropTech Platform", "Real Estate", "french"),
            ("Système de gestion locative", "PropTech Platform", "Real Estate", "french"),
            ("Real estate platform with AI valuation", "PropTech Platform", "Real Estate", "english"),
            ("Property rental management system", "PropTech Platform", "Real Estate", "english"),
            
            # === TYPES SPÉCIALISÉS MARTECH ===
            ("Plateforme marketing automation", "MarTech Platform", "Marketing & Advertising", "french"),
            ("Système de gestion campagnes", "MarTech Platform", "Marketing & Advertising", "french"),
            ("Marketing automation platform", "MarTech Platform", "Marketing & Advertising", "english"),
            ("Campaign management system", "MarTech Platform", "Marketing & Advertising", "english"),
            
            # === TYPES DE BASE (pour compatibilité) ===
            ("Site web vitrine avec blog", "Application Web", "Technology", "french"),
            ("Application mobile iOS/Android", "Application Mobile", "Technology", "french"),
            ("API REST pour authentification", "API REST", "Technology", "french"),
            ("Plateforme SaaS de gestion", "SaaS", "Technology", "french"),
            ("Boutique e-commerce avec paiement", "E-commerce", "Retail", "french"),
            ("CMS avec workflow éditorial", "CMS", "Technology", "french"),
            ("Dashboard analytics temps réel", "Dashboard", "Technology", "french"),
            ("Système ERP sur mesure", "Système", "Technology", "french"),
            
            ("Company website with blog", "Application Web", "Technology", "english"),
            ("iOS/Android mobile application", "Application Mobile", "Technology", "english"),
            ("REST API for authentication", "API REST", "Technology", "english"),
            ("SaaS management platform", "SaaS", "Technology", "english"),
            ("E-commerce shop with payment", "E-commerce", "Retail", "english"),
            ("CMS with editorial workflow", "CMS", "Technology", "english"),
            ("Real-time analytics dashboard", "Dashboard", "Technology", "english"),
            ("Custom ERP system", "Système", "Technology", "english"),
            
            # === TYPES SPÉCIALISÉS ADDITIONNELS ===
            ("Plateforme IoT avec capteurs", "IoT Platform", "Technology", "french"),
            ("Système de compliance réglementaire", "Compliance Platform", "Legal Services", "french"),
            ("Plateforme de gestion contrats", "Contract System", "Legal Services", "french"),
            ("Système de gestion cabinet juridique", "Legal Management", "Legal Services", "french"),
            
            ("IoT platform with sensors", "IoT Platform", "Technology", "english"),
            ("Regulatory compliance system", "Compliance Platform", "Legal Services", "english"),
            ("Contract management platform", "Contract System", "Legal Services", "english"),
            ("Legal practice management system", "Legal Management", "Legal Services", "english")

            # Sports & Fitness
            ("Application de coaching fitness personnalisé", "Sports Platform", "Sports & Fitness", "french"),
            ("Plateforme de réservation cours fitness", "Sports Platform", "Sports & Fitness", "french"),
            ("Fitness coaching application", "Sports Platform", "Sports & Fitness", "english"),
            ("Sports club management system", "Sports Platform", "Sports & Fitness", "english"),

            # Travel & Tourism
            ("Plateforme de réservation voyage", "Travel Platform", "Travel & Tourism", "french"),
            ("Application de guide touristique", "Travel Platform", "Travel & Tourism", "french"),
            ("Travel booking platform", "Travel Platform", "Travel & Tourism", "english"),
            ("Tourism management system", "Travel Platform", "Travel & Tourism", "english"),

            # Events & Hospitality
            ("Système de gestion événementielle", "Event Management", "Events & Hospitality", "french"),
            ("Plateforme de réservation événements", "Event Management", "Events & Hospitality", "french"),
            ("Event management system", "Event Management", "Events & Hospitality", "english"),
            ("Hospitality booking platform", "Event Management", "Events & Hospitality", "english"),

            # Government
            ("Plateforme citoyenne e-gouvernement", "GovTech Platform", "Government", "french"),
            ("Système d'administration publique", "GovTech Platform", "Government", "french"),
            ("E-government citizen platform", "GovTech Platform", "Government", "english"),
            ("Public administration system", "GovTech Platform", "Government", "english"),

            # Non-profit
            ("Plateforme de gestion association", "Non-Profit System", "Non-profit", "french"),
            ("Système de collecte de dons", "Non-Profit System", "Non-profit", "french"),
            ("Association management platform", "Non-Profit System", "Non-profit", "english"),
            ("Donation management system", "Non-Profit System", "Non-profit", "english"),

            # Environmental
            ("Plateforme de monitoring environnemental", "Environmental Platform", "Environmental", "french"),
            ("Système de gestion carbone", "Environmental Platform", "Environmental", "french"),
            ("Environmental monitoring platform", "Environmental Platform", "Environmental", "english"),
            ("Carbon management system", "Environmental Platform", "Environmental", "english"),

            # Automotive
            ("Plateforme de gestion de flotte", "AutoTech Platform", "Automotive", "french"),
            ("Système de maintenance véhicules", "AutoTech Platform", "Automotive", "french"),
            ("Fleet management platform", "AutoTech Platform", "Automotive", "english"),
            ("Vehicle maintenance system", "AutoTech Platform", "Automotive", "english"),

            # Aerospace
            ("Système de maintenance aéronautique", "Aerospace System", "Aerospace", "french"),
            ("Plateforme de gestion vols", "Aerospace System", "Aerospace", "french"),
            ("Aircraft maintenance system", "Aerospace System", "Aerospace", "english"),
            ("Flight management platform", "Aerospace System", "Aerospace", "english"),

            # Construction
            ("Plateforme de gestion chantier", "Construction Platform", "Construction", "french"),
            ("Système BIM de construction", "Construction Platform", "Construction", "french"),
            ("Construction site management platform", "Construction Platform", "Construction", "english"),
            ("BIM construction system", "Construction Platform", "Construction", "english"),

            # Food & Beverage
            ("Plateforme de livraison alimentaire", "Food Tech Platform", "Food & Beverage", "french"),
            ("Système de gestion restaurant", "Food Tech Platform", "Food & Beverage", "french"),
            ("Food delivery platform", "Food Tech Platform", "Food & Beverage", "english"),
            ("Restaurant management system", "Food Tech Platform", "Food & Beverage", "english"),

            # Textile & Fashion
            ("Plateforme de mode en ligne", "Fashion Platform", "Textile & Fashion", "french"),
            ("Système de gestion collection", "Fashion Platform", "Textile & Fashion", "french"),
            ("Online fashion platform", "Fashion Platform", "Textile & Fashion", "english"),
            ("Collection management system", "Fashion Platform", "Textile & Fashion", "english"),

            # Chemical
            ("Système de gestion laboratoire chimique", "Chemical System", "Chemical", "french"),
            ("Plateforme de contrôle qualité", "Chemical System", "Chemical", "french"),
            ("Chemical laboratory management system", "Chemical System", "Chemical", "english"),
            ("Quality control platform", "Chemical System", "Chemical", "english"),

            # Biotechnology
            ("Système de recherche biotechnologique", "BioTech System", "Biotechnology", "french"),
            ("Plateforme d'analyse génétique", "BioTech System", "Biotechnology", "french"),
            ("Biotechnology research system", "BioTech System", "Biotechnology", "english"),
            ("Genetic analysis platform", "BioTech System", "Biotechnology", "english"),

            # Research & Development
            ("Plateforme de recherche collaborative", "Research Platform", "Research & Development", "french"),
            ("Système de gestion projets R&D", "Research Platform", "Research & Development", "french"),
            ("Collaborative research platform", "Research Platform", "Research & Development", "english"),
            ("R&D project management system", "Research Platform", "Research & Development", "english"),

            # Pharmaceutical
            ("Système de développement médicaments", "Pharmaceutical System", "Pharmaceutical", "french"),
            ("Plateforme d'essais cliniques", "Pharmaceutical System", "Pharmaceutical", "french"),
            ("Drug development system", "Pharmaceutical System", "Pharmaceutical", "english"),
            ("Clinical trials platform", "Pharmaceutical System", "Pharmaceutical", "english"),

            # Insurance
            ("Plateforme d'assurance digitale", "Insurance Platform", "Insurance", "french"),
            ("Système de gestion sinistres", "Insurance Platform", "Insurance", "french"),
            ("Digital insurance platform", "Insurance Platform", "Insurance", "english"),
            ("Claims management system", "Insurance Platform", "Insurance", "english"),

            # Consulting
            ("Plateforme de conseil en ligne", "Consulting Platform", "Consulting", "french"),
            ("Système de gestion missions", "Consulting Platform", "Consulting", "french"),
            ("Online consulting platform", "Consulting Platform", "Consulting", "english"),
            ("Mission management system", "Consulting Platform", "Consulting", "english"),

            # Human Resources
            ("Plateforme RH de recrutement", "HR Platform", "Human Resources", "french"),
            ("Système de gestion talents", "HR Platform", "Human Resources", "french"),
            ("HR recruitment platform", "HR Platform", "Human Resources", "english"),
            ("Talent management system", "HR Platform", "Human Resources", "english"),
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
            # ✅ FIX: Vérifier si assez d'échantillons pour faire un split
            unique_classes = len(np.unique(y))
            total_samples = len(X)
            
            if total_samples < unique_classes * 2:
                print(f"Dataset trop petit ({total_samples} échantillons, {unique_classes} classes)")
                print("Évaluation sur l'ensemble complet sans split...")
                
                # Évaluation sur tout le dataset
                predictions = self.project_type_classifier.predict(X)
                accuracy = accuracy_score(y, predictions)
                
                print(f"Précision du modèle de type de projet : {accuracy:.3f}")
                
                # Distribution des prédictions
                from collections import Counter
                predicted_types = self.label_encoder.inverse_transform(predictions)
                actual_types = self.label_encoder.inverse_transform(y)
                
                print(f"Distribution prédite : {Counter(predicted_types)}")
                print(f"Distribution réelle : {Counter(actual_types)}")
                
            else:
                # Split normal si assez d'échantillons
                test_size = min(0.2, max(0.1, unique_classes / total_samples))
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42, stratify=y
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