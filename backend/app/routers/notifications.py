from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin
from app.socket_manager import notify_user

router = APIRouter()

# Функция для создания уведомления
async def create_notification(
    user_id: int,
    type: str,
    title: str,
    message: str,
    data: dict = None,
    priority: str = "normal",
    db: Session = None
):
    """Создать уведомление для пользователя"""
    
    notification = models.Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        data=data or {},
        priority=priority
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Отправляем через WebSocket
    await notify_user(user_id, "notification", {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "priority": notification.priority,
        "created_at": notification.created_at.isoformat()
    })
    
    return notification

@router.get("/", response_model=List[dict])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить уведомления пользователя"""
    
    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(models.Notification.read == False)
    
    notifications = query.order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "data": n.data,
            "priority": n.priority,
            "read": n.read,
            "created_at": n.created_at.isoformat()
        })
    
    return result

@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить количество непрочитанных уведомлений"""
    
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.read == False
    ).count()
    
    return {"count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отметить уведомление как прочитанное"""
    
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}

@router.post("/read-all")
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отметить все уведомления как прочитанные"""
    
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.read == False
    ).update({"read": True, "read_at": datetime.utcnow()})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Удалить уведомление"""
    
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}

@router.delete("/all")
async def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Удалить все уведомления пользователя"""
    
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "All notifications deleted"}
