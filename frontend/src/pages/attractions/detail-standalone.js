// 景点详情页交互脚本（独立版本，包含地图功能）

// ========== 高德地图配置 ==========
window._AMapSecurityConfig = {
    securityJsCode: '28cda766a6399e06cfeacca6dc9bd4c1'
};

// ========== 高德地图工具类 ==========
class AMapUtil {
    constructor(key) {
        this.key = key;
        this.map = null;
        this.AMap = null;
        this.markers = [];
    }

    async loadMapScript() {
        if (window.AMap) {
            this.AMap = window.AMap;
            return Promise.resolve(window.AMap);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.key}&plugin=AMap.Geocoder,AMap.Driving,AMap.PlaceSearch`;
            script.async = true;
            script.onload = () => {
                this.AMap = window.AMap;
                resolve(window.AMap);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initMap(containerId, options = {}) {
        await this.loadMapScript();

        const defaultOptions = {
            zoom: 15,
            center: [116.397128, 39.917544], // 北京故宫默认坐标
            viewMode: '3D',
            pitch: 0,
            ...options
        };

        this.map = new this.AMap.Map(containerId, defaultOptions);
        return this.map;
    }

    addMarker(position, options = {}) {
        if (!this.map) {
            console.error('地图未初始化');
            return null;
        }

        const marker = new this.AMap.Marker({
            position: position,
            title: options.title || '',
            icon: options.icon,
            ...options
        });

        marker.setMap(this.map);
        this.markers.push(marker);

        if (options.onClick) {
            marker.on('click', options.onClick);
        }

        return marker;
    }

    addInfoWindow(marker, content) {
        const infoWindow = new this.AMap.InfoWindow({
            content: content,
            offset: new this.AMap.Pixel(0, -30)
        });

        marker.on('click', () => {
            infoWindow.open(this.map, marker.getPosition());
        });

        return infoWindow;
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    calculateDistance(point1, point2) {
        if (!this.AMap) return 0;

        const p1 = new this.AMap.LngLat(point1[0], point1[1]);
        const p2 = new this.AMap.LngLat(point2[0], point2[1]);
        return p1.distance(p2);
    }

    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)}米`;
        } else {
            return `${(distance / 1000).toFixed(1)}公里`;
        }
    }

    async planRoute(start, end, options = {}) {
        return new Promise((resolve, reject) => {
            const driving = new this.AMap.Driving({
                map: this.map,
                panel: options.panel,
                hideMarkers: options.hideMarkers || false,
                ...options
            });

            driving.search(start, end, (status, result) => {
                if (status === 'complete') {
                    resolve(result);
                } else {
                    reject(new Error('路线规划失败'));
                }
            });
        });
    }

    async searchNearby(center, keyword, options = {}) {
        return new Promise((resolve, reject) => {
            const placeSearch = new this.AMap.PlaceSearch({
                type: options.type || '',
                pageSize: options.pageSize || 10,
                pageIndex: options.pageIndex || 1,
                city: options.city || '全国',
                citylimit: options.citylimit || false
            });

            placeSearch.searchNearBy(keyword, center, options.radius || 5000, (status, result) => {
                if (status === 'complete') {
                    resolve(result.poiList.pois);
                } else {
                    reject(new Error('搜索失败'));
                }
            });
        });
    }

    setCenter(lnglat, zoom) {
        if (this.map) {
            this.map.setCenter(lnglat);
            if (zoom) {
                this.map.setZoom(zoom);
            }
        }
    }

    fitView() {
        if (this.map && this.markers.length > 0) {
            this.map.setFitView();
        }
    }
}

// 初始化地图工具
const mapUtil = new AMapUtil('987e520a1fb34f1680b515ff7ceb572e');

// 景点数据配置（将从API动态加载）
let attractionData = {
    id: null,
    name: '',
    location: [116.397128, 39.917544], // 默认坐标
    address: ''
};

// ========== 动态数据加载功能 ==========

