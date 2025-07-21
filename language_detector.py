import re
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class CentralizedLanguageDetector:
    """Détecteur de langue centralisé avec cache et méthodes avancées"""
    
    def __init__(self):
        self.cache = {}
        self.cache_size_limit = 500
        
        self.french_indicators = {
            # Articles et prépositions (très discriminants)
            'le': 10, 'la': 10, 'les': 8, 'du': 8, 'des': 8, 'de': 6,
            'un': 6, 'une': 6, 'avec': 5, 'pour': 5, 'dans': 5, 'sur': 4,
            'et': 4, 'ou': 4, 'au': 5, 'aux': 5, 'ce': 4, 'cette': 5,
            
            # Verbes courants français
            'développer': 8, 'créer': 7, 'implémenter': 9, 'optimiser': 7,
            'gérer': 6, 'analyser': 6, 'intégrer': 7, 'concevoir': 8,
            'configurer': 8, 'déployer': 7, 'maintenir': 6, 'tester': 5,
            
            # Substantifs techniques français
            'plateforme': 7, 'application': 6, 'système': 6, 'données': 7,
            'utilisateur': 6, 'fonctionnalité': 8, 'interface': 6,
            'sécurité': 6, 'performance': 6, 'architecture': 7,
            'gestion': 6, 'service': 5, 'projet': 5, 'solution': 6,
            
            # Mots spécifiquement français
            'télémédecine': 10, 'efficacité': 8, 'évolutivité': 9,
            'conformité': 9, 'réglementation': 10, 'entreprise': 6,
            'hôpital': 8, 'énergie': 7, 'logistique': 8
        }
        
        # Indicateurs anglais avec pondération
        self.english_indicators = {
            # Articles et prépositions
            'the': 8, 'a': 6, 'an': 7, 'with': 5, 'for': 4, 'in': 4,
            'on': 4, 'and': 5, 'or': 4, 'of': 5, 'to': 4, 'at': 3,
            'by': 3, 'from': 4, 'into': 4, 'through': 5,
            
            # Verbes courants anglais
            'develop': 8, 'create': 7, 'implement': 9, 'optimize': 7,
            'manage': 6, 'analyze': 6, 'integrate': 7, 'design': 6,
            'configure': 8, 'deploy': 7, 'maintain': 6, 'test': 5,
            'build': 6, 'handle': 5, 'process': 5, 'support': 5,
            
            # Substantifs techniques anglais
            'platform': 7, 'application': 6, 'system': 6, 'data': 6,
            'user': 6, 'feature': 7, 'interface': 6, 'security': 6,
            'performance': 6, 'architecture': 7, 'management': 6,
            'service': 5, 'project': 5, 'solution': 6,
            
            # Mots spécifiquement anglais
            'healthcare': 9, 'telemedicine': 10, 'efficiency': 7,
            'scalability': 9, 'compliance': 8, 'regulation': 8,
            'enterprise': 6, 'hospital': 8, 'energy': 7, 'logistics': 8
        }
        
        # Patterns linguistiques
        self.french_accents = ['à', 'á', 'â', 'ã', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï',
                              'ò', 'ó', 'ô', 'õ', 'ù', 'ú', 'û', 'ü', 'ç', 'ÿ']
        
        self.english_endings = ['ing', 'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ful', 'less']
        
        # N-grammes typiques
        self.french_bigrams = ['qu', 'ch', 'ou', 'ai', 'ei', 'au', 'eu', 'oi', 'ui']
        self.english_bigrams = ['th', 'he', 'in', 'er', 'an', 're', 'ed', 'nd', 'ha', 'en']

    def _get_cache_key(self, text: str) -> str:
        """Générer une clé de cache pour le texte"""
        import hashlib
        return hashlib.md5(text.lower().strip().encode()).hexdigest()[:16]

    def _calculate_language_scores(self, text: str) -> Tuple[float, float]:
        """Calculer les scores pour français et anglais"""
        text_lower = text.lower()
        text_length = max(len(text_lower), 1)
        
        # Calcul des scores pondérés
        french_score = 0
        english_score = 0
        
        # 1. Compter les occurrences avec pondération
        for word, weight in self.french_indicators.items():
            french_score += text_lower.count(word) * weight
        
        for word, weight in self.english_indicators.items():
            english_score += text_lower.count(word) * weight
        
        # 2. Bonus pour les accents français (très discriminant)
        accent_count = sum(1 for char in text_lower if char in self.french_accents)
        french_score += accent_count * 15
        
        # 3. Bonus pour les terminaisons anglaises
        for ending in self.english_endings:
            english_score += text_lower.count(ending) * 3
        
        # 4. Bonus pour les n-grammes typiques
        for bigram in self.french_bigrams:
            french_score += text_lower.count(bigram) * 2
        
        for bigram in self.english_bigrams:
            english_score += text_lower.count(bigram) * 2
        
        # 5. Normalisation par la longueur du texte
        french_score = french_score / text_length
        english_score = english_score / text_length
        
        return french_score, english_score

    def detect_language(self, text: str, preferred_language: Optional[str] = None) -> str:
        """
        Détecter la langue du texte avec gestion du cache et langue préférée
        
        Args:
            text: Texte à analyser
            preferred_language: Langue préférée ('french' ou 'english')
        
        Returns:
            'french' ou 'english'
        """
        # Vérifier les cas simples
        if not text or len(text.strip()) < 2:
            return preferred_language or 'english'
        
        # Respecter la langue préférée si explicitement demandée
        if preferred_language in ['french', 'english']:
            logger.info(f"Langue préférée spécifiée: {preferred_language}")
            return preferred_language
        
        # Vérifier le cache
        cache_key = self._get_cache_key(text)
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Calculer les scores
            french_score, english_score = self._calculate_language_scores(text)
            
            # Seuil de confiance pour éviter les détections incertaines
            confidence_threshold = 0.01
            score_difference = abs(french_score - english_score)
            
            detected_language = 'english'  # Valeur par défaut
            
            if score_difference < confidence_threshold:
                # Critères de départage supplémentaires
                detected_language = self._tie_breaker(text)
            else:
                detected_language = 'french' if french_score > english_score else 'english'
            
            # Mettre en cache le résultat
            self._update_cache(cache_key, detected_language)
            
            logger.info(f"Langue détectée: {detected_language} (scores: fr={french_score:.3f}, en={english_score:.3f})")
            return detected_language
            
        except Exception as e:
            logger.error(f"Erreur lors de la détection de langue: {e}")
            return preferred_language or 'english'

    def _tie_breaker(self, text: str) -> str:
        """Critères de départage en cas de scores proches"""
        text_lower = text.lower()
        
        # 1. Présence d'accents français (critère fort)
        if any(char in text_lower for char in self.french_accents):
            return 'french'
        
        # 2. Patterns de mots avec espaces (plus précis)
        french_patterns = [' le ', ' la ', ' les ', ' du ', ' des ', ' avec ', ' pour ']
        english_patterns = [' the ', ' and ', ' with ', ' for ', ' this ', ' that ']
        
        french_pattern_matches = sum(1 for pattern in french_patterns if pattern in f" {text_lower} ")
        english_pattern_matches = sum(1 for pattern in english_patterns if pattern in f" {text_lower} ")
        
        if french_pattern_matches > english_pattern_matches:
            return 'french'
        elif english_pattern_matches > french_pattern_matches:
            return 'english'
        
        # 3. Longueur moyenne des mots (français tend à avoir des mots plus longs)
        words = re.findall(r'\b\w+\b', text_lower)
        if words:
            avg_word_length = sum(len(word) for word in words) / len(words)
            return 'french' if avg_word_length > 6 else 'english'
        
        return 'english'

    def _update_cache(self, cache_key: str, result: str):
        """Mettre à jour le cache avec limitation de taille"""
        if len(self.cache) >= self.cache_size_limit:
            # Supprimer l'entrée la plus ancienne
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        
        self.cache[cache_key] = result

    def get_detection_confidence(self, text: str) -> Dict[str, float]:
        """Obtenir un score de confiance pour la détection"""
        if not text or len(text.strip()) < 2:
            return {'french': 0.5, 'english': 0.5, 'confidence': 'low'}
        
        french_score, english_score = self._calculate_language_scores(text)
        
        total_score = french_score + english_score
        if total_score == 0:
            return {'french': 0.5, 'english': 0.5, 'confidence': 'low'}
        
        french_confidence = french_score / total_score
        english_confidence = english_score / total_score
        
        # Déterminer le niveau de confiance
        max_confidence = max(french_confidence, english_confidence)
        if max_confidence > 0.8:
            confidence_level = 'high'
        elif max_confidence > 0.6:
            confidence_level = 'medium'
        else:
            confidence_level = 'low'
        
        return {
            'french': french_confidence,
            'english': english_confidence,
            'confidence': confidence_level
        }

    def clear_cache(self):
        """Vider le cache (utile pour les tests)"""
        self.cache.clear()
        logger.info("Cache de détection de langue vidé")


# Instance globale du détecteur (singleton pattern)
_global_language_detector = None

def get_language_detector() -> CentralizedLanguageDetector:
    """Factory pour obtenir l'instance globale du détecteur"""
    global _global_language_detector
    if _global_language_detector is None:
        _global_language_detector = CentralizedLanguageDetector()
    return _global_language_detector


# Fonction utilitaire pour l'orchestrateur
def detect_project_language(description: str, additional_context: str = "", preferred_language: Optional[str] = None) -> str:
    """
    Fonction principale pour détecter la langue d'un projet
    Utilisée par l'orchestrateur principal
    """
    detector = get_language_detector()
    
    # Combiner description et contexte additionnel
    full_text = f"{description} {additional_context}".strip()
    
    return detector.detect_language(full_text, preferred_language)