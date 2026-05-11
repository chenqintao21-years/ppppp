// 酒店详情页面脚本
import {
    API_BASE_URL,
    PAGE_LABELS,
    RATING_CATEGORIES,
    GUEST_OPTIONS,
    BREADCRUMB_ITEMS,
    generateIconSVG
} from '../../config/hotel-detail-config.js';

// 从URL获取酒店ID
function getHotelIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '1';
}

// 加载酒店详情
async function loadHotelDetail() {
    const hotelId = getHotelIdFromUrl();
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || '上海'; // 从URL获取城市参数

    try {
        const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            const hotel = result.data;
            renderHotelDetail(hotel);
            loadHotelReviews(hotelId);
        } else {
            console.error('加载酒店详情失败:', result);
            showErrorMessage('无法加载酒店详情，请稍后重试');
        }
    } catch (error) {
        console.error('加载酒店详情出错:', error);
        showErrorMessage('加载失败，请检查网络连接');
    }
}

// 显示错误信息
function showErrorMessage(message) {
    const mainContent = document.querySelector('.hotel-detail-main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <h2 style="color: #666; margin-bottom: 20px;">😕 ${message}</h2>
                <button onclick="window.history.back()" style="padding: 10px 30px; background: #00AA6C; color: white; border: none; border-radius: 5px; cursor: pointer;">返回</button>
            </div>
        `;
    }
}

// 渲染酒店详情
function renderHotelDetail(hotel) {
    // 更新页面标签（动态加载）
    updatePageLabels();

    // 更新标题和面包屑
    document.getElementById('hotelName').textContent = hotel.name;
    document.getElementById('hotelNameBreadcrumb').textContent = hotel.name;
    document.title = `${hotel.name} - Tripadvisor`;

    // 更新面包屑中的城市信息（从地址中提取城市名）
    const breadcrumbHotels = document.querySelector('.breadcrumb a[href="hotel-page.html"]');
    if (breadcrumbHotels && hotel.address) {
        // 尝试从地址中提取城市名（例如："上海市黄浦区..." -> "上海"）
        const cityMatch = hotel.address.match(/^([一-龥]+市|[一-龥]+自治区|[一-龥]+特别行政区)/);
        if (cityMatch) {
            const cityName = cityMatch[1].replace('市', '');
            breadcrumbHotels.textContent = `${cityName}酒店`;
            breadcrumbHotels.href = `hotel-page.html?city=${encodeURIComponent(cityName)}`;
        }
    }

    // 更新评分
    const ratingBubbles = document.getElementById('ratingBubbles');
    ratingBubbles.innerHTML = generateRatingBubbles(hotel.rating);

    document.getElementById('reviewCount').textContent = `${hotel.reviews.toLocaleString()} 条点评`;
    document.getElementById('ratingScore').textContent = hotel.rating.toFixed(1);

    // 更新点评区域的大评分气泡
    const ratingBubblesLarge = document.getElementById('ratingBubblesLarge');
    if (ratingBubblesLarge) {
        ratingBubblesLarge.innerHTML = generateRatingBubbles(hotel.rating);
    }

    // 更新位置
    document.getElementById('hotelLocation').querySelector('span').textContent = hotel.location;
    document.getElementById('hotelAddress').textContent = hotel.address;

    // 更新描述
    document.getElementById('hotelDescription').textContent = hotel.description;

    // 更新价格
    document.getElementById('priceAmount').textContent = `¥${hotel.price}`;

    // 渲染图片画廊
    renderPhotoGallery(hotel.images);

    // 渲染便利设施
    renderAmenities(hotel.amenities);

    // 渲染房型
    renderRoomTypes(hotel.roomTypes);

    // 渲染评分细分
    renderRatingBreakdown(hotel.ratingBreakdown);

    // 渲染地图
    renderMap(hotel);

    // 设置默认日期
    setDefaultDates();
}

// 更新页面标签（从配置动态加载）
function updatePageLabels() {
    // 更新区块标题
    const sectionTitles = document.querySelectorAll('.section-card h2');
    if (sectionTitles.length >= 4) {
        sectionTitles[0].textContent = PAGE_LABELS.about;
        sectionTitles[1].textContent = PAGE_LABELS.amenities;
        sectionTitles[2].textContent = PAGE_LABELS.rooms;
        sectionTitles[3].textContent = PAGE_LABELS.location;
        if (sectionTitles[4]) sectionTitles[4].textContent = PAGE_LABELS.reviews;
    }

    // 更新预订表单标签
    const formLabels = document.querySelectorAll('.booking-form label');
    if (formLabels.length >= 3) {
        formLabels[0].textContent = PAGE_LABELS.booking.checkIn;
        formLabels[1].textContent = PAGE_LABELS.booking.checkOut;
        formLabels[2].textContent = PAGE_LABELS.booking.guests;
    }

    // 更新按钮文本
    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) bookBtn.textContent = PAGE_LABELS.booking.viewDeals;

    const priceLabel = document.querySelector('.price-label');
    if (priceLabel) priceLabel.textContent = PAGE_LABELS.booking.priceLabel;

    const priceUnit = document.querySelector('.price-unit');
    if (priceUnit) priceUnit.textContent = PAGE_LABELS.booking.priceUnit;

    const bookingNote = document.querySelector('.booking-note span');
    if (bookingNote) bookingNote.textContent = PAGE_LABELS.booking.noCharge;

    // 更新客人选择下拉框
    updateGuestOptions();
}

// 生成评分气泡
function generateRatingBubbles(rating) {
    const fullBubbles = Math.floor(rating);
    const hasHalfBubble = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullBubbles; i++) {
        html += '<span class="bubble filled"></span>';
    }

    if (hasHalfBubble) {
        html += '<span class="bubble half"></span>';
    }

    const emptyBubbles = 5 - fullBubbles - (hasHalfBubble ? 1 : 0);
    for (let i = 0; i < emptyBubbles; i++) {
        html += '<span class="bubble"></span>';
    }

    return html;
}

// 渲染便利设施
function renderAmenities(amenities) {
    const amenitiesList = document.getElementById('amenitiesList');
    amenitiesList.innerHTML = amenities.map(amenity => `
        <div class="amenity-item">
            ${generateIconSVG(amenity.icon, 24, 24)}
            <span>${amenity.name}</span>
        </div>
    `).join('');
}

// 渲染房型
function renderRoomTypes(roomTypes) {
    const roomTypesList = document.getElementById('roomTypesList');
    roomTypesList.innerHTML = roomTypes.map(room => `
        <div class="room-type-card">
            <div class="room-info">
                <h3>${room.name}</h3>
                <div class="room-details">
                    <span>${room.size}</span>
                    <span>最多${room.capacity}位客人</span>
                </div>
                <div class="room-amenities">
                    ${room.amenities.map(a => `<span>• ${a}</span>`).join('')}
                </div>
            </div>
            <div class="room-price">
                <div class="room-price-amount">¥${room.price}</div>
                <div class="room-price-unit">每晚</div>
                <button class="select-room-btn" onclick="selectRoom(${room.id})">${PAGE_LABELS.actions.select}</button>
            </div>
        </div>
    `).join('');
}

// 渲染评分细分
function renderRatingBreakdown(ratingBreakdown) {
    if (!ratingBreakdown) return;

    const breakdownContainer = document.getElementById('ratingBreakdown');

    breakdownContainer.innerHTML = RATING_CATEGORIES.map(category => {
        const score = ratingBreakdown[category.key] || 0;
        const percentage = (score / 5) * 100;

        return `
            <div class="rating-bar">
                <span>${category.label}</span>
                <div class="bar"><div class="fill" style="width: ${percentage}%"></div></div>
                <span>${score.toFixed(1)}</span>
            </div>
        `;
    }).join('');
}

// 渲染图片画廊
function renderPhotoGallery(images) {
    const galleryContainer = document.getElementById('photoGallery');

    if (!images || images.length === 0) {
        // 使用占位图
        images = [
            'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\'%3E%3Crect fill=\'%23e0e0e0\' width=\'800\' height=\'600\'/%3E%3C/svg%3E',
            'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23d0d0d0\' width=\'400\' height=\'300\'/%3E%3C/svg%3E',
            'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23c0c0c0\' width=\'400\' height=\'300\'/%3E%3C/svg%3E',
            'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23b0b0b0\' width=\'400\' height=\'300\'/%3E%3C/svg%3E'
        ];
    }

    const mainImage = images[0];
    const smallImages = images.slice(1, 4);

    galleryContainer.innerHTML = `
        <div class="gallery-main">
            <img src="${mainImage}" alt="酒店主图">
        </div>
        <div class="gallery-grid-small">
            ${smallImages.map(img => `<img src="${img}" alt="酒店图片">`).join('')}
            <div class="view-all-photos">
                <button class="view-all-btn">查看所有照片</button>
            </div>
        </div>
    `;
}

// 高德地图安全配置
window._AMapSecurityConfig = {
    securityJsCode: '28cda766a6399e06cfeacca6dc9bd4c1'
};

// 加载高德地图脚本
function loadAMapScript() {
    return new Promise((resolve, reject) => {
        if (window.AMap) {
            resolve(window.AMap);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://webapi.amap.com/maps?v=2.0&key=987e520a1fb34f1680b515ff7ceb572e';
        script.async = true;
        script.onload = () => resolve(window.AMap);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 渲染地图
async function renderMap(hotel) {
    const mapContainer = document.getElementById('mapPlaceholder');

    // 检查是否有经纬度信息
    if (!hotel || !hotel.latitude || !hotel.longitude) {
        // 如果没有经纬度，显示占位符
        mapContainer.innerHTML = `
            <svg width="100%" height="300" viewBox="0 0 600 300">
                <rect fill="#e0e0e0" width="600" height="300"/>
                <circle cx="300" cy="150" r="30" fill="#00AA6C"/>
                <text x="300" y="200" text-anchor="middle" fill="#666" font-size="14">暂无位置信息</text>
            </svg>
        `;
        return;
    }

    // 清空容器
    mapContainer.innerHTML = '';
    mapContainer.style.height = '400px';

    try {
        // 加载高德地图API
        await loadAMapScript();

        // 创建地图实例
        const map = new AMap.Map(mapContainer, {
            zoom: 15,
            center: [parseFloat(hotel.longitude), parseFloat(hotel.latitude)],
            viewMode: '2D'
        });

        // 添加标记
        const marker = new AMap.Marker({
            position: [parseFloat(hotel.longitude), parseFloat(hotel.latitude)],
            title: hotel.name,
            map: map
        });

        // 添加信息窗体
        const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding: 10px;"><strong>${hotel.name}</strong><br/>${hotel.address || ''}</div>`,
            offset: new AMap.Pixel(0, -30)
        });

        // 点击标记显示信息窗体
        marker.on('click', function() {
            infoWindow.open(map, marker.getPosition());
        });
    } catch (error) {
        console.error('地图初始化失败:', error);
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; background: #e0e0e0; color: #666;">
                地图加载失败
            </div>
        `;
    }
}

// 加载酒店点评
async function loadHotelReviews(hotelId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}/reviews`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            renderReviews(result.data);
        } else {
            console.error('加载点评失败:', result);
            const reviewsList = document.getElementById('reviewsList');
            if (reviewsList) {
                reviewsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无点评</p>';
            }
        }
    } catch (error) {
        console.error('加载点评出错:', error);
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">加载点评失败</p>';
        }
    }
}

