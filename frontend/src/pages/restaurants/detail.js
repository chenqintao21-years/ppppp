// ==================== API 配置 ====================
const API_BASE_URL = 'http://localhost:3000/api';

const API_ENDPOINTS = {
    getRestaurantDetails: (id) => `${API_BASE_URL}/restaurants/${id}`,
    getRestaurantReviews: (id) => `${API_BASE_URL}/restaurants/${id}/reviews`,
};

// ==================== 全局变量 ====================
let currentRestaurantId = null;
let currentPage = 1;

// ==================== 加载餐厅详情 ====================
async function loadRestaurantDetails() {
    try {
        // 调用真实 API
        const response = await fetch(API_ENDPOINTS.getRestaurantDetails(currentRestaurantId));
        const result = await response.json();

        if (result.success && result.data) {
            displayRestaurantDetails(result.data);
            loadReviews();
        } else {
            // API返回失败
            console.error('API返回失败:', result);
            showErrorMessage('无法加载餐厅详情，请稍后重试');
        }

    } catch (error) {
        console.error('加载餐厅详情失败:', error);
        showErrorMessage('加载失败，请检查网络连接');
    }
}

// 显示错误信息
function showErrorMessage(message) {
    const container = document.querySelector('.main-content .container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <h2 style="color: #666; margin-bottom: 20px;">😕 ${message}</h2>
                <button onclick="window.history.back()" style="padding: 10px 30px; background: #00AA6C; color: white; border: none; border-radius: 5px; cursor: pointer;">返回</button>
            </div>
        `;
    }
}

function displayRestaurantDetails(restaurant) {
    // 更新标题和面包屑
    document.getElementById('restaurantName').textContent = restaurant.name;
    document.getElementById('restaurantTitle').textContent = restaurant.name;
    document.title = `${restaurant.name} - TripAdvisor`;

    // 更新面包屑中的城市信息（从地址中提取城市名）
    const breadcrumbCity = document.getElementById('breadcrumbCity');
    if (breadcrumbCity && restaurant.address) {
        // 尝试从地址中提取城市名（例如："上海市黄浦区..." -> "上海"）
        const cityMatch = restaurant.address.match(/^([一-龥]+市|[一-龥]+自治区|[一-龥]+特别行政区)/);
        if (cityMatch) {
            const cityName = cityMatch[1].replace('市', '');
            breadcrumbCity.textContent = `${cityName}美食`;
            breadcrumbCity.href = `restaurant-search.html?location=${encodeURIComponent(cityName)}`;
        }
    }

    // 更新评分
    const ratingCircles = generateRatingCircles(restaurant.rating);
    document.getElementById('ratingCircles').innerHTML = ratingCircles;
    document.getElementById('ratingScore').textContent = restaurant.rating;
    document.getElementById('reviewCount').textContent = `${restaurant.reviewCount.toLocaleString()} 条点评`;

    // 更新基本信息
    document.getElementById('cuisineType').textContent = restaurant.cuisine.join(' • ');
    document.getElementById('priceRange').textContent = restaurant.priceRange;
    document.getElementById('restaurantDescription').textContent = restaurant.description;

    // 更新详细信息
    document.getElementById('detailCuisine').textContent = restaurant.cuisine.join(', ');
    document.getElementById('detailFeatures').textContent = restaurant.features.join(', ');
    document.getElementById('detailPrice').textContent = restaurant.priceDetail;

    // 更新联系信息
    document.getElementById('restaurantAddress').textContent = restaurant.address;
    document.getElementById('restaurantPhone').textContent = restaurant.phone;
    document.getElementById('restaurantHours').textContent = restaurant.hours;

    // 更新主图片
    if (restaurant.photos && restaurant.photos.length > 0) {
        document.getElementById('mainPhoto').src = restaurant.photos[0];
    }

    // 更新评分条
    updateRatingBars(restaurant.ratings);

    // 更新附近推荐
    displayNearbyRestaurants(restaurant.nearbyRestaurants);
}

function generateRatingCircles(rating) {
    const fullCircles = Math.floor(rating);
    const hasHalfCircle = rating % 1 >= 0.5;
    const emptyCircles = 5 - fullCircles - (hasHalfCircle ? 1 : 0);

    let html = '';

    for (let i = 0; i < fullCircles; i++) {
        html += '<div class="rating-circle"></div>';
    }

    if (hasHalfCircle) {
        html += '<div class="rating-circle half"></div>';
    }

    for (let i = 0; i < emptyCircles; i++) {
        html += '<div class="rating-circle empty"></div>';
    }

    return html;
}

function updateRatingBars(ratings) {
    const container = document.getElementById('ratingBarsContainer');

    if (!container) return;

    // 定义评分维度的标签和对应的数据键
    const ratingDimensions = [
        { label: '食物', key: 'food' },
        { label: '服务', key: 'service' },
        { label: '性价比', key: 'value' },
        { label: '氛围', key: 'atmosphere' }
    ];

    // 清空容器
    container.innerHTML = '';

    // 动态生成每个评分条
    ratingDimensions.forEach(dimension => {
        const score = ratings[dimension.key] || 0;
        const percentage = (score / 5) * 100;

        const barItem = document.createElement('div');
        barItem.className = 'rating-bar-item';

        barItem.innerHTML = `
            <span class="bar-label">${dimension.label}</span>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="bar-score">${score.toFixed(1)}</span>
        `;

        container.appendChild(barItem);
    });
}

// ==================== 加载点评 ====================
async function loadReviews() {
    try {
        // 调用真实 API
        const response = await fetch(API_ENDPOINTS.getRestaurantReviews(currentRestaurantId));
        const result = await response.json();

        if (result.success && result.data) {
            displayReviews(result.data);
        } else {
            console.error('加载点评失败:', result);
            const container = document.getElementById('reviewsContainer');
            container.innerHTML = '<p style="text-align: center; color: #999;">暂无点评</p>';
        }

    } catch (error) {
        console.error('加载点评失败:', error);
        const container = document.getElementById('reviewsContainer');
        container.innerHTML = '<p style="text-align: center; color: #999;">加载点评失败</p>';
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsContainer');

    if (reviews.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">暂无点评</p>';
        return;
    }

    container.innerHTML = '';

    reviews.forEach((review, index) => {
        const reviewElement = createReviewElement(review);
        reviewElement.style.opacity = '0';
        reviewElement.style.transform = 'translateY(20px)';
        container.appendChild(reviewElement);

        setTimeout(() => {
            reviewElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            reviewElement.style.opacity = '1';
            reviewElement.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createReviewElement(review) {
    const div = document.createElement('div');
    div.className = 'review-item';

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    div.innerHTML = `
        <div class="review-header">
            <div class="reviewer-avatar"></div>
            <div class="reviewer-info">
                <div class="reviewer-name">${review.userName}</div>
                <div class="review-date">${review.date}</div>
            </div>
        </div>
        <div class="review-rating">
            ${generateRatingCircles(review.rating)}
        </div>
        <p class="review-text">${review.text}</p>
    `;

    return div;
}

function loadMoreReviews() {
    currentPage++;
    // TODO: 加载更多点评
    alert('加载更多点评功能开发中...');
}

// ==================== 附近推荐 ====================
function displayNearbyRestaurants(nearbyRestaurants) {
    const container = document.getElementById('nearbyRestaurantsContainer');

    if (!container) return;

    if (!nearbyRestaurants || nearbyRestaurants.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无附近推荐</p>';
        return;
    }

    // 清空容器
    container.innerHTML = '';

    // 动态生成每个附近餐厅项
    nearbyRestaurants.forEach(restaurant => {
        const nearbyItem = document.createElement('div');
        nearbyItem.className = 'nearby-item';

        // 生成星星评分
        const fullStars = Math.floor(restaurant.rating);
        const hasHalfStar = restaurant.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '★'.repeat(fullStars);
        if (hasHalfStar) {
            starsHtml += '☆';
        }
        starsHtml += '☆'.repeat(emptyStars);

        nearbyItem.innerHTML = `
            <img src="${restaurant.image}" alt="${restaurant.name}">
            <div class="nearby-info">
                <h4>${restaurant.name}</h4>
                <div class="nearby-rating">
                    <span class="stars">${starsHtml}</span>
                    <span>${restaurant.rating.toFixed(1)}</span>
                </div>
            </div>
        `;

        // 添加点击事件，跳转到该餐厅详情页
        nearbyItem.style.cursor = 'pointer';
        nearbyItem.addEventListener('click', () => {
            window.location.href = `restaurant-detail.html?id=${restaurant.id}`;
        });

        container.appendChild(nearbyItem);
    });
}

// ==================== 交互功能 ====================
function handleSave() {
    alert('保存功能开发中...');
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('restaurantTitle').textContent,
            text: document.getElementById('restaurantDescription').textContent,
            url: window.location.href
        }).catch(err => console.log('分享失败:', err));
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('链接已复制到剪贴板！');
        });
    }
}

function handleViewAllPhotos() {
    alert('查看所有照片功能开发中...');
}

function handleViewMap() {
    const address = document.getElementById('restaurantAddress').textContent;
    // TODO: 打开地图
    alert(`查看地图: ${address}`);
}

// ==================== 工具函数 ====================
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==================== 页面初始化 ====================
// 从URL获取餐厅ID
function getRestaurantIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    console.log('餐厅详情页加载完成');

    // 获取餐厅ID
    currentRestaurantId = getRestaurantIdFromURL();

    if (!currentRestaurantId) {
        showErrorMessage('未指定餐厅ID');
        return;
    }

    console.log('加载餐厅详情，ID:', currentRestaurantId);

    // 加载餐厅详情
    loadRestaurantDetails();

    // 绑定按钮事件
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSave);
    }

    const shareBtn = document.querySelector('.btn-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    const viewAllPhotosBtn = document.querySelector('.view-all-photos');
    if (viewAllPhotosBtn) {
        viewAllPhotosBtn.addEventListener('click', handleViewAllPhotos);
    }

    const viewMapBtn = document.querySelector('.btn-primary.btn-full');
    if (viewMapBtn && viewMapBtn.textContent.includes('查看地图')) {
        viewMapBtn.addEventListener('click', handleViewMap);
    }

    const loadMoreReviewsBtn = document.querySelector('.load-more-reviews');
    if (loadMoreReviewsBtn) {
        loadMoreReviewsBtn.addEventListener('click', loadMoreReviews);
    }
});
