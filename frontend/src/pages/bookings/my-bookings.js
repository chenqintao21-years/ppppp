import { authService } from '../../services/auth.js';
import { apiService } from '../../services/users.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!authService.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // DOM 元素
    const bookingsList = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const typeFilter = document.getElementById('typeFilter');
    const cancelModal = document.getElementById('cancelModal');
    const modalClose = document.getElementById('modalClose');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const cancelBookingInfo = document.getElementById('cancelBookingInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerUsername = document.getElementById('headerUsername');

    let currentStatus = 'all';
    let currentType = '';
    let bookingToCancel = null;
    let allBookings = [];

    // 初始化
    await initUserInfo();
    await loadBookings();

    // 筛选器事件
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            filterBookings();
        });
    });

    typeFilter.addEventListener('change', (e) => {
        currentType = e.target.value;
        filterBookings();
    });

    // 模态框事件
    modalClose.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    confirmCancelBtn.addEventListener('click', confirmCancel);

    cancelModal.addEventListener('click', (e) => {
        if (e.target === cancelModal) {
            closeModal();
        }
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

    // 加载预订列表
    async function loadBookings() {
        try {
            showLoading();
            const response = await apiService.getUserBookings();
            allBookings = response.data || [];
            filterBookings();
        } catch (error) {
            console.error('加载预订失败:', error);
            showError('加载预订失败，请稍后重试');
            hideLoading();
        }
    }

    // 筛选预订
    function filterBookings() {
        let filtered = allBookings;

        // 按状态筛选
        if (currentStatus !== 'all') {
            filtered = filtered.filter(b => b.status === currentStatus);
        }

        // 按类型筛选
        if (currentType) {
            filtered = filtered.filter(b => b.entity_type === currentType);
        }

        displayBookings(filtered);
    }

    // 显示预订列表
    function displayBookings(bookings) {
        hideLoading();

        if (bookings.length === 0) {
            bookingsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        bookingsList.style.display = 'block';
        emptyState.style.display = 'none';

        bookingsList.innerHTML = bookings.map(booking => createBookingCard(booking)).join('');

        // 绑定取消按钮事件
        document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookingId = e.target.dataset.bookingId;
                const booking = allBookings.find(b => b.id == bookingId);
                if (booking) {
                    showCancelModal(booking);
                }
            });
        });
    }

    // 创建预订卡片
    function createBookingCard(booking) {
        const statusClass = getStatusClass(booking.status);
        const statusText = getStatusText(booking.status);
        const typeText = getTypeText(booking.entity_type);
        const typeIcon = getTypeIcon(booking.entity_type);

        return `
            <div class="booking-card ${statusClass}">
                <div class="booking-image">
                    <img src="${booking.entity_image || '/images/placeholder.jpg'}" alt="${booking.entity_name}">
                    <div class="booking-type-badge">
                        ${typeIcon}
                        <span>${typeText}</span>
                    </div>
                </div>
                <div class="booking-content">
                    <div class="booking-header">
                        <h3 class="booking-title">${booking.entity_name}</h3>
                        <span class="booking-status status-${booking.status}">${statusText}</span>
                    </div>
                    <div class="booking-details">
                        <div class="booking-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>预订日期：${formatDate(booking.booking_date)}</span>
                        </div>
                        <div class="booking-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>人数：${booking.guests} 人</span>
                        </div>
                        <div class="booking-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${booking.entity_location || '位置信息'}</span>
                        </div>
                        ${booking.total_price ? `
                        <div class="booking-detail-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span>总价：¥${booking.total_price}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="booking-info">
                        <div class="booking-info-item">
                            <span class="info-label">预订编号：</span>
                            <span class="info-value">${booking.booking_id}</span>
                        </div>
                        <div class="booking-info-item">
                            <span class="info-label">预订时间：</span>
                            <span class="info-value">${formatDateTime(booking.created_at)}</span>
                        </div>
                        ${booking.guest_name ? `
                        <div class="booking-info-item">
                            <span class="info-label">联系人：</span>
                            <span class="info-value">${booking.guest_name} - ${booking.guest_phone}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="booking-actions">
                        ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                            <button class="btn btn-danger cancel-booking-btn" data-booking-id="${booking.id}">取消预订</button>
                        ` : ''}
                        <a href="${getEntityUrl(booking.entity_type, booking.entity_id)}" class="btn btn-secondary">查看详情</a>
                    </div>
                </div>
            </div>
        `;
    }

    // 显示取消确认弹窗
    function showCancelModal(booking) {
        bookingToCancel = booking;
        cancelBookingInfo.innerHTML = `
            <p><strong>${booking.entity_name}</strong></p>
            <p>预订日期：${formatDate(booking.booking_date)}</p>
            <p>预订编号：${booking.booking_id}</p>
        `;
        cancelModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭弹窗
    function closeModal() {
        cancelModal.classList.remove('show');
        document.body.style.overflow = '';
        bookingToCancel = null;
    }

    // 确认取消预订
    async function confirmCancel() {
        if (!bookingToCancel) return;

        try {
            confirmCancelBtn.disabled = true;
            confirmCancelBtn.textContent = '取消中...';

            await apiService.cancelBooking(bookingToCancel.id);

            showSuccess('预订已取消');
            closeModal();

            // 重新加载预订列表
            await loadBookings();

        } catch (error) {
            showError(error.message || '取消预订失败');
        } finally {
            confirmCancelBtn.disabled = false;
            confirmCancelBtn.textContent = '确认取消';
        }
    }

    // 工具函数
    function getStatusClass(status) {
        const classes = {
            'pending': 'booking-pending',
            'confirmed': 'booking-confirmed',
            'cancelled': 'booking-cancelled'
        };
        return classes[status] || '';
    }

    function getStatusText(status) {
        const texts = {
            'pending': '待确认',
            'confirmed': '已确认',
            'cancelled': '已取消'
        };
        return texts[status] || status;
    }

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
            'attraction': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
            'hotel': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            'restaurant': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>'
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

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showLoading() {
        bookingsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>
        `;
    }

    function hideLoading() {
        const loadingState = bookingsList.querySelector('.loading-state');
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
