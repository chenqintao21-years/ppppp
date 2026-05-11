// ==================== API 配置 ====================
const API_BASE_URL = 'http://localhost:3000/api'; // 后端 API 基础 URL

// API 端点
const API_ENDPOINTS = {
    searchRestaurants: `${API_BASE_URL}/restaurants/search`,
    getRestaurantDetails: (id) => `${API_BASE_URL}/restaurants/${id}`,
    getFilters: `${API_BASE_URL}/restaurants/filters`,
    addFavorite: `${API_BASE_URL}/favorites/add`,
    removeFavorite: `${API_BASE_URL}/favorites/remove`,
    searchDestinations: `${API_BASE_URL}/destinations/search`,
    getPopularDestinations: `${API_BASE_URL}/destinations/popular`,
    getDestinationAttractions: (id) => `${API_BASE_URL}/destinations/${id}/attractions`,
    getDestinationHotels: (id) => `${API_BASE_URL}/destinations/${id}/hotels`,
    getDestinationRestaurants: (id) => `${API_BASE_URL}/destinations/${id}/restaurants`
};

// ==================== 全局变量 ====================
let currentPage = 1;
let currentCategory = 'restaurants'; // 当前显示的分类
let currentFilters = {
    location: '',
    price: [],
    cuisine: [],
    feature: [],
    meal: [],
    sort: 'recommended'
};
let destinationIdCache = {}; // 缓存城市ID，避免重复查询

// ==================== 城市ID查询和缓存功能 ====================
/**
 * 根据城市名称获取城市ID
 * @param {string} cityName - 城市名称
 * @returns {Promise<number|null>} 城市ID或null
 */
async function getDestinationIdByName(cityName) {
    if (!cityName || cityName.trim() === '') {
        return null;
    }

    // 检查缓存
    if (destinationIdCache[cityName]) {
        console.log(`从缓存获取城市ID: ${cityName} -> ${destinationIdCache[cityName]}`);
        return destinationIdCache[cityName];
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.searchDestinations}?q=${encodeURIComponent(cityName)}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const destinationId = result.data[0].id;
            // 缓存结果
            destinationIdCache[cityName] = destinationId;
            console.log(`查询到城市ID: ${cityName} -> ${destinationId}`);
            return destinationId;
        }

        console.warn(`未找到城市: ${cityName}`);
        return null;
    } catch (error) {
        console.error('查询城市ID失败:', error);
        return null;
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadInitialData(); // 根据当前分类加载数据
    setupHeaderScroll();
});

function initializePage() {
    // 从 URL 参数获取搜索关键词和分类
    const urlParams = new URLSearchParams(window.location.search);
    const location = urlParams.get('location');
    const category = urlParams.get('category'); // 新增：从URL获取分类

    if (location) {
        currentFilters.location = location;
        document.getElementById('searchInput').value = location;
        updatePageTitle(location);
    } else {
        // 没有搜索关键词，不设置默认值
        currentFilters.location = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchInput').placeholder = '搜索城市或地点';
    }

    // 如果URL中指定了分类，更新当前分类
    if (category && ['all', 'attractions', 'hotels', 'destinations', 'restaurants'].includes(category)) {
        currentCategory = category;
        // 更新单选按钮状态
        const radioBtn = document.querySelector(`input[name="category"][value="${category}"]`);
        if (radioBtn) {
            radioBtn.checked = true;
            document.querySelectorAll('.filter-category-item').forEach(item => {
                item.classList.remove('active');
            });
            radioBtn.closest('.filter-category-item').classList.add('active');
        }
    }
}

// 根据当前分类加载初始数据
function loadInitialData() {
    // 只有在有搜索关键词时才加载数据
    if (!currentFilters.location) {
        const container = document.getElementById('restaurantContainer');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;"><h3>请输入城市或地点进行搜索</h3></div>';
        }
        return;
    }

    switch(currentCategory) {
        case 'attractions':
            loadAttractions();
            break;
        case 'hotels':
            loadHotels();
            break;
        case 'destinations':
            loadDestinations();
            break;
        case 'restaurants':
        case 'all':
        default:
            loadRestaurants();
            break;
    }
}

