"""
Module Orchestrateur Principal - CORRIGÉ
Corrections des erreurs de prédiction et de variables manquantes
Avec détection de langue centralisée utilisée PARTOUT
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import asyncio
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from datetime import datetime
import json
import traceback

from module_1_industry import MLIndustryClassifier
from module_2_complexity import MLComplexityDurationPredictor  
from module_3_project_type import MLProjectTypeStackPredictor
from module_4_task_generator import MLTaskGenerator
from module_5_business import MLBusinessProjectGenerator
from module_6_risks import MLRiskOpportunityAnalyzer
from language_detector import detect_project_language

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectAnalysisRequest(BaseModel):
    """Modèle de requête pour l'analyse de projet"""
    description: str
    additional_context: Optional[str] = None
    preferred_language: Optional[str] = None  # 'french' ou 'english'
    max_tasks: Optional[int] = 5

class ProjectOrchestrator:
    """Orchestrateur principal gérant les 6 modules ML"""
    
    def __init__(self):
        # Cache en mémoire pour optimiser les performances
        self.cache = {}
        self.cache_lock = threading.Lock()
        
        # Pool de threads limité pour éviter la surchauffe
        self.thread_pool = ThreadPoolExecutor(max_workers=3)
        
        # Instances des modules (lazy loading)
        self._modules = {}
        self._modules_loaded = False
        
        # Statistiques de performance
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'average_processing_time': 0.0
        }
    
    def _load_modules(self):
        """Chargement lazy des modules ML avec gestion d'erreurs renforcée"""
        if self._modules_loaded:
            return
        
        try:
            logger.info("Chargement des modules ML...")
            
            # Module 1: Classification d'industrie
            try:
                self._modules['industry'] = MLIndustryClassifier()
                logger.info("Module industry chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module industry: {e}")
                raise
            
            # Module 2: Complexité et durée
            try:
                self._modules['complexity'] = MLComplexityDurationPredictor()
                logger.info("Module complexity chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module complexity: {e}")
                raise
            
            # Module 3: Type de projet et stack
            try:
                self._modules['project_type'] = MLProjectTypeStackPredictor()
                logger.info("Module project_type chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module project_type: {e}")
                raise
            
            # Module 4: Générateur de tâches
            try:
                self._modules['task_generator'] = MLTaskGenerator()
                logger.info("Module task_generator chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module task_generator: {e}")
                raise
            
            # Module 5: Générateur business
            try:
                self._modules['business'] = MLBusinessProjectGenerator()
                logger.info("Module business chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module business: {e}")
                raise
            
            # Module 6: Analyseur de risques
            try:
                self._modules['risks'] = MLRiskOpportunityAnalyzer()
                logger.info("Module risks chargé")
            except Exception as e:
                logger.error(f"Erreur chargement module risks: {e}")
                raise
            
            # Entraînement des modèles si nécessaire
            self._train_models_if_needed()
            
            self._modules_loaded = True
            logger.info("Tous les modules chargés avec succès!")
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement des modules: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Erreur de chargement: {str(e)}")
    
    def _train_models_if_needed(self):
        """Entraîner les modèles si pas déjà fait avec gestion d'erreurs"""
        for module_name, module in self._modules.items():
            try:
                if hasattr(module, 'is_trained') and not module.is_trained:
                    logger.info(f"Entraînement du module {module_name}...")
                    module.train_model()
                elif hasattr(module, 'is_trained'):
                    logger.info(f"Module {module_name} n'a pas besoin d'entraînement")
                else:
                    logger.info(f"Module {module_name} déjà entraîné ou pas d'attribut is_trained")
            except Exception as e:
                logger.error(f"Erreur lors de l'entraînement du module {module_name}: {e}")
                # Continue avec les autres modules
                continue
    
    def _get_cache_key(self, description: str, additional_context: str = "", language: str = "") -> str:
        """Générer une clé de cache (mise à jour pour inclure la langue)"""
        content = f"{description}_{additional_context}_{language}".lower().strip()
        return str(hash(content))
    
    def _check_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Vérifier le cache"""
        with self.cache_lock:
            return self.cache.get(cache_key)
    
    def _update_cache(self, cache_key: str, result: Dict[str, Any]):
        """Mettre à jour le cache"""
        with self.cache_lock:
            self.cache[cache_key] = result
            # Limiter la taille du cache (garde les 100 derniers)
            if len(self.cache) > 100:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
    
    def _execute_base_modules_parallel(self, description: str, detected_language: str) -> Dict[str, Any]:
        """Exécution parallèle des 3 modules de base avec langue centralisée"""
        logger.info("Exécution parallèle des modules de base...")
        
        base_results = {}
        futures = {}
        
        try:
            # Lancer les 3 modules en parallèle avec la langue détectée
            try:
                futures['industry'] = self.thread_pool.submit(
                    self._safe_predict_industry, description, detected_language  # ✅ Langue passée
                )
            except Exception as e:
                logger.error(f"Erreur soumission module industry: {e}")
                raise
            
            try:
                futures['complexity'] = self.thread_pool.submit(
                    self._safe_predict_complexity, description, detected_language  # ✅ Langue passée
                )
            except Exception as e:
                logger.error(f"Erreur soumission module complexity: {e}")
                raise
            
            try:
                futures['project_type'] = self.thread_pool.submit(
                    self._safe_predict_project_type, description, detected_language  # ✅ Langue passée
                )
            except Exception as e:
                logger.error(f"Erreur soumission module project_type: {e}")
                raise
            
            # Collecter les résultats avec timeout
            for module_name, future in futures.items():
                try:
                    result = future.result(timeout=30)  # 30s max par module
                    base_results[module_name] = result
                    logger.info(f"Module {module_name} terminé avec succès")
                except Exception as e:
                    logger.error(f"Erreur dans le module {module_name}: {e}")
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    # Créer un résultat de fallback au lieu de lever une exception
                    base_results[module_name] = self._create_fallback_result(module_name)
                    logger.warning(f"Utilisation du résultat de fallback pour {module_name}")
            
            return base_results
            
        except Exception as e:
            logger.error(f"Erreur générale dans _execute_base_modules_parallel: {e}")
            # Annuler tous les futures en cours
            for future in futures.values():
                future.cancel()
            raise e
    
    def _safe_predict_industry(self, description: str, language: str) -> Dict[str, Any]:
        """Prédiction d'industrie avec langue centralisée"""
        try:
            result = self._modules['industry'].predict_industry(description, language)  # ✅ Passer la langue
            # Vérifier que le résultat contient les clés attendues
            if 'industry' not in result:
                logger.warning("Clé 'industry' manquante, ajout avec valeur par défaut")
                result['industry'] = 'Technology'
            return result
        except Exception as e:
            logger.error(f"Erreur dans _safe_predict_industry: {e}")
            return {
                'industry': 'Technology',
                'confidence': 0.5,
                'method': 'fallback',
                'error': str(e)
            }
    
    def _safe_predict_complexity(self, description: str, language: str) -> Dict[str, Any]:
        """Prédiction de complexité avec langue centralisée"""
        try:
            result = self._modules['complexity'].predict_complexity_and_duration(description, language=language)  # ✅ Passer la langue
            # Vérifier que le résultat contient les clés attendues
            if 'complexity' not in result:
                result['complexity'] = 'moyen'
            if 'estimated_duration_days' not in result:
                result['estimated_duration_days'] = 45
            return result
        except Exception as e:
            logger.error(f"Erreur dans _safe_predict_complexity: {e}")
            return {
                'complexity': 'moyen',
                'estimated_duration_days': 45,
                'working_days': 32,
                'method': 'fallback',
                'error': str(e)
            }
    
    def _safe_predict_project_type(self, description: str, language: str) -> Dict[str, Any]:
        """Prédiction de type de projet avec langue centralisée"""
        try:
            result = self._modules['project_type'].predict_project_type_and_stack(description, language=language)  # ✅ Passer la langue
            # Vérifier que le résultat contient les clés attendues
            if 'project_type' not in result:
                result['project_type'] = 'Application Web'
            return result
        except Exception as e:
            logger.error(f"Erreur dans _safe_predict_project_type: {e}")
            return {
                'project_type': 'Application Web',
                'confidence': 0.5,
                'main_stack': 'React/Node.js',
                'method': 'fallback',
                'error': str(e)
            }
    
    def _create_fallback_result(self, module_name: str) -> Dict[str, Any]:
        """Créer un résultat de fallback en cas d'erreur"""
        fallback_results = {
            'industry': {
                'industry': 'Technology',
                'confidence': 0.5,
                'method': 'fallback'
            },
            'complexity': {
                'complexity': 'moyen',
                'estimated_duration_days': 45,
                'working_days': 32,
                'method': 'fallback'
            },
            'project_type': {
                'project_type': 'Application Web',
                'confidence': 0.5,
                'main_stack': 'React/Node.js',
                'method': 'fallback'
            }
        }
        return fallback_results.get(module_name, {'error': 'Module inconnu'})
    
    def _execute_advanced_modules_sequential(self, description: str, base_results: Dict[str, Any], 
                                           request: ProjectAnalysisRequest, detected_language: str) -> Dict[str, Any]:
        """Exécution séquentielle des 3 modules avancés avec langue centralisée"""
        logger.info("Exécution séquentielle des modules avancés...")
        
        advanced_results = {}
        
        try:
            # Extraire les infos des modules de base avec valeurs par défaut
            industry = base_results.get('industry', {}).get('predicted_industry', 'Technology')
            complexity = base_results.get('complexity', {}).get('predicted_complexity', 'moyen')
            project_type = base_results.get('project_type', {}).get('predicted_type', 'Application Web')
            duration = base_results.get('complexity', {}).get('predicted_duration', 45)
            
            logger.info(f"Variables extraites - Industry: {industry}, Complexity: {complexity}, Type: {project_type}, Duration: {duration}")
            
            # Module 4: Générateur de tâches avec langue centralisée
            try:
                logger.info("Génération des tâches ML...")
                max_tasks_count = request.max_tasks if hasattr(request, 'max_tasks') and request.max_tasks else 5
                advanced_results['tasks'] = self._modules['task_generator'].generate_tasks_from_description(
                    description, industry, complexity, max_tasks_count, language=detected_language  # ✅ Passer la langue
                )
                logger.info("Module task_generator terminé avec succès")
            except Exception as e:
                logger.error(f"Erreur dans module task_generator: {e}")
                advanced_results['tasks'] = {
                    'generated_tasks': [],
                    'error': str(e),
                    'method': 'fallback'
                }
            
            # Module 5: Générateur business avec langue centralisée
            try:
                logger.info("Génération de l'analyse business...")
                advanced_results['business'] = self._modules['business'].generate_complete_business_project(
                    description, industry, complexity, duration, project_type, language=detected_language  # ✅ Passer la langue
                )
                logger.info("Module business terminé avec succès")
            except Exception as e:
                logger.error(f"Erreur dans module business: {e}")
                advanced_results['business'] = {
                    'business_model': {'model_type': 'Non défini'},
                    'milestones': [],
                    'market_analysis': {'primary_segment': 'Non défini', 'growth_opportunities': []},
                    'error': str(e),
                    'method': 'fallback'
                }
            
            # Module 6: Analyseur de risques avec langue centralisée
            try:
                logger.info("Analyse des risques et opportunités...")
                advanced_results['risks'] = self._modules['risks'].analyze_project_risks_opportunities(
                    description, industry, complexity, language=detected_language  # ✅ Passer la langue
                )
                logger.info("Module risks terminé avec succès")
            except Exception as e:
                logger.error(f"Erreur dans module risks: {e}")
                advanced_results['risks'] = {
                    'risks': [],
                    'opportunities': [],
                    'error': str(e),
                    'method': 'fallback'
                }
            
            return advanced_results
            
        except Exception as e:
            logger.error(f"Erreur dans les modules avancés: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Retourner des résultats de fallback au lieu de lever une exception
            return {
                'tasks': {'generated_tasks': [], 'error': 'Échec génération tâches'},
                'business': {'business_model': 'Non défini', 'error': 'Échec analyse business'},
                'risks': {'risks': [], 'opportunities': [], 'error': 'Échec analyse risques'}
            }
    
    async def analyze_project(self, request: ProjectAnalysisRequest) -> Dict[str, Any]:
        """Analyse complète de projet avec gestion d'erreurs robuste et détection de langue centralisée"""
        start_time = time.time()
        
        try:
            self.stats['total_requests'] += 1
            
            # Chargement des modules
            self._load_modules()
            
            # Préparer les données
            description = request.description.strip()
            additional_context = request.additional_context or ""
            
            if len(description) < 10:
                raise HTTPException(status_code=400, detail="Description trop courte (minimum 10 caractères)")
            
            # ✅ DÉTECTION CENTRALISÉE DE LA LANGUE
            detected_language = detect_project_language(
                description, 
                additional_context, 
                request.preferred_language
            )
            
            logger.info(f"🌍 Langue détectée centralisée: {detected_language}")
            
            # Vérifier le cache (inclut maintenant la langue dans la clé)
            cache_key = self._get_cache_key(description, additional_context, detected_language)
            cached_result = self._check_cache(cache_key)
            if cached_result:
                logger.info("Résultat trouvé dans le cache")
                return cached_result
            
            # Exécution parallèle des modules de base avec langue centralisée
            base_results = self._execute_base_modules_parallel(description, detected_language)
            
            # Exécution séquentielle des modules avancés avec langue centralisée
            advanced_results = self._execute_advanced_modules_sequential(
                description, 
                base_results, 
                request, 
                detected_language
            )
            
            # Assemblage de la réponse finale
            processing_time = time.time() - start_time
            final_response = self._assemble_final_response(
                base_results, 
                advanced_results, 
                processing_time, 
                detected_language
            )
            
            # Mise à jour du cache et des statistiques
            self._update_cache(cache_key, final_response)
            self.stats['successful_requests'] += 1
            self.stats['average_processing_time'] = (
                (self.stats['average_processing_time'] * (self.stats['successful_requests'] - 1) + processing_time) 
                / self.stats['successful_requests']
            )
            
            logger.info(f"Analyse terminée en {processing_time:.2f}s")
            return final_response
            
        except HTTPException:
            raise
        except Exception as e:
            self.stats['total_requests'] += 1
            logger.error(f"Erreur lors de l'analyse: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def _assemble_final_response(self, base_results: Dict[str, Any], 
                                advanced_results: Dict[str, Any], 
                                processing_time: float,
                                detected_language: str) -> Dict[str, Any]:
        """Assemblage de la réponse finale structurée avec gestion des erreurs"""
        
        try:
            # Extraire les informations principales avec les BONNES clés
            industry_data = base_results.get('industry', {})
            complexity_data = base_results.get('complexity', {})
            project_type_data = base_results.get('project_type', {})
            
            return {
                "success": True,
                "detected_language": detected_language,  # ✅ Langue centralisée
                "analysis": {
                    "project_classification": {
                        "industry": industry_data.get('industry', 'Technology'),
                        "industry_confidence": industry_data.get('confidence', 0.0),
                        "complexity": complexity_data.get('complexity', 'moyen'),
                        "complexity_factors": complexity_data.get('complexity_analysis', {}).get('main_contributors', []),
                        "project_type": project_type_data.get('project_type', 'Application Web'),
                        "type_confidence": project_type_data.get('confidence', 0.0),
                        "duration_estimate": {
                            "total_days": complexity_data.get('estimated_duration_days', 45),
                            "business_days": complexity_data.get('working_days', 32),
                            "phases": complexity_data.get('duration_analysis', {}).get('phases', {})
                        }
                    },
                    "technical_analysis": {
                        "recommended_tech_stack": project_type_data.get('main_stack', 'React/Node.js'),
                        "stack_alternatives": project_type_data.get('alternatives', []),
                        "infrastructure_needs": project_type_data.get('infrastructure', {}),
                        "development_phases": project_type_data.get('phases', [])
                    },
                    "project_tasks": {
                        "ml_generated_tasks": advanced_results.get('tasks', []),
                        "task_count": len(advanced_results.get('tasks', [])) if isinstance(advanced_results.get('tasks'), list) else 0,
                        "estimated_workload": sum(task.get('estimatedHours', 0) for task in advanced_results.get('tasks', []) if isinstance(task, dict))
                    },
                    "business_analysis": {
                        "business_model": advanced_results.get('business', {}).get('business_model', 'Non défini'),
                        "target_market": advanced_results.get('business', {}).get('target_market', 'Non défini'),
                        "competitive_analysis": advanced_results.get('business', {}).get('competitive_analysis', {}),
                        "revenue_streams": advanced_results.get('business', {}).get('revenue_streams', []),
                        "market_opportunities": advanced_results.get('business', {}).get('market_opportunities', [])
                    },
                    "risk_analysis": {
                        "identified_risks": advanced_results.get('risks', {}).get('risks', []),
                        "opportunities": advanced_results.get('risks', {}).get('opportunities', []),
                        "risk_mitigation": advanced_results.get('risks', {}).get('mitigation_strategies', []),
                        "success_factors": advanced_results.get('risks', {}).get('success_factors', [])
                    }
                },
                "metadata": {
                    "processing_time_seconds": round(processing_time, 2),
                    "language_info": {
                        "detected_language": detected_language,
                        "source": "centralized_detector",  # ✅ Indique la source
                        "confidence": "high"
                    },
                    "modules_status": {
                        "industry": "success" if 'error' not in industry_data else "fallback",
                        "complexity": "success" if 'error' not in complexity_data else "fallback",
                        "project_type": "success" if 'error' not in project_type_data else "fallback",
                        "tasks": "success" if 'error' not in advanced_results.get('tasks', {}) else "fallback",
                        "business": "success" if 'error' not in advanced_results.get('business', {}) else "fallback",
                        "risks": "success" if 'error' not in advanced_results.get('risks', {}) else "fallback"
                    },
                    "api_version": "1.0.0",
                    "timestamp": datetime.now().isoformat()
                }
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'assemblage de la réponse: {e}")
            return {
                "success": False,
                "error": f"Erreur d'assemblage: {str(e)}",
                "detected_language": detected_language,
                "processing_time_seconds": round(processing_time, 2),
                "timestamp": datetime.now().isoformat()
            }

# Instance globale de l'orchestrateur
orchestrator = ProjectOrchestrator()

# Application FastAPI
app = FastAPI(
    title="AI Project Analyzer",
    description="API d'analyse intelligente de projets avec 6 modules ML et détection de langue centralisée",
    version="1.0.0"
)

# Configuration CORS pour résoudre les erreurs Cross-Origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_project_endpoint(request: ProjectAnalysisRequest):
    """
    Endpoint principal pour l'analyse complète de projet
    
    Exécute les 6 modules ML en séquence optimisée avec détection de langue centralisée:
    - Parallèle: Classification industrie + Complexité/Durée + Type de projet
    - Séquentiel: Génération tâches + Analyse business + Risques/Opportunités
    """
    return await orchestrator.analyze_project(request)

@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {
        "status": "healthy",
        "modules_loaded": orchestrator._modules_loaded,
        "stats": orchestrator.stats,
        "cache_size": len(orchestrator.cache),
        "language_detection": "centralized"  # ✅ Statut détection centralisée
    }

@app.get("/clear-cache")
async def clear_cache():
    """Vider le cache (utile pour le développement)"""
    with orchestrator.cache_lock:
        orchestrator.cache.clear()
    return {"message": "Cache vidé avec succès"}

if __name__ == "__main__":
    import uvicorn
    
    print(" Démarrage de l'API d'analyse de projets...")
    print(" Détection de langue centralisée activée")
    print(" Endpoints disponibles:")
    print("   POST /analyze - Analyse complète de projet")
    print("   GET /health - État de l'API")
    print("   GET /clear-cache - Vider le cache")
    
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8000,
        log_level="info"
    )