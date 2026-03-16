from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    role: str = "scout"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(UserBase):
    id: int
    total_candidates: int
    total_hired: int
    rating: float
    kpi_target: int
    kpi_current: int
    created_at: datetime
    last_active: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Candidate schemas
class CandidateBase(BaseModel):
    candidate_id: str
    name: str
    username: Optional[str] = None
    keywords: Optional[str] = None
    status: str = "new"
    chat: Optional[str] = None
    message_link: Optional[str] = None
    message_text: Optional[str] = None
    contacts: Optional[str] = None
    found_date: datetime

class CandidateCreate(CandidateBase):
    scout_id: int

class CandidateUpdate(BaseModel):
    status: Optional[str] = None
    contacts: Optional[str] = None
    keywords: Optional[str] = None

class CandidateResponse(CandidateBase):
    id: int
    scout_id: int
    comments_count: int
    last_activity: datetime
    created_at: datetime
    updated_at: datetime
    
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

# Auth schemas
class TelegramAuthData(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

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
