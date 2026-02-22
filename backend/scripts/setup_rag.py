#!/usr/bin/env python3
"""Setup RAG system with psychology documents"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.rag import rag_service

def load_psychology_docs():
    """Load psychology documents into RAG system"""
    docs_dir = Path("data/psychology_docs")
    
    if not docs_dir.exists():
        print("No psychology documents found.")
        return
    
    documents = []
    
    # Load text files
    for file_path in docs_dir.glob("*.txt"):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Split into chunks (simple approach)
            chunks = content.split('\n\n')
            documents.extend([chunk.strip() for chunk in chunks if chunk.strip()])
    
    if documents:
        print(f"Loading {len(documents)} document chunks...")
        rag_service.add_documents(documents)
        print("✓ RAG system initialized successfully!")
    else:
        print("No documents to load.")

if __name__ == "__main__":
    load_psychology_docs()