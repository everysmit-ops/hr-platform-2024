from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine
from app.models import models
from app.routers import auth, candidates, statistics, tasks, chat, profile, admin

# Создаем таблицы в базе данных
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HR Mini App API",
    description="API для HR платформы",
    version="1.0.0"
)

# Настройка CORS для продакшена
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://heterochromous-isostructural-angelita.ngrok-free.dev",  # Замените на ваш URL фронтенда
        "https://your-frontend.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "HR Mini App API is running", "status": "OK"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

