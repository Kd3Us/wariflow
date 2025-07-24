# module_7_project_names.py - Générateur intelligent de noms de projets
"""
Module 7: Générateur ML de noms de projets contextuels
Génère des noms logiques et engageants basés sur l'industrie, le type et le contexte
"""

import re
import random
from typing import Dict, List, Any, Tuple
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from collections import Counter
import hashlib

class MLProjectNameGenerator:
    """Générateur ML de noms de projets contextuels et engageants"""
    
    def __init__(self):
        self.name_templates = self._initialize_templates()
        self.concept_extractors = self._initialize_extractors()
        self.name_cache = {}
        
        # Télécharger les ressources NLTK nécessaires
        try:
            nltk.download('stopwords', quiet=True)
            nltk.download('punkt', quiet=True)
        except:
            pass
    
    def _initialize_templates(self) -> Dict[str, Dict[str, List[str]]]:
        """Initialiser les templates de noms par industrie"""
        return {
            'Technology': {
                'prefixes': ['Smart', 'Cloud', 'Quantum', 'Neo', 'Hyper', 'Digital', 'Tech', 'Cyber'],
                'core_words': ['Hub', 'Connect', 'Flow', 'Sync', 'Forge', 'Link', 'Bridge', 'Core'],
                'suffixes': ['Pro', 'X', 'Labs', 'Works', 'Tech', 'AI', 'Plus', 'Engine'],
                'descriptive_words': ['Platform', 'System', 'Solution', 'Application', 'Portal']
            },
            'Healthcare': {
                'prefixes': ['Care', 'Health', 'Vital', 'Med', 'Bio', 'Medi', 'Life', 'Wellness'],
                'core_words': ['Care', 'Link', 'Track', 'Monitor', 'Assist', 'Connect', 'Guard'],
                'suffixes': ['Plus', 'MD', 'Care', 'Health', 'Med', 'Life', 'Pro', 'Safe'],
                'descriptive_words': ['System', 'Platform', 'Assistant', 'Monitor', 'Tracker']
            },
            'Finance': {
                'prefixes': ['Fin', 'Pay', 'Crypto', 'Trade', 'Invest', 'Bank', 'Money', 'Capital'],
                'core_words': ['Pay', 'Trade', 'Invest', 'Bank', 'Wallet', 'Ledger', 'Flow'],
                'suffixes': ['Pay', 'Trade', 'Pro', 'X', 'Invest', 'Finance', 'Wallet', 'Hub'],
                'descriptive_words': ['Platform', 'System', 'Application', 'Portal', 'Engine']
            },
            'Education': {
                'prefixes': ['Edu', 'Learn', 'Study', 'Teach', 'Smart', 'Brain', 'Mind', 'Know'],
                'core_words': ['Learn', 'Study', 'Teach', 'Know', 'Brain', 'Mind', 'Academy'],
                'suffixes': ['Learn', 'Ed', 'Academy', 'Pro', 'Plus', 'Hub', 'X', 'Master'],
                'descriptive_words': ['Platform', 'System', 'Portal', 'Campus', 'Academy']
            },
            'Retail': {
                'prefixes': ['Shop', 'Buy', 'Market', 'Store', 'Sell', 'Commerce', 'Trade'],
                'core_words': ['Shop', 'Market', 'Store', 'Cart', 'Buy', 'Sell', 'Trade'],
                'suffixes': ['Shop', 'Market', 'Store', 'Pro', 'Plus', 'Hub', 'X', 'Cart'],
                'descriptive_words': ['Platform', 'Marketplace', 'Store', 'Portal', 'Hub']
            },
            'Media': {
                'prefixes': ['Stream', 'Media', 'Content', 'Social', 'News', 'Video', 'Audio'],
                'core_words': ['Stream', 'Media', 'Content', 'Share', 'Publish', 'Cast'],
                'suffixes': ['Stream', 'Media', 'Cast', 'Pro', 'Plus', 'Hub', 'X', 'TV'],
                'descriptive_words': ['Platform', 'Network', 'Channel', 'Portal', 'Studio']
            },
            'Gaming': {
                'prefixes': ['Game', 'Play', 'Quest', 'Epic', 'Pixel', 'Arcade', 'Battle'],
                'core_words': ['Game', 'Play', 'Quest', 'Battle', 'Arena', 'Zone', 'World'],
                'suffixes': ['Game', 'Play', 'Quest', 'Pro', 'Plus', 'X', 'Arena', 'Zone'],
                'descriptive_words': ['Platform', 'Engine', 'Studio', 'Arena', 'World']
            },
            'Consulting': {
                'prefixes': ['Consult', 'Advise', 'Expert', 'Strategy', 'Business', 'Pro'],
                'core_words': ['Consult', 'Advise', 'Strategy', 'Business', 'Expert', 'Guide'],
                'suffixes': ['Consult', 'Pro', 'Plus', 'Expert', 'Hub', 'X', 'Advisory'],
                'descriptive_words': ['Platform', 'System', 'Portal', 'Hub', 'Network']
            }
        }
    
    def _initialize_extractors(self) -> Dict[str, List[str]]:
        """Initialiser les extracteurs de concepts"""
        return {
            'tech_concepts': [
                'api', 'app', 'web', 'mobile', 'cloud', 'ai', 'ml', 'blockchain',
                'iot', 'dashboard', 'analytics', 'automation', 'integration'
            ],
            'business_concepts': [
                'crm', 'erp', 'management', 'tracking', 'monitoring', 'planning',
                'optimization', 'workflow', 'collaboration', 'communication'
            ],
            'user_concepts': [
                'user', 'client', 'customer', 'patient', 'student', 'employee',
                'visitor', 'member', 'subscriber', 'participant'
            ]
        }
    
    def generate_project_name(self, description: str, industry: str, 
                             project_type: str, complexity: str,
                             language: str = 'french') -> Dict[str, Any]:
        """Générer un nom de projet contextuel et engageant"""
        
        # Vérifier le cache
        cache_key = self._generate_cache_key(description, industry, project_type, complexity)
        if cache_key in self.name_cache:
            return self.name_cache[cache_key]
        
        # Extraire les concepts clés
        key_concepts = self.extract_key_concepts(description, language)
        
        # Générer plusieurs options de noms
        name_options = []
        
        # Option 1: Nom basé sur les templates d'industrie
        template_name = self._generate_template_name(industry, key_concepts)
        if template_name:
            name_options.append({
                'name': template_name,
                'type': 'template',
                'confidence': 0.9
            })
        
        # Option 2: Nom descriptif intelligent
        descriptive_name = self._generate_descriptive_name(
            description, project_type, key_concepts, language
        )
        name_options.append({
            'name': descriptive_name,
            'type': 'descriptive',
            'confidence': 0.8
        })
        
        # Option 3: Nom créatif avec mélange de concepts
        creative_name = self._generate_creative_name(key_concepts, industry, complexity)
        name_options.append({
            'name': creative_name,
            'type': 'creative',
            'confidence': 0.7
        })
        
        # Option 4: Nom simple et professionnel
        professional_name = self._generate_professional_name(
            industry, project_type, key_concepts
        )
        name_options.append({
            'name': professional_name,
            'type': 'professional',
            'confidence': 0.85
        })
        
        # Sélectionner le meilleur nom
        best_name = max(name_options, key=lambda x: x['confidence'])
        
        result = {
            'recommended_name': best_name['name'],
            'name_type': best_name['type'],
            'confidence': best_name['confidence'],
            'alternatives': [opt['name'] for opt in name_options if opt != best_name],
            'reasoning': self._explain_naming_choice(best_name, industry, key_concepts),
            'key_concepts_used': key_concepts[:3],
            'industry_context': industry,
            'language': language
        }
        
        # Mettre en cache
        self.name_cache[cache_key] = result
        return result
    
    def extract_key_concepts(self, description: str, language: str = 'french') -> List[str]:
        """Extraire les concepts clés de la description du projet"""
        
        # Nettoyer et tokeniser le texte
        text_lower = description.lower()
        
        # Supprimer les mots vides selon la langue
        try:
            if language == 'french':
                stop_words = set(stopwords.words('french'))
            else:
                stop_words = set(stopwords.words('english'))
        except:
            stop_words = set()
        
        # Ajouter des mots vides personnalisés
        custom_stop_words = {
            'pour', 'avec', 'dans', 'sur', 'une', 'des', 'les', 'qui', 'que',
            'for', 'with', 'in', 'on', 'a', 'an', 'the', 'which', 'that'
        }
        stop_words.update(custom_stop_words)
        
        # Tokeniser et filtrer
        try:
            words = word_tokenize(text_lower)
        except:
            words = text_lower.split()
        
        # Filtrer les mots significatifs
        filtered_words = [
            word for word in words 
            if len(word) > 2 and word not in stop_words and word.isalpha()
        ]
        
        # Compter la fréquence et extraire les plus importants
        word_freq = Counter(filtered_words)
        
        # Extraire des concepts techniques et business
        tech_concepts = [
            word for word in filtered_words 
            if word in self.concept_extractors['tech_concepts']
        ]
        
        business_concepts = [
            word for word in filtered_words 
            if word in self.concept_extractors['business_concepts']
        ]
        
        # Combiner tous les concepts par importance
        important_concepts = []
        
        # Ajouter les concepts techniques et business en priorité
        important_concepts.extend(tech_concepts[:2])
        important_concepts.extend(business_concepts[:2])
        
        # Ajouter les mots les plus fréquents
        for word, freq in word_freq.most_common(8):
            if word not in important_concepts:
                important_concepts.append(word)
        
        return important_concepts[:6]  # Retourner max 6 concepts
    
    def _generate_template_name(self, industry: str, concepts: List[str]) -> str:
        """Générer un nom basé sur les templates d'industrie"""
        
        templates = self.name_templates.get(industry, self.name_templates['Technology'])
        
        if not concepts:
            # Nom générique si pas de concepts
            prefix = random.choice(templates['prefixes'])
            suffix = random.choice(templates['suffixes'])
            return f"{prefix}{suffix}"
        
        # Utiliser le premier concept comme base
        main_concept = concepts[0].title()
        
        # Différentes variations possibles
        variations = [
            f"{random.choice(templates['prefixes'])}{main_concept}",
            f"{main_concept}{random.choice(templates['suffixes'])}",
            f"{random.choice(templates['prefixes'])}{main_concept}{random.choice(templates['suffixes'])}",
            f"{main_concept} {random.choice(templates['descriptive_words'])}"
        ]
        
        return random.choice(variations)
    
    def _generate_descriptive_name(self, description: str, project_type: str, 
                                 concepts: List[str], language: str) -> str:
        """Générer un nom descriptif intelligent"""
        
        # Mapper les types de projets vers des suffixes descriptifs
        type_suffixes = {
            'Application Web': ['Platform', 'Portal', 'Hub', 'System'],
            'Application Mobile': ['App', 'Mobile', 'Go', 'Pocket'],
            'Dashboard': ['Analytics', 'Insights', 'Monitor', 'Track'],
            'API': ['Connect', 'Link', 'Bridge', 'Gateway'],
            'CMS': ['Content', 'Publish', 'Editor', 'Studio'],
            'E-commerce': ['Shop', 'Store', 'Market', 'Buy'],
            'Système': ['System', 'Manager', 'Pro', 'Enterprise']
        }
        
        if concepts:
            main_concept = concepts[0].title()
            
            # Choisir un suffixe approprié selon le type de projet
            suffixes = type_suffixes.get(project_type, ['Platform', 'System', 'Pro'])
            chosen_suffix = random.choice(suffixes)
            
            return f"{main_concept} {chosen_suffix}"
        
        # Nom par défaut basé sur le type
        return f"My {project_type}"
    
    def _generate_creative_name(self, concepts: List[str], industry: str, complexity: str) -> str:
        """Générer un nom créatif en mélangeant les concepts"""
        
        if len(concepts) < 2:
            return self._generate_template_name(industry, concepts)
        
        # Modificateurs selon la complexité
        complexity_prefixes = {
            'simple': ['Easy', 'Quick', 'Simple', 'Basic'],
            'moyen': ['Smart', 'Pro', 'Advanced', 'Plus'],
            'complexe': ['Ultimate', 'Enterprise', 'Professional', 'Master'],
            'expert': ['Quantum', 'AI', 'Neural', 'Hyper', 'Ultra']
        }
        
        # Combinaisons créatives
        concept1 = concepts[0].title()
        concept2 = concepts[1].title() if len(concepts) > 1 else ''
        
        prefix_options = complexity_prefixes.get(complexity, ['Smart', 'Pro'])
        
        creative_patterns = [
            f"{concept1}{concept2}",
            f"{random.choice(prefix_options)}{concept1}",
            f"{concept1} {concept2}",
            f"{concept1}X",
            f"{concept1} Pro"
        ]
        
        return random.choice(creative_patterns)
    
    def _generate_professional_name(self, industry: str, project_type: str, 
                                  concepts: List[str]) -> str:
        """Générer un nom professionnel et sobre"""
        
        # Noms professionnels par industrie
        professional_patterns = {
            'Technology': ['System', 'Platform', 'Solution', 'Engine', 'Framework'],
            'Healthcare': ['Care System', 'Medical Platform', 'Health Solution'],
            'Finance': ['Financial Platform', 'Payment System', 'Trading Solution'],
            'Education': ['Learning Platform', 'Education System', 'Training Portal'],
            'Retail': ['Commerce Platform', 'Retail System', 'Shopping Solution'],
            'Consulting': ['Business Platform', 'Advisory System', 'Strategy Portal']
        }
        
        patterns = professional_patterns.get(industry, professional_patterns['Technology'])
        
        if concepts:
            main_concept = concepts[0].title()
            return f"{main_concept} {random.choice(patterns)}"
        
        # Nom générique professionnel
        return f"{industry} {random.choice(patterns)}"
    
    def _explain_naming_choice(self, chosen_name: Dict[str, Any], industry: str, 
                             concepts: List[str]) -> str:
        """Expliquer le choix du nom"""
        
        name = chosen_name['name']
        name_type = chosen_name['type']
        
        explanations = {
            'template': f"Nom généré selon les conventions de l'industrie {industry}, "
                       f"optimisé pour l'engagement utilisateur.",
            'descriptive': f"Nom descriptif basé sur les concepts clés identifiés: "
                          f"{', '.join(concepts[:3])}.",
            'creative': f"Nom créatif combinant les concepts principaux pour un impact "
                       f"mémorable dans le secteur {industry}.",
            'professional': f"Nom professionnel adapté aux standards de l'industrie "
                           f"{industry}, privilégiant la crédibilité."
        }
        
        base_explanation = explanations.get(name_type, "Nom généré selon les meilleures pratiques.")
        
        return f"{base_explanation} Le nom '{name}' reflète l'essence du projet " \
               f"tout en restant engageant et mémorable."
    
    def _generate_cache_key(self, description: str, industry: str, 
                           project_type: str, complexity: str) -> str:
        """Générer une clé de cache pour les résultats"""
        
        content = f"{description[:100]}_{industry}_{project_type}_{complexity}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def get_naming_suggestions(self, industry: str, project_type: str) -> Dict[str, List[str]]:
        """Obtenir des suggestions de nommage pour une industrie/type donné"""
        
        templates = self.name_templates.get(industry, self.name_templates['Technology'])
        
        suggestions = {
            'prefixes': templates['prefixes'][:5],
            'suffixes': templates['suffixes'][:5],
            'descriptive_words': templates['descriptive_words'][:3],
            'examples': self._generate_example_names(industry, project_type)
        }
        
        return suggestions
    
    def _generate_example_names(self, industry: str, project_type: str) -> List[str]:
        """Générer des exemples de noms pour inspiration"""
        
        templates = self.name_templates.get(industry, self.name_templates['Technology'])
        examples = []
        
        # Générer 5 exemples différents
        for i in range(5):
            if i % 2 == 0:
                # Template simple
                prefix = random.choice(templates['prefixes'])
                suffix = random.choice(templates['suffixes'])
                examples.append(f"{prefix}{suffix}")
            else:
                # Template descriptif
                prefix = random.choice(templates['prefixes'])
                desc = random.choice(templates['descriptive_words'])
                examples.append(f"{prefix} {desc}")
        
        return examples
    
    def validate_name(self, name: str) -> Dict[str, Any]:
        """Valider un nom de projet et donner des recommandations"""
        
        validation_result = {
            'is_valid': True,
            'score': 0,
            'issues': [],
            'recommendations': []
        }
        
        # Vérifications de base
        if not name or len(name.strip()) < 3:
            validation_result['is_valid'] = False
            validation_result['issues'].append("Le nom est trop court (minimum 3 caractères)")
            return validation_result
        
        name = name.strip()
        score = 10  # Score de base
        
        # Longueur optimale (5-25 caractères)
        if 5 <= len(name) <= 25:
            score += 2
        elif len(name) > 25:
            validation_result['issues'].append("Le nom est un peu long (>25 caractères)")
            score -= 1
        
        # Présence d'espaces (lisibilité)
        if ' ' in name:
            score += 1
        
        # Caractères spéciaux (à éviter)
        special_chars = set('!@#$%^&*()[]{}|;:,.<>?')
        if any(char in special_chars for char in name):
            validation_result['issues'].append("Évitez les caractères spéciaux")
            score -= 2
        
        # Nombres (acceptable mais pas idéal)
        if any(char.isdigit() for char in name):
            validation_result['recommendations'].append("Les nombres peuvent réduire la mémorabilité")
            score -= 0.5
        
        # Mots vides ou trop génériques
        generic_words = ['project', 'app', 'system', 'platform', 'projet', 'application']
        if any(word.lower() in name.lower() for word in generic_words):
            validation_result['recommendations'].append("Considérez un nom plus spécifique")
            score -= 1
        
        # Mémorabilité (mots courts et simples)
        words = name.split()
        if all(len(word) <= 8 for word in words):
            score += 1
        
        validation_result['score'] = max(0, min(10, score))
        
        # Recommandations selon le score
        if validation_result['score'] >= 8:
            validation_result['recommendations'].append("Excellent nom de projet!")
        elif validation_result['score'] >= 6:
            validation_result['recommendations'].append("Bon nom, quelques améliorations possibles")
        else:
            validation_result['recommendations'].append("Le nom pourrait être amélioré")
        
        return validation_result


# Fonctions utilitaires pour l'intégration

def generate_project_name_standalone(description: str, industry: str = 'Technology',
                                   project_type: str = 'Application Web',
                                   complexity: str = 'moyen',
                                   language: str = 'french') -> Dict[str, Any]:
    """Fonction standalone pour générer un nom de projet"""
    
    generator = MLProjectNameGenerator()
    return generator.generate_project_name(
        description, industry, project_type, complexity, language
    )


def get_industry_naming_templates(industry: str) -> Dict[str, List[str]]:
    """Obtenir les templates de nommage pour une industrie"""
    
    generator = MLProjectNameGenerator()
    return generator.name_templates.get(industry, generator.name_templates['Technology'])


# Tests unitaires intégrés
def test_name_generator():
    """Tests de base pour le générateur de noms"""
    
    generator = MLProjectNameGenerator()
    
    # Test 1: Génération basique
    result = generator.generate_project_name(
        "Application web de gestion d'hôpital avec télémédecine",
        "Healthcare",
        "Application Web",
        "complexe",
        "french"
    )
    
    assert result['recommended_name']
    assert result['confidence'] > 0.5
    assert len(result['alternatives']) >= 2
    
    # Test 2: Extraction de concepts
    concepts = generator.extract_key_concepts(
        "Plateforme e-commerce avec paiement sécurisé et gestion inventory"
    )
    
    assert len(concepts) > 0
    assert any('commerce' in concept.lower() or 'paiement' in concept.lower() 
               for concept in concepts)
    
    # Test 3: Validation de nom
    validation = generator.validate_name("SmartCare Pro")
    assert validation['is_valid']
    assert validation['score'] >= 6
    
    print("✅ Tous les tests passent!")


