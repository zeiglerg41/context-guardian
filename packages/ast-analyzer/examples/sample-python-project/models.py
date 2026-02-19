"""Database models for the sample project."""

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model."""

    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.username


class Post(models.Model):
    """Blog post model."""

    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ['-id']

    def get_summary(self, max_length=100):
        return self.content[:max_length]

    def __repr__(self):
        return f"<Post: {self.title}>"
