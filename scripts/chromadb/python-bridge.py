#!/usr/bin/env python3
"""
ChromaDB Cloud Python Bridge
Provides a generic JSON API for Node.js to interact with ChromaDB Cloud
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Monkey-patch for Pydantic 2.x compatibility with ChromaDB 0.3.23
# ChromaDB 0.3.23 tries to import BaseSettings from pydantic, but it moved to pydantic-settings in v2
# We need to add BaseSettings to pydantic before chromadb imports it
try:
    import pydantic
    from pydantic_settings import BaseSettings
    # Add BaseSettings to pydantic module for ChromaDB compatibility
    pydantic.BaseSettings = BaseSettings
except ImportError:
    pass

from dotenv import load_dotenv

# Load environment variables from project root (skills-fabrik) FIRST
# Try multiple possible paths
possible_env_paths = [
    Path(__file__).parent.parent.parent / '.env',  # scripts/../../.env
    Path(__file__).parent.parent / '.env',         # scripts/.env
    Path.cwd() / '.env',                            # Current working directory
]

for env_path in possible_env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break
else:
    # Fallback to standard .env loading
    load_dotenv()

# ChromaDB 0.3.23 with Pydantic 2.x has validation issues during import
# We need to patch pydantic Settings before chromadb imports it
# The issue is that chromadb.config imports Settings() which validates all env vars
import importlib.util
_original_environ = dict(os.environ)

# Clear env vars temporarily
os.environ.clear()

try:
    # Import chromadb module without executing __init__.py that creates Settings
    spec = importlib.util.find_spec('chromadb')
    if spec and spec.loader:
        # Load the module but skip __init__ execution  
        chromadb_module = importlib.util.module_from_spec(spec)
        # Manually import submodules we need
        sys.modules['chromadb'] = chromadb_module
        
        # Import and patch config first
        import chromadb.config as config_module
        sys.modules['chromadb.config'] = config_module
        
        # Patch Settings class to ignore extra fields
        try:
            from pydantic_settings import BaseSettings
            # Create a patched Settings class
            class _PatchedSettings(BaseSettings):
                class Config:
                    extra = 'ignore'
                    # Allow None values for optional fields
                    arbitrary_types_allowed = True
            config_module.Settings = _PatchedSettings
            # Initialize with empty config
            config_module.__settings = _PatchedSettings()
        except Exception:
            pass
        
        # Now finish loading chromadb
        spec.loader.exec_module(chromadb_module)
        import chromadb
except Exception as e:
    # Fallback: try normal import and hope for the best
    os.environ.clear()
    try:
        import chromadb
    except Exception:
        raise ImportError(f"Failed to import chromadb: {e}") from e
finally:
    # Restore environment
    os.environ.clear()
    os.environ.update(_original_environ)


class ChromaDBBridge:
    """Bridge class for ChromaDB Cloud operations"""
    
    def __init__(self):
        """Initialize ChromaDB client (Cloud or legacy)"""
        self.api_key = os.getenv('CHROMA_API_KEY')
        self.tenant = os.getenv('CHROMA_TENANT')
        self.database = os.getenv('CHROMA_DATABASE')
        self.client = None
        self.mode = 'unknown'
        
        # ChromaDB 0.3.x doesn't have CloudClient, only Client
        # CloudClient exists in ChromaDB >= 1.0 which requires Pydantic 2.x
        # We're using ChromaDB 0.3.x with Pydantic 1.x, so L3 is legacy/disabled
        if hasattr(chromadb, 'CloudClient'):
            # Modern ChromaDB with CloudClient (requires Pydantic 2.x)
            if not all([self.api_key, self.tenant, self.database]):
                raise ValueError("Missing required environment variables: CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE")
            try:
                self.client = chromadb.CloudClient(
                    api_key=self.api_key,
                    tenant=self.tenant,
                    database=self.database
                )
                self.mode = 'cloud'
            except Exception as e:
                raise ConnectionError(f"Failed to connect to ChromaDB Cloud: {e}")
        else:
            # ChromaDB 0.3.x legacy mode - L3 disabled
            self.mode = 'legacy_disabled'
            raise NotImplementedError(
                "ChromaDB 0.3.x (with Pydantic 1.x) does not support CloudClient. "
                "L3 storage is disabled. Use L0/L1/L2 (Redis/PostgreSQL) instead. "
                "To enable L3, upgrade to ChromaDB >=1.0 with Pydantic 2.x."
            )
    
    def heartbeat(self) -> Dict[str, Any]:
        """Check ChromaDB connection"""
        try:
            result = self.client.heartbeat()
            return {"success": True, "data": result, "message": "Connected"}
        except Exception as e:
            return {"success": False, "error": str(e), "message": "Connection failed"}
    
    def list_collections(self) -> Dict[str, Any]:
        """List all collections"""
        try:
            collections = self.client.list_collections()
            result = [
                {
                    "name": col.name,
                    "id": str(col.id),  # Convert UUID to string
                    "metadata": col.metadata if hasattr(col, 'metadata') else {}
                }
                for col in collections
            ]
            return {"success": True, "data": result, "count": len(result)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_collection(self, collection_name: str) -> Dict[str, Any]:
        """Get a specific collection"""
        try:
            collection = self.client.get_collection(collection_name)
            return {
                "success": True,
                "data": {
                    "name": collection.name,
                    "id": str(collection.id),  # Convert UUID to string
                    "metadata": collection.metadata if hasattr(collection, 'metadata') else {}
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def count_collection(self, collection_name: str) -> Dict[str, Any]:
        """Count documents in a collection"""
        try:
            collection = self.client.get_collection(collection_name)
            count = collection.count()
            return {"success": True, "data": count}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def peek_collection(self, collection_name: str, limit: int = 5) -> Dict[str, Any]:
        """Peek at documents in a collection"""
        try:
            collection = self.client.get_collection(collection_name)
            result = collection.peek(limit=limit)
            
            return {
                "success": True,
                "data": {
                    "ids": result['ids'],
                    "metadatas": result.get('metadatas', []),
                    "documents": result.get('documents', []),
                    "limit": limit
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def query_collection(
        self,
        collection_name: str,
        query_texts: Optional[List[str]] = None,
        n_results: int = 10,
        where: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Query a collection"""
        try:
            collection = self.client.get_collection(collection_name)
            result = collection.query(
                query_texts=query_texts,
                n_results=n_results,
                where=where
            )
            
            return {
                "success": True,
                "data": {
                    "ids": result['ids'],
                    "distances": result['distances'],
                    "metadatas": result.get('metadatas', []),
                    "documents": result.get('documents', []),
                    "count": len(result['ids'][0]) if result['ids'] else 0
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_collection(
        self,
        collection_name: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create a new collection"""
        try:
            collection = self.client.create_collection(
                name=collection_name,
                metadata=metadata or {}
            )
            return {
                "success": True,
                "data": {
                    "name": collection.name,
                    "id": str(collection.id),
                    "metadata": collection.metadata if hasattr(collection, 'metadata') else {}
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_documents(
        self,
        collection_name: str,
        ids: List[str],
        documents: List[str],
        metadatas: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Add documents to a collection"""
        try:
            collection = self.client.get_collection(collection_name)
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            return {
                "success": True,
                "data": {
                    "added": len(ids),
                    "ids": ids
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


def main():
    """Main entry point for CLI usage"""
    parser = argparse.ArgumentParser(description='ChromaDB Cloud Python Bridge')
    parser.add_argument('command', choices=[
        'heartbeat',
        'list-collections',
        'get-collection',
        'count-collection',
        'peek-collection',
        'query-collection',
        'create-collection',
        'add-documents'
    ], help='Command to execute')
    
    parser.add_argument('--collection', type=str, help='Collection name')
    parser.add_argument('--limit', type=int, default=5, help='Limit for peek/queries')
    parser.add_argument('--query', type=str, help='Query text')
    parser.add_argument('--n-results', type=int, default=10, help='Number of results')
    parser.add_argument('--where', type=str, help='Where clause (JSON)')
    parser.add_argument('--metadata', type=str, help='Collection metadata (JSON)')
    parser.add_argument('--ids', type=str, help='Document IDs (JSON array)')
    parser.add_argument('--documents', type=str, help='Documents (JSON array)')
    parser.add_argument('--metadatas', type=str, help='Document metadatas (JSON array)')
    
    args = parser.parse_args()
    
    try:
        bridge = ChromaDBBridge()
        
        if args.command == 'heartbeat':
            result = bridge.heartbeat()
        elif args.command == 'list-collections':
            result = bridge.list_collections()
        elif args.command == 'get-collection':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            else:
                result = bridge.get_collection(args.collection)
        elif args.command == 'count-collection':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            else:
                result = bridge.count_collection(args.collection)
        elif args.command == 'peek-collection':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            else:
                result = bridge.peek_collection(args.collection, args.limit)
        elif args.command == 'query-collection':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            else:
                where_dict = json.loads(args.where) if args.where else None
                result = bridge.query_collection(
                    args.collection,
                    [args.query] if args.query else None,
                    args.n_results,
                    where_dict
                )
        elif args.command == 'create-collection':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            else:
                metadata_dict = json.loads(args.metadata) if args.metadata else None
                result = bridge.create_collection(args.collection, metadata_dict)
        elif args.command == 'add-documents':
            if not args.collection:
                result = {"success": False, "error": "Collection name required"}
            elif not args.ids or not args.documents:
                result = {"success": False, "error": "IDs and documents required"}
            else:
                ids = json.loads(args.ids)
                documents = json.loads(args.documents)
                metadatas = json.loads(args.metadatas) if args.metadatas else None
                result = bridge.add_documents(args.collection, ids, documents, metadatas)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
