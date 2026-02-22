import os
from typing import List
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path
import json

class RAGService:
    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.index_path = "data/faiss_index/index.faiss"
        self.docs_path = "data/faiss_index/documents.json"
        self.index = None
        self.documents = []
        
        self._load_index()
    
    def _load_index(self):
        """Load FAISS index and documents"""
        if os.path.exists(self.index_path) and os.path.exists(self.docs_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.docs_path, 'r', encoding='utf-8') as f:
                self.documents = json.load(f)
    
    def search(self, query: str, top_k: int = 3) -> List[str]:
        """Search for relevant documents"""
        if self.index is None or len(self.documents) == 0:
            return []
        
        # Encode query
        query_vector = self.model.encode([query])
        
        # Search
        distances, indices = self.index.search(query_vector, top_k)
        
        # Get documents
        results = []
        for idx in indices[0]:
            if idx < len(self.documents):
                results.append(self.documents[idx])
        
        return results
    
    def add_documents(self, documents: List[str]):
        """Add documents to index"""
        if len(documents) == 0:
            return
        
        # Encode documents
        embeddings = self.model.encode(documents)
        
        # Create or update index
        if self.index is None:
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
        
        self.index.add(embeddings.astype('float32'))
        self.documents.extend(documents)
        
        # Save
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        
        with open(self.docs_path, 'w', encoding='utf-8') as f:
            json.dump(self.documents, f, ensure_ascii=False, indent=2)

rag_service = RAGService()