// 从URL获取景点ID
function getAttractionIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 生成评分气泡HTML
function generateRatingBubbles(rating, size = 'small') {
    const fullBubbles = Math.floor(rating);
    const hasHalfBubble = rating % 1 >= 0.5;
    const emptyBubbles = 5 - fullBubbles - (hasHalfBubble ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullBubbles; i++) {
        html += '<span class="bubble filled"></span>';
    }
    if (hasHalfBubble) {
        html += '<span class="bubble half"></span>';
    }
    for (let i = 0; i < emptyBubbles; i++) {
        html += '<span class="bubble"></span>';
    }
    return html;
}

// 加载景点详情数据
async function loadAttractionDetail(attractionId) {
    try {
        const response = await fetch(`http://localhost:3000/api/attractions/${attractionId}`);

        if (!response.ok) {
            throw new Error('景点不存在');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '加载失败');
        }

        const attraction = result.data;

        // 更新全局景点数据
        attractionData = {
            id: attraction.id,
            name: attraction.name,
            location: attraction.latitude && attraction.longitude
                ? [parseFloat(attraction.longitude), parseFloat(attraction.latitude)]
                : [116.397128, 39.917544],
            address: attraction.address || attraction.location_city || '暂无地址'
        };

        // 渲染景点基本信息
        renderAttractionBasicInfo(attraction);

        // 渲染图片轮播
        renderImageGallery(attraction);

        // 渲染评论和评分分布
        renderReviews(attraction.reviews || []);
        renderRatingBreakdown(attraction.reviews || []);

        // 加载相关推荐
        loadRelatedAttractions(attraction.location_city);

        // 初始化地图
        if (document.getElementById('attraction-map')) {
            initAttractionMap();
        }

        return attraction;
    } catch (error) {
        console.error('加载景点详情失败:', error);
        showErrorMessage('加载景点信息失败，请刷新重试');
        throw error;
    }
}

// 渲染景点基本信息
function renderAttractionBasicInfo(attraction) {
    // 面包屑
    const breadcrumbName = document.getElementById('breadcrumb-name');
    if (breadcrumbName) {
        breadcrumbName.textContent = attraction.name || '景点详情';
    }

    // 标题
    const title = document.getElementById('attraction-title');
    if (title) {
        title.textContent = attraction.name || '景点名称';
    }

    // 评分
    const ratingBubbles = document.getElementById('rating-bubbles');
    if (ratingBubbles) {
        ratingBubbles.innerHTML = generateRatingBubbles(parseFloat(attraction.rating) || 5, 'large');
    }

    const ratingScore = document.getElementById('rating-score');
    if (ratingScore) {
        ratingScore.textContent = parseFloat(attraction.rating || 5.0).toFixed(1);
    }

    const reviewCount = document.getElementById('review-count');
    if (reviewCount) {
        reviewCount.textContent = `${attraction.review_count || 0}条点评`;
    }

    // 描述
    const aboutText = document.getElementById('about-text');
    if (aboutText) {
        aboutText.textContent = attraction.description || '暂无描述';
    }

    // 亮点
    const highlightsList = document.getElementById('highlights-list');
    if (highlightsList && attraction.highlights) {
        const highlights = typeof attraction.highlights === 'string'
            ? JSON.parse(attraction.highlights)
            : attraction.highlights;

        if (Array.isArray(highlights) && highlights.length > 0) {
            highlightsList.innerHTML = highlights.map(highlight => `
                <li>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    ${highlight}
                </li>
            `).join('');
        } else {
            highlightsList.innerHTML = '<li>暂无亮点信息</li>';
        }
    }

    // 包含内容
    const includesList = document.getElementById('includes-list');
    if (includesList && attraction.includes) {
        const includes = typeof attraction.includes === 'string'
            ? JSON.parse(attraction.includes)
            : attraction.includes;

        if (Array.isArray(includes) && includes.length > 0) {
            includesList.innerHTML = includes.map(item => `
                <div class="include-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00aa6c" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>${item}</span>
                </div>
            `).join('');
        } else {
            includesList.innerHTML = '<div class="include-item">暂无信息</div>';
        }
    }

    // 不包含内容
    const excludesList = document.getElementById('excludes-list');
    if (excludesList && attraction.excludes) {
        const excludes = typeof attraction.excludes === 'string'
            ? JSON.parse(attraction.excludes)
            : attraction.excludes;

        if (Array.isArray(excludes) && excludes.length > 0) {
            excludesList.innerHTML = excludes.map(item => `
                <div class="exclude-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>${item}</span>
                </div>
            `).join('');
        } else {
            excludesList.innerHTML = '<div class="exclude-item">暂无信息</div>';
        }
    }

    // 价格
    const priceElement = document.getElementById('attraction-price');
    if (priceElement) {
        priceElement.textContent = parseFloat(attraction.price || 0).toFixed(2);
    }

    // 地址
    const addressElement = document.getElementById('attraction-address');
    if (addressElement) {
        addressElement.textContent = attraction.address || attraction.location_city || '暂无地址';
    }

    // 营业时间
    const hoursElement = document.getElementById('attraction-hours');
    if (hoursElement) {
        hoursElement.textContent = attraction.opening_hours || '全天开放';
    }

    // 联系电话
    const phoneElement = document.getElementById('attraction-phone');
    if (phoneElement) {
        phoneElement.textContent = attraction.phone || '暂无';
    }

    // 设施服务
    const facilitiesElement = document.getElementById('attraction-facilities');
    if (facilitiesElement && attraction.facilities) {
        try {
            const facilities = typeof attraction.facilities === 'string'
                ? JSON.parse(attraction.facilities)
                : attraction.facilities;

            if (Array.isArray(facilities) && facilities.length > 0) {
                facilitiesElement.innerHTML = facilities.map(facility =>
                    `<span class="facility-tag">${facility}</span>`
                ).join('');
            } else {
                facilitiesElement.innerHTML = '<span class="facility-tag">暂无信息</span>';
            }
        } catch (e) {
            facilitiesElement.innerHTML = '<span class="facility-tag">暂无信息</span>';
        }
    }
}

