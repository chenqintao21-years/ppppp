import { authService } from '../../services/auth.js';
import { apiService } from '../../services/users.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!authService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // DOM 元素
    const reviewsList = document.getElementById('reviewsList');
    const emptyState = document.getElementById('emptyState');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    const modalClose = document.getElementById('modalClose');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const editReviewForm = document.getElementById('editReviewForm');
    const ratingInput = document.getElementById('ratingInput');
    const ratingValue = document.getElementById('ratingValue');
    const reviewTitle = document.getElementById('reviewTitle');
    const reviewContent = document.getElementById('reviewContent');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerUsername = document.getElementById('headerUsername');

    let currentType = '';
    let allReviews = [];
    let currentReview = null;
    let reviewToDelete = null;

    // 初始化
    await initUserInfo();
    await loadReviews();

    // 筛选器事件
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentType = tab.dataset.type;
            filterReviews();
        });
    });

    // 评分输入
    const starBtns = ratingInput.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = btn.dataset.rating;
            ratingValue.value = rating;
            updateStarDisplay(rating);
        });
    });

    // 模态框事件
    modalClose.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    deleteModalClose.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    saveEditBtn.addEventListener('click', saveReview);
    confirmDeleteBtn.addEventListener('click', confirmDelete);

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
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

    // 加载点评列表
    async function loadReviews() {
        try {
            showLoading();
            const response = await apiService.getUserReviews();
            allReviews = response.data || [];
            filterReviews();
        } catch (error) {
            console.error('加载点评失败:', error);
            showError('加载点评失败，请稍后重试');
            hideLoading();
        }
    }

    // 筛选点评
    function filterReviews() {
        let filtered = allReviews;

        if (currentType) {
            filtered = filtered.filter(r => r.entity_type === currentType);
        }

        displayReviews(filtered);
    }

    // 显示点评列表
    function displayReviews(reviews) {
        hideLoading();

        if (reviews.length === 0) {
            reviewsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        reviewsList.style.display = 'flex';
        emptyState.style.display = 'none';

        reviewsList.innerHTML = reviews.map(review => createReviewCard(review)).join('');

        // 绑定编辑和删除按钮
        document.querySelectorAll('.edit-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.dataset.reviewId;
                const review = allReviews.find(r => r.id == reviewId);
                if (review) showEditModal(review);
            });
        });

        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const reviewId = btn.dataset.reviewId;
                const review = allReviews.find(r => r.id == reviewId);
                if (review) showDeleteModal(review);
            });
        });
    }

    // 创建点评卡片
    function createReviewCard(review) {
        const typeText = getTypeText(review.entity_type);
        const entityUrl = getEntityUrl(review.entity_type, review.entity_id);

        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-entity">
                        <img src="${review.entity_image || '/images/placeholder.jpg'}" alt="${review.entity_name}" class="entity-image">
                        <div class="entity-info">
                            <a href="${entityUrl}" class="entity-name">${review.entity_name}</a>
                            <span class="entity-type">${typeText}</span>
                        </div>
                    </div>
                    <div class="review-actions">
                        <button class="btn btn-text btn-sm edit-review-btn" data-review-id="${review.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            编辑
                        </button>
                        <button class="btn btn-text btn-sm delete-review-btn" data-review-id="${review.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            删除
                        </button>
                    </div>
                </div>
                <div class="review-content">
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                        <span class="rating-value">${review.rating}</span>
                    </div>
                    ${review.title ? `<h3 class="review-title">${review.title}</h3>` : ''}
                    <p class="review-text">${review.content}</p>
                    <div class="review-meta">
                        <span class="review-date">发布于 ${formatDate(review.created_at)}</span>
                        ${review.helpful_count > 0 ? `
                        <span class="review-helpful">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            ${review.helpful_count} 人觉得有用
                        </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 显示编辑弹窗
    function showEditModal(review) {
        currentReview = review;
        reviewTitle.value = review.title || '';
        reviewContent.value = review.content || '';
        ratingValue.value = review.rating;
        updateStarDisplay(review.rating);
        editModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭编辑弹窗
    function closeEditModal() {
        editModal.classList.remove('show');
        document.body.style.overflow = '';
        currentReview = null;
        editReviewForm.reset();
        updateStarDisplay(0);
    }

    // 保存点评
    async function saveReview() {
        if (!currentReview) return;

        const rating = parseFloat(ratingValue.value);
        const title = reviewTitle.value.trim();
        const content = reviewContent.value.trim();

        if (!rating || rating < 1 || rating > 5) {
            showError('请选择评分');
            return;
        }

        if (!content) {
            showError('请输入点评内容');
            return;
        }

        try {
            saveEditBtn.disabled = true;
            saveEditBtn.textContent = '保存中...';

            await apiService.updateReview(currentReview.id, { rating, title, content });

            showSuccess('点评更新成功');
            closeEditModal();
            await loadReviews();

        } catch (error) {
            showError(error.message || '更新点评失败');
        } finally {
            saveEditBtn.disabled = false;
            saveEditBtn.textContent = '保存';
        }
    }

    // 显示删除确认弹窗
    function showDeleteModal(review) {
        reviewToDelete = review;
        deleteModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭删除弹窗
    function closeDeleteModal() {
        deleteModal.classList.remove('show');
        document.body.style.overflow = '';
        reviewToDelete = null;
    }

    // 确认删除
    async function confirmDelete() {
        if (!reviewToDelete) return;

        try {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = '删除中...';

            await apiService.deleteReview(reviewToDelete.id);

            showSuccess('点评已删除');
            closeDeleteModal();

            // 从列表中移除
            allReviews = allReviews.filter(r => r.id != reviewToDelete.id);
            filterReviews();

        } catch (error) {
            showError(error.message || '删除点评失败');
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = '确认删除';
        }
    }

    // 更新星星显示
    function updateStarDisplay(rating) {
        starBtns.forEach((btn, index) => {
            if (index < rating) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
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

        for (let i = 0; i < fullStars; i++) {
            stars += '<svg width="18" height="18" viewBox="0 0 24 24" fill="#00aa6c" stroke="#00aa6c" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        }

        if (hasHalfStar) {
            stars += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2"><defs><linearGradient id="half"><stop offset="50%" stop-color="#00aa6c"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)"></polygon></svg>';
        }

        for (let i = 0; i < emptyStars; i++) {
            stars += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
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
        reviewsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
        `;
    }

    function hideLoading() {
        const loadingState = reviewsList.querySelector('.loading-state');
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
