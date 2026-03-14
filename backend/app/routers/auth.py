from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

from app.database.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

# Константы для JWT
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/auth", response_model=schemas.TokenResponse)
async def authenticate(auth_data: schemas.TelegramAuthData, db: Session = Depends(get_db)):
    """Аутентификация через Telegram данные"""
    
    # Ищем пользователя по telegram_id
    user = db.query(models.User).filter(
        models.User.telegram_id == auth_data.telegram_id
    ).first()
    
    if not user:
        # Создаем нового пользователя
        user = models.User(
            telegram_id=auth_data.telegram_id,
            username=auth_data.username,
            first_name=auth_data.first_name,
            last_name=auth_data.last_name,
            avatar=auth_data.photo_url,
            last_active=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Обновляем последнюю активность
        user.last_active = datetime.utcnow()
        user.username = auth_data.username or user.username
        user.first_name = auth_data.first_name or user.first_name
        user.last_name = auth_data.last_name or user.last_name
        user.avatar = auth_data.photo_url or user.avatar
        db.commit()
    
    # Создаем JWT токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.telegram_id)}, expires_delta=access_token_expires
    )
    
    # Преобразуем в response схему
    user_response = schemas.UserResponse.from_orm(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }
