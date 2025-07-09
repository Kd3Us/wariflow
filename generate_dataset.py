import pandas as pd
import random
import json
from typing import List, Dict, Any

def generate_comprehensive_dataset(num_samples: int = 2000) -> pd.DataFrame:
    """Générer un dataset complet et réaliste pour l'entraînement"""
    
    # Définitions détaillées des industries avec patterns réels
    industries_data = {
        'Technology': {
            'descriptions_fr': [
                "Développement d'une plateforme SaaS de gestion de projets avec API REST",
                "Application mobile native iOS/Android pour la collaboration d'équipe",
                "Système de gestion de contenu avec interface React et backend Node.js",
                "Plateforme d'intelligence artificielle pour l'analyse de données",
                "Solution de cybersécurité avec détection d'intrusion en temps réel",
                "Application web de commerce électronique avec paiement Stripe",
                "Plateforme de développement low-code pour applications métier",
                "Système de gestion de base de données distribuée avec MongoDB",
                "Application de réalité augmentée pour la formation industrielle",
                "Plateforme blockchain pour la traçabilité des produits",
                "Solution DevOps avec intégration continue et déploiement automatisé",
                "Application de machine learning pour la prédiction de ventes",
                "Système de surveillance des performances avec monitoring temps réel",
                "Plateforme de développement d'API avec documentation automatique",
                "Application de géolocalisation avec cartes interactives Google Maps",
                "Solution de stockage cloud sécurisé avec chiffrement end-to-end",
                "Système de gestion des versions avec Git et interface web",
                "Application de chat en temps réel avec WebSocket et notifications push",
                "Plateforme d'analyse de données avec dashboards interactifs",
                "Solution de virtualisation avec Docker et Kubernetes"
            ],
            'descriptions_en': [
                "SaaS project management platform development with REST API integration",
                "Native iOS/Android mobile application for team collaboration",
                "Content management system with React frontend and Node.js backend",
                "Artificial intelligence platform for advanced data analytics",
                "Cybersecurity solution with real-time intrusion detection system",
                "E-commerce web application with Stripe payment integration",
                "Low-code development platform for enterprise applications",
                "Distributed database management system using MongoDB",
                "Augmented reality application for industrial training programs",
                "Blockchain platform for product traceability and verification",
                "DevOps solution with continuous integration and automated deployment",
                "Machine learning application for sales prediction and forecasting",
                "Performance monitoring system with real-time alerts",
                "API development platform with automated documentation generation",
                "Geolocation application with interactive Google Maps integration",
                "Secure cloud storage solution with end-to-end encryption",
                "Version control system with Git and web-based interface",
                "Real-time chat application with WebSocket and push notifications",
                "Data analytics platform with interactive dashboard visualization",
                "Virtualization solution using Docker containers and Kubernetes"
            ],
            'complexity_indicators': [
                'microservices', 'kubernetes', 'machine learning', 'blockchain', 'real-time',
                'distributed', 'scalable', 'high-performance', 'security', 'enterprise'
            ]
        },
        'Healthcare': {
            'descriptions_fr': [
                "Système de gestion des dossiers médicaux électroniques conforme HIPAA",
                "Application de télémédecine avec consultation vidéo sécurisée",
                "Plateforme de suivi des patients avec IoT et capteurs médicaux",
                "Système de prescription électronique avec vérification des interactions",
                "Application mobile de suivi de la santé avec synchronisation wearables",
                "Plateforme de recherche clinique avec gestion des essais thérapeutiques",
                "Système de gestion hospitalière avec planification des ressources",
                "Application d'imagerie médicale avec intelligence artificielle diagnostique",
                "Plateforme de télésurveillance pour patients chroniques",
                "Système de gestion des rendez-vous médicaux avec rappels automatiques",
                "Application de formation médicale avec réalité virtuelle",
                "Plateforme de pharmacovigilance avec détection d'effets indésirables",
                "Système de gestion des laboratoires avec traçabilité des échantillons",
                "Application de rééducation avec gamification et suivi progrès",
                "Plateforme de coordination des soins entre professionnels de santé"
            ],
            'descriptions_en': [
                "HIPAA-compliant electronic medical records management system",
                "Telemedicine application with secure video consultation platform",
                "Patient monitoring platform with IoT sensors and medical devices",
                "Electronic prescription system with drug interaction verification",
                "Mobile health tracking application with wearable device synchronization",
                "Clinical research platform for therapeutic trial management",
                "Hospital management system with resource planning and optimization",
                "Medical imaging application with AI-powered diagnostic assistance",
                "Remote patient monitoring platform for chronic disease management",
                "Medical appointment scheduling system with automated reminders",
                "Medical training application using virtual reality simulation",
                "Pharmacovigilance platform with adverse event detection system",
                "Laboratory management system with sample traceability",
                "Rehabilitation application with gamification and progress tracking",
                "Healthcare coordination platform for inter-professional communication"
            ],
            'complexity_indicators': [
                'HIPAA', 'medical-grade', 'clinical', 'diagnostic', 'compliance',
                'patient-safety', 'regulatory', 'telemedicine', 'AI-diagnostic'
            ]
        },
        'Finance': {
            'descriptions_fr': [
                "Application de trading algorithmique avec analyse technique avancée",
                "Plateforme bancaire mobile avec authentification biométrique",
                "Système de gestion de portefeuille avec optimisation automatique",
                "Application de paiement peer-to-peer avec blockchain",
                "Plateforme de crédit en ligne avec scoring automatisé",
                "Système de détection de fraude avec machine learning",
                "Application de gestion des risques financiers en temps réel",
                "Plateforme de crowdfunding avec vérification KYC automatique",
                "Système de comptabilité automatisée avec IA",
                "Application de conseil en investissement avec robo-advisor",
                "Plateforme de change de devises avec taux en temps réel",
                "Système de conformité réglementaire avec rapports automatiques",
                "Application de gestion des dépenses d'entreprise",
                "Plateforme d'assurance avec souscription digitale",
                "Système de facturation électronique avec intégration ERP"
            ],
            'descriptions_en': [
                "Algorithmic trading application with advanced technical analysis",
                "Mobile banking platform with biometric authentication system",
                "Portfolio management system with automated optimization algorithms",
                "Peer-to-peer payment application using blockchain technology",
                "Online lending platform with automated credit scoring",
                "Fraud detection system using machine learning algorithms",
                "Real-time financial risk management application",
                "Crowdfunding platform with automated KYC verification",
                "Automated accounting system with artificial intelligence",
                "Investment advisory application with robo-advisor functionality",
                "Currency exchange platform with real-time rate updates",
                "Regulatory compliance system with automated reporting",
                "Enterprise expense management application",
                "Digital insurance platform with online underwriting",
                "Electronic invoicing system with ERP integration"
            ],
            'complexity_indicators': [
                'algorithmic', 'high-frequency', 'compliance', 'PCI-DSS', 'KYC',
                'anti-fraud', 'regulatory', 'real-time-trading', 'risk-management'
            ]
        },
        'Education': {
            'descriptions_fr': [
                "Plateforme d'apprentissage en ligne avec parcours adaptatifs",
                "Application de gestion scolaire avec suivi des élèves",
                "Système de formation professionnelle avec certification",
                "Plateforme de cours vidéo avec streaming adaptatif",
                "Application de gamification pour l'apprentissage des langues",
                "Système de gestion des examens avec surveillance à distance",
                "Plateforme de collaboration étudiante avec outils de projet",
                "Application de réalité virtuelle pour l'enseignement scientifique",
                "Système de recommandation de cours avec IA",
                "Plateforme de formation en entreprise avec tracking ROI"
            ],
            'descriptions_en': [
                "Online learning platform with adaptive learning paths",
                "School management application with student progress tracking",
                "Professional training system with certification management",
                "Video course platform with adaptive streaming technology",
                "Gamified language learning application with progress tracking",
                "Remote examination management system with proctoring",
                "Student collaboration platform with project management tools",
                "Virtual reality application for scientific education",
                "AI-powered course recommendation system",
                "Corporate training platform with ROI tracking and analytics"
            ],
            'complexity_indicators': [
                'adaptive-learning', 'LMS', 'SCORM', 'video-streaming', 'gamification',
                'assessment', 'collaboration', 'mobile-learning'
            ]
        },
        'Retail': {
            'descriptions_fr': [
                "Plateforme e-commerce omnicanale avec gestion des stocks",
                "Application mobile de shopping avec réalité augmentée",
                "Système de gestion des commandes avec livraison prédictive",
                "Plateforme marketplace B2B avec catalogue dynamique",
                "Application de fidélisation client avec recommandations IA",
                "Système de caisse intelligente avec reconnaissance d'objets",
                "Plateforme de dropshipping automatisé avec intégrations",
                "Application de shopping social avec partage communautaire",
                "Système d'optimisation des prix avec analyse concurrentielle"
            ],
            'descriptions_en': [
                "Omnichannel e-commerce platform with inventory management",
                "Mobile shopping application with augmented reality features",
                "Order management system with predictive delivery optimization",
                "B2B marketplace platform with dynamic catalog management",
                "Customer loyalty application with AI-powered recommendations",
                "Smart checkout system with object recognition technology",
                "Automated dropshipping platform with multi-vendor integration",
                "Social shopping application with community sharing features",
                "Price optimization system with competitive analysis algorithms"
            ],
            'complexity_indicators': [
                'omnichannel', 'inventory', 'marketplace', 'recommendation-engine',
                'payment-processing', 'logistics', 'CRM-integration'
            ]
        },
        'Manufacturing': {
            'descriptions_fr': [
                "Système MES de gestion de production avec IoT industriel",
                "Application de maintenance prédictive avec capteurs",
                "Plateforme de gestion de la chaîne d'approvisionnement",
                "Système de contrôle qualité automatisé avec vision par ordinateur",
                "Application de planification de production avec optimisation",
                "Plateforme de traçabilité produit avec blockchain",
                "Système de gestion des équipements avec réalité augmentée"
            ],
            'descriptions_en': [
                "MES production management system with industrial IoT integration",
                "Predictive maintenance application with sensor monitoring",
                "Supply chain management platform with real-time tracking",
                "Automated quality control system with computer vision",
                "Production planning application with optimization algorithms",
                "Product traceability platform using blockchain technology",
                "Equipment management system with augmented reality support"
            ],
            'complexity_indicators': [
                'IoT', 'predictive-maintenance', 'computer-vision', 'optimization',
                'real-time-monitoring', 'industrial-automation'
            ]
        },
        'Construction': {
            'descriptions_fr': [
                "Application de gestion de chantier avec suivi géolocalisé",
                "Système BIM de modélisation 3D collaborative",
                "Plateforme de gestion des ressources et planning",
                "Application de sécurité chantier avec alertes temps réel",
                "Système de gestion documentaire pour projets BTP",
                "Plateforme de coordination des corps de métiers"
            ],
            'descriptions_en': [
                "Construction site management application with GPS tracking",
                "BIM 3D collaborative modeling system for construction",
                "Resource management and scheduling platform",
                "Construction safety application with real-time alerts",
                "Document management system for construction projects",
                "Trade coordination platform for construction professionals"
            ],
            'complexity_indicators': [
                'BIM', '3D-modeling', 'GPS-tracking', 'project-management',
                'safety-compliance', 'resource-optimization'
            ]
        },
        'Transportation': {
            'descriptions_fr': [
                "Application de gestion de flotte avec optimisation des tournées",
                "Système de suivi logistique en temps réel avec IoT",
                "Plateforme de covoiturage avec algorithme de matching",
                "Application de transport public avec horaires prédictifs",
                "Système de gestion du trafic avec IA prédictive",
                "Plateforme de livraison autonome avec drones"
            ],
            'descriptions_en': [
                "Fleet management application with route optimization",
                "Real-time logistics tracking system with IoT integration",
                "Ridesharing platform with intelligent matching algorithms",
                "Public transport application with predictive scheduling",
                "Traffic management system with predictive AI algorithms",
                "Autonomous delivery platform using drone technology"
            ],
            'complexity_indicators': [
                'route-optimization', 'real-time-tracking', 'fleet-management',
                'predictive-algorithms', 'autonomous-vehicles'
            ]
        }
    }
    
    # Générer le dataset
    dataset = []
    samples_per_industry = num_samples // len(industries_data)
    
    for industry, data in industries_data.items():
        # Descriptions françaises
        fr_descriptions = data['descriptions_fr']
        en_descriptions = data['descriptions_en']
        complexity_indicators = data['complexity_indicators']
        
        # Générer des échantillons pour cette industrie
        for i in range(samples_per_industry):
            if i % 2 == 0:
                # Utiliser une description française
                base_desc = random.choice(fr_descriptions)
                language = 'french'
            else:
                # Utiliser une description anglaise
                base_desc = random.choice(en_descriptions)
                language = 'english'
            
            # Ajouter de la variation
            description = add_variation_to_description(base_desc, complexity_indicators)
            
            # Calculer la complexité basée sur les indicateurs
            complexity = calculate_complexity_from_description(description, complexity_indicators)
            
            # Estimer la durée basée sur la complexité
            duration = estimate_duration_from_complexity(complexity, description)
            
            dataset.append({
                'description': description,
                'industry': industry,
                'complexity': complexity,
                'estimated_duration': duration,
                'language': language,
                'project_type': infer_project_type(description),
                'priority': infer_priority(description),
                'tech_density': calculate_tech_density(description),
                'business_density': calculate_business_density(description)
            })
    
    return pd.DataFrame(dataset)