// 渲染点评
function renderReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-avatar"></div>
                <div class="reviewer-info">
                    <h4>${review.userName}</h4>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
            <div class="review-rating">
                ${generateRatingBubbles(review.rating)}
            </div>
            <h3 class="review-title">${review.title}</h3>
            <p class="review-content">${review.content}</p>
        </div>
    `).join('');
}

// 设置默认日期
function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    document.getElementById('checkInDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('checkOutDate').value = dayAfter.toISOString().split('T')[0];
}

// 更新客人选择下拉框
function updateGuestOptions() {
    const guestSelect = document.getElementById('guestCount');
    if (guestSelect) {
        guestSelect.innerHTML = GUEST_OPTIONS.map(option =>
            `<option value="${option.value}">${option.label}</option>`
        ).join('');
    }
}

// 选择房间（暴露到全局作用域供onclick使用）
window.selectRoom = function(roomId) {
    console.log('选择房间:', roomId);
    alert('房间选择功能即将推出！');
}

// 预订按钮点击
document.addEventListener('DOMContentLoaded', () => {
    loadHotelDetail();

    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            const checkIn = document.getElementById('checkInDate').value;
            const checkOut = document.getElementById('checkOutDate').value;
            const guests = document.getElementById('guestCount').value;

            if (!checkIn || !checkOut) {
                alert('请选择入住和退房日期');
                return;
            }

            console.log('预订信息:', { checkIn, checkOut, guests });
            alert('预订功能即将推出！');
        });
    }

    // 收藏按钮
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            const svg = this.querySelector('svg');
            const isFavorited = svg.getAttribute('fill') === 'currentColor';

            if (isFavorited) {
                svg.setAttribute('fill', 'none');
                this.querySelector('span').textContent = PAGE_LABELS.actions.save;
            } else {
                svg.setAttribute('fill', 'currentColor');
                svg.style.color = '#ff385c';
                this.querySelector('span').textContent = PAGE_LABELS.actions.saved;
            }
        });
    }

    // 分享按钮
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: document.getElementById('hotelName').textContent,
                    url: window.location.href
                }).catch(err => console.log('分享失败:', err));
            } else {
                alert('分享功能在此浏览器中不可用');
            }
        });
    }

    // 查看所有照片
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.textContent = PAGE_LABELS.actions.viewAllPhotos;
        viewAllBtn.addEventListener('click', () => {
            alert('照片画廊功能即将推出！');
        });
    }

    // 加载更多点评
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = PAGE_LABELS.actions.loadMoreReviews;
        loadMoreBtn.addEventListener('click', () => {
            alert('加载更多点评功能即将推出！');
        });
    }
});
