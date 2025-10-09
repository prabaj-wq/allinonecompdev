from fastapi import APIRouter, HTTPException, status, Query, Request, File, UploadFile, Form
from typing import List, Optional
from pydantic import BaseModel
import psycopg2
import os
import json
import pandas as pd
import shutil
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Upload & File Management"])

def get_db_config():
    """Get database configuration"""
    if os.getenv('DOCKER_ENV') == 'true':
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
    else:
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        
    return {
        'host': POSTGRES_HOST,
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'user': 'postgres',
        'password': 'root@123'
    }

def ensure_upload_directory(company_name: str):
    """Ensure upload directory exists for company"""
    upload_dir = Path(f"uploads/{company_name}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir

@router.post("/trial-balance")
async def upload_trial_balance(
    file: UploadFile = File(...),
    period: str = Form(...),
    year: str = Form(...),
    company_name: str = Form(...)
):
    """Upload trial balance file"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400,
                detail="Only Excel (.xlsx, .xls) and CSV files are supported"
            )
        
        # Create upload directory
        upload_dir = ensure_upload_directory(company_name)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        safe_filename = f"tb_{period}_{year}_{timestamp}{file_extension}"
        file_path = upload_dir / safe_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the file and extract data
        try:
            if file_extension.lower() == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            
            # Basic validation of trial balance structure
            required_columns = ['account_code', 'account_name']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                # Try common alternative column names
                column_mapping = {
                    'account_code': ['Account Code', 'Code', 'Account_Code', 'AcctCode'],
                    'account_name': ['Account Name', 'Name', 'Account_Name', 'AcctName', 'Description']
                }
                
                for req_col in missing_columns:
                    found = False
                    for alt_col in column_mapping.get(req_col, []):
                        if alt_col in df.columns:
                            df = df.rename(columns={alt_col: req_col})
                            found = True
                            break
                    if not found:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Required column '{req_col}' not found in file"
                        )
            
            # Store file info in database
            db_config = get_db_config()
            company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
            
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Create uploads table if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS uploads (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    file_path TEXT NOT NULL,
                    file_type VARCHAR(50) NOT NULL,
                    period VARCHAR(20),
                    year VARCHAR(10),
                    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file_size BIGINT,
                    row_count INTEGER,
                    status VARCHAR(50) DEFAULT 'uploaded'
                )
            """)
            
            # Insert upload record
            file_size = os.path.getsize(file_path)
            row_count = len(df)
            
            cur.execute("""
                INSERT INTO uploads (filename, original_filename, file_path, file_type, 
                                   period, year, file_size, row_count, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                safe_filename, file.filename, str(file_path), 'trial_balance',
                period, year, file_size, row_count, 'uploaded'
            ))
            
            upload_id = cur.fetchone()[0]
            
            # Process and store trial balance entries
            cur.execute("""
                CREATE TABLE IF NOT EXISTS tb_entries (
                    id SERIAL PRIMARY KEY,
                    upload_id INTEGER REFERENCES uploads(id),
                    account_code VARCHAR(50) NOT NULL,
                    account_name VARCHAR(255) NOT NULL,
                    debit_amount DECIMAL(15,2) DEFAULT 0,
                    credit_amount DECIMAL(15,2) DEFAULT 0,
                    balance_amount DECIMAL(15,2) DEFAULT 0,
                    period VARCHAR(20),
                    year VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert trial balance entries
            for _, row in df.iterrows():
                account_code = str(row.get('account_code', '')).strip()
                account_name = str(row.get('account_name', '')).strip()
                
                if not account_code or not account_name:
                    continue
                
                debit_amount = pd.to_numeric(row.get('debit_amount', 0), errors='coerce') or 0
                credit_amount = pd.to_numeric(row.get('credit_amount', 0), errors='coerce') or 0
                balance_amount = pd.to_numeric(row.get('balance_amount', debit_amount - credit_amount), errors='coerce') or 0
                
                cur.execute("""
                    INSERT INTO tb_entries (upload_id, account_code, account_name, 
                                          debit_amount, credit_amount, balance_amount, period, year)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    upload_id, account_code, account_name,
                    debit_amount, credit_amount, balance_amount, period, year
                ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                "success": True,
                "message": "Trial balance uploaded successfully",
                "upload_id": upload_id,
                "filename": safe_filename,
                "original_filename": file.filename,
                "period": period,
                "year": year,
                "row_count": row_count,
                "file_size": file_size,
                "upload_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            # Clean up file if processing failed
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"Error processing file: {str(e)}"
            )
        
    except Exception as e:
        print(f"Error uploading trial balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload trial balance: {str(e)}"
        )

@router.get("/files")
def get_uploaded_files(company_name: str = Query(...), file_type: Optional[str] = None):
    """Get list of uploaded files"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        try:
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Build query based on file_type filter
            if file_type:
                cur.execute("""
                    SELECT id, filename, original_filename, file_type, period, year,
                           upload_date, file_size, row_count, status
                    FROM uploads
                    WHERE file_type = %s
                    ORDER BY upload_date DESC
                """, (file_type,))
            else:
                cur.execute("""
                    SELECT id, filename, original_filename, file_type, period, year,
                           upload_date, file_size, row_count, status
                    FROM uploads
                    ORDER BY upload_date DESC
                """)
            
            files_data = cur.fetchall()
            cur.close()
            conn.close()
            
            files = []
            for file_record in files_data:
                files.append({
                    'id': file_record[0],
                    'filename': file_record[1],
                    'original_filename': file_record[2],
                    'file_type': file_record[3],
                    'period': file_record[4],
                    'year': file_record[5],
                    'upload_date': file_record[6].isoformat() if file_record[6] else None,
                    'file_size': file_record[7],
                    'row_count': file_record[8],
                    'status': file_record[9]
                })
            
            return {"files": files}
            
        except psycopg2.OperationalError:
            # Return empty list if database doesn't exist
            return {"files": []}
            
    except Exception as e:
        print(f"Error getting uploaded files: {e}")
        return {"files": []}

@router.delete("/files/{file_id}")
def delete_uploaded_file(file_id: int, company_name: str = Query(...)):
    """Delete an uploaded file"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get file info before deleting
        cur.execute("SELECT filename, file_path FROM uploads WHERE id = %s", (file_id,))
        file_info = cur.fetchone()
        
        if not file_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        filename, file_path = file_info
        
        # Delete related trial balance entries
        cur.execute("DELETE FROM tb_entries WHERE upload_id = %s", (file_id,))
        
        # Delete upload record
        cur.execute("DELETE FROM uploads WHERE id = %s", (file_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Delete physical file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Warning: Could not delete physical file {file_path}: {e}")
        
        return {
            "success": True,
            "message": f"File '{filename}' deleted successfully"
        }
        
    except Exception as e:
        print(f"Error deleting file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

@router.post("/entity-mapping")
async def upload_entity_mapping(
    file: UploadFile = File(...),
    company_name: str = Form(...)
):
    """Upload entity mapping file"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400,
                detail="Only Excel (.xlsx, .xls) and CSV files are supported"
            )
        
        # Create upload directory
        upload_dir = ensure_upload_directory(company_name)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        safe_filename = f"entity_mapping_{timestamp}{file_extension}"
        file_path = upload_dir / safe_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the file
        try:
            if file_extension.lower() == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            
            # Store file info in database
            db_config = get_db_config()
            company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
            
            conn = psycopg2.connect(
                database=company_db_name,
                **db_config
            )
            
            cur = conn.cursor()
            
            # Insert upload record
            file_size = os.path.getsize(file_path)
            row_count = len(df)
            
            cur.execute("""
                INSERT INTO uploads (filename, original_filename, file_path, file_type, 
                                   file_size, row_count, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                safe_filename, file.filename, str(file_path), 'entity_mapping',
                file_size, row_count, 'uploaded'
            ))
            
            upload_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                "success": True,
                "message": "Entity mapping uploaded successfully",
                "upload_id": upload_id,
                "filename": safe_filename,
                "original_filename": file.filename,
                "row_count": row_count,
                "file_size": file_size,
                "upload_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            # Clean up file if processing failed
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=400,
                detail=f"Error processing file: {str(e)}"
            )
        
    except Exception as e:
        print(f"Error uploading entity mapping: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload entity mapping: {str(e)}"
        )

@router.get("/download/{file_id}")
def download_file(file_id: int, company_name: str = Query(...)):
    """Download an uploaded file"""
    try:
        db_config = get_db_config()
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            database=company_db_name,
            **db_config
        )
        
        cur = conn.cursor()
        
        # Get file info
        cur.execute("SELECT filename, file_path, original_filename FROM uploads WHERE id = %s", (file_id,))
        file_info = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not file_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        filename, file_path, original_filename = file_info
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Physical file not found"
            )
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename=original_filename,
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        print(f"Error downloading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )
