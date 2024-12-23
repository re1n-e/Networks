from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    following_count = models.IntegerField(default=0)
    followers_count = models.IntegerField(default=0)
    user_profile_photo = models.CharField(max_length=300)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "user_profile_photo": self.user_profile_photo,
            "following_count": self.following_count,
            "followers_count": self.followers_count,
        }

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    like = models.IntegerField(default=0)
    post_photo = models.URLField(null=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.serialize(),
            "content": self.content,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "like" : self.like,
            "post_photo": self.post_photo,
        }
    
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')  
    created_at = models.DateTimeField(auto_now_add=True) 

class Follow(models.Model):
    follower = models.ForeignKey(User, related_name='following', on_delete=models.CASCADE)
    followed_user = models.ManyToManyField(User, related_name='followers')

    def serialize(self):
        return {
            "id": self.id,
            "follower": self.follower.serialize(),
            "followed_user": self.followed_user.serialize(),
        }

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