// 渲染图片轮播
function renderImageGallery(attraction) {
    const mainImage = document.getElementById('main-gallery-image');
    const thumbnailGrid = document.getElementById('thumbnail-grid');
    const imageCounter = document.querySelector('.image-counter');

    if (!mainImage || !thumbnailGrid) return;

    // 获取真实图片数组
    let images = [];

    if (attraction.photos) {
        try {
            let photos = [];

            // 处理逗号分隔的字符串
            if (typeof attraction.photos === 'string') {
                // 先尝试按逗号分割
                if (attraction.photos.includes(',')) {
                    photos = attraction.photos.split(',').map(url => url.trim()).filter(url => url);
                } else {
                    // 尝试JSON解析
                    try {
                        photos = JSON.parse(attraction.photos);
                    } catch {
                        // 如果不是JSON，就当作单个URL
                        photos = [attraction.photos];
                    }
                }
            } else if (Array.isArray(attraction.photos)) {
                photos = attraction.photos;
            }

            if (photos.length > 0) {
                images = photos.map((url, i) => ({
                    url: url,
                    alt: `${attraction.name} - 图片 ${i + 1}`
                }));
            }
        } catch (e) {
            console.error('解析图片数据失败:', e);
        }
    }

    // 如果photos字段没有数据，尝试使用image_url或image字段
    if (images.length === 0 && (attraction.image_url || attraction.image)) {
        const imageUrl = attraction.image_url || attraction.image;
        images.push({
            url: imageUrl,
            alt: `${attraction.name} - 图片 1`
        });
    }

    // 如果没有真实图片，使用占位图
    if (images.length === 0) {
        const colors = ['#e76f51', '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#e63946', '#457b9d', '#a8dadc', '#f1faee', '#1d3557', '#ffb703', '#fb8500'];
        for (let i = 0; i < 12; i++) {
            const color = colors[i % colors.length];
            images.push({
                url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect fill='${encodeURIComponent(color)}' width='800' height='500'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(attraction.name || '景点图片')}%3C/text%3E%3C/svg%3E`,
                alt: `${attraction.name} - 图片 ${i + 1}`
            });
        }
    }

    // 设置主图
    mainImage.src = images[0].url;
    mainImage.alt = images[0].alt;

    // 更新图片计数器
    if (imageCounter) {
        imageCounter.textContent = `1 / ${images.length}`;
    }

    // 渲染缩略图
    const visibleThumbnails = 4;
    const remainingCount = images.length - visibleThumbnails;

    thumbnailGrid.innerHTML = images.slice(0, visibleThumbnails).map((img, index) =>
        `<div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}" style="background-image: url('${img.url}'); background-size: cover; background-position: center;"></div>`
    ).join('');

    if (remainingCount > 0) {
        thumbnailGrid.innerHTML += `<div class="thumbnail more">+${remainingCount}</div>`;
    }

    // 更新轮播功能使用的全局变量
    window.galleryImages = images;
    window.currentImageIndex = 0;
    window.totalImages = images.length;

    // 重新绑定缩略图点击事件
    const thumbnails = thumbnailGrid.querySelectorAll('.thumbnail:not(.more)');
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            window.currentImageIndex = index;
            updateGalleryDisplay();
        });
    });
}

