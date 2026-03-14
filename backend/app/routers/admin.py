from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_admin

router = APIRouter()

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить общую статистику (только для админа)"""
    
    total_candidates = db.query(models.Candidate).count()
    total_hired = db.query(models.Candidate).filter(models.Candidate.status == "hired").count()
    total_scouts = db.query(models.User).filter(models.User.role == "scout").count()
    
    # Распределение по статусам
    status_counts = db.query(
        models.Candidate.status,
        func.count(models.Candidate.id)
    ).group_by(models.Candidate.status).all()
    
    status_distribution = {
        "new": 0,
        "contacted": 0,
        "interview": 0,
        "hired": 0,
        "rejected": 0
    }
    
    for status, count in status_counts:
        status_distribution[status] = count
    
    # Конверсия
    total_contacted = status_distribution["contacted"] + status_distribution["interview"] + status_distribution["hired"]
    total_interviewed = status_distribution["interview"] + status_distribution["hired"]
    
    conversion_rate = round(
        (status_distribution["hired"] / total_candidates * 100), 1
    ) if total_candidates > 0 else 0
    
    return {
        "total_candidates": total_candidates,
        "total_hired": total_hired,
        "total_scouts": total_scouts,
        "conversion_rate": conversion_rate,
        "status_distribution": status_distribution
    }

@router.get("/scouts", response_model=List[schemas.UserResponse])
async def get_scouts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех скаутов (только для админа)"""
    
    scouts = db.query(models.User).filter(models.User.role == "scout").all()
    return scouts

@router.post("/scouts", response_model=schemas.UserResponse)
async def create_scout(
    scout_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать нового скаута (только для админа)"""
    
    # Проверяем, не существует ли уже пользователь с таким telegram_id
    existing = db.query(models.User).filter(
        models.User.telegram_id == scout_data.telegram_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_scout = models.User(
        telegram_id=scout_data.telegram_id,
        username=scout_data.username,
        first_name=scout_data.first_name,
        last_name=scout_data.last_name,
        role="scout",
        kpi_target=5
    )
    
    db.add(new_scout)
    db.commit()
    db.refresh(new_scout)
    
    return new_scout

@router.patch("/scouts/{scout_id}/toggle")
async def toggle_scout_status(
    scout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Активировать/деактивировать скаута (только для админа)"""
    
    scout = db.query(models.User).filter(models.User.id == scout_id).first()
    
    if not scout:
        raise HTTPException(status_code=404, detail="Scout not found")
    
    scout.is_active = not scout.is_active
    db.commit()
    
    return {"status": "ok", "is_active": scout.is_active}
