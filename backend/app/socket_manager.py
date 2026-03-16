import socketio
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)

# Создаем экземпляр Socket.IO сервера
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        'http://localhost:3000',
        'https://hr-frontend.vercel.app'
    ]
)

# Словарь для хранения подключений пользователей
# user_id -> list of session ids
user_connections: Dict[int, Set[str]] = {}

@sio.event
async def connect(sid, environ):
    """Обработчик подключения"""
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Обработчик отключения"""
    logger.info(f"Client disconnected: {sid}")
    
    # Удаляем пользователя из словаря подключений
    for user_id, sessions in list(user_connections.items()):
        if sid in sessions:
            sessions.remove(sid)
            if not sessions:
                del user_connections[user_id]
            break

@sio.event
async def authenticate(sid, data):
    """Аутентификация пользователя по user_id"""
    user_id = data.get('user_id')
    if user_id:
        if user_id not in user_connections:
            user_connections[user_id] = set()
        user_connections[user_id].add(sid)
        logger.info(f"User {user_id} authenticated with session {sid}")
        await sio.emit('authenticated', {'status': 'ok'}, room=sid)

async def notify_user(user_id: int, event: str, data: dict):
    """Отправить уведомление конкретному пользователю"""
    if user_id in user_connections:
        for sid in user_connections[user_id]:
            await sio.emit(event, data, room=sid)
        logger.info(f"Notification sent to user {user_id}: {event}")

async def notify_all(event: str, data: dict):
    """Отправить уведомление всем подключенным пользователям"""
    await sio.emit(event, data)

# Функции для различных типов уведомлений
async def notify_new_candidate(candidate_data: dict, target_user_id: int = None):
    """Уведомление о новом кандидате"""
    if target_user_id:
        await notify_user(target_user_id, 'new_candidate', candidate_data)
    else:
        await notify_all('new_candidate', candidate_data)

async def notify_status_change(candidate_id: int, new_status: str, user_id: int):
    """Уведомление об изменении статуса кандидата"""
    await notify_all('status_change', {
        'candidate_id': candidate_id,
        'new_status': new_status,
        'user_id': user_id
    })

async def notify_new_message(message_data: dict, recipient_id: int):
    """Уведомление о новом сообщении в чате"""
    await notify_user(recipient_id, 'new_message', message_data)

async def notify_task_assigned(task_data: dict, user_id: int):
    """Уведомление о новой задаче"""
    await notify_user(user_id, 'task_assigned', task_data)
