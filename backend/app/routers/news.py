from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.NewsResponse])
async def get_news(
    skip: int = 0,
    limit: int = 20,
    pinned_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список новостей"""
    
    query = db.query(models.News)
    
    if pinned_only:
        query = query.filter(models.News.is_pinned == True)
    
    news = query.order_by(
        models.News.is_pinned.desc(),
        models.News.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for item in news:
        item_dict = schemas.NewsResponse.from_orm(item)
        if item.author:
            item_dict.author_name = item.author.first_name
        result.append(item_dict)
    
    return result

@router.get("/{news_id}", response_model=schemas.NewsResponse)
async def get_news_detail(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить детальную новость"""
    
    news = db.query(models.News).filter(models.News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Увеличиваем счетчик просмотров
    news.views += 1
    db.commit()
    
    result = schemas.NewsResponse.from_orm(news)
    if news.author:
        result.author_name = news.author.first_name
    
    return result

@router.post("/", response_model=schemas.NewsResponse)
async def create_news(
    news_data: schemas.NewsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новость (только для админа)"""
    
    news = models.News(
        title=news_data.title,
        content=news_data.content,
        image_url=news_data.image_url,
        created_by=current_user.id
    )
    
    db.add(news)
    db.commit()
    db.refresh(news)
    
    result = schemas.NewsResponse.from_orm(news)
    result.author_name = current_user.first_name
    
    return result

@router.patch("/{news_id}", response_model=schemas.NewsResponse)
async def update_news(
    news_id: int,
    news_update: schemas.NewsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить новость (только для админа)"""
    
    news = db.query(models.News).filter(models.News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    update_data = news_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(news, field, value)
    
    news.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(news)
    
    result = schemas.NewsResponse.from_orm(news)
    if news.author:
        result.author_name = news.author.first_name
    
    return result

@router.delete("/{news_id}")
async def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить новость (только для админа)"""
    
    news = db.query(models.News).filter(models.News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    db.delete(news)
    db.commit()
    
    return {"message": "News deleted successfully"}

@router.post("/{news_id}/pin")
async def pin_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Закрепить/открепить новость (только для админа)"""
    
    news = db.query(models.News).filter(models.News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    news.is_pinned = not news.is_pinned
    db.commit()
    
    return {"message": f"News {'pinned' if news.is_pinned else 'unpinned'} successfully"}
