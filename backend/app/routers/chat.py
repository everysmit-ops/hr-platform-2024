from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_chat_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список пользователей для чата"""
    
    users = db.query(models.User).filter(
        models.User.id != current_user.id,
        models.User.is_active == True
    ).all()
    
    # Добавляем количество непрочитанных сообщений
    for user in users:
        unread_count = db.query(models.Message).filter(
            models.Message.sender_id == user.id,
            models.Message.receiver_id == current_user.id,
            models.Message.read == False
        ).count()
        user.unread_count = unread_count
    
    return users

@router.get("/messages/{user_id}", response_model=List[schemas.MessageResponse])
async def get_messages(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить переписку с конкретным пользователем"""
    
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & (models.Message.receiver_id == user_id)) |
        ((models.Message.sender_id == user_id) & (models.Message.receiver_id == current_user.id))
    ).order_by(models.Message.created_at).all()
    
    return messages

@router.post("/send", response_model=schemas.MessageResponse)
async def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отправить сообщение"""
    
    new_message = models.Message(
        text=message.text,
        sender_id=current_user.id,
        receiver_id=message.receiver_id
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@router.post("/read/{user_id}")
async def mark_as_read(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отметить сообщения от пользователя как прочитанные"""
    
    db.query(models.Message).filter(
        models.Message.sender_id == user_id,
        models.Message.receiver_id == current_user.id,
        models.Message.read == False
    ).update({"read": True})
    
    db.commit()
    
    return {"status": "ok"}
