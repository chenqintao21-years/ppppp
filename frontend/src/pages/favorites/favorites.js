import { authService } from '../../services/auth.js';
import { apiService } from '../../services/users.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!authService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // DOM 元素
    const favoritesList = document.getElementById('favoritesList');
    const emptyState = document.getElementById('emptyState');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerUsername = document.getElementById('headerUsername');

    let currentType = '';
    let allFavorites = [];

    // 初始化
    await initUserInfo();
    await loadFavorites();

    // 筛选器事件
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type;
            filterFavorites();
        });
    });

    // 退出登录
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
        window.location.href = 'login.html';
    });

    // 用户菜单
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
    });

    // 初始化用户信息
    async function initUserInfo() {
        const user = authService.getCurrentUser();
        if (user) {
            const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23e0e0e0"/%3E%3Cpath d="M50 50c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zm0 7.5c-10 0-30 5-30 15v7.5h60v-7.5c0-10-20-15-30-15z" fill="%23999"/%3E%3C/svg%3E';
            headerAvatar.src = user.avatar || defaultAvatar;
            headerUsername.textContent = user.username;
        }
    }

    // 加载收藏列表
    async function loadFavorites() {
        try {
            showLoading();
            const response = await apiService.getUserFavorites();
            allFavorites = response.data || [];
            filterFavorites();
        } catch (error) {
            console.error('加载收藏失败:', error);
            showError('加载收藏失败，请稍后重试');
            hideLoading();
        }
    }

    // 筛选收藏
    function filterFavorites() {
        let filtered = allFavorites;

        if (currentType) {
            filtered = filtered.filter(f => f.entity_type === currentType);
        }

        displayFavorites(filtered);
    }

    // 显示收藏列表
    function displayFavorites(favorites) {
        hideLoading();

        if (favorites.length === 0) {
            favoritesList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        favoritesList.style.display = 'grid';
        emptyState.style.display = 'none';

        favoritesList.innerHTML = favorites.map(favorite => createFavoriteCard(favorite)).join('');

        // 绑定取消收藏按钮事件
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const favoriteId = e.target.closest('.remove-favorite-btn').dataset.favoriteId;
                await removeFavorite(favoriteId);
            });
        });
    }

    // 创建收藏卡片
    function createFavoriteCard(favorite) {
        const typeText = getTypeText(favorite.entity_type);
        const typeIcon = getTypeIcon(favorite.entity_type);
        const entityUrl = getEntityUrl(favorite.entity_type, favorite.entity_id);

        return `
            <div class="favorite-card">
                <a href="${entityUrl}" class="favorite-image">
                    <img src="${favorite.entity_image || '/images/placeholder.jpg'}" alt="${favorite.entity_name}">
                    <div class="favorite-type-badge">
                        ${typeIcon}
                        <span>${typeText}</span>
                    </div>
                </a>
                <div class="favorite-content">
                    <a href="${entityUrl}" class="favorite-title">${favorite.entity_name}</a>
                    <div class="favorite-rating">
                        <div class="rating-stars">
                            ${generateStars(favorite.entity_rating)}
                        </div>
                        <span class="rating-text">${favorite.entity_rating || 0}</span>
                        <span class="review-count">(${favorite.entity_review_count || 0} 条点评)</span>
                    </div>
                    ${favorite.entity_location ? `
                    <div class="favorite-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${favorite.entity_location}</span>
                    </div>
                    ` : ''}
                    ${favorite.entity_price ? `
                    <div class="favorite-price">
                        <span class="price-label">价格：</span>
                        <span class="price-value">¥${favorite.entity_price}</span>
                    </div>
                    ` : ''}
                    <div class="favorite-actions">
                        <a href="${entityUrl}" class="btn btn-primary btn-sm">查看详情</a>
                        <button class="btn btn-text btn-sm remove-favorite-btn" data-favorite-id="${favorite.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            取消收藏
                        </button>
                    </div>
                    <div class="favorite-date">
                        收藏于 ${formatDate(favorite.created_at)}
                    </div>
                </div>
            </div>
        `;
    }

    // 取消收藏
    async function removeFavorite(favoriteId) {
        try {
            await apiService.removeFavorite(favoriteId);
            showSuccess('已取消收藏');

            // 从列表中移除
            allFavorites = allFavorites.filter(f => f.id != favoriteId);
            filterFavorites();
        } catch (error) {
            showError(error.message || '取消收藏失败');
        }
    }

    // 工具函数
    function getTypeText(type) {
        const texts = {
            'attraction': '景点',
            'hotel': '酒店',
            'restaurant': '餐厅'
        };
        return texts[type] || type;
    }

    function getTypeIcon(type) {
        const icons = {
            'attraction': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
            'hotel': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            'restaurant': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>'
        };
        return icons[type] || '';
    }

    function getEntityUrl(type, id) {
        const urls = {
            'attraction': `attraction-detail.html?id=${id}`,
            'hotel': `hotel-detail.html?id=${id}`,
            'restaurant': `restaurant-detail.html?id=${id}`
        };
        return urls[type] || '#';
    }

    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';

        // 满星
        for (let i = 0; i < fullStars; i++) {
            stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="#00aa6c" stroke="#00aa6c" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        }

        // 半星
        if (hasHalfStar) {
            stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2"><defs><linearGradient id="half"><stop offset="50%" stop-color="#00aa6c"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)"></polygon></svg>';
        }

        // 空星
        for (let i = 0; i < emptyStars; i++) {
            stars += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        }

        return stars;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function showLoading() {
        favoritesList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
        `;
    }

    function hideLoading() {
        const loadingState = favoritesList.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    function showSuccess(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success-message';
        messageDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        document.querySelector('.profile-content').insertBefore(
            messageDiv,
            document.querySelector('.profile-header').nextSibling
        );
        setTimeout(() => messageDiv.remove(), 3000);
    }

    function showError(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>${message}</span>
        `;
        document.querySelector('.profile-content').insertBefore(
            messageDiv,
            document.querySelector('.profile-header').nextSibling
        );
        setTimeout(() => messageDiv.remove(), 5000);
    }
});
