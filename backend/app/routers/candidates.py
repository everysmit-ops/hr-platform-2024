from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin
from app.routers.notifications import create_notification

router = APIRouter()

@router.get("/", response_model=List[schemas.CandidateResponse])
async def get_candidates(
    status: Optional[str] = None,
    search: Optional[str] = Query(None, description="Поиск по имени или ключевым словам"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список кандидатов"""
    query = db.query(models.Candidate)
    
    if current_user.role != "admin":
        query = query.filter(models.Candidate.scout_id == current_user.id)
    
    if status:
        query = query.filter(models.Candidate.status == status)
    
    if search:
        query = query.filter(
            (models.Candidate.name.contains(search)) |
            (models.Candidate.keywords.contains(search))
        )
    
    candidates = query.order_by(models.Candidate.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for c in candidates:
        c_dict = schemas.CandidateResponse.from_orm(c)
        if c.scout:
            c_dict.scout_name = c.scout.first_name
        result.append(c_dict)
    
    return result

@router.get("/pending", response_model=List[schemas.CandidateResponse])
async def get_pending_candidates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить кандидаты на модерацию (статус new)"""
    
    candidates = db.query(models.Candidate).filter(
        models.Candidate.status == "new"
    ).order_by(models.Candidate.created_at.desc()).all()
    
    result = []
    for c in candidates:
        c_dict = schemas.CandidateResponse.from_orm(c)
        if c.scout:
            c_dict.scout_name = c.scout.first_name
        result.append(c_dict)
    
    return result

@router.get("/successful", response_model=List[schemas.CandidateResponse])
async def get_successful_candidates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить успешных кандидатов (2+ смены)"""
    
    query = db.query(models.Candidate).filter(
        models.Candidate.is_successful == True
    )
    
    if current_user.role != "admin":
        query = query.filter(models.Candidate.scout_id == current_user.id)
    
    candidates = query.order_by(models.Candidate.successful_at.desc()).all()
    
    result = []
    for c in candidates:
        c_dict = schemas.CandidateResponse.from_orm(c)
        if c.scout:
            c_dict.scout_name = c.scout.first_name
        result.append(c_dict)
    
    return result

@router.post("/create", response_model=schemas.CandidateResponse)
async def create_candidate(
    candidate_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Создать новую анкету кандидата"""
    
    candidate_id = f"CAND{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    # Начальная история статусов
    status_history = [{
        "status": "new",
        "date": datetime.utcnow().isoformat(),
        "changed_by": current_user.id,
        "changed_by_name": current_user.first_name
    }]
    
    candidate = models.Candidate(
        candidate_id=candidate_id,
        name=candidate_data.get("name"),
        username=candidate_data.get("username"),
        keywords=candidate_data.get("keywords"),
        status="new",
        status_history=status_history,
        chat=candidate_data.get("chat"),
        message_link=candidate_data.get("message_link"),
        message_text=candidate_data.get("message_text"),
        contacts=candidate_data.get("contacts"),
        found_date=datetime.utcnow(),
        scout_id=current_user.id
    )
    
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # Уведомление админам
    from app.socket_manager import notify_admins
    await notify_admins("new_candidate", {
        "candidate_id": candidate.id,
        "name": candidate.name,
        "scout": current_user.first_name
    })
    
    return candidate

@router.patch("/{candidate_id}/status", response_model=schemas.CandidateResponse)
async def update_candidate_status(
    candidate_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить статус кандидата"""
    
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Проверка прав
    if current_user.role != "admin" and candidate.scout_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    old_status = candidate.status
    new_status = status_update.get("status")
    
    # Обновляем статус
    candidate.status = new_status
    candidate.updated_at = datetime.utcnow()
    
    # Если указана дата собеседования
    if "interview_date" in status_update:
        candidate.interview_date = datetime.fromisoformat(status_update["interview_date"])
    
    # Добавляем запись в историю
    status_history = candidate.status_history or []
    status_history.append({
        "status": new_status,
        "date": datetime.utcnow().isoformat(),
        "changed_by": current_user.id,
        "changed_by_name": current_user.first_name,
        "old_status": old_status,
        "interview_date": status_update.get("interview_date"),
        "rejection_reason": status_update.get("rejection_reason")
    })
    candidate.status_history = status_history
    
    # Если статус "registered", увеличиваем счетчик смен
    if new_status == "registered":
        candidate.shifts_completed = (candidate.shifts_completed or 0) + 1
        
        # Проверяем, достиг ли кандидат статуса "successful" (2+ смены)
        if candidate.shifts_completed >= 2:
            candidate.is_successful = True
            candidate.successful_at = datetime.utcnow()
    
    # Если статус "successful" проставлен вручную
    if new_status == "successful":
        candidate.is_successful = True
        candidate.successful_at = datetime.utcnow()
    
    # Если админ одобряет/отклоняет
    if new_status in ["approved", "rejected"] and current_user.role == "admin":
        candidate.approved_by = current_user.id
        candidate.approved_at = datetime.utcnow()
        if new_status == "rejected" and "rejection_reason" in status_update:
            candidate.rejection_reason = status_update["rejection_reason"]
    
    db.commit()
    db.refresh(candidate)
    
    # Создаем уведомление
    await create_notification(
        user_id=candidate.scout_id,
        type="candidate_status",
        title=f"Статус кандидата изменен",
        message=f"Статус кандидата {candidate.name} изменен с {old_status} на {new_status}",
        data={
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "old_status": old_status,
            "new_status": new_status
        },
        db=db
    )
    
    result = schemas.CandidateResponse.from_orm(candidate)
    if candidate.scout:
        result.scout_name = candidate.scout.first_name
    
    return result

@router.post("/{candidate_id}/interview", response_model=schemas.CandidateResponse)
async def schedule_interview(
    candidate_id: int,
    interview_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Назначить собеседование кандидату"""
    
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    interview_date = datetime.fromisoformat(interview_data["interview_date"])
    
    # Обновляем статус и дату
    old_status = candidate.status
    candidate.status = "interview_scheduled"
    candidate.interview_date = interview_date
    candidate.updated_at = datetime.utcnow()
    
    # Добавляем в историю
    status_history = candidate.status_history or []
    status_history.append({
        "status": "interview_scheduled",
        "date": datetime.utcnow().isoformat(),
        "changed_by": current_user.id,
        "changed_by_name": current_user.first_name,
        "old_status": old_status,
        "interview_date": interview_date.isoformat()
    })
    candidate.status_history = status_history
    
    db.commit()
    db.refresh(candidate)
    
    # Уведомление
    await create_notification(
        user_id=candidate.scout_id,
        type="interview_scheduled",
        title="Назначено собеседование",
        message=f"Собеседование с {candidate.name} назначено на {interview_date.strftime('%d.%m.%Y %H:%M')}",
        data={
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "interview_date": interview_date.isoformat()
        },
        db=db
    )
    
    return candidate

@router.post("/{candidate_id}/shifts", response_model=schemas.CandidateResponse)
async def update_shifts(
    candidate_id: int,
    shifts_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Обновить количество отработанных смен"""
    
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Увеличиваем счетчик смен
    candidate.shifts_completed = (candidate.shifts_completed or 0) + 1
    
    # Проверяем, достиг ли статуса успешного
    if candidate.shifts_completed >= 2 and not candidate.is_successful:
        candidate.is_successful = True
        candidate.successful_at = datetime.utcnow()
        candidate.status = "successful"
        
        # Добавляем в историю
        status_history = candidate.status_history or []
        status_history.append({
            "status": "successful",
            "date": datetime.utcnow().isoformat(),
            "changed_by": current_user.id,
            "changed_by_name": current_user.first_name,
            "old_status": candidate.status,
            "shifts_completed": candidate.shifts_completed
        })
        candidate.status_history = status_history
    
    candidate.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(candidate)
    
    return candidate
