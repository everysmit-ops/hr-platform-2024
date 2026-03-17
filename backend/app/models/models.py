from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Аутентификация (новые поля)
    email = Column(String, unique=True, index=True, nullable=True)  # Может быть null пока
    hashed_password = Column(String, nullable=True)  # Может быть null пока
    
    # Telegram данные (оставляем для обратной совместимости)
    telegram_id = Column(Integer, unique=True, index=True, nullable=True)
    username = Column(String, nullable=True)
    
    # Основная информация
    first_name = Column(String)
    last_name = Column(String, nullable=True)
    
    # Кастомизация профиля
    avatar = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    birth_date = Column(DateTime, nullable=True)
    
    # Социальные сети
    instagram = Column(String, nullable=True)
    telegram = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    github = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Настройки
    theme = Column(String, default='light')
    notifications_enabled = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=False)
    language = Column(String, default='ru')
    profile_settings = Column(JSON, default={})
    
    # Премиум кастомизация
    animated_avatar = Column(String, nullable=True)
    nickname_style = Column(JSON, default={})
    nickname_emoji = Column(String, nullable=True)
    custom_badge = Column(JSON, default={})
    
    # Роль и права
    role = Column(String, default="scout")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Статистика
    total_candidates = Column(Integer, default=0)
    total_hired = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    kpi_target = Column(Integer, default=5)
    kpi_current = Column(Integer, default=0)
    
    # Реферальная система
    referral_code = Column(String, unique=True, nullable=True)
    referred_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_bonus = Column(Integer, default=0)
    
    # Команда
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team_role = Column(String, default="member")
    team_joined_at = Column(DateTime, nullable=True)
    
    # Даты
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Подписка
    subscription = relationship("UserSubscription", back_populates="user", uselist=False)
    
    # Связи
    candidates = relationship("Candidate", back_populates="scout")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    tasks_created = relationship("Task", foreign_keys="Task.created_by", back_populates="creator")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    referrals = relationship("Referral", foreign_keys="Referral.referrer_id", back_populates="referrer")
    trainings = relationship("UserTraining", back_populates="user")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, unique=True, index=True)
    name = Column(String)
    username = Column(String, nullable=True)
    keywords = Column(Text, nullable=True)
    
    # Новые статусы
    status = Column(String, default="new")  # new, approved, rejected, interview_scheduled, candidate_rejected, partner_rejected, registered, successful
    interview_date = Column(DateTime, nullable=True)  # Дата собеседования
    
    # Счетчики смены статусов (JSON поле для хранения истории)
    status_history = Column(JSON, default=[])  # Будет хранить массив объектов {status: "xxx", date: "xxx", changed_by: id}
    
    # Для отслеживания успешных кандидатов (2+ смены)
    shifts_completed = Column(Integer, default=0)  # Количество отработанных смен
    is_successful = Column(Boolean, default=False)  # Статус успешности (2+ смены)
    successful_at = Column(DateTime, nullable=True)  # Когда достиг статуса успешного
    
    chat = Column(String, nullable=True)
    message_link = Column(String, nullable=True)
    message_text = Column(Text, nullable=True)
    contacts = Column(String, nullable=True)
    found_date = Column(DateTime)
    
    scout_id = Column(Integer, ForeignKey("users.id"))
    scout = relationship("User", back_populates="candidates")
    
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    comments_count = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="pending")
    
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="tasks_assigned")
    creator = relationship("User", foreign_keys=[created_by], back_populates="tasks_created")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    read = Column(Boolean, default=False)
    
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text)
    
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    candidate = relationship("Candidate")
    user = relationship("User")
    
    created_at = Column(DateTime, default=datetime.utcnow)

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    original_name = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    mime_type = Column(String)
    
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=True)
    candidate = relationship("Candidate")
    
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    created_at = Column(DateTime, default=datetime.utcnow)

class News(Base):
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    image_url = Column(String, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", foreign_keys=[created_by])
    
    is_pinned = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Broadcast(Base):
    __tablename__ = "broadcasts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(Text)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", foreign_keys=[created_by])
    
    sent_at = Column(DateTime, nullable=True)
    total_recipients = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Training(Base):
    __tablename__ = "trainings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    content = Column(Text)
    video_url = Column(String, nullable=True)
    duration_minutes = Column(Integer)
    
    is_mandatory = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    author = relationship("User")
    
    created_at = Column(DateTime, default=datetime.utcnow)

