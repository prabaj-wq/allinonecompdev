from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List, Optional
import os
import json
import logging
from datetime import datetime
import hashlib

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document-integration", tags=["Document Integration"])

# Document storage configuration
DOCUMENTS_DIR = "ifrs_documents"
DOCUMENT_INDEX_FILE = "document_index.json"

class DocumentProcessor:
    """Process and index IFRS documents for AI integration"""
    
    def __init__(self):
        self.documents_dir = DOCUMENTS_DIR
        self.index_file = DOCUMENT_INDEX_FILE
        self.ensure_directories()
    
    def ensure_directories(self):
        """Ensure document directories exist"""
        os.makedirs(self.documents_dir, exist_ok=True)
        
        # Create subdirectories for different document types
        subdirs = [
            "ifrs_standards",
            "interpretations", 
            "implementation_guidance",
            "industry_examples",
            "annual_reports"
        ]
        
        for subdir in subdirs:
            os.makedirs(os.path.join(self.documents_dir, subdir), exist_ok=True)
    
    def get_document_index(self):
        """Load document index"""
        index_path = os.path.join(self.documents_dir, self.index_file)
        if os.path.exists(index_path):
            with open(index_path, 'r') as f:
                return json.load(f)
        return {"documents": [], "last_updated": None}
    
    def save_document_index(self, index):
        """Save document index"""
        index_path = os.path.join(self.documents_dir, self.index_file)
        index["last_updated"] = datetime.now().isoformat()
        with open(index_path, 'w') as f:
            json.dump(index, f, indent=2)
    
    def calculate_file_hash(self, file_path):
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def process_document(self, file_path, document_type, metadata):
        """Process and index a document"""
        try:
            file_hash = self.calculate_file_hash(file_path)
            file_size = os.path.getsize(file_path)
            
            # Extract text content (simplified - in production use proper PDF parsing)
            content_preview = self.extract_content_preview(file_path)
            
            document_info = {
                "id": file_hash[:12],
                "filename": os.path.basename(file_path),
                "type": document_type,
                "file_hash": file_hash,
                "file_size": file_size,
                "upload_date": datetime.now().isoformat(),
                "content_preview": content_preview,
                "metadata": metadata,
                "indexed": True
            }
            
            # Update index
            index = self.get_document_index()
            
            # Remove existing document with same hash
            index["documents"] = [doc for doc in index["documents"] if doc["file_hash"] != file_hash]
            
            # Add new document
            index["documents"].append(document_info)
            self.save_document_index(index)
            
            logger.info(f"Document processed and indexed: {document_info['filename']}")
            return document_info
            
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise
    
    def extract_content_preview(self, file_path):
        """Extract preview content from document (simplified)"""
        try:
            # In production, use proper PDF parsing libraries like PyPDF2, pdfplumber
            # For now, return basic file info
            return f"Document: {os.path.basename(file_path)} - IFRS guidance document"
        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            return "Content extraction failed"
    
    def search_documents(self, query, document_type=None):
        """Search documents by query"""
        index = self.get_document_index()
        results = []
        
        query_lower = query.lower()
        
        for doc in index["documents"]:
            # Filter by type if specified
            if document_type and doc["type"] != document_type:
                continue
            
            # Simple text matching (in production use proper search indexing)
            if (query_lower in doc["filename"].lower() or 
                query_lower in doc.get("content_preview", "").lower() or
                query_lower in str(doc.get("metadata", {})).lower()):
                results.append(doc)
        
        return results

# Initialize document processor
doc_processor = DocumentProcessor()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Query(..., description="Type: ifrs_standards, interpretations, implementation_guidance, industry_examples, annual_reports"),
    ifrs_standard: Optional[str] = Query(None, description="Related IFRS standard (e.g., IFRS 16, IFRS 9)"),
    industry: Optional[str] = Query(None, description="Industry context"),
    company: Optional[str] = Query(None, description="Company name for annual reports"),
    description: Optional[str] = Query(None, description="Document description")
):
    """Upload and process IFRS documents"""
    
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
            raise HTTPException(status_code=400, detail="Only PDF, Word, and text documents are supported")
        
        # Validate document type
        valid_types = ["ifrs_standards", "interpretations", "implementation_guidance", "industry_examples", "annual_reports"]
        if document_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {valid_types}")
        
        # Save file
        file_path = os.path.join(doc_processor.documents_dir, document_type, file.filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Prepare metadata
        metadata = {
            "ifrs_standard": ifrs_standard,
            "industry": industry,
            "company": company,
            "description": description,
            "original_filename": file.filename
        }
        
        # Process and index document
        document_info = doc_processor.process_document(file_path, document_type, metadata)
        
        return {
            "success": True,
            "message": "Document uploaded and indexed successfully",
            "document": document_info
        }
        
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def list_documents(
    document_type: Optional[str] = Query(None),
    ifrs_standard: Optional[str] = Query(None),
    industry: Optional[str] = Query(None)
):
    """List uploaded documents with optional filtering"""
    
    try:
        index = doc_processor.get_document_index()
        documents = index["documents"]
        
        # Apply filters
        if document_type:
            documents = [doc for doc in documents if doc["type"] == document_type]
        
        if ifrs_standard:
            documents = [doc for doc in documents if 
                        doc.get("metadata", {}).get("ifrs_standard") == ifrs_standard]
        
        if industry:
            documents = [doc for doc in documents if 
                        doc.get("metadata", {}).get("industry") == industry]
        
        return {
            "documents": documents,
            "total_count": len(documents),
            "last_updated": index.get("last_updated")
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_documents(
    query: str = Query(..., description="Search query"),
    document_type: Optional[str] = Query(None),
    limit: int = Query(10, description="Maximum results to return")
):
    """Search documents by content and metadata"""
    
    try:
        results = doc_processor.search_documents(query, document_type)
        
        # Limit results
        results = results[:limit]
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Document search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integration-status")
async def get_integration_status():
    """Get document integration status for AI system"""
    
    try:
        index = doc_processor.get_document_index()
        
        # Count documents by type
        type_counts = {}
        for doc in index["documents"]:
            doc_type = doc["type"]
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        # Count by IFRS standard
        standard_counts = {}
        for doc in index["documents"]:
            standard = doc.get("metadata", {}).get("ifrs_standard")
            if standard:
                standard_counts[standard] = standard_counts.get(standard, 0) + 1
        
        return {
            "total_documents": len(index["documents"]),
            "by_type": type_counts,
            "by_standard": standard_counts,
            "last_updated": index.get("last_updated"),
            "integration_active": len(index["documents"]) > 0
        }
        
    except Exception as e:
        logger.error(f"Error getting integration status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and remove from index"""
    
    try:
        index = doc_processor.get_document_index()
        
        # Find document
        document = None
        for doc in index["documents"]:
            if doc["id"] == document_id:
                document = doc
                break
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete file
        file_path = os.path.join(doc_processor.documents_dir, document["type"], document["filename"])
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove from index
        index["documents"] = [doc for doc in index["documents"] if doc["id"] != document_id]
        doc_processor.save_document_index(index)
        
        return {
            "success": True,
            "message": "Document deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))
