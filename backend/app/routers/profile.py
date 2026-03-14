from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=schemas.UserResponse)
async def get_profile(
    current_user: models.User = Depends(get_current_user)
):
    """Получить профиль текущего пользователя"""
    return current_user

@router.put("/", response_model=schemas.UserResponse)
async def update_profile(
    profile_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить профиль пользователя"""
    
    if profile_update.first_name:
        current_user.first_name = profile_update.first_name
    if profile_update.last_name:
        current_user.last_name = profile_update.last_name
    if profile_update.phone:
        current_user.phone = profile_update.phone
    if profile_update.email:
        current_user.email = profile_update.email
    if profile_update.bio:
        current_user.bio = profile_update.bio
    if profile_update.avatar:
        current_user.avatar = profile_update.avatar
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/stats")
async def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить расширенную статистику профиля"""
    
    from datetime import datetime, timedelta
    from sqlalchemy import and_
    
    now = datetime.utcnow()
    
    # Ежедневная статистика за последние 7 дней
    daily = []
    for i in range(7):
        day = now - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        
        count = db.query(models.Candidate).filter(
            and_(
                models.Candidate.scout_id == current_user.id,
                models.Candidate.found_date >= day_start,
                models.Candidate.found_date < day_end
            )
        ).count()
        
        daily.append({
            "date": day.strftime("%Y-%m-%d"),
            "count": count
        })
    
    daily.reverse()
    
    # Распределение по статусам
    status_counts = db.query(
        models.Candidate.status,
        func.count(models.Candidate.id)
    ).filter(
        models.Candidate.scout_id == current_user.id
    ).group_by(models.Candidate.status).all()
    
    status_distribution = [
        {"name": s[0], "value": s[1]} for s in status_counts
    ]
    
    # Месячная динамика
    monthly = []
    for i in range(6):
        month = now - timedelta(days=30*i)
        month_start = datetime(month.year, month.month, 1)
        if month.month == 12:
            month_end = datetime(month.year + 1, 1, 1)
        else:
            month_end = datetime(month.year, month.month + 1, 1)
        
        total = db.query(models.Candidate).filter(
            and_(
                models.Candidate.scout_id == current_user.id,
                models.Candidate.found_date >= month_start,
                models.Candidate.found_date < month_end
            )
        ).count()
        
        hired = db.query(models.Candidate).filter(
            and_(
                models.Candidate.scout_id == current_user.id,
                models.Candidate.status == "hired",
                models.Candidate.found_date >= month_start,
                models.Candidate.found_date < month_end
            )
        ).count()
        
        monthly.append({
            "month": month_start.strftime("%b %Y"),
            "total": total,
            "hired": hired
        })
    
    monthly.reverse()
    
    return {
        "daily": daily,
        "statusDistribution": status_distribution,
        "monthlyProgress": monthly
    }
