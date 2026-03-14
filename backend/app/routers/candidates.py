from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.CandidateResponse])
async def get_candidates(
    status: Optional[str] = None,
    search: Optional[str] = Query(None, description="Поиск по имени или ключевым словам"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список кандидатов (для админа - всех, для скаута - только своих)"""
    query = db.query(models.Candidate)
    
    if current_user.role != "admin":
        query = query.filter(models.Candidate.scout_id == current_user.id)
    
    if status:
        query = query.filter(models.Candidate.status == status)
    
    if search:
        query = query.filter(
            (models.Candidate.name.contains(search)) |
            (models.Candidate.keywords.contains(search))
        )
    
    candidates = query.order_by(models.Candidate.created_at.desc()).offset(skip).limit(limit).all()
    return candidates

@router.get("/{candidate_id}", response_model=schemas.CandidateResponse)
async def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить кандидата по ID"""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Проверка прав доступа
    if current_user.role != "admin" and candidate.scout_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return candidate

@router.patch("/{candidate_id}/status", response_model=schemas.CandidateResponse)
async def update_candidate_status(
    candidate_id: int,
    status_update: schemas.CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить статус кандидата"""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Проверка прав доступа
    if current_user.role != "admin" and candidate.scout_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if status_update.status:
        # Если статус меняется на "hired", увеличиваем счетчик
        if status_update.status == "hired" and candidate.status != "hired":
            current_user.total_hired += 1
            current_user.kpi_current += 1
        
        candidate.status = status_update.status
    
    if status_update.contacts:
        candidate.contacts = status_update.contacts
    
    if status_update.keywords:
        candidate.keywords = status_update.keywords
    
    candidate.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(candidate)
    
    return candidate

@router.post("/{candidate_id}/comments", response_model=schemas.CommentResponse)
async def add_comment(
    candidate_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Добавить комментарий к кандидату"""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Проверка прав доступа
    if current_user.role != "admin" and candidate.scout_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    new_comment = models.Comment(
        text=comment.text,
        candidate_id=candidate_id,
        user_id=current_user.id
    )
    
    db.add(new_comment)
    candidate.comments_count += 1
    candidate.last_activity = datetime.utcnow()
    db.commit()
    db.refresh(new_comment)
    
    # Добавляем имя пользователя для ответа
    response = schemas.CommentResponse.from_orm(new_comment)
    response.user_name = current_user.first_name
    
    return response

@router.get("/{candidate_id}/comments", response_model=List[schemas.CommentResponse])
async def get_comments(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить комментарии к кандидату"""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Проверка прав доступа
    if current_user.role != "admin" and candidate.scout_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    comments = db.query(models.Comment).filter(
        models.Comment.candidate_id == candidate_id
    ).order_by(models.Comment.created_at.desc()).all()
    
    # Добавляем имена пользователей
    response = []
    for comment in comments:
        comment_response = schemas.CommentResponse.from_orm(comment)
        comment_response.user_name = comment.user.first_name if comment.user else "Unknown"
        response.append(comment_response)
    
    return response