if __name__ == "__main__":
    # Démonstration du module
    print("=== DÉMO MODULE 7 - GÉNÉRATEUR DE NOMS ===")
    
    generator = MLProjectNameGenerator()
    
    # Exemples de génération
    test_cases = [
        {
            'description': "Application mobile de suivi de santé avec IoT",
            'industry': "Healthcare",
            'project_type': "Application Mobile",
            'complexity': "complexe"
        },
        {
            'description': "Plateforme e-commerce B2B avec IA",
            'industry': "Retail",
            'project_type': "Application Web",
            'complexity': "expert"
        },
        {
            'description': "Système de gestion scolaire simple",
            'industry': "Education",
            'project_type': "Système",
            'complexity': "simple"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n--- Test {i} ---")
        result = generator.generate_project_name(
            case['description'],
            case['industry'],
            case['project_type'],
            case['complexity']
        )
        
        print(f"Description: {case['description']}")
        print(f"Nom recommandé: {result['recommended_name']}")
        print(f"Type: {result['name_type']} (confiance: {result['confidence']:.1f})")
        print(f"Alternatives: {', '.join(result['alternatives'][:2])}")
        print(f"Raisonnement: {result['reasoning']}")
    
    # Test de validation
    print(f"\n--- Test de validation ---")
    validation = generator.validate_name("SmartHealthCare Pro")
    print(f"Nom: SmartHealthCare Pro")
    print(f"Score: {validation['score']}/10")
    print(f"Valide: {validation['is_valid']}")
    if validation['recommendations']:
        print(f"Recommandations: {validation['recommendations'][0]}")
    
    print(f"\n✅ Module 7 opérationnel!")