// 更新图片轮播显示
function updateGalleryDisplay() {
    const mainImage = document.getElementById('main-gallery-image');
    const imageCounter = document.querySelector('.image-counter');
    const thumbnails = document.querySelectorAll('.thumbnail:not(.more)');

    if (window.galleryImages && mainImage) {
        mainImage.src = window.galleryImages[window.currentImageIndex].url;
        mainImage.alt = window.galleryImages[window.currentImageIndex].alt;
    }

    if (imageCounter && window.totalImages) {
        imageCounter.textContent = `${window.currentImageIndex + 1} / ${window.totalImages}`;
    }

    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === window.currentImageIndex);
    });
}

// 渲染评论列表
function renderReviews(reviews) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;

    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 0;">暂无评论</p>';
        return;
    }

    reviewsList.innerHTML = reviews.map(review => {
        const avatarColors = ['#4a90e2', '#e76f51', '#2a9d8f', '#e9c46a', '#f4a261'];
        const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-avatar">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${avatarColor}'/%3E%3C/svg%3E" alt="avatar">
                    </div>
                    <div class="reviewer-info">
                        <h4 class="reviewer-name">${review.username || review.user_name || '匿名用户'}</h4>
                        <p class="reviewer-location">${review.location || '未知'}</p>
                        <p class="reviewer-contributions">贡献了 ${review.contribution_count || 0} 条点评</p>
                    </div>
                </div>
                <div class="review-rating">
                    <div class="rating-bubbles-small">
                        ${generateRatingBubbles(parseFloat(review.rating) || 5)}
                    </div>
                    <span class="review-date">${formatDate(review.created_at)}</span>
                </div>
                <h3 class="review-title">${review.title || '很棒的体验'}</h3>
                <p class="review-text">${review.content || review.comment || ''}</p>
                <div class="review-footer">
                    <button class="helpful-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        有用 (${review.helpful_count || 0})
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // 重新绑定有用按钮事件
    bindHelpfulButtons();
}

// 渲染评分分布
function renderRatingBreakdown(reviews) {
    const breakdownContainer = document.getElementById('rating-breakdown');
    if (!breakdownContainer || !reviews || reviews.length === 0) {
        return;
    }

    // 统计各评分等级的数量
    const ratingCounts = {
        5: 0,  // 优秀 (4.5-5.0)
        4: 0,  // 非常好 (3.5-4.4)
        3: 0,  // 一般 (2.5-3.4)
        2: 0,  // 较差 (1.5-2.4)
        1: 0   // 很糟 (0-1.4)
    };

    reviews.forEach(review => {
        const rating = parseFloat(review.rating) || 0;
        if (rating >= 4.5) {
            ratingCounts[5]++;
        } else if (rating >= 3.5) {
            ratingCounts[4]++;
        } else if (rating >= 2.5) {
            ratingCounts[3]++;
        } else if (rating >= 1.5) {
            ratingCounts[2]++;
        } else {
            ratingCounts[1]++;
        }
    });

    const totalReviews = reviews.length;
    const labels = ['优秀', '非常好', '一般', '较差', '很糟'];
    const levels = [5, 4, 3, 2, 1];

    breakdownContainer.innerHTML = levels.map((level, index) => {
        const count = ratingCounts[level];
        const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

        return `
            <div class="rating-bar">
                <span class="rating-label">${labels[index]}</span>
                <div class="bar"><div class="bar-fill" style="width: ${percentage}%"></div></div>
                <span class="rating-percent">${percentage}%</span>
            </div>
        `;
    }).join('');
}

// 加载相关推荐
async function loadRelatedAttractions(location) {
    try {
        const response = await fetch(`http://localhost:3000/api/attractions?limit=4`);

        if (!response.ok) {
            throw new Error('加载失败');
        }

        const result = await response.json();

        if (result.success && result.data) {
            renderRelatedAttractions(result.data);
        }
    } catch (error) {
        console.error('加载相关推荐失败:', error);
    }
}

// 渲染相关推荐
function renderRelatedAttractions(attractions) {
    const relatedGrid = document.getElementById('related-grid');
    if (!relatedGrid) return;

    if (!attractions || attractions.length === 0) {
        relatedGrid.innerHTML = '<p style="text-align: center; color: #999;">暂无推荐</p>';
        return;
    }

    const colors = ['#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#e76f51'];

    relatedGrid.innerHTML = attractions.slice(0, 4).map((attr, index) => `
        <div class="related-card" onclick="window.location.href='attraction-detail.html?id=${attr.id}'">
            <div class="related-image" style="background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), ${colors[index % colors.length]};"></div>
            <div class="related-content">
                <h3>${attr.name}</h3>
                <div class="rating-line">
                    <div class="rating-bubbles-small">
                        ${generateRatingBubbles(parseFloat(attr.rating) || 5)}
                    </div>
                    <span class="review-text">(${attr.review_count || 0})</span>
                </div>
                <p class="related-price">起价 $${parseFloat(attr.price || 0).toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '未知日期';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return `${year}年${month}月`;
}

// 显示错误消息
function showErrorMessage(message) {
    const mainContent = document.querySelector('.detail-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" style="margin: 0 auto 20px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2 style="color: #333; margin-bottom: 10px;">加载失败</h2>
                <p style="color: #666;">${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; background: #00aa6c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
    }
}

// 绑定有用按钮事件
function bindHelpfulButtons() {
    const helpfulBtns = document.querySelectorAll('.helpful-btn');
    helpfulBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const countText = this.textContent.match(/\d+/);
            if (countText) {
                const currentCount = parseInt(countText[0]);
                const newCount = currentCount + 1;
                this.innerHTML = this.innerHTML.replace(/\d+/, newCount);
            }

            this.style.background = '#e8f5e9';
            this.style.borderColor = '#00aa6c';
            this.style.color = '#00aa6c';
            this.disabled = true;
        });
    });
}

// ========== 原有功能 ==========

// 图片轮播功能
const prevBtn = document.querySelector('.gallery-nav.prev');
const nextBtn = document.querySelector('.gallery-nav.next');

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (window.totalImages) {
            window.currentImageIndex = (window.currentImageIndex - 1 + window.totalImages) % window.totalImages;
            updateGalleryDisplay();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (window.totalImages) {
            window.currentImageIndex = (window.currentImageIndex + 1) % window.totalImages;
            updateGalleryDisplay();
        }
    });
}

// 收藏按钮
const favoriteBtn = document.querySelector('.favorite-btn-detail');
if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
        const svg = favoriteBtn.querySelector('svg');
        const isFavorited = svg.getAttribute('fill') === 'currentColor';

        if (isFavorited) {
            svg.setAttribute('fill', 'none');
            favoriteBtn.textContent = '保存';
            favoriteBtn.prepend(svg);
        } else {
            svg.setAttribute('fill', 'currentColor');
            svg.style.fill = '#ff385c';
            favoriteBtn.textContent = '已保存';
            favoriteBtn.prepend(svg);
        }
    });
}

// 阅读更多功能
const readMoreBtn = document.querySelector('.read-more');
const aboutText = document.querySelector('.about-text');

if (readMoreBtn && aboutText) {
    let isExpanded = false;
    const originalText = aboutText.textContent;
    const shortText = originalText.substring(0, 200) + '...';

    aboutText.textContent = shortText;

    readMoreBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        aboutText.textContent = isExpanded ? originalText : shortText;
        readMoreBtn.textContent = isExpanded ? '收起' : '阅读更多';
    });
}

// 旅行者数量选择器
const minusBtn = document.querySelector('.qty-btn.minus');
const plusBtn = document.querySelector('.qty-btn.plus');
const qtyInput = document.querySelector('.qty-input');

if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        qtyInput.value = currentValue + 1;
    });
}

// 预订按钮
const bookNowBtn = document.querySelector('.book-now-btn');
if (bookNowBtn) {
    bookNowBtn.addEventListener('click', async () => {
        const date = document.getElementById('booking-date').value;
        const travelers = document.getElementById('travelers-count').value;

        if (!date) {
            alert('请选择日期');
            return;
        }

        const attractionId = getAttractionIdFromUrl();

        const bookingData = {
            attractionId: attractionId,
            attractionName: attractionData.name,
            date: date,
            travelers: parseInt(travelers),
            price: parseFloat(document.getElementById('attraction-price').textContent)
        };

        try {
            const response = await fetch('http://localhost:3000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                alert('预订成功！');
            } else {
                alert('预订失败，请稍后重试');
            }
        } catch (error) {
            console.error('预订错误:', error);
            alert('预订失败，请稍后重试');
        }
    });
}

// 有用按钮 - 将在renderReviews后动态绑定
// 不需要在这里绑定

// 加载更多评论
const loadMoreBtn = document.querySelector('.load-more-reviews');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
        try {
            const attractionId = getAttractionIdFromUrl();
            const response = await fetch(`http://localhost:3000/api/reviews?attractionId=${attractionId}&offset=2`);
            const reviews = await response.json();

            console.log('加载更多评论:', reviews);
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    });
}

