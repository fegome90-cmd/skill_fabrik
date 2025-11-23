#!/usr/bin/env python3
"""
MemTech Universal Client para Skills Fabric
Cliente simplificado para conectar Skills Fabric con MemTech Universal API
"""

import requests
import json
import os
from typing import Dict, List, Optional
from datetime import datetime


class MemTechClient:
    """Cliente para interactuar con MemTech Universal API"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url.rstrip('/')
        self.api_key = os.environ.get('MEMTECH_API_KEY')
        self.agent_id = "skills-fabrik-claude"
        self.agent_name = "Skills Fabric Claude Agent"
    
    def authenticate(self, agent_id: Optional[str] = None, agent_name: Optional[str] = None) -> str:
        """Crear API key para el agente"""
        agent_id = agent_id or self.agent_id
        agent_name = agent_name or self.agent_name
        
        try:
            response = requests.post(
                f"{self.base_url}/agent/auth/create-key",
                params={
                    "agent_id": agent_id,
                    "agent_name": agent_name,
                    "permissions": "memory:read,memory:write",
                    "expires_hours": 24
                },
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            self.api_key = data.get("api_key")
            
            if self.api_key:
                # Guardar en variable de entorno para persistencia
                os.environ['MEMTECH_API_KEY'] = self.api_key
                print(f"✅ Autenticación exitosa. API Key: {self.api_key[:20]}...")
                return self.api_key
            else:
                raise ValueError("No se recibió API key en la respuesta")
                
        except requests.RequestException as e:
            print(f"❌ Error en autenticación: {e}")
            # Intentar método alternativo: login con credenciales
            return self._login_fallback()
    
    def _login_fallback(self) -> str:
        """Método alternativo: login con credenciales"""
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            self.api_key = data.get("api_key") or data.get("access_token")
            
            if self.api_key:
                os.environ['MEMTECH_API_KEY'] = self.api_key
                print(f"✅ Login exitoso. Token: {self.api_key[:20]}...")
                return self.api_key
            else:
                raise ValueError("No se recibió token en la respuesta")
        except requests.RequestException as e:
            print(f"❌ Error en login alternativo: {e}")
            raise
    
    def store(self, content: str, tags: Optional[List[str]] = None, metadata: Optional[Dict] = None) -> Dict:
        """Guardar memoria en MemTech"""
        if not self.api_key:
            raise ValueError("No hay API key. Llama a authenticate() primero")
        
        payload = {"content": content}
        if tags:
            payload["tags"] = tags
        if metadata:
            payload["metadata"] = metadata
        else:
            payload["metadata"] = {
                "agent_id": self.agent_id,
                "source": "skills-fabrik",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/memory",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error guardando memoria: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Respuesta: {e.response.text}")
            raise
    
    def search(self, query: Optional[str] = None, tags: Optional[List[str]] = None, limit: int = 10) -> Dict:
        """Buscar memorias"""
        if not self.api_key:
            raise ValueError("No hay API key. Llama a authenticate() primero")
        
        params = {"limit": limit}
        if query:
            params["query"] = query
        if tags:
            params["tags"] = ",".join(tags) if isinstance(tags, list) else tags
        
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/memory/search",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params=params,
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error buscando memorias: {e}")
            raise
    
    def get(self, memory_id: str) -> Dict:
        """Obtener memoria específica por ID"""
        if not self.api_key:
            raise ValueError("No hay API key. Llama a authenticate() primero")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/memory/{memory_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error obteniendo memoria: {e}")
            raise
    
    def list(self, limit: int = 10, offset: int = 0) -> Dict:
        """Listar memorias recientes"""
        if not self.api_key:
            raise ValueError("No hay API key. Llama a authenticate() primero")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/memory/list",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params={"limit": limit, "offset": offset},
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error listando memorias: {e}")
            raise
    
    def stats(self) -> Dict:
        """Obtener estadísticas del sistema"""
        if not self.api_key:
            raise ValueError("No hay API key. Llama a authenticate() primero")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/system/stats",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            raise
    
    def health(self) -> Dict:
        """Health check del sistema"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=2)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ Error en health check: {e}")
            raise


def main():
    """Ejemplo de uso del cliente"""
    print("🚀 Conectando a MemTech Universal...\n")
    
    client = MemTechClient()
    
    # 1. Health check
    try:
        health = client.health()
        print(f"✅ Servidor saludable: {json.dumps(health, indent=2)}")
    except Exception as e:
        print(f"⚠️ Servidor no disponible: {e}")
        print("   Asegúrate de que el servidor esté corriendo en http://localhost:8080")
        return
    
    # 2. Autenticar
    try:
        api_key = client.authenticate()
        print(f"✅ Autenticación exitosa\n")
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
        return
    
    # 3. Guardar memoria de prueba
    try:
        result = client.store(
            content="Skills Fabric conectado exitosamente a MemTech Universal",
            tags=["skills-fabrik", "integration", "test"],
            metadata={
                "integration_date": datetime.now().isoformat(),
                "version": "2.0.0"
            }
        )
        print(f"✅ Memoria guardada: {json.dumps(result, indent=2)}\n")
        memory_id = result.get("memory_id")
    except Exception as e:
        print(f"❌ Error guardando memoria: {e}")
        return
    
    # 4. Buscar memorias
    try:
        results = client.search(query="skills-fabrik", limit=5)
        print(f"✅ Búsqueda exitosa: {len(results.get('memories', []))} memorias encontradas\n")
        for mem in results.get('memories', [])[:3]:
            print(f"  - {mem.get('content', '')[:50]}...")
    except Exception as e:
        print(f"❌ Error buscando: {e}")
    
    # 5. Estadísticas
    try:
        stats = client.stats()
        print(f"\n✅ Estadísticas del sistema:")
        print(f"   Total memorias: {stats.get('total_memories', 0)}")
        print(f"   Agentes conectados: {stats.get('agents_connected', 0)}")
        print(f"   Uptime: {stats.get('uptime', 'unknown')}")
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")


if __name__ == "__main__":
    main()