def add_variation_to_description(base_desc: str, complexity_indicators: List[str]) -> str:
    """Ajouter de la variation à une description de base"""
    variations = [
        f"Développement d'un {base_desc.lower()}",
        f"Création d'une {base_desc.lower()}",
        f"Mise en place d'un {base_desc.lower()}",
        f"Implémentation d'une {base_desc.lower()}",
        base_desc
    ]
    
    varied_desc = random.choice(variations)
    
    # Ajouter parfois des indicateurs de complexité
    if random.random() > 0.7:
        indicator = random.choice(complexity_indicators)
        varied_desc += f" avec {indicator}"
    
    # Ajouter parfois des contraintes
    constraints = [
        "avec haute performance",
        "sécurisé et scalable",
        "avec interface utilisateur moderne",
        "intégrant des APIs externes",
        "avec analytics avancés",
        "multi-plateforme",
        "avec authentification SSO"
    ]
    
    if random.random() > 0.8:
        constraint = random.choice(constraints)
        varied_desc += f" {constraint}"
    
    return varied_desc

def calculate_complexity_from_description(description: str, indicators: List[str]) -> str:
    """Calculer la complexité basée sur la description"""
    desc_lower = description.lower()
    complexity_score = 0
    
    # Compter les indicateurs de complexité
    for indicator in indicators:
        if indicator.lower() in desc_lower:
            complexity_score += 1
    
    # Autres indicateurs généraux
    complex_terms = [
        'machine learning', 'ai', 'blockchain', 'microservices', 'real-time',
        'scalable', 'distributed', 'high-performance', 'enterprise'
    ]
    
    for term in complex_terms:
        if term in desc_lower:
            complexity_score += 1
    
    # Longueur du texte
    if len(description.split()) > 15:
        complexity_score += 1
    
    # Déterminer le niveau
    if complexity_score <= 1:
        return 'simple'
    elif complexity_score <= 3:
        return 'moyen'
    elif complexity_score <= 5:
        return 'complexe'
    else:
        return 'expert'

