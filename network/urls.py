
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),

    # API routes
    path('posts/', views.save_post, name='save_post'),
    path("user/", views.currentUser, name="curr-user"),
    path('posts/<str:post_type>/', views.show_posts, name='show_posts'),
    path("post/<int:user_id>/", views.user_profile, name="user-profile"),
    path("follow/<int:user_id>/", views.follow, name="user-follow"),
    path("unfollow/<int:user_id>/", views.unfollow, name="user-unfollow"),
    path("edit/<int:post_id>/", views.edit_post, name="edit-post"),
    path("save_edit/<int:post_id>/", views.save_edit, name="save-edit"),
    path('like/<int:post_id>/', views.like_post, name='like_post'),
]
