const API_URL = 'http://localhost:5000/api';

// Create a new post
async function createPost(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const content = document.getElementById('post-content').value;
    const image = document.getElementById('post-image').files[0];
    
    if (content) formData.append('content', content);
    if (image) formData.append('image', image);
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to create post');
            return;
        }

        window.authModule.showSuccess('Post created successfully!');
        document.getElementById('create-post-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        
        // Refresh feed
        loadFeed();
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Load posts feed
async function loadFeed() {
    const token = localStorage.getItem('token');
    const feedContainer = document.getElementById('feed-posts');
    
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            feedContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
            return;
        }

        renderPosts(data.posts, feedContainer);
    } catch (error) {
        feedContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
    }
}

// Load following posts
async function loadFollowingPosts() {
    const token = localStorage.getItem('token');
    const feedContainer = document.getElementById('following-posts');
    
    if (!feedContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/following`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            feedContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
            return;
        }

        renderPosts(data.posts, feedContainer);
    } catch (error) {
        feedContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
    }
}

// Render posts to container
function renderPosts(posts, container) {
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="no-posts">No posts yet. Be the first to post!</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <img src="${post.user.profilePicture}" alt="${post.user.username}" class="post-avatar">
                <div class="post-info">
                    <h4>${post.user.fullName || post.user.username}</h4>
                    <span class="post-time">${formatDate(post.createdAt)}</span>
                </div>
                ${post.user._id === window.authModule.getUser()?.id ? `
                    <div class="post-actions-dropdown">
                        <button class="action-btn" onclick="showPostActions('${post._id}')">⋯</button>
                        <div class="dropdown-menu" id="dropdown-${post._id}" style="display: none;">
                            <button onclick="editPost('${post._id}')">Edit</button>
                            <button onclick="deletePost('${post._id}')" class="delete-btn">Delete</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="post-content">
                <p>${post.content}</p>
                ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            </div>
            <div class="post-actions">
                <button class="action-btn like-btn ${post.likes.includes(window.authModule.getUser()?.id) ? 'liked' : ''}" 
                        onclick="likePost('${post._id}')">
                    <span class="like-icon">❤️</span>
                    <span class="like-count">${post.likes.length}</span>
                </button>
                <button class="action-btn comment-btn" onclick="showComments('${post._id}')">
                    <span class="comment-icon">💬</span>
                    <span class="comment-count">${post.comments?.length || 0}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-${post._id}" style="display: none;">
                <div class="comments-list" id="comments-list-${post._id}">
                    ${renderComments(post.comments || [])}
                </div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post._id}" placeholder="Write a comment...">
                    <button class="btn" onclick="addComment('${post._id}')">Post</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render comments
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="no-comments">No comments yet</p>';
    }
    
    return comments.map(comment => `
        <div class="comment" data-comment-id="${comment._id}">
            <img src="${comment.user.profilePicture}" alt="${comment.user.username}" class="comment-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <strong>${comment.user.username}</strong>
                    <small>${formatDate(comment.createdAt)}</small>
                </div>
                <div class="comment-text">${comment.content}</div>
                <div class="comment-actions">
                    <button class="action-btn" onclick="likeComment('${comment._id}')">
                        <span class="like-icon">❤️</span>
                        <span class="like-count">${comment.likes?.length || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Like/unlike a post
async function likePost(postId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to like post');
            return;
        }

        // Update like button
        const likeBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .like-btn`);
        const likeCount = likeBtn.querySelector('.like-count');
        
        if (likeBtn.classList.contains('liked')) {
            likeBtn.classList.remove('liked');
            likeCount.textContent = parseInt(likeCount.textContent) - 1;
        } else {
            likeBtn.classList.add('liked');
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
        }
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Show/hide comments
function showComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isHidden = commentsSection.style.display === 'none';
    
    if (isHidden) {
        commentsSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

// Load comments for a post
async function loadComments(postId) {
    const token = localStorage.getItem('token');
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    try {
        const response = await fetch(`${API_URL}/comments/${postId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            commentsList.innerHTML = '<p class="error">Failed to load comments</p>';
            return;
        }

        commentsList.innerHTML = renderComments(data.comments);
    } catch (error) {
        commentsList.innerHTML = '<p class="error">Failed to load comments</p>';
    }
}

// Add a comment
async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    
    if (!content) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/comments/${postId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to add comment');
            return;
        }

        // Clear input
        commentInput.value = '';
        
        // Add new comment to list
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const commentHTML = `
            <div class="comment" data-comment-id="${data.comment._id}">
                <img src="${data.comment.user.profilePicture}" alt="${data.comment.user.username}" class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong>${data.comment.user.username}</strong>
                        <small>Just now</small>
                    </div>
                    <div class="comment-text">${data.comment.content}</div>
                    <div class="comment-actions">
                        <button class="action-btn" onclick="likeComment('${data.comment._id}')">
                            <span class="like-icon">❤️</span>
                            <span class="like-count">0</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
        
        // Update comment count
        const commentBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .comment-btn`);
        const commentCount = commentBtn.querySelector('.comment-count');
        commentCount.textContent = parseInt(commentCount.textContent) + 1;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Like/unlike a comment
async function likeComment(commentId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to like comment');
            return;
        }

        // Update like count
        const likeBtn = document.querySelector(`.comment[data-comment-id="${commentId}"] .action-btn`);
        const likeCount = likeBtn.querySelector('.like-count');
        likeCount.textContent = data.likes.length;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Delete a post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to delete post');
            return;
        }

        window.authModule.showSuccess('Post deleted successfully');
        document.querySelector(`.post-card[data-post-id="${postId}"]`).remove();
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Edit a post
async function editPost(postId) {
    const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    const content = postCard.querySelector('.post-content p').textContent;
    
    const newContent = prompt('Edit your post:', content);
    if (newContent === null || newContent === content) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to update post');
            return;
        }

        window.authModule.showSuccess('Post updated successfully');
        postCard.querySelector('.post-content p').textContent = newContent;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString();
}

// Image preview for post creation
function previewImage(input) {
    const preview = document.getElementById('image-preview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" class="upload-preview" alt="Image preview">`;
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

// Initialize posts module
document.addEventListener('DOMContentLoaded', () => {
    // Load feed if on feed page
    if (document.getElementById('feed-posts')) {
        loadFeed();
    }
    
    // Load following posts if on following page
    if (document.getElementById('following-posts')) {
        loadFollowingPosts();
    }
    
    // Initialize create post form
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', createPost);
    }
    
    // Initialize image preview
    const imageInput = document.getElementById('post-image');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
});

window.postsModule = {
    createPost,
    loadFeed,
    loadFollowingPosts,
    likePost,
    addComment,
    likeComment,
    deletePost,
    editPost
};