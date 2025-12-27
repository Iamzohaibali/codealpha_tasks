const API_URL = 'http://localhost:5000/api';

let currentUserId = null;

// Load user profile
async function loadUserProfile(userId) {
    const token = localStorage.getItem('token');
    const profileContainer = document.getElementById('profile-container');
    
    if (!profileContainer) return;
    
    profileContainer.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            profileContainer.innerHTML = '<p class="error-message">Failed to load profile</p>';
            return;
        }

        currentUserId = data.user._id;
        renderProfile(data.user);
        loadUserPosts(userId);
    } catch (error) {
        profileContainer.innerHTML = '<p class="error-message">Failed to load profile</p>';
    }
}

// Render profile
function renderProfile(user) {
    const currentUser = window.authModule.getUser();
    const isOwnProfile = currentUser?.id === user._id;
    
    const profileHTML = `
        <div class="profile-header">
            <div class="profile-banner">
                <img src="${user.profilePicture}" alt="${user.username}" class="profile-avatar" id="profile-avatar">
                <div class="profile-info">
                    <h1>${user.fullName || user.username}</h1>
                    <p>@${user.username}</p>
                    ${user.bio ? `<p class="profile-bio">${user.bio}</p>` : ''}
                    
                    <div class="profile-stats">
                        <div class="stat">
                            <strong>${user.followers?.length || 0}</strong>
                            <span>Followers</span>
                        </div>
                        <div class="stat">
                            <strong>${user.following?.length || 0}</strong>
                            <span>Following</span>
                        </div>
                    </div>
                    
                    <div class="profile-actions">
                        ${isOwnProfile ? `
                            <button class="btn" onclick="showEditProfile()">Edit Profile</button>
                            <button class="btn btn-secondary" onclick="logout()">Logout</button>
                        ` : `
                            <button class="btn" id="follow-btn" onclick="${user.followers?.some(f => f._id === currentUser?.id) ? 'unfollowUser()' : 'followUser()'}">
                                ${user.followers?.some(f => f._id === currentUser?.id) ? 'Following' : 'Follow'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
        
        <div id="profile-posts-container"></div>
        
        ${isOwnProfile ? `
            <div id="edit-profile-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Profile</h3>
                        <button class="close-modal" onclick="closeEditProfile()">×</button>
                    </div>
                    <form id="edit-profile-form" onsubmit="updateProfile(event)">
                        <div class="form-group">
                            <label>Profile Picture</label>
                            <div class="file-upload">
                                <input type="file" id="profile-picture" name="profilePicture" accept="image/*" onchange="previewProfileImage(this)">
                                <button type="button" class="btn">Choose Image</button>
                            </div>
                            <div id="profile-picture-preview"></div>
                        </div>
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="edit-fullName" class="form-control" value="${user.fullName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Bio</label>
                            <textarea id="edit-bio" class="form-control" rows="4">${user.bio || ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-block">Save Changes</button>
                    </form>
                </div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('profile-container').innerHTML = profileHTML;
}

// Load user's posts
async function loadUserPosts(userId) {
    const token = localStorage.getItem('token');
    const postsContainer = document.getElementById('profile-posts-container');
    
    if (!postsContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            postsContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
            return;
        }

        if (!data.posts || data.posts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">No posts yet</p>';
            return;
        }

        postsContainer.innerHTML = '<h3>Posts</h3>';
        const postsDiv = document.createElement('div');
        postsDiv.id = 'user-posts';
        postsContainer.appendChild(postsDiv);
        
        window.postsModule.renderPosts(data.posts, postsDiv);
    } catch (error) {
        postsContainer.innerHTML = '<p class="error-message">Failed to load posts</p>';
    }
}

// Follow a user
async function followUser() {
    if (!currentUserId) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/${currentUserId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to follow user');
            return;
        }

        const followBtn = document.getElementById('follow-btn');
        followBtn.textContent = 'Following';
        followBtn.onclick = unfollowUser;
        
        // Update followers count
        const followersStat = document.querySelector('.profile-stats .stat:first-child strong');
        followersStat.textContent = parseInt(followersStat.textContent) + 1;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Unfollow a user
async function unfollowUser() {
    if (!currentUserId) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/${currentUserId}/unfollow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to unfollow user');
            return;
        }

        const followBtn = document.getElementById('follow-btn');
        followBtn.textContent = 'Follow';
        followBtn.onclick = followUser;
        
        // Update followers count
        const followersStat = document.querySelector('.profile-stats .stat:first-child strong');
        followersStat.textContent = parseInt(followersStat.textContent) - 1;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Show edit profile modal
function showEditProfile() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close edit profile modal
function closeEditProfile() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Preview profile image
function previewProfileImage(input) {
    const preview = document.getElementById('profile-picture-preview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" class="profile-avatar" style="width: 100px; height: 100px; margin-top: 10px;">
            `;
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Update profile
async function updateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const fullName = document.getElementById('edit-fullName').value;
    const bio = document.getElementById('edit-bio').value;
    const profilePicture = document.getElementById('profile-picture').files[0];
    
    if (fullName) formData.append('fullName', fullName);
    if (bio) formData.append('bio', bio);
    if (profilePicture) formData.append('profilePicture', profilePicture);
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to update profile');
            return;
        }

        window.authModule.showSuccess('Profile updated successfully');
        
        // Update local storage
        const currentUser = window.authModule.getUser();
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update UI
        closeEditProfile();
        loadUserProfile(updatedUser.id);
        
        // Update navigation
        window.authModule.updateUserUI();
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Delete account
async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to delete account');
            return;
        }

        window.authModule.showSuccess('Account deleted successfully');
        window.authModule.logout();
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
    }
}

// Search users
async function searchUsers(query) {
    if (!query.trim()) return [];
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/users/search/users?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            window.authModule.showError(data.error || 'Failed to search users');
            return [];
        }

        return data.users;
    } catch (error) {
        window.authModule.showError('An error occurred. Please try again.');
        return [];
    }
}

// Initialize profile module
document.addEventListener('DOMContentLoaded', () => {
    // Get user ID from URL or use current user
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || window.authModule.getUser()?.id;
    
    if (userId) {
        loadUserProfile(userId);
    }
    
    // Initialize search if search input exists
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = this.value.trim();
                if (query.length >= 2) {
                    const users = await searchUsers(query);
                    displaySearchResults(users);
                }
            }, 300);
        });
    }
});

// Display search results
function displaySearchResults(users) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No users found</p>';
        return;
    }
    
    resultsContainer.innerHTML = users.map(user => `
        <div class="search-result" onclick="window.location.href='/views/profile.html?id=${user._id}'">
            <img src="${user.profilePicture}" alt="${user.username}" class="search-avatar">
            <div class="search-result-info">
                <strong>${user.fullName || user.username}</strong>
                <small>@${user.username}</small>
            </div>
        </div>
    `).join('');
}

window.profileModule = {
    loadUserProfile,
    followUser,
    unfollowUser,
    updateProfile,
    deleteAccount,
    searchUsers
};