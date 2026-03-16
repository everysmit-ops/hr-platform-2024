from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import aiofiles
import shutil
from datetime import datetime
import uuid

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

# Создаем папку для загрузок, если её нет
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    candidate_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Загрузить файл (резюме, фото и т.д.)"""
    
    # Проверяем размер файла (макс 10MB)
    file.file.seek(0, 2)  # Перемещаемся в конец файла
    file_size = file.file.tell()
    file.file.seek(0)  # Возвращаемся в начало
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Сохраняем файл
    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    # Создаем запись в базе данных
    db_file = models.File(
        filename=unique_filename,
        original_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        candidate_id=candidate_id,
        uploaded_by=current_user.id
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    # Если файл привязан к кандидату, обновляем его
    if candidate_id:
        candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
        if candidate:
            # Здесь можно добавить логику, например, отметить что у кандидата есть резюме
            pass
    
    return {
        "id": db_file.id,
        "filename": unique_filename,
        "original_name": file.filename,
        "file_size": file_size,
        "message": "File uploaded successfully"
    }

@router.get("/candidate/{candidate_id}", response_model=List[schemas.FileResponse])
async def get_candidate_files(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить все файлы кандидата"""
    
    files = db.query(models.File).filter(
        models.File.candidate_id == candidate_id
    ).order_by(models.File.created_at.desc()).all()
    
    return files

@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Скачать файл по ID"""
    
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права доступа
    if file_record.candidate_id:
        candidate = db.query(models.Candidate).filter(
            models.Candidate.id == file_record.candidate_id
        ).first()
        
        if candidate and candidate.scout_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if not os.path.exists(file_record.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_record.file_path,
        filename=file_record.original_name,
        media_type=file_record.mime_type
    )

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Удалить файл"""
    
    file_record = db.query(models.File).filter(models.File.id == file_id).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Проверяем права (админ или владелец)
    if file_record.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Удаляем файл с диска
    try:
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not delete file: {str(e)}")
    
    # Удаляем запись из базы
    db.delete(file_record)
    db.commit()
    
    return {"message": "File deleted successfully"}