// 相关推荐卡片点击 - 已在renderRelatedAttractions中处理
// 不需要额外的事件监听器

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 侧边栏固定效果优化
window.addEventListener('scroll', () => {
    const bookingCard = document.querySelector('.booking-card.sticky');
    const footer = document.querySelector('.footer');

    if (bookingCard && footer) {
        const footerTop = footer.getBoundingClientRect().top;
        const cardHeight = bookingCard.offsetHeight;

        if (footerTop < cardHeight + 40) {
            bookingCard.style.position = 'absolute';
            bookingCard.style.bottom = '0';
        } else {
            bookingCard.style.position = 'sticky';
            bookingCard.style.bottom = 'auto';
        }
    }
});

// 设置默认日期为明天
const dateInput = document.getElementById('booking-date');
if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    dateInput.value = dateString;
    dateInput.min = dateString;
}

// 图片懒加载
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
        }
    });
});

images.forEach(img => imageObserver.observe(img));

// ========== 地图功能 ==========

// 初始化地图
async function initAttractionMap() {
    try {
        await mapUtil.initMap('attraction-map', {
            center: attractionData.location,
            zoom: 15
        });

        const marker = mapUtil.addMarker(attractionData.location, {
            title: attractionData.name
        });

        mapUtil.addInfoWindow(marker, `
            <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${attractionData.name}</h3>
                <p style="margin: 0; color: #666; font-size: 13px;">${attractionData.address}</p>
            </div>
        `);

        console.log('地图初始化成功');
    } catch (error) {
        console.error('地图初始化失败:', error);
        const mapContainer = document.getElementById('attraction-map');
        if (mapContainer) {
            mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">地图加载失败，请刷新重试</div>';
        }
    }
}

// 显示附近景点
async function showNearbyAttractions() {
    try {
        const btn = document.getElementById('show-nearby-btn');
        btn.disabled = true;
        btn.textContent = '加载中...';

        const mainMarker = mapUtil.markers[0];
        mapUtil.clearMarkers();
        if (mainMarker) {
            mapUtil.markers.push(mainMarker);
            mainMarker.setMap(mapUtil.map);
        }

        const places = await mapUtil.searchNearby(
            attractionData.location,
            '景点',
            {
                radius: 2000,
                pageSize: 10,
                type: '风景名胜'
            }
        );

        if (!places || places.length === 0) {
            throw new Error('未找到附近景点');
        }

        places.forEach(place => {
            const marker = mapUtil.addMarker(
                [place.location.lng, place.location.lat],
                {
                    title: place.name
                }
            );

            const distance = mapUtil.calculateDistance(
                attractionData.location,
                [place.location.lng, place.location.lat]
            );

            mapUtil.addInfoWindow(marker, `
                <div style="padding: 10px; min-width: 180px;">
                    <h4 style="margin: 0 0 5px 0; font-size: 14px;">${place.name}</h4>
                    <p style="margin: 0; color: #666; font-size: 12px;">${place.address || '暂无地址'}</p>
                    <p style="margin: 5px 0 0 0; color: #00aa6c; font-size: 12px; font-weight: 500;">
                        距离: ${mapUtil.formatDistance(distance)}
                    </p>
                </div>
            `);
        });

        mapUtil.fitView();

        btn.disabled = false;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            附近景点 (${places.length})
        `;

        console.log(`找到 ${places.length} 个附近景点`);
    } catch (error) {
        console.error('显示附近景点失败:', error);
        const btn = document.getElementById('show-nearby-btn');
        btn.disabled = false;
        btn.textContent = '附近景点';

        // 提示用户高德地图主要支持中国境内
        alert('⚠️ 附近景点搜索失败\n\n原因：高德地图的搜索服务主要支持中国境内的地点。\n\n建议：\n1. 如需展示国外景点，建议使用 Google Maps API\n2. 或者将示例改为中国境内的景点（如：故宫、长城等）');
    }
}

// 路线规划
async function planRoute() {
    try {
        if (!navigator.geolocation) {
            alert('您的浏览器不支持定位功能');
            return;
        }

        const btn = document.getElementById('plan-route-btn');
        btn.disabled = true;
        btn.textContent = '定位中...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLocation = [position.coords.longitude, position.coords.latitude];

                try {
                    const result = await mapUtil.planRoute(userLocation, attractionData.location);

                    if (result.routes && result.routes.length > 0) {
                        const route = result.routes[0];
                        const distance = mapUtil.formatDistance(route.distance);
                        const duration = Math.round(route.time / 60);

                        alert(`路线规划成功！\n距离: ${distance}\n预计时间: ${duration}分钟`);
                    }

                    btn.disabled = false;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        路线规划
                    `;
                } catch (error) {
                    console.error('路线规划失败:', error);
                    btn.disabled = false;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        路线规划
                    `;
                    alert('⚠️ 路线规划失败\n\n原因：高德地图的路线规划服务主要支持中国境内的路线。\n\n建议：\n1. 如需规划国外路线，建议使用 Google Maps API\n2. 或者将示例改为中国境内的景点');
                }
            },
            (error) => {
                console.error('定位失败:', error);
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    路线规划
                `;
                alert('无法获取您的位置，请检查定位权限');
            }
        );
    } catch (error) {
        console.error('路线规划错误:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 获取景点ID
    const attractionId = getAttractionIdFromUrl();

    if (!attractionId) {
        showErrorMessage('缺少景点ID参数');
        return;
    }

    // 加载景点详情
    try {
        await loadAttractionDetail(attractionId);
    } catch (error) {
        console.error('初始化失败:', error);
    }

    // 附近景点按钮
    const nearbyBtn = document.getElementById('show-nearby-btn');
    if (nearbyBtn) {
        nearbyBtn.addEventListener('click', showNearbyAttractions);
    }

    // 路线规划按钮
    const routeBtn = document.getElementById('plan-route-btn');
    if (routeBtn) {
        routeBtn.addEventListener('click', planRoute);
    }
});

console.log('景点详情页加载完成');
