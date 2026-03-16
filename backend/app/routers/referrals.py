from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random
import string
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

def generate_referral_code(length: int = 8) -> str:
    """Генерация уникального реферального кода"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

@router.post("/generate", response_model=schemas.ReferralResponse)
async def generate_referral_code(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Сгенерировать реферальный код для текущего пользователя"""
    
    # Проверяем, есть ли уже код у пользователя
    existing_code = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id,
        models.Referral.referred_id == None
    ).first()
    
    if existing_code:
        return existing_code
    
    # Генерируем уникальный код
    while True:
        code = generate_referral_code()
        existing = db.query(models.Referral).filter(models.Referral.code == code).first()
        if not existing:
            break
    
    # Создаем реферальный код
    referral = models.Referral(
        code=code,
        referrer_id=current_user.id,
        status="active"
    )
    
    db.add(referral)
    db.commit()
    db.refresh(referral)
    
    return referral

@router.get("/my", response_model=schemas.ReferralStats)
async def get_my_referrals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить статистику рефералов текущего пользователя"""
    
    # Все рефералы пользователя
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id
    ).all()
    
    total = len(referrals)
    active = len([r for r in referrals if r.status == "active"])
    pending = len([r for r in referrals if r.status == "pending"])
    total_bonus = sum(r.bonus_amount for r in referrals)
    
    # Формируем ссылку (для бота)
    referral_link = f"https://t.me/your_bot?start={referrals[0].code if referrals else ''}"
    
    return {
        "total_referrals": total,
        "active_referrals": active,
        "total_bonus": total_bonus,
        "pending_referrals": pending,
        "referral_link": referral_link
    }

@router.get("/list", response_model=List[schemas.ReferralResponse])
async def get_referrals_list(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список всех рефералов пользователя"""
    
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id
    ).order_by(models.Referral.created_at.desc()).all()
    
    # Добавляем имена
    result = []
    for ref in referrals:
        ref_dict = schemas.ReferralResponse.from_orm(ref)
        if ref.referred:
            ref_dict.referred_name = ref.referred.first_name
        result.append(ref_dict)
    
    return result

@router.post("/use")
async def use_referral_code(
    referral_data: schemas.ReferralUse,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Использовать реферальный код при регистрации"""
    
    # Находим код
    referral = db.query(models.Referral).filter(
        models.Referral.code == referral_data.code
    ).first()
    
    if not referral:
        raise HTTPException(status_code=404, detail="Referral code not found")
    
    if referral.referred_id:
        raise HTTPException(status_code=400, detail="Referral code already used")
    
    if referral.referrer_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    # Обновляем реферал
    referral.referred_id = current_user.id
    referral.status = "joined"
    referral.joined_at = datetime.utcnow()
    
    # Начисляем бонус (например, +10 к рейтингу)
    referral.bonus_amount = 10
    referral.status = "bonus_granted"
    referral.bonus_granted_at = datetime.utcnow()
    
    # Обновляем бонусы пользователя
    current_user.referral_bonus += 10
    current_user.rating += 1.0
    
    # Также начисляем бонус пригласившему
    referrer = db.query(models.User).filter(models.User.id == referral.referrer_id).first()
    if referrer:
        referrer.referral_bonus += 10
        referrer.rating += 1.0
    
    db.commit()
    
    return {"message": "Referral code used successfully", "bonus": 10}

@router.get("/top", response_model=List[dict])
async def get_top_referrers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Получить топ приглашающих"""
    
    users = db.query(models.User).filter(models.User.referral_bonus > 0).order_by(
        models.User.referral_bonus.desc()
    ).limit(limit).all()
    
    result = []
    for user in users:
        referrals_count = db.query(models.Referral).filter(
            models.Referral.referrer_id == user.id,
            models.Referral.status == "bonus_granted"
        ).count()
        
        result.append({
            "id": user.id,
            "name": user.first_name,
            "username": user.username,
            "avatar": user.avatar,
            "referrals_count": referrals_count,
            "bonus": user.referral_bonus,
            "rating": user.rating
        })
    
    return result

@router.get("/{user_id}", response_model=schemas.ReferralStats)
async def get_user_referrals(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить статистику рефералов другого пользователя (для админа)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == user_id
    ).all()
    
    total = len(referrals)
    active = len([r for r in referrals if r.status == "active"])
    pending = len([r for r in referrals if r.status == "pending"])
    total_bonus = sum(r.bonus_amount for r in referrals)
    
    # Формируем ссылку
    first_code = db.query(models.Referral).filter(
        models.Referral.referrer_id == user_id,
        models.Referral.referred_id == None
    ).first()
    
    referral_link = f"https://t.me/your_bot?start={first_code.code if first_code else ''}"
    
    return {
        "total_referrals": total,
        "active_referrals": active,
        "total_bonus": total_bonus,
        "pending_referrals": pending,
        "referral_link": referral_link
    }