def estimate_duration_from_complexity(complexity: str, description: str) -> int:
    """Estimer la durée basée sur la complexité"""
    base_durations = {
        'simple': 30,
        'moyen': 60,
        'complexe': 90,
        'expert': 120
    }
    
    base = base_durations[complexity]
    
    # Ajustements basés sur le type de projet
    if 'mobile' in description.lower():
        base += 15
    if 'web' in description.lower():
        base += 10
    if 'api' in description.lower():
        base += 5
    
    # Variation aléatoire
    variation = random.randint(-10, 20)
    
    return max(base + variation, 7)  # Minimum 1 semaine

def infer_project_type(description: str) -> str:
    """Inférer le type de projet"""
    desc_lower = description.lower()
    
    if 'mobile' in desc_lower or 'ios' in desc_lower or 'android' in desc_lower:
        return 'Application Mobile'
    elif 'api' in desc_lower or 'rest' in desc_lower:
        return 'API REST'
    elif 'saas' in desc_lower or 'plateforme' in desc_lower:
        return 'SaaS'
    elif 'web' in desc_lower or 'site' in desc_lower:
        return 'Application Web'
    elif 'système' in desc_lower or 'system' in desc_lower:
        return 'Système'
    else:
        return 'Application Web'

def infer_priority(description: str) -> str:
    """Inférer la priorité"""
    desc_lower = description.lower()
    
    high_priority_terms = [
        'critique', 'urgent', 'priorité', 'sécurité', 'compliance',
        'critical', 'urgent', 'security', 'real-time'
    ]
    
    if any(term in desc_lower for term in high_priority_terms):
        return 'HIGH'
    elif 'optimisation' in desc_lower or 'amélioration' in desc_lower:
        return 'MEDIUM'
    else:
        return random.choice(['LOW', 'MEDIUM', 'HIGH'])

