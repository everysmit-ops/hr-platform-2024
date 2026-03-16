from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.database import get_db
from app.models import models
from app.schemas import schemas
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.post("/create", response_model=schemas.TeamResponse)
async def create_team(
    team_data: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Создать команду"""
    
    # Проверяем, не состоит ли пользователь уже в команде
    if current_user.team_id:
        raise HTTPException(status_code=400, detail="You are already in a team")
    
    # Проверяем подписку (только Business позволяет создавать команды)
    subscription = current_user.subscription
    if not subscription or subscription.plan_id != "business":
        raise HTTPException(
            status_code=403, 
            detail="Team creation requires Business subscription"
        )
    
    # Создаем команду
    team = models.Team(
        name=team_data.name,
        description=team_data.description,
        owner_id=current_user.id
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Добавляем владельца в команду
    team_member = models.TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="owner",
        commission_share=10
    )
    
    current_user.team_id = team.id
    current_user.team_role = "owner"
    current_user.team_joined_at = datetime.utcnow()
    
    db.add(team_member)
    db.commit()
    
    return team

@router.post("/invite")
async def invite_to_team(
    invite: schemas.TeamInvite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Пригласить пользователя в команду"""
    
    # Проверяем права
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ищем пользователя
    user = None
    if invite.email:
        user = db.query(models.User).filter(models.User.email == invite.email).first()
    elif invite.telegram_id:
        user = db.query(models.User).filter(
            models.User.telegram_id == invite.telegram_id
        ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.team_id:
        raise HTTPException(status_code=400, detail="User is already in a team")
    
    # Создаем приглашение
    # В реальном проекте здесь будет создание записи в таблице Invites
    # и отправка уведомления пользователю
    
    return {
        "message": f"Invitation sent to {user.first_name}",
        "user_id": user.id,
        "team_id": current_user.team_id
    }

@router.post("/members/{user_id}/role")
async def change_member_role(
    user_id: int,
    new_role: str,
    commission_share: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Изменить роль участника команды"""
    
    # Проверяем права (только владелец)
    if current_user.team_role != "owner":
        raise HTTPException(status_code=403, detail="Only team owner can change roles")
    
    # Находим участника
    member = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == user_id,
        models.TeamMember.team_id == current_user.team_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Обновляем роль
    allowed_roles = ["admin", "member"]
    if new_role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    member.role = new_role
    
    # Обновляем долю комиссии
    if commission_share is not None:
        if commission_share < 0 or commission_share > 100:
            raise HTTPException(status_code=400, detail="Commission share must be between 0 and 100")
        member.commission_share = commission_share
    
    db.commit()
    
    return {"message": f"Member role updated to {new_role}"}

@router.delete("/members/{user_id}")
async def remove_from_team(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Удалить участника из команды"""
    
    # Проверяем права
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Нельзя удалить владельца
    if user_id == current_user.team.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove team owner")
    
    # Находим участника
    member = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == user_id,
        models.TeamMember.team_id == current_user.team_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Удаляем
    user = member.user
    user.team_id = None
    user.team_role = None
    user.team_joined_at = None
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed from team"}

@router.get("/my", response_model=dict)
async def get_my_team(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Получить информацию о своей команде"""
    
    if not current_user.team_id:
        return {"has_team": False}
    
    team = db.query(models.Team).filter(models.Team.id == current_user.team_id).first()
    
    if not team:
        return {"has_team": False}
    
    # Получаем участников
    members = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team.id
    ).all()
    
    # Статистика команды
    total_candidates = db.query(models.Candidate).filter(
        models.Candidate.scout_id.in_([m.user_id for m in members])
    ).count()
    
    total_hired = db.query(models.Candidate).filter(
        models.Candidate.scout_id.in_([m.user_id for m in members]),
        models.Candidate.status == "hired"
    ).count()
    
    team_stats = {
        "total_candidates": total_candidates,
        "total_hired": total_hired,
        "conversion_rate": round((total_hired / total_candidates * 100) if total_candidates else 0, 1),
        "total_earned": team.total_earned
    }
    
    return {
        "has_team": True,
        "team": {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "owner_id": team.owner_id,
            "total_members": len(members),
            "stats": team_stats
        },
        "members": [
            {
                "id": m.user_id,
                "name": m.user.first_name,
                "avatar": m.user.avatar,
                "role": m.role,
                "commission_share": m.commission_share,
                "joined_at": m.joined_at.isoformat()
            } for m in members
        ]
    }

@router.post("/leave")
async def leave_team(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Покинуть команду"""
    
    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="Not in a team")
    
    # Владелец не может покинуть команду (должен передать права или удалить)
    if current_user.team_role == "owner":
        raise HTTPException(
            status_code=400, 
            detail="Team owner cannot leave. Transfer ownership first or delete the team."
        )
    
    # Удаляем из команды
    member = db.query(models.TeamMember).filter(
        models.TeamMember.user_id == current_user.id,
        models.TeamMember.team_id == current_user.team_id
    ).first()
    
    if member:
        db.delete(member)
    
    current_user.team_id = None
    current_user.team_role = None
    current_user.team_joined_at = None
    
    db.commit()
    
    return {"message": "You have left the team"}

@router.delete("/delete")
async def delete_team(
    confirm: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Удалить команду (только владелец)"""
    
    if current_user.team_role != "owner":
        raise HTTPException(status_code=403, detail="Only team owner can delete the team")
    
    if not confirm:
        raise HTTPException(
            status_code=400, 
            detail="Please confirm team deletion with confirm=true"
        )
    
    team = db.query(models.Team).filter(models.Team.id == current_user.team_id).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Удаляем всех участников
    db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team.id
    ).delete()
    
    # Обновляем пользователей
    db.query(models.User).filter(
        models.User.team_id == team.id
    ).update({
        "team_id": None,
        "team_role": None,
        "team_joined_at": None
    })
    
    # Удаляем команду
    db.delete(team)
    db.commit()
    
    return {"message": "Team deleted successfully"}
