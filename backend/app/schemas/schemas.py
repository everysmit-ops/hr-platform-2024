from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    cover_image: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    birth_date: Optional[datetime] = None
    
    # Social
    instagram: Optional[str] = None
    telegram: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    
    # Settings
    theme: str = 'light'
    notifications_enabled: bool = True
    email_notifications: bool = False
    language: str = 'ru'
    profile_settings: Dict = {}

class UserCreate(UserBase):
    role: str = "scout"

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    cover_image: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    birth_date: Optional[datetime] = None
    instagram: Optional[str] = None
    telegram: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    language: Optional[str] = None
    profile_settings: Optional[Dict] = None

class UserResponse(UserBase):
    id: int
    role: str
    referral_code: Optional[str] = None
    referred_by: Optional[int] = None
    referral_bonus: int
    total_candidates: int
    total_hired: int
    rating: float
    kpi_target: int
    kpi_current: int
    created_at: datetime
    last_active: datetime
    is_active: bool
    is_verified: bool
    
    class Config:
        from_attributes = True

# Auth schemas
class TelegramAuthData(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    referral_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Candidate schemas
class CandidateBase(BaseModel):
    candidate_id: str
    name: str
    username: Optional[str] = None
    keywords: Optional[str] = None
    status: str = "new"
    interview_date: Optional[datetime] = None
    shifts_completed: int = 0
    is_successful: bool = False
    chat: Optional[str] = None
    message_link: Optional[str] = None
    message_text: Optional[str] = None
    contacts: Optional[str] = None
    found_date: datetime

class CandidateCreate(CandidateBase):
    scout_id: int

class CandidateUpdate(BaseModel):
    status: Optional[str] = None
    interview_date: Optional[datetime] = None
    contacts: Optional[str] = None
    keywords: Optional[str] = None
    rejection_reason: Optional[str] = None
    shifts_completed: Optional[int] = None
    is_successful: Optional[bool] = None

class CandidateResponse(CandidateBase):
    id: int
    scout_id: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    status_history: List[Dict] = []
    comments_count: int
    last_activity: datetime
    created_at: datetime
    updated_at: datetime
    scout_name: Optional[str] = None
    successful_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    priority: str = "medium"

class TaskCreate(TaskBase):
    assigned_to: int

class TaskUpdate(BaseModel):
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    assigned_to: int
    created_by: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    text: str
    receiver_id: int

class MessageCreate(MessageBase):
    sender_id: int

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Comment schemas
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    candidate_id: int
    user_id: int

class CommentResponse(CommentBase):
    id: int
    user_id: int
    candidate_id: int
    created_at: datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# File schemas
class FileBase(BaseModel):
    filename: str
    original_name: str
    file_size: int
    mime_type: str
    candidate_id: Optional[int] = None

class FileCreate(FileBase):
    uploaded_by: int

class FileResponse(FileBase):
    id: int
    uploaded_by: int
    created_at: datetime
    file_path: str
    
    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int
    message: str = "File uploaded successfully"

# News schemas
class NewsBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None

class NewsCreate(NewsBase):
    created_by: int

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    is_pinned: Optional[bool] = None

class NewsResponse(NewsBase):
    id: int
    created_by: int
    author_name: str
    is_pinned: bool
    views: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Broadcast schemas
class BroadcastBase(BaseModel):
    title: str
    message: str

class BroadcastCreate(BroadcastBase):
    created_by: int

class BroadcastResponse(BroadcastBase):
    id: int
    created_by: int
    author_name: str
    sent_at: Optional[datetime] = None
    total_recipients: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Training schemas
class TrainingBase(BaseModel):
    title: str
    description: str
    content: str
    video_url: Optional[str] = None
    duration_minutes: int
    is_mandatory: bool = False
    order: int = 0

class TrainingCreate(TrainingBase):
    created_by: int

class TrainingResponse(TrainingBase):
    id: int
    created_by: int
    created_at: datetime
    author_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserTrainingBase(BaseModel):
    user_id: int
    training_id: int

class UserTrainingResponse(UserTrainingBase):
    id: int
    status: str
    completed_at: Optional[datetime] = None
    training_title: str
    training_description: str
    
    class Config:
        from_attributes = True

# Referral schemas
class ReferralBase(BaseModel):
    code: str

class ReferralCreate(ReferralBase):
    referrer_id: int

class ReferralUse(BaseModel):
    code: str
    referred_id: int

class ReferralResponse(ReferralBase):
    id: int
    referrer_id: int
    referred_id: Optional[int] = None
    status: str
    bonus_amount: int
    created_at: datetime
    joined_at: Optional[datetime] = None
    referrer_name: Optional[str] = None
    referred_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReferralStats(BaseModel):
    total_referrals: int
    active_referrals: int
    total_bonus: int
    pending_referrals: int
    referral_link: str

# Notification schemas
class NotificationBase(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    data: Dict = {}
    priority: str = "normal"

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
