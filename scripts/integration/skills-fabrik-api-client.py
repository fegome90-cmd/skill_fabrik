#!/usr/bin/env python3
"""
Skills-Fabrik API Client (Puerto 3003)
Cliente para conectarse a la API de Skills-Fabrik con endpoints:
- Health check
- Skills analysis
- Enhanced Prompt Builder v2.0
"""

import requests
import json
from typing import Dict, List, Optional
from datetime import datetime


class SkillsFabrikAPIClient:
    """Cliente para la API de Skills-Fabrik en puerto 3003"""
    
    def __init__(self, base_url: str = "http://localhost:3003"):
        self.base_url = base_url.rstrip('/')
        self.api_base = f"{self.base_url}/api/v1"
    
    def health_check(self) -> Dict:
        """Verificar salud del sistema"""
        try:
            response = requests.get(
                f"{self.api_base}/health",
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Servidor no disponible"
            }
    
    def analyze_skills(self, prompt: str, context: Optional[Dict] = None) -> Dict:
        """Analizar skills en un prompt"""
        try:
            payload = {
                "prompt": prompt,
                "context": context or {}
            }
            
            response = requests.post(
                f"{self.api_base}/skills/analyze/prompt",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Error analizando skills"
            }
    
    def enhanced_prompt_builder(
        self,
        objective: str,
        role: str = "Backend Developer",
        directive: Optional[str] = None,
        framework: Optional[str] = None,
        guardrails: Optional[str] = None,
        provider: str = "glm",
        model: str = "glm-4",
        skill_optimization: bool = True
    ) -> Dict:
        """Generar prompt optimizado con Enhanced Prompt Builder v2.0"""
        try:
            payload = {
                "wizard": {
                    "objective": objective,
                    "role": role,
                    "directive": directive,
                    "framework": framework,
                    "guardrails": guardrails
                },
                "generation": {
                    "provider": provider,
                    "model": model
                },
                "skillOptimization": skill_optimization
            }
            
            response = requests.post(
                f"{self.api_base}/wizard-working/sessions/enhanced-batch-working",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Error generando prompt optimizado"
            }
    
    def is_available(self) -> bool:
        """Verificar si el servidor está disponible"""
        try:
            result = self.health_check()
            return result.get("success", False) or "status" in result
        except:
            return False


def main():
    """Ejemplo de uso del cliente"""
    print("🚀 Conectando a Skills-Fabrik API (puerto 3003)...\n")
    
    client = SkillsFabrikAPIClient()
    
    # 1. Health Check
    print("1️⃣ Health Check:")
    health = client.health_check()
    if health.get("success") or "status" in health:
        print(f"   ✅ Servidor saludable: {json.dumps(health, indent=2)}")
    else:
        print(f"   ❌ Servidor no disponible: {health.get('error', 'Unknown error')}")
        print("   💡 Asegúrate de que el servidor esté corriendo en http://localhost:3003")
        return
    
    print()
    
    # 2. Skills Analysis
    print("2️⃣ Skills Analysis:")
    analysis = client.analyze_skills(
        prompt="crear API REST con autenticación",
        context={"role": "backend-developer"}
    )
    if analysis.get("success"):
        print(f"   ✅ Skills detectadas: {json.dumps(analysis, indent=2)}")
    else:
        print(f"   ❌ Error: {analysis.get('error', 'Unknown error')}")
    
    print()
    
    # 3. Enhanced Prompt Builder
    print("3️⃣ Enhanced Prompt Builder v2.0:")
    prompt_result = client.enhanced_prompt_builder(
        objective="crear API REST con autenticación",
        role="Backend Developer",
        directive="implementar endpoints seguros",
        framework="Node.js + Express",
        guardrails="OWASP compliance"
    )
    if prompt_result.get("success"):
        print(f"   ✅ Prompt optimizado generado")
        print(f"   📊 Resultado: {json.dumps(prompt_result, indent=2)}")
    else:
        print(f"   ❌ Error: {prompt_result.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()

