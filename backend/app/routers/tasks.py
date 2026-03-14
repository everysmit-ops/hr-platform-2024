from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.TaskResponse])
async def get_tasks(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список задач текущего пользователя"""
    query = db.query(models.Task).filter(models.Task.assigned_to == current_user.id)
    
    if status:
        query = query.filter(models.Task.status == status)
    
    tasks = query.order_by(models.Task.created_at.desc()).all()
    return tasks

@router.post("/", response_model=schemas.TaskResponse)
async def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новую задачу (только для админа)"""
    
    new_task = models.Task(
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        priority=task.priority,
        assigned_to=task.assigned_to,
        created_by=current_user.id
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task

@router.patch("/{task_id}/complete", response_model=schemas.TaskResponse)
async def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Отметить задачу как выполненную"""
    
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task.status = "completed"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    return task

@router.get("/{task_id}", response_model=schemas.TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить задачу по ID"""
    
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.assigned_to != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return task