def calculate_tech_density(description: str) -> float:
    """Calculer la densité de termes techniques"""
    tech_terms = [
        'api', 'backend', 'frontend', 'database', 'cloud', 'docker',
        'kubernetes', 'microservices', 'react', 'angular', 'vue',
        'python', 'java', 'javascript', 'nodejs', 'mongodb', 'postgresql'
    ]
    
    words = description.lower().split()
    tech_count = sum(1 for word in words if word in tech_terms)
    
    return tech_count / len(words) if words else 0

def calculate_business_density(description: str) -> float:
    """Calculer la densité de termes business"""
    business_terms = [
        'gestion', 'client', 'utilisateur', 'business', 'vente', 'marketing',
        'management', 'customer', 'user', 'sales', 'revenue', 'profit'
    ]
    
    words = description.lower().split()
    business_count = sum(1 for word in words if word in business_terms)
    
    return business_count / len(words) if words else 0

def save_dataset_files():
    """Générer et sauvegarder le dataset complet"""
    print("Génération du dataset complet...")
    
    # Générer le dataset principal
    df = generate_comprehensive_dataset(2000)
    
    print(f"Dataset généré avec {len(df)} échantillons")
    print(f"Industries: {df['industry'].value_counts().to_dict()}")
    print(f"Complexités: {df['complexity'].value_counts().to_dict()}")
    
    # Sauvegarder en CSV
    df.to_csv('training_dataset.csv', index=False, encoding='utf-8')
    print("Dataset sauvegardé dans 'training_dataset.csv'")
    
    # Créer un dataset de test séparé
    test_df = generate_comprehensive_dataset(500)
    test_df.to_csv('test_dataset.csv', index=False, encoding='utf-8')
    print("Dataset de test sauvegardé dans 'test_dataset.csv'")
    
    # Statistiques
    print("\nStatistiques du dataset:")
    print(f"Durée moyenne: {df['estimated_duration'].mean():.1f} jours")
    print(f"Densité tech moyenne: {df['tech_density'].mean():.3f}")
    print(f"Densité business moyenne: {df['business_density'].mean():.3f}")
    
    # Exemples
    print("\nExemples d'échantillons:")
    for industry in df['industry'].unique()[:3]:
        sample = df[df['industry'] == industry].iloc[0]
        print(f"\n{industry}:")
        print(f"  Description: {sample['description'][:100]}...")
        print(f"  Complexité: {sample['complexity']}")
        print(f"  Durée: {sample['estimated_duration']} jours")

if __name__ == "__main__":
    save_dataset_files()