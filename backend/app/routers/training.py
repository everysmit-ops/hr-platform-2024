from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.TrainingResponse])
async def get_trainings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список всех обучающих материалов"""
    
    trainings = db.query(models.Training).order_by(
        models.Training.order,
        models.Training.created_at.desc()
    ).all()
    
    result = []
    for t in trainings:
        t_dict = schemas.TrainingResponse.from_orm(t)
        if t.author:
            t_dict.author_name = t.author.first_name
        result.append(t_dict)
    
    return result

@router.get("/mandatory", response_model=List[schemas.TrainingResponse])
async def get_mandatory_trainings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список обязательных тренингов"""
    
    trainings = db.query(models.Training).filter(
        models.Training.is_mandatory == True
    ).order_by(models.Training.order).all()
    
    result = []
    for t in trainings:
        t_dict = schemas.TrainingResponse.from_orm(t)
        if t.author:
            t_dict.author_name = t.author.first_name
        result.append(t_dict)
    
    return result

@router.get("/my", response_model=List[schemas.UserTrainingResponse])
async def get_my_trainings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить прогресс пользователя по тренингам"""
    
    user_trainings = db.query(models.UserTraining).filter(
        models.UserTraining.user_id == current_user.id
    ).all()
    
    result = []
    for ut in user_trainings:
        ut_dict = schemas.UserTrainingResponse.from_orm(ut)
        if ut.training:
            ut_dict.training_title = ut.training.title
            ut_dict.training_description = ut.training.description
        result.append(ut_dict)
    
    return result

@router.post("/{training_id}/start")
async def start_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Начать обучение"""
    
    training = db.query(models.Training).filter(models.Training.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    # Проверяем, есть ли уже запись
    user_training = db.query(models.UserTraining).filter(
        models.UserTraining.user_id == current_user.id,
        models.UserTraining.training_id == training_id
    ).first()
    
    if not user_training:
        user_training = models.UserTraining(
            user_id=current_user.id,
            training_id=training_id,
            status="in_progress"
        )
        db.add(user_training)
        db.commit()
    
    return {"message": "Training started", "status": user_training.status}

@router.post("/{training_id}/complete")
async def complete_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Завершить обучение"""
    
    user_training = db.query(models.UserTraining).filter(
        models.UserTraining.user_id == current_user.id,
        models.UserTraining.training_id == training_id
    ).first()
    
    if not user_training:
        raise HTTPException(status_code=404, detail="Training not started")
    
    user_training.status = "completed"
    user_training.completed_at = datetime.utcnow()
    db.commit()
    
    # Проверяем, все ли обязательные тренинги пройдены
    mandatory = db.query(models.Training).filter(
        models.Training.is_mandatory == True
    ).all()
    
    completed = db.query(models.UserTraining).filter(
        models.UserTraining.user_id == current_user.id,
        models.UserTraining.status == "completed"
    ).count()
    
    all_completed = len(mandatory) == completed
    
    return {
        "message": "Training completed",
        "all_mandatory_completed": all_completed
    }

@router.get("/check-access")
async def check_access(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Проверить, есть ли у пользователя доступ к приложению"""
    
    mandatory = db.query(models.Training).filter(
        models.Training.is_mandatory == True
    ).all()
    
    if not mandatory:
        return {"has_access": True, "message": "No mandatory trainings"}
    
    completed = db.query(models.UserTraining).filter(
        models.UserTraining.user_id == current_user.id,
        models.UserTraining.status == "completed"
    ).count()
    
    has_access = len(mandatory) == completed
    
    if not has_access:
        remaining = len(mandatory) - completed
        return {
            "has_access": False,
            "message": f"Please complete {remaining} mandatory training(s)",
            "remaining": remaining
        }
    
    return {"has_access": True, "message": "Access granted"}

# Админские эндпоинты
@router.post("/", response_model=schemas.TrainingResponse)
async def create_training(
    training_data: schemas.TrainingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый тренинг (только для админа)"""
    
    training = models.Training(
        **training_data.dict(),
        created_by=current_user.id
    )
    
    db.add(training)
    db.commit()
    db.refresh(training)
    
    result = schemas.TrainingResponse.from_orm(training)
    result.author_name = current_user.first_name
    
    return result

@router.patch("/{training_id}", response_model=schemas.TrainingResponse)
async def update_training(
    training_id: int,
    training_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить тренинг (только для админа)"""
    
    training = db.query(models.Training).filter(models.Training.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    for field, value in training_data.items():
        setattr(training, field, value)
    
    db.commit()
    db.refresh(training)
    
    result = schemas.TrainingResponse.from_orm(training)
    if training.author:
        result.author_name = training.author.first_name
    
    return result

@router.delete("/{training_id}")
async def delete_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить тренинг (только для админа)"""
    
    training = db.query(models.Training).filter(models.Training.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    
    db.delete(training)
    db.commit()
    
    return {"message": "Training deleted successfully"}

@router.get("/stats", response_model=dict)
async def get_training_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить статистику по обучению (только для админа)"""
    
    total_trainings = db.query(models.Training).count()
    mandatory = db.query(models.Training).filter(models.Training.is_mandatory == True).count()
    
    total_users = db.query(models.User).count()
    users_completed_all = 0
    
    users = db.query(models.User).all()
    for user in users:
        completed = db.query(models.UserTraining).filter(
            models.UserTraining.user_id == user.id,
            models.UserTraining.status == "completed"
        ).count()
        if completed == mandatory:
            users_completed_all += 1
    
    return {
        "total_trainings": total_trainings,
        "mandatory_trainings": mandatory,
        "total_users": total_users,
        "users_completed_all": users_completed_all,
        "completion_rate": round(users_completed_all / total_users * 100, 1) if total_users > 0 else 0
    }
