from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine
from app.models import models
from app.routers import (
    auth_local,  # только локальная авторизация (без Telegram)
    candidates, 
    statistics, 
    tasks, 
    chat, 
    profile, 
    admin, 
    files, 
    news, 
    broadcast, 
    training, 
    referrals, 
    subscriptions, 
    premium_profile, 
    partner, 
    teams
)
from app.socket_manager import sio
import socketio

# Создаем таблицы в базе данных
models.Base.metadata.create_all(bind=engine)

# Создаем основное FastAPI приложение
app = FastAPI(
    title="HR Mini App API",
    description="API для HR платформы",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://every-scouting-app.vercel.app",
        "https://frontend-theta-navy-46.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры - ТОЛЬКО auth_local, без старого auth
app.include_router(auth_local.router, prefix="/api/auth", tags=["auth"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(broadcast.router, prefix="/api/broadcast", tags=["broadcast"])
app.include_router(training.router, prefix="/api/training", tags=["training"])
app.include_router(referrals.router, prefix="/api/referrals", tags=["referrals"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(premium_profile.router, prefix="/api/premium-profile", tags=["premium-profile"])
app.include_router(partner.router, prefix="/api/partner", tags=["partner"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])

@app.get("/")
async def root():
    return {"message": "HR Mini App API is running", "status": "OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Создаем ASGI приложение с поддержкой WebSocket для запуска
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Для запуска с WebSocket поддержкой
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
