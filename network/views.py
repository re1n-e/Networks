import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Follow, Like, Comment

def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

from django.http import JsonResponse

def currentUser(request):
    if request.user.is_authenticated:
        user_data = {
            "id": request.user.id,
            "username": request.user.username,
        }
        response_data = {
            "current_user": user_data
        }
    else:
        response_data = {
            "current_user": None 
        }
    return JsonResponse(response_data)

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        user_profile_photo = (request.POST["pfp_url"]).strip()
        if not user_profile_photo:
            user_profile_photo = "https://static3.bigstockphoto.com/9/1/3/large1500/31903202.jpg"
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.user_profile_photo = user_profile_photo
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def edit_post(request, post_id):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"}, status=400)
    
    try:
        # Retrieve the requested post by its ID
        requested_post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

    # Extract the content and post_photo attributes from the post
    print("edit ",requested_post.post_photo)
    response_data = {
        "content": requested_post.content,
        "post_photo": requested_post.post_photo,
    }

    # Return the response data as JSON
    return JsonResponse(response_data)

@csrf_exempt
def save_edit(request,post_id):
    # Check if the request method is POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)
    
    # Load the JSON data from the request
    data = json.loads(request.body)

    # Get the content of the post
    content = data.get("content", "")
    post_photo = data.get("post_photo","")
    # Check if the content of the post is empty
    if not content:
        return JsonResponse({"error": "Can't post empty content."}, status=400)
    
    try:
        # Retrieve the requested post by its ID
        requested_post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)
    
    requested_post.content = content
    requested_post.post_photo = post_photo
    
    requested_post.save()
    # Return a success response
    return JsonResponse({"message": "Post edited successfully."}, status=201)

@csrf_exempt
@login_required
def save_post(request):
    # Check if the request method is POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    # Load the JSON data from the request
    data = json.loads(request.body)

    # Get the content of the post
    content = data.get("content", "")
    post_photo = data.get("post_photo","")
    if not post_photo:
        post_photo = None
    print(post_photo)
    # Check if the content of the post is empty
    if not content:
        return JsonResponse({"error": "Can't post empty content."}, status=400)

    # Create a new Post object
    post = Post(user=request.user, content=content, post_photo=post_photo)

    # Save the post object to the database
    post.save()

    # Return a success response
    return JsonResponse({"message": "Post created successfully."}, status=201)

@csrf_exempt
def like_post(request, post_id):
    # Check if the request method is POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=400)

    # Get the current user
    user = request.user

    # Check if the post exists
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

    # Check if the user has already liked the post
    if Like.objects.filter(user=user, post=post).exists():
        # User has already liked the post, so unlike it
        Like.objects.filter(user=user, post=post).delete()
        post.like -= 1
        post.save()
        return JsonResponse({"message": "Post unliked successfully."})
    else:
        # User has not liked the post, so like it
        like = Like(user=user, post=post)
        like.save()
        post.like += 1
        post.save()
        return JsonResponse({"message": "Post liked successfully."})

def show_posts(request, post_type):
    if post_type == 'all-post':
        posts = Post.objects.order_by("-timestamp").all()
    elif post_type == 'user-name':
        posts = Post.objects.filter(user=request.user).order_by("-timestamp").all()
    elif post_type == 'following':
        followed_users = Follow.objects.filter(follower=request.user).values_list('followed_user', flat=True)
        posts = Post.objects.filter(user__in=followed_users).order_by("-timestamp").all()
    else:
        return JsonResponse({"error": "Invalid post type."}, status=400)

    # Paginate the posts
    paginator = Paginator(posts, 10)  # Show 10 posts per page

    page_number = request.GET.get('page')
    try:
        paginated_posts = paginator.page(page_number)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        paginated_posts = paginator.page(1)
    except EmptyPage:
        # If page is out of range ,deliver last page of results.
        paginated_posts = paginator.page(paginator.num_pages)

    # Serialize the paginated posts
    serialized_posts = [post.serialize() for post in paginated_posts]

    # Prepare response data
    response_data = {
        "posts": serialized_posts,
        "paginator": {
            "total_pages": paginator.num_pages,
            "current_page": paginated_posts.number
        },
        "message": "Posts sent successfully."
    }

    return JsonResponse(response_data, safe=False)

@csrf_exempt
@login_required
def user_profile(request, user_id):
    print(user_id)
    try:
        user = User.objects.get(pk=user_id)  
    except User.DoesNotExist:
        return HttpResponseNotFound("User not found")

    posts = user.post_set.all()
    is_current_user = False
    following = is_following(request, user_id)
    if request.user.id == user_id:
        is_current_user = True
    # Serialize the posts
    serialized_posts = [post.serialize() for post in posts]

    # Combine the serialized posts and the additional message into a single dictionary
    response_data = {
        "posts": serialized_posts,
        "is_current_user": is_current_user,
        "is_following": following,
        "message": "Posts sent successfully."
    }
    
    # Return the combined dictionary as JSON response
    return JsonResponse(response_data, safe=False)

@csrf_exempt
def follow(request, user_id):
    # Getting the user by its user id
    try:
        followed_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return HttpResponseNotFound("User not found")
    
    current_user = request.user
    # Creating a new Follow object with the follower specified
    follow_instance, created = Follow.objects.get_or_create(follower=current_user)
    # Adding the followed user to the set of followed users
    follow_instance.followed_user.add(followed_user)
    # Increment the follower count for the followed user and following count for the current user
    followed_user.followers_count += 1
    current_user.following_count += 1
    # Save the changes
    followed_user.save()
    current_user.save()
    # Save the Follow object
    follow_instance.save()

    return JsonResponse({"message": "User followed successfully."})



@csrf_exempt
def unfollow(request, user_id):
    # Getting the user by its user id
    try:
        unfollowed_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return HttpResponseNotFound("User not found")

    current_user = request.user
    # Getting the Follow object for the current user, if it exists
    follow_instance = Follow.objects.filter(follower=current_user).first()
    if follow_instance:
        # Removing the unfollowed user from the current user's following list
        follow_instance.followed_user.remove(unfollowed_user)
        # Decrement the follower count for the unfollowed user and following count for the current user
        unfollowed_user.followers_count -= 1
        current_user.following_count -= 1
        # Save the changes
        unfollowed_user.save()
        current_user.save()

        return JsonResponse({"message": "User unfollowed successfully."})
    else:
        return JsonResponse({"error": "No follow relationship found for the current user."}, status=400)



def is_following(request, user_id):
    # Get the user object by its ID
    try:
        check_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return HttpResponseNotFound("User not found")

    # Check if the current user is following the user with the specified ID
    is_following = Follow.objects.filter(follower=request.user, followed_user=check_user).exists()

    # Return a JSON response indicating whether the current user is following the specified user
    return is_following

       

    


    

    