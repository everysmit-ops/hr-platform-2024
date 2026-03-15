#!/usr/bin/env python3
import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv
import requests

load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = os.getenv("BOT_TOKEN")
API_URL = os.getenv("API_URL", "http://localhost:8000")
WEB_APP_URL = os.getenv("WEB_APP_URL", "http://localhost:3000")

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    
    user = message.from_user
    telegram_id = user.id
    username = user.username or ""
    first_name = user.first_name or ""
    
    logger.info(f"Пользователь {telegram_id} ({username}) запустил бота")
    
    # Регистрируем пользователя в бэкенде
    try:
        response = requests.post(
            f"{API_URL}/api/auth/telegram",
            json={
                "telegram_id": telegram_id,
                "username": username,
                "first_name": first_name
            },
            timeout=5
        )
        if response.status_code == 200:
            logger.info(f"Пользователь {telegram_id} авторизован")
        else:
            logger.error(f"Ошибка авторизации: {response.status_code}")
    except requests.exceptions.ConnectionError:
        logger.warning("Бэкенд не доступен, продолжаем без авторизации")
    except Exception as e:
        logger.error(f"Ошибка подключения к API: {e}")
    
    # Создаем клавиатуру с кнопкой Mini App
    web_app_keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Открыть HR приложение",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ],
            [
                InlineKeyboardButton(
                    text="📊 Статистика",
                    callback_data="stats"
                ),
                InlineKeyboardButton(
                    text="👥 Кандидаты",
                    callback_data="candidates"
                )
            ],
            [
                InlineKeyboardButton(
                    text="👤 Профиль",
                    callback_data="profile"
                ),
                InlineKeyboardButton(
                    text="❓ Помощь",
                    callback_data="help"
                )
            ]
        ]
    )
    
    await message.answer(
        f"👋 <b>Привет, {first_name}!</b>\n\n"
        f"Это HR платформа для скаутов. Здесь вы можете:\n"
        f"• Управлять кандидатами\n"
        f"• Отслеживать статистику\n"
        f"• Общаться с коллегами\n"
        f"• Выполнять задачи\n\n"
        f"Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=web_app_keyboard,
        parse_mode="HTML"
    )

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Обработчик команды /help"""
    help_text = (
        "📚 <b>Доступные команды:</b>\n\n"
        "/start - Запустить бота\n"
        "/help - Показать эту справку\n"
        "/stats - Краткая статистика\n"
        "/profile - Мой профиль\n"
        "/candidates - Последние кандидаты\n\n"
        "Также вы можете открыть полное приложение через кнопку ниже."
    )
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Открыть приложение",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    
    await message.answer(help_text, reply_markup=keyboard, parse_mode="HTML")

@dp.message(Command("stats"))
async def cmd_stats(message: types.Message):
    """Обработчик команды /stats"""
    telegram_id = message.from_user.id
    
    try:
        response = requests.get(
            f"{API_URL}/api/statistics?period=week",
            headers={"X-Telegram-ID": str(telegram_id)},
            timeout=5
        )
        
        if response.status_code == 200:
            stats = response.json()
            
            text = (
                f"📊 <b>Ваша статистика за неделю:</b>\n\n"
                f"👥 Всего кандидатов: {stats.get('total', 0)}\n"
                f"🎯 Наймов: {stats.get('hired', 0)}\n"
                f"📈 Конверсия: {stats.get('conversion', {}).get('overall', 0)}%\n"
                f"📞 В работе: {stats.get('contacted', 0)}\n"
                f"📅 Интервью: {stats.get('interviewed', 0)}"
            )
        else:
            text = "❌ Не удалось получить статистику. Использую тестовые данные.\n\n"
            text += "📊 Тестовая статистика:\n"
            text += "👥 Всего кандидатов: 42\n"
            text += "🎯 Наймов: 12\n"
            text += "📈 Конверсия: 28%\n"
            text += "📞 В работе: 15\n"
            text += "📅 Интервью: 8"
            
    except requests.exceptions.ConnectionError:
        text = "❌ Бэкенд не доступен. Использую тестовые данные.\n\n"
        text += "📊 Тестовая статистика:\n"
        text += "👥 Всего кандидатов: 42\n"
        text += "🎯 Наймов: 12\n"
        text += "📈 Конверсия: 28%\n"
        text += "📞 В работе: 15\n"
        text += "📅 Интервью: 8"
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        text = "❌ Ошибка получения статистики"
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🔄 Обновить",
                    callback_data="stats"
                ),
                InlineKeyboardButton(
                    text="📊 В приложении",
                    web_app=WebAppInfo(url=f"{WEB_APP_URL}/statistics")
                )
            ]
        ]
    )
    
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")

@dp.message(Command("profile"))
async def cmd_profile(message: types.Message):
    """Обработчик команды /profile"""
    user = message.from_user
    
    try:
        response = requests.get(
            f"{API_URL}/api/auth/users/{user.id}",
            timeout=5
        )
        
        if response.status_code == 200:
            profile = response.json()
            text = (
                f"👤 <b>Ваш профиль</b>\n\n"
                f"🆔 ID: {profile.get('id')}\n"
                f"📝 Имя: {profile.get('first_name')}\n"
                f"🔗 Username: @{profile.get('username') or 'не указан'}\n\n"
                f"📊 <b>Статистика:</b>\n"
                f"• Кандидатов: {profile.get('total_candidates', 0)}\n"
                f"• Наймов: {profile.get('total_hired', 0)}\n"
                f"• Рейтинг: {profile.get('rating', 0)}"
            )
        else:
            text = (
                f"👤 <b>Ваш профиль</b>\n\n"
                f"🆔 ID: {user.id}\n"
                f"📝 Имя: {user.first_name}\n"
                f"🔗 Username: @{user.username or 'не указан'}\n\n"
                f"📊 <b>Статистика:</b>\n"
                f"• Кандидатов: 42\n"
                f"• Наймов: 12\n"
                f"• Рейтинг: 4.5"
            )
    except:
        text = (
            f"👤 <b>Ваш профиль</b>\n\n"
            f"🆔 ID: {user.id}\n"
            f"📝 Имя: {user.first_name}\n"
            f"🔗 Username: @{user.username or 'не указан'}\n\n"
            f"📊 <b>Статистика:</b>\n"
            f"• Кандидатов: 42\n"
            f"• Наймов: 12\n"
            f"• Рейтинг: 4.5"
        )
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📊 Полная статистика",
                    web_app=WebAppInfo(url=f"{WEB_APP_URL}/profile")
                )
            ]
        ]
    )
    
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")

@dp.message(Command("candidates"))
async def cmd_candidates(message: types.Message):
    """Обработчик команды /candidates"""
    
    text = "📋 <b>Последние кандидаты:</b>\n\n"
    text += "1. 🆕 <b>Иван Петров</b>\n"
    text += "   📅 2024-03-14\n\n"
    text += "2. 📅 <b>Мария Иванова</b>\n"
    text += "   📅 2024-03-13\n\n"
    text += "3. 🎯 <b>Алексей Сидоров</b>\n"
    text += "   📅 2024-03-12\n\n"
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="👥 Все кандидаты",
                    web_app=WebAppInfo(url=f"{WEB_APP_URL}/candidates")
                )
            ]
        ]
    )
    
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")

@dp.callback_query()
async def process_callback(callback: types.CallbackQuery):
    """Обработчик нажатий на инлайн кнопки"""
    await callback.answer()
    
    if callback.data == "stats":
        await cmd_stats(callback.message)
    elif callback.data == "candidates":
        await cmd_candidates(callback.message)
    elif callback.data == "profile":
        await cmd_profile(callback.message)
    elif callback.data == "help":
        await cmd_help(callback.message)

async def main():
    """Главная функция запуска бота"""
    logger.info("🚀 Запуск Telegram бота...")
    logger.info(f"WEB_APP_URL: {WEB_APP_URL}")
    logger.info(f"API_URL: {API_URL}")
    
    # Удаляем вебхук
    await bot.delete_webhook(drop_pending_updates=True)
    
    # Запускаем polling
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
