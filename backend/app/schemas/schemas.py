from pydantic import BaseModel  # <- ЭТОЙ СТРОКИ НЕ ХВАТАЕТ
from typing import Optional, List, Dict
from datetime import datetime

# Subscription schemas
class SubscriptionPlanBase(BaseModel):
    name: str
    code: str
    price: int
    currency: str = "RUB"
    interval: str = "month"
    max_candidates: int = 100
    max_scouts: int = 1
    max_storage: int = 100
    features: Dict = {}
    custom_profile_enabled: bool = False
    animated_avatar: bool = False
    custom_nickname_style: bool = False
    emoji_nickname: bool = False
    custom_badge: bool = False

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserSubscriptionBase(BaseModel):
    plan_id: int
    auto_renew: bool = True

class UserSubscriptionCreate(UserSubscriptionBase):
    user_id: int

class UserSubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan: SubscriptionPlanResponse
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    auto_renew: bool
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    # ... остальные поля

class UserCreate(UserBase):
    role: str = "scout"

# Premium customization
class PremiumProfileUpdate(BaseModel):
    animated_avatar: Optional[str] = None
    nickname_style: Optional[Dict] = None
    nickname_emoji: Optional[str] = None
    custom_badge: Optional[Dict] = None
    profile_theme: Optional[Dict] = None

# Partner schemas
class PartnerProgramBase(BaseModel):
    name: str
    code: str
    description: str
    commission_percent: int = 10
    commission_fixed: int = 0
    min_payout: int = 1000
    requirements: Dict = {}
    benefits: Dict = {}

class PartnerProgramResponse(PartnerProgramBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PartnerBase(BaseModel):
    user_id: int
    program_id: int

class PartnerResponse(BaseModel):
    id: int
    user_id: int
    program: PartnerProgramResponse
    total_earned: int
    total_withdrawn: int
    current_balance: int
    level: int
    level_name: Optional[str] = None
    team_size: int
    team_commission: int
    joined_at: datetime
    referral_link: str
    
    class Config:
        from_attributes = True

class PartnerTransactionResponse(BaseModel):
    id: int
    type: str
    amount: int
    balance_after: int
    description: str
    created_at: datetime
    referral_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Team schemas
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    owner_id: int

class TeamResponse(TeamBase):
    id: int
    owner_id: int
    total_members: int
    total_earned: int
    settings: Dict
    created_at: datetime
    members: List[Dict] = []
    
    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    role: str
    joined_at: datetime
    commission_share: int
    
    class Config:
        from_attributes = True

class TeamInvite(BaseModel):
    email: Optional[str] = None
    telegram_id: Optional[int] = None
    role: str = "member"
    commission_share: int = 0

class UserResponse(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    # ... остальные поля
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