class UserTraining(Base):
    __tablename__ = "user_trainings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    training_id = Column(Integer, ForeignKey("trainings.id"))
    
    status = Column(String, default="pending")
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="trainings")
    training = relationship("Training")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"))
    referred_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(String, default="pending")
    bonus_amount = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, nullable=True)
    bonus_granted_at = Column(DateTime, nullable=True)
    
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="referrals")
    referred = relationship("User", foreign_keys=[referred_id])

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # candidate_status, task_assigned, training, referral, system
    title = Column(String)
    message = Column(Text)
    
    # Связанные данные (JSON)
    data = Column(JSON, default={})
    
    # Статус
    read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    # Важность
    priority = Column(String, default="normal")  # low, normal, high
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    user = relationship("User")

# Subscription plans
class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)  # Basic, Pro, Business
    code = Column(String, unique=True)  # basic, pro, business
    price = Column(Integer)  # в копейках/центах
    currency = Column(String, default="RUB")
    interval = Column(String)  # month, year
    
    # Лимиты
    max_candidates = Column(Integer, default=100)  # 0 = безлимит
    max_scouts = Column(Integer, default=1)  # количество скаутов в команде
    max_storage = Column(Integer, default=100)  # МБ
    
    # Фичи
    features = Column(JSON, default={})  # словарь с доступными функциями
    
    # Кастомизация
    custom_profile_enabled = Column(Boolean, default=False)
    animated_avatar = Column(Boolean, default=False)
    custom_nickname_style = Column(Boolean, default=False)
    emoji_nickname = Column(Boolean, default=False)
    custom_badge = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"))
    
    # Статус подписки
    status = Column(String, default="active")  # active, cancelled, expired
    auto_renew = Column(Boolean, default=True)
    
    # Даты
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Платежные данные
    payment_provider = Column(String, nullable=True)  # stripe, yookassa, etc
    payment_id = Column(String, nullable=True)
    
    user = relationship("User", back_populates="subscription")
    plan = relationship("SubscriptionPlan")

# Partner program
class PartnerProgram(Base):
    __tablename__ = "partner_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    description = Column(Text)
    
    # Условия
    commission_percent = Column(Integer, default=10)  # % от платежей рефералов
    commission_fixed = Column(Integer, default=0)  # фиксированная сумма
    min_payout = Column(Integer, default=1000)  # минимальная сумма для вывода
    
    requirements = Column(JSON, default={})  # требования для участия
    benefits = Column(JSON, default={})  # преимущества
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Partner(Base):
    __tablename__ = "partners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    program_id = Column(Integer, ForeignKey("partner_programs.id"))
    
    # Статистика
    total_earned = Column(Integer, default=0)  # всего заработано
    total_withdrawn = Column(Integer, default=0)  # всего выведено
    current_balance = Column(Integer, default=0)  # текущий баланс
    
    # Уровень в партнерской программе
    level = Column(Integer, default=1)
    level_name = Column(String, nullable=True)
    
    # Своя команда
    team_size = Column(Integer, default=0)
    team_commission = Column(Integer, default=5)  # % от команды
    
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="partner")
    program = relationship("PartnerProgram")

class PartnerTransaction(Base):
    __tablename__ = "partner_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"))
    
    type = Column(String)  # referral_commission, team_commission, withdrawal
    amount = Column(Integer)
    balance_after = Column(Integer)
    
    # Связанные данные
    referral_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id"), nullable=True)
    
    description = Column(String)
    status = Column(String, default="completed")  # pending, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    partner = relationship("Partner")
    referral = relationship("User", foreign_keys=[referral_id])

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"))  # владелец команды
    
    # Статистика команды
    total_members = Column(Integer, default=0)
    total_earned = Column(Integer, default=0)
    
    # Настройки команды
    settings = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    owner = relationship("User", foreign_keys=[owner_id])

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    role = Column(String, default="member")  # owner, admin, member
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Доля от заработка команды
    commission_share = Column(Integer, default=0)  # %
    
    team = relationship("Team")
    user = relationship("User")
