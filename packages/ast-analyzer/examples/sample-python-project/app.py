"""Sample Python application for AST analysis testing."""

from flask import Flask, jsonify, request
from models import User, db
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)


class UserService:
    """Handles user-related operations."""

    def __init__(self, db_session):
        self.db = db_session

    def get_user(self, user_id):
        return self.db.query(User).get(user_id)

    async def create_user(self, data):
        user = User(**data)
        self.db.add(user)
        return user


def create_app(config=None):
    if config:
        app.config.from_mapping(config)
    return app


async def fetch_external_data(url, timeout=30):
    """Fetches data from an external API."""
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=timeout) as resp:
            return await resp.json()


def _internal_helper():
    """Private helper, should not appear in exports."""
    pass


__all__ = ['UserService', 'create_app', 'fetch_external_data']
