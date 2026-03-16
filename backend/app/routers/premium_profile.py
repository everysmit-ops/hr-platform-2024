from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
import uuid
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user

router = APIRouter()

# Создаем папки для анимаций
ANIMATED_AVATAR_DIR = "uploads/animated_avatars"
os.makedirs(ANIMATED_AVATAR_DIR, exist_ok=True)

def check_premium_feature(user: models.User, feature: str) -> bool:
    """Проверить, доступна ли премиум-функция"""
    subscription = user.subscription
    if not subscription or subscription.status != "active":
        return False
    
    # Здесь можно получить фичи из подписки
    plan_features = {
        "pro": ["animated_avatar", "custom_nickname", "emoji_nickname"],
        "business": ["animated_avatar", "custom_nickname", "emoji_nickname", "custom_badge"]
    }
    
    return feature in plan_features.get(subscription.plan_id, [])

@router.post("/animated-avatar")
async def upload_animated_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Загрузить анимированный аватар (GIF/видео) - только для Premium"""
    
    # Проверяем доступность функции
    if not check_premium_feature(current_user, "animated_avatar"):
        raise HTTPException(status_code=403, detail="Premium feature not available")
    
    # Проверяем размер (макс 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Проверяем тип файла
    allowed_types = ['image/gif', 'video/mp4', 'video/webm']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File must be GIF or video (MP4/WebM)")
    
    # Генерируем уникальное имя
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"animated_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(ANIMATED_AVATAR_DIR, filename)
    
    # Сохраняем файл
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Обновляем пользователя
    current_user.animated_avatar = file_path
    db.commit()
    
    return {
        "animated_avatar": file_path,
        "message": "Animated avatar uploaded successfully"
    }

@router.post("/nickname-style")
async def update_nickname_style(
    style_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить стиль ника - только для Premium"""
    
    if not check_premium_feature(current_user, "custom_nickname"):
        raise HTTPException(status_code=403, detail="Premium feature not available")
    
    # Валидация стиля
    allowed_styles = ['bold', 'italic', 'gradient', 'glitch', 'neon', 'shadow']
    if style_data.get('style') not in allowed_styles:
        raise HTTPException(status_code=400, detail="Invalid style")
    
    current_user.nickname_style = style_data
    db.commit()
    
    return {
        "nickname_style": style_data,
        "message": "Nickname style updated"
    }

@router.post("/nickname-emoji")
async def add_nickname_emoji(
    emoji_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Добавить эмодзи к нику - только для Premium"""
    
    if not check_premium_feature(current_user, "emoji_nickname"):
        raise HTTPException(status_code=403, detail="Premium feature not available")
    
    emoji = emoji_data.get('emoji', '')
    position = emoji_data.get('position', 'before')  # before/after
    
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji is required")
    
    current_user.nickname_emoji = emoji
    current_user.nickname_emoji_position = position
    db.commit()
    
    return {
        "emoji": emoji,
        "position": position,
        "display_name": f"{emoji} {current_user.first_name}" if position == 'before' 
                       else f"{current_user.first_name} {emoji}",
        "message": "Emoji added to nickname"
    }

@router.post("/custom-badge")
async def set_custom_badge(
    badge_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Установить кастомный бейдж - только для Premium"""
    
    if not check_premium_feature(current_user, "custom_badge"):
        raise HTTPException(status_code=403, detail="Premium feature not available")
    
    # Валидация бейджа
    allowed_badges = ['vip', 'pro', 'legend', 'expert', 'top_scout']
    if badge_data.get('badge') not in allowed_badges:
        raise HTTPException(status_code=400, detail="Invalid badge")
    
    current_user.custom_badge = badge_data
    db.commit()
    
    return {
        "badge": badge_data,
        "message": "Custom badge set successfully"
    }

@router.get("/preview")
async def get_premium_preview(
    current_user: models.User = Depends(get_current_user)
):
    """Получить превью премиум-профиля"""
    
    # Формируем отображаемое имя с эмодзи
    display_name = current_user.first_name
    if current_user.nickname_emoji:
        if current_user.nickname_emoji_position == 'before':
            display_name = f"{current_user.nickname_emoji} {display_name}"
        else:
            display_name = f"{display_name} {current_user.nickname_emoji}"
    
    # Применяем стиль
    if current_user.nickname_style:
        style = current_user.nickname_style.get('style')
        if style == 'gradient':
            display_name = f"✨ {display_name} ✨"
        elif style == 'neon':
            display_name = f"💫 {display_name} 💫"
        elif style == 'glitch':
            display_name = f"⚡ {display_name} ⚡"
    
    return {
        "display_name": display_name,
        "avatar": current_user.avatar,
        "animated_avatar": current_user.animated_avatar,
        "badge": current_user.custom_badge,
        "style": current_user.nickname_style
    }