// 更新页面标题
function updatePageTitle(location) {
    const pageTitle = document.getElementById('pageTitle');
    const htmlTitle = document.querySelector('title');

    // 根据当前分类设置标题
    let titleText = '';
    switch(currentCategory) {
        case 'attractions':
            titleText = `符合"${location}"的景点玩乐`;
            break;
        case 'hotels':
            titleText = `符合"${location}"的酒店`;
            break;
        case 'destinations':
            titleText = `符合"${location}"的目的地`;
            break;
        case 'restaurants':
            titleText = `符合"${location}"的餐厅`;
            break;
        case 'all':
        default:
            titleText = `符合"${location}"的搜索结果`;
            break;
    }

    if (pageTitle) {
        pageTitle.textContent = titleText;
    }
    if (htmlTitle) {
        htmlTitle.textContent = `${location} - TripAdvisor`;
    }
}

// ==================== 导航栏滚动效果 ====================
function setupHeaderScroll() {
    const headerScrolled = document.getElementById('headerScrolled');

    if (!headerScrolled) return;

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            headerScrolled.classList.add('visible');
        } else {
            headerScrolled.classList.remove('visible');
        }
    });
}

function setupEventListeners() {
    // 搜索按钮
    document.querySelector('.search-btn').addEventListener('click', handleSearch);

    // 主搜索输入框回车
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 导航栏搜索框回车
    const compactSearchInput = document.querySelector('.search-input-compact');
    if (compactSearchInput) {
        compactSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchValue = compactSearchInput.value.trim();
                if (searchValue) {
                    // 同步到主搜索框
                    document.getElementById('searchInput').value = searchValue;
                    currentFilters.location = searchValue;
                    currentPage = 1;
                    // 重新加载当前分类的数据
                    reloadCurrentCategory();
                }
            }
        });
    }

    // 快速筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // 可以添加筛选逻辑
        });
    });

    // 分类筛选（单选）
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // 更新视觉状态
            document.querySelectorAll('.filter-category-item').forEach(item => {
                item.classList.remove('active');
            });
            this.closest('.filter-category-item').classList.add('active');

            // 处理分类切换
            handleCategoryChange(this.value);
        });
    });

    // 排序选择
    document.getElementById('sortSelect').addEventListener('change', function() {
        currentFilters.sort = this.value;
        currentPage = 1;
        // 根据当前分类调用对应的加载函数
        reloadCurrentCategory();
    });

    // 价格筛选
    document.querySelectorAll('input[name="price"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 菜系筛选
    document.querySelectorAll('input[name="cuisine"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 特色筛选
    document.querySelectorAll('input[name="feature"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 用餐时段筛选
    document.querySelectorAll('input[name="meal"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // 清除筛选
    document.querySelector('.clear-filters-btn').addEventListener('click', clearFilters);

    // 加载更多
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreRestaurants);
}

// ==================== 分类切换功能 ====================
function handleCategoryChange(category) {
    console.log('切换分类:', category);

    currentCategory = category;
    currentPage = 1;

    // 更新页面标题
    const pageTitle = document.getElementById('pageTitle');
    const location = currentFilters.location || '全部';

    switch(category) {
        case 'all':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的搜索结果`;
            loadRestaurants(); // 默认显示餐厅
            break;
        case 'attractions':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的景点玩乐`;
            loadAttractions();
            break;
        case 'hotels':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的酒店`;
            loadHotels();
            break;
        case 'destinations':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的目的地`;
            loadDestinations();
            break;
        case 'restaurants':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的餐厅`;
            loadRestaurants();
            break;
    }
}

// ==================== 加载景点数据 ====================
async function loadAttractions() {
    const container = document.getElementById('restaurantContainer');

    // 检查是否有搜索关键词
    if (!currentFilters.location || currentFilters.location.trim() === '') {
        container.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;"><h3>请输入城市或地点进行搜索</h3></div>';
        return;
    }

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 20px; color: #666;">加载中...</p></div>';

    try {
        const cityName = currentFilters.location;

        // 获取城市ID
        const destinationId = await getDestinationIdByName(cityName);

        if (!destinationId) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到"${cityName}"相关的景点数据</div>`;
            return;
        }

        // 映射排序值
        const sortMap = {
            'recommended': 'rating',
            'rating': 'rating',
            'reviews': 'review_count',
            'price-low': 'price',
            'price-high': 'price'
        };
        const sort = sortMap[currentFilters.sort] || 'rating';

        // 调用后端API获取景点数据
        const response = await fetch(`${API_ENDPOINTS.getDestinationAttractions(destinationId)}?page=${currentPage}&limit=20&sort=${sort}`);
        const result = await response.json();

        console.log('景点API响应:', result);

        if (result.success && result.data && Array.isArray(result.data)) {
            displayAttractions(result.data);

            // 更新加载更多按钮
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                const hasMore = result.pagination && result.pagination.page < result.pagination.totalPages;
                loadMoreBtn.style.display = hasMore ? 'block' : 'none';
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到"${cityName}"的景点数据</div>`;
        }

    } catch (error) {
        console.error('加载景点数据失败:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载失败，请稍后重试</div>';
    }
}

// ==================== 显示景点列表 ====================
function displayAttractions(attractions) {
    const container = document.getElementById('restaurantContainer');

    if (attractions.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到符合条件的景点</div>';
        return;
    }

    container.innerHTML = '';

    attractions.forEach((attraction, index) => {
        const card = createAttractionCard(attraction);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createAttractionCard(attraction) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => viewAttractionDetails(attraction.id);

    const ratingCircles = generateRatingCircles(attraction.rating || 0);
    const reviewCount = attraction.review_count || 0;

    // 处理标签 - 从后端数据构建
    let tags = [];
    if (attraction.category) tags.push(attraction.category);
    if (attraction.location_city) tags.push(attraction.location_city);
    if (attraction.duration) tags.push(attraction.duration);

    const tagsHtml = tags
        .slice(0, 5)
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    // 处理图片
    const imageUrl = attraction.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cccccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23666' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(attraction.name)}%3C/text%3E%3C/svg%3E`;

    // 处理价格
    let priceText = '查看详情';
    if (attraction.price) {
        priceText = `起价 ${attraction.currency || 'CNY'} ${attraction.price}`;
    }

    card.innerHTML = `
        <img src="${imageUrl}" alt="${attraction.name}" class="restaurant-image" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23cccccc\\' width=\\'400\\' height=\\'300\\'/%3E%3C/svg%3E'">
        <div class="restaurant-info">
            <div class="restaurant-header">
                <div>
                    <h3 class="restaurant-name">${attraction.name}</h3>
                </div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${attraction.id}, this)">
                    ♡
                </button>
            </div>

            <div class="restaurant-rating">
                <div class="rating-circles">${ratingCircles}</div>
                <span class="rating-score">${attraction.rating || 0}</span>
                <span class="review-count">${reviewCount.toLocaleString()} 条点评</span>
            </div>

            <div class="restaurant-tags">
                ${tagsHtml}
            </div>

            <p class="restaurant-description">
                ${attraction.description || ''}
            </p>

            <div class="restaurant-footer">
                <span class="price-range">${priceText}</span>
                <button class="view-details-btn" onclick="event.stopPropagation(); viewAttractionDetails(${attraction.id})">
                    查看详情
                </button>
            </div>
        </div>
    `;

    return card;
}

function viewAttractionDetails(attractionId) {
    window.location.href = `attraction-detail.html?id=${attractionId}`;
}

// ==================== 加载酒店数据 ====================
async function loadHotels() {
    const container = document.getElementById('restaurantContainer');

    // 检查是否有搜索关键词
    if (!currentFilters.location || currentFilters.location.trim() === '') {
        container.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;"><h3>请输入城市或地点进行搜索</h3></div>';
        return;
    }

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 20px; color: #666;">加载中...</p></div>';

    try {
        const cityName = currentFilters.location;

        // 获取城市ID
        const destinationId = await getDestinationIdByName(cityName);

        if (!destinationId) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到"${cityName}"相关的酒店数据</div>`;
            return;
        }

        // 映射排序值
        const sortMap = {
            'recommended': 'rating',
            'rating': 'rating',
            'reviews': 'review_count',
            'price-low': 'rating',
            'price-high': 'rating'
        };
        const sort = sortMap[currentFilters.sort] || 'rating';

        // 调用后端API获取酒店数据
        const response = await fetch(`${API_ENDPOINTS.getDestinationHotels(destinationId)}?page=${currentPage}&limit=20&sort=${sort}`);
        const result = await response.json();

        console.log('酒店API响应:', result);

        if (result.success && result.data && Array.isArray(result.data)) {
            displayHotels(result.data);

            // 更新加载更多按钮
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                const hasMore = result.pagination && result.pagination.page < result.pagination.totalPages;
                loadMoreBtn.style.display = hasMore ? 'block' : 'none';
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到"${cityName}"的酒店数据</div>`;
        }

    } catch (error) {
        console.error('加载酒店数据失败:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载失败，请稍后重试</div>';
    }
}

// ==================== 显示酒店列表 ====================
function displayHotels(hotels) {
    const container = document.getElementById('restaurantContainer');

    if (hotels.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到符合条件的酒店</div>';
        return;
    }

    container.innerHTML = '';

    hotels.forEach((hotel, index) => {
        const card = createHotelCard(hotel);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createHotelCard(hotel) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => viewHotelDetails(hotel.id);

    const ratingCircles = generateRatingCircles(hotel.rating || 0);
    const reviewCount = hotel.review_count || 0;

    // 处理标签 - 从后端数据构建
    let tags = [];
    if (hotel.star_rating) tags.push(`${hotel.star_rating}星级`);
    if (hotel.location) tags.push(hotel.location);
    if (hotel.amenities) {
        // amenities 可能是字符串或数组
        const amenitiesList = typeof hotel.amenities === 'string'
            ? hotel.amenities.split(',').map(a => a.trim())
            : hotel.amenities;
        tags = tags.concat(amenitiesList.slice(0, 3));
    }

    const tagsHtml = tags
        .slice(0, 5)
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    // 处理图片
    const imageUrl = hotel.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cccccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23666' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(hotel.name)}%3C/text%3E%3C/svg%3E`;

    // 处理价格
    let priceText = '查看详情';
    if (hotel.price_per_night) {
        priceText = `¥${hotel.price_per_night}/晚起`;
    }

    card.innerHTML = `
        <img src="${imageUrl}" alt="${hotel.name}" class="restaurant-image" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23cccccc\\' width=\\'400\\' height=\\'300\\'/%3E%3C/svg%3E'">
        <div class="restaurant-info">
            <div class="restaurant-header">
                <div>
                    <h3 class="restaurant-name">${hotel.name}</h3>
                </div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${hotel.id}, this)">
                    ♡
                </button>
            </div>

            <div class="restaurant-rating">
                <div class="rating-circles">${ratingCircles}</div>
                <span class="rating-score">${hotel.rating || 0}</span>
                <span class="review-count">${reviewCount.toLocaleString()} 条点评</span>
            </div>

            <div class="restaurant-tags">
                ${tagsHtml}
            </div>

            <p class="restaurant-description">
                ${hotel.description || hotel.location || ''}
            </p>

            <div class="restaurant-footer">
                <span class="price-range">${priceText}</span>
                <button class="view-details-btn" onclick="event.stopPropagation(); viewHotelDetails(${hotel.id})">
                    查看详情
                </button>
            </div>
        </div>
    `;

    return card;
}

function viewHotelDetails(hotelId) {
    // 传递当前搜索的城市信息到详情页
    const city = currentFilters.location;
    window.location.href = `hotel-detail.html?id=${hotelId}&city=${encodeURIComponent(city)}`;
}

// ==================== 加载目的地数据 ====================
async function loadDestinations() {
    const container = document.getElementById('restaurantContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 20px; color: #666;">加载中...</p></div>';

    try {
        const searchKeyword = currentFilters.location || '';

        // 调用后端API获取热门目的地数据
        let url = `${API_ENDPOINTS.getPopularDestinations}?limit=20`;

        // 如果有搜索关键词，则搜索匹配的目的地
        if (searchKeyword) {
            url = `${API_ENDPOINTS.searchDestinations}?q=${encodeURIComponent(searchKeyword)}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        console.log('目的地API响应:', result);
        console.log('目的地数据详情:', result.data);

        // 打印每个目的地的ID和名称
        if (result.data && Array.isArray(result.data)) {
            result.data.forEach((dest, index) => {
                console.log(`目的地 ${index + 1}:`, {
                    id: dest.id,
                    name: dest.name,
                    name_en: dest.name_en
                });
            });
        }

        if (result.success && result.data && Array.isArray(result.data)) {
            if (result.data.length === 0) {
                container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到"${searchKeyword}"相关的目的地</div>`;
                return;
            }

            displayDestinations(result.data);

            // 更新加载更多按钮（目的地通常不需要分页）
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #999;">未找到目的地数据</div>`;
        }

    } catch (error) {
        console.error('加载目的地数据失败:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载失败，请稍后重试</div>';
    }
}

// ==================== 显示目的地列表 ====================
function displayDestinations(destinations) {
    const container = document.getElementById('restaurantContainer');

    if (destinations.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到符合条件的目的地</div>';
        return;
    }

    container.innerHTML = '';

    destinations.forEach((destination, index) => {
        const card = createDestinationCard(destination);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createDestinationCard(destination) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => viewDestinationDetails(destination.id);

    // 添加调试日志
    console.log('创建目的地卡片:', {
        id: destination.id,
        name: destination.name,
        name_en: destination.name_en
    });

    const ratingCircles = generateRatingCircles(destination.rating || 0);
    const viewCount = destination.view_count || 0;

    // 处理标签
    let tags = [];
    if (destination.country) tags.push(destination.country);
    if (destination.region) tags.push(destination.region);
    if (destination.attraction_count) tags.push(`${destination.attraction_count}个景点`);

    const tagsHtml = tags
        .slice(0, 5)
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    // 处理图片
    const imageUrl = destination.cover_image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cccccc' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='%23666' text-anchor='middle' dy='.3em'%3E${encodeURIComponent(destination.name)}%3C/text%3E%3C/svg%3E`;

    card.innerHTML = `
        <img src="${imageUrl}" alt="${destination.name}" class="restaurant-image" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect fill=\\'%23cccccc\\' width=\\'400\\' height=\\'300\\'/%3E%3C/svg%3E'">
        <div class="restaurant-info">
            <div class="restaurant-header">
                <div>
                    <h3 class="restaurant-name">${destination.name}</h3>
                    ${destination.name_en ? `<p style="font-size: 12px; color: #999; margin-top: 2px;">${destination.name_en}</p>` : ''}
                </div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${destination.id}, this)">
                    ♡
                </button>
            </div>

            <div class="restaurant-rating">
                <div class="rating-circles">${ratingCircles}</div>
                <span class="rating-score">${destination.rating || 0}</span>
                <span class="review-count">${viewCount.toLocaleString()} 次浏览</span>
            </div>

            <div class="restaurant-tags">
                ${tagsHtml}
            </div>

            <p class="restaurant-description">
                ${destination.description || '探索这个美丽的目的地'}
            </p>

            <div class="restaurant-footer">
                <span class="price-range">热门目的地</span>
                <button class="view-details-btn" onclick="event.stopPropagation(); viewDestinationDetails(${destination.id})">
                    查看详情
                </button>
            </div>
        </div>
    `;

    return card;
}

function viewDestinationDetails(destinationId) {
    console.log('跳转到目的地详情页，ID:', destinationId);
    window.location.href = `destination.html?id=${destinationId}`;
}

// ==================== 搜索功能 ====================
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const location = searchInput.value.trim();

    if (!location) {
        alert('请输入搜索关键词');
        return;
    }

    currentFilters.location = location;
    currentPage = 1;
    updatePageTitle(location);
    reloadCurrentCategory();
}

// 根据当前分类重新加载数据
function reloadCurrentCategory() {
    const location = currentFilters.location || '全部';
    const pageTitle = document.getElementById('pageTitle');

    switch(currentCategory) {
        case 'attractions':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的景点玩乐`;
            loadAttractions();
            break;
        case 'hotels':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的酒店`;
            loadHotels();
            break;
        case 'destinations':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的目的地`;
            loadDestinations();
            break;
        case 'restaurants':
            if (pageTitle) pageTitle.textContent = `符合"${location}"的餐厅`;
            loadRestaurants();
            break;
        case 'all':
        default:
            if (pageTitle) pageTitle.textContent = `符合"${location}"的搜索结果`;
            loadRestaurants();
            break;
    }
}

// ==================== 筛选功能 ====================
function handleFilterChange() {
    // 收集所有选中的筛选条件
    currentFilters.price = Array.from(document.querySelectorAll('input[name="price"]:checked'))
        .map(cb => cb.value);

    currentFilters.cuisine = Array.from(document.querySelectorAll('input[name="cuisine"]:checked'))
        .map(cb => cb.value);

    currentFilters.feature = Array.from(document.querySelectorAll('input[name="feature"]:checked'))
        .map(cb => cb.value);

    currentFilters.meal = Array.from(document.querySelectorAll('input[name="meal"]:checked'))
        .map(cb => cb.value);

    currentPage = 1;
    loadRestaurants();
}

function clearFilters() {
    // 清除所有复选框
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // 重置筛选条件
    currentFilters.price = [];
    currentFilters.cuisine = [];
    currentFilters.feature = [];
    currentFilters.meal = [];

    currentPage = 1;
    loadRestaurants();
}

// ==================== 加载餐厅数据 ====================
async function loadRestaurants() {
    const container = document.getElementById('restaurantContainer');

    // 检查是否有搜索关键词
    if (!currentFilters.location || currentFilters.location.trim() === '') {
        container.innerHTML = '<div style="text-align: center; padding: 100px 20px; color: #999;"><h3>请输入城市或地点进行搜索</h3></div>';
        return;
    }

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 20px; color: #666;">加载中...</p></div>';

    try {
        // 调用后端API获取真实数据
        const params = new URLSearchParams({
            location: currentFilters.location,
            page: currentPage,
            limit: 20,
            sort: currentFilters.sort
        });

        // 添加筛选参数
        if (currentFilters.price && currentFilters.price.length > 0) {
            params.append('price', currentFilters.price.join(','));
        }
        if (currentFilters.cuisine && currentFilters.cuisine.length > 0) {
            params.append('cuisine', currentFilters.cuisine.join(','));
        }
        if (currentFilters.feature && currentFilters.feature.length > 0) {
            params.append('feature', currentFilters.feature.join(','));
        }
        if (currentFilters.meal && currentFilters.meal.length > 0) {
            params.append('meal', currentFilters.meal.join(','));
        }

        console.log('请求餐厅数据:', API_ENDPOINTS.searchRestaurants + '?' + params.toString());

        const response = await fetch(`${API_ENDPOINTS.searchRestaurants}?${params.toString()}`);
        const result = await response.json();

        console.log('餐厅API完整响应:', JSON.stringify(result, null, 2));
        console.log('result.data:', result.data);
        console.log('result.data.restaurants:', result.data?.restaurants);

        if (result.success && result.data) {
            const { restaurants, total, hasMore } = result.data;

            console.log('解析的餐厅数据:', {
                restaurants: restaurants,
                restaurantsType: typeof restaurants,
                isArray: Array.isArray(restaurants),
                length: restaurants?.length,
                total,
                hasMore
            });

            // 检查restaurants是否存在且为数组
            if (restaurants && Array.isArray(restaurants) && restaurants.length > 0) {
                displayRestaurants(restaurants);

                // 更新加载更多按钮
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
                }
            } else if (restaurants && Array.isArray(restaurants) && restaurants.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到相关餐厅</div>';
            } else {
                console.error('餐厅数据格式错误:', restaurants);
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">数据格式错误</div>';
            }
        } else {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到相关餐厅</div>';
        }

    } catch (error) {
        console.error('加载餐厅数据失败:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载失败，请稍后重试</div>';
    }
}

function loadMoreRestaurants() {
    currentPage++;
    // 平滑滚动到列表顶部
    document.querySelector('.restaurant-list').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    setTimeout(() => {
        loadRestaurants();
    }, 300);
}

// ==================== 显示餐厅列表 ====================
function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurantContainer');

    if (restaurants.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到符合条件的餐厅</div>';
        return;
    }

    container.innerHTML = '';

    restaurants.forEach((restaurant, index) => {
        const card = createRestaurantCard(restaurant);
        // 添加淡入动画
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);

        // 延迟显示每个卡片，创建瀑布流效果
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.onclick = () => viewRestaurantDetails(restaurant.id);

    // 兼容数据库字段（下划线）和模拟数据字段（驼峰）
    const rating = parseFloat(restaurant.rating) || 0;
    const reviewCount = restaurant.review_count || restaurant.reviewCount || 0;
    const priceRange = restaurant.price_range || restaurant.priceRange || '¥¥';

    // 生成评分圆圈
    const ratingCircles = generateRatingCircles(rating);

    // 生成标签 - 兼容数据库和模拟数据
    let tags = [];

    // 如果有 cuisine 数组（模拟数据）
    if (restaurant.cuisine && Array.isArray(restaurant.cuisine)) {
        tags = restaurant.cuisine.concat(restaurant.features || []);
    } else {
        // 数据库数据：从 address 或其他字段提取标签
        if (restaurant.address) {
            const cityMatch = restaurant.address.match(/^([^市区县]+)/);
            if (cityMatch) tags.push(cityMatch[1]);
        }
        if (priceRange) tags.push(priceRange);
        if (restaurant.phone) tags.push('可预订');
    }

    const tagsHtml = tags
        .slice(0, 5)
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    card.innerHTML = `
        ${restaurant.image
            ? `<img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-image" loading="lazy">`
            : `<div class="restaurant-image-placeholder">🍽️</div>`
        }
        <div class="restaurant-info">
            <div class="restaurant-header">
                <div>
                    <h3 class="restaurant-name">${restaurant.name}</h3>
                </div>
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${restaurant.id}, this)">
                    ♡
                </button>
            </div>

            <div class="restaurant-rating">
                <div class="rating-circles">${ratingCircles}</div>
                <span class="rating-score">${rating.toFixed(1)}</span>
                <span class="review-count">${reviewCount.toLocaleString()} 条点评</span>
            </div>

            <div class="restaurant-tags">
                ${tagsHtml}
            </div>

            <p class="restaurant-description">
                ${restaurant.description || restaurant.address || '暂无描述'}
            </p>

            <div class="restaurant-footer">
                <span class="price-range">${priceRange}</span>
                <button class="view-details-btn" onclick="event.stopPropagation(); viewRestaurantDetails(${restaurant.id})">
                    查看详情
                </button>
            </div>
        </div>
    `;

    return card;
}

function generateRatingCircles(rating) {
    const fullCircles = Math.floor(rating);
    const hasHalfCircle = rating % 1 >= 0.5;
    const emptyCircles = 5 - fullCircles - (hasHalfCircle ? 1 : 0);

    let html = '';

    // 满圆
    for (let i = 0; i < fullCircles; i++) {
        html += '<div class="rating-circle"></div>';
    }

    // 半圆（简化处理，显示为满圆）
    if (hasHalfCircle) {
        html += '<div class="rating-circle"></div>';
    }

    // 空圆
    for (let i = 0; i < emptyCircles; i++) {
        html += '<div class="rating-circle empty"></div>';
    }

    return html;
}

// ==================== 餐厅详情 ====================
function viewRestaurantDetails(restaurantId) {
    // 跳转到餐厅详情页
    window.location.href = `restaurant-detail.html?id=${restaurantId}`;
}

// ==================== 收藏功能 ====================
async function toggleFavorite(restaurantId, button) {
    try {
        // TODO: 调用后端 API
        // const response = await fetch(API_ENDPOINTS.addFavorite, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ restaurantId })
        // });

        // 切换收藏状态
        if (button.textContent === '♡') {
            button.textContent = '♥';
            button.style.color = '#ff5533';
            // 添加心跳动画
            button.style.animation = 'heartbeat 0.3s ease';
            setTimeout(() => {
                button.style.animation = '';
            }, 300);
        } else {
            button.textContent = '♡';
            button.style.color = '#999';
        }

        console.log('切换收藏状态:', restaurantId);

    } catch (error) {
        console.error('收藏操作失败:', error);
    }
}

// ==================== 工具函数 ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}