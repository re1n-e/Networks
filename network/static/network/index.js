document.addEventListener("DOMContentLoaded", () => {
    console.log("page is loaded");
    document.getElementById("user-name").addEventListener('click', () => load_page('user-name'));
    document.getElementById("all-post").addEventListener('click', () => load_page('all-post'));
    document.getElementById("following").addEventListener('click', () => load_page('following'));
    document.getElementById("new-post").addEventListener('click', create_post);

    document.getElementById("post-form").addEventListener('submit', save_post);
    load_page("all-post");
});

function getCurrentUser() {
    return fetch(`/user/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response_data => {
            return response_data.current_user.username;
        })
        .catch(error => {
            console.error('Error fetching current user:', error);
        });
}

async function load_page(page, pageNumber = 1) {
    console.log("load_page function");
    document.getElementById("new-post-view").style.display = 'none';
    document.getElementById("view-page").style.display = 'block';
    document.getElementById("pagination-01").style.display = 'block';
    document.getElementById("edit-post-view").style.display = 'none';

    if (page === 'following') {
        await show_all_post_page(page, pageNumber);
    }
    else if (page === 'all-post') {
        await show_all_post_page(page, pageNumber);
    }
    else if (page === 'user-name') {
        await show_all_post_page(page, pageNumber);
    }
}

async function show_all_post_page(page, pageNumber) {
    console.log("show_all_post_function");
    console.log("Fetching posts for page:", page, pageNumber);
    try {
        const currentUser = await getCurrentUser();
        console.log("Current user:", currentUser);

        const response = await fetch(`/posts/${page}/?page=${pageNumber}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const response_data = await response.json();
        console.log(response_data);
        console.log(response_data.message);
        const posts = response_data.posts;

        document.getElementById("view-page").innerHTML = '';

        posts.forEach(post => {
            const pageDiv = document.createElement("div");
            console.log(post.user.user_profile_photo);
            let editLink = '';
            if (currentUser && post.user.username === currentUser) {
                editLink = `<a href="javascript:void(0)" class="edit-post d-inline-block text-muted ml-3" data-post-id="${post.id}">
                        <small class="align-middle">Edit</small>
                    </a>`;
            }
            pageDiv.innerHTML = `<div class="container posts-content">
            <div class="row">
                <div class="col-lg-6">
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="media mb-3">
                                <img src="${post.user.user_profile_photo}" class="img-fluid rounded-circle" style="width:70px;" alt="">
                                <div class="media-body ml-3">
                                    <h5 class="user-profile-link" data-user-id="${post.user.id}">${post.user.username}</h5>
                                    <div class="text-muted small">${post.timestamp}</div>
                                </div>
                            </div>
                            <p>${post.content}</p>
                            <img src="${post.post_photo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="">
                        </div>
                        <div class="card-footer">
                            <a href="javascript:void(0)" class="Like d-inline-block text-muted" data-post-id="${post.id}">
                                <strong>${post.like}</strong> <small class="align-middle">Likes</small>
                            </a>
                            ${editLink}
                            <a href="javascript:void(0)" class="d-inline-block text-muted ml-3"></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
            document.getElementById("view-page").append(pageDiv);
        });

        // Update pagination links
        updatePagination(response_data.paginator.total_pages, pageNumber);

        document.querySelectorAll(".Like").forEach(link => {
            link.addEventListener('click', () => like_post(parseInt(link.getAttribute('data-post-id'))));
        });
        document.querySelectorAll(".edit-post").forEach(link => {
            link.addEventListener('click', () => edit_post(page, parseInt(link.getAttribute('data-post-id'))));
        });
        document.querySelectorAll(".user-profile-link").forEach(link => {
            link.addEventListener('click', () => show_user_profile(parseInt(link.getAttribute('data-user-id'))));
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function like_post(post_id) {
    try {
        const response = await fetch(`/like/${post_id}/`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data.message);

        load_page("all-post");
    } catch (error) {
        console.error('Error liking/unliking post:', error);
    }
}


function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination-01');
    paginationContainer.innerHTML = '';

    const paginationWrapper = document.createElement('div');
    paginationWrapper.classList.add('pagination-wrapper');

    const previousBtn = document.createElement('button');
    previousBtn.classList.add('page-link');
    previousBtn.textContent = 'Previous';
    previousBtn.disabled = currentPage === 1;
    previousBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            load_page('all-post', currentPage - 1);
        }
    });
    paginationWrapper.appendChild(previousBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('button');
        pageLink.classList.add('page-link');
        pageLink.textContent = i;
        if (i === currentPage) {
            pageLink.classList.add('active');
        }
        pageLink.addEventListener('click', () => {
            load_page('all-post', i);
        });
        paginationWrapper.appendChild(pageLink);
    }

    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page-link');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            load_page('all-post', currentPage + 1);
        }
    });
    paginationWrapper.appendChild(nextBtn);

    paginationContainer.appendChild(paginationWrapper);
}


function edit_post(page, post_id) {
    console.log("Edit button clicked");
    console.log(post_id);

    fetch(`/edit/${post_id}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response_data => {

            document.getElementById("FormControlTextarea-edit").value = response_data.content;
            document.getElementById("imageurlInput-edit").value = response_data.post_photo;

            document.getElementById("new-post-view").style.display = 'none';
            document.getElementById("view-page").style.display = 'none';
            document.getElementById("pagination-01").style.display = 'none';
            document.getElementById("edit-post-view").style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching current user:', error);
        });

        document.getElementById('edit-post').addEventListener('click', ()=> {
            save_edit(post_id,page);
        });
}

function save_edit(post_id, page) {
    const content = document.getElementById("FormControlTextarea-edit").value;
    const imageurl = document.getElementById("imageurlInput-edit").value;
    fetch(`/save_edit/${post_id}/`, {
        method: "POST",
        body: JSON.stringify({
            content: content,
            post_photo: imageurl
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            console.log(result);
            load_page(page);
        })
        .catch(error => {
            console.error('Error saving edit:', error);
        });
}

function create_post() {
    document.getElementById("new-post-view").style.display = 'block';
    document.getElementById("view-page").style.display = 'none';
    document.getElementById("pagination-01").style.display = 'none';
    document.getElementById("edit-post-view").style.display = 'none';

    console.log("create post page");
    document.getElementById("FormControlTextarea1").value = '';
    document.getElementById("imageurlInput").value = '';
}

function save_post(event) {
    console.log("post save function reached");
    const content = document.getElementById("FormControlTextarea1").value;
    const imageurl = document.getElementById("imageurlInput").value;
    fetch('/posts/', {
        method: "POST",
        body: JSON.stringify({
            content: content,
            post_photo: imageurl
        })
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            load_page('user-name');
        });
}

function show_user_profile(user_id) {
    console.log("show profile clicked");
    console.log(typeof user_id);
    let profile_id = 0;
    fetch(`/post/${user_id}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            return response.json();
        })

        .then(response_data => {
            console.log(response_data.is_current_user, response_data.is_following);
            const posts = response_data.posts;
            console.log(posts[0]);
            const pageDiv = document.createElement("div");
            pageDiv.innerHTML = '';
            pageDiv.innerHTML = `<div class="row d-flex justify-content-center">
    <div class="col col-md-9 col-lg-7 col-xl-6">
      <div class="card" style="border-radius: 15px;">
        <div class="card-body p-4">
          <div class="d-flex">
            <div class="flex-shrink-0">
              <img src=${posts[0].user.user_profile_photo}
                alt="Generic placeholder image" class="img-fluid" style="width: 180px; border-radius: 10px;">
            </div>
            <div class="flex-grow-1 ms-3" style="padding-left: 2.5em">
              <h5 class="mb-1">${posts[0].user.username}</h5>
              <div class="d-flex justify-content-start rounded-3 p-2 mb-2 bg-body-tertiary">
                <div>
                  <p class="small text-muted mb-1">Following</p>
                  <p class="mb-0">${posts[0].user.following_count}</p>
                </div>
                <div class="px-3">
                  <p class="small text-muted mb-1">Followers</p>
                  <p class="mb-0">${posts[0].user.followers_count}</p>
                </div>
              </div>
              <div class="d-flex pt-1" id="follow">
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
<br>`;
            posts.forEach(post => {
                profile_id = post.user.id;
                const postDiv = document.createElement("div");
                postDiv.classList.add('container', 'posts-content');
                postDiv.innerHTML = `
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="card mb-4">
                                <div class="card-body">
                                    <div class="media mb-3">
                                        <img src="${post.user.user_profile_photo}" class="img-fluid rounded-circle" style="width:70px;" alt="">
                                        <div class="media-body ml-3">
                                            <h5 class="mb-1">${post.user.username}</h5>
                                            <div class="text-muted small">${post.timestamp}</div>
                                        </div>
                                    </div>
                                    <p>${post.content}</p>
                                    <img src="${post.post_photo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="">
                                </div>
                                <div class="card-footer">
                                    <a href="javascript:void(0)" class="d-inline-block text-muted">
                                        <strong>${post.like}</strong> <small class="align-middle">Likes</small>
                                    </a>
                                    <a href="javascript:void(0)" class="d-inline-block text-muted ml-3">
                                        <strong>12</strong> <small class="align-middle">Comments</small>
                                    </a>
                                    <a href="javascript:void(0)" class="d-inline-block text-muted ml-3"></a>
                                </div>
                            </div>
                        </div>
                    </div>`;

                pageDiv.appendChild(postDiv);

            });

            document.getElementById("view-page").innerHTML = '';
            document.getElementById("view-page").appendChild(pageDiv);

            if (!response_data.is_current_user) {

                const followDiv = document.createElement("button");
                followDiv.classList.add('btn', 'btn-primary', 'flex-grow-1');
                followDiv.type = "button";
                followDiv.innerHTML = response_data.is_following ? "Unfollow" : "Follow";
                document.getElementById('follow').appendChild(followDiv);
            }
            document.getElementById('follow').addEventListener('click', ()=> follow(profile_id, response_data.is_following))
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
}
    
function follow(profile_id, is_following) {
    console.log(typeof profile_id);
    let url = is_following ? `/unfollow/${profile_id}/` : `/follow/${profile_id}/`;
    fetch(url, {
        method: "POST"
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to follow/unfollow user');
            }
            show_user_profile(profile_id);
        })
        .catch(error => {
            console.error('Error following/unfollowing user:', error);
        });
}
