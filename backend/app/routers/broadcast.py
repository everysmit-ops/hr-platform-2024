from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_admin
import asyncio

router = APIRouter()

# Функция для отправки сообщений через Telegram бота
async def send_telegram_message(chat_id: int, text: str):
    """Отправить сообщение через Telegram бота"""
    # Здесь будет интеграция с вашим ботом
    # Пока заглушка
    print(f"Sending message to {chat_id}: {text}")
    await asyncio.sleep(0.1)
    return True

@router.post("/send", response_model=schemas.BroadcastResponse)
async def create_broadcast(
    broadcast_data: schemas.BroadcastCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать и отправить рассылку (только для админа)"""
    
    # Получаем всех активных пользователей
    users = db.query(models.User).filter(models.User.is_active == True).all()
    
    broadcast = models.Broadcast(
        title=broadcast_data.title,
        message=broadcast_data.message,
        created_by=current_user.id,
        total_recipients=len(users)
    )
    
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)
    
    # Запускаем отправку в фоне
    background_tasks.add_task(send_broadcast, broadcast.id, users, broadcast_data.message)
    
    result = schemas.BroadcastResponse.from_orm(broadcast)
    result.author_name = current_user.first_name
    
    return result

async def send_broadcast(broadcast_id: int, users: List[models.User], message: str):
    """Фоновая задача для отправки рассылки"""
    
    sent_count = 0
    for user in users:
        if user.telegram_id:
            try:
                await send_telegram_message(user.telegram_id, message)
                sent_count += 1
                await asyncio.sleep(0.05)  # Небольшая задержка
            except:
                pass
    
    # Обновляем статус рассылки
    db = next(get_db())
    broadcast = db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
    if broadcast:
        broadcast.sent_at = datetime.utcnow()
        broadcast.total_recipients = sent_count
        db.commit()

@router.get("/history", response_model=List[schemas.BroadcastResponse])
async def get_broadcast_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить историю рассылок (только для админа)"""
    
    broadcasts = db.query(models.Broadcast).order_by(
        models.Broadcast.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for b in broadcasts:
        b_dict = schemas.BroadcastResponse.from_orm(b)
        if b.author:
            b_dict.author_name = b.author.first_name
        result.append(b_dict)
    
    return result

@router.get("/{broadcast_id}", response_model=schemas.BroadcastResponse)
async def get_broadcast_detail(
    broadcast_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить детали рассылки (только для админа)"""
    
    broadcast = db.query(models.Broadcast).filter(models.Broadcast.id == broadcast_id).first()
    
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    
    result = schemas.BroadcastResponse.from_orm(broadcast)
    if broadcast.author:
        result.author_name = broadcast.author.first_name
    
    return result
