from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import shutil
import uuid

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

# Создаем папку для аватаров
AVATAR_DIR = "uploads/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

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
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Загрузить аватар"""
    
    # Проверяем размер файла (макс 5MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Проверяем тип файла
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(AVATAR_DIR, filename)
    
    # Сохраняем файл
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Удаляем старый аватар если есть
    if current_user.avatar and os.path.exists(current_user.avatar):
        try:
            os.remove(current_user.avatar)
        except:
            pass
    
    # Обновляем пользователя
    current_user.avatar = file_path
    db.commit()
    
    return {"avatar": file_path, "message": "Avatar uploaded successfully"}

@router.post("/cover", response_model=dict)
async def upload_cover(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Загрузить обложку профиля"""
    
    # Проверяем размер файла (макс 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Проверяем тип файла
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Генерируем уникальное имя файла
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"cover_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(AVATAR_DIR, filename)
    
    # Сохраняем файл
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Удаляем старую обложку если есть
    if current_user.cover_image and os.path.exists(current_user.cover_image):
        try:
            os.remove(current_user.cover_image)
        except:
            pass
    
    # Обновляем пользователя
    current_user.cover_image = file_path
    db.commit()
    
    return {"cover": file_path, "message": "Cover uploaded successfully"}

@router.get("/settings", response_model=dict)
async def get_settings(
    current_user: models.User = Depends(get_current_user)
):
    """Получить настройки пользователя"""
    
    return {
        "theme": current_user.theme,
        "notifications_enabled": current_user.notifications_enabled,
        "email_notifications": current_user.email_notifications,
        "language": current_user.language,
        "profile_settings": current_user.profile_settings or {}
    }

@router.patch("/settings", response_model=dict)
async def update_settings(
    settings: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить настройки пользователя"""
    
    if "theme" in settings:
        current_user.theme = settings["theme"]
    if "notifications_enabled" in settings:
        current_user.notifications_enabled = settings["notifications_enabled"]
    if "email_notifications" in settings:
        current_user.email_notifications = settings["email_notifications"]
    if "language" in settings:
        current_user.language = settings["language"]
    if "profile_settings" in settings:
        current_user.profile_settings = {**current_user.profile_settings, **settings["profile_settings"]}
    
    db.commit()
    
    return {
        "theme": current_user.theme,
        "notifications_enabled": current_user.notifications_enabled,
        "email_notifications": current_user.email_notifications,
        "language": current_user.language,
        "profile_settings": current_user.profile_settings
    }

@router.get("/stats")
async def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить расширенную статистику профиля"""
    
    from datetime import datetime, timedelta
    from sqlalchemy import and_, func
    
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
                models.Candidate.created_at >= day_start,
                models.Candidate.created_at < day_end
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
    
    status_distribution = []
    for status, count in status_counts:
        status_distribution.append({"name": status, "value": count})
    
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
                models.Candidate.created_at >= month_start,
                models.Candidate.created_at < month_end
            )
        ).count()
        
        hired = db.query(models.Candidate).filter(
            and_(
                models.Candidate.scout_id == current_user.id,
                models.Candidate.status == "hired",
                models.Candidate.created_at >= month_start,
                models.Candidate.created_at < month_end
            )
        ).count()
        
        monthly.append({
            "month": month_start.strftime("%b %Y"),
            "total": total,
            "hired": hired
        })
    
    monthly.reverse()
    
    # Реферальная статистика
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id
    ).all()
    
    return {
        "daily": daily,
        "statusDistribution": status_distribution,
        "monthlyProgress": monthly,
        "referrals": {
            "total": len(referrals),
            "active": len([r for r in referrals if r.status == "bonus_granted"]),
            "pending": len([r for r in referrals if r.status == "pending"]),
            "bonus": current_user.referral_bonus
        }
    }
