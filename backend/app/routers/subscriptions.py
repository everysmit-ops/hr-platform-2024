from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import stripe  # pip install stripe
import uuid

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

# Настройки платежной системы (в продакшене берется из .env)
STRIPE_API_KEY = "sk_test_..."  # замените на реальный ключ
stripe.api_key = STRIPE_API_KEY

# Публикуемые тарифы
PLANS = {
    "basic": {
        "name": "Базовый",
        "price": 0,
        "features": {
            "max_candidates": 50,
            "max_scouts": 1,
            "max_storage": 100,
            "custom_profile": False,
            "animated_avatar": False,
            "custom_nickname": False,
            "emoji_nickname": False,
            "custom_badge": False
        }
    },
    "pro": {
        "name": "Pro",
        "price": 990,  # 990 руб/мес
        "features": {
            "max_candidates": 500,
            "max_scouts": 5,
            "max_storage": 1000,
            "custom_profile": True,
            "animated_avatar": True,
            "custom_nickname": True,
            "emoji_nickname": True,
            "custom_badge": False
        }
    },
    "business": {
        "name": "Business",
        "price": 2990,  # 2990 руб/мес
        "features": {
            "max_candidates": 0,  # безлимит
            "max_scouts": 20,
            "max_storage": 5000,
            "custom_profile": True,
            "animated_avatar": True,
            "custom_nickname": True,
            "emoji_nickname": True,
            "custom_badge": True,
            "team_management": True,
            "api_access": True,
            "priority_support": True
        }
    }
}

@router.get("/plans", response_model=List[dict])
async def get_subscription_plans():
    """Получить все доступные тарифы"""
    return [
        {
            "id": plan_id,
            "name": details["name"],
            "price": details["price"],
            "features": details["features"],
            "is_active": True
        }
        for plan_id, details in PLANS.items()
    ]

@router.get("/my", response_model=dict)
async def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить информацию о текущей подписке пользователя"""
    
    subscription = db.query(models.UserSubscription).filter(
        models.UserSubscription.user_id == current_user.id,
        models.UserSubscription.status == "active"
    ).first()
    
    if not subscription:
        # Базовая подписка по умолчанию
        return {
            "plan_id": "basic",
            "plan_name": "Базовый",
            "status": "active",
            "features": PLANS["basic"]["features"],
            "end_date": None,
            "auto_renew": False
        }
    
    plan_details = PLANS.get(subscription.plan_id, PLANS["basic"])
    
    return {
        "id": subscription.id,
        "plan_id": subscription.plan_id,
        "plan_name": plan_details["name"],
        "status": subscription.status,
        "features": plan_details["features"],
        "start_date": subscription.start_date,
        "end_date": subscription.end_date,
        "auto_renew": subscription.auto_renew
    }

@router.post("/subscribe/{plan_id}")
async def subscribe_to_plan(
    plan_id: str,
    payment_method: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Оформить подписку на тариф"""
    
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan = PLANS[plan_id]
    
    # Проверяем существующую подписку
    existing = db.query(models.UserSubscription).filter(
        models.UserSubscription.user_id == current_user.id,
        models.UserSubscription.status == "active"
    ).first()
    
    if existing:
        # Отменяем старую подписку
        existing.status = "cancelled"
        existing.cancelled_at = datetime.utcnow()
    
    # Создаем платеж (для бесплатного тарифа пропускаем)
    payment_id = None
    if plan["price"] > 0:
        try:
            # В реальном проекте здесь интеграция с платежной системой
            payment_intent = stripe.PaymentIntent.create(
                amount=plan["price"],
                currency="rub",
                payment_method=payment_method,
                confirm=True,
                metadata={
                    "user_id": current_user.id,
                    "plan_id": plan_id
                }
            )
            payment_id = payment_intent.id
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Payment failed: {str(e)}")
    
    # Создаем подписку
    subscription = models.UserSubscription(
        user_id=current_user.id,
        plan_id=plan_id,
        status="active",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30),
        auto_renew=True,
        payment_provider="stripe",
        payment_id=payment_id
    )
    
    db.add(subscription)
    db.commit()
    
    return {
        "message": f"Successfully subscribed to {plan['name']} plan",
        "plan_id": plan_id,
        "features": plan["features"]
    }

@router.post("/cancel")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отменить подписку"""
    
    subscription = db.query(models.UserSubscription).filter(
        models.UserSubscription.user_id == current_user.id,
        models.UserSubscription.status == "active"
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.utcnow()
    subscription.auto_renew = False
    
    db.commit()
    
    return {"message": "Subscription cancelled successfully"}

@router.get("/features")
async def get_available_features(
    current_user: models.User = Depends(get_current_user)
):
    """Получить доступные функции на основе подписки"""
    
    subscription = await get_my_subscription(db=None, current_user=current_user)
    features = subscription["features"]
    
    return {
        "can_customize_profile": features.get("custom_profile", False),
        "can_animate_avatar": features.get("animated_avatar", False),
        "can_customize_nickname": features.get("custom_nickname", False),
        "can_add_emoji": features.get("emoji_nickname", False),
        "can_have_badge": features.get("custom_badge", False),
        "max_candidates": features.get("max_candidates", 50),
        "max_scouts": features.get("max_scouts", 1),
        "max_storage": features.get("max_storage", 100)
    }
