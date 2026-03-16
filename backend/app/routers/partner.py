from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import random
import string

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

# Генерация уникального партнерского кода
def generate_partner_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return 'PRT' + ''.join(random.choices(chars, k=length))

@router.post("/join")
async def join_partner_program(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Вступить в партнерскую программу"""
    
    # Проверяем, не состоит ли уже
    existing = db.query(models.Partner).filter(
        models.Partner.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in partner program")
    
    # Получаем активную программу
    program = db.query(models.PartnerProgram).filter(
        models.PartnerProgram.is_active == True
    ).first()
    
    if not program:
        # Создаем программу по умолчанию
        program = models.PartnerProgram(
            name="Every Scouting Partner",
            code="ES_PARTNER",
            description="Базовая партнерская программа",
            commission_percent=10,
            min_payout=1000,
            requirements={
                "min_referrals": 0,
                "min_earnings": 0
            },
            benefits={
                "commission": "10% от платежей рефералов",
                "bonuses": "Дополнительные бонусы за активность"
            }
        )
        db.add(program)
        db.commit()
        db.refresh(program)
    
    # Создаем партнера
    partner = models.Partner(
        user_id=current_user.id,
        program_id=program.id,
        level=1,
        level_name="Новичок",
        team_commission=5,
        joined_at=datetime.utcnow()
    )
    
    db.add(partner)
    db.commit()
    db.refresh(partner)
    
    return {
        "message": "Successfully joined partner program",
        "level": partner.level_name,
        "commission": program.commission_percent,
        "referral_link": f"https://t.me/every_scouting_bot?start={current_user.referral_code or current_user.id}"
    }

@router.get("/my", response_model=dict)
async def get_partner_info(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить информацию о партнерстве"""
    
    partner = db.query(models.Partner).filter(
        models.Partner.user_id == current_user.id
    ).first()
    
    if not partner:
        return {"is_partner": False}
    
    # Получаем рефералов
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id
    ).all()
    
    # Получаем транзакции
    transactions = db.query(models.PartnerTransaction).filter(
        models.PartnerTransaction.partner_id == partner.id
    ).order_by(models.PartnerTransaction.created_at.desc()).limit(10).all()
    
    # Считаем статистику
    active_referrals = len([r for r in referrals if r.status == "bonus_granted"])
    total_earned = partner.total_earned
    current_balance = partner.current_balance
    
    # Определяем следующий уровень
    next_level = None
    next_level_requirement = None
    
    if partner.level == 1:
        if total_earned >= 5000:
            next_level = 2
            next_level_requirement = 0
        else:
            next_level = 2
            next_level_requirement = 5000 - total_earned
    elif partner.level == 2:
        if total_earned >= 20000:
            next_level = 3
            next_level_requirement = 0
        else:
            next_level = 3
            next_level_requirement = 20000 - total_earned
    
    return {
        "is_partner": True,
        "level": partner.level,
        "level_name": partner.level_name,
        "total_earned": total_earned,
        "current_balance": current_balance,
        "total_referrals": len(referrals),
        "active_referrals": active_referrals,
        "team_size": partner.team_size,
        "team_commission": partner.team_commission,
        "referral_link": f"https://t.me/every_scouting_bot?start={current_user.referral_code or current_user.id}",
        "next_level": next_level,
        "next_level_requirement": next_level_requirement,
        "recent_transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": t.amount,
                "description": t.description,
                "created_at": t.created_at.isoformat()
            } for t in transactions
        ]
    }

@router.get("/stats")
async def get_partner_stats(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить статистику партнера"""
    
    partner = db.query(models.Partner).filter(
        models.Partner.user_id == current_user.id
    ).first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Not a partner")
    
    # Определяем период
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    # Транзакции за период
    transactions = db.query(models.PartnerTransaction).filter(
        models.PartnerTransaction.partner_id == partner.id,
        models.PartnerTransaction.created_at >= start_date
    ).all()
    
    # Статистика по дням
    daily_stats = {}
    for t in transactions:
        day = t.created_at.strftime("%Y-%m-%d")
        if day not in daily_stats:
            daily_stats[day] = {"earned": 0, "referrals": 0}
        
        if t.type == "referral_commission":
            daily_stats[day]["earned"] += t.amount
        elif t.type == "referral_joined":
            daily_stats[day]["referrals"] += 1
    
    # Рефералы по уровням
    referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id
    ).all()
    
    level_stats = {
        "pending": len([r for r in referrals if r.status == "pending"]),
        "active": len([r for r in referrals if r.status == "active"]),
        "bonus_granted": len([r for r in referrals if r.status == "bonus_granted"])
    }
    
    return {
        "period": period,
        "total_earned_period": sum(t.amount for t in transactions if t.type in ["referral_commission", "team_commission"]),
        "total_referrals_period": len([r for r in referrals if r.created_at >= start_date]),
        "daily_stats": daily_stats,
        "level_stats": level_stats,
        "conversion_rate": round(
            (level_stats["bonus_granted"] / len(referrals) * 100) if referrals else 0, 1
        )
    }

@router.post("/withdraw")
async def withdraw_funds(
    amount: int,
    payment_method: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Вывести средства"""
    
    partner = db.query(models.Partner).filter(
        models.Partner.user_id == current_user.id
    ).first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Not a partner")
    
    if amount > partner.current_balance:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    if amount < partner.program.min_payout:
        raise HTTPException(status_code=400, detail=f"Minimum payout is {partner.program.min_payout}")
    
    # Создаем транзакцию на вывод
    transaction = models.PartnerTransaction(
        partner_id=partner.id,
        type="withdrawal",
        amount=-amount,
        balance_after=partner.current_balance - amount,
        description=f"Withdrawal via {payment_method}",
        status="pending"
    )
    
    partner.current_balance -= amount
    partner.total_withdrawn += amount
    
    db.add(transaction)
    db.commit()
    
    return {
        "message": "Withdrawal request created",
        "amount": amount,
        "new_balance": partner.current_balance,
        "status": "pending"
    }

@router.get("/leaderboard")
async def get_partner_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Получить топ партнеров"""
    
    partners = db.query(models.Partner).filter(
        models.Partner.total_earned > 0
    ).order_by(models.Partner.total_earned.desc()).limit(limit).all()
    
    result = []
    for p in partners:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": user.first_name if user else "Unknown",
            "user_avatar": user.avatar if user else None,
            "level": p.level,
            "level_name": p.level_name,
            "total_earned": p.total_earned,
            "team_size": p.team_size,
            "referrals_count": db.query(models.Referral).filter(
                models.Referral.referrer_id == p.user_id
            ).count()
        })
    
    return result

