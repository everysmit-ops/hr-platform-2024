from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String)
    last_name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String, default="scout")  # scout или admin
    
    # Статистика
    total_candidates = Column(Integer, default=0)
    total_hired = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    kpi_target = Column(Integer, default=5)
    kpi_current = Column(Integer, default=0)
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Связи
    candidates = relationship("Candidate", back_populates="scout")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    tasks_created = relationship("Task", foreign_keys="Task.created_by", back_populates="creator")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, unique=True, index=True)
    name = Column(String)
    username = Column(String, nullable=True)
    keywords = Column(Text, nullable=True)  # Храним как JSON строку
    status = Column(String, default="new")
    chat = Column(String, nullable=True)
    message_link = Column(String, nullable=True)
    message_text = Column(Text, nullable=True)
    contacts = Column(String, nullable=True)
    found_date = Column(DateTime)
    
    # Связь со скаутом
    scout_id = Column(Integer, ForeignKey("users.id"))
    scout = relationship("User", back_populates="candidates")
    
    # Дополнительные поля
    comments_count = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="pending")  # pending, completed, cancelled
    
    # Связи
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="tasks_assigned")
    creator = relationship("User", foreign_keys=[created_by], back_populates="tasks_created")
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    read = Column(Boolean, default=False)
    
    # Связи
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    
    # Связи
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    candidate = relationship("Candidate")
    user = relationship("User")
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